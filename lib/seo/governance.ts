import { existsSync } from "node:fs"
import { chmod, mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { CONTENT_INTENTS, CONTENT_SEO_RECORDS, GEOGRAPHIC_SCOPES, PAGE_PURPOSES, type ContentIntent, type GeographicScope, type PagePurpose } from "@/lib/seo/content"
import { CONTENT_GROWTH_LIFECYCLE, TOPIC_CLUSTERS, findGrowthTopicConflicts, validateContentBrief, type ContentBrief, type ContentGrowthLifecycle, type GrowthAuditIssue } from "@/lib/seo/content-growth"
import { INTERACTIVE_ROUTE_POLICY, PUBLIC_STATIC_ROUTES } from "@/lib/seo/resolver"
import { services } from "@/lib/site"
import { recordSeoChangeEvent } from "@/lib/seo/management"

const DATA_DIR = path.join(process.cwd(), "data")
const GOVERNANCE_PATH = path.join(DATA_DIR, "seo-governance.json")
const EXISTING_ROUTES = new Set([...PUBLIC_STATIC_ROUTES, ...services.map((service) => `/services/${service.slug}`)])
export const TOPIC_STATUSES = ["proposed", "active", "review", "archived"] as const
export type TopicStatus = (typeof TOPIC_STATUSES)[number]
export type TopicRecord = {
  topicId: string
  topicName: string
  cluster: string
  description: string
  searchIntent: ContentIntent
  pagePurpose: PagePurpose
  primaryServiceRelationship: string
  geographicRelevance: GeographicScope
  status: TopicStatus
  relatedRoutes: string[]
  contentOpportunityIds: string[]
  governanceNotes: string
  reviewStatus: "unreviewed" | "reviewed"
  source: "Existing/code-defined" | "Persisted"
}
export type ConflictState = "FLAG" | "REVIEW" | "DECIDE"
export type GovernanceStore = { version: 1; topics: TopicRecord[]; briefs: ContentBrief[]; conflictStates?: Record<string, ConflictState> }
export type GovernanceSnapshot = { topics: TopicRecord[]; briefs: ContentBrief[]; opportunities: ContentBrief[]; conflicts: CannibalizationReview[]; intents: readonly string[]; purposes: readonly string[]; geographies: readonly string[]; lifecycle: readonly string[] }
export type CannibalizationReview = { id: string; topic: string; searchIntent: string; geography: string; relatedPages: string[]; conflictStatus: "FLAG" | "REVIEW" | "DECIDE"; evidence: string; recommendedDecision: string }

function emptyStore(): GovernanceStore { return { version: 1, topics: [], briefs: [], conflictStates: {} } }
async function ensureDataDir() { if (!existsSync(DATA_DIR)) await mkdir(DATA_DIR, { recursive: true }) }
async function readStore(): Promise<GovernanceStore> { try { const parsed = JSON.parse(await readFile(GOVERNANCE_PATH, "utf8")); if (parsed?.version === 1 && Array.isArray(parsed.topics) && Array.isArray(parsed.briefs)) return parsed as GovernanceStore } catch {} return emptyStore() }
async function writeStore(store: GovernanceStore) { await ensureDataDir(); await writeFile(GOVERNANCE_PATH, JSON.stringify(store, null, 2), "utf8"); try { await chmod(GOVERNANCE_PATH, 0o600) } catch {} }

export function knownTopicClusters() { return TOPIC_CLUSTERS.map((cluster) => ({ id: cluster.id, name: cluster.parentTopic, serviceRoute: cluster.primaryServicePath, geographicScope: cluster.geographicScope, evidenceStatus: cluster.evidenceStatus, status: cluster.contentStatus })) }
function codeDefinedTopics(): TopicRecord[] { return CONTENT_SEO_RECORDS.map((record) => ({ topicId: `route:${record.path}`, topicName: record.primaryTopic, cluster: TOPIC_CLUSTERS.find((cluster) => cluster.primaryServicePath === record.path)?.parentTopic ?? record.purpose, description: `${record.primaryTopic} governance record for ${record.path}.`, searchIntent: record.intent, pagePurpose: record.purpose, primaryServiceRelationship: record.entities.find((entity) => services.some((service) => service.title === entity)) ?? "Peoria Hardwood Floors", geographicRelevance: record.geographicScope, status: "active", relatedRoutes: [record.path], contentOpportunityIds: [], governanceNotes: record.notes, reviewStatus: "reviewed", source: "Existing/code-defined" })) }
export async function listTopics(): Promise<TopicRecord[]> { const store = await readStore(); return [...codeDefinedTopics(), ...store.topics] }
export async function listBriefs(): Promise<ContentBrief[]> { return (await readStore()).briefs }
export async function getTopic(topicId: string): Promise<TopicRecord | null> { return (await listTopics()).find((topic) => topic.topicId === topicId) ?? null }
export async function getBrief(contentId: string): Promise<ContentBrief | null> { return (await listBriefs()).find((brief) => brief.contentId === contentId) ?? null }

export function validateTopicInput(input: unknown): { value?: TopicRecord; error?: string } {
  if (!input || typeof input !== "object") return { error: "Topic payload is required." }
  const raw = input as Record<string, unknown>
  const textFields = ["topicId", "topicName", "cluster", "description", "primaryServiceRelationship", "governanceNotes"] as const
  for (const field of textFields) if (typeof raw[field] !== "string" || !(raw[field] as string).trim()) return { error: `${field} is required.` }
  if (!CONTENT_INTENTS.includes(raw.searchIntent as ContentIntent)) return { error: "Unknown search intent." }
  if (!PAGE_PURPOSES.includes(raw.pagePurpose as PagePurpose)) return { error: "Unknown page purpose." }
  if (!GEOGRAPHIC_SCOPES.includes(raw.geographicRelevance as GeographicScope)) return { error: "Unknown geographic relevance." }
  if (!TOPIC_STATUSES.includes(raw.status as TopicStatus)) return { error: "Unknown topic status." }
  if (!Array.isArray(raw.relatedRoutes) || raw.relatedRoutes.some((route) => typeof route !== "string" || !route.startsWith("/"))) return { error: "Related routes must be internal paths." }
  if (!Array.isArray(raw.contentOpportunityIds) || raw.contentOpportunityIds.some((id) => typeof id !== "string")) return { error: "Content opportunity IDs must be strings." }
  if (raw.topicName && /\b(buy|cheap|best)\b.*\b(buy|cheap|best)\b/i.test(String(raw.topicName))) return { error: "Topic name contains keyword-stuffing signals." }
  const duplicate = codeDefinedTopics().find((topic) => topic.topicName.toLowerCase() === String(raw.topicName).trim().toLowerCase() && topic.topicId !== raw.topicId)
  if (duplicate) return { error: "Topic conflicts with an existing code-defined topic." }
  return { value: { topicId: String(raw.topicId).trim(), topicName: String(raw.topicName).trim(), cluster: String(raw.cluster).trim(), description: String(raw.description).trim(), searchIntent: raw.searchIntent as ContentIntent, pagePurpose: raw.pagePurpose as PagePurpose, primaryServiceRelationship: String(raw.primaryServiceRelationship).trim(), geographicRelevance: raw.geographicRelevance as GeographicScope, status: raw.status as TopicStatus, relatedRoutes: raw.relatedRoutes as string[], contentOpportunityIds: raw.contentOpportunityIds as string[], governanceNotes: String(raw.governanceNotes).trim(), reviewStatus: raw.reviewStatus === "reviewed" ? "reviewed" : "unreviewed", source: "Persisted" } }
}

function existingUrlConflict(proposedUrl: string, currentId?: string) { const existing = EXISTING_ROUTES.has(proposedUrl) ? proposedUrl : null; return existing && existing !== currentId ? existing : null }
export function validateBriefInput(input: unknown, existingId?: string): { value?: ContentBrief; error?: string; issues?: GrowthAuditIssue[] } {
  if (!input || typeof input !== "object") return { error: "Brief payload is required." }
  const raw = input as Record<string, unknown>
  const requiredStrings = ["contentId", "workingTitle", "primaryTopic", "targetAudience", "primaryServiceRelationship", "proposedUrl", "primaryCta"] as const
  for (const field of requiredStrings) if (typeof raw[field] !== "string" || !(raw[field] as string).trim()) return { error: `${field} is required.` }
  if (!CONTENT_INTENTS.includes(raw.searchIntent as ContentIntent)) return { error: "Unknown search intent." }
  if (!PAGE_PURPOSES.includes(raw.pagePurpose as PagePurpose)) return { error: "Unknown page purpose." }
  if (!GEOGRAPHIC_SCOPES.includes(raw.geographicRelevance as GeographicScope)) return { error: "Unknown geographic relevance." }
  if (!CONTENT_GROWTH_LIFECYCLE.includes(raw.status as ContentGrowthLifecycle)) return { error: "Unknown content status." }
  const arrayFields = ["secondaryTopics", "supportingInternalLinks", "requiredEvidence", "unsupportedClaimsToAvoid", "sourceMaterial", "factReviewRequirements", "seoReviewRequirements"] as const
  for (const field of arrayFields) if (!Array.isArray(raw[field]) || (raw[field] as unknown[]).some((value) => typeof value !== "string")) return { error: `${field} must be an array of strings.` }
  const conflict = existingUrlConflict(String(raw.proposedUrl).trim(), existingId)
  const brief: ContentBrief = { contentId: String(raw.contentId).trim(), workingTitle: String(raw.workingTitle).trim(), pagePurpose: raw.pagePurpose as ContentBrief["pagePurpose"], primaryTopic: String(raw.primaryTopic).trim(), secondaryTopics: raw.secondaryTopics as string[], searchIntent: raw.searchIntent as ContentIntent, targetAudience: String(raw.targetAudience).trim(), primaryServiceRelationship: String(raw.primaryServiceRelationship).trim(), geographicRelevance: raw.geographicRelevance as GeographicScope, proposedUrl: String(raw.proposedUrl).trim(), existingUrlConflictCheck: conflict ? "conflict" : "clear", primaryCta: String(raw.primaryCta).trim(), supportingInternalLinks: raw.supportingInternalLinks as string[], requiredEvidence: raw.requiredEvidence as string[], unsupportedClaimsToAvoid: raw.unsupportedClaimsToAvoid as string[], sourceMaterial: raw.sourceMaterial as string[], factReviewRequirements: raw.factReviewRequirements as string[], seoReviewRequirements: raw.seoReviewRequirements as string[], humanApproval: raw.humanApproval === true, status: raw.status as ContentGrowthLifecycle }
  const issues = validateContentBrief(brief)
  if (conflict) issues.push({ severity: "critical", code: "existing-url-conflict", contentId: brief.contentId, message: `Proposed URL conflicts with existing route ${conflict}. Review before approval.` })
  if (brief.geographicRelevance === "specific verified location" && !brief.requiredEvidence.some((item) => /verified/i.test(item))) issues.push({ severity: "critical", code: "missing-location-evidence", contentId: brief.contentId, message: "Location-related content requires verified evidence." })
  return { value: brief, issues }
}

export function buildCannibalizationReviews(briefs: readonly ContentBrief[], states: Record<string, ConflictState> = {}): CannibalizationReview[] {
  const conflicts = findGrowthTopicConflicts(briefs)
  return conflicts.map((issue, index) => { const id = `conflict-${index + 1}`; const brief = briefs.find((candidate) => candidate.proposedUrl === issue.path); const related = CONTENT_SEO_RECORDS.filter((record) => record.primaryTopic.toLowerCase() === brief?.primaryTopic.toLowerCase()).map((record) => record.path); return { id, topic: brief?.primaryTopic ?? "Unknown topic", searchIntent: brief?.searchIntent ?? "Unknown", geography: brief?.geographicRelevance ?? "Unknown", relatedPages: [...related, issue.path ?? ""].filter(Boolean), conflictStatus: states[id] ?? "FLAG", evidence: issue.message, recommendedDecision: "Review the intent, geography, purpose, and proposed URL before deciding whether the opportunity should remain separate." } })
}
export async function getGovernanceSnapshot(): Promise<GovernanceSnapshot> { const topics = await listTopics(); const store = await readStore(); const briefs = store.briefs; return { topics, briefs, opportunities: briefs, conflicts: buildCannibalizationReviews(briefs, store.conflictStates ?? {}), intents: CONTENT_INTENTS, purposes: PAGE_PURPOSES, geographies: GEOGRAPHIC_SCOPES, lifecycle: CONTENT_GROWTH_LIFECYCLE } }

export async function saveTopic(value: TopicRecord, actor: string) { const store = await readStore(); const previous = store.topics.find((topic) => topic.topicId === value.topicId); store.topics = [...store.topics.filter((topic) => topic.topicId !== value.topicId), value]; await writeStore(store); await recordSeoChangeEvent({ id: crypto.randomUUID(), actor, timestamp: new Date().toISOString(), entity: "page", entityId: value.topicId, field: "override", previousValue: previous ? JSON.stringify(previous) : null, newValue: JSON.stringify(value), action: "set", source: "seo-dashboard" }); return value }
export async function saveBrief(value: ContentBrief, actor: string) { const store = await readStore(); const previous = store.briefs.find((brief) => brief.contentId === value.contentId); store.briefs = [...store.briefs.filter((brief) => brief.contentId !== value.contentId), value]; await writeStore(store); await recordSeoChangeEvent({ id: crypto.randomUUID(), actor, timestamp: new Date().toISOString(), entity: "page", entityId: value.contentId, field: "override", previousValue: previous ? JSON.stringify(previous) : null, newValue: JSON.stringify(value), action: "set", source: "seo-dashboard" }); return value }
export async function saveConflictState(id: string, state: ConflictState, actor: string) { const store = await readStore(); const previous = store.conflictStates?.[id] ?? "FLAG"; store.conflictStates = { ...(store.conflictStates ?? {}), [id]: state }; await writeStore(store); await recordSeoChangeEvent({ id: crypto.randomUUID(), actor, timestamp: new Date().toISOString(), entity: "page", entityId: id, field: "override", previousValue: previous, newValue: state, action: "set", source: "seo-dashboard" }); return state }
