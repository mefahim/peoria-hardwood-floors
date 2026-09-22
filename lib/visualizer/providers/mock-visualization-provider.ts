// Phase 4 — Mock Visualization Provider (visualizer-docs/04-PHASE-GENERATE.md §12-15)
// Deterministic, dependency-free stand-in for a real image-editing AI provider.
// Makes NO external network/API calls and requires NO credentials. It exists so
// the entire generation lifecycle (success, error, timeout, malformed response)
// can be built and tested before a real provider is ever connected.
//
// Server-only: this module must never be imported by a client component. The
// UI only ever talks to the VisualizationProvider abstraction through the
// generation service (lib/visualizer/generation-service.ts) inside the API route.

import type { VisualizationProvider, VisualizationProviderRequest } from "@/lib/visualizer/providers/types"
import type { VisualizationProviderResponse } from "@/lib/visualizer/generation"

// Development/testing-only modes (never a user-facing production feature — see
// app/api/visualizer/route.ts for how these are gated to non-production only).
// MOCK_MALFORMED_SUCCESS exists purely to exercise the "success with a missing
// result" rejection path (04-PHASE-GENERATE.md GEN-TEST-007) deterministically.
export type MockProviderMode = "success" | "error" | "timeout" | "malformed_success"

const MOCK_PROCESSING_DELAY_MS = 1400
const MOCK_ERROR_DELAY_MS = 900

// Deliberately longer than the generation service's own timeout race
// (GENERATION_TIMEOUT_MS) so MOCK_TIMEOUT reliably exercises the TIMEOUT branch
// rather than racing against it.
const MOCK_TIMEOUT_DELAY_MS_OFFSET = 5000

// An existing project asset, reused as the mock "generated" result image. This
// is explicitly a development/test placeholder — not a real AI-edited photo —
// per §13's requirement to never fabricate a nonexistent/remote image URL.
const MOCK_RESULT_IMAGE_URL = "/images/hero-kitchen.png"

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export class MockVisualizationProvider implements VisualizationProvider {
  private readonly mode: MockProviderMode
  private readonly generationTimeoutMs: number

  constructor(mode: MockProviderMode = "success", generationTimeoutMs: number = 0) {
    this.mode = mode
    this.generationTimeoutMs = generationTimeoutMs
  }

  async generate(request: VisualizationProviderRequest): Promise<VisualizationProviderResponse> {
    if (this.mode === "error") {
      await delay(MOCK_ERROR_DELAY_MS)
      return {
        requestId: request.requestId,
        status: "error",
        result: null,
        error: { code: "PROVIDER_ERROR", message: "Mock generation failure." },
      }
    }

    if (this.mode === "timeout") {
      await delay(this.generationTimeoutMs + MOCK_TIMEOUT_DELAY_MS_OFFSET)
      // Unreachable in practice: the generation service's own timeout race
      // (see lib/visualizer/generation-service.ts) always wins first and
      // returns a TIMEOUT result before this resolves. Included so the
      // provider still behaves like a real (if very slow) provider rather
      // than one that hangs forever.
      return {
        requestId: request.requestId,
        status: "success",
        result: { imageUrl: MOCK_RESULT_IMAGE_URL },
        error: null,
      }
    }

    if (this.mode === "malformed_success") {
      await delay(MOCK_PROCESSING_DELAY_MS)
      // Intentionally missing `result` — proves the generation service treats
      // an incomplete "success" as an error rather than a false SUCCESS.
      return { requestId: request.requestId, status: "success", result: null, error: null }
    }

    await delay(MOCK_PROCESSING_DELAY_MS)
    return {
      requestId: request.requestId,
      status: "success",
      result: { imageUrl: MOCK_RESULT_IMAGE_URL },
      error: null,
    }
  }
}
