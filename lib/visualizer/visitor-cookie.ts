// Anonymous visitor identity for the quota system. Deliberately NOT the same
// pattern as lib/visualizer/admin-auth.ts's admin session (a stateless hash of a
// single shared password) — a visitor cookie must be an unguessable per-visitor
// value that a client can't forge into an arbitrary id, so it's a random UUID
// signed with a server-only HMAC secret. Node-runtime only (uses node:crypto);
// this module is only ever called from Route Handlers, never from middleware.ts
// (which is Edge-constrained) — see the implementation plan for why DB-backed
// visitor/quota logic lives in Node routes, not Edge middleware.

import { randomUUID, createHmac, timingSafeEqual } from "node:crypto"
import { cookies } from "next/headers"

const COOKIE_NAME = "viz_visitor"
// ~400 days — the practical browser maximum for a persistent cookie — since the
// whole point is that quota state survives across sessions, not just one visit.
const MAX_AGE_SECONDS = 400 * 24 * 60 * 60

function getSecret(): string | null {
  const secret = process.env.VISITOR_COOKIE_SECRET
  return secret && secret.length > 0 ? secret : null
}

function sign(id: string, secret: string): string {
  return createHmac("sha256", secret).update(id).digest("hex")
}

function verifyAndExtractId(cookieValue: string, secret: string): string | null {
  const separatorIndex = cookieValue.lastIndexOf(".")
  if (separatorIndex <= 0) return null
  const id = cookieValue.slice(0, separatorIndex)
  const signature = cookieValue.slice(separatorIndex + 1)

  const expected = Buffer.from(sign(id, secret), "hex")
  let got: Buffer
  try {
    got = Buffer.from(signature, "hex")
  } catch {
    return null
  }
  if (expected.length !== got.length || !timingSafeEqual(expected, got)) return null
  return id
}

export interface VisitorCookieResult {
  visitorId: string
  isNew: boolean
}

// Returns null only when VISITOR_COOKIE_SECRET is unset — callers must fail closed
// (503), the same fail-closed philosophy middleware.ts already applies to a missing
// ADMIN_PASSWORD, rather than silently minting an unsigned, unverifiable cookie.
export async function getOrCreateVisitorId(): Promise<VisitorCookieResult | null> {
  const secret = getSecret()
  if (!secret) return null

  const store = await cookies()
  const existingValue = store.get(COOKIE_NAME)?.value
  if (existingValue) {
    const id = verifyAndExtractId(existingValue, secret)
    if (id) return { visitorId: id, isNew: false }
  }

  const id = randomUUID()
  const cookieValue = `${id}.${sign(id, secret)}`
  store.set(COOKIE_NAME, cookieValue, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
    secure: process.env.NODE_ENV === "production",
  })
  return { visitorId: id, isNew: true }
}
