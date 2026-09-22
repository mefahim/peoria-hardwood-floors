// Phase 4 — Browser-side generation client (visualizer-docs/04-PHASE-GENERATE.md §27, §29)
// The ONLY module app/visualizer/page.tsx talks to for generation. It knows how
// to reach the /api/visualizer boundary and how to normalize/react to transport
// failures — it does NOT know which provider answers on the other end (mock or
// real). Never imports the mock provider.

import {
  CLIENT_TIMEOUT_MS,
  GENERATION_ERROR_MESSAGES,
  normalizeProviderResult,
  type VisualizationGenerationSnapshot,
  type VisualizationProviderResponse,
} from "@/lib/visualizer/generation"
import { isQuotaDeniedResponse, type QuotaDeniedResponse } from "@/lib/visualizer/quota-types"

// The browser File object cannot be JSON.stringify-ed into a useful payload, so
// the request travels as multipart/form-data: structured fields (requestId,
// options) alongside the actual image bytes. A real provider will eventually
// need these same bytes — this boundary already establishes that shape.
function buildRequestBody(snapshot: VisualizationGenerationSnapshot): FormData {
  const body = new FormData()
  body.set("requestId", snapshot.requestId)
  body.set("options", JSON.stringify(snapshot.options))
  body.set("imageMeta", JSON.stringify({ fileName: snapshot.image.fileName, mimeType: snapshot.image.mimeType, width: snapshot.image.width, height: snapshot.image.height }))
  body.set("image", snapshot.image.source, snapshot.image.fileName)
  return body
}

export async function runGeneration(snapshot: VisualizationGenerationSnapshot): Promise<VisualizationProviderResponse | QuotaDeniedResponse> {
  let body: FormData
  try {
    body = buildRequestBody(snapshot)
  } catch {
    return {
      requestId: snapshot.requestId,
      status: "error",
      result: null,
      error: { code: "REQUEST_CREATION_ERROR", message: GENERATION_ERROR_MESSAGES.REQUEST_CREATION_ERROR },
    }
  }

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS)

  try {
    const response = await fetch("/api/visualizer", { method: "POST", body, signal: controller.signal })
    clearTimeout(timer)

    let json: unknown
    try {
      json = await response.json()
    } catch {
      return {
        requestId: snapshot.requestId,
        status: "error",
        result: null,
        error: { code: "INVALID_PROVIDER_RESPONSE", message: GENERATION_ERROR_MESSAGES.INVALID_PROVIDER_RESPONSE },
      }
    }

    // A quota denial is a distinct response kind, recognized BEFORE normalization —
    // normalizeProviderResult would otherwise flatten its precise phase/cooldown data
    // into a generic INVALID_PROVIDER_RESPONSE, since it only recognizes the
    // VisualizationProviderResponse shape.
    if (isQuotaDeniedResponse(json)) return json

    // Defense in depth: re-run the same normalization the server already applied.
    return normalizeProviderResult(json, snapshot.requestId)
  } catch (error) {
    clearTimeout(timer)
    if (error instanceof DOMException && error.name === "AbortError") {
      return {
        requestId: snapshot.requestId,
        status: "timeout",
        result: null,
        error: { code: "TIMEOUT_ERROR", message: GENERATION_ERROR_MESSAGES.TIMEOUT_ERROR },
      }
    }
    return {
      requestId: snapshot.requestId,
      status: "error",
      result: null,
      error: { code: "NETWORK_ERROR", message: GENERATION_ERROR_MESSAGES.NETWORK_ERROR },
    }
  }
}
