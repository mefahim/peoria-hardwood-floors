import { describe, expect, it } from "vitest"
import { buildImageRows, buildInternalLinkRows, buildOrphanRows, classifyAltText, filterHistory, validateAltText, validateReviewMutation } from "@/lib/seo/phase07"

describe("SEO dashboard Phase 07", () => {
  it("surfaces existing internal links and blocks unsafe destinations", () => {
    const rows = buildInternalLinkRows()
    expect(rows.length).toBeGreaterThan(0)
    expect(rows.every((row) => row.existing)).toBe(true)
    expect(rows.filter((row) => row.status === "blocked").every((row) => row.governanceIssues.length > 0)).toBe(true)
    expect(rows.some((row) => row.targetRoute === "/contact")).toBe(true)
  })
  it("counts inbound links only for public indexable routes", () => {
    const rows = buildOrphanRows()
    expect(rows.every((row) => row.indexable)).toBe(true)
    expect(rows.every((row) => !row.route.startsWith("/admin"))).toBe(true)
    expect(rows.every((row) => row.inboundLinks >= 0)).toBe(true)
  })
  it("validates alt text as plain accessibility content", () => {
    expect(validateAltText("<script>alert(1)</script>")).toHaveProperty("error")
    expect(validateAltText("a useful room photo")).toEqual({ value: "a useful room photo" })
    expect(classifyAltText(null)).toBe("unavailable")
    expect(classifyAltText("image 1")).toBe("generic")
  })
  it("inventories repository images without inventing alt text", () => {
    const rows = buildImageRows()
    expect(rows.length).toBeGreaterThan(0)
    expect(rows.every((row) => row.altText === null)).toBe(true)
    expect(rows.some((row) => row.sizeBytes > 0)).toBe(true)
  })
  it("rejects arbitrary review ids and bounds history pagination", () => {
    expect(validateReviewMutation({ kind: "link", id: "not-real", state: "ACCEPTED" })).toHaveProperty("error")
    const history = Array.from({ length: 80 }, (_, i) => ({ id: String(i), actor: "Admin", timestamp: new Date(2026, 0, i + 1).toISOString(), entity: "page" as const, entityId: `/page-${i}`, field: "record" as const, previousValue: null, newValue: null, action: "set" as const, source: "seo-dashboard" as const }))
    const result = filterHistory(history, { page: 2, pageSize: 10, entity: "page" })
    expect(result.total).toBe(80)
    expect(result.items).toHaveLength(10)
  })
})
