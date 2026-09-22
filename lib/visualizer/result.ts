// Phase 5 — Result validation & display helpers (visualizer-docs/05-PHASE-RESULT.md)
// Layered on top of the Phase 4 normalized result contract — this module does NOT
// define a second/unrelated result model. Phase 4's normalizeProviderResult()
// already guarantees requestId matching, result presence, and a non-empty
// imageUrl string before anything reaches "success" (04-PHASE-GENERATE.md §34).
// This module adds the one remaining Phase 5-specific check the doc calls out
// (05-PHASE-RESULT.md §8 item 7 / §31): is the image reference actually a safe,
// usable reference for the <img> element — not an arbitrary/unsafe URL scheme.

import {
  PREFERRED_STYLE_OPTIONS,
  ROOM_TYPE_OPTIONS,
  WOOD_SPECIES_OPTIONS,
  type VisualizerOptions,
} from "@/lib/visualizer/options"

// Result-layer failures are conceptually distinct from Phase 4 generation
// failures (05-PHASE-RESULT.md §24): the provider/generation succeeded, but the
// application could not validate or display what it received. Intentionally a
// separate type from GenerationErrorCode rather than folded into it.
export type ResultErrorCode = "RESULT_IMAGE_INVALID" | "RESULT_IMAGE_LOAD_FAILED"

export interface ResultError {
  code: ResultErrorCode
  message: string
}

// Same user-facing message for both — from the user's perspective "the result
// couldn't be displayed" either way (05-PHASE-RESULT.md §22's exact example
// wording). The distinct codes exist for internal debugging, not different copy.
export const RESULT_ERROR_MESSAGES: Record<ResultErrorCode, string> = {
  RESULT_IMAGE_INVALID: "We generated the visualization, but it couldn't be displayed. Please try again.",
  RESULT_IMAGE_LOAD_FAILED: "We generated the visualization, but it couldn't be displayed. Please try again.",
}

// Accepts: root-relative paths ("/images/x.png"), http(s) URLs, blob: URLs (a
// future real provider may return one), and image data: URIs. Rejects
// protocol-relative "//host/x" (an absolute cross-origin URL in disguise),
// javascript:, vbscript:, file:, non-image data: URIs, and anything else
// (05-PHASE-RESULT.md §31 — do not blindly trust arbitrary URL schemes).
const USABLE_IMAGE_REFERENCE_PATTERN = /^(?:\/(?!\/)|https:\/\/|http:\/\/|blob:|data:image\/)/i

export function isUsableResultImageReference(imageUrl: unknown): imageUrl is string {
  if (typeof imageUrl !== "string") return false
  const trimmed = imageUrl.trim()
  if (trimmed.length === 0) return false
  return USABLE_IMAGE_REFERENCE_PATTERN.test(trimmed)
}

// Meaningful, dynamic alt text built from the generation snapshot that actually
// produced this result — never from live/current form state (05-PHASE-RESULT.md
// §19-20) — and never a bare filename (§32).
export function buildResultAltText(options: VisualizerOptions | null): string {
  if (!options) return "AI-assisted flooring visualization concept"
  const styleLabel = PREFERRED_STYLE_OPTIONS.find((o) => o.value === options.preferredStyle)?.label
  const woodLabel = WOOD_SPECIES_OPTIONS.find((o) => o.value === options.woodSpecies)?.label
  const roomLabel = ROOM_TYPE_OPTIONS.find((o) => o.value === options.roomType)?.label
  const description = [styleLabel, woodLabel].filter(Boolean).join(" ") || "new flooring"
  return `AI-assisted visualization concept: ${description} flooring in your uploaded ${roomLabel?.toLowerCase() ?? "room"} photo`
}
