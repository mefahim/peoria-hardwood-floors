// Integration-level: exercises real Node.js built-in SQLite (in-memory, fresh per test),
// not mocks — the reservation/finalization transactions are the actual atomicity
// mechanism, so a test that mocks the DB would prove nothing about correctness.

import { randomUUID } from "node:crypto"
import { DatabaseSync } from "node:sqlite"
import { beforeEach, describe, expect, it } from "vitest"
import { SCHEMA_SQL } from "@/lib/db/schema"
import { getOrCreateVisitor, linkLeadToVisitor, setVisitorStatus } from "@/lib/db/visitors"
import { finalizeGeneration, reserveGeneration } from "@/lib/db/generations"

let db: DatabaseSync

beforeEach(() => {
  db = new DatabaseSync(":memory:")
  db.exec("PRAGMA foreign_keys = ON")
  db.exec(SCHEMA_SQL)
})

function reserve(visitorId: string, requestId = `viz_${randomUUID()}`) {
  const result = reserveGeneration(db, {
    requestId,
    visitorId,
    ip: "127.0.0.1",
    userAgent: "vitest",
    provider: "mock",
    woodSpecies: "oak",
    preferredStyle: "light_natural",
    optionsJson: "{}",
    rateLimitPerWindow: 1000,
    rateLimitWindowMs: 10 * 60 * 1000,
  })
  return { result, requestId }
}

function deliver(requestId: string) {
  finalizeGeneration(db, {
    requestId,
    status: "success",
    isFallback: false,
    isDelivered: true,
    model: null,
    outputImageRef: "/images/hero-kitchen.png",
    inputImageRef: null,
    errorMessage: null,
  })
}

describe("reserveGeneration full lifecycle", () => {
  it("walks through free -> needs_lead -> bonus -> cooldown -> rolling", () => {
    const visitorId = randomUUID()
    getOrCreateVisitor(db, { id: visitorId, ip: "127.0.0.1", userAgent: "vitest" })

    // 2 free generations succeed.
    const first = reserve(visitorId)
    expect(first.result.kind).toBe("granted")
    deliver(first.requestId)

    const second = reserve(visitorId)
    expect(second.result.kind).toBe("granted")
    deliver(second.requestId)

    // 3rd free attempt is denied — lead required.
    const third = reserve(visitorId)
    expect(third.result).toMatchObject({ kind: "denied", denialPhase: "needs_lead" })

    // Link a lead — the next attempt is the bonus generation.
    const leadId = `lead_${randomUUID()}`
    db.prepare("INSERT INTO leads (id, visitor_id, name, email, email_raw, phone, created_at) VALUES (?, ?, 'Jane', 'jane@example.com', 'jane@example.com', NULL, ?)").run(
      leadId,
      visitorId,
      new Date().toISOString(),
    )
    linkLeadToVisitor(db, visitorId, leadId, new Date().toISOString())

    const bonus = reserve(visitorId)
    expect(bonus.result.kind).toBe("granted")
    deliver(bonus.requestId)

    // Immediately after the bonus, a 2nd post-lead attempt is denied — cooldown.
    const afterBonus = reserve(visitorId)
    expect(afterBonus.result).toMatchObject({ kind: "denied", denialPhase: "cooldown" })

    // Simulate 24h+ elapsed by rewriting the bonus generation's created_at directly.
    const twentyFiveHoursAgo = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString()
    db.prepare("UPDATE generations SET created_at = ? WHERE visitor_id = ? AND is_post_lead = 1").run(twentyFiveHoursAgo, visitorId)

    const rolling = reserve(visitorId)
    expect(rolling.result.kind).toBe("granted")
  })

  it("does not double-count a duplicate requestId (idempotency)", () => {
    const visitorId = randomUUID()
    getOrCreateVisitor(db, { id: visitorId, ip: "127.0.0.1", userAgent: "vitest" })
    const requestId = `viz_${randomUUID()}`

    const first = reserve(visitorId, requestId)
    expect(first.result.kind).toBe("granted")
    deliver(requestId)

    // Same requestId again — must be recognized as a duplicate, not a 2nd reservation.
    const replay = reserve(visitorId, requestId)
    expect(replay.result.kind).toBe("duplicate")

    const count = db.prepare("SELECT COUNT(*) as c FROM generations WHERE visitor_id = ?").get(visitorId) as { c: number }
    expect(count.c).toBe(1)

    // The visitor should still have 1 free generation left (the duplicate replay
    // consumed nothing), not 0.
    const second = reserve(visitorId)
    expect(second.result.kind).toBe("granted")
  })

  it("denies a blocked visitor regardless of quota state", () => {
    const visitorId = randomUUID()
    getOrCreateVisitor(db, { id: visitorId, ip: "127.0.0.1", userAgent: "vitest" })
    setVisitorStatus(db, visitorId, "blocked", "test")

    const attempt = reserve(visitorId)
    expect(attempt.result).toMatchObject({ kind: "denied", denialPhase: "blocked" })
  })

  it("enforces the per-IP rate limit independent of per-visitor quota", () => {
    const visitorA = randomUUID()
    const visitorB = randomUUID()
    getOrCreateVisitor(db, { id: visitorA, ip: "10.0.0.1", userAgent: "vitest" })
    getOrCreateVisitor(db, { id: visitorB, ip: "10.0.0.1", userAgent: "vitest" })

    const denyAt = reserveGeneration(db, {
      requestId: `viz_${randomUUID()}`,
      visitorId: visitorA,
      ip: "10.0.0.1",
      userAgent: "vitest",
      provider: "mock",
      woodSpecies: null,
      preferredStyle: null,
      optionsJson: "{}",
      rateLimitPerWindow: 1,
      rateLimitWindowMs: 10 * 60 * 1000,
    })
    expect(denyAt.kind).toBe("granted")

    // A 2nd request from a DIFFERENT visitor but the SAME IP trips the rate limit
    // (rateLimitPerWindow=1), even though visitorB has full quota remaining.
    const blocked = reserveGeneration(db, {
      requestId: `viz_${randomUUID()}`,
      visitorId: visitorB,
      ip: "10.0.0.1",
      userAgent: "vitest",
      provider: "mock",
      woodSpecies: null,
      preferredStyle: null,
      optionsJson: "{}",
      rateLimitPerWindow: 1,
      rateLimitWindowMs: 10 * 60 * 1000,
    })
    expect(blocked).toMatchObject({ kind: "denied", denialPhase: "rate_limited" })
  })

  it("does not allow more than the free limit under many sequential rapid calls (regression guard for the reservation transaction)", () => {
    const visitorId = randomUUID()
    getOrCreateVisitor(db, { id: visitorId, ip: "127.0.0.1", userAgent: "vitest" })

    const results = Array.from({ length: 10 }, () => reserve(visitorId))
    const granted = results.filter((r) => r.result.kind === "granted")
    // Exactly 2 (the free limit) should be granted; the rest denied — proves the
    // transaction's read-then-write is genuinely atomic across repeated calls,
    // not just correct on the first call. Note: this is a regression guard, not
    // proof of true concurrent-hardware safety — see reserveGeneration's own
    // comment and DEPLOYMENT.md-adjacent notes on why (synchronous transaction,
    // no internal await, so Node can't interleave two calls to it anyway).
    expect(granted).toHaveLength(2)
  })
})
