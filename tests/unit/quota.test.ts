import { describe, expect, it } from "vitest"
import { computeQuotaState, deriveQuotaAggregates, FREE_GENERATION_LIMIT, PENDING_STALE_MS, ROLLING_WINDOW_MS, type GenerationQuotaRow } from "@/lib/db/quota"

const NOW = Date.parse("2026-01-01T00:00:00.000Z")

function row(overrides: Partial<GenerationQuotaRow>): GenerationQuotaRow {
  return { isDelivered: true, status: "success", isPostLead: false, createdAtMs: NOW, ...overrides }
}

describe("computeQuotaState", () => {
  it("phase=free with 0 consumed", () => {
    const state = computeQuotaState({ hasLead: false, freeConsumedCount: 0, postLeadConsumedCount: 0, lastPostLeadGenerationAt: null }, NOW)
    expect(state).toEqual({ phase: "free", canGenerate: true, freeRemaining: FREE_GENERATION_LIMIT, cooldownUntil: null, hasLead: false })
  })

  it("phase=free with 1 of 2 consumed", () => {
    const state = computeQuotaState({ hasLead: false, freeConsumedCount: 1, postLeadConsumedCount: 0, lastPostLeadGenerationAt: null }, NOW)
    expect(state.phase).toBe("free")
    expect(state.canGenerate).toBe(true)
    expect(state.freeRemaining).toBe(1)
  })

  it("phase=needs_lead once the free limit is reached, no lead yet", () => {
    const state = computeQuotaState({ hasLead: false, freeConsumedCount: FREE_GENERATION_LIMIT, postLeadConsumedCount: 0, lastPostLeadGenerationAt: null }, NOW)
    expect(state).toEqual({ phase: "needs_lead", canGenerate: false, freeRemaining: 0, cooldownUntil: null, hasLead: false })
  })

  it("phase=needs_lead even if free count somehow exceeds the limit", () => {
    const state = computeQuotaState({ hasLead: false, freeConsumedCount: FREE_GENERATION_LIMIT + 5, postLeadConsumedCount: 0, lastPostLeadGenerationAt: null }, NOW)
    expect(state.phase).toBe("needs_lead")
    expect(state.canGenerate).toBe(false)
  })

  it("phase=bonus once a lead is linked and the bonus hasn't been used", () => {
    const state = computeQuotaState({ hasLead: true, freeConsumedCount: FREE_GENERATION_LIMIT, postLeadConsumedCount: 0, lastPostLeadGenerationAt: null }, NOW)
    expect(state).toEqual({ phase: "bonus", canGenerate: true, freeRemaining: 0, cooldownUntil: null, hasLead: true })
  })

  it("phase=cooldown immediately after the bonus generation", () => {
    const state = computeQuotaState({ hasLead: true, freeConsumedCount: FREE_GENERATION_LIMIT, postLeadConsumedCount: 1, lastPostLeadGenerationAt: NOW }, NOW)
    expect(state.phase).toBe("cooldown")
    expect(state.canGenerate).toBe(false)
    expect(state.cooldownUntil).toBe(new Date(NOW + ROLLING_WINDOW_MS).toISOString())
  })

  it("phase=cooldown one millisecond before the window elapses", () => {
    const almostElapsed = NOW + ROLLING_WINDOW_MS - 1
    const state = computeQuotaState({ hasLead: true, freeConsumedCount: FREE_GENERATION_LIMIT, postLeadConsumedCount: 1, lastPostLeadGenerationAt: NOW }, almostElapsed)
    expect(state.phase).toBe("cooldown")
    expect(state.canGenerate).toBe(false)
  })

  it("phase=rolling exactly when the window elapses (boundary is inclusive)", () => {
    const exactlyElapsed = NOW + ROLLING_WINDOW_MS
    const state = computeQuotaState({ hasLead: true, freeConsumedCount: FREE_GENERATION_LIMIT, postLeadConsumedCount: 1, lastPostLeadGenerationAt: NOW }, exactlyElapsed)
    expect(state.phase).toBe("rolling")
    expect(state.canGenerate).toBe(true)
  })

  it("phase=rolling well after the window elapses, with several post-lead generations already on record", () => {
    const later = NOW + ROLLING_WINDOW_MS + 60_000
    const state = computeQuotaState({ hasLead: true, freeConsumedCount: FREE_GENERATION_LIMIT, postLeadConsumedCount: 4, lastPostLeadGenerationAt: NOW }, later)
    expect(state.phase).toBe("rolling")
    expect(state.canGenerate).toBe(true)
  })
})

describe("deriveQuotaAggregates", () => {
  it("counts delivered rows and ignores non-delivered, non-pending rows", () => {
    const rows: GenerationQuotaRow[] = [
      row({ isDelivered: true, status: "success", isPostLead: false, createdAtMs: NOW }),
      row({ isDelivered: false, status: "error", isPostLead: false, createdAtMs: NOW }),
      row({ isDelivered: false, status: "timeout", isPostLead: false, createdAtMs: NOW }),
    ]
    const aggregates = deriveQuotaAggregates(rows, NOW, false)
    expect(aggregates.freeConsumedCount).toBe(1)
  })

  it("counts a fresh pending row (still-running reservation) toward quota", () => {
    const rows: GenerationQuotaRow[] = [row({ isDelivered: false, status: "pending", isPostLead: false, createdAtMs: NOW })]
    const aggregates = deriveQuotaAggregates(rows, NOW + 1000, false)
    expect(aggregates.freeConsumedCount).toBe(1)
  })

  it("excludes a stale pending row (abandoned reservation, e.g. server crash) from quota", () => {
    const rows: GenerationQuotaRow[] = [row({ isDelivered: false, status: "pending", isPostLead: false, createdAtMs: NOW })]
    const aggregates = deriveQuotaAggregates(rows, NOW + PENDING_STALE_MS + 1, false)
    expect(aggregates.freeConsumedCount).toBe(0)
  })

  it("separates free vs post-lead counts and tracks the latest post-lead timestamp", () => {
    const rows: GenerationQuotaRow[] = [
      row({ isPostLead: false, createdAtMs: NOW }),
      row({ isPostLead: false, createdAtMs: NOW + 1 }),
      row({ isPostLead: true, createdAtMs: NOW + 2 }),
      row({ isPostLead: true, createdAtMs: NOW + 3 }),
    ]
    const aggregates = deriveQuotaAggregates(rows, NOW + 4, true)
    expect(aggregates.freeConsumedCount).toBe(2)
    expect(aggregates.postLeadConsumedCount).toBe(2)
    expect(aggregates.lastPostLeadGenerationAt).toBe(NOW + 3)
  })
})
