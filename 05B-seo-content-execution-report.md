# Phase 05B — SEO Content & On-Page Execution Report

**Project:** Peoria Hardwood Floors  
**Branch:** `main`  
**Base HEAD:** `927b4b4`  
**Scope:** Approved Phase 05B content, on-page, factual, trust, local, and internal-link execution  
**Status:** Implemented and validated without changing the Phase 02–05 SEO architecture

## Executive summary

The approved Phase 05B scope has been implemented in the existing repository. The work removes unsupported award, founding-date, testimonial, generic-social, and public city-list output. It adds the approved contextual internal links and service-selection guidance. It also neutralizes the specifically identified comparative, performance, sourcing, and cost claims where the current project facts do not support them.

No new URLs, redirects, location pages, schema, structured-data fields, dependencies, database changes, authentication changes, API changes, or visualizer-generation changes were introduced. The existing metadata, canonical, robots, sitemap, structured-data, and Phase 04 local-verification systems remain in place.

The focused Phase 02–05 SEO suite passes **40/40 tests**. The production build completes successfully. TypeScript remains blocked by pre-existing database typing errors outside the changed files. ESLint remains unavailable in the supplied dependency set.

## Files changed

The following 15 tracked files were changed:

1. `app/(site)/contact/page.tsx`
2. `app/(site)/finishes/page.tsx`
3. `app/(site)/gallery/GalleryClient.tsx`
4. `app/(site)/pricing/page.tsx`
5. `app/(site)/products/ProductsClient.tsx`
6. `app/(site)/services/[slug]/page.tsx`
7. `app/(site)/services/page.tsx`
8. `app/(site)/stains/StainsClient.tsx`
9. `components/awards.tsx`
10. `components/cta-band.tsx`
11. `components/home/home-intro.tsx`
12. `components/home/home-testimonials.tsx`
13. `components/service-area-band.tsx`
14. `components/site-footer.tsx`
15. `lib/site.ts`

The file `05B-seo-content-execution-report.md` is this execution report and is also newly created in the repository.

## Exact content changes

### Factual, trust, and claim cleanup

The homepage proof strip no longer publishes “40 Under 40 Honoree,” “Award-winning service,” or “Recognized craftsmanship and a reputation built one Central Illinois floor at a time.” It now states only the existing service scope: installation, sanding, refinishing, stains, and finishes across Peoria and Central Illinois.

The homepage stat `Since 2004` was replaced with the neutral statement `Wood — Focused specialty`. No founding date was added.

The two testimonial-style quotes and their customer-style attributions were removed. The homepage now presents a factual three-step project process: assess the space and existing floor, compare materials/stains/finishes, and plan the next step.

The full-refinishing service no longer uses “like-new finish,” “premium finish,” or “free assessment.” Its process and FAQ language now describe a renewed finish, finish application, care guidance, and a project assessment.

The sandless service no longer uses “fast,” “same-fast return,” or “faster and lower cost” as unqualified claims. It now describes an eligible-floor buff-and-recoat and directs visitors to review when light use is appropriate after application. Its FAQ explains that it can involve less disruption than full refinishing without asserting a universal cost or speed advantage.

The commercial/sports service no longer states “maximum wear resistance.” It now describes a commercial-grade finish selected for the intended use.

The deck service no longer promises that a deck will last through Illinois seasons. It now describes preparation for another Illinois season.

The cabinet FAQ no longer claims that refinishing costs a fraction of replacement. It now states that structurally sound cabinetry can be updated without replacing it.

The product page no longer claims that the business can source “just about any wood flooring option imaginable.” It now describes a range of manufacturer, mill, importer, and reclaimed-flooring relationships and qualifies options by project specifications and availability. The catalog entry no longer claims nationwide sourcing.

The shared CTA no longer promises a free assessment. It now invites visitors to discuss the project and the next step. Service-page metadata and sidebar copy use the same neutral project-scope language.

The `NWFA` entry was removed from the product-brand strip because the current source does not establish it as a product brand or an approved product relationship.

### Internal links and on-page guidance

The homepage now includes a direct `/contact` path alongside the existing About link.

The Services hub now includes a service-selection explanation covering new floors, existing-floor refinishing, sandless work, commercial work, decks, and cabinets. It also includes a direct `/contact` path.

Every service detail page now includes a direct `/contact` path. Additional contextual links are conditional by service so the pages remain differentiated:

- Installation → `/products`
- Full refinishing → `/finishes`, `/stains`, and sandless refinishing
- Sandless refinishing → full refinishing
- Commercial/sports → `/gallery`
- Deck → `/gallery`
- Cabinet → `/finishes`

The full-refinishing page now explains the difference between sanding to prepare for a new finish and a lower-disruption sandless option.

The Finishes page now links to the full refinishing service. The Stains page now links to Finishes, full refinishing, and Contact.

The Products page now links directly to the installation service.

The Gallery page now has a restrained service-context section. It links to the Services hub and Contact without inventing project locations, dates, clients, results, or case studies.

