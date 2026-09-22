# SEO Phase 04 — Local SEO & Business Entity Expansion

**Project:** Peoria Hardwood Floors  
**Application:** Next.js App Router  
**Specification:** Google Docs — SEO Phase 04 Local SEO & Business Entity Expansion

## Status

Phase 04 local SEO architecture is implemented with a verified-only model. The current project has no verified physical address, hours, GBP URL, social profile data, exact city/county/ZIP service-area records, or approved local page records. Therefore, the implementation preserves the Phase 03 Organization entity, does not emit LocalBusiness schema, does not create location routes, and does not add location URLs to the sitemap.

The architecture is ready for future verified dashboard-controlled local data without requiring a local SEO rewrite.

## Files created

- `lib/seo/local.ts`
- `tests/unit/local-seo.test.ts`
- `04-seo-local-seo-business-entity.md`

## Files modified

- `lib/seo/types.ts`
- `lib/seo/structured-data.ts`
- `app/sitemap.ts`

## Files intentionally untouched

- all existing public URLs and service routes
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
- public page UI, footer, and contact behavior
- Phase 02 resolver, metadata, robots, canonical, and sitemap service rules
- Phase 03 Organization, WebSite, WebPage, Service, Breadcrumb, and JSON-LD serialization behavior except for the optional LocalBusiness builder extension

## Verified business facts

- **Name:** Peoria Hardwood Floors
- **Phone:** `(309) 863-5246`, normalized to `+13098635246` for entity data
- **Email:** `peoriahardwoodfloors@gmail.com`
- **Tagline:** `Family-owned hardwood flooring, serving Peoria & Central Illinois.`
- **Service-radius statement:** `within roughly 75 miles of Peoria, Illinois`
- **Canonical website:** `https://peoriahardwoodfloors.com`
- **Services:** six existing centralized service records from `lib/site.ts`

## Unverified facts omitted

The implementation does not publish a physical address, locality, region, ZIP/postal code, country, coordinates, opening hours, holiday hours, Google Business Profile URL, official social profiles, business category, LocalBusiness subtype, exact city/county/ZIP service-area list, branches, number of locations, founding date, awards, memberships, certifications, reviews, ratings, testimonials, aggregateRating, Review, award, or memberOf.

The existing radius statement remains descriptive business content. It is not converted into a city list, `GeoCircle`, or location URLs. Existing UI data that was outside this phase’s verified local resolver was not promoted into local structured data.

## NAP architecture

`businessEntity` in `lib/seo/local.ts` is the canonical typed adapter for the current verified name, phone, email, canonical website, and description. Address is optional and cannot be emitted unless the entity is explicitly `verified`, all address fields are non-empty, the country uses a two-letter format, and a validated business type is present.

The adapter is designed so future footer, contact, schema, SEO resolver, and dashboard values can read the same source rather than maintaining duplicated NAP values. No current address is displayed or invented.

## LocalBusiness activation

`canPublishLocalBusiness()` requires all of the following:

1. verification state is `verified`;
2. verified business name, phone, email, and canonical website are present;
3. a complete structured address is present and valid;
4. an approved business type is present.

`buildLocalBusiness()` returns `null` when the gate is not satisfied. The current public graph therefore remains Organization-only. When verified data is eventually supplied, the builder supports only validated address, optional verified coordinates, and optional verified opening-hours fields. It does not emit ratings, reviews, awards, memberships, or other unsupported trust claims.

## Service-area architecture

`ServiceAreaRecord` supports explicit `city`, `county`, `zip`, `region`, and `radius` types with `verified` and `pageEligible` state. The current `serviceAreaRecords` collection is intentionally empty because the source provides only a radius statement and no verified location list. No service-area record is inferred from the radius, and no `GeoCircle` schema is emitted.

## Location-page policy

`LocationRecord` requires explicit verification state, `verified`, `pageEligible`, `uniqueContentReady`, `hasRealServiceContext`, and `indexable` values. `isLocationPublishable()` requires every gate. Draft, pending, rejected, archived, unverified, thin, or non-indexable records cannot become public pages.

