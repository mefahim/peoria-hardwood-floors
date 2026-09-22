// Manual admin lever: block/unblock/clear-flag a visitor. Covered by middleware.ts's
// existing "/api/admin/:path*" matcher — no per-route auth code needed.

import { db } from "@/lib/db/client"
import { setVisitorStatus } from "@/lib/db/visitors"

const VALID_STATUSES = new Set(["active", "flagged", "blocked"])

export async function PATCH(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 })
  }

  const { visitorId, status } = (body ?? {}) as { visitorId?: unknown; status?: unknown }
  if (typeof visitorId !== "string" || visitorId.length === 0 || typeof status !== "string" || !VALID_STATUSES.has(status)) {
    return Response.json({ error: "visitorId and a valid status are required." }, { status: 400 })
  }

  setVisitorStatus(db, visitorId, status as "active" | "flagged" | "blocked", status === "active" ? null : "Set manually from the admin dashboard.")
  return Response.json({ ok: true })
}
