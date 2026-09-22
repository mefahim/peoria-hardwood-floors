// Phase 4 — Provider abstraction (visualizer-docs/04-PHASE-GENERATE.md §11)
// The generation workflow depends on this interface only. It never imports a
// concrete provider (mock or real) outside of the server-side generation
// boundary (app/api/visualizer/route.ts + lib/visualizer/generation-service.ts).
// Swapping MockVisualizationProvider for a RealVisualizationProvider later
// requires no change to this interface, the service, or the UI.

import type { VisualizerOptions } from "@/lib/visualizer/options"
import type { VisualizationProviderResponse } from "@/lib/visualizer/generation"

// The request shape a provider implementation actually executes against.
// Distinct from VisualizationGenerationRequest (the client->server wire
// contract) because the provider also needs the actual image bytes, which
// never travel as JSON.
export interface VisualizationProviderRequest {
  requestId: string
  image: {
    fileName: string
    mimeType: string
    width: number
    height: number
    file: Blob
  }
  options: VisualizerOptions
}

export interface VisualizationProvider {
  generate(request: VisualizationProviderRequest): Promise<VisualizationProviderResponse>
}
