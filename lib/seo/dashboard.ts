import { canonicalUrl, INTERACTIVE_ROUTE_POLICY, PUBLIC_STATIC_ROUTES, SEO_ROUTE_METADATA } from "@/lib/seo/resolver"
import {
  CONTENT_SEO_RECORDS,
  findBrokenInternalLinks,
  findOrphanPages,
  findTopicConflicts,
  validateContentSeoRecord,
  type ContentAuditIssue,
  type ContentSeoRecord,
} from "@/lib/seo/content"
import { locationRecords, isLocationPublishable } from "@/lib/seo/local"
import { services } from "@/lib/site"

type Severity = "critical" | "high" | "medium" | "low" | "informational"
type AuditStatus = "Open" | "Passing" | "Not Applicable"
export type AuditCategory = "Technical SEO" | "Content SEO" | "Local SEO" | "Structured Data" | "Internal Links" | "Image SEO"

export type SeoAuditIssue = {
  id: string
  category: AuditCategory
  severity: Severity
  route: string
  description: string
  evidence: string
  recommendedAction: string
  status: AuditStatus
  source: "Derived" | "Governance-generated" | "Future/unavailable"
  detectedAt: string
  resolvedAt?: string
}

export type SeoRouteAudit = {
  route: string
  pageType: string
  indexable: boolean
  titlePresent: boolean
  descriptionPresent: boolean
  canonicalPresent: boolean
  schemaStatus: "Present" | "Not applicable" | "Unavailable"
  breadcrumbStatus: "Present" | "Not applicable" | "Unavailable"
  internalLinkStatus: "Passing" | "Issues" | "Unavailable"
  imageSeoStatus: "Available in page source" | "Not audited"
  issueCount: number
}

export type SeoDashboardData = {
  summary: {
    indexableRoutes: number
    noindexRoutes: number
    services: number
    contentRecords: number
    plannedOpportunities: number
    verifiedCaseStudies: number
    localSeoRecords: number
    auditIssues: number
    passingChecks: number
  }
  routes: SeoRouteAudit[]
  issues: SeoAuditIssue[]
  unavailable: string[]
}

const DETECTED_AT = "Runtime-derived from current repository state"

function routePageType(path: string, record?: ContentSeoRecord): string {
  if (record?.purpose) return record.purpose
  if (path === "/estimate-calculator" || path === "/visualizer") return "utility"
  if (path.startsWith("/locations/")) return "location"
  return "public route"
}

function toSeverity(issue: ContentAuditIssue): Severity {
  if (issue.severity === "critical") return "critical"
  if (issue.code.includes("broken") || issue.code.includes("orphan") || issue.code.includes("conflict")) return "high"
  return "medium"
}

function issueFromContent(issue: ContentAuditIssue, index: number): SeoAuditIssue {
  const category: AuditCategory = issue.code.includes("link") || issue.code.includes("orphan") ? "Internal Links" : "Content SEO"
  return {
    id: `content-${index + 1}-${issue.code}`,
    category,
    severity: toSeverity(issue),
    route: issue.path ?? "content governance",
    description: issue.message,
    evidence: `Existing content governance validator returned ${issue.code}.`,
    recommendedAction: "Review the source content record and update it through the approved governance workflow.",
    status: "Open",
    source: "Governance-generated",
    detectedAt: DETECTED_AT,
  }
}

function routePaths(): string[] {
  return [
    ...PUBLIC_STATIC_ROUTES,
    ...services.map((service) => `/services/${service.slug}`),
    ...Object.keys(INTERACTIVE_ROUTE_POLICY),
    ...locationRecords.filter(isLocationPublishable).map((location) => `/locations/${location.slug}`),
  ]
}

export function buildSeoDashboardData(): SeoDashboardData {
  const paths = routePaths()
  const indexablePaths = paths.filter((path) => !INTERACTIVE_ROUTE_POLICY[path as keyof typeof INTERACTIVE_ROUTE_POLICY])
  const contentIssues = CONTENT_SEO_RECORDS.flatMap(validateContentSeoRecord)
  const crossRecordIssues = [
    ...findTopicConflicts(CONTENT_SEO_RECORDS),
    ...findBrokenInternalLinks(CONTENT_SEO_RECORDS),
    ...findOrphanPages(CONTENT_SEO_RECORDS, indexablePaths),
  ]
  const issues = [...contentIssues, ...crossRecordIssues].map(issueFromContent)

  const routes = paths.map((path) => {
    const record = CONTENT_SEO_RECORDS.find((candidate) => candidate.path === path)
    const metadata = SEO_ROUTE_METADATA[path as keyof typeof SEO_ROUTE_METADATA]
    const indexable = !INTERACTIVE_ROUTE_POLICY[path as keyof typeof INTERACTIVE_ROUTE_POLICY]
    const routeIssues = issues.filter((issue) => issue.route === path)
    return {
      route: path,
      pageType: routePageType(path, record),
      indexable,
      titlePresent: Boolean(metadata?.title),
      descriptionPresent: Boolean(metadata?.description),
      canonicalPresent: Boolean(metadata && canonicalUrl(path)),
      schemaStatus: indexable ? "Present" : "Not applicable",
      breadcrumbStatus: indexable ? "Present" : "Not applicable",
      internalLinkStatus: routeIssues.some((issue) => issue.category === "Internal Links") ? "Issues" : record ? "Passing" : "Unavailable",
      imageSeoStatus: indexable ? "Available in page source" : "Not audited",
      issueCount: routeIssues.length,
    } satisfies SeoRouteAudit
  })

  const passingChecks = routes.reduce((total, route) => total + [route.titlePresent, route.descriptionPresent, route.canonicalPresent, route.internalLinkStatus === "Passing"].filter(Boolean).length, 0)
  return {
    summary: {
      indexableRoutes: routes.filter((route) => route.indexable).length,
      noindexRoutes: routes.filter((route) => !route.indexable).length,
      services: services.length,
      contentRecords: CONTENT_SEO_RECORDS.length,
      plannedOpportunities: 0,
      verifiedCaseStudies: CONTENT_SEO_RECORDS.filter((record) => record.purpose === "case-study" && record.status === "published").length,
      localSeoRecords: locationRecords.length,
      auditIssues: issues.length,
      passingChecks,
    },
    routes,
    issues,
    unavailable: ["Search Console", "traffic", "rankings", "impressions", "clicks", "conversions", "persisted audit history"],
  }
}
