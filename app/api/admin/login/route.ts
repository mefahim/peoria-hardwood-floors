// Not protected by middleware.ts (explicitly excluded) — this is how a
// session cookie is obtained in the first place. See lib/visualizer/admin-auth.ts
// for the stateless token scheme (session-signing secret, decoupled from the
// password itself so a dashboard password change never breaks existing sessions).

import { ADMIN_SESSION_COOKIE, computeSessionToken, getSessionSigningSecret, SESSION_COOKIE_OPTIONS } from "@/lib/visualizer/admin-auth"
import { verifyAdminPassword } from "@/lib/visualizer/admin-store"

export async function POST(request: Request) {
  if (!getSessionSigningSecret()) {
    return Response.json({ error: "Admin dashboard is not configured (ADMIN_PASSWORD is unset)." }, { status: 503 })
  }

  let body: { password?: unknown }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 })
  }

  if (typeof body.password !== "string" || !(await verifyAdminPassword(body.password))) {
    return Response.json({ error: "Incorrect password." }, { status: 401 })
  }

  const token = await computeSessionToken()
  const res = Response.json({ ok: true })
  res.headers.append(
    "Set-Cookie",
    `${ADMIN_SESSION_COOKIE}=${token}; Path=${SESSION_COOKIE_OPTIONS.path}; Max-Age=${SESSION_COOKIE_OPTIONS.maxAge}; SameSite=${SESSION_COOKIE_OPTIONS.sameSite === "lax" ? "Lax" : SESSION_COOKIE_OPTIONS.sameSite}${SESSION_COOKIE_OPTIONS.httpOnly ? "; HttpOnly" : ""}${SESSION_COOKIE_OPTIONS.secure ? "; Secure" : ""}`,
  )
  return res
}
