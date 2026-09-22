// Phase 8 — Testing: Validation (visualizer-docs/08-PHASE-TESTING.md §16-17, VAL-T-001..010)
// Tests the canonical gate lib/visualizer/validation.ts — every generation
// attempt (Generate or Retry) passes through this exact function.

import { describe, expect, it } from "vitest"
import {
  CUSTOM_STYLE_DESCRIPTION_MAX_LENGTH,
  validateCustomStyleDescription,
  validateServiceCity,
  validateSquareFootage,
  validateVisualizerInput,
} from "@/lib/visualizer/validation"
import { CUSTOM_STYLE_VALUE, INITIAL_VISUALIZER_OPTIONS, SERVICE_CITY_OPTIONS, type VisualizerOptions } from "@/lib/visualizer/options"
import type { NormalizedImage } from "@/lib/visualizer/image-upload"

const validImage: NormalizedImage = {
  source: new File(["x"], "photo.jpg", { type: "image/jpeg" }),
  previewUrl: "blob:http://localhost/abc",
  fileName: "photo.jpg",
  mimeType: "image/jpeg",
  size: 12345,
  width: 1200,
  height: 900,
}

const validOptions: VisualizerOptions = {
  roomType: "kitchen",
  projectType: "new_installation",
  preferredStyle: "warm_traditional",
  customStyleDescription: "",
  woodSpecies: "oak",
  floorDirection: "parallel",
  finishPreference: "bona_traffic_hd",
  sheen: "satin",
  serviceCity: null,
  squareFootage: null,
}

describe("validateVisualizerInput — VAL-T-001 complete valid state", () => {
  it("is valid with a complete state, and returns normalized data", () => {
    const result = validateVisualizerInput({ image: validImage, options: validOptions })
    expect(result.valid).toBe(true)
    expect(result.errors).toEqual({})
    expect(result.summary).toBeNull()
    expect(result.data).toEqual({ image: validImage, options: validOptions })
  })
})

describe("validateVisualizerInput — VAL-T-002 missing image", () => {
  it("is invalid when image is null", () => {
    const result = validateVisualizerInput({ image: null, options: validOptions })
    expect(result.valid).toBe(false)
    expect(result.errors.image?.code).toBe("IMAGE_REQUIRED")
    expect(result.data).toBeNull()
  })
})

describe("validateVisualizerInput — VAL-T-003 missing required fields", () => {
  it.each(["roomType", "projectType", "preferredStyle", "woodSpecies", "floorDirection", "finishPreference", "sheen"] as const)(
    "is invalid when %s is null",
    (field) => {
      const options = { ...validOptions, [field]: null }
      const result = validateVisualizerInput({ image: validImage, options })
      expect(result.valid).toBe(false)
      expect(result.errors[field]?.code).toBe("FIELD_REQUIRED")
    },
  )

  it("VAL-T-008 — multiple missing fields all produce distinct errors in one pass", () => {
    const result = validateVisualizerInput({ image: null, options: INITIAL_VISUALIZER_OPTIONS })
    expect(result.valid).toBe(false)
    expect(Object.keys(result.errors).sort()).toEqual(
      ["image", "roomType", "projectType", "preferredStyle", "woodSpecies", "floorDirection", "finishPreference", "sheen"].sort(),
    )
  })
})

describe("validateVisualizerInput — VAL-T-004 invalid controlled values", () => {
  it.each(["roomType", "projectType", "preferredStyle", "woodSpecies", "floorDirection", "finishPreference", "sheen"] as const)(
    "is invalid when %s is a value outside its canonical set",
    (field) => {
      const options = { ...validOptions, [field]: "not_a_real_value" } as unknown as VisualizerOptions
      const result = validateVisualizerInput({ image: validImage, options })
      expect(result.valid).toBe(false)
      expect(result.errors[field]?.code).toBe("INVALID_OPTION_VALUE")
    },
  )
})

describe("validateVisualizerInput — VAL-T-005 valid 'unsure' values", () => {
  it("accepts 'unsure' for floorDirection, finishPreference, and sheen", () => {
    const result = validateVisualizerInput({
      image: validImage,
      options: { ...validOptions, floorDirection: "unsure", finishPreference: "unsure", sheen: "unsure" },
    })
    expect(result.valid).toBe(true)
  })
})

