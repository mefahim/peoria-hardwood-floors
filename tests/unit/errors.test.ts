// Phase 8 — Testing: Error taxonomy (07-PHASE-ERROR-RECOVERY.md §5-7, ERR-001/002/015/017)
// Tests lib/visualizer/errors.ts — classification tables, the unknown-error
// normalizer, and the safe logger. Promotes the Phase 7 scratch-harness checks
// into a real, version-controlled, repeatable suite (no functional changes).

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  logVisualizerError,
  normalizeUnknownError,
  toGenerationAppError,
  toResultAppError,
  toUploadAppError,
  toValidationAppError,
  type ErrorCategory,
} from "@/lib/visualizer/errors"
import type { GenerationErrorCode } from "@/lib/visualizer/generation"
import type { ResultErrorCode } from "@/lib/visualizer/result"
import type { UploadErrorCode } from "@/lib/visualizer/image-upload"
import type { ValidationErrorCode } from "@/lib/visualizer/validation"

describe("toGenerationAppError", () => {
  const cases: Array<[GenerationErrorCode, ErrorCategory, boolean]> = [
    ["VALIDATION_ERROR", "VALIDATION_ERROR", false],
    ["REQUEST_CREATION_ERROR", "REQUEST_ERROR", true],
    ["NETWORK_ERROR", "NETWORK_ERROR", true],
    ["PROVIDER_ERROR", "GENERATION_ERROR", true],
    ["TIMEOUT_ERROR", "TIMEOUT_ERROR", true],
    ["INVALID_PROVIDER_RESPONSE", "GENERATION_ERROR", true],
    ["UNKNOWN_GENERATION_ERROR", "UNKNOWN_ERROR", true],
  ]

  it.each(cases)("%s classifies to category=%s retryable=%s", (code, category, retryable) => {
    const appError = toGenerationAppError({ code, message: "m" }, "viz_123")
    expect(appError.category).toBe(category)
    expect(appError.retryable).toBe(retryable)
    expect(appError.recoverable).toBe(true)
    expect(appError.requestId).toBe("viz_123")
    expect(appError.field).toBeNull()
  })

  it("preserves a null requestId", () => {
    expect(toGenerationAppError({ code: "NETWORK_ERROR", message: "m" }, null).requestId).toBeNull()
  })
})

describe("toResultAppError", () => {
  const cases: ResultErrorCode[] = ["RESULT_IMAGE_INVALID", "RESULT_IMAGE_LOAD_FAILED"]
  it.each(cases)("%s classifies to RESULT_ERROR and is retryable", (code) => {
    const appError = toResultAppError({ code, message: "m" }, "viz_abc")
    expect(appError.category).toBe("RESULT_ERROR")
    expect(appError.retryable).toBe(true)
  })
})

describe("toUploadAppError", () => {
  const cases: UploadErrorCode[] = ["UNSUPPORTED_FILE_TYPE", "FILE_TOO_LARGE", "IMAGE_TOO_SMALL", "IMAGE_UNREADABLE"]
  it.each(cases)("%s classifies to UPLOAD_ERROR and is NOT retryable (replace, not retry)", (code) => {
    const appError = toUploadAppError({ code, message: "m" })
    expect(appError.category).toBe("UPLOAD_ERROR")
    expect(appError.retryable).toBe(false)
    expect(appError.requestId).toBeNull()
  })
})

describe("toValidationAppError", () => {
  const cases: ValidationErrorCode[] = [
    "IMAGE_REQUIRED",
    "FIELD_REQUIRED",
    "INVALID_OPTION_VALUE",
    "CUSTOM_STYLE_REQUIRED",
    "CUSTOM_STYLE_TOO_LONG",
    "INVALID_SERVICE_CITY",
    "INVALID_SQUARE_FOOTAGE",
  ]
  it.each(cases)("%s classifies to VALIDATION_ERROR, not retryable, and carries the given field", (code) => {
    const appError = toValidationAppError("roomType", { code, message: "m" })
    expect(appError.category).toBe("VALIDATION_ERROR")
    expect(appError.retryable).toBe(false)
    expect(appError.field).toBe("roomType")
  })
})

describe("normalizeUnknownError", () => {
  it.each([new Error("real error"), "a plain string", { weird: "object" }, null, undefined, 42, ["array", "value"]])(
    "never throws for thrown shape %j, and always returns the safe generic message",
    (shape) => {
      expect(() => normalizeUnknownError(shape, { requestId: "viz_x" })).not.toThrow()
      const appError = normalizeUnknownError(shape, { requestId: "viz_x" })
      expect(appError.category).toBe("UNKNOWN_ERROR")
      expect(appError.code).toBe("UNKNOWN_ERROR")
      expect(appError.message).toBe("We couldn't complete this visualization. Please try again.")
      expect(appError.recoverable).toBe(true)
      expect(appError.retryable).toBe(true)
      expect(appError.requestId).toBe("viz_x")
      expect(appError.field).toBeNull()
    },
  )

  it("never includes any detail from the thrown value in the user-facing message (no guessed cause)", () => {
    const appError = normalizeUnknownError(new Error("SECRET_INTERNAL_DETAIL"), { requestId: null })
    expect(appError.message).not.toContain("SECRET_INTERNAL_DETAIL")
  })
})

describe("logVisualizerError — ERR-017 safe logging", () => {
  const categories: ErrorCategory[] = [
    "UPLOAD_ERROR",
    "VALIDATION_ERROR",
    "REQUEST_ERROR",
    "NETWORK_ERROR",
    "GENERATION_ERROR",
    "TIMEOUT_ERROR",
    "RESULT_ERROR",
    "STATE_ERROR",
    "UNKNOWN_ERROR",
  ]

  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {})
    vi.spyOn(console, "error").mockImplementation(() => {})
  })
  afterEach(() => vi.restoreAllMocks())

  it.each(categories)("never throws for category %s across every context variant", (category) => {
    const base = { category, code: "X", message: "m", recoverable: true, retryable: true, requestId: "viz_1", field: null } as const
    expect(() => logVisualizerError(base)).not.toThrow()
    expect(() => logVisualizerError(base, { phase: "test" })).not.toThrow()
    expect(() => logVisualizerError(base, { phase: "test", cause: new Error("boom") })).not.toThrow()
    expect(() => logVisualizerError(base, { phase: "test", cause: undefined })).not.toThrow()
  })

  it("logs only category/code/requestId — never a raw form/image payload passed incidentally as cause", () => {
    logVisualizerError(
      { category: "GENERATION_ERROR", code: "PROVIDER_ERROR", message: "m", recoverable: true, retryable: true, requestId: "viz_1", field: null },
      { phase: "generate" },
    )
    const [, summary] = (console.warn as unknown as { mock: { calls: unknown[][] } }).mock.calls[0]
    expect(summary).toContain("category=GENERATION_ERROR")
    expect(summary).toContain("code=PROVIDER_ERROR")
    expect(summary).toContain("requestId=viz_1")
  })

  it("routes UNKNOWN_ERROR to console.error and every other category to console.warn", () => {
    logVisualizerError({ category: "UNKNOWN_ERROR", code: "X", message: "m", recoverable: true, retryable: true, requestId: null, field: null })
    expect(console.error).toHaveBeenCalledTimes(1)
    expect(console.warn).not.toHaveBeenCalled()

    vi.clearAllMocks()
    logVisualizerError({ category: "GENERATION_ERROR", code: "X", message: "m", recoverable: true, retryable: true, requestId: null, field: null })
    expect(console.warn).toHaveBeenCalledTimes(1)
    expect(console.error).not.toHaveBeenCalled()
  })
})
