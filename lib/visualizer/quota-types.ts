// Shared shape for a quota-denied response from POST /api/visualizer. Deliberately
// NOT part of VisualizationProviderResponse/GenerationErrorCode (lib/visualizer/generation.ts)
// — that contract's normalizeProviderResult() always overrides error.message with a
// fixed local string and rejects unrecognized shapes, so a quota denial (which needs
// to carry a precise phase + cooldown timestamp, not just a fixed code) is handled as
// a parallel, separate response kind recognized before normalization ever runs.

export type QuotaDenialPhase = "needs_lead" | "cooldown" | "rate_limited" | "blocked"

export interface QuotaDeniedResponse {
  kind: "quota_denied"
  requestId: string
  phase: QuotaDenialPhase
  cooldownUntil: string | null
  freeRemaining: number
  message: string
}

export function isQuotaDeniedResponse(value: unknown): value is QuotaDeniedResponse {
  return !!value && typeof value === "object" && (value as { kind?: unknown }).kind === "quota_denied"
}

export interface VisitorQuotaStatus {
  phase: "free" | "needs_lead" | "bonus" | "cooldown" | "rolling"
  canGenerate: boolean
  freeRemaining: number
  cooldownUntil: string | null
  hasLead: boolean
}
