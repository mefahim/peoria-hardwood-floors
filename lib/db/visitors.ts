import type { DatabaseSync } from "node:sqlite"

export interface VisitorRow {
  id: string
  created_at: string
  lead_id: string | null
  lead_linked_at: string | null
  last_generation_at: string | null
  ip: string | null
  user_agent: string | null
  status: "active" | "flagged" | "blocked"
  flag_reason: string | null
}

export function getOrCreateVisitor(db: DatabaseSync, params: { id: string; ip: string; userAgent: string }): VisitorRow {
  const existing = db.prepare("SELECT * FROM visitors WHERE id = ?").get(params.id)
  if (existing) return existing

  const now = new Date().toISOString()
  db.prepare("INSERT INTO visitors (id, created_at, ip, user_agent) VALUES (?, ?, ?, ?)").run(params.id, now, params.ip, params.userAgent)
  return db.prepare("SELECT * FROM visitors WHERE id = ?").get(params.id) as VisitorRow
}

export function getVisitor(db: DatabaseSync, id: string): VisitorRow | undefined {
  return db.prepare("SELECT * FROM visitors WHERE id = ?").get(id)
}

export function linkLeadToVisitor(db: DatabaseSync, visitorId: string, leadId: string, nowIso: string): void {
  db.prepare("UPDATE visitors SET lead_id = ?, lead_linked_at = ? WHERE id = ?").run(leadId, nowIso, visitorId)
}

export function flagVisitor(db: DatabaseSync, visitorId: string, reason: string): void {
  // Never downgrades an admin-set 'blocked' status back to merely 'flagged'.
  db.prepare("UPDATE visitors SET status = 'flagged', flag_reason = ? WHERE id = ? AND status != 'blocked'").run(reason, visitorId)
}

export function setVisitorStatus(db: DatabaseSync, visitorId: string, status: "active" | "flagged" | "blocked", reason: string | null): void {
  db.prepare("UPDATE visitors SET status = ?, flag_reason = ? WHERE id = ?").run(status, reason, visitorId)
}
