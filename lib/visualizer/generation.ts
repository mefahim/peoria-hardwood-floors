// Phase 4 — Generation Pipeline (visualizer-docs/04-PHASE-GENERATE.md)
// Shared, isomorphic (browser + server) types and pure helpers for the generation
// workflow. This module owns the request/response contracts, the single timeout
// configuration, request-id creation, and response normalization — so both the
// client (lib/visualizer/generation-client.ts) and the server (app/api/visualizer,
// lib/visualizer/generation-service.ts) consume exactly the same definitions.

import type { NormalizedImage } from "@/lib/visualizer/image-upload"
import type { ValidatedVisualizerData } from "@/lib/visualizer/validation"
import type { VisualizerOptions } from "@/lib/visualizer/options"

// ---------------------------------------------------------------------------
// Timeout configuration — one location, no magic numbers scattered elsewhere.
// ---------------------------------------------------------------------------

// How long the generation SERVICE (server-side race against the provider) waits
// before treating an attempt as timed out. Short because the mock provider is
// deliberately fast; a real provider will likely need a larger, provider-specific
// value. Overridable via NEXT_PUBLIC_VISUALIZER_GENERATION_TIMEOUT_MS (must be
// NEXT_PUBLIC_-prefixed since this module is isomorphic — both the client's own
// abort timeout below and the server's race need the same value). Defaults to
// 8000 (unchanged) when unset, so the mock-provider path is untouched.
function resolveGenerationTimeoutMs(): number {
  const raw = process.env.NEXT_PUBLIC_VISUALIZER_GENERATION_TIMEOUT_MS
  const parsed = raw ? Number(raw) : NaN
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 8000
}
export const GENERATION_TIMEOUT_MS = resolveGenerationTimeoutMs()

// The client's own fetch-level abort fires a few seconds after the server-side
// timeout so that, under normal conditions, the server's TIMEOUT_ERROR response is
// what the user sees. This is a fallback safety net for network/server hangs where
// no response — timeout or otherwise — ever arrives.
export const CLIENT_TIMEOUT_MS = GENERATION_TIMEOUT_MS + 4000

// ---------------------------------------------------------------------------
// Generation state machine
// ---------------------------------------------------------------------------

export type GenerationStatus =
  | "idle"
  | "validating"
  | "creating_request"
  | "generating"
  | "success"
  | "error"
  | "timeout"

export type GenerationErrorCode =
  | "VALIDATION_ERROR"
  | "REQUEST_CREATION_ERROR"
  | "NETWORK_ERROR"
  | "PROVIDER_ERROR"
  | "TIMEOUT_ERROR"
  | "INVALID_PROVIDER_RESPONSE"
  | "UNKNOWN_GENERATION_ERROR"

export interface GenerationError {
  code: GenerationErrorCode
  message: string
}

export const GENERATION_ERROR_MESSAGES: Record<GenerationErrorCode, string> = {
  VALIDATION_ERROR: "Please review the highlighted fields before generating.",
  REQUEST_CREATION_ERROR: "We couldn't start the visualization. Please try again.",
  NETWORK_ERROR: "We couldn't reach the visualizer. Please check your connection and try again.",
  PROVIDER_ERROR: "We couldn't generate the visualization right now. Please try again.",
  TIMEOUT_ERROR: "The visualization is taking longer than expected. Please try again.",
  INVALID_PROVIDER_RESPONSE: "We received an incomplete result. Please try again.",
  UNKNOWN_GENERATION_ERROR: "Something went wrong creating your visualization. Please try again.",
}

// ---------------------------------------------------------------------------
// Normalized visualization request — the canonical shape that crosses the
// provider boundary. Uses Phase 1's NormalizedImage metadata and Phase 2's
// VisualizerOptions directly; no second, duplicate options model.
// ---------------------------------------------------------------------------

export interface VisualizationImageMetadata {
  fileName: string
  mimeType: string
  width: number
  height: number
}

// The wire-level JSON contract (image bytes travel separately as multipart form
// data — see lib/visualizer/generation-client.ts — never JSON-stringified).
export interface VisualizationGenerationRequest {
  requestId: string
  image: VisualizationImageMetadata
  options: VisualizerOptions
}

// The client-side immutable snapshot captured the moment Generate succeeds
// validation. Frozen so later UI edits to `options`/`image` state cannot mutate
// an in-flight or completed attempt.
export interface VisualizationGenerationSnapshot {
  requestId: string
  createdAt: number
  image: NormalizedImage
  options: VisualizerOptions
}

