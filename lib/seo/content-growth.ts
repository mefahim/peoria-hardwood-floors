import { services } from "@/lib/site"
import { CONTENT_SEO_RECORDS, type ContentIntent, type GeographicScope, type PagePurpose } from "@/lib/seo/content"
import { INTERACTIVE_ROUTE_POLICY, PUBLIC_STATIC_ROUTES } from "@/lib/seo/resolver"

export const CONTENT_GROWTH_LIFECYCLE = ["IDEA", "BRIEF", "DRAFT", "FACT_REVIEW", "SEO_REVIEW", "APPROVED", "PUBLISHED", "REVIEW"] as const
export type ContentGrowthLifecycle = (typeof CONTENT_GROWTH_LIFECYCLE)[number]

export const EVIDENCE_STATUSES = ["missing", "partial", "verified"] as const
export type EvidenceStatus = (typeof EVIDENCE_STATUSES)[number]

export const CASE_STUDY_PUBLICATION_STATUSES = ["unpublished", "approved", "published", "archived"] as const
export type CaseStudyPublicationStatus = (typeof CASE_STUDY_PUBLICATION_STATUSES)[number]

export type TopicCluster = {
  id: string
  parentTopic: string
  supportingTopics: string[]
  primaryServicePath: string
  geographicScope: GeographicScope
  evidenceStatus: EvidenceStatus
  contentStatus: "planning-only"
}

export const TOPIC_CLUSTERS: readonly TopicCluster[] = [
  {
    id: "hardwood-floor-installation",
    parentTopic: "Hardwood Floor Installation",
    supportingTopics: ["hardwood flooring selection", "installation preparation", "hardwood floor care", "installation expectations", "flooring material considerations"],
    primaryServicePath: "/services/hardwood-floor-installation-peoria-il",
    geographicScope: "service-area",
    evidenceStatus: "partial",
    contentStatus: "planning-only",
  },
  {
    id: "hardwood-floor-refinishing",
    parentTopic: "Hardwood Floor Refinishing",
    supportingTopics: ["refinishing process", "sanding considerations", "finish selection", "maintenance after refinishing", "when refinishing may be appropriate"],
    primaryServicePath: "/services/hardwood-floor-refinishing-peoria-il",
    geographicScope: "service-area",
    evidenceStatus: "partial",
    contentStatus: "planning-only",
  },
  {
    id: "sandless-floor-refinishing",
    parentTopic: "Sandless Floor Refinishing",
    supportingTopics: ["when sandless refinishing is appropriate", "sandless vs traditional refinishing", "preparation expectations", "limitations and considerations"],
    primaryServicePath: "/services/sandless-floor-refinishing-peoria-il",
    geographicScope: "service-area",
    evidenceStatus: "partial",
    contentStatus: "planning-only",
  },
  {
    id: "commercial-sports-flooring",
    parentTopic: "Commercial & Sports Flooring",
    supportingTopics: ["commercial flooring considerations", "sports-floor maintenance", "facility preparation", "finish and durability considerations"],
    primaryServicePath: "/services/commercial-sports-flooring-central-illinois",
    geographicScope: "state/region",
    evidenceStatus: "partial",
    contentStatus: "planning-only",
  },
  {
    id: "deck-refinishing",
    parentTopic: "Deck Refinishing",
    supportingTopics: ["deck preparation", "refinishing process", "maintenance", "finish considerations"],
    primaryServicePath: "/services/deck-refinishing-peoria-il",
    geographicScope: "service-area",
    evidenceStatus: "partial",
    contentStatus: "planning-only",
  },
  {
    id: "cabinet-refinishing",
    parentTopic: "Cabinet Refinishing",
    supportingTopics: ["cabinet preparation", "refinishing process", "finish considerations", "maintenance"],
    primaryServicePath: "/services/cabinet-refinishing-peoria-il",
    geographicScope: "service-area",
    evidenceStatus: "partial",
    contentStatus: "planning-only",
  },
]

export type ContentBrief = {
  contentId: string
  workingTitle: string
  pagePurpose: PagePurpose | "guide" | "comparison" | "case-study"
  primaryTopic: string
  secondaryTopics: string[]
  searchIntent: ContentIntent
  targetAudience: string
  primaryServiceRelationship: string
  geographicRelevance: GeographicScope
  proposedUrl: string
  existingUrlConflictCheck: "not-reviewed" | "clear" | "conflict"
  primaryCta: string
  supportingInternalLinks: string[]
  requiredEvidence: string[]
  unsupportedClaimsToAvoid: string[]
  sourceMaterial: string[]
  factReviewRequirements: string[]
  seoReviewRequirements: string[]
  humanApproval: boolean
  status: ContentGrowthLifecycle
}

