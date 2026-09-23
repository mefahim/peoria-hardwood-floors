import { describe, expect, it } from "vitest"
import { authorizeDashboardAccess } from "@/lib/admin/authorization"
import { localGovernanceIssues, validateBusinessPending, validateCaseStudyInput, validateLocalRecord } from "@/lib/seo/local-management"

describe("Phase 06 local and case-study governance", () => {
  it("keeps the canonical business source verified and pending fields separate", () => {
    const pending = validateBusinessPending({ googleBusinessProfileUrl: "https://example.com/profile", address: "Pending evidence" })
    expect(pending.value?.address).toBe("Pending evidence")
    expect(validateBusinessPending({ googleBusinessProfileUrl: "javascript:alert(1)" }).error).toContain("HTTPS")
    expect(validateBusinessPending({ unsupported: "x" }).error).toContain("Unsupported")
  })

  it("blocks self-verification and explains local publication gates", () => {
    const result = validateLocalRecord({ id: "peoria", name: "Peoria", type: "city", relationship: "verified-service-area", verificationState: "verified", relatedServiceSlugs: [], sourceEvidence: [], uniqueContentReady: true, hasRealServiceContext: true, pageEligible: true, indexable: true, contentStatus: "review", reviewStatus: "reviewed", governanceIssues: [] })
    expect(result.value?.verificationState).toBe("pending_verification")
    expect(localGovernanceIssues(result.value!)).toContain("Verified relationship/evidence is required.")
  })

  it("requires evidence and existing service relationships for case studies", () => {
    const draft = validateCaseStudyInput({ title: "Draft project", slug: "draft-project", relatedServicePath: "/services/not-a-service", evidenceStatus: "missing" })
    expect(draft.error).toContain("existing service")
    const incomplete = validateCaseStudyInput({ title: "Draft project", slug: "draft-project", relatedServicePath: "/services/hardwood-floor-installation-peoria-il", evidenceStatus: "missing", projectIdentifier: "", projectType: "", servicePerformed: "", verifiedProjectDescription: "", projectImages: [], factualProjectDetails: [], documentedWorkPerformed: [], publicationStatus: "approved", humanApproval: false })
    expect(incomplete.issues?.some((issue) => issue.code === "evidence-not-verified")).toBe(true)
    expect(incomplete.issues?.some((issue) => issue.code === "missing-human-approval")).toBe(true)
  })

  it("keeps role boundaries server-side", () => {
    expect(authorizeDashboardAccess({ authenticated: true, role: "Admin" }, "governance-edit", "seo-dashboard")).toBe(true)
    expect(authorizeDashboardAccess({ authenticated: true, role: "SEO Manager" }, "review", "seo-dashboard")).toBe(true)
    expect(authorizeDashboardAccess({ authenticated: true, role: "Content Editor" }, "governance-edit", "seo-dashboard")).toBe(true)
    expect(authorizeDashboardAccess({ authenticated: true, role: "Content Editor" }, "review", "seo-dashboard")).toBe(false)
    expect(authorizeDashboardAccess({ authenticated: true, role: "Reviewer" }, "governance-edit", "seo-dashboard")).toBe(false)
  })
})
