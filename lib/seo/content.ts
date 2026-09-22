import { canonicalUrl, INTERACTIVE_ROUTE_POLICY, PRODUCTION_ORIGIN, PUBLIC_STATIC_ROUTES, SEO_ROUTE_METADATA } from "@/lib/seo/resolver"
import { services, site } from "@/lib/site"
import { isLocationPublishable, locationPath, locationRecords } from "@/lib/seo/local"

export const CONTENT_INTENTS = ["informational", "commercial", "transactional", "navigational", "local-service"] as const
export type ContentIntent = (typeof CONTENT_INTENTS)[number]

export const PAGE_PURPOSES = ["home", "about", "service-hub", "service", "product", "gallery", "pricing", "contact", "case-study", "guide", "comparison", "location"] as const
export type PagePurpose = (typeof PAGE_PURPOSES)[number]

export const GEOGRAPHIC_SCOPES = ["global", "state/region", "service-area", "specific verified location"] as const
export type GeographicScope = (typeof GEOGRAPHIC_SCOPES)[number]

export const CONTENT_STATUSES = ["draft", "review", "approved", "published", "archived"] as const
export type ContentStatus = (typeof CONTENT_STATUSES)[number]

export type ContentLink = {
  label: string
  href: string
  relation: "primary-service" | "related-service" | "contact" | "supporting-content"
}

export type ContentSeoRecord = {
  path: string
  primaryTopic: string
  secondaryTopics: string[]
  intent: ContentIntent
  secondaryIntents: ContentIntent[]
  audience: string
  purpose: PagePurpose
  geographicScope: GeographicScope
  entities: string[]
  primaryCta: string
  requiredSections: string[]
  internalLinks: ContentLink[]
  status: ContentStatus
  approval: "pending" | "approved"
  notes: string
}

export type ContentTemplate = {
  purpose: PagePurpose
  requiredSections: string[]
  indexableByDefault: boolean
}

export type ContentSuggestion = {
  path: string
  kind: "topic" | "intent" | "title" | "description" | "heading" | "internal-link" | "content-gap" | "faq"
  recommendation: string
  requiresApproval: true
  publication: "not-published"
}

export type ContentAuditIssue = {
  severity: "critical" | "warning" | "informational"
  code: string
  path?: string
  message: string
}

export const VERIFIED_CONTENT_FACTS = [
  site.name,
  site.tagline,
  site.serviceRadius,
  "Peoria",
  "Central Illinois",
  "family-owned",
  ...services.map((service) => service.title),
]

const serviceLinks = services.map((service) => ({
  label: service.title,
  href: `/services/${service.slug}`,
  relation: "related-service" as const,
}))

