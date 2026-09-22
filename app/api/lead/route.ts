// Lead capture — the gate a visitor must pass after 2 free generations to unlock
// 1 more. Every submission is stored as its own row (audit trail), never upserted;
// a normalized-email match against a DIFFERENT visitor only flags for admin
// visibility, never blocks or merges the submission (see lib/db/leads.ts).

import { db } from "@/lib/db/client"
import { getOrCreateVisitor, linkLeadToVisitor, flagVisitor } from "@/lib/db/visitors"
import { createLead, findLeadsByEmail } from "@/lib/db/leads"
import { getVisitorQuotaState } from "@/lib/db/generations"
import { getOrCreateVisitorId } from "@/lib/visualizer/visitor-cookie"
import { getClientIp } from "@/lib/visualizer/request-ip"
import { validateLeadForm, type LeadFormInput } from "@/lib/visualizer/lead-validation"
import { randomUUID } from "node:crypto"

export async function POST(request: Request) {
  const visitorCookie = await getOrCreateVisitorId()
  if (!visitorCookie) {
    return Response.json({ error: "Visualizer is not configured (VISITOR_COOKIE_SECRET is unset)." }, { status: 503 })
  }
  const { visitorId } = visitorCookie
  const ip = getClientIp(request)
  const userAgent = request.headers.get("user-agent") ?? "unknown"
  getOrCreateVisitor(db, { id: visitorId, ip, userAgent })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ ok: false, errors: { name: { code: "FIELD_REQUIRED", message: "Please complete the form." } } }, { status: 400 })
  }

  const input = (body ?? {}) as LeadFormInput
  // Never trust client-side validation, same "never trust the client" boundary the
  // generation route already enforces for VisualizerOptions.
  const validation = validateLeadForm(input)
  if (!validation.valid || !validation.data) {
    return Response.json({ ok: false, errors: validation.errors }, { status: 400 })
  }

  const { name, email, phone } = validation.data
  const emailRaw = typeof input.email === "string" ? input.email.trim() : email

  const lead = createLead(db, {
    id: `lead_${randomUUID()}`,
    visitorId,
    name,
    email,
    emailRaw,
    phone,
    ip,
    userAgent,
  })

  linkLeadToVisitor(db, visitorId, lead.id, new Date().toISOString())

  // Informational-only abuse signal: this normalized email was already submitted
  // under a different visitor (e.g. cookies cleared to reset quota, then the same
  // real contact info re-entered). Never blocks — just flags for admin visibility.
  const priorLeadsUnderOtherVisitors = findLeadsByEmail(db, email, visitorId)
  if (priorLeadsUnderOtherVisitors.length > 0) {
    flagVisitor(db, visitorId, "Email previously submitted by a different visitor session.")
  }

  const quotaState = getVisitorQuotaState(db, visitorId)
  return Response.json({ ok: true, quotaState })
}
