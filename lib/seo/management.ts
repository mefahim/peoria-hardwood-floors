import { existsSync } from "node:fs"
import { chmod, mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { canonicalUrl, INTERACTIVE_ROUTE_POLICY, PUBLIC_STATIC_ROUTES, SEO_ROUTE_METADATA } from "@/lib/seo/resolver"
import { CONTENT_SEO_RECORDS, contentSeoForPath } from "@/lib/seo/content"
import { services, site } from "@/lib/site"
import { readSeoOverrideSync } from "@/lib/seo/override-store"

const DATA_DIR = path.join(process.cwd(), "data")
const OVERRIDES_PATH = path.join(DATA_DIR, "seo-overrides.json")
const HISTORY_PATH = path.join(DATA_DIR, "seo-change-history.json")
const MAX_TITLE_LENGTH = 160
const MAX_DESCRIPTION_LENGTH = 320
const MAX_HISTORY_ENTRIES = 500

export type SeoOverride = { title?: string; description?: string; updatedAt: string; updatedBy: string }
export type SeoOverridesFile = { version: 1; overrides: Record<string, SeoOverride> }
export type SeoChangeEvent = { id: string; actor: string; timestamp: string; entity: "page" | "service"; entityId: string; field: "title" | "description" | "override"; previousValue: string | null; newValue: string | null; action: "set" | "reset"; source: "seo-dashboard" }
export type ManagedSeoEntity = {
  entity: "page" | "service"
  route: string
  name: string
  pageType: string
  title: string
  description: string
  fallbackTitle: string
  fallbackDescription: string
  override: SeoOverride | null
  canonical: string
  indexable: boolean
  primaryTopic: string | null
  secondaryTopics: string[]
  searchIntent: string | null
  pagePurpose: string | null
  localRelevance: string
  internalLinkStatus: "Passing" | "Issues" | "Unavailable"
  issueCount: number
}

function emptyOverrides(): SeoOverridesFile { return { version: 1, overrides: {} } }
async function ensureDataDir() { if (!existsSync(DATA_DIR)) await mkdir(DATA_DIR, { recursive: true }) }
async function readOverrides(): Promise<SeoOverridesFile> {
  try {
    const parsed = JSON.parse(await readFile(OVERRIDES_PATH, "utf8"))
    if (parsed?.version === 1 && parsed.overrides && typeof parsed.overrides === "object") return parsed as SeoOverridesFile
  } catch { /* fallback to defaults */ }
  return emptyOverrides()
}
async function writeOverrides(value: SeoOverridesFile) { await ensureDataDir(); await writeFile(OVERRIDES_PATH, JSON.stringify(value, null, 2), "utf8"); try { await chmod(OVERRIDES_PATH, 0o600) } catch {} }
async function readHistory(): Promise<SeoChangeEvent[]> {
  try { const parsed = JSON.parse(await readFile(HISTORY_PATH, "utf8")); return Array.isArray(parsed) ? parsed : [] } catch { return [] }
}
async function appendHistory(event: SeoChangeEvent) { await ensureDataDir(); const next = [event, ...(await readHistory())].slice(0, MAX_HISTORY_ENTRIES); await writeFile(HISTORY_PATH, JSON.stringify(next, null, 2), "utf8"); try { await chmod(HISTORY_PATH, 0o600) } catch {} }

export function isManagedSeoRoute(route: string): boolean {
  return (PUBLIC_STATIC_ROUTES as readonly string[]).includes(route) || services.some((service) => `/services/${service.slug}` === route)
}
export function managedEntityType(route: string): "page" | "service" | null {
  if (!isManagedSeoRoute(route)) return null
  return services.some((service) => `/services/${service.slug}` === route) ? "service" : "page"
}
export function validateSeoText(field: "title" | "description", value: unknown): { value?: string; error?: string } {
  if (typeof value !== "string") return { error: `${field} must be a string.` }
  const normalized = value.trim()
  const max = field === "title" ? MAX_TITLE_LENGTH : MAX_DESCRIPTION_LENGTH
  if (!normalized) return { error: `${field} cannot be empty.` }
  if (normalized.length > max) return { error: `${field} must be ${max} characters or fewer.` }
  if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(normalized)) return { error: `${field} contains unsupported control characters.` }
  return { value: normalized }
}
export function validateMutationPayload(body: unknown): { route: string; action: "set" | "reset"; fields?: { title?: string; description?: string }; error?: string } {
  if (!body || typeof body !== "object") return { route: "", action: "set", error: "Invalid request body." }
  const input = body as Record<string, unknown>
  if (typeof input.route !== "string" || !isManagedSeoRoute(input.route)) return { route: "", action: "set", error: "Unknown or protected route." }
  if (input.action !== "set" && input.action !== "reset") return { route: input.route, action: "set", error: "Action must be set or reset." }
  if (input.action === "reset") return { route: input.route, action: "reset" }
  if (!input.fields || typeof input.fields !== "object") return { route: input.route, action: "set", error: "No editable fields supplied." }
  const raw = input.fields as Record<string, unknown>
  const keys = Object.keys(raw)
  if (!keys.length || keys.some((key) => key !== "title" && key !== "description")) return { route: input.route, action: "set", error: "Only title and description are editable." }
  const fields: { title?: string; description?: string } = {}
  for (const field of ["title", "description"] as const) if (field in raw) { const result = validateSeoText(field, raw[field]); if (result.error) return { route: input.route, action: "set", error: result.error }; fields[field] = result.value }
  return { route: input.route, action: "set", fields }
}

