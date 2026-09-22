// Saves the customer's uploaded room photo for the admin audit trail. Deliberately
// NOT under public/ (unlike the generated output, which the browser must be able to
// load directly) — these are photos of a customer's home, kept admin-only and
// served only through the authenticated app/api/admin/generation-image route.
// Best-effort, same philosophy as the existing persistGeneratedImage in
// app/api/visualizer/route.ts: a save failure must never fail the actual request.

import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { isValidRequestId } from "@/lib/visualizer/generation"

const INPUT_DIR = path.join(process.cwd(), "data", "generation-inputs")

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
}

export async function saveInputImage(requestId: string, file: Blob, mimeType: string): Promise<string | null> {
  if (!isValidRequestId(requestId)) return null
  const extension = EXTENSION_BY_MIME[mimeType] ?? "bin"
  try {
    const bytes = Buffer.from(await file.arrayBuffer())
    await mkdir(INPUT_DIR, { recursive: true })
    const fileName = `${requestId}.${extension}`
    await writeFile(path.join(INPUT_DIR, fileName), bytes)
    return fileName
  } catch {
    return null
  }
}

// Resolves a stored input-image filename (as read back from the generations table,
// never from raw client input) to its absolute path.
export function resolveInputImagePath(fileName: string): string {
  return path.join(INPUT_DIR, path.basename(fileName))
}
