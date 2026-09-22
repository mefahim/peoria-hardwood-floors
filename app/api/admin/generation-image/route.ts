// Streams an input or output image for a generation record, admin-only. Covered
// automatically by middleware.ts's existing matcher ("/api/admin/:path*") — no
// per-route auth code needed here, same as the other admin routes.
//
// Path safety: the actual filesystem path is NEVER built from client input. `id`
// is validated against the exact requestId shape before touching the DB at all,
// then the path comes only from the DB row's own input_image_ref/output_image_ref
// column (written by the server itself in app/api/visualizer/route.ts) — never
// reconstructed from the query string.

import { readFile } from "node:fs/promises"
import path from "node:path"
import { db } from "@/lib/db/client"
import { isValidRequestId } from "@/lib/visualizer/generation"
import { resolveInputImagePath } from "@/lib/visualizer/input-image-store"

const EXTENSION_CONTENT_TYPE: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
}

export async function GET(request: Request) {
  const url = new URL(request.url)
  const id = url.searchParams.get("id")
  const kind = url.searchParams.get("kind")

  if (!isValidRequestId(id) || (kind !== "input" && kind !== "output")) {
    return Response.json({ error: "Invalid request." }, { status: 400 })
  }

  const row = db
    .prepare<[string], { input_image_ref: string | null; output_image_ref: string | null }>("SELECT input_image_ref, output_image_ref FROM generations WHERE id = ?")
    .get(id)
  if (!row) return Response.json({ error: "Not found." }, { status: 404 })

  const ref = kind === "input" ? row.input_image_ref : row.output_image_ref
  if (!ref) return Response.json({ error: "No image stored for this generation." }, { status: 404 })

  try {
    let bytes: Buffer
    if (kind === "input") {
      // ref is a bare filename (e.g. "viz_xxx.jpg") written by saveInputImage —
      // resolveInputImagePath additionally basename()s it before touching disk.
      bytes = await readFile(resolveInputImagePath(ref))
    } else if (ref.startsWith("/") && !ref.startsWith("//") && !ref.includes("..")) {
      // A root-relative local asset — either a real provider's persisted output
      // (/generated/{requestId}.jpg) or the mock provider's static placeholder
      // (/images/hero-kitchen.png). Both are server-written values, never client
      // input, but the ".." check is defense in depth regardless.
      bytes = await readFile(path.join(process.cwd(), "public", ref))
    } else {
      // A remote provider URL that was never successfully persisted locally
      // (persistGeneratedImage falls back to the original remote URL on save
      // failure) — nothing on our filesystem to stream.
      return Response.json({ error: "Image is not stored locally." }, { status: 404 })
    }

    const extension = ref.split(".").pop()?.toLowerCase() ?? ""
    const contentType = EXTENSION_CONTENT_TYPE[extension] ?? "application/octet-stream"
    return new Response(new Uint8Array(bytes), { headers: { "Content-Type": contentType, "Cache-Control": "private, no-store" } })
  } catch {
    return Response.json({ error: "Image file not found." }, { status: 404 })
  }
}
