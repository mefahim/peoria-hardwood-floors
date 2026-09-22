# SEO Phase 05 — Content & On-Page SEO

**Project:** Peoria Hardwood Floors  
**Application:** Next.js App Router  
**Specification:** Google Docs — SEO Phase 05 Content & On-Page SEO Architecture  
**Status:** Implemented as a non-destructive content governance and audit layer. Existing visible page content and public URLs were preserved.

## Status

Phase 05 adds a typed, dashboard-ready content SEO architecture for the existing public information architecture. Every current indexable route and all six service routes now have a reviewed planning record containing primary topic, intent, page purpose, audience, geographic scope, entities, CTA, required sections, internal-link recommendations, approval state, and factual notes.

The implementation intentionally does not create new guides, city pages, case studies, keyword pages, or AI-generated business copy. That preserves factual accuracy and avoids programmatic SEO expansion while making future content work reviewable and non-destructive.

## Files created

- `lib/seo/content.ts`
- `tests/unit/content-seo.test.ts`
- `05-seo-content-on-page.md`

## Files modified

- No existing application page files were modified.

The Phase 05 model is connected to the existing Phase 02 resolver, Phase 03 entity model, Phase 04 local publication gates, existing sitemap, and centralized service records without creating a second HTML metadata system.

## Files intentionally untouched

- all existing public routes and URLs
- `app/(site)/**` page and client UI files
- `app/admin/**`
- `app/api/**`
- authentication and authorization
- middleware security behavior
- database schema and migrations
- payment logic
- visualizer generation logic
- lead capture and quota enforcement
- environment secrets
- deployment configuration
- package versions and lockfile
- Phase 02 metadata, canonical, robots, sitemap, OG, Twitter, and utility noindex policy
- Phase 03 structured-data entity graph and safe JSON-LD serializer
- Phase 04 verified local entity and location publication model

## Page/topic/intent matrix

| Route | Primary topic | Intent | Purpose | Geographic scope | Primary CTA |
|---|---|---|---|---|---|
| `/` | hardwood flooring installation and refinishing | local-service | home | service-area | `/contact` |
| `/about` | Peoria Hardwood Floors business and service approach | informational | about | service-area | `/contact` |
| `/services` | hardwood flooring services | commercial | service-hub | service-area | `/contact` |
| `/services/hardwood-floor-installation-peoria-il` | hardwood floor installation | local-service | service | service-area | `/contact` |
| `/services/hardwood-floor-refinishing-peoria-il` | sanding and refinishing | local-service | service | service-area | `/contact` |
| `/services/sandless-floor-refinishing-peoria-il` | sandless refinishing | local-service | service | service-area | `/contact` |
| `/services/commercial-sports-flooring-central-illinois` | commercial and sports floors | local-service | service | service-area | `/contact` |
| `/services/deck-refinishing-peoria-il` | deck refinishing | local-service | service | service-area | `/contact` |
| `/services/cabinet-refinishing-peoria-il` | cabinet refinishing | local-service | service | service-area | `/contact` |
| `/finishes` | hardwood floor finishes | informational | product | service-area | `/contact` |
| `/stains` | hardwood floor stains and colors | informational | product | service-area | `/contact` |
| `/products` | hardwood flooring products and materials | commercial | product | service-area | `/contact` |
| `/gallery` | hardwood flooring project gallery | commercial | gallery | service-area | `/contact` |
| `/pricing` | hardwood flooring project pricing factors | commercial | pricing | service-area | `/contact` |
| `/contact` | contact Peoria Hardwood Floors | navigational | contact | service-area | `/contact` |

The utility pages `/visualizer` and `/estimate-calculator` remain governed by Phase 02 as `noindex, follow` utility experiences and intentionally have no indexable content record.

## Target topics

The content model distinguishes a genuine primary topic from individual keyword variations. Supporting concepts are represented as secondary topics rather than separate pages. Service topics are sourced from the six centralized service records in `lib/site.ts`; no new service entity is created.

## Search intent

The approved taxonomy is closed to `informational`, `commercial`, `transactional`, `navigational`, and `local-service`. Service pages use `local-service` as their primary intent with commercial/transactional secondary context. Informational finish and stain pages remain informational rather than being forced into a sales-only template.

## Page purpose

The registered page-purpose vocabulary is `home`, `about`, `service-hub`, `service`, `product`, `gallery`, `pricing`, `contact`, `case-study`, `guide`, `comparison`, and `location`. Current indexable routes resolve to a registered purpose. Future location records remain gated by Phase 04 and are not automatically indexable.

## Title architecture

The existing Phase 02 `SEO_ROUTE_METADATA` and `createPageMetadata()` remain the authoritative title system. Phase 05 tests confirm that titles resolve through that central system, retain canonical URLs, and are not supplemented with deprecated `meta keywords` or planning fields. No mechanical city-name stacking was added.