describe("validateVisualizerInput — VAL-T-006 custom style", () => {
  it("requires a description when preferredStyle is custom", () => {
    const result = validateVisualizerInput({ image: validImage, options: { ...validOptions, preferredStyle: CUSTOM_STYLE_VALUE, customStyleDescription: "" } })
    expect(result.valid).toBe(false)
    expect(result.errors.customStyleDescription?.code).toBe("CUSTOM_STYLE_REQUIRED")
  })

  it("rejects a whitespace-only description when custom is selected", () => {
    const result = validateVisualizerInput({ image: validImage, options: { ...validOptions, preferredStyle: CUSTOM_STYLE_VALUE, customStyleDescription: "   " } })
    expect(result.valid).toBe(false)
    expect(result.errors.customStyleDescription?.code).toBe("CUSTOM_STYLE_REQUIRED")
  })

  it("accepts a valid trimmed description when custom is selected, and trims it in the output data", () => {
    const result = validateVisualizerInput({
      image: validImage,
      options: { ...validOptions, preferredStyle: CUSTOM_STYLE_VALUE, customStyleDescription: "  Warm medium oak  " },
    })
    expect(result.valid).toBe(true)
    expect(result.data?.options.customStyleDescription).toBe("Warm medium oak")
  })

  it("rejects a description longer than the configured max length", () => {
    const tooLong = "a".repeat(CUSTOM_STYLE_DESCRIPTION_MAX_LENGTH + 1)
    const error = validateCustomStyleDescription(CUSTOM_STYLE_VALUE, tooLong)
    expect(error?.code).toBe("CUSTOM_STYLE_TOO_LONG")
  })

  it("accepts a description exactly at the max length", () => {
    const atLimit = "a".repeat(CUSTOM_STYLE_DESCRIPTION_MAX_LENGTH)
    expect(validateCustomStyleDescription(CUSTOM_STYLE_VALUE, atLimit)).toBeNull()
  })

  it("does not require a description when a non-custom style is selected, even if empty", () => {
    expect(validateCustomStyleDescription("warm_traditional", "")).toBeNull()
  })
})

describe("validateServiceCity", () => {
  it("is valid (optional) when null/undefined/empty", () => {
    expect(validateServiceCity(null)).toBeNull()
    expect(validateServiceCity(undefined)).toBeNull()
    expect(validateServiceCity("")).toBeNull()
  })

  it("accepts every canonical service city slug", () => {
    for (const option of SERVICE_CITY_OPTIONS) {
      expect(validateServiceCity(option.value)).toBeNull()
    }
  })

  it("rejects an unknown service city", () => {
    expect(validateServiceCity("atlantis")?.code).toBe("INVALID_SERVICE_CITY")
  })
})

describe("validateSquareFootage — VAL-T-007 and the full numeric matrix (08-PHASE-TESTING.md §15)", () => {
  it("is valid (optional) when null/undefined", () => {
    expect(validateSquareFootage(null)).toBeNull()
    expect(validateSquareFootage(undefined)).toBeNull()
  })

  it.each([
    [1200, true],
    [0.5, true],
    [0, false],
    [-100, false],
    [NaN, false],
    [Infinity, false],
    [-Infinity, false],
  ])("validateSquareFootage(%j) valid=%s", (value, expectedValid) => {
    const error = validateSquareFootage(value)
    expect(error === null).toBe(expectedValid)
    if (!expectedValid) expect(error?.code).toBe("INVALID_SQUARE_FOOTAGE")
  })

  // The validator receives already-normalized data from options.ts's
  // normalizeSquareFootageInput in the real UI, so raw strings like "abc" are
  // a defensive/non-UI-reachable case — still must never crash or accept.
  it("rejects a non-number type defensively (e.g. a raw string slipping through)", () => {
    expect(validateSquareFootage("1200" as unknown as number)?.code).toBe("INVALID_SQUARE_FOOTAGE")
  })
})

describe("validateVisualizerInput — VAL-T-009 malformed state never throws", () => {
  it("handles a completely empty/malformed state without crashing", () => {
    expect(() => validateVisualizerInput({ image: null, options: {} as VisualizerOptions })).not.toThrow()
    const result = validateVisualizerInput({ image: null, options: {} as VisualizerOptions })
    expect(result.valid).toBe(false)
  })

  it("handles undefined options without crashing", () => {
    expect(() => validateVisualizerInput({ image: null, options: undefined as unknown as VisualizerOptions })).not.toThrow()
  })
})

describe("validateVisualizerInput — VAL-T-010 corrected state passes, and has no side effects", () => {
  it("transitions from invalid to valid once every field is corrected, without mutating the input objects", () => {
    const originalOptions = { ...INITIAL_VISUALIZER_OPTIONS }
    const invalid = validateVisualizerInput({ image: null, options: originalOptions })
    expect(invalid.valid).toBe(false)
    // §18 Request Builder invariant — validating must never mutate the caller's state.
    expect(originalOptions).toEqual(INITIAL_VISUALIZER_OPTIONS)

    const corrected = validateVisualizerInput({ image: validImage, options: validOptions })
    expect(corrected.valid).toBe(true)
  })

  // §17 Validation Invariants — a square-footage/service-city error must not
  // bleed into unrelated required-option field errors.
  it("VAL scope — an invalid optional field does not produce errors on unrelated required fields", () => {
    const result = validateVisualizerInput({ image: validImage, options: { ...validOptions, squareFootage: -5 } })
    expect(result.valid).toBe(false)
    expect(Object.keys(result.errors)).toEqual(["squareFootage"])
  })
})
