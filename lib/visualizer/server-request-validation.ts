// Phase 4 — Server-side request boundary validation (visualizer-docs/04-PHASE-GENERATE.md §28)
// Client-side validation (Phase 3) is for UX only and is never trusted as a
// security boundary. This re-checks the option fields the browser sent against
// the exact same canonical sources Phase 3 uses (no duplicated enum lists —
// see lib/visualizer/validation.ts) and separately enforces the image's
// content-type/size constraints against the file bytes actually received.
//
// This intentionally does NOT re-decode/re-check image pixel dimensions
// server-side (no image-processing dependency is warranted for a mock
// provider) — width/height are carried through as client-reported metadata,
// used only for display, never trusted for a security decision. This is a
// known, documented limitation (see Phase 4 completion report).

import {
  FINISH_PREFERENCE_OPTIONS,
  FLOOR_DIRECTION_OPTIONS,
  PREFERRED_STYLE_OPTIONS,
  PROJECT_TYPE_OPTIONS,
  ROOM_TYPE_OPTIONS,
  SHEEN_OPTIONS,
  WOOD_SPECIES_OPTIONS,
  type VisualizerOptions,
} from "@/lib/visualizer/options"
import { UPLOAD_CONSTRAINTS } from "@/lib/visualizer/image-upload"
import {
  validateCustomStyleDescription,
  validateRequiredOption,
  validateServiceCity,
  validateSquareFootage,
} from "@/lib/visualizer/validation"

export interface ServerValidationResult {
  valid: boolean
  message: string | null
}

export function validateGenerationOptionsPayload(options: unknown): ServerValidationResult {
  if (!options || typeof options !== "object") {
    return { valid: false, message: "Please complete the required selections." }
  }
  const candidate = options as Partial<VisualizerOptions>

  const checks = [
    validateRequiredOption(candidate.roomType, ROOM_TYPE_OPTIONS, "", ""),
    validateRequiredOption(candidate.projectType, PROJECT_TYPE_OPTIONS, "", ""),
    validateRequiredOption(candidate.preferredStyle, PREFERRED_STYLE_OPTIONS, "", ""),
    validateCustomStyleDescription(candidate.preferredStyle, candidate.customStyleDescription),
    validateRequiredOption(candidate.woodSpecies, WOOD_SPECIES_OPTIONS, "", ""),
    validateRequiredOption(candidate.floorDirection, FLOOR_DIRECTION_OPTIONS, "", ""),
    validateRequiredOption(candidate.finishPreference, FINISH_PREFERENCE_OPTIONS, "", ""),
    validateRequiredOption(candidate.sheen, SHEEN_OPTIONS, "", ""),
    validateServiceCity(candidate.serviceCity),
    validateSquareFootage(candidate.squareFootage),
  ]

  const hasError = checks.some((error) => error !== null)
  return hasError ? { valid: false, message: "Please complete the required selections." } : { valid: true, message: null }
}

export function validateGenerationImagePayload(file: unknown): ServerValidationResult {
  if (!(file instanceof Blob) || file.size === 0) {
    return { valid: false, message: "Please upload a room photo." }
  }
  if (!(UPLOAD_CONSTRAINTS.acceptedMimeTypes as readonly string[]).includes(file.type)) {
    return { valid: false, message: "This file type isn't supported. Please upload a JPG, PNG, or WebP image." }
  }
  if (file.size > UPLOAD_CONSTRAINTS.maxFileSizeBytes) {
    return { valid: false, message: `This image is too large. Please choose an image under ${UPLOAD_CONSTRAINTS.maxFileSizeMB} MB.` }
  }
  return { valid: true, message: null }
}
