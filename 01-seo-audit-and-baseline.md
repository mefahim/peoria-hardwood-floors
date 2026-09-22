# SEO Phase 01 — Audit and Baseline

**Project:** Peoria Hardwood Floors  
**Application:** Next.js App Router  
**Audit date:** 2026-09-22  
**Status:** Baseline complete; technical SEO implementation is intentionally deferred to Phase 02.

## 1. Scope and method

This baseline was produced from the supplied `peoriahardwoodfloors-hostinger-fixed.zip` source tree and the governing SEO master specification. The audit inspected the App Router route structure, root and public-site layouts, page-level metadata, centralized site data, public navigation, image usage, indexability signals, and the available lint/build scripts. No public URL, business fact, credential, database, or security behavior was changed during this phase.

The application is a Next.js site using the App Router. Public marketing pages are isolated in `app/(site)`, while administrative pages and API routes are separate and must remain excluded from public SEO output.

## 2. Route inventory

### Intended public routes

| URL | Source | Current role | Baseline SEO state |
|---|---|---|---|
| `/` | `app/(site)/page.tsx` | Home | Inherits root metadata; no route-specific metadata found |
| `/about` | `app/(site)/about/page.tsx` | About | Has page metadata |
| `/services` | `app/(site)/services/page.tsx` | Service index | Has page metadata |
| `/services/[slug]` | `app/(site)/services/[slug]/page.tsx` | Service details | Uses `generateMetadata`; six static service slugs are generated |
| `/finishes` | `app/(site)/finishes/page.tsx` | Finishes catalog | No route-specific metadata found |
| `/stains` | `app/(site)/stains/page.tsx` | Stains catalog | No route-specific metadata found |
| `/products` | `app/(site)/products/page.tsx` | Products catalog | No route-specific metadata found |
| `/gallery` | `app/(site)/gallery/page.tsx` | Project gallery | No route-specific metadata found |
| `/pricing` | `app/(site)/pricing/page.tsx` | Pricing guidance | No route-specific metadata found |
| `/estimate-calculator` | `app/(site)/estimate-calculator/page.tsx` | Interactive estimate tool | No route-specific metadata found; indexability needs an explicit product decision |
| `/visualizer` | `app/(site)/visualizer/page.tsx` | Interactive room visualizer | No route-specific metadata found; indexability needs an explicit product decision |
| `/contact` | `app/(site)/contact/page.tsx` | Contact and lead capture | No route-specific metadata found |

Existing URLs are preserved. The dynamic service URLs currently defined in `lib/site.ts` are:

- `/services/hardwood-floor-installation-peoria-il`
- `/services/hardwood-floor-refinishing-peoria-il`
- `/services/sandless-floor-refinishing-peoria-il`
- `/services/commercial-sports-flooring-central-illinois`
- `/services/deck-refinishing-peoria-il`
- `/services/cabinet-refinishing-peoria-il`

### Non-public routes and endpoints

The following must not be included in the public sitemap and should remain protected or non-indexable by the application architecture:

- `/admin`, `/admin/login`, `/admin/generations`, `/admin/leads`, `/admin/leads/[id]`
- `/api/admin/*`
- `/api/lead`
- `/api/visualizer/*`

No change was made to authentication, middleware, API validation, quota handling, credential storage, or admin behavior.

## 3. Current SEO implementation

### Present

- Root `metadataBase` is set to `https://peoriahardwoodfloors.com` in `app/layout.tsx`.
- Root title defaults and a title template are configured.
- Root description and Open Graph title/description/type/locale are configured.
- `/about` and `/services` export page-level metadata.
- Service detail pages use `generateMetadata` and derive title/description from the centralized service records.
- The public site has a consistent header/footer layout and internal navigation.
- Service pages contain crawlable explanatory content, process steps, pricing factors, FAQs, and links to related services.
- Images generally use Next.js `Image` with descriptive alt text in the inspected public components.
- Site contact data, service data, navigation, service areas, and image labels are centralized in `lib/site.ts`.

### Missing or incomplete

- No `app/robots.ts` or public `robots.txt` implementation was found.
- No `app/sitemap.ts` or public `sitemap.xml` implementation was found.
- No explicit route-level canonical configuration was found.
- No JSON-LD or other structured-data implementation was found.
- No breadcrumb structured data implementation was found; visual breadcrumb data is passed to `PageHero` on relevant pages but is not yet a site-wide SEO system.
- Several intended public pages rely only on root metadata and need unique, coherent metadata in the technical foundation/on-page phases.
- No explicit metadata policy exists yet for interactive tools (`/visualizer` and `/estimate-calculator`).
- No automated SEO audit/check script exists in the current package scripts.
- No documented production crawl/sitemap validation baseline exists.
- No dedicated social sharing image was identified in the inspected SEO metadata.

