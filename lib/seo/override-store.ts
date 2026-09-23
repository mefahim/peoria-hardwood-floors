import { readFileSync } from "node:fs"
import path from "node:path"

export type SeoOverrideRecord = { title?: string; description?: string; updatedAt: string; updatedBy: string }
export type SeoOverrideStore = { version: 1; overrides: Record<string, SeoOverrideRecord> }
const OVERRIDES_PATH = path.join(process.cwd(), "data", "seo-overrides.json")

export function readSeoOverrideSync(route: string): SeoOverrideRecord | null {
  try {
    const parsed = JSON.parse(readFileSync(OVERRIDES_PATH, "utf8")) as SeoOverrideStore
    const override = parsed?.version === 1 ? parsed.overrides?.[route] : undefined
    return override && typeof override === "object" ? override : null
  } catch {
    return null
  }
}
