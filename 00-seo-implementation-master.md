# SEO Implementation Master Specification
## Peoria Hardwood Floors — Production SEO Operating System

**Status:** FINAL MASTER SPECIFICATION  
**Implementation model:** AI-agent executed, phase-gated  
**Target:** Production website on Next.js App Router  
**Business data:** Verified client data only; missing data remains configurable/pending

---

## 1. Mission

Build a production-grade, reusable SEO Operating System inside the existing Peoria Hardwood Floors application.

The system must make technical SEO largely automatic while allowing authorized administrators to manage page-level and business-level SEO from the application dashboard.

SEO must be treated as part of the product architecture, not as a collection of one-off page edits.

### Success means

- Search engines can crawl and understand all intended public pages.
- Important pages have unique, coherent SEO metadata.
- Canonicals, sitemap, robots, breadcrumbs and structured data are generated consistently.
- Local/business entity data has one source of truth.
- New content can inherit safe SEO defaults without developer intervention.
- Administrators can override appropriate SEO fields without touching code.
- Automated checks identify common SEO regressions.
- SEO implementation does not weaken application security or existing functionality.
- Existing public URLs are preserved unless a documented migration is required.
- No fabricated business facts, reviews, awards, memberships, addresses, hours, social profiles or service areas are introduced.

---

## 2. Authority and rule hierarchy

Use these authorities in this order:

1. **Google Search Essentials / Search Central** — primary search guidelines, crawling/indexing guidance and spam policies.
2. **Google structured-data documentation** — supported structured-data behavior and validation requirements.
3. **Schema.org** — vocabulary/reference for structured data, subject to Google's supported-feature rules.
4. **Official Next.js documentation** — implementation of Metadata API, `robots.txt`, `sitemap.xml`, OG metadata/images and App Router architecture.
5. **Existing application architecture and requirements** — preserve functionality, security and product behavior.
6. General SEO practices are subordinate to the sources above.

Never use an SEO tactic merely because it is claimed to improve rankings if it conflicts with the above rules.

---

## 3. Non-negotiable rules

### 3.1 Do not invent facts

AI agents MUST NOT invent:

- business address
- opening hours
- awards
- memberships
- review counts
- ratings
- testimonials
- project locations
- social profile URLs
- Google Business Profile URLs
- service availability
- founded date
- certifications
- affiliations

Unknown information must remain unset or marked as pending verification.

### 3.2 Preserve public URLs

Do not change an existing public URL without a documented reason.

If a URL must change, implement and validate:

- permanent redirect
- canonical update
- sitemap update
- internal-link update
- old/new URL verification

### 3.3 No doorway or scaled low-value content

Do not mass-create near-duplicate city pages, service pages or AI articles merely to capture keywords.

A location page requires meaningful unique business/service information.

### 3.4 No keyword stuffing

Use topics and search intent to guide useful content. Do not force exact-match keywords into headings, body copy, alt text, URLs or schema.

### 3.5 No fake structured data

Structured data must describe visible/real page content and verified business facts. Never create fake review/rating/award markup.

### 3.6 Security is never traded for SEO

SEO implementation MUST NOT:

- bypass authentication/authorization
- expose secrets
- expose databases
- weaken existing validation
- weaken security headers without a documented requirement
- expose private/admin routes
- permit arbitrary unsafe JSON-LD injection
- change quota/payment/auth/security behavior unnecessarily

### 3.7 No unnecessary third-party SEO dependencies

Prefer native Next.js capabilities and the existing application stack. Do not install an SEO plugin/package when the requirement can be implemented safely in application code.

---

## 4. Target architecture

```text
Application Content
       |
       v
SEO Resolver
       |
       +--> Global Defaults
       +--> Content-Type Defaults
       +--> Page/Entity Overrides
       |
       v
Final SEO Representation
       |
       +--> Metadata
       +--> Canonical
       +--> Open Graph
       +--> Robots
       +--> Sitemap
       +--> Structured Data
       +--> Breadcrumbs
       +--> Internal-Link Suggestions
       +--> SEO Audit
```

Business/entity data must have one canonical source:

```text
Business Entity
  |- Identity
  |- Contact
  |- Address
  |- Hours
  |- Social Profiles
  |- Service Areas
  |- Awards
  `- Memberships
