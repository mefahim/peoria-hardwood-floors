# SEO Phase 02 — Technical SEO Foundation

**Project:** Peoria Hardwood Floors  
**Application:** Next.js App Router  
**Specification:** Google Docs — SEO Phase 02 Technical SEO Foundation  
**Status:** Implemented; application-wide validation has documented pre-existing/environment blockers.

## PHASE 02 STATUS

### Files created

- `app/robots.ts`
- `app/sitemap.ts`
- `lib/seo/resolver.ts`
- `tests/unit/seo.test.ts`
- `app/(site)/estimate-calculator/EstimateCalculatorClient.tsx`
- `app/(site)/visualizer/VisualizerClient.tsx`
- `app/(site)/stains/StainsClient.tsx`
- `app/(site)/products/ProductsClient.tsx`
- `app/(site)/gallery/GalleryClient.tsx`
- `02-seo-technical-foundation.md`

### Files modified

- `app/layout.tsx`
- `app/(site)/page.tsx`
- `app/(site)/about/page.tsx`
- `app/(site)/services/page.tsx`
- `app/(site)/services/[slug]/page.tsx`
- `app/(site)/finishes/page.tsx`
- `app/(site)/stains/page.tsx`
- `app/(site)/products/page.tsx`
- `app/(site)/gallery/page.tsx`
- `app/(site)/pricing/page.tsx`
- `app/(site)/contact/page.tsx`
- `app/(site)/estimate-calculator/page.tsx`
- `app/(site)/visualizer/page.tsx`

### Files intentionally untouched

Admin pages, API routes, middleware, authentication, database code, visualizer business logic, public URLs, dependencies, lockfile, and deployment configuration were intentionally left unchanged. No Phase 03 structured data or entity graph was added.

## SEO changes

### Metadata

A typed resolver now provides route-specific metadata for the home page, About, Services, all six dynamic service pages, Finishes, Stains, Products, Gallery, Pricing, Contact, Estimate Calculator, and Visualizer. Every route has a unique title and description, a canonical, robots state, Open Graph fields, and Twitter card fields. The previously client-only catalog/tool pages now use thin server wrappers so metadata remains available through the App Router without changing their public URLs or interactive behavior.

### Canonicals

`lib/seo/resolver.ts` centralizes deterministic canonical generation against `https://peoriahardwoodfloors.com`. Canonicals force HTTPS and the production hostname, remove query strings and fragments, reject foreign hosts, and do not expose arbitrary user-controlled overrides. Dynamic service canonicals are derived from the existing centralized `services` records.

### Robots

`app/robots.ts` uses the native Next.js metadata route convention. It allows public crawling, disallows `/admin/` and `/api/`, and points to the production sitemap. It is not used as an access-control mechanism and does not block rendering assets.

### Sitemap

`app/sitemap.ts` uses only approved public routes and the centralized six-service list. It includes the home page, About, Services, Finishes, Stains, Products, Gallery, Pricing, Contact, and all six service URLs. Estimate Calculator and Visualizer are intentionally excluded because they are utility/interactive pages without an approved substantial server-rendered search landing-page policy. Admin, API, login, private, redirect, and duplicate URLs are not included.

### OG/Twitter

Safe Open Graph and Twitter defaults were added at root and route level. No unverified social profile, review, award, address, hours, rating, or artificial image asset was introduced. Obsolete root `keywords` and development `generator` metadata were removed.

### Indexability

The indexability policy is explicit in the resolver. `/estimate-calculator` and `/visualizer` have complete metadata but are `noindex, follow` and excluded from the sitemap until their explanatory content is expanded and approved for indexing. All approved marketing and service pages are indexable.

## Validation

- **Focused SEO tests:** PASS — `pnpm exec vitest run tests/unit/seo.test.ts`; 1 test file, 5 tests passed.
- **SEO checks:** PASS — canonical normalization, foreign-host rejection, metadata fields, noindex policy, robots policy, sitemap route set, service URL inclusion, and private URL exclusion are covered.
- **TypeScript:** BLOCKED by 35 pre-existing errors in `app/admin/leads/[id]/page.tsx`, `app/api/admin/generation-image/route.ts`, `lib/db/generations.ts`, `lib/db/leads.ts`, and `lib/db/visitors.ts`. No errors remain in `lib/seo`, `app/robots.ts`, `app/sitemap.ts`, the modified public route files, or `tests/unit/seo.test.ts`.
- **Lint:** BLOCKED before application linting because `eslint` is not installed/resolvable in the supplied project (`sh: 1: eslint: not found`). The environment also reports the project Node requirement `>=24 <25` while the sandbox has Node 22.13.0.
- **Production build:** PARTIAL/BLOCKED — Next.js compiled the application successfully and reached page-data collection. It then failed on the existing API visualizer quota import with `ERR_SQLITE_ERROR: database is locked`; this is unrelated to the SEO files. The build also reports the existing deprecated `middleware` convention warning and stale baseline-browser-mapping data.

The project dependency lockfile was not changed. Dependencies were installed for validation with `--ignore-scripts`; no dependency version was altered to bypass environment guards.

## Security review

- No secrets or credentials were added.
- No authentication, authorization, admin middleware, API validation, quota, database, or payment behavior was changed.
- No raw HTML, JSON-LD, arbitrary metadata injection, or arbitrary redirect mechanism was introduced.
- Canonical overrides are typed and host-validated.
- Robots output contains only public crawl policy and sitemap location; it does not expose filesystem or implementation paths.

## Acceptance criteria

| Area | Status | Notes |
|---|---|---|
| Metadata | PASS | All required public routes have intentional metadata; interactive routes have explicit noindex policy. |
| Canonicals | PASS | Centralized HTTPS production-host strategy with query stripping and validation. |
| Robots | PASS | Native route generated with sitemap and private-area disallows. |
| Sitemap | PASS | Approved public static routes and six current services only; utility/private routes excluded. |
| Social metadata | PASS | OG and Twitter defaults exist without invented facts or images. |
| Focused SEO validation | PASS | Five dedicated tests passed. |
| Full TypeScript validation | BLOCKED | Pre-existing database/admin/API typing errors remain outside this phase. |
| Full lint validation | BLOCKED | ESLint executable is unavailable in the supplied dependency set. |
| Full production build | BLOCKED | Existing SQLite database-lock error during API page-data collection. |

**Overall phase status: BLOCKED for a strict all-checks PASS because the repository/environment has pre-existing validation blockers. The Phase 02 SEO implementation itself and its dedicated checks pass.**

## Rollback

Delete the created resolver, metadata route files, tests, client wrapper files, and Phase 02 report; restore the listed modified files from the supplied ZIP. No database migration, dependency change, URL migration, or external service change needs rollback.
