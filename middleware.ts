// Protects the internal admin dashboard (/admin and its API routes) with a
// proper login page instead of the browser's native Basic Auth prompt. See
// lib/visualizer/admin-auth.ts for the stateless session-cookie scheme this
// checks. Fails CLOSED: if ADMIN_PASSWORD isn't configured, the dashboard is
// unreachable rather than silently open.
//
// /admin/login and /api/admin/login are explicitly excluded — they're how a
// session cookie is obtained in the first place.

import { NextResponse, type NextRequest } from "next/server"
import { ADMIN_SESSION_COOKIE, getSessionSigningSecret, isValidSessionCookie } from "@/lib/visualizer/admin-auth"

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
}

const PUBLIC_PATHS = new Set(["/admin/login", "/api/admin/login"])

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (PUBLIC_PATHS.has(pathname)) return NextResponse.next()

  const isApiRoute = pathname.startsWith("/api/")

  if (!getSessionSigningSecret()) {
    const message = "Admin dashboard is not configured (ADMIN_PASSWORD is unset)."
    return isApiRoute ? Response.json({ error: message }, { status: 503 }) : new NextResponse(message, { status: 503 })
  }

  const cookieValue = request.cookies.get(ADMIN_SESSION_COOKIE)?.value
  const valid = await isValidSessionCookie(cookieValue)
  if (valid) return NextResponse.next()

  if (isApiRoute) return Response.json({ error: "Authentication required." }, { status: 401 })

  const loginUrl = new URL("/admin/login", request.url)
  loginUrl.searchParams.set("next", pathname)
  return NextResponse.redirect(loginUrl)
}
