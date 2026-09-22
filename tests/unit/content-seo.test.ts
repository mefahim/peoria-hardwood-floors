import { describe, expect, it } from "vitest"
import sitemap from "@/app/sitemap"
import { services } from "@/lib/site"
import { canonicalUrl, INTERACTIVE_ROUTE_POLICY, metadataForPath, PUBLIC_STATIC_ROUTES, SEO_ROUTE_METADATA } from "@/lib/seo/resolver"
import {
  CONTENT_INTENTS,
  CONTENT_SEO_RECORDS,
  createContentSuggestion,
  contentSeoForPath,
  findBrokenInternalLinks,
  findOrphanPages,
  findTopicConflicts,
  futureLocationContentIsEligible,
  indexableContentRecords,
  isApprovedIntent,
  isApprovedPurpose,
  isSafeSeoText,
  validateContentSeoRecord,
  validateSlug,
  findUnsupportedClaims,
} from "@/lib/seo/content"

describe("content and on-page SEO architecture", () => {
  it("assigns a purpose and primary topic to every current indexable public page", () => {
    const paths = [...PUBLIC_STATIC_ROUTES, ...services.map((service) => `/services/${service.slug}`)]
    for (const path of paths) {
      const record = contentSeoForPath(path)
      expect(record?.primaryTopic, path).toBeTruthy()
      expect(record?.purpose, path).toBeTruthy()
      expect(record?.status, path).toBe("published")
    }
  })

  it("uses only approved intent, purpose, and geographic vocabularies", () => {
    expect(CONTENT_SEO_RECORDS.every((record) => isApprovedIntent(record.intent))).toBe(true)
    expect(CONTENT_SEO_RECORDS.every((record) => isApprovedPurpose(record.purpose))).toBe(true)
    expect(isApprovedIntent("keyword-stuffed")).toBe(false)
    expect(isApprovedPurpose("unknown-template")).toBe(false)
  })

  it("keeps topic planning fields out of HTML metadata keywords", () => {
    const metadata = metadataForPath("/services")
    expect(JSON.stringify(metadata)).not.toContain("keywords")
    expect(JSON.stringify(metadata)).not.toContain("primaryTopic")
  })

  it("resolves titles and descriptions through the existing central SEO system", () => {
    for (const path of PUBLIC_STATIC_ROUTES) {
      const metadata = metadataForPath(path)
      expect(metadata.title).toBe(SEO_ROUTE_METADATA[path].title)
      expect(metadata.description).toBe(SEO_ROUTE_METADATA[path].description)
      expect(metadata.alternates?.canonical).toBe(canonicalUrl(path))
    }
  })

  it("preserves utility noindex policy and excludes utility pages from content records", () => {
    expect(INTERACTIVE_ROUTE_POLICY["/visualizer"].indexable).toBe(false)
    expect(INTERACTIVE_ROUTE_POLICY["/estimate-calculator"].indexable).toBe(false)
    expect(contentSeoForPath("/visualizer")).toBeUndefined()
    expect(contentSeoForPath("/estimate-calculator")).toBeUndefined()
  })

  it("flags duplicate topic, intent, and geography combinations without destructive edits", () => {
    const records = [CONTENT_SEO_RECORDS[0], { ...CONTENT_SEO_RECORDS[0], path: "/future-page" }]
    const issues = findTopicConflicts(records)
    expect(issues).toHaveLength(1)
    expect(issues[0].severity).toBe("warning")
    expect(issues[0].code).toBe("topic-conflict")
  })

  it("detects broken internal links and does not recommend private or noindex destinations", () => {
    const record = { ...CONTENT_SEO_RECORDS[0], internalLinks: [{ label: "Broken", href: "/not-published", relation: "supporting-content" as const }] }
    expect(findBrokenInternalLinks([record])).toMatchObject([{ code: "broken-internal-link", severity: "critical" }])
    expect(CONTENT_SEO_RECORDS.flatMap((item) => item.internalLinks).some((link) => link.href === "/admin" || link.href === "/api" || link.href === "/visualizer")).toBe(false)
  })

  it("flags orphan pages as warnings rather than changing indexability", () => {
    const record = { ...CONTENT_SEO_RECORDS[0], path: "/future-guide", internalLinks: [] }
    const issues = findOrphanPages([record], ["/future-guide"])
    expect(issues).toMatchObject([{ code: "orphan-page", severity: "warning" }])
  })

  it("flags high-risk unsupported claims for review", () => {
    expect(findUnsupportedClaims("We are award-winning and guarantee every project.")).toEqual(["award-winning", "guarantee"])
    expect(findUnsupportedClaims("Peoria Hardwood Floors serves Central Illinois.")).toEqual([])
  })

  it("keeps AI recommendations non-publishing and approval-gated", () => {
    const suggestion = createContentSuggestion({ path: "/services", kind: "content-gap", recommendation: "Consider clarifying how the six services differ." })
    expect(suggestion.requiresApproval).toBe(true)
    expect(suggestion.publication).toBe("not-published")
  })

  it("rejects unsafe SEO text and accepts plain text", () => {
    expect(isSafeSeoText("Explain sanding and finish selection.")).toBe(true)
    expect(isSafeSeoText('<script>alert("x")</script>')).toBe(false)
    expect(isSafeSeoText("javascript:alert(1)")).toBe(false)
  })

  it("rejects slug collisions and unsafe future content slugs", () => {
    expect(validateSlug("new-guide")).toBe(true)
    expect(validateSlug("services")).toBe(false)
    expect(validateSlug("Hardwood Guide")).toBe(false)
    expect(validateSlug("hardwood-floor-installation-peoria-il")).toBe(false)
  })

  it("keeps future location content behind Phase 04 publication gates", () => {
    expect(futureLocationContentIsEligible("/locations/peoria")).toBe(false)
    expect(indexableContentRecords().some((record) => record.path.startsWith("/locations/"))).toBe(false)
    expect(sitemap().some((entry) => entry.url.includes("/locations/"))).toBe(false)
  })

  it("preserves all six centralized service records and validates their content contracts", () => {
    expect(services).toHaveLength(6)
    for (const service of services) {
      const record = contentSeoForPath(`/services/${service.slug}`)
      expect(record?.purpose).toBe("service")
      expect(record?.intent).toBe("local-service")
      expect(validateContentSeoRecord(record!)).toEqual([])
    }
  })

  it("validates every published content record without critical issues", () => {
    const issues = CONTENT_SEO_RECORDS.flatMap((record) => validateContentSeoRecord(record))
    expect(issues.filter((issue) => issue.severity === "critical")).toEqual([])
  })
})
