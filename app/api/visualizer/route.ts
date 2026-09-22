// Phase 4 — Generation boundary (visualizer-docs/04-PHASE-GENERATE.md §27-29)
// Replaces the legacy text-generation endpoint. This is the server-side
// boundary: browser -> here -> generation service -> provider -> normalized
// response -> browser. The browser is never trusted — every field is
// re-validated here even though the client already validated (Phase 3).
//
// Which provider actually runs (mock, or the real Hugging Face / fal-ai
// provider) is controlled from /admin, not hardcoded here — see
// lib/visualizer/admin-store.ts. Every attempt is logged for that dashboard's
// "recent generations" list, and a successful real-provider image is saved
// locally under public/generated/ rather than only linked to the provider's
// (potentially temporary) hosted URL.

import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { createRequestId, GENERATION_ERROR_MESSAGES, GENERATION_TIMEOUT_MS, isValidRequestId, type VisualizationProviderResponse } from "@/lib/visualizer/generation"
import { generateVisualization } from "@/lib/visualizer/generation-service"
import { MockVisualizationProvider, type MockProviderMode } from "@/lib/visualizer/providers/mock-visualization-provider"
import { HF_MODEL_ID, HuggingFaceVisualizationProvider } from "@/lib/visualizer/providers/huggingface-visualization-provider"
import type { VisualizationProvider, VisualizationProviderRequest } from "@/lib/visualizer/providers/types"
import { validateGenerationImagePayload, validateGenerationOptionsPayload } from "@/lib/visualizer/server-request-validation"
import type { VisualizerOptions } from "@/lib/visualizer/options"
import { appendGenerationLogEntry, getActiveProvider, getHfToken } from "@/lib/visualizer/admin-store"
import { db } from "@/lib/db/client"
import { getOrCreateVisitor } from "@/lib/db/visitors"
import { finalizeGeneration, reserveGeneration, type GenerationRow } from "@/lib/db/generations"
import { getOrCreateVisitorId } from "@/lib/visualizer/visitor-cookie"
import { getClientIp } from "@/lib/visualizer/request-ip"
import { saveInputImage } from "@/lib/visualizer/input-image-store"
import type { QuotaDeniedResponse } from "@/lib/visualizer/quota-types"

const MOCK_MODES: readonly MockProviderMode[] = ["success", "error", "timeout", "malformed_success"]
const GENERATED_DIR = path.join(process.cwd(), "public", "generated")

// Generous, flood-blunting defaults — see lib/db/quota.ts's envInt pattern; these
// are not the primary quota control (the reservation transaction is), just a
// backstop against scripted floods. Overridable via env for tuning without a code change.
const RATE_LIMIT_PER_WINDOW = Number(process.env.VISUALIZER_RATE_LIMIT_PER_10MIN) > 0 ? Number(process.env.VISUALIZER_RATE_LIMIT_PER_10MIN) : 20
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000

function rowToProviderResponse(row: GenerationRow): VisualizationProviderResponse {
  if (row.is_delivered && row.output_image_ref) {
    return { requestId: row.id, status: "success", result: { imageUrl: row.output_image_ref }, error: null }
  }
  if (row.status === "timeout") {
    return { requestId: row.id, status: "timeout", result: null, error: { code: "TIMEOUT_ERROR", message: GENERATION_ERROR_MESSAGES.TIMEOUT_ERROR } }
  }
  return { requestId: row.id, status: "error", result: null, error: { code: "PROVIDER_ERROR", message: GENERATION_ERROR_MESSAGES.PROVIDER_ERROR } }
}

// Development/testing-only lever (visualizer-docs/04-PHASE-GENERATE.md §12): lets
// the mock provider be driven into each lifecycle branch deterministically for
// verification. Never honored in production, never surfaced in the UI, and not
// part of the canonical VisualizerOptions.
function resolveMockMode(request: Request): MockProviderMode {
  if (process.env.NODE_ENV === "production") return "success"
  const header = request.headers.get("x-mock-visualizer-mode")
  return MOCK_MODES.includes(header as MockProviderMode) ? (header as MockProviderMode) : "success"
}