const CONTENT_RECORDS: ContentSeoRecord[] = [
  {
    path: "/",
    primaryTopic: "hardwood flooring installation and refinishing",
    secondaryTopics: ["floor stains", "floor finishes", "flooring materials"],
    intent: "local-service",
    secondaryIntents: ["commercial"],
    audience: "Homeowners and businesses planning a flooring project.",
    purpose: "home",
    geographicScope: "service-area",
    entities: [site.name, "hardwood flooring installation", "hardwood floor refinishing"],
    primaryCta: "/contact",
    requiredSections: ["value proposition", "primary services", "supporting capabilities", "process", "service context", "CTA"],
    internalLinks: [{ label: "Explore hardwood flooring services", href: "/services", relation: "primary-service" }, { label: "Talk through your project", href: "/contact", relation: "contact" }],
    status: "published",
    approval: "approved",
    notes: "Uses only the verified Peoria/Central Illinois service-market context.",
  },
  {
    path: "/about",
    primaryTopic: "Peoria Hardwood Floors business and service approach",
    secondaryTopics: ["flooring preparation", "honest project guidance"],
    intent: "informational",
    secondaryIntents: ["local-service"],
    audience: "People evaluating the business before contacting it.",
    purpose: "about",
    geographicScope: "service-area",
    entities: [site.name],
    primaryCta: "/contact",
    requiredSections: ["business identity", "service philosophy", "approach", "service context", "CTA"],
    internalLinks: [{ label: "See our services", href: "/services", relation: "primary-service" }, { label: "Contact the team", href: "/contact", relation: "contact" }],
    status: "published",
    approval: "approved",
    notes: "No founding date, team size, awards, or credentials are asserted.",
  },
  {
    path: "/services",
    primaryTopic: "hardwood flooring services",
    secondaryTopics: ["installation", "refinishing", "sandless refinishing", "commercial floors", "deck refinishing", "cabinet refinishing"],
    intent: "commercial",
    secondaryIntents: ["local-service", "transactional"],
    audience: "Homeowners, businesses, and facilities comparing flooring services.",
    purpose: "service-hub",
    geographicScope: "service-area",
    entities: [site.name, ...services.map((service) => service.title)],
    primaryCta: "/contact",
    requiredSections: ["service category", "service differences", "six service links", "project next step", "CTA"],
    internalLinks: [...serviceLinks, { label: "Talk through a project", href: "/contact", relation: "contact" }],
    status: "published",
    approval: "approved",
    notes: "The hub links only to the six centralized service records.",
  },
  {
    path: "/finishes",
    primaryTopic: "hardwood floor finishes",
    secondaryTopics: ["waterborne finish", "oil-based finish", "matte finish", "hardwax oil"],
    intent: "informational",
    secondaryIntents: ["commercial"],
    audience: "People comparing finish directions for a flooring project.",
    purpose: "product",
    geographicScope: "service-area",
    entities: [site.name, "hardwood floor finishes"],
    primaryCta: "/contact",
    requiredSections: ["finish options", "look and feel", "selection guidance", "CTA"],
    internalLinks: [{ label: "Explore refinishing", href: "/services/hardwood-floor-refinishing-peoria-il", relation: "related-service" }, { label: "Contact the team", href: "/contact", relation: "contact" }],
    status: "published",
    approval: "approved",
    notes: "Informational finish guidance is not presented as a separate service entity.",
  },
  {
    path: "/stains",
    primaryTopic: "hardwood floor stains and colors",
    secondaryTopics: ["natural stain", "warm neutral stain", "gray stain", "deep stain"],
    intent: "informational",
    secondaryIntents: ["commercial"],
    audience: "People comparing stain directions before selecting samples.",
    purpose: "product",
    geographicScope: "service-area",
    entities: [site.name, "hardwood floor stains"],
    primaryCta: "/contact",
    requiredSections: ["stain directions", "sample selection", "floor context", "CTA"],
    internalLinks: [{ label: "Compare finish options", href: "/finishes", relation: "supporting-content" }, { label: "Discuss a refinishing project", href: "/services/hardwood-floor-refinishing-peoria-il", relation: "related-service" }],
    status: "published",
    approval: "approved",
    notes: "No city-specific pages or unsupported color claims are created.",
  },
  {
    path: "/products",
    primaryTopic: "hardwood flooring products and materials",
    secondaryTopics: ["solid hardwood", "engineered wood", "laminate", "LVP", "stains", "finishes"],
    intent: "commercial",
    secondaryIntents: ["informational"],
    audience: "People comparing flooring materials and project options.",
    purpose: "product",
    geographicScope: "service-area",
    entities: [site.name, "hardwood flooring products"],
    primaryCta: "/contact",
    requiredSections: ["material categories", "selection considerations", "project relationship", "CTA"],
    internalLinks: [{ label: "Plan an installation", href: "/services/hardwood-floor-installation-peoria-il", relation: "related-service" }, { label: "Contact the team", href: "/contact", relation: "contact" }],
    status: "published",
    approval: "approved",
    notes: "Product categories are not converted into fabricated product entities or prices.",
  },
  {
    path: "/gallery",
    primaryTopic: "hardwood flooring project gallery",
    secondaryTopics: ["installation examples", "refinishing examples", "floor details"],
    intent: "commercial",
    secondaryIntents: ["informational"],
    audience: "People seeking visual context before discussing a project.",
    purpose: "gallery",
    geographicScope: "service-area",
    entities: [site.name, "hardwood flooring projects"],
    primaryCta: "/contact",
    requiredSections: ["visual examples", "service context", "CTA"],
    internalLinks: [...serviceLinks.slice(0, 2), { label: "Contact the team", href: "/contact", relation: "contact" }],
    status: "published",
    approval: "approved",
    notes: "Images are not individually labeled as verified local projects by this model.",
  },
  {
    path: "/pricing",
    primaryTopic: "hardwood flooring project pricing factors",
    secondaryTopics: ["project scope", "prep", "materials", "finish selection"],
    intent: "commercial",
    secondaryIntents: ["transactional"],
    audience: "People planning a flooring project and comparing what affects cost.",
    purpose: "pricing",
    geographicScope: "service-area",
    entities: [site.name, "hardwood flooring project pricing"],
    primaryCta: "/contact",
    requiredSections: ["pricing factors", "scope variables", "quote path", "CTA"],
    internalLinks: [{ label: "Try the services overview", href: "/services", relation: "primary-service" }, { label: "Request a conversation", href: "/contact", relation: "contact" }],
    status: "published",
    approval: "approved",
    notes: "No starting price or fabricated quote is represented.",
  },
  {
    path: "/contact",
    primaryTopic: "contact Peoria Hardwood Floors",
    secondaryTopics: ["flooring project assessment", "service questions"],
    intent: "navigational",
    secondaryIntents: ["local-service", "transactional"],
    audience: "People ready to discuss a flooring project.",
    purpose: "contact",
    geographicScope: "service-area",
    entities: [site.name],
    primaryCta: "/contact",
    requiredSections: ["business identity", "verified contact methods", "service context", "CTA"],
    internalLinks: [{ label: "Review services", href: "/services", relation: "primary-service" }],
    status: "published",
    approval: "approved",
    notes: "Address and hours remain omitted until verified through Phase 04.",
  },
]

