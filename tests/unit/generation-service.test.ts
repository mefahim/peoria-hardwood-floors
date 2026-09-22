// Phase 8 — Testing: Generation Service (08-PHASE-TESTING.md §4, GEN-TEST-*)
// Tests lib/visualizer/generation-service.ts against the REAL, unmodified
// MockVisualizationProvider — the actual deterministic provider the app ships
// with, not a second/fake stand-in for it. Uses fake timers (08-PHASE-TESTING.md
// §62) so the real ~1.4s mock delay and 8s service timeout don't slow the suite.

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { generateVisualization } from "@/lib/visualizer/generation-service"
import { MockVisualizationProvider } from "@/lib/visualizer/providers/mock-visualization-provider"
import type { VisualizationProviderRequest } from "@/lib/visualizer/providers/types"
import { GENERATION_TIMEOUT_MS } from "@/lib/visualizer/generation"

function makeRequest(requestId: string): VisualizationProviderRequest {
  return {
    requestId,
    image: { fileName: "room.jpg", mimeType: "image/jpeg", width: 1200, height: 900, file: new Blob(["x"], { type: "image/jpeg" }) },
    options: {
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
    },
  }
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe("generateVisualization + MockVisualizationProvider", () => {
  it("GEN-TEST-001 — success mode resolves with a valid normalized result", async () => {
    const requestId = "viz_success_1"
    const provider = new MockVisualizationProvider("success", GENERATION_TIMEOUT_MS)
    const promise = generateVisualization(makeRequest(requestId), provider)
    await vi.advanceTimersByTimeAsync(2000)
    const result = await promise
    expect(result.status).toBe("success")
    expect(result.requestId).toBe(requestId)
    expect(typeof result.result?.imageUrl).toBe("string")
    expect(result.result?.imageUrl.length).toBeGreaterThan(0)
    expect(result.error).toBeNull()
  })

  it("GEN-TEST-005 — error mode resolves with a normalized error, never a false success", async () => {
    const requestId = "viz_error_1"
    const provider = new MockVisualizationProvider("error", GENERATION_TIMEOUT_MS)
    const promise = generateVisualization(makeRequest(requestId), provider)
    await vi.advanceTimersByTimeAsync(2000)
    const result = await promise
    expect(result.status).toBe("error")
    expect(result.result).toBeNull()
    expect(result.error).not.toBeNull()
  })

  it("GEN-TEST-006 — timeout mode is reported as TIMEOUT, never success or a stuck promise", async () => {
    const requestId = "viz_timeout_1"
    const provider = new MockVisualizationProvider("timeout", GENERATION_TIMEOUT_MS)
    const promise = generateVisualization(makeRequest(requestId), provider)
    await vi.advanceTimersByTimeAsync(GENERATION_TIMEOUT_MS + 100)
    const result = await promise
    expect(result.status).toBe("timeout")
    expect(result.result).toBeNull()
    expect(result.error?.code).toBe("TIMEOUT_ERROR")
  })

  it("GEN-TEST-007 — malformed_success mode (missing result) is normalized to an error, never SUCCESS", async () => {
    const requestId = "viz_malformed_1"
    const provider = new MockVisualizationProvider("malformed_success", GENERATION_TIMEOUT_MS)
    const promise = generateVisualization(makeRequest(requestId), provider)
    await vi.advanceTimersByTimeAsync(2000)
    const result = await promise
    expect(result.status).toBe("error")
    expect(result.error?.code).toBe("INVALID_PROVIDER_RESPONSE")
  })

  it("request ID propagates unchanged through the full service round-trip", async () => {
    const requestId = "viz_propagation_check_123"
    const provider = new MockVisualizationProvider("success", GENERATION_TIMEOUT_MS)
    const promise = generateVisualization(makeRequest(requestId), provider)
    await vi.advanceTimersByTimeAsync(2000)
    const result = await promise
    expect(result.requestId).toBe(requestId)
  })

  it("a provider that throws synchronously is converted to a normalized PROVIDER_ERROR, not an unhandled rejection", async () => {
    const throwingProvider = { generate: async () => { throw new Error("boom") } }
    const promise = generateVisualization(makeRequest("viz_throw"), throwingProvider)
    await vi.advanceTimersByTimeAsync(100)
    const result = await promise
    expect(result.status).toBe("error")
    expect(result.error?.code).toBe("PROVIDER_ERROR")
  })

  it("each call is independent — invoking twice produces two distinct results, no shared/leaked state", async () => {
    const provider = new MockVisualizationProvider("success", GENERATION_TIMEOUT_MS)
    const first = generateVisualization(makeRequest("viz_first"), provider)
    await vi.advanceTimersByTimeAsync(2000)
    const firstResult = await first

    const second = generateVisualization(makeRequest("viz_second"), provider)
    await vi.advanceTimersByTimeAsync(2000)
    const secondResult = await second

    expect(firstResult.requestId).toBe("viz_first")
    expect(secondResult.requestId).toBe("viz_second")
  })
})

describe("MockVisualizationProvider — provider invocation semantics", () => {
  it("calling generate() does not mutate the input request object", async () => {
    vi.useRealTimers()
    const provider = new MockVisualizationProvider("success", 100)
    const request = makeRequest("viz_no_mutate")
    const requestSnapshot = JSON.parse(JSON.stringify({ ...request, image: { ...request.image, file: undefined } }))
    await provider.generate(request)
    const afterSnapshot = JSON.parse(JSON.stringify({ ...request, image: { ...request.image, file: undefined } }))
    expect(afterSnapshot).toEqual(requestSnapshot)
  }, 3000)
})
