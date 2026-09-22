// TEMPORARY TEST WIRING — not a Phase 1-8 deliverable, not the final
// production provider decision. Calls the real fal-ai/flux-kontext/dev
// image-editing model through Hugging Face's Inference Providers router,
// using the exact request shape and URL-rewriting fix proven working in
// poc/huggingface/run-v2.mjs during manual POC testing:
//
//   POST https://router.huggingface.co/fal-ai/fal-ai/flux-kontext/dev?_subdomain=queue
//   Authorization: Bearer <HF_TOKEN>
//   { "prompt": "...", "image_url": "data:<mime>;base64,..." }
//
// fal's own status_url/response_url point at queue.fal.run directly, which
// rejects an HF bearer token — they're rewritten back through
// router.huggingface.co/fal-ai/<path>?_subdomain=queue before polling.
//
// Server-only: this module must never be imported by a client component,
// same rule as the mock provider (see mock-visualization-provider.ts).

import { GENERATION_TIMEOUT_MS, type GenerationErrorCode } from "@/lib/visualizer/generation"
import type { VisualizationProvider, VisualizationProviderRequest } from "@/lib/visualizer/providers/types"
import type { VisualizationProviderResponse } from "@/lib/visualizer/generation"
import type { VisualizerOptions } from "@/lib/visualizer/options"

// Leaves a 5s buffer under the outer server-side race (GENERATION_TIMEOUT_MS,
// set via NEXT_PUBLIC_VISUALIZER_GENERATION_TIMEOUT_MS) so this provider's own
// clean "did not finish within Nms" message wins over the outer race's generic
// timeout — same buffer pattern as CLIENT_TIMEOUT_MS in generation.ts.
const DEFAULT_POLL_DEADLINE_MS = Math.max(GENERATION_TIMEOUT_MS - 5000, 10000)

// Recorded on every generation row (lib/db/generations.ts) so admin history shows
// which model actually produced (or attempted to produce) each image.
export const HF_MODEL_ID = "fal-ai/flux-kontext/dev"

const SUBMIT_URL = "https://router.huggingface.co/fal-ai/fal-ai/flux-kontext/dev?_subdomain=queue"
const POLL_INTERVAL_MS = 3000

const WOOD_SPECIES_PROMPT: Record<string, string> = {
  oak: "natural white oak hardwood",
  maple: "light maple hardwood",
  hickory: "hickory hardwood with natural color variation",
  mixed_unsure: "natural-toned hardwood",
  existing_floor: "hardwood that matches the existing floor's species",
}

const STYLE_PROMPT: Record<string, string> = {
  light_natural: "a light, natural tone",
  warm_traditional: "a warm, traditional medium-brown tone",
  gray_weathered: "a gray, weathered tone",
  dark_modern: "a dark, modern tone",
}

const DIRECTION_PROMPT: Record<string, string> = {
  parallel: "laid parallel to the longest wall",
  perpendicular: "laid perpendicular to the longest wall",
  diagonal: "laid in a diagonal pattern",
  herringbone: "laid in a herringbone pattern",
  existing_direction: "following the same direction as the existing floor",
}

function buildPrompt(options: VisualizerOptions): string {
  const species = (options.woodSpecies && WOOD_SPECIES_PROMPT[options.woodSpecies]) || "natural hardwood"
  const styleFragment =
    options.preferredStyle === "custom" && options.customStyleDescription.trim().length > 0
      ? options.customStyleDescription.trim()
      : (options.preferredStyle && STYLE_PROMPT[options.preferredStyle]) || null
  const directionFragment = (options.floorDirection && DIRECTION_PROMPT[options.floorDirection]) || null

  return `Edit the uploaded room photo to create a photorealistic hardwood flooring visualization.

Replace ONLY the existing visible floor with realistic ${species}${styleFragment ? `, in ${styleFragment}` : ""}${directionFragment ? `, ${directionFragment}` : ""}.

Preserve the exact room architecture, furniture, rug, walls, windows, doors, fireplace, decorations, lighting, shadows, reflections, camera position, perspective, and composition.

Do not redesign or regenerate the room.

The new hardwood floor must follow the existing floor plane, perspective, vanishing points, boundaries, and geometry naturally.

Keep all non-floor objects unchanged.

The final image should look like a professionally photographed real room after the hardwood flooring installation.

Do not add objects.
Do not remove objects.
Do not change the furniture.
Do not change the walls.
Do not change the lighting.
Do not change the camera perspective.`
}

function toRouterUrl(falUrl: string): string {
  const u = new URL(falUrl)
  return `https://router.huggingface.co/fal-ai${u.pathname}?_subdomain=queue`
}

export class HuggingFaceVisualizationProvider implements VisualizationProvider {
  private readonly token: string | undefined
  private readonly pollDeadlineMs: number

  // The Phase 4 response contract (normalizeProviderResult, generation.ts)
  // deliberately replaces a provider's own error message with a fixed,
  // user-safe string before it ever reaches the browser — "the provider's
  // message is for server logs only" per that module's own comment. This
  // field is that server-log destination: the real diagnostic text (HTTP
  // status, provider error body, etc.), read by app/api/visualizer/route.ts
  // for the admin dashboard's warning banner, after generateVisualization has
  // already produced the safe, normalized response for the client.
  public lastErrorDetail: string | null = null

