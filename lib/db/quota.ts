// Pure quota-state logic — zero I/O, zero DB access. This is the single source of
// truth for "can this visitor generate right now," consumed by both the
// reservation transaction (lib/db/generations.ts) and read-only status displays
// (the /api/visualizer/quota route, the admin dashboard). Deliberately derived
// from generation rows rather than stored as a mutable counter: there is nothing
// to desync, and a crash mid-generation self-heals (see PENDING_STALE_MS below)
// instead of needing a manual release/sweep job.

function envInt(name: string, fallback: number): number {
  const raw = process.env[name]
  const parsed = raw ? Number(raw) : NaN
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

export const FREE_GENERATION_LIMIT = envInt("VISUALIZER_FREE_GENERATIONS", 2)
export const ROLLING_WINDOW_MS = envInt("VISUALIZER_COOLDOWN_HOURS", 24) * 60 * 60 * 1000

// A "pending" (reserved but not yet finalized) row older than this is treated as
// abandoned (server crashed / process restarted mid-generation) and excluded from
// quota counts — self-healing, no sweep job needed. Generous relative to the
// generation timeout (up to ~4 minutes) so an in-flight real attempt is never
// undercounted while it's still legitimately running.
export const PENDING_STALE_MS = 10 * 60 * 1000

export type QuotaPhase = "free" | "needs_lead" | "bonus" | "cooldown" | "rolling"

export interface QuotaState {
  phase: QuotaPhase
  canGenerate: boolean
  freeRemaining: number
  cooldownUntil: string | null
  hasLead: boolean
}

export interface QuotaAggregates {
  hasLead: boolean
  freeConsumedCount: number
  postLeadConsumedCount: number
  lastPostLeadGenerationAt: number | null
}

// A row "counts toward quota" if the visitor actually received something for it
// (real or fallback-masked success) OR it's a still-fresh reservation that hasn't
// been finalized yet (protects against a second parallel request slipping through
// while the first is still in flight). A stale pending row or a genuinely failed
// attempt with no delivered image never counts.
export interface GenerationQuotaRow {
  isDelivered: boolean
  status: "pending" | "success" | "error" | "timeout"
  isPostLead: boolean
  createdAtMs: number
}

function countsTowardQuota(row: GenerationQuotaRow, now: number): boolean {
  if (row.isDelivered) return true
  if (row.status === "pending" && now - row.createdAtMs < PENDING_STALE_MS) return true
  return false
}

export function deriveQuotaAggregates(rows: readonly GenerationQuotaRow[], now: number, hasLead: boolean): QuotaAggregates {
  let freeConsumedCount = 0
  let postLeadConsumedCount = 0
  let lastPostLeadGenerationAt: number | null = null

  for (const row of rows) {
    if (!countsTowardQuota(row, now)) continue
    if (row.isPostLead) {
      postLeadConsumedCount += 1
      if (lastPostLeadGenerationAt === null || row.createdAtMs > lastPostLeadGenerationAt) {
        lastPostLeadGenerationAt = row.createdAtMs
      }
    } else {
      freeConsumedCount += 1
    }
  }

  return { hasLead, freeConsumedCount, postLeadConsumedCount, lastPostLeadGenerationAt }
}

export function computeQuotaState(aggregates: QuotaAggregates, now: number): QuotaState {
  const { hasLead, freeConsumedCount, postLeadConsumedCount, lastPostLeadGenerationAt } = aggregates

  if (!hasLead) {
    if (freeConsumedCount < FREE_GENERATION_LIMIT) {
      return {
        phase: "free",
        canGenerate: true,
        freeRemaining: FREE_GENERATION_LIMIT - freeConsumedCount,
        cooldownUntil: null,
        hasLead: false,
      }
    }
    return { phase: "needs_lead", canGenerate: false, freeRemaining: 0, cooldownUntil: null, hasLead: false }
  }

  if (postLeadConsumedCount === 0) {
    return { phase: "bonus", canGenerate: true, freeRemaining: 0, cooldownUntil: null, hasLead: true }
  }

  const nextAllowedAt = (lastPostLeadGenerationAt ?? 0) + ROLLING_WINDOW_MS
  if (now >= nextAllowedAt) {
    return { phase: "rolling", canGenerate: true, freeRemaining: 0, cooldownUntil: null, hasLead: true }
  }

  return {
    phase: "cooldown",
    canGenerate: false,
    freeRemaining: 0,
    cooldownUntil: new Date(nextAllowedAt).toISOString(),
    hasLead: true,
  }
}