export async function saveSeoOverride(route: string, fields: { title?: string; description?: string }, actor: string): Promise<SeoOverride> {
  const store = await readOverrides(); const previous = store.overrides[route] ?? null; const now = new Date().toISOString()
  const next: SeoOverride = { ...(fields.title !== undefined ? { title: fields.title } : {}), ...(fields.description !== undefined ? { description: fields.description } : {}), updatedAt: now, updatedBy: actor }
  store.overrides[route] = next; await writeOverrides(store)
  for (const field of ["title", "description"] as const) if (fields[field] !== undefined && fields[field] !== previous?.[field]) await appendHistory({ id: crypto.randomUUID(), actor, timestamp: now, entity: managedEntityType(route)!, entityId: route, field, previousValue: previous?.[field] ?? null, newValue: fields[field]!, action: "set", source: "seo-dashboard" })
  return next
}
export async function resetSeoOverride(route: string, actor: string): Promise<void> {
  const store = await readOverrides(); const previous = store.overrides[route]; if (!previous) return
  delete store.overrides[route]; const now = new Date().toISOString(); await writeOverrides(store)
  await appendHistory({ id: crypto.randomUUID(), actor, timestamp: now, entity: managedEntityType(route)!, entityId: route, field: "override", previousValue: JSON.stringify({ title: previous.title ?? null, description: previous.description ?? null }), newValue: null, action: "reset", source: "seo-dashboard" })
}
export async function getSeoChangeHistory(): Promise<SeoChangeEvent[]> { return readHistory() }

function fallbackFor(route: string) {
  const service = services.find((candidate) => `/services/${candidate.slug}` === route)
  if (service) return { entity: "service" as const, name: service.title, pageType: "service", title: `${service.title} in Peoria & Central Illinois`, description: `${service.short} Call ${site.phone} to discuss the project scope.` }
  const config = SEO_ROUTE_METADATA[route as keyof typeof SEO_ROUTE_METADATA]
  return { entity: "page" as const, name: route === "/" ? "Home" : route.slice(1).replace(/-/g, " "), pageType: contentSeoForPath(route)?.purpose ?? "public route", title: config?.title ?? route, description: config?.description ?? "" }
}
export async function listManagedSeoEntities(): Promise<ManagedSeoEntity[]> {
  const store = await readOverrides()
  return [...PUBLIC_STATIC_ROUTES, ...services.map((service) => `/services/${service.slug}`)].map((route) => {
    const fallback = fallbackFor(route); const override = store.overrides[route] ?? null; const content = contentSeoForPath(route)
    const title = override?.title ?? fallback.title; const description = override?.description ?? fallback.description
    return { entity: fallback.entity, route, name: fallback.name, pageType: fallback.pageType, title, description, fallbackTitle: fallback.title, fallbackDescription: fallback.description, override, canonical: canonicalUrl(route), indexable: !INTERACTIVE_ROUTE_POLICY[route as keyof typeof INTERACTIVE_ROUTE_POLICY], primaryTopic: content?.primaryTopic ?? null, secondaryTopics: content?.secondaryTopics ?? [], searchIntent: content?.intent ?? null, pagePurpose: content?.purpose ?? null, localRelevance: content?.geographicScope ?? "Unavailable", internalLinkStatus: content ? "Passing" : "Unavailable", issueCount: 0 }
  })
}
export async function getManagedSeoEntity(route: string): Promise<ManagedSeoEntity | null> { return (await listManagedSeoEntities()).find((entity) => entity.route === route) ?? null }
export const EDITABLE_SEO_FIELDS = ["title", "description"] as const
export const READ_ONLY_SEO_FIELDS = ["canonical", "indexability", "primaryTopic", "secondaryTopics", "searchIntent", "pagePurpose", "localRelevance", "internalLinkStatus"] as const