## 4. Business/entity data audit

The current single shared source is `lib/site.ts`. It contains the verified-looking contact values currently supplied by the project:

- Business name: `Peoria Hardwood Floors`
- Phone: `(309) 863-5246`
- Email: `peoriahardwoodfloors@gmail.com`
- Tagline: `Family-owned hardwood flooring, serving Peoria & Central Illinois.`
- Service-radius text: `within roughly 75 miles of Peoria, Illinois`

The following values are not verified by the supplied project materials and must not be published as SEO facts without client confirmation:

- Physical street address
- Opening hours
- Google Business Profile URL
- Actual Facebook and Instagram profile URLs; the current values are generic platform roots and should not be treated as verified profiles
- Awards, memberships, certifications, affiliations, review counts, ratings, testimonials, and founded date
- Final confirmed service-area list

The next implementation phase must preserve absent/pending fields rather than emitting empty or fabricated schema properties.

## 5. Risk and priority matrix

| Priority | Finding | Risk | Recommended phase |
|---|---|---|---|
| P0 | No robots or sitemap generation | Crawling and URL discovery are not governed centrally | Phase 02 |
| P0 | No explicit canonical strategy | Duplicate/alternate URL handling is implicit rather than validated | Phase 02 |
| P0 | No explicit public/private SEO boundary in generated outputs | Future automation could accidentally expose admin/API routes | Phase 02 |
| P1 | Missing unique metadata on catalog, contact, pricing, and interactive pages | Search snippets may be duplicated or too generic | Phase 02/05 |
| P1 | No structured data resolver/entity model | Business and page understanding is not generated consistently | Phase 03 |
| P1 | No automated SEO regression checks | Missing metadata, accidental noindex, and sitemap drift may go unnoticed | Phase 08 |
| P2 | Generic social URLs in centralized data | Risk of publishing misleading sameAs links | Phase 03/04, after verification |
| P2 | No dedicated OG image metadata | Sharing previews rely on defaults | Phase 02/06 |
| P2 | Interactive page indexability is not documented | Crawl value and thin/utility-page behavior may be inconsistent | Phase 02/05 |

## 6. Baseline acceptance results

| Criterion | Result | Evidence / note |
|---|---|---|
| Existing public URLs identified | Pass | Route inventory above; no URLs changed |
| Admin/API routes identified as non-public | Pass | Admin and API route tree inspected |
| Current metadata inventory recorded | Pass | Root, about, services, and dynamic service metadata reviewed |
| Business facts separated from pending facts | Pass | `lib/site.ts` reviewed; unknowns documented |
| No fabricated SEO facts introduced | Pass | No source changes beyond this audit document |
| Production build validation | Blocked by environment | `pnpm run lint` and `pnpm run build` both stop during pnpm's dependency install guard because `sharp@0.34.5` has an ignored build script; pnpm also reports the project wants Node `>=24 <25` while the sandbox has Node `22.13.0`. No application lint/build diagnostic was reached. |
| Robots/sitemap validation | Not applicable in Phase 01 | Not yet implemented by design |
| Canonical validation | Not applicable in Phase 01 | Not yet implemented by design |
| Structured-data validation | Not applicable in Phase 01 | Not yet implemented by design |

## 7. Phase 02 implementation contract

Phase 02 should implement the minimum technical foundation without changing public URLs or introducing third-party SEO dependencies:

1. Create a typed, centralized SEO resolver for safe defaults and route metadata.
2. Add `app/robots.ts` that allows intended public routes and disallows protected application areas without exposing sensitive details.
3. Add `app/sitemap.ts` containing only the home page, approved public pages, and the six generated service URLs.
4. Establish canonical URL generation from `metadataBase`, with an explicit override path only where justified.
5. Add safe Open Graph/Twitter defaults without inventing business imagery or facts.
6. Define explicit indexability policy for `/visualizer` and `/estimate-calculator` before publishing them in the sitemap.
7. Add focused validation for public route inclusion, private route exclusion, canonical consistency, and metadata fallback behavior.

Structured data, local entity fields, and richer page-level content should wait for their assigned phases unless Phase 02 identifies a narrowly scoped dependency.

## 8. Files changed in this phase

### Created

- `01-seo-audit-and-baseline.md` — this audit and the Phase 02 implementation contract.

### Modified

- None.

### Intentionally untouched

- All application source files, public assets, database files, middleware, authentication, API routes, dependencies, and deployment configuration.

## 9. Rollback considerations

Rollback is limited to deleting `01-seo-audit-and-baseline.md`; the application runtime is unchanged. No database migration, dependency change, URL migration, or security-sensitive change was introduced.