```

Downstream schema and local SEO output must consume this source rather than duplicated hard-coded values.

---

## 5. Automatic vs assisted vs manual controls

### Automatic

The system should handle:

- canonical generation
- sitemap generation
- robots generation
- metadata fallbacks
- Open Graph fallbacks
- breadcrumbs
- structured-data generation
- indexability checks
- sitemap eligibility
- duplicate/missing metadata detection
- common image SEO checks
- common internal-link checks

### Assisted

The system may recommend:

- SEO titles
- meta descriptions
- primary/secondary topics
- internal links
- image alt text
- content sections
- SEO opportunities

Recommendations must never silently overwrite approved content.

### Manual

Authorized users may control:

- final title
- description
- target topics
- canonical override where justified
- index/noindex
- OG image
- business information
- service areas
- verified awards/memberships
- redirects

Technical guardrails remain enforced.

---

## 6. Dashboard requirement

The SEO system must be designed so an authorized administrator can eventually manage:

- Global SEO
- Page SEO
- Service SEO
- Business/entity information
- Local/service areas
- Topics/search intent
- Redirects
- SEO audit
- Image SEO
- Internal-link recommendations
- Change history

Google Search Console integration is a future/optional capability and must not be required for core SEO functionality.

---

## 7. Business data pending-state policy

The following are intentionally **not required before implementation**:

- verified physical address
- verified business hours
- Google Business Profile URL
- actual Facebook URL
- actual Instagram URL
- final service-area confirmation
- award verification
- membership verification

The UI/data model must support empty/pending states.

When verified information is later entered through authorized settings, dependent SEO/schema output must update automatically.

Do not publish empty schema properties simply to fill fields.

---

## 8. Content and information architecture

Core service pages should preserve the existing public URL strategy where possible.

The information architecture should support:

- Services
- Service detail pages
- Gallery
- Products
- Stains
- Finishes
- Pricing
- Estimate Calculator
- Visualizer
- About
- Contact
- Future project/case-study content
- Future useful guides

Client-side interactive features must not prevent important explanatory/indexable page content and metadata from being rendered through the appropriate server-side Next.js architecture.

---

## 9. Performance principles

SEO work must preserve or improve:

- server/client component boundaries
- image optimization
- LCP
- INP
- CLS
- font loading
- JavaScript payload
- caching
- responsive images

Performance targets should follow current Google Core Web Vitals guidance. Targets are goals, not guaranteed ranking outcomes.

---

## 10. AI-agent execution protocol

The implementing AI agent MUST:

1. Read this master document first.
2. Read only the phase document currently assigned.
3. Inspect the existing implementation before modifying it.
4. Produce a change plan before destructive/refactoring work.
5. Avoid unrelated refactors.
6. Preserve existing functionality.
7. Never invent business data.
8. Avoid unnecessary dependencies.
9. Validate every change.
10. Record unresolved assumptions.
11. Stop when a phase acceptance criterion cannot be satisfied safely.
12. Never mark a phase complete merely because code compiles.
13. Run the required build/type/lint/test checks available in the project.
14. Verify routes and SEO outputs after implementation.
15. Keep changes reversible and auditable.

---

## 11. Phase order

Implementation order is fixed:

1. `01-seo-audit-and-baseline.md`
2. `02-technical-seo-foundation.md`
3. `03-structured-data-and-entity-seo.md`
4. `04-local-seo-architecture.md`
5. `05-on-page-seo-and-content-architecture.md`
6. `06-image-and-performance-seo.md`
7. `07-content-growth-and-case-study-seo.md`
8. `08-seo-validation-and-launch.md`

Do not skip ahead unless the current phase explicitly declares a dependency as optional.

---

## 12. Definition of done

The overall project is complete only when:

- production build succeeds
- intended public routes resolve
- canonical behavior is validated
- metadata is unique/appropriate for intended pages
- robots is valid
- sitemap is valid and contains only intended URLs
- structured data is valid and factually grounded
- no accidental noindex exists
- no important page is unintentionally orphaned
- image SEO checks pass or documented exceptions exist
- internal links are coherent
- security checks pass
- existing product functionality remains intact
- Hostinger deployment remains functional
- Search Console launch checklist is complete
- client-supplied business facts can be entered later without code changes

---

## 13. Prohibited shortcuts

Do not:

- buy or generate backlinks
- generate fake reviews
- create fake location pages
- hide keyword text
- use misleading schema
- inject arbitrary schema from untrusted input
- mass-generate thin content
- change URLs just to make them look more keyword-rich
- add an SEO plugin solely because it is conventional
- treat an internal SEO score as a Google ranking score
- promise rankings or traffic outcomes

---

## 14. Phase completion format

At the end of every phase, the agent must report:

- Files created
- Files modified
- Files intentionally untouched
- Database/schema changes
- Dependencies added/removed
- Security impact
- SEO behavior added
- Validation performed
- Remaining warnings
- Acceptance criteria status
- Rollback considerations

No phase is considered complete until all required acceptance criteria pass or a documented blocker is approved.

---

## 15. Final principle

Build a system that makes correct SEO the default.

The goal is not to make the administrator an SEO engineer.

The goal is:

**Create content -> safe SEO defaults -> automatic technical SEO -> useful recommendations -> human approval where needed -> validated publication.**