const serviceRecords: ContentSeoRecord[] = services.map((service) => ({
  path: `/services/${service.slug}`,
  primaryTopic: service.title.toLowerCase(),
  secondaryTopics: service.process.slice(0, 3).map((step) => step.replace(/\.$/, "").toLowerCase()),
  intent: "local-service",
  secondaryIntents: ["commercial", "transactional"],
  audience: service.who,
  purpose: "service",
  geographicScope: "service-area",
  entities: [site.name, service.title],
  primaryCta: "/contact",
  requiredSections: ["service overview", "who it is for", "process", "project considerations", "FAQs", "CTA", "related services"],
  internalLinks: [
    { label: "Explore all services", href: "/services", relation: "primary-service" },
    ...services.filter((candidate) => candidate.slug !== service.slug).slice(0, 3).map((candidate) => ({ label: candidate.title, href: `/services/${candidate.slug}`, relation: "related-service" as const })),
    { label: "Talk through your project", href: "/contact", relation: "contact" },
  ],
  status: "published",
  approval: "approved",
  notes: "Service content is sourced from the centralized service record; no new service claim is introduced.",
}))

export const CONTENT_SEO_RECORDS: readonly ContentSeoRecord[] = [...CONTENT_RECORDS, ...serviceRecords]

export const CONTENT_TEMPLATES: readonly ContentTemplate[] = [
  { purpose: "home", requiredSections: ["value proposition", "services", "proof", "process", "service context", "CTA"], indexableByDefault: true },
  { purpose: "service-hub", requiredSections: ["category", "service differences", "service links", "CTA"], indexableByDefault: true },
  { purpose: "service", requiredSections: ["overview", "audience", "process", "considerations", "FAQs", "CTA", "related services"], indexableByDefault: true },
  { purpose: "about", requiredSections: ["identity", "approach", "service context", "CTA"], indexableByDefault: true },
  { purpose: "product", requiredSections: ["options", "selection context", "service relationship", "CTA"], indexableByDefault: true },
  { purpose: "gallery", requiredSections: ["visual proof", "service context", "CTA"], indexableByDefault: true },
  { purpose: "pricing", requiredSections: ["pricing factors", "scope", "quote path", "CTA"], indexableByDefault: true },
  { purpose: "contact", requiredSections: ["identity", "contact methods", "service context", "CTA"], indexableByDefault: true },
  { purpose: "guide", requiredSections: ["problem", "useful explanation", "related service", "CTA"], indexableByDefault: true },
  { purpose: "case-study", requiredSections: ["verified project", "challenge", "approach", "result", "service relationship"], indexableByDefault: true },
  { purpose: "location", requiredSections: ["verified location", "service relationship", "unique content", "internal links"], indexableByDefault: false },
  { purpose: "comparison", requiredSections: ["options", "differences", "decision guidance"], indexableByDefault: true },
]

export function isApprovedIntent(value: string): value is ContentIntent {
  return (CONTENT_INTENTS as readonly string[]).includes(value)
}

export function isApprovedPurpose(value: string): value is PagePurpose {
  return (PAGE_PURPOSES as readonly string[]).includes(value)
}

export function isApprovedGeographicScope(value: string): value is GeographicScope {
  return (GEOGRAPHIC_SCOPES as readonly string[]).includes(value)
}

export function contentSeoForPath(path: string): ContentSeoRecord | undefined {
  return CONTENT_SEO_RECORDS.find((record) => record.path === path)
}

export function indexableContentRecords(): readonly ContentSeoRecord[] {
  return CONTENT_SEO_RECORDS.filter((record) => record.status === "published" && record.approval === "approved" && !INTERACTIVE_ROUTE_POLICY[record.path as keyof typeof INTERACTIVE_ROUTE_POLICY])
}

