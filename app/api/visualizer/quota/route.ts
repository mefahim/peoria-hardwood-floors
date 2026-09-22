// Read-only quota status for the current visitor — resolves/issues the visitor
// cookie exactly like /api/visualizer does, so calling this on page load (before
// any generation attempt) establishes identity early and lets the UI show correct
// "N free remaining" / "share info to unlock 1 more" / cooldown messaging without
// guessing or relying on client-side state.

import { db } from "@/lib/db/client"
import { getOrCreateVisitor } from "@/lib/db/visitors"
import { getVisitorQuotaState } from "@/lib/db/generations"
import { getOrCreateVisitorId } from "@/lib/visualizer/visitor-cookie"
import { getClientIp } from "@/lib/visualizer/request-ip"
import type { VisitorQuotaStatus } from "@/lib/visualizer/quota-types"

export async function GET(request: Request) {
  const visitorCookie = await getOrCreateVisitorId()
  if (!visitorCookie) {
    return Response.json({ error: "Visualizer is not configured (VISITOR_COOKIE_SECRET is unset)." }, { status: 503 })
  }
  const { visitorId } = visitorCookie
  const ip = getClientIp(request)
  const userAgent = request.headers.get("user-agent") ?? "unknown"
  getOrCreateVisitor(db, { id: visitorId, ip, userAgent })

  const quotaState = getVisitorQuotaState(db, visitorId)
  const body: VisitorQuotaStatus = quotaState
  return Response.json(body)
}
