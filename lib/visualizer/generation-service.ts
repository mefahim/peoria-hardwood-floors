// Phase 4 — Generation Service (visualizer-docs/04-PHASE-GENERATE.md §16, §39)
// The single boundary through which ALL provider communication passes. Owns the
// server-side generation timeout (one location — GENERATION_TIMEOUT_MS) and
// guarantees the caller always receives an already-normalized, already-validated
// response — never a raw/unchecked provider payload.
//
// Server-only. Imported by app/api/visualizer/route.ts.

import { GENERATION_TIMEOUT_MS, normalizeProviderResult, type VisualizationProviderResponse } from "@/lib/visualizer/generation"
import type { VisualizationProvider, VisualizationProviderRequest } from "@/lib/visualizer/providers/types"

export async function generateVisualization(
  request: VisualizationProviderRequest,
  provider: VisualizationProvider,
): Promise<VisualizationProviderResponse> {
  const timeoutResult: VisualizationProviderResponse = {
    requestId: request.requestId,
    status: "timeout",
    result: null,
    error: { code: "TIMEOUT_ERROR", message: "The visualization is taking longer than expected. Please try again." },
  }

  let timer: ReturnType<typeof setTimeout>
  const timeoutPromise = new Promise<VisualizationProviderResponse>((resolve) => {
    timer = setTimeout(() => resolve(timeoutResult), GENERATION_TIMEOUT_MS)
  })

  try {
    const raw = await Promise.race([provider.generate(request), timeoutPromise])
    clearTimeout(timer!)
    // Even the timeout branch's own well-formed result passes through
    // normalization — cheap, and guarantees one single code path produces
    // every response this function returns.
    return normalizeProviderResult(raw, request.requestId)
  } catch {
    clearTimeout(timer!)
    return {
      requestId: request.requestId,
      status: "error",
      result: null,
      error: { code: "PROVIDER_ERROR", message: "We couldn't generate the visualization right now. Please try again." },
    }
  }
}
