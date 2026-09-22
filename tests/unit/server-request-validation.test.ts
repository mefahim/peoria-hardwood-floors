// Phase 8 — Testing: Server-side request boundary (04-PHASE-GENERATE.md §28)
// Tests lib/visualizer/server-request-validation.ts — the re-validation the
// API route runs on every incoming request, independent of client trust.

import { describe, expect, it } from "vitest"
import { validateGenerationImagePayload, validateGenerationOptionsPayload } from "@/lib/visualizer/server-request-validation"
import { UPLOAD_CONSTRAINTS } from "@/lib/visualizer/image-upload"
import type { VisualizerOptions } from "@/lib/visualizer/options"

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

describe("validateGenerationOptionsPayload", () => {
  it("accepts a fully valid options payload", () => {
    expect(validateGenerationOptionsPayload(validOptions).valid).toBe(true)
  })

  it("rejects a non-object payload", () => {
    expect(validateGenerationOptionsPayload(null).valid).toBe(false)
    expect(validateGenerationOptionsPayload("not an object").valid).toBe(false)
    expect(validateGenerationOptionsPayload(undefined).valid).toBe(false)
  })

  it("rejects a payload missing a required field", () => {
    const { roomType: _roomType, ...rest } = validOptions
    expect(validateGenerationOptionsPayload(rest).valid).toBe(false)
  })

  it("rejects a payload with an out-of-enum value (a malicious/forged client can't bypass this)", () => {
    expect(validateGenerationOptionsPayload({ ...validOptions, roomType: "<script>alert(1)</script>" }).valid).toBe(false)
  })

  it("rejects custom style selected without a description, even if the client claimed it validated", () => {
    expect(validateGenerationOptionsPayload({ ...validOptions, preferredStyle: "custom", customStyleDescription: "" }).valid).toBe(false)
  })
})

describe("validateGenerationImagePayload", () => {
  it("accepts a well-formed image blob", () => {
    const file = new Blob([new Uint8Array(1000)], { type: "image/jpeg" })
    expect(validateGenerationImagePayload(file).valid).toBe(true)
  })

  it("rejects a non-Blob value", () => {
    expect(validateGenerationImagePayload("not a file").valid).toBe(false)
    expect(validateGenerationImagePayload(null).valid).toBe(false)
  })

  it("rejects an empty (zero-byte) file", () => {
    const file = new Blob([], { type: "image/jpeg" })
    expect(validateGenerationImagePayload(file).valid).toBe(false)
  })

  it("rejects an unsupported MIME type even if the client already claims otherwise", () => {
    const file = new Blob([new Uint8Array(1000)], { type: "application/pdf" })
    expect(validateGenerationImagePayload(file).valid).toBe(false)
  })

  it("rejects a file over the server-side size limit", () => {
    const file = new Blob([new Uint8Array(UPLOAD_CONSTRAINTS.maxFileSizeBytes + 1)], { type: "image/jpeg" })
    expect(validateGenerationImagePayload(file).valid).toBe(false)
  })
})