export function buildGenerationSnapshot(requestId: string, data: ValidatedVisualizerData): VisualizationGenerationSnapshot {
  const snapshot: VisualizationGenerationSnapshot = {
    requestId,
    createdAt: Date.now(),
    image: Object.freeze({ ...data.image }),
    options: Object.freeze({ ...data.options }),
  }
  return Object.freeze(snapshot)
}

// ---------------------------------------------------------------------------
// Request ID — unique per generation attempt, never reused, never derived from
// the file name or any other sensitive/user-identifying value.
// ---------------------------------------------------------------------------

export function createRequestId(): string {
  const cryptoObj: Crypto | undefined = typeof crypto !== "undefined" ? crypto : undefined
  if (cryptoObj?.randomUUID) return `viz_${cryptoObj.randomUUID()}`
  // Fallback for an environment without crypto.randomUUID: still collision-resistant
  // (random entropy, not a bare timestamp).
  const random = Array.from({ length: 16 }, () => Math.floor(Math.random() * 36).toString(36)).join("")
  return `viz_${Date.now().toString(36)}${random}`
}

// A client-supplied requestId is used as both a DB primary key (safe, parameterized)
// and — for the real provider's output image, and now the saved input image — a
// filesystem path component. This pattern matches both createRequestId() shapes
// above and rejects anything else (path separators, null bytes, etc.) before it can
// ever reach a filesystem call.
const REQUEST_ID_PATTERN = /^viz_[A-Za-z0-9_-]{1,80}$/

export function isValidRequestId(value: unknown): value is string {
  return typeof value === "string" && REQUEST_ID_PATTERN.test(value)
}

// ---------------------------------------------------------------------------
// Normalized provider/result contract — what both the server response body and
// the client's accepted state use. Never expose a raw/unnormalized provider
// payload to the frontend.
// ---------------------------------------------------------------------------

export interface VisualizationProviderResponse {
  requestId: string
  status: "success" | "error" | "timeout"
  result: { imageUrl: string } | null
  error: { code: GenerationErrorCode; message: string } | null
}

export interface NormalizedGenerationResult {
  requestId: string
  imageUrl: string
}

// Defensively validates and normalizes a raw provider/response payload. A
// provider response is never accepted blindly: missing/malformed data becomes
// an error result, never a false SUCCESS (04-PHASE-GENERATE.md §34, §46).
export function normalizeProviderResult(raw: unknown, expectedRequestId: string): VisualizationProviderResponse {
  const fallbackError = (code: GenerationErrorCode): VisualizationProviderResponse => ({
    requestId: expectedRequestId,
    status: "error",
    result: null,
    error: { code, message: GENERATION_ERROR_MESSAGES[code] },
  })

  if (!raw || typeof raw !== "object") return fallbackError("INVALID_PROVIDER_RESPONSE")

  const candidate = raw as Partial<VisualizationProviderResponse>

  if (typeof candidate.requestId !== "string" || candidate.requestId !== expectedRequestId) {
    return fallbackError("INVALID_PROVIDER_RESPONSE")
  }

  if (candidate.status === "success") {
    const imageUrl = candidate.result?.imageUrl
    if (typeof imageUrl !== "string" || imageUrl.trim().length === 0) {
      return fallbackError("INVALID_PROVIDER_RESPONSE")
    }
    return { requestId: expectedRequestId, status: "success", result: { imageUrl }, error: null }
  }

  if (candidate.status === "error" || candidate.status === "timeout") {
    // The user-facing message always comes from the approved set below, never
    // from the provider's own (possibly technical/internal) message text
    // (04-PHASE-GENERATE.md §36) — the provider's message is for server logs only.
    const code: GenerationErrorCode =
      candidate.error?.code && candidate.error.code in GENERATION_ERROR_MESSAGES ? candidate.error.code : "UNKNOWN_GENERATION_ERROR"
    return { requestId: expectedRequestId, status: candidate.status, result: null, error: { code, message: GENERATION_ERROR_MESSAGES[code] } }
  }

  return fallbackError("INVALID_PROVIDER_RESPONSE")
}

// ---------------------------------------------------------------------------
// Stale-response protection (04-PHASE-GENERATE.md §23) — a pure, directly
// testable decision: does this response still belong to the currently active
// generation attempt?
// ---------------------------------------------------------------------------

export function shouldApplyGenerationResponse(activeRequestId: string | null, responseRequestId: string): boolean {
  return activeRequestId !== null && activeRequestId === responseRequestId
}