## Description architecture

Descriptions remain natural-language summaries of the visible page and existing business/service facts. Phase 05 does not generate keyword lists or unsupported claims. Duplicate and generic-description concerns are represented as future audit categories rather than destructive automatic edits.

## H1/heading architecture

Rendered built-page inspection confirmed one H1 on each required representative page and utility route. Existing page files were preserved because the current implementation already provides a clear H1 and semantic H2/H3 sections. The content model records required sections for future review without forcing exact-match headings or hidden keyword containers.

## Service-page changes

No visible service-page rewrite was performed. This was intentional: existing service records and page content were inspected and preserved, and the page model now explicitly records for each service the audience, process, project considerations, FAQs, CTA, related-service links, local scope, and entity relationship. The existing six service URLs, service data, metadata, JSON-LD, breadcrumbs, and CTAs remain unchanged.

The model's service contract supports future content improvements such as clearer preparation, process, material/finish considerations, maintenance, and genuine customer questions without creating six near-duplicate templates or unsupported claims.

## Internal-link architecture

The content model defines natural canonical relationships from Home to Services, Services to each of the six service pages, service pages to related services and Contact, and supporting finish/stain/product/gallery pages to relevant services. Internal-link recommendations are allowlisted against the current public static routes and six service URLs.

The audit flags broken destinations as critical, excludes admin/API/noindex utility destinations from public recommendations, and treats orphan pages as warnings rather than automatically adding random links. Anchor labels are descriptive and not forced exact-match keyword strings.

## Orphan detection

`findOrphanPages()` reports a warning when a sitemap-listed content record lacks a meaningful inbound recommendation. It does not change indexability or delete content. Current records and public route structure pass the focused audit checks.

## Cannibalization detection

`findTopicConflicts()` groups records by primary topic, primary intent, and geographic scope. A duplicate group produces a warning for human review. The system does not automatically merge, delete, redirect, or noindex pages. This implements the required FLAG → REVIEW → DECIDE policy.

## AI content governance

`createContentSuggestion()` creates non-publishing recommendations with `requiresApproval: true` and `publication: "not-published"`. Suggestions can cover topics, intent, titles, descriptions, headings, links, content gaps, and FAQ ideas, but this implementation contains no publish function and does not change page content automatically.

## Human approval

Content records carry `status` (`draft`, `review`, `approved`, `published`, `archived`) and an explicit approval value. Current public records are `published` and `approved`. Future dashboard content must remain approved before publication; suggestions remain non-publishing until a human workflow explicitly approves them.

## Fact validation

The model keeps factual reference points tied to existing verified business/entity/service data. `findUnsupportedClaims()` flags high-risk unsupported phrases such as awards, certifications, guarantees, unverified business history, customer counts, and project claims for review. It does not silently rewrite or publish copy.

## Local-content safeguards

Only the verified local context is represented: Peoria, Central Illinois, and the descriptive roughly 75-mile service-radius statement. The content model does not generate an exhaustive city list, city pages, service-area pages, or location topics merely because a service slug contains `peoria-il`. `futureLocationContentIsEligible()` delegates to Phase 04 location publication gates, and current location records remain empty.

## Content templates

Reusable template contracts are defined for homepage, service hub, service, about, product, gallery, pricing, contact, guide, case study, comparison, and location pages. The location template is not indexable by default and requires Phase 04 eligibility. Templates define meaningful sections, not arbitrary word counts.

## Metadata fallback and safety

Phase 02 remains the metadata authority. Phase 05 planning data is not emitted as HTML metadata. `isSafeSeoText()` rejects script tags, iframes, event-handler attributes, and `javascript:` URLs for future plain-text SEO fields. `validateSlug()` requires lowercase deterministic safe slugs and rejects collisions with existing routes. No redirect engine or arbitrary redirect behavior was introduced.

## Security review

No dashboard HTML, arbitrary JSON-LD, schema injection, `meta keywords`, raw rich-text renderer, user-controlled script, third-party SEO plugin, or arbitrary content publisher was added. Enums for intent, purpose, geographic scope, status, and suggestion types are allowlisted. AI output is represented as a non-publishing suggestion. Existing authentication, APIs, database, payments, quota, lead capture, and deployment boundaries were untouched.

## Tests

- **Phase 05 content tests:** PASS — `tests/unit/content-seo.test.ts`, 15 tests.
- **Combined Phase 02–05 suite:** PASS — 4 files, 40 tests passed.
- Coverage includes page-purpose/topic assignment, approved intent values, no meta keywords, central metadata resolution, utility noindex preservation, duplicate topic conflicts, broken internal links, orphan warnings, unsupported-claim flags, non-publishing AI suggestions, unsafe SEO text rejection, slug collision rejection, Phase 04 location gates, six-service preservation, and content-contract validation.

## Phase 02 regression