No location route was created. A future route, if independently approved, should use `/locations/[slug]`, deterministic slug validation, the Phase 02 canonical resolver, unique useful content, real service context, intentional indexability approval, and appropriate internal links. No doorway-page or service-by-city matrix was introduced.

## Internal-link policy

`buildLocalInternalLinks()` produces links only for fully publishable locations, and only to canonical services, `/services`, `/contact`, and useful project destinations. It returns no links for drafts or non-indexable locations. It does not generate keyword-stuffed city links or hundreds of cross-links.

## Sitemap policy

`app/sitemap.ts` now appends `locationSitemapEntries(locationRecords)` to the existing static and six-service entries. The location collection is currently empty, so the sitemap remains unchanged. Future entries require public, indexable, verified, canonical, content-ready, and approved location records. Drafts, noindex records, service-area-only records, and unpublished records cannot enter the sitemap.

## Structured data

### Organization

The existing Phase 03 canonical Organization remains active and unchanged in public output.

### LocalBusiness

A typed `buildLocalBusiness()` extension exists, but it returns `null` for the current unverified local state. Built output inspection found no `LocalBusiness`, `PostalAddress`, `GeoCoordinates`, or location-page output. No fake address, hours, coordinates, subtype, or GBP reference is emitted.

### ServiceArea

No ServiceArea schema node is emitted. The radius remains descriptive text until an authoritative, verified representation is available and current guidance supports publication.

### Location WebPage

No location WebPage nodes or location routes are published because there are no verified, content-ready, approved locations.

### Breadcrumb

Phase 03 BreadcrumbList behavior remains unchanged for current public pages. No location breadcrumb is generated without a published location page.

## Dashboard contract

The future contract is represented by typed fields for business name, website, phone, email, verification state, structured address, coordinates, hours, GBP URL, social profiles, and approved business type. Service-area records carry name, type, region, parent, slug, verified, and pageEligible fields. Location records carry verification state, verification, page eligibility, unique content readiness, real service context, indexability, and service relationships.

Only `verified` business/location records may become trusted public SEO inputs. Draft, pending, rejected, and archived records are excluded from public structured data and page/sitemap publication.

## Security review

No arbitrary dashboard JSON-LD, arbitrary schema type, raw untrusted HTML, or user-controlled structured-data object is accepted. Business types are a closed union, address validation rejects empty fields and invalid country format, slugs must be lowercase and slug-safe, and only explicit verification state enables LocalBusiness or location publication. No admin, API, database, authentication, quota, payment, or lead-capture logic changed.

## Tests

- **Phase 04 local SEO tests:** PASS — `tests/unit/local-seo.test.ts`, 10 tests.
- **Phase 02 and Phase 03 regression suite:** PASS — `tests/unit/seo.test.ts` and `tests/unit/structured-data.test.ts` together with local tests: 3 files, 25 tests passed.
- Coverage includes address and LocalBusiness gates, unverified hours/GBP/social omission, radius non-expansion, location quality gates, draft/noindex sitemap exclusion, canonical resolver use, deterministic distinct IDs, useful canonical internal links, six-service preservation, and no fake trust schema.

## Phase 02 regression

**PASS.** Existing metadata, canonical, robots, sitemap, Open Graph/Twitter, private-route exclusion, six service URLs, and utility-route noindex behavior remain covered by passing tests. No existing public URL changed.

## Phase 03 regression

**PASS.** Existing Organization, WebSite, WebPage, Service, BreadcrumbList, typed entity graph, safe serialization, and no-fabricated-service tests remain passing.

## TypeScript

**BLOCKED by the documented baseline.** The full check reports no errors in Phase 04 files, Phase 03 structured-data files, tests, or `app/sitemap.ts`. Existing errors remain in `app/admin/leads/[id]/page.tsx`, `app/api/admin/generation-image/route.ts`, `lib/db/generations.ts`, `lib/db/leads.ts`, and `lib/db/visitors.ts`.

