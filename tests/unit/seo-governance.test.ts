import { describe, expect, it } from "vitest"
import { CONTENT_INTENTS, PAGE_PURPOSES } from "@/lib/seo/content"
import { buildCannibalizationReviews, validateBriefInput, validateTopicInput } from "@/lib/seo/governance"
import { authorizeDashboardAccess } from "@/lib/admin/authorization"

describe("Phase 05 content governance", () => {
  it("uses the existing intent and page-purpose taxonomies", () => {
    expect(CONTENT_INTENTS).toContain("informational")
    expect(PAGE_PURPOSES).toContain("guide")
    expect(validateTopicInput({ topicId: "topic-1", topicName: "Floor care planning", cluster: "Hardwood Floor Installation", description: "Planning topic", searchIntent: "informational", pagePurpose: "guide", primaryServiceRelationship: "Hardwood Floor Installation", geographicRelevance: "service-area", status: "proposed", relatedRoutes: [], contentOpportunityIds: [], governanceNotes: "Needs review" }).value?.source).toBe("Persisted")
  })

  it("rejects unknown governance values and duplicate code-defined topics", () => {
    const invalidIntent = validateTopicInput({ topicId: "topic-1", topicName: "New topic", cluster: "Cluster", description: "Description", searchIntent: "made-up", pagePurpose: "guide", primaryServiceRelationship: "Service", geographicRelevance: "service-area", status: "proposed", relatedRoutes: [], contentOpportunityIds: [], governanceNotes: "Review" })
    expect(invalidIntent.error).toContain("Unknown search intent")
    const duplicate = validateTopicInput({ topicId: "new", topicName: "hardwood flooring installation and refinishing", cluster: "Cluster", description: "Description", searchIntent: "local-service", pagePurpose: "home", primaryServiceRelationship: "Service", geographicRelevance: "service-area", status: "proposed", relatedRoutes: [], contentOpportunityIds: [], governanceNotes: "Review" })
    expect(duplicate.error).toContain("existing code-defined")
  })

  it("detects existing URL conflicts and missing evidence", () => {
    const result = validateBriefInput({ contentId: "brief-1", workingTitle: "A planning brief", pagePurpose: "guide", primaryTopic: "A new topic", secondaryTopics: [], searchIntent: "informational", targetAudience: "Homeowners", primaryServiceRelationship: "Hardwood Floor Installation", geographicRelevance: "service-area", proposedUrl: "/about", primaryCta: "/contact", supportingInternalLinks: [], requiredEvidence: [], unsupportedClaimsToAvoid: ["Unverified claims"], sourceMaterial: [], factReviewRequirements: [], seoReviewRequirements: [], humanApproval: false, status: "BRIEF" })
    expect(result.value?.existingUrlConflictCheck).toBe("conflict")
    expect(result.issues?.some((issue) => issue.code === "existing-url-conflict")).toBe(true)
  })

  it("blocks publication and protects noindex/private route behavior", () => {
    const result = validateBriefInput({ contentId: "brief-2", workingTitle: "A draft", pagePurpose: "guide", primaryTopic: "A topic", secondaryTopics: [], searchIntent: "informational", targetAudience: "Homeowners", primaryServiceRelationship: "Service", geographicRelevance: "service-area", proposedUrl: "/planned/draft", primaryCta: "/contact", supportingInternalLinks: ["/visualizer"], requiredEvidence: [], unsupportedClaimsToAvoid: [], sourceMaterial: [], factReviewRequirements: [], seoReviewRequirements: [], humanApproval: false, status: "PUBLISHED" })
    expect(result.issues?.some((issue) => issue.code === "unapproved-content")).toBe(true)
    expect(buildCannibalizationReviews([])).toEqual([])
    expect(authorizeDashboardAccess({ authenticated: true, role: "Content Editor" }, "governance-edit", "seo-dashboard")).toBe(true)
    expect(authorizeDashboardAccess({ authenticated: true, role: "Reviewer" }, "governance-edit", "seo-dashboard")).toBe(false)
  })
})
