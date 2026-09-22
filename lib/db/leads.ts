import type { DatabaseSync } from "node:sqlite"

export interface LeadRow {
  id: string
  visitor_id: string
  name: string
  email: string
  email_raw: string
  phone: string | null
  ip: string | null
  user_agent: string | null
  created_at: string
}

export interface CreateLeadParams {
  id: string
  visitorId: string
  name: string
  email: string
  emailRaw: string
  phone: string | null
  ip: string
  userAgent: string
}

// Always inserts a new row — every submission is its own audit-trail entry, never
// an upsert. Duplicate-email handling happens at a higher level (flagging), not by
// merging/rejecting here.
export function createLead(db: DatabaseSync, params: CreateLeadParams): LeadRow {
  const now = new Date().toISOString()
  db.prepare(
    `INSERT INTO leads (id, visitor_id, name, email, email_raw, phone, ip, user_agent, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(params.id, params.visitorId, params.name, params.email, params.emailRaw, params.phone, params.ip, params.userAgent, now)
  return db.prepare("SELECT * FROM leads WHERE id = ?").get(params.id) as LeadRow
}

// Prior submissions with the same normalized email, optionally excluding one
// visitor — used only for the informational cross-session flagging signal, never
// to block or merge a submission.
export function findLeadsByEmail(db: DatabaseSync, normalizedEmail: string, excludingVisitorId?: string): LeadRow[] {
  if (excludingVisitorId) {
    return db
      .prepare("SELECT * FROM leads WHERE email = ? AND visitor_id != ? ORDER BY created_at DESC")
      .all(normalizedEmail, excludingVisitorId)
  }
  return db.prepare("SELECT * FROM leads WHERE email = ? ORDER BY created_at DESC").all(normalizedEmail)
}
