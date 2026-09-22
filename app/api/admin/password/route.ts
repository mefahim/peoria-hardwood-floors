// Covered by middleware.ts's existing "/api/admin/:path*" matcher — no
// per-route auth check needed. Requires the CURRENT password (re-verified
// server-side, never trusted from a prior session alone) before accepting a
// new one — the session cookie proves "an admin is logged in," not "this
// specific request is authorized to change the credential."

import { verifyAdminPassword, setAdminPassword, hasAdminPasswordOverride } from "@/lib/visualizer/admin-store"

const MIN_PASSWORD_LENGTH = 8

export async function GET() {
  return Response.json({ usingDashboardOverride: await hasAdminPasswordOverride() })
}

export async function POST(request: Request) {
  let body: { currentPassword?: unknown; newPassword?: unknown }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 })
  }

  if (typeof body.currentPassword !== "string" || typeof body.newPassword !== "string") {
    return Response.json({ error: "Current and new password are required." }, { status: 400 })
  }

  if (!(await verifyAdminPassword(body.currentPassword))) {
    return Response.json({ error: "Current password is incorrect." }, { status: 401 })
  }

  if (body.newPassword.length < MIN_PASSWORD_LENGTH) {
    return Response.json({ error: `New password must be at least ${MIN_PASSWORD_LENGTH} characters.` }, { status: 400 })
  }

  await setAdminPassword(body.newPassword)
  return Response.json({ ok: true })
}
