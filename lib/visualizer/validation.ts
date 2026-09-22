// Phase 3 — Validation & User Flow (visualizer-docs/03-PHASE-VALIDATION.md)
// The single authoritative gate between Upload + Options state and the Generate action.
// Pure and side-effect free: reads input, returns a structured result. Never mutates
// React state, never touches the DOM/object URLs, never calls an API.

import type { NormalizedImage } from "@/lib/visualizer/image-upload"
import {
  CUSTOM_STYLE_VALUE,
  FINISH_PREFERENCE_OPTIONS,
  FLOOR_DIRECTION_OPTIONS,
  type OptionDef,
  PREFERRED_STYLE_OPTIONS,
  PROJECT_TYPE_OPTIONS,
  ROOM_TYPE_OPTIONS,
  SERVICE_CITY_OPTIONS,
  SHEEN_OPTIONS,
  WOOD_SPECIES_OPTIONS,
  type VisualizerOptions,
} from "@/lib/visualizer/options"

export const CUSTOM_STYLE_DESCRIPTION_MAX_LENGTH = 500

export type ValidationFieldKey =
  | "image"
  | "roomType"
  | "projectType"
  | "preferredStyle"
  | "customStyleDescription"
  | "woodSpecies"
  | "floorDirection"
  | "finishPreference"
  | "sheen"
  | "serviceCity"
  | "squareFootage"

export type ValidationErrorCode =
  | "IMAGE_REQUIRED"
  | "FIELD_REQUIRED"
  | "INVALID_OPTION_VALUE"
  | "CUSTOM_STYLE_REQUIRED"
  | "CUSTOM_STYLE_TOO_LONG"
  | "INVALID_SERVICE_CITY"
  | "INVALID_SQUARE_FOOTAGE"

export interface FieldError {
  code: ValidationErrorCode
  message: string
}

export type ValidationErrors = Partial<Record<ValidationFieldKey, FieldError>>

// The validated, normalized snapshot a future Phase 4 request builder can consume.
// This is NOT a provider request and contains no prompt/vendor-specific shape.
export interface ValidatedVisualizerData {
  image: NormalizedImage
  options: VisualizerOptions
}

export interface ValidationResult {
  valid: boolean
  errors: ValidationErrors
  summary: string | null
  data: ValidatedVisualizerData | null
}

export interface VisualizerInputState {
  image: NormalizedImage | null
  options: VisualizerOptions
}

// Verifies the Phase 1 normalized image state is actually present and structurally
// intact. Does NOT re-decode or re-validate the underlying file — that already
// happened in lib/visualizer/image-upload.ts. This only guards against the case
// described in 03-PHASE-VALIDATION.md §7.2: don't trust a preview as proof of validity.
function isNormalizedImage(image: unknown): image is NormalizedImage {
  if (!image || typeof image !== "object") return false
  const candidate = image as Partial<NormalizedImage>
  return (
    candidate.source instanceof File &&
    typeof candidate.previewUrl === "string" &&
    typeof candidate.mimeType === "string" &&
    typeof candidate.size === "number" &&
    typeof candidate.width === "number" &&
    typeof candidate.height === "number"
  )
}

export function validateRequiredOption<T extends string>(
  value: unknown,
  allowedOptions: readonly OptionDef<T>[],
  requiredMessage: string,
  invalidMessage: string,
): FieldError | null {
  if (value === null || value === undefined || value === "") {
    return { code: "FIELD_REQUIRED", message: requiredMessage }
  }
  if (typeof value !== "string" || !allowedOptions.some((option) => option.value === value)) {
    return { code: "INVALID_OPTION_VALUE", message: invalidMessage }
  }
  return null
}

export function validateCustomStyleDescription(preferredStyle: unknown, description: unknown): FieldError | null {
  // Only required/validated when Custom is selected — never required otherwise.
  if (preferredStyle !== CUSTOM_STYLE_VALUE) return null

  const trimmed = (typeof description === "string" ? description : "").trim()

  if (trimmed.length === 0) {
    return { code: "CUSTOM_STYLE_REQUIRED", message: "Please describe the style you want." }
  }
  if (trimmed.length > CUSTOM_STYLE_DESCRIPTION_MAX_LENGTH) {
    return {
      code: "CUSTOM_STYLE_TOO_LONG",
      message: `Please shorten your style description to ${CUSTOM_STYLE_DESCRIPTION_MAX_LENGTH} characters or fewer.`,
    }
  }
  return null
}

