// Stateless admin session token — shared by middleware.ts (Edge runtime) and
// the login/logout route handlers (Node runtime). Deliberately uses only the
// standard Web Crypto API (globalThis.crypto.subtle), never `node:crypto` or
// `node:fs`, because Next.js Middleware runs on the Edge runtime, which has
// neither of those Node built-ins available.
//
// No session store: the cookie's value IS the proof — a SHA-256 hash of a
// SIGNING SECRET, never the login password itself. This is deliberately
// decoupled from the password (see lib/visualizer/admin-store.ts's
// verifyAdminPassword): the password can now be changed from the dashboard
// (stored as a scrypt hash, DB/file-backed, Node-only), but Edge middleware
// has no DB/file access and can't know the current password. The signing
// secret instead comes from an env var — ADMIN_SESSION_SECRET if set, else
// ADMIN_PASSWORD as a bootstrap fallback — which never changes when the
// dashboard password changes, so existing sessions and new logins both keep
// working without requiring a restart or invalidating other devices.

export const ADMIN_SESSION_COOKIE = "admin_session"
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30 // 30 days

async function sha256Hex(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value)
  const digest = await crypto.subtle.digest("SHA-256", bytes)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
}

// Edge-safe (plain env var read, no fs/DB) — exported so the login route can
// also fail closed the same way middleware does if neither var is set.
export function getSessionSigningSecret(): string | undefined {
  const secret = process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD
  return secret && secret.length > 0 ? secret : undefined
}

export async function computeSessionToken(): Promise<string | null> {
  const secret = getSessionSigningSecret()
  if (!secret) return null
  return sha256Hex(`peoria-admin-session:${secret}`)
}

export async function isValidSessionCookie(cookieValue: string | undefined): Promise<boolean> {
  if (!cookieValue) return false
  const expected = await computeSessionToken()
  return expected !== null && cookieValue === expected
}

export const SESSION_COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: SESSION_MAX_AGE_SECONDS,
  secure: process.env.NODE_ENV === "production",
}
