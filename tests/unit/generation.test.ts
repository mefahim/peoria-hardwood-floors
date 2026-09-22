// Phase 8 — Testing: Generation core (visualizer-docs/08-PHASE-TESTING.md §18,§20-21)
// Tests lib/visualizer/generation.ts — request ID generation, snapshot
// creation/immutability, provider-response normalization, and the
// stale-response guard shared by Generate and Retry.

import { describe, expect, it, vi } from "vitest"
import {
  buildGenerationSnapshot,
  createRequestId,
  GENERATION_ERROR_MESSAGES,
  normalizeProviderResult,
  shouldApplyGenerationResponse,
} from "@/lib/visualizer/generation"
import type { ValidatedVisualizerData } from "@/lib/visualizer/validation"
import type { NormalizedImage } from "@/lib/visualizer/image-upload"
import type { VisualizerOptions } from "@/lib/visualizer/options"

const image: NormalizedImage = {
  source: new File(["x"], "photo.jpg", { type: "image/jpeg" }),
  previewUrl: "blob:http://localhost/abc",
  fileName: "photo.jpg",
  mimeType: "image/jpeg",
  size: 123,
  width: 1200,
  height: 900,
}

const options: VisualizerOptions = {
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

const validatedData: ValidatedVisualizerData = { image, options }

describe("createRequestId", () => {
  it("always returns a viz_-prefixed string", () => {
    expect(createRequestId()).toMatch(/^viz_/)
  })

  it("never produces a filename-derived or otherwise obviously guessable ID", () => {
    const id = createRequestId()
    expect(id).not.toContain("photo.jpg")
  })

  // GEN-008 / RET-003 — every attempt (Generate or Retry) gets its own unique ID.
  it("produces 1000 unique IDs with no collisions", () => {
    const ids = Array.from({ length: 1000 }, () => createRequestId())
    expect(new Set(ids).size).toBe(1000)
  })

  it("still produces a valid, unique, viz_-prefixed ID via the fallback path when crypto.randomUUID is unavailable", () => {
    vi.stubGlobal("crypto", { ...globalThis.crypto, randomUUID: undefined })
    try {
      const ids = Array.from({ length: 50 }, () => createRequestId())
      for (const id of ids) expect(id).toMatch(/^viz_/)
      expect(new Set(ids).size).toBe(50)
    } finally {
      vi.unstubAllGlobals()
    }
  })
})

describe("buildGenerationSnapshot", () => {
  it("carries the requestId, image, and options through unchanged", () => {
    const requestId = createRequestId()
    const snapshot = buildGenerationSnapshot(requestId, validatedData)
    expect(snapshot.requestId).toBe(requestId)
    expect(snapshot.image).toEqual(image)
    expect(snapshot.options).toEqual(options)
    expect(typeof snapshot.createdAt).toBe("number")
  })

  // 06-PHASE-RETRY.md §19 Snapshot Immutability — proven at every level.
  it("is deeply frozen: top-level, image, and options", () => {
    const snapshot = buildGenerationSnapshot(createRequestId(), validatedData)
    expect(Object.isFrozen(snapshot)).toBe(true)
    expect(Object.isFrozen(snapshot.image)).toBe(true)
    expect(Object.isFrozen(snapshot.options)).toBe(true)
  })

  it("throws on a mutation attempt in strict mode, and the value never actually changes", () => {
    const snapshot = buildGenerationSnapshot(createRequestId(), validatedData)
    expect(() => {
      // Frozen at runtime (Object.freeze) even though the static type doesn't mark it readonly.
      snapshot.options.roomType = "bedroom"
    }).toThrow()
    expect(snapshot.options.roomType).toBe("kitchen")
  })

  // §8/§17 Retry Snapshot Integrity — changing the source data object AFTER
  // the snapshot was built must not retroactively change the snapshot (the
  // snapshot spreads image/options into new objects, not references).
  it("is unaffected by later mutation of the original options object", () => {
    const mutableOptions = { ...options }
    const data: ValidatedVisualizerData = { image, options: mutableOptions }
    const snapshot = buildGenerationSnapshot(createRequestId(), data)
    mutableOptions.roomType = "bedroom"
    expect(snapshot.options.roomType).toBe("kitchen")
  })
})

describe("normalizeProviderResult", () => {
  const requestId = "viz_expected"

  it("accepts a well-formed success response", () => {
    const result = normalizeProviderResult({ requestId, status: "success", result: { imageUrl: "/mock/x.jpg" }, error: null }, requestId)
    expect(result.status).toBe("success")
    expect(result.result?.imageUrl).toBe("/mock/x.jpg")
    expect(result.error).toBeNull()
  })

  // GEN-TEST-007 — success-shaped but missing the image URL must NOT become SUCCESS.
  it("rejects a success status with a missing result object", () => {
    const result = normalizeProviderResult({ requestId, status: "success", result: null, error: null }, requestId)
    expect(result.status).toBe("error")
    expect(result.error?.code).toBe("INVALID_PROVIDER_RESPONSE")
  })

  it("rejects a success status with an empty imageUrl", () => {
    const result = normalizeProviderResult({ requestId, status: "success", result: { imageUrl: "   " }, error: null }, requestId)
    expect(result.status).toBe("error")
    expect(result.error?.code).toBe("INVALID_PROVIDER_RESPONSE")
  })

  it("rejects a response whose requestId does not match the expected one", () => {
    const result = normalizeProviderResult({ requestId: "viz_other", status: "success", result: { imageUrl: "/x.jpg" }, error: null }, requestId)
    expect(result.status).toBe("error")
    expect(result.error?.code).toBe("INVALID_PROVIDER_RESPONSE")
  })

  it.each([null, undefined, "a string", 42, [], true])("normalizes a completely malformed raw payload (%j) without throwing", (raw) => {
    expect(() => normalizeProviderResult(raw, requestId)).not.toThrow()
    const result = normalizeProviderResult(raw, requestId)
    expect(result.status).toBe("error")
    expect(result.error?.code).toBe("INVALID_PROVIDER_RESPONSE")
  })

  it("passes through an error status with a known code and the approved user-facing message (never the provider's raw message)", () => {
    const result = normalizeProviderResult(
      { requestId, status: "error", result: null, error: { code: "PROVIDER_ERROR", message: "some internal vendor string" } },
      requestId,
    )
    expect(result.status).toBe("error")
    expect(result.error?.code).toBe("PROVIDER_ERROR")
    expect(result.error?.message).toBe(GENERATION_ERROR_MESSAGES.PROVIDER_ERROR)
    expect(result.error?.message).not.toContain("some internal vendor string")
  })

  it("falls back to UNKNOWN_GENERATION_ERROR for an unrecognized error code", () => {
    const result = normalizeProviderResult({ requestId, status: "error", result: null, error: { code: "SOMETHING_MADE_UP", message: "x" } }, requestId)
    expect(result.error?.code).toBe("UNKNOWN_GENERATION_ERROR")
  })

  it("passes through a timeout status correctly", () => {
    const result = normalizeProviderResult({ requestId, status: "timeout", result: null, error: { code: "TIMEOUT_ERROR", message: "x" } }, requestId)
    expect(result.status).toBe("timeout")
    expect(result.error?.code).toBe("TIMEOUT_ERROR")
  })

  it("rejects an unrecognized status string", () => {
    const result = normalizeProviderResult({ requestId, status: "pending", result: null, error: null }, requestId)
    expect(result.status).toBe("error")
    expect(result.error?.code).toBe("INVALID_PROVIDER_RESPONSE")
  })
})

describe("shouldApplyGenerationResponse — GEN-009/RET-008 stale-response guard", () => {
  it("applies a response whose requestId matches the active one", () => {
    expect(shouldApplyGenerationResponse("viz_A", "viz_A")).toBe(true)
  })

  it("rejects a response whose requestId does not match the active one (stale)", () => {
    expect(shouldApplyGenerationResponse("viz_A", "viz_B")).toBe(false)
  })

  it("rejects any response when there is no active request", () => {
    expect(shouldApplyGenerationResponse(null, "viz_A")).toBe(false)
  })

  it("simulates: Request A starts, Request B (Retry) becomes active, A's late response is rejected, B's response is accepted", () => {
    const requestA = createRequestId()
    const requestB = createRequestId()
    const activeRequestId = requestB // B started later and is now authoritative
    expect(shouldApplyGenerationResponse(activeRequestId, requestA)).toBe(false)
    expect(shouldApplyGenerationResponse(activeRequestId, requestB)).toBe(true)
  })
})