## Lint

**BLOCKED by environment/dependency setup.** `pnpm exec eslint .` reports `Command "eslint" not found`. No package version or lockfile change was made to bypass this condition.

## Build

**PASS.** `pnpm run build` completed successfully with Next.js 16, generated the existing public service/static routes, and preserved robots and sitemap generation. Existing warnings remain for Node 22.13.0 versus the requested Node `>=24 <25`, stale baseline-browser-mapping data, and deprecated middleware convention.

## Rendered JSON-LD

The production build artifacts were inspected. No `LocalBusiness`, `PostalAddress`, `GeoCoordinates`, or `/locations/` output was found in the built application artifacts. This confirms the current unverified local state does not publish a fabricated local entity or location page. Phase 03 public Organization/WebSite/WebPage/Service/Breadcrumb output remains present through the existing builder paths.

## External Rich Results validation

**Not executed.** No externally accessible deployment URL was submitted to Google Rich Results Test. No external eligibility claim is made.

## Schema validation

**Not executed externally.** Local typed-builder tests, JSON serialization tests, production build, and built-artifact inspection were performed. No external Schema.org Validator result is claimed.

## Known blockers

1. Full TypeScript remains blocked by pre-existing admin/API/database errors outside Phase 04.
2. ESLint is unavailable in the supplied dependency environment.
3. The environment uses Node 22.13.0 while the project requests Node `>=24 <25`.
4. External Rich Results and Schema.org validation require an externally accessible deployment and were not executed.
5. A verified address, business type, hours, GBP, exact service-area records, and approved unique location content are not currently available, so LocalBusiness and location pages remain intentionally deferred.

## Acceptance criteria

| Area | Status | Notes |
|---|---|---|
| Canonical business identity | PASS | One typed business adapter feeds local readiness. |
| Verified NAP architecture | PASS | Name/phone/email are centralized; address remains optional and gated. |
| No fabricated address | PASS | No address is emitted or displayed by Phase 04. |
| LocalBusiness activation gate | PASS | Explicit verification, address, URL, and business-type requirements. |
| Service-area model | PASS | Typed records; current radius remains descriptive only. |
| No automatic city generation | PASS | Empty verified service-area collection; no inferred cities. |
| Location-page quality gate | PASS | All publication gates are required. |
| No doorway pages | PASS | No location routes or city matrix created. |
| Local internal-link model | PASS | Links are generated only for publishable records. |
| Local sitemap eligibility | PASS | Only fully publishable location records can enter. |
| Local canonical URLs | PASS | Phase 02 canonical resolver is reused. |
| Dashboard-ready verification state | PASS | Typed states and future data contract defined. |
| No fake review/rating data | PASS | Prohibited properties remain absent. |
| No fake awards/memberships | PASS | Prohibited properties remain absent. |
| JSON-LD security | PASS | Closed types, validation, and no arbitrary JSON-LD. |
| Phase 02 regression | PASS | Existing SEO test suite passes. |
| Phase 03 regression | PASS | Existing structured-data suite passes. |
| Focused tests | PASS | 25/25 tests pass across all three suites. |
| Build/type/lint status documented | PASS | Build pass; baseline TypeScript/lint blockers documented. |
| External validation status | PASS | Not run and explicitly reported as not run. |

**Overall acceptance: BLOCKED only for environment/external-validation completion; Phase 04 implementation and local validation PASS.**

## Rollback

Remove `lib/seo/local.ts`, `tests/unit/local-seo.test.ts`, and this report; restore `lib/seo/types.ts`, `lib/seo/structured-data.ts`, and `app/sitemap.ts` to their Phase 03 versions. Preserve all Phase 02 and Phase 03 SEO infrastructure, existing service URLs, and unrelated application changes. No database, dependency, or deployment rollback is required.