export type GrowthAuditIssue = {
  severity: "critical" | "warning" | "informational"
  code: string
  contentId?: string
  path?: string
  message: string
}

export function validateContentBrief(brief: ContentBrief): GrowthAuditIssue[] {
  const issues: GrowthAuditIssue[] = []
  const requiredText: Array<[string, string]> = [
    ["contentId", brief.contentId],
    ["workingTitle", brief.workingTitle],
    ["primaryTopic", brief.primaryTopic],
    ["targetAudience", brief.targetAudience],
    ["primaryServiceRelationship", brief.primaryServiceRelationship],
    ["proposedUrl", brief.proposedUrl],
    ["primaryCta", brief.primaryCta],
  ]
  for (const [field, value] of requiredText) {
    if (!value.trim()) issues.push({ severity: "critical", code: "missing-brief-field", contentId: brief.contentId, message: `${field} is required.` })
  }
  if (!brief.proposedUrl.startsWith("/")) issues.push({ severity: "critical", code: "invalid-proposed-url", contentId: brief.contentId, message: "A proposed URL must be an internal path." })
  if (!brief.primaryCta.startsWith("/")) issues.push({ severity: "critical", code: "invalid-brief-cta", contentId: brief.contentId, message: "A primary CTA must be an internal path." })
  if (brief.existingUrlConflictCheck !== "clear") issues.push({ severity: "warning", code: "url-conflict-review-required", contentId: brief.contentId, message: "The brief cannot proceed until its existing URL conflict check is clear." })
  if (brief.status === "PUBLISHED" && !brief.humanApproval) issues.push({ severity: "critical", code: "unapproved-content", contentId: brief.contentId, message: "Content cannot be published without human approval." })
  if (brief.status === "PUBLISHED" && brief.sourceMaterial.length === 0) issues.push({ severity: "critical", code: "missing-source-material", contentId: brief.contentId, message: "Published content requires source material." })
  return issues
}

export type ProjectLocationEvidence = {
  value: string
  verified: boolean
}

export type CaseStudyEvidence = {
  projectIdentifier: string
  projectType: string
  projectLocation?: ProjectLocationEvidence
  servicePerformed: string
  verifiedProjectDescription: string
  projectImages: string[]
  factualProjectDetails: string[]
  documentedGoals?: string[]
  documentedWorkPerformed: string[]
  documentedOutcome?: string
  materials?: string[]
  finish?: string
  approximateScope?: string
  timeline?: string
  clientApprovedQuote?: string
  beforeAfterImagery?: boolean
  evidenceStatus: EvidenceStatus
}

export type CaseStudyRecord = CaseStudyEvidence & {
  slug: string
  relatedServicePath: string
  publicationStatus: CaseStudyPublicationStatus
  humanApproval: boolean
}

export const CASE_STUDIES: readonly CaseStudyRecord[] = []

export function canPublishCaseStudy(record: CaseStudyRecord): boolean {
  return Boolean(
    record.slug &&
      record.projectIdentifier &&
      record.projectType &&
      record.servicePerformed &&
      record.verifiedProjectDescription &&
      record.projectImages.length > 0 &&
      record.factualProjectDetails.length > 0 &&
      record.documentedWorkPerformed.length > 0 &&
      record.evidenceStatus === "verified" &&
      record.humanApproval &&
      (record.publicationStatus === "approved" || record.publicationStatus === "published") &&
      (!record.projectLocation || record.projectLocation.verified),
  )
}