The Pricing page now links to Services and Contact. Its explanatory copy explicitly identifies the calculator as planning guidance and states that final scope and pricing are assessed for the specific space.

The Contact page now links to Services.

### Local and social cleanup

The public service-area band, Contact page, and footer no longer render the unverified 13-place city list. They retain the verified Peoria/Central Illinois context and the descriptive roughly-75-mile radius statement. The existing `serviceAreas` export remains available only to the pre-existing visualizer option source; the visualizer generation logic and route were not modified.

The generic Facebook and Instagram root URLs are now empty values and are conditionally omitted from the footer. The Contact page no longer renders social links. No profile URL was invented.

No location records, city pages, `GeoCircle`, exact service-area schema, address, hours, Google Business Profile URL, or social-profile schema were added.

## Validation results

### Focused SEO regression suite

The following command passed:

```text
pnpm exec vitest run tests/unit/seo.test.ts tests/unit/structured-data.test.ts tests/unit/local-seo.test.ts tests/unit/content-seo.test.ts
```

Result: **4 test files passed; 40 tests passed.**

### Static route and claim checks

The implementation was checked for all current public route files. The repository still contains the same public route set: nine approved static indexable routes, two non-indexable utility routes, and one dynamic service route that generates six service URLs.

The post-implementation scan found no stale public occurrences of the removed award, founding-date, testimonial, generic social, and specifically neutralized claim phrases. The intentional claim vocabulary in the governance helper and its tests remains unchanged.

`git diff --check` passed. No protected SEO architecture file was changed.

### Production build

The existing production build completed successfully and generated the current route table, including:

- the nine approved static indexable routes;
- the six existing service URLs;
- `/robots.txt` and `/sitemap.xml`;
- the two existing utility routes, `/estimate-calculator` and `/visualizer`;
- the existing admin and API routes.

No new URL appeared in the build route table.

### TypeScript

`pnpm exec tsc --noEmit` remains unsuccessful because of existing errors in database files such as `lib/db/generations.ts`, `lib/db/leads.ts`, and `lib/db/visitors.ts`. The output contains no errors attributable to the 15 Phase 05B changed files. No database or typing changes were made to address those blockers because the approved scope explicitly protects the database and API layers.

### Lint

The lint command could not run because `eslint` is not available in the supplied dependency set. No dependency was installed, and the lockfile was not changed.

## Architecture preservation confirmation

The following systems were not modified:

- `lib/seo/resolver.ts`
- canonical URL generation
- `app/robots.ts`
- `app/sitemap.ts`
- `lib/seo/structured-data.ts`
- `lib/seo/local.ts`
- API routes
- admin routes
- authentication
- database
- payment
- visualizer generation logic
- dependencies and lockfile
- public URLs
- redirects

Phase 02–05 architecture was preserved. Visible content was changed only within the approved Phase 05B boundaries.

## URL and indexability confirmation

No URL was changed. No redirect was created. No existing public page was deleted or noindexed. No location page was created. The existing noindex policy for `/estimate-calculator` and `/visualizer` remains unchanged.

The existing canonical and structured-data output continues to be generated through the existing Phase 02 and Phase 03 systems. No new schema type or entity field was added.

## Rollback guidance

The implementation is isolated to the 15 files listed above. To roll back the Phase 05B implementation before commit, restore those files to the pre-Phase 05B state and remove this report. The protected SEO architecture does not require rollback because it was not changed.

If the work has already been committed, revert the Phase 05B commit as one unit. Do not manually revert `lib/seo/resolver.ts`, the sitemap, robots, structured-data builders, or Phase 04 local gates because those files were not part of this implementation.

## References

[1]: https://github.com/mefahim/peoria-hardwood-floors/blob/main/00-seo-implementation-master.md "SEO Implementation Master Specification"
[2]: https://github.com/mefahim/peoria-hardwood-floors/blob/main/01-seo-audit-and-baseline.md "SEO Phase 01 — Audit and Baseline"
[3]: https://github.com/mefahim/peoria-hardwood-floors/blob/main/02-seo-technical-foundation.md "SEO Phase 02 — Technical SEO Foundation"
[4]: https://github.com/mefahim/peoria-hardwood-floors/blob/main/03-seo-structured-data-entity.md "SEO Phase 03 — Structured Data & Entity SEO"
[5]: https://github.com/mefahim/peoria-hardwood-floors/blob/main/04-seo-local-seo-business-entity.md "SEO Phase 04 — Local SEO & Business Entity Expansion"
[6]: https://github.com/mefahim/peoria-hardwood-floors/blob/main/05-seo-content-on-page.md "SEO Phase 05 — Content & On-Page SEO"
[7]: https://github.com/mefahim/peoria-hardwood-floors/blob/main/lib/seo/content.ts "Phase 05 Content Governance Implementation"
[8]: https://github.com/mefahim/peoria-hardwood-floors/blob/main/lib/site.ts "Centralized Site and Service Data"