  // token: resolved by the caller (app/api/visualizer/route.ts) via
  // admin-store's getHfToken(), which prefers a dashboard-set value over
  // process.env.HF_TOKEN. Falls back to the env var directly if omitted, so
  // existing callers/tests that construct this without arguments still work.
  constructor(token?: string, pollDeadlineMs: number = DEFAULT_POLL_DEADLINE_MS) {
    this.token = token ?? process.env.HF_TOKEN
    this.pollDeadlineMs = pollDeadlineMs
  }

  private fail(requestId: string, code: GenerationErrorCode, detail: string): VisualizationProviderResponse {
    this.lastErrorDetail = detail
    console.error(`[HuggingFaceVisualizationProvider] ${requestId}: ${detail}`)
    return { requestId, status: "error", result: null, error: { code, message: detail } }
  }

  async generate(request: VisualizationProviderRequest): Promise<VisualizationProviderResponse> {
    const { requestId } = request
    this.lastErrorDetail = null

    if (!this.token) {
      return this.fail(requestId, "PROVIDER_ERROR", "HF_TOKEN is not configured.")
    }

    let imageBuffer: ArrayBuffer
    try {
      imageBuffer = await request.image.file.arrayBuffer()
    } catch {
      return this.fail(requestId, "PROVIDER_ERROR", "Could not read the uploaded image.")
    }

    const imageB64 = Buffer.from(imageBuffer).toString("base64")
    const imageDataUri = `data:${request.image.mimeType};base64,${imageB64}`
    const prompt = buildPrompt(request.options)
    const headers = { Authorization: `Bearer ${this.token}`, "Content-Type": "application/json" }

    let submitRes: Response
    try {
      submitRes = await fetch(SUBMIT_URL, {
        method: "POST",
        headers,
        body: JSON.stringify({ prompt, image_url: imageDataUri }),
      })
    } catch (err) {
      return this.fail(requestId, "NETWORK_ERROR", `Could not reach the image provider: ${err instanceof Error ? err.message : String(err)}`)
    }

    const submitText = await submitRes.text()
    let submitJson: { request_id?: string; status_url?: string; response_url?: string; detail?: unknown }
    try {
      submitJson = JSON.parse(submitText)
    } catch {
      return this.fail(requestId, "PROVIDER_ERROR", `Submit response was not JSON (HTTP ${submitRes.status}): ${submitText.slice(0, 300)}`)
    }

    if (!submitRes.ok || !submitJson.status_url || !submitJson.response_url) {
      return this.fail(requestId, "PROVIDER_ERROR", `Provider submit failed: HTTP ${submitRes.status} — ${JSON.stringify(submitJson).slice(0, 300)}`)
    }

    const statusUrl = toRouterUrl(submitJson.status_url)
    const responseUrl = toRouterUrl(submitJson.response_url)

    const deadline = Date.now() + this.pollDeadlineMs
    let lastStatus: string | undefined
    while (Date.now() < deadline) {
      let statusRes: Response
      try {
        statusRes = await fetch(statusUrl, { headers })
      } catch (err) {
        return this.fail(requestId, "NETWORK_ERROR", `Could not reach the image provider while polling: ${err instanceof Error ? err.message : String(err)}`)
      }
      let statusJson: { status?: string }
      try {
        statusJson = await statusRes.json()
      } catch {
        return this.fail(requestId, "PROVIDER_ERROR", `Status poll returned unreadable response (HTTP ${statusRes.status}).`)
      }
      lastStatus = statusJson.status
      if (lastStatus === "COMPLETED") break
      if (lastStatus === "ERROR" || lastStatus === "FAILED") {
        return this.fail(requestId, "PROVIDER_ERROR", `Provider reported job status "${lastStatus}": ${JSON.stringify(statusJson).slice(0, 300)}`)
      }
      await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS))
    }

    if (lastStatus !== "COMPLETED") {
      return this.fail(requestId, "TIMEOUT_ERROR", `The image provider did not finish within ${this.pollDeadlineMs}ms (last status: ${lastStatus}).`)
    }

    let resultRes: Response
    try {
      resultRes = await fetch(responseUrl, { headers })
    } catch (err) {
      return this.fail(requestId, "NETWORK_ERROR", `Could not fetch the generated image result: ${err instanceof Error ? err.message : String(err)}`)
    }
    const resultText = await resultRes.text()
    let resultJson: { images?: { url?: string }[] }
    try {
      resultJson = JSON.parse(resultText)
    } catch {
      return this.fail(requestId, "PROVIDER_ERROR", `Result response was not JSON (HTTP ${resultRes.status}): ${resultText.slice(0, 300)}`)
    }

    const imageUrl = resultJson.images?.[0]?.url
    if (!resultRes.ok || !imageUrl) {
      return this.fail(requestId, "PROVIDER_ERROR", `Result did not contain an image (HTTP ${resultRes.status}): ${resultText.slice(0, 300)}`)
    }

    return { requestId, status: "success", result: { imageUrl }, error: null }
  }
}