export function validateCaseStudyRecord(record: CaseStudyRecord): GrowthAuditIssue[] {
  const issues: GrowthAuditIssue[] = []
  if (!record.projectIdentifier.trim()) issues.push({ severity: "critical", code: "missing-project-identifier", message: "A case study requires a project identifier." })
  if (!record.projectType.trim()) issues.push({ severity: "critical", code: "missing-project-type", message: "A case study requires a project type." })
  if (!record.servicePerformed.trim()) issues.push({ severity: "critical", code: "missing-project-service", message: "A case study requires the verified service performed." })
  if (!record.verifiedProjectDescription.trim()) issues.push({ severity: "critical", code: "missing-project-description", message: "A case study requires a verified project description." })
  if (record.projectImages.length === 0) issues.push({ severity: "critical", code: "missing-project-images", message: "A case study requires available project images." })
  if (record.documentedWorkPerformed.length === 0) issues.push({ severity: "critical", code: "missing-work-performed", message: "A case study requires documented work performed." })
  if (record.evidenceStatus !== "verified") issues.push({ severity: "critical", code: "evidence-not-verified", message: "A case study cannot publish before evidence is verified." })
  if (record.projectLocation && !record.projectLocation.verified) issues.push({ severity: "critical", code: "location-not-verified", message: "A case study cannot publish an unverified location." })
  if (!record.humanApproval) issues.push({ severity: "critical", code: "missing-human-approval", message: "A case study requires human approval." })
  if (!canPublishCaseStudy(record) && (record.publicationStatus === "approved" || record.publicationStatus === "published")) {
    issues.push({ severity: "critical", code: "publication-gate-failed", message: "Publication status conflicts with the evidence gate." })
  }
  return issues
}

export type InternalLinkRecommendation = {
  sourcePath: string
  targetPath: string
  reason: string
  anchorSuggestion: string
  status: "suggested" | "approved" | "implemented" | "rejected"
}

const APPROVED_CONTENT_DESTINATIONS = new Set([
  ...PUBLIC_STATIC_ROUTES,
  ...services.map((service) => `/services/${service.slug}`),
])

export function validateInternalLinkRecommendation(link: InternalLinkRecommendation): GrowthAuditIssue[] {
  const issues: GrowthAuditIssue[] = []
  if (!APPROVED_CONTENT_DESTINATIONS.has(link.sourcePath) && !link.sourcePath.startsWith("/planned/")) issues.push({ severity: "warning", code: "unknown-link-source", path: link.sourcePath, message: "The source page is not an approved public or planning path." })
  if (!APPROVED_CONTENT_DESTINATIONS.has(link.targetPath)) issues.push({ severity: "critical", code: "unknown-link-target", path: link.targetPath, message: "The target is not an approved published destination." })
  if (!link.reason.trim()) issues.push({ severity: "warning", code: "missing-link-reason", path: link.sourcePath, message: "An internal-link recommendation needs a reason." })
  if (!link.anchorSuggestion.trim()) issues.push({ severity: "warning", code: "missing-anchor-suggestion", path: link.sourcePath, message: "An internal-link recommendation needs natural anchor guidance." })
  if (INTERACTIVE_ROUTE_POLICY[link.targetPath as keyof typeof INTERACTIVE_ROUTE_POLICY]) issues.push({ severity: "critical", code: "noindex-link-target", path: link.targetPath, message: "Planning content must not treat a noindex utility route as a supporting content destination." })
  return issues
}

export function findGrowthTopicConflicts(briefs: readonly ContentBrief[]): GrowthAuditIssue[] {
  const records = [...CONTENT_SEO_RECORDS, ...briefs.map((brief) => ({
    path: brief.proposedUrl,
    primaryTopic: brief.primaryTopic,
    intent: brief.searchIntent,
    geographicScope: brief.geographicRelevance,
    purpose: brief.pagePurpose,
    entities: [brief.primaryServiceRelationship],
  }))]
  const conflicts: GrowthAuditIssue[] = []
  const seen = new Map<string, string>()
  for (const record of records) {
    const key = `${record.primaryTopic.toLowerCase()}|${record.intent}|${record.geographicScope}|${record.purpose}`
    const previous = seen.get(key)
    if (previous && previous !== record.path) conflicts.push({ severity: "warning", code: "growth-topic-conflict", path: record.path, message: `Primary topic, intent, geography, and purpose overlap with ${previous}. Review before creating a URL.` })
    else seen.set(key, record.path)
  }
  return conflicts
}

export function publishedCaseStudyRecords(): readonly CaseStudyRecord[] {
  return CASE_STUDIES.filter((record) => record.publicationStatus === "published" && canPublishCaseStudy(record))
}

export function phase07FrameworkSummary() {
  return {
    topicClusters: TOPIC_CLUSTERS.length,
    contentBriefs: 0,
    caseStudies: publishedCaseStudyRecords().length,
    caseStudyPublicationAllowed: publishedCaseStudyRecords().length > 0,
    aiPublishing: false,
    newPublicUrls: false,
  } as const
}
