import type { DatabaseSync } from "node:sqlite"
import { withTransaction } from "@/lib/db/client"
import { computeQuotaState, deriveQuotaAggregates, type GenerationQuotaRow, type QuotaState } from "@/lib/db/quota"

export interface GenerationRow {
  id: string
  visitor_id: string
  lead_id: string | null
  is_post_lead: number
  provider: string
  model: string | null
  status: "pending" | "success" | "error" | "timeout"
  is_fallback: number
  is_delivered: number
  wood_species: string | null
  preferred_style: string | null
  options_json: string
  input_image_ref: string | null
  output_image_ref: string | null
  error_message: string | null
  ip: string | null
  user_agent: string | null
  created_at: string
  finalized_at: string | null
}

interface VisitorStatusRow {
  lead_id: string | null
  status: "active" | "flagged" | "blocked"
}

export type DenialPhase = "needs_lead" | "cooldown" | "rate_limited" | "blocked"

export type ReserveResult =
  | { kind: "duplicate"; row: GenerationRow }
  | { kind: "denied"; quotaState: QuotaState; denialPhase: DenialPhase; reason: string }
  | { kind: "granted"; quotaState: QuotaState }

export interface ReserveGenerationParams {
  requestId: string
  visitorId: string
  ip: string
  userAgent: string
  provider: string
  woodSpecies: string | null
  preferredStyle: string | null
  optionsJson: string
  rateLimitPerWindow: number
  rateLimitWindowMs: number
}

function loadQuotaRows(db: DatabaseSync, visitorId: string): GenerationQuotaRow[] {
  const rows = db
    .prepare(
      "SELECT is_delivered, status, is_post_lead, created_at FROM generations WHERE visitor_id = ? ORDER BY created_at DESC",
    )
    .all(visitorId)
  return rows.map((row) => ({
    isDelivered: !!row.is_delivered,
    status: row.status,
    isPostLead: !!row.is_post_lead,
    createdAtMs: Date.parse(row.created_at),
  }))
}

// The single atomic reservation. Idempotency, block-status, rate-limit, and quota
// checks all happen inside one synchronous transaction alongside the reservation
// insert itself — there's no separate "check" step that a concurrent request could
// slip in between, because the synchronous BEGIN IMMEDIATE transaction acquires SQLite's write lock before
// the quota check and reservation, so another request cannot interleave a write.
export function reserveGeneration(db: DatabaseSync, params: ReserveGenerationParams): ReserveResult {
  const run = () => withTransaction(db, (): ReserveResult => {
    const existing = db.prepare("SELECT * FROM generations WHERE id = ?").get(params.requestId)
    if (existing) return { kind: "duplicate", row: existing }

    const now = Date.now()
    const nowIso = new Date(now).toISOString()

    const visitor = db.prepare("SELECT lead_id, status FROM visitors WHERE id = ?").get(params.visitorId)
    const hasLead = !!visitor?.lead_id

    const windowStartIso = new Date(now - params.rateLimitWindowMs).toISOString()
    const rateLimitCount = (
      db.prepare("SELECT COUNT(*) as c FROM request_events WHERE ip = ? AND created_at >= ?").get(params.ip, windowStartIso) ?? { c: 0 }
    ).c

    const rows = loadQuotaRows(db, params.visitorId)
    const aggregates = deriveQuotaAggregates(rows, now, hasLead)
    const quotaState = computeQuotaState(aggregates, now)

    function deny(outcome: string, denialPhase: DenialPhase, reason: string): ReserveResult {
      db.prepare("INSERT INTO request_events (visitor_id, ip, outcome, reason, created_at) VALUES (?, ?, ?, ?, ?)").run(params.visitorId, params.ip, outcome, reason, nowIso)
      return { kind: "denied", quotaState, denialPhase, reason }
    }

    if (!visitor || visitor.status === "blocked") {
      return deny("denied_blocked", "blocked", "This visitor has been blocked.")
    }
    if (rateLimitCount >= params.rateLimitPerWindow) {
      return deny("denied_rate_limited", "rate_limited", "Too many requests — please slow down and try again shortly.")
    }
    if (!quotaState.canGenerate) {
      const denialPhase: DenialPhase = quotaState.phase === "needs_lead" ? "needs_lead" : "cooldown"
      return deny(`denied_${quotaState.phase}`, denialPhase, denialPhase === "needs_lead" ? "Lead capture required to continue." : "Cooldown active.")
    }

    db.prepare(
      `INSERT INTO generations
        (id, visitor_id, lead_id, is_post_lead, provider, status, options_json, wood_species, preferred_style, ip, user_agent, created_at)
       VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?, ?, ?)`,
    ).run(params.requestId, params.visitorId, visitor.lead_id, hasLead ? 1 : 0, params.provider, params.optionsJson, params.woodSpecies, params.preferredStyle, params.ip, params.userAgent, nowIso)

    db.prepare("INSERT INTO request_events (visitor_id, ip, outcome, reason, created_at) VALUES (?, ?, 'reserved', NULL, ?)").run(params.visitorId, params.ip, nowIso)

    if (hasLead) {
      db.prepare("UPDATE visitors SET last_generation_at = ? WHERE id = ?").run(nowIso, params.visitorId)
    }

    return { kind: "granted", quotaState }
  })

  return run()
}

