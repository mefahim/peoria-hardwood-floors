// Admin-only (see middleware.ts) — read/change which visualization provider is
// active. Deliberately tiny: GET the current choice, POST a new one from the
// fixed AVAILABLE_PROVIDERS set.

import { AVAILABLE_PROVIDERS, getActiveProvider, setActiveProvider, type ProviderId } from "@/lib/visualizer/admin-store"

export async function GET() {
  const provider = await getActiveProvider()
  return Response.json({ provider, availableProviders: AVAILABLE_PROVIDERS })
}

export async function POST(request: Request) {
  let body: { provider?: unknown }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 })
  }

  if (typeof body.provider !== "string" || !(AVAILABLE_PROVIDERS as readonly string[]).includes(body.provider)) {
    return Response.json({ error: `provider must be one of: ${AVAILABLE_PROVIDERS.join(", ")}` }, { status: 400 })
  }

  await setActiveProvider(body.provider as ProviderId)
  return Response.json({ provider: body.provider })
}