function errorResponse(requestId: string, message: string, status: number) {
  const body: VisualizationProviderResponse = {
    requestId,
    status: "error",
    result: null,
    error: { code: "VALIDATION_ERROR", message },
  }
  return Response.json(body, { status })
}

// Downloads a real provider's (remote, potentially temporary) result image and
// saves it under public/generated/, returning the local path to use instead.
// On any failure, the original remote URL is kept — a save failure should
// never turn a successful generation into an error for the user.
async function persistGeneratedImage(requestId: string, remoteUrl: string): Promise<string> {
  try {
    const res = await fetch(remoteUrl)
    if (!res.ok) return remoteUrl
    const bytes = Buffer.from(await res.arrayBuffer())
    await mkdir(GENERATED_DIR, { recursive: true })
    const fileName = `${requestId}.jpg`
    await writeFile(path.join(GENERATED_DIR, fileName), bytes)
    return `/generated/${fileName}`
  } catch {
    return remoteUrl
  }
}

export async function POST(request: Request) {
  // Visitor identity is resolved before anything else — it's needed to even
  // attempt a quota reservation. Fails closed (mirrors middleware.ts's philosophy
  // for a missing ADMIN_PASSWORD) rather than silently trusting an unsigned cookie.
  const visitorCookie = await getOrCreateVisitorId()
  if (!visitorCookie) {
    return Response.json({ error: "Visualizer is not configured (VISITOR_COOKIE_SECRET is unset)." }, { status: 503 })
  }
  const { visitorId } = visitorCookie
  const ip = getClientIp(request)
  const userAgent = request.headers.get("user-agent") ?? "unknown"
  getOrCreateVisitor(db, { id: visitorId, ip, userAgent })

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return errorResponse(createRequestId(), "Please complete the required selections.", 400)
  }

  const requestId = formData.get("requestId")
  if (!isValidRequestId(requestId)) {
    return errorResponse(createRequestId(), "Please complete the required selections.", 400)
  }

  let options: VisualizerOptions
  try {
    options = JSON.parse(String(formData.get("options")))
  } catch {
    return errorResponse(requestId, "Please complete the required selections.", 400)
  }

  let imageMeta: { fileName: string; mimeType: string; width: number; height: number }
  try {
    imageMeta = JSON.parse(String(formData.get("imageMeta")))
  } catch {
    return errorResponse(requestId, "Please upload a room photo.", 400)
  }

  const imageFile = formData.get("image")

  const optionsCheck = validateGenerationOptionsPayload(options)
  if (!optionsCheck.valid) return errorResponse(requestId, optionsCheck.message ?? "Please complete the required selections.", 400)

  const imageCheck = validateGenerationImagePayload(imageFile)
  if (!imageCheck.valid) return errorResponse(requestId, imageCheck.message ?? "Please upload a room photo.", 400)

  const activeProviderForReservation = await getActiveProvider()
  const reservation = reserveGeneration(db, {
    requestId,
    visitorId,
    ip,
    userAgent,
    provider: activeProviderForReservation,
    woodSpecies: options.woodSpecies,
    preferredStyle: options.preferredStyle,
    optionsJson: JSON.stringify(options),
    rateLimitPerWindow: RATE_LIMIT_PER_WINDOW,
    rateLimitWindowMs: RATE_LIMIT_WINDOW_MS,
  })

  if (reservation.kind === "duplicate") {
    // Same requestId as a prior attempt (network-level retry of the identical
    // request) — return what was actually delivered, without re-reserving quota
    // or calling the provider again.
    const replayed = rowToProviderResponse(reservation.row)
    const replayedStatus = replayed.status === "success" ? 200 : replayed.status === "timeout" ? 504 : 502
    return Response.json(replayed, { status: replayedStatus })
  }

  if (reservation.kind === "denied") {
    const { quotaState, denialPhase, reason } = reservation
    const body: QuotaDeniedResponse = {
      kind: "quota_denied",
      requestId,
      phase: denialPhase,
      cooldownUntil: quotaState.cooldownUntil,
      freeRemaining: quotaState.freeRemaining,
      message: reason,
    }
    const status = denialPhase === "needs_lead" ? 403 : 429
    return Response.json(body, { status })
  }

  const providerRequest: VisualizationProviderRequest = {
    requestId,
    image: {
      fileName: imageMeta.fileName,
      mimeType: imageMeta.mimeType,
      width: imageMeta.width,
      height: imageMeta.height,
      file: imageFile as Blob,
    },
    options,
  }

  const activeProvider = activeProviderForReservation
  const hfProvider = activeProvider === "huggingface" ? new HuggingFaceVisualizationProvider(await getHfToken()) : null
  const provider: VisualizationProvider = hfProvider ?? new MockVisualizationProvider(resolveMockMode(request), GENERATION_TIMEOUT_MS)

  // Runs alongside the (potentially multi-minute) provider call rather than
  // serially before/after it — saving the input photo is fast and independent.
  const inputImageRefPromise = saveInputImage(requestId, imageFile as Blob, imageMeta.mimeType)

  let result = await generateVisualization(providerRequest, provider)
  const primaryStatus = result.status
  const primaryErrorMessage = hfProvider?.lastErrorDetail ?? result.error?.message ?? null

  // If the real provider fails (out of credits, timeout, outage), fall back
  // to an instant placeholder so visitors never see an error page. The real
  // failure is still recorded below (primaryStatus/primaryErrorMessage) so
  // the admin dashboard's warning banner keeps firing for it.
  let usedFallback = false
  if (hfProvider && result.status !== "success") {
    const fallbackResult = await generateVisualization(providerRequest, new MockVisualizationProvider("success", GENERATION_TIMEOUT_MS))
    if (fallbackResult.status === "success") {
      result = fallbackResult
      usedFallback = true
    }
  }

  // Real-provider images are only ever linked to the provider's own hosted
  // URL unless persisted here — mock's result (real or fallback) is already
  // a stable local asset, so there's nothing to save for it.
  if (hfProvider && !usedFallback && result.status === "success" && result.result) {
    const localImageUrl = await persistGeneratedImage(requestId, result.result.imageUrl)
    result = { ...result, result: { imageUrl: localImageUrl } }
  }

  // Finalize the DB reservation with the real outcome — never lets a finalize
  // failure turn an already-delivered response into an error for the visitor,
  // same masking philosophy this route already applies to persistGeneratedImage.
  try {
    const inputImageRef = await inputImageRefPromise
    finalizeGeneration(db, {
      requestId,
      status: primaryStatus,
      isFallback: usedFallback,
      isDelivered: !!result.result,
      model: hfProvider ? HF_MODEL_ID : null,
      outputImageRef: result.result?.imageUrl ?? null,
      inputImageRef,
      errorMessage: primaryErrorMessage,
    })
  } catch (err) {
    console.error(`[visualizer route] finalizeGeneration failed for ${requestId}:`, err)
  }

  await appendGenerationLogEntry({
    requestId,
    createdAt: new Date().toISOString(),
    provider: activeProvider,
    // Log the real outcome (not the fallback's success) so the dashboard
    // warning banner still alerts the admin when the real provider is failing.
    status: primaryStatus,
    imageUrl: result.result?.imageUrl ?? null,
    errorMessage: usedFallback ? `${primaryErrorMessage ?? "Unknown error"} — visitor was shown a fallback preview instead of an error.` : primaryErrorMessage,
    options,
  })

  const status = usedFallback ? 200 : result.status === "success" ? 200 : result.status === "timeout" ? 504 : 502
  return Response.json(result, { status })
}
