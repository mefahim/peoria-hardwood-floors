// Admin-only (see middleware.ts) — view (masked) and update the Hugging Face
// API token used by the real visualization provider. GET never returns the
// real value, only whether one is set, where it came from, and a masked
// last-4-chars preview.

import { getCredentialStatus, setHfToken } from "@/lib/visualizer/admin-store"

export async function GET() {
  const status = await getCredentialStatus()
  return Response.json(status)
}

export async function POST(request: Request) {
  let body: { hfToken?: unknown }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 })
  }

  if (typeof body.hfToken !== "string" || body.hfToken.trim().length === 0) {
    return Response.json({ error: "hfToken must be a non-empty string." }, { status: 400 })
  }

  await setHfToken(body.hfToken.trim())
  return Response.json(await getCredentialStatus())
}