**PASS.** Metadata, canonical, robots, sitemap, Open Graph/Twitter, private-route exclusion, six service URLs, and utility `noindex, follow` tests remain passing.

## Phase 03 regression

**PASS.** Organization, WebSite, WebPage, Service, BreadcrumbList, stable IDs, safe JSON-LD serialization, and no-fabricated-service tests remain passing.

## Phase 04 regression

**PASS.** Verified-only local entity, no fake LocalBusiness, no fake locations, location sitemap gates, deterministic location canonical policy, and local internal-link gates remain passing.

## TypeScript

**BLOCKED by documented baseline errors.** No new errors were reported in `lib/seo/content.ts`, `tests/unit/content-seo.test.ts`, Phase 02–04 SEO files, or `app/sitemap.ts`. Existing errors remain in `app/admin/leads/[id]/page.tsx`, `app/api/admin/generation-image/route.ts`, `lib/db/generations.ts`, `lib/db/leads.ts`, and `lib/db/visitors.ts`.

## Lint

**BLOCKED by environment/dependency setup.** `pnpm exec eslint .` reports `Command "eslint" not found`. No dependency or lockfile change was made to mask the baseline environment issue.

## Build

**PASS.** `pnpm run build` completed successfully with Next.js 16 and generated the current public routes and services. Existing warnings remain for Node 22.13.0 versus the requested Node `>=24 <25`, stale baseline-browser-mapping data, and deprecated middleware convention.

## Rendered page inspection

Built HTML was inspected for `/`, `/services`, both representative service pages, `/about`, `/contact`, `/estimate-calculator`, and `/visualizer`.

- Required representative pages each had a title, description, production canonical, `index, follow`, exactly one H1, JSON-LD, Contact links, and Services links.
- Service pages had service-specific titles and descriptions aligned with their visible service content.
- `/estimate-calculator` and `/visualizer` retained `noindex, follow` and emitted no JSON-LD.
- No `meta keywords`, `primaryTopic`, or planning fields were emitted as HTML metadata.
- No location pages were emitted.

## Known blockers

1. Full TypeScript remains blocked by pre-existing admin/API/database errors outside Phase 05.
2. ESLint is unavailable in the supplied dependency environment.
3. Node 22.13.0 is below the project-requested Node `>=24 <25`.
4. External Google Rich Results or Schema.org validation was not applicable to this content-governance layer and was not executed.
5. Visible content rewrites were intentionally deferred where the existing pages already met the reviewed content structure; the new model provides governed briefs and audits for future approved edits.

## Acceptance criteria

| Area | Status | Notes |
|---|---|---|
| Topic model | PASS | Typed target-topic records exist for all current indexable pages. |
| Intent model | PASS | Closed approved intent taxonomy with validation. |
| Page-purpose model | PASS | Registered purposes cover current and future page classes. |
| Central metadata architecture | PASS | Phase 02 resolver remains authoritative. |
| Title governance | PASS | Central titles tested; duplicate/quality audit model defined. |
| Description governance | PASS | Central descriptions tested; unsupported-claim checks defined. |
| H1/heading governance | PASS | Representative built pages have one H1; section contracts defined. |
| Service-page content framework | PASS | Six service records receive explicit content contracts. |
| Existing content preservation | PASS | No public page content or URL was destructively changed. |
| Internal linking architecture | PASS | Canonical allowlisted relationships and broken-link audit added. |
| Orphan-page detection | PASS | Warning-only audit implemented. |
| Cannibalization detection | PASS | Topic/intent/geography conflict warning implemented. |
| Local-content safety | PASS | Phase 04 location gates and verified scope reused. |
| AI content governance | PASS | Suggestions are approval-gated and non-publishing. |
| Human approval workflow | PASS | Status and approval fields included in content records. |
| Content fact guard | PASS | High-risk unsupported claims can be flagged. |
| No meta keywords | PASS | Tests and built HTML inspection confirm absence. |
| No doorway/programmatic explosion | PASS | No new pages, city matrix, or keyword factories created. |
| Utility noindex preserved | PASS | Both utility routes remain `noindex, follow`. |
| Phase 02 regression | PASS | Existing tests pass. |
| Phase 03 regression | PASS | Existing tests pass. |
| Phase 04 regression | PASS | Existing tests pass. |
| Focused tests | PASS | 40/40 tests pass. |
| Build/type/lint status documented | PASS | Build passes; baseline blockers documented. |

**Overall acceptance: BLOCKED only by pre-existing environment validation blockers; Phase 05 implementation and local validation PASS.**

## Rollback

Remove `lib/seo/content.ts`, `tests/unit/content-seo.test.ts`, and this report. No existing page file or URL requires rollback. Preserve Phase 02 metadata/canonical/robots/sitemap, Phase 03 entity/JSON-LD infrastructure, Phase 04 local architecture, and all unrelated application changes.