export function validateServiceCity(value: unknown): FieldError | null {
  // Optional — null/empty is valid.
  if (value === null || value === undefined || value === "") return null
  if (typeof value !== "string" || !SERVICE_CITY_OPTIONS.some((option) => option.value === value)) {
    return { code: "INVALID_SERVICE_CITY", message: "Please select a valid service city." }
  }
  return null
}

export function validateSquareFootage(value: unknown): FieldError | null {
  // Optional — null is valid.
  if (value === null || value === undefined) return null
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return { code: "INVALID_SQUARE_FOOTAGE", message: "Please enter a valid square footage." }
  }
  return null
}

// The canonical validator. Deterministic and pure: same input always produces the
// same result, and every applicable error is returned in one pass (never stops at
// the first failure) so the UI can show field-specific feedback for everything at once.
export function validateVisualizerInput(state: VisualizerInputState): ValidationResult {
  const options = state?.options
  const errors: ValidationErrors = {}

  if (!isNormalizedImage(state?.image)) {
    errors.image = { code: "IMAGE_REQUIRED", message: "Please upload a room photo." }
  }

  const roomTypeError = validateRequiredOption(
    options?.roomType,
    ROOM_TYPE_OPTIONS,
    "Please choose a room type.",
    "Please select a valid room type.",
  )
  if (roomTypeError) errors.roomType = roomTypeError

  const projectTypeError = validateRequiredOption(
    options?.projectType,
    PROJECT_TYPE_OPTIONS,
    "Please choose a project type.",
    "Please select a valid project type.",
  )
  if (projectTypeError) errors.projectType = projectTypeError

  const preferredStyleError = validateRequiredOption(
    options?.preferredStyle,
    PREFERRED_STYLE_OPTIONS,
    "Please choose a preferred style.",
    "Please select a valid preferred style.",
  )
  if (preferredStyleError) errors.preferredStyle = preferredStyleError

  const customStyleError = validateCustomStyleDescription(options?.preferredStyle, options?.customStyleDescription)
  if (customStyleError) errors.customStyleDescription = customStyleError

  const woodSpeciesError = validateRequiredOption(
    options?.woodSpecies,
    WOOD_SPECIES_OPTIONS,
    "Please choose a wood species.",
    "Please select a valid wood species.",
  )
  if (woodSpeciesError) errors.woodSpecies = woodSpeciesError

  const floorDirectionError = validateRequiredOption(
    options?.floorDirection,
    FLOOR_DIRECTION_OPTIONS,
    "Please choose a floor direction.",
    "Please select a valid floor direction.",
  )
  if (floorDirectionError) errors.floorDirection = floorDirectionError

  const finishPreferenceError = validateRequiredOption(
    options?.finishPreference,
    FINISH_PREFERENCE_OPTIONS,
    "Please choose a finish preference.",
    "Please select a valid finish preference.",
  )
  if (finishPreferenceError) errors.finishPreference = finishPreferenceError

  const sheenError = validateRequiredOption(
    options?.sheen,
    SHEEN_OPTIONS,
    "Please choose a sheen.",
    "Please select a valid sheen.",
  )
  if (sheenError) errors.sheen = sheenError

  const serviceCityError = validateServiceCity(options?.serviceCity)
  if (serviceCityError) errors.serviceCity = serviceCityError

  const squareFootageError = validateSquareFootage(options?.squareFootage)
  if (squareFootageError) errors.squareFootage = squareFootageError

  const valid = Object.keys(errors).length === 0

  return {
    valid,
    errors,
    summary: valid ? null : "Please review the highlighted fields before generating.",
    data:
      valid && isNormalizedImage(state?.image) && options
        ? { image: state.image, options: { ...options, customStyleDescription: options.customStyleDescription.trim() } }
        : null,
  }
}