export function validateContentSeoRecord(record: ContentSeoRecord): ContentAuditIssue[] {
  const issues: ContentAuditIssue[] = []
  if (!record.primaryTopic.trim()) issues.push({ severity: "critical", code: "missing-primary-topic", path: record.path, message: "Indexable page has no primary topic." })
  if (!isApprovedIntent(record.intent)) issues.push({ severity: "critical", code: "invalid-intent", path: record.path, message: "Page intent is not from the approved taxonomy." })
  if (!isApprovedPurpose(record.purpose)) issues.push({ severity: "critical", code: "invalid-purpose", path: record.path, message: "Page purpose is not registered." })
  if (!isApprovedGeographicScope(record.geographicScope)) issues.push({ severity: "critical", code: "invalid-geographic-scope", path: record.path, message: "Geographic scope is not approved." })
  if (!record.primaryCta.startsWith("/")) issues.push({ severity: "critical", code: "invalid-cta", path: record.path, message: "Primary CTA must be an internal path." })
  if (record.approval !== "approved" && record.status === "published") issues.push({ severity: "critical", code: "unapproved-published-content", path: record.path, message: "Published content must be approved." })
  if (record.requiredSections.length === 0) issues.push({ severity: "warning", code: "missing-content-contract", path: record.path, message: "Page has no required content sections." })
  return issues
}

export function findTopicConflicts(records: readonly ContentSeoRecord[]): ContentAuditIssue[] {
  const groups = new Map<string, ContentSeoRecord[]>()
  for (const record of records) {
    const key = `${record.primaryTopic}|${record.intent}|${record.geographicScope}`
    groups.set(key, [...(groups.get(key) ?? []), record])
  }
  return [...groups.entries()]
    .filter(([, grouped]) => grouped.length > 1)
    .map(([key, grouped]) => ({ severity: "warning", code: "topic-conflict", message: `Pages share primary topic, intent, and geography: ${key}. Review before changing URLs or indexability.` }))
}

export function findBrokenInternalLinks(records: readonly ContentSeoRecord[]): ContentAuditIssue[] {
  const validDestinations = new Set([...PUBLIC_STATIC_ROUTES, ...services.map((service) => `/services/${service.slug}`)])
  return records.flatMap((record) => record.internalLinks
    .filter((link) => !validDestinations.has(link.href))
    .map((link) => ({ severity: "critical" as const, code: "broken-internal-link", path: record.path, message: `${link.href} is not an approved public destination.` })))
}

export function findOrphanPages(records: readonly ContentSeoRecord[], sitemapPaths: readonly string[]): ContentAuditIssue[] {
  const linked = new Set(records.flatMap((record) => record.internalLinks.map((link) => link.href)))
  return records
    .filter((record) => sitemapPaths.includes(record.path) && record.path !== "/" && !linked.has(record.path))
    .map((record) => ({ severity: "warning" as const, code: "orphan-page", path: record.path, message: "Indexable sitemap page has no meaningful internal-link recommendation." }))
}

export function findUnsupportedClaims(text: string, verifiedFacts: readonly string[] = VERIFIED_CONTENT_FACTS): string[] {
  const highRiskClaims = ["award-winning", "certified", "years in business", "guaranteed", "guarantee", "over 100 projects", "hundreds of customers", "official showroom"]
  return highRiskClaims.filter((claim) => text.toLowerCase().includes(claim) && !verifiedFacts.some((fact) => fact.toLowerCase().includes(claim)))
}

export function createContentSuggestion(input: Omit<ContentSuggestion, "requiresApproval" | "publication">): ContentSuggestion {
  return { ...input, requiresApproval: true, publication: "not-published" }
}

export function validateSlug(slug: string, existingPaths: readonly string[] = [...PUBLIC_STATIC_ROUTES, ...services.map((service) => `/services/${service.slug}`)]): boolean {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return false
  return !existingPaths.includes(`/${slug}`) && !existingPaths.some((path) => path.endsWith(`/${slug}`))
}

export function isSafeSeoText(value: string): boolean {
  return !/<\s*\/?\s*(script|iframe)|on[a-z]+\s*=|javascript\s*:/i.test(value)
}

export function futureLocationContentIsEligible(path: string): boolean {
  const location = locationRecords.find((candidate) => locationPath(candidate) === path)
  return Boolean(location && isLocationPublishable(location))
}

export function canonicalContentPath(path: string): string {
  return canonicalUrl(path.startsWith(PRODUCTION_ORIGIN) ? path : path)
}

export { SEO_ROUTE_METADATA }
