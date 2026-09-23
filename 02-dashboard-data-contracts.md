# SEO Dashboard — Data Contracts

**Phase:** 01  
**Status:** Proposed architecture only  
**Rule:** Existing code-defined values remain authoritative until an explicitly approved future persistence layer exists.

## Field classification

Each field must be labelled **Existing**, **Derived**, **Proposed**, **Future**, **Verified**, or **Unverified**. A dashboard must never present an unverified value as a verified business fact.

## Page SEO contract

```ts
type PageSeoRecord = {
  route: string
  pageType: string
  pagePurpose: string
  title: string
  description: string
  canonical: string
  indexable: boolean
  primaryTopic: string
  secondaryTopics: string[]
  intent: string
  geographicScope: string
  primaryCta: string
  openGraph: { image?: string; title?: string; description?: string }
  twitter: { card?: string; image?: string }
  schemaRelations: string[]
  breadcrumbRelations: string[]
  internalLinkStatus: string
  auditStatus: string
  lastReviewed?: string
  approvalStatus: string
}
```

Existing fields come from `SEO_ROUTE_METADATA`, `INTERACTIVE_ROUTE_POLICY`, `PUBLIC_STATIC_ROUTES`, content records, and rendered metadata. Canonical, indexability, schema relationships, breadcrumbs, and internal-link status are derived. Review dates, approval history, and persisted overrides are future fields.

The dashboard must not silently replace resolver metadata. A proposed override must show source value, proposed value, reviewer, approval state, and impact on canonical, robots, sitemap, OG, Twitter, and schema output.

## Service SEO contract

```ts
type ServiceSeoRecord = {
  serviceId: string
  title: string
  slug: string
  route: string
  description: string
  topics: string[]
  intent: string
  geographicScope: string
  primaryCta: string
  supportingLinks: string[]
  schemaRelation: string
  localSeoRelation: string
  contentGovernanceStatus: string
  approvalStatus: string
}
```

The six existing services are fixed for this phase: Hardwood Floor Installation, Hardwood Floor Refinishing, Sandless Floor Refinishing, Commercial / Sports Flooring, Deck Refinishing, and Cabinet Refinishing. No new service may be created by the dashboard in Phase 01.

## Topic and content contract

The dashboard reuses Phase 05 and Phase 07 values for topic, cluster, search intent, page purpose, service relationship, geographic relevance, content opportunity, URL conflict, cannibalization, internal links, evidence, fact review, SEO review, human approval, and publication status.

The source values are code-defined and planning-only today. A future persisted record must retain the source cluster and cannot bypass conflict or evidence validation.

## Content brief contract

```ts
type ContentBrief = {
  contentId: string
  workingTitle: string
  pagePurpose: string
  primaryTopics: string[]
  secondaryTopics: string[]
  searchIntent: string
  audience: string
  primaryService: string
  geographicRelevance: string
  proposedUrl: string
  existingUrlConflict: string
  primaryCta: string
  supportingInternalLinks: string[]
  requiredEvidence: string[]
  unsupportedClaims: string[]
  sourceMaterial: string[]
  factReview: "pending" | "passed" | "failed"
  seoReview: "pending" | "passed" | "failed"
  humanApproval: "pending" | "approved" | "rejected"
  status: "planning-only" | "draft" | "review" | "approved" | "published" | "archived"
}
```

A published status requires URL conflict clearance, source material, fact review, SEO review, and human approval. Phase 07 currently contains no persisted briefs.

## Case-study contract

A future record must include project identifier, project type, service, verified location where appropriate, project description, images, factual details, work performed, documented outcome only when supported, evidence, client approval, fact verification, publication status, SEO metadata, and internal links.

No client, city, date, materials, outcome, project value, review, testimonial, award, certification, or other claim may be inferred from an image or filename. The current published registry is empty.

## Local SEO contract

The local contract must separate verified business entity fields, service-radius statements, service-area records, location evidence, local-page eligibility, and local-schema eligibility. The existing address, hours, city list, reviews, ratings, awards, certifications, and affiliations remain unverified or absent.

## Image SEO contract

Image records should include asset path, purpose, usage, alt text, dimensions, optimization status, OG eligibility, duplicate status, and validation evidence. The existing Next.js image architecture remains mandatory. No external optimization service is permitted.

## Audit issue contract

```ts
type SeoAuditIssue = {
  issueId: string
  category: string
  severity: "P0" | "P1" | "P2" | "P3"
  routeOrEntity: string
  description: string
  evidence: string
  detectedAt: string
  status: "open" | "accepted" | "in-progress" | "resolved" | "dismissed"
  recommendedAction: string
  resolvedAt?: string
  resolvedBy?: string
}
```

Do not introduce a second severity taxonomy.

## Data lifecycle

Code-defined values remain the source of truth. Runtime-derived values may be cached for audit display. Future persisted values require server-side validation, approval, audit logging, and rollback. The dashboard must visibly distinguish **Verified**, **Unverified**, **Derived**, and **Future**.

## References

[1]: https://github.com/mefahim/peoria-hardwood-floors "Peoria Hardwood Floors repository"
[2]: https://docs.google.com/document/d/1pGxz1D5Hs-VzEYcgLcy63Rnl6g5OkuVnNbVqlOuHpIU/edit "SEO Dashboard — Phase 01 Architecture, Data Contracts & Read-Only Planning"