export interface FinalizeGenerationParams {
  requestId: string
  status: "success" | "error" | "timeout"
  isFallback: boolean
  isDelivered: boolean
  model: string | null
  outputImageRef: string | null
  inputImageRef: string | null
  errorMessage: string | null
}

export function finalizeGeneration(db: DatabaseSync, params: FinalizeGenerationParams): void {
  const nowIso = new Date().toISOString()
  db.prepare(
    `UPDATE generations
     SET status = ?, is_fallback = ?, is_delivered = ?, model = ?, output_image_ref = ?, input_image_ref = ?, error_message = ?, finalized_at = ?
     WHERE id = ?`,
  ).run(params.status, params.isFallback ? 1 : 0, params.isDelivered ? 1 : 0, params.model, params.outputImageRef, params.inputImageRef, params.errorMessage, nowIso, params.requestId)
}

export function getVisitorQuotaState(db: DatabaseSync, visitorId: string): QuotaState {
  const visitor = db.prepare("SELECT lead_id, status FROM visitors WHERE id = ?").get(visitorId)
  const hasLead = !!visitor?.lead_id
  const now = Date.now()
  const rows = loadQuotaRows(db, visitorId)
  const aggregates = deriveQuotaAggregates(rows, now, hasLead)
  return computeQuotaState(aggregates, now)
}

// --- Admin read helpers -----------------------------------------------------

export interface LeadListRow {
  id: string
  visitor_id: string
  name: string
  email: string
  phone: string | null
  created_at: string
  visitor_status: "active" | "flagged" | "blocked"
  flag_reason: string | null
}

export function listLeads(db: DatabaseSync, params: { limit?: number; offset?: number } = {}): LeadListRow[] {
  const limit = params.limit ?? 100
  const offset = params.offset ?? 0
  return db
    .prepare(`SELECT leads.id, leads.visitor_id, leads.name, leads.email, leads.phone, leads.created_at,
              visitors.status as visitor_status, visitors.flag_reason
       FROM leads JOIN visitors ON visitors.id = leads.visitor_id
       ORDER BY leads.created_at DESC LIMIT ? OFFSET ?`)
    .all(limit, offset)
}

export function getLead(db: DatabaseSync, id: string) {
  return db
    .prepare(`SELECT leads.id, leads.visitor_id, leads.name, leads.email, leads.phone, leads.created_at,
              visitors.status as visitor_status, visitors.flag_reason
       FROM leads JOIN visitors ON visitors.id = leads.visitor_id
       WHERE leads.id = ?`)
    .get(id)
}

// A lead's full history includes pre-lead free generations from the same visitor,
// not just post-lead ones — so this joins through visitor_id, not lead_id.
export function getGenerationsForLead(db: DatabaseSync, leadId: string): GenerationRow[] {
  const lead = db.prepare("SELECT visitor_id FROM leads WHERE id = ?").get(leadId)
  if (!lead) return []
  return db.prepare("SELECT * FROM generations WHERE visitor_id = ? ORDER BY created_at DESC").all(lead.visitor_id)
}

export function listGenerations(db: DatabaseSync, params: { limit?: number } = {}): GenerationRow[] {
  const limit = params.limit ?? 100
  return db.prepare("SELECT * FROM generations ORDER BY created_at DESC LIMIT ?").all(limit)
}

export interface GenerationStats {
  total: number
  success: number
  error: number
  timeout: number
  pending: number
  fallback: number
  byProvider: Record<string, number>
}

export function getGenerationStats(db: DatabaseSync): GenerationStats {
  const rows = db.prepare("SELECT status, is_fallback, provider FROM generations").all()
  const stats: GenerationStats = { total: rows.length, success: 0, error: 0, timeout: 0, pending: 0, fallback: 0, byProvider: {} }
  for (const row of rows) {
    stats[row.status] += 1
    if (row.is_fallback) stats.fallback += 1
    stats.byProvider[row.provider] = (stats.byProvider[row.provider] ?? 0) + 1
  }
  return stats
}

export interface FlaggedVisitorRow {
  id: string
  status: "active" | "flagged" | "blocked"
  flag_reason: string | null
  created_at: string
  ip: string | null
  lead_id: string | null
}

export function listFlaggedOrBlockedVisitors(db: DatabaseSync): FlaggedVisitorRow[] {
  return db
    .prepare("SELECT id, status, flag_reason, created_at, ip, lead_id FROM visitors WHERE status IN ('flagged', 'blocked') ORDER BY created_at DESC")
    .all()
}

export interface RequestEventRow {
  id: number
  visitor_id: string
  ip: string | null
  outcome: string
  reason: string | null
  created_at: string
}

export function listRecentBlockedEvents(db: DatabaseSync, limit = 50): RequestEventRow[] {
  return db.prepare("SELECT * FROM request_events WHERE outcome LIKE 'denied_%' ORDER BY created_at DESC LIMIT ?").all(limit)
}
