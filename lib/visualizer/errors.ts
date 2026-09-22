// Phase 7 — Error Recovery (visualizer-docs/07-PHASE-ERROR-RECOVERY.md)
// Formalizes the error taxonomy that Phases 1-6 already established through
// separate code enums (UploadErrorCode, ValidationErrorCode, GenerationErrorCode,
// ResultErrorCode) into one shared category/code/message/recoverable/retryable/
// requestId/field contract (§6-7), plus the two genuinely new capabilities this
// phase requires: a safe normalizer for truly unexpected/unknown thrown values
// (§36-38, ERR-015) and a safe, secret-free development logger (§40-42, ERR-017).
//
// This module does NOT replace or restructure the existing per-operation error
// state (generationError/resultError/uploadErrorMessage/field errors in
// app/visualizer/page.tsx) — per §62 "Error Ownership", each operation keeps its
// own error slot rather than one global error string. This module classifies
// those existing codes; it does not own or duplicate them.

import type { GenerationError, GenerationErrorCode } from "@/lib/visualizer/generation"
import type { ResultError, ResultErrorCode } from "@/lib/visualizer/result"
import type { UploadError, UploadErrorCode } from "@/lib/visualizer/image-upload"
import type { FieldError, ValidationErrorCode, ValidationFieldKey } from "@/lib/visualizer/validation"

// The 9 high-level categories recommended by 07-PHASE-ERROR-RECOVERY.md §5.
export type ErrorCategory =
  | "UPLOAD_ERROR"
  | "VALIDATION_ERROR"
  | "REQUEST_ERROR"
  | "NETWORK_ERROR"
  | "GENERATION_ERROR"
  | "TIMEOUT_ERROR"
  | "RESULT_ERROR"
  | "STATE_ERROR"
  | "UNKNOWN_ERROR"

// The recommended internal error object contract (§7). `field` is only ever
// non-null for a VALIDATION_ERROR tied to one specific input; every other
// category is an operation error, never a field error (§63).
export interface AppError {
  category: ErrorCategory
  code: string
  message: string
  recoverable: boolean
  retryable: boolean
  requestId: string | null
  field: ValidationFieldKey | null
}

interface ErrorMeta {
  category: ErrorCategory
  recoverable: boolean
  retryable: boolean
}

// §43 Retryability Mapping, applied to the actual codes already in use. `Record<Enum, _>`
// makes this exhaustive at compile time: adding a new code elsewhere without updating
// this table is a type error, not a silent gap.
const GENERATION_ERROR_META: Record<GenerationErrorCode, ErrorMeta> = {
  // The one current use (an invalid/stale retry snapshot) can't be fixed by
  // retrying the same broken snapshot again — the user must start a new
  // visualization, so this is deliberately not retryable (§43 FIELD_REQUIRED example).
  VALIDATION_ERROR: { category: "VALIDATION_ERROR", recoverable: true, retryable: false },
  REQUEST_CREATION_ERROR: { category: "REQUEST_ERROR", recoverable: true, retryable: true },
  NETWORK_ERROR: { category: "NETWORK_ERROR", recoverable: true, retryable: true },
  PROVIDER_ERROR: { category: "GENERATION_ERROR", recoverable: true, retryable: true },
  TIMEOUT_ERROR: { category: "TIMEOUT_ERROR", recoverable: true, retryable: true },
  INVALID_PROVIDER_RESPONSE: { category: "GENERATION_ERROR", recoverable: true, retryable: true },
  UNKNOWN_GENERATION_ERROR: { category: "UNKNOWN_ERROR", recoverable: true, retryable: true },
}

const RESULT_ERROR_META: Record<ResultErrorCode, ErrorMeta> = {
  RESULT_IMAGE_INVALID: { category: "RESULT_ERROR", recoverable: true, retryable: true },
  RESULT_IMAGE_LOAD_FAILED: { category: "RESULT_ERROR", recoverable: true, retryable: true },
}

