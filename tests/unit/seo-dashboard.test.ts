import { describe, expect, it } from "vitest"
import { buildSeoDashboardData } from "@/lib/seo/dashboard"
import { INTERACTIVE_ROUTE_POLICY } from "@/lib/seo/resolver"

describe("SEO dashboard data adapter", () => {
  it("derives indexable and noindex route counts from existing route policy", () => {
    const data = buildSeoDashboardData()
    expect(data.summary.indexableRoutes).toBeGreaterThan(0)
    expect(data.summary.noindexRoutes).toBe(Object.keys(INTERACTIVE_ROUTE_POLICY).length)
    expect(data.routes.find((route) => route.route === "/visualizer")?.indexable).toBe(false)
    expect(data.routes.find((route) => route.route === "/")?.indexable).toBe(true)
  })

  it("does not invent a score and exposes evidence-backed issue fields", () => {
    const data = buildSeoDashboardData()
    expect(data).not.toHaveProperty("score")
    for (const issue of data.issues) {
      expect(issue.id).toBeTruthy()
      expect(issue.category).toBeTruthy()
      expect(issue.severity).toBeTruthy()
      expect(issue.status).toBe("Open")
      expect(issue.source).toBeTruthy()
      expect(issue.recommendedAction).toBeTruthy()
    }
  })

  it("keeps unavailable external metrics explicitly unavailable", () => {
    const data = buildSeoDashboardData()
    expect(data.unavailable).toContain("Search Console")
    expect(data.unavailable).toContain("traffic")
    expect(data.summary.plannedOpportunities).toBe(0)
    expect(data.summary.verifiedCaseStudies).toBe(0)
  })
})