// Upload failures are corrected by replacing the file, not by "retrying" the
// same rejected file (§45 action-mapping principle — replace_image, not retry).
const UPLOAD_ERROR_META: Record<UploadErrorCode, ErrorMeta> = {
  UNSUPPORTED_FILE_TYPE: { category: "UPLOAD_ERROR", recoverable: true, retryable: false },
  FILE_TOO_LARGE: { category: "UPLOAD_ERROR", recoverable: true, retryable: false },
  IMAGE_TOO_SMALL: { category: "UPLOAD_ERROR", recoverable: true, retryable: false },
  IMAGE_UNREADABLE: { category: "UPLOAD_ERROR", recoverable: true, retryable: false },
}

// Field validation failures are corrected by fixing the field (fix_input), not retryable.
const VALIDATION_ERROR_META: Record<ValidationErrorCode, ErrorMeta> = {
  IMAGE_REQUIRED: { category: "VALIDATION_ERROR", recoverable: true, retryable: false },
  FIELD_REQUIRED: { category: "VALIDATION_ERROR", recoverable: true, retryable: false },
  INVALID_OPTION_VALUE: { category: "VALIDATION_ERROR", recoverable: true, retryable: false },
  CUSTOM_STYLE_REQUIRED: { category: "VALIDATION_ERROR", recoverable: true, retryable: false },
  CUSTOM_STYLE_TOO_LONG: { category: "VALIDATION_ERROR", recoverable: true, retryable: false },
  INVALID_SERVICE_CITY: { category: "VALIDATION_ERROR", recoverable: true, retryable: false },
  INVALID_SQUARE_FOOTAGE: { category: "VALIDATION_ERROR", recoverable: true, retryable: false },
}

export function toGenerationAppError(error: GenerationError, requestId: string | null): AppError {
  const meta = GENERATION_ERROR_META[error.code]
  return { category: meta.category, code: error.code, message: error.message, recoverable: meta.recoverable, retryable: meta.retryable, requestId, field: null }
}

export function toResultAppError(error: ResultError, requestId: string | null): AppError {
  const meta = RESULT_ERROR_META[error.code]
  return { category: meta.category, code: error.code, message: error.message, recoverable: meta.recoverable, retryable: meta.retryable, requestId, field: null }
}

export function toUploadAppError(error: UploadError): AppError {
  const meta = UPLOAD_ERROR_META[error.code]
  return { category: meta.category, code: error.code, message: error.message, recoverable: meta.recoverable, retryable: meta.retryable, requestId: null, field: null }
}

export function toValidationAppError(field: ValidationFieldKey, error: FieldError): AppError {
  const meta = VALIDATION_ERROR_META[error.code]
  return { category: meta.category, code: error.code, message: error.message, recoverable: meta.recoverable, retryable: meta.retryable, requestId: null, field }
}

// The one genuinely new error shape (§36-38, ERR-015): a safe fallback for a
// thrown value that isn't one of the application's own known error contracts —
// a truly unexpected runtime exception. Never assumes the thrown value is an
// `Error` instance; it can be a string, a plain object, null, or anything else.
export function normalizeUnknownError(error: unknown, context: { requestId: string | null }): AppError {
  return {
    category: "UNKNOWN_ERROR",
    code: "UNKNOWN_ERROR",
    // §37 — do not guess or invent a root cause the application never verified.
    message: "We couldn't complete this visualization. Please try again.",
    recoverable: true,
    retryable: true,
    requestId: context.requestId,
    field: null,
  }
}

// Development-safe logging (§40-42, ERR-017): only ever prints category, code,
// and requestId from the normalized AppError — never the uploaded image,
// form/options data, or any raw provider payload. `cause` is accepted
// separately (console-only, never part of the AppError contract users/UI ever
// see) so a genuinely unexpected exception can still be inspected locally.
export function logVisualizerError(appError: AppError, context?: { phase?: string; cause?: unknown }): void {
  const label = `[visualizer:${context?.phase ?? appError.category.toLowerCase()}]`
  const summary = `category=${appError.category} code=${appError.code} requestId=${appError.requestId ?? "none"}`
  const log = appError.category === "UNKNOWN_ERROR" ? console.error : console.warn
  if (context && "cause" in context) {
    log(label, summary, context.cause)
  } else {
    log(label, summary)
  }
}
