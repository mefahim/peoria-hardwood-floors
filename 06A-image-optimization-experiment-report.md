# SEO Phase 06A — Native Image Optimization Experiment Report

**Project:** Peoria Hardwood Floors  
**Stage:** 06A — Native Image Optimization  
**Base commit:** `587ed5b`  
**Implementation commit:** pending  
**Status:** PASS

## Scope

This stage tested the primary Phase 06 target: the existing `images.unoptimized: true` setting in `next.config.mjs`. No third-party dependency, image service, URL migration, metadata architecture change, gallery UX change, alt-text rewrite, asset deletion, or protected application-system change was made.

The configuration was changed only by removing the `images` block. Native Next.js image behavior is therefore enabled with the existing `next/image` call sites.

## Evidence

The focused Phase 02–05 SEO suite passed unchanged:

```text
4 test files passed
40 tests passed
```

The production build passed. It compiled successfully, collected page data, generated the existing static and service routes, and preserved the existing robots and sitemap routes.

Rendered production HTML changed as expected:

- public image tags emit `srcSet` responsive candidates;
- image candidates use `/_next/image?url=...&w=...&q=75`;
- existing `sizes` values remain present;
- hero images remain non-lazy and prioritized;
- below-the-fold images remain lazy-loaded;
- the logo remains prioritized as required by the existing shared header behavior.

The initial verification command searched case-sensitively for lowercase `srcset` and returned zero because Next.js emitted the React attribute spelling `srcSet`. Direct rendered-tag inspection confirmed `srcSet` and multiple responsive widths, including 256, 384, 640, 750, 828, 1080, 1200, 1920, 2048, and 3840 candidates where applicable.

Representative optimized response measurements from the local production server were:

| Asset and requested width | Original source size | Optimized response | Result |
|---|---:|---:|---|
| `/images/hero-kitchen.png`, 640w | 1,546,071 bytes | 188,230 bytes, `image/png` | 200 response; substantially smaller |
| `IMG_0214.jpg`, 1200w | 3,158,922 bytes | 44,724 bytes, `image/jpeg` | 200 response; substantially smaller |
| `IMG_0210.jpg`, 640w | 2,829,683 bytes | 18,826 bytes, `image/jpeg` | 200 response; substantially smaller |

These local response sizes demonstrate delivery reduction for representative widths. They are not a claim about production transfer size or Core Web Vitals.

The utility route behavior remained unchanged: `/estimate-calculator` rendered `noindex, follow` and emitted zero JSON-LD blocks. The same noindex policy remains in the resolver and was covered by the 40-test suite.

## Architecture and security review

The SEO resolver, canonical generation, robots, sitemap, structured data, local SEO gates, public URLs, redirects, API routes, admin routes, authentication, database, payment, quota, lead capture, and visualizer generation logic were not changed.

No remote image host or `remotePatterns` configuration was introduced. Only local public image paths continue to be used by public `next/image` components.

## Limitations

This stage did not collect real-device LCP, CLS, INP, field data, or production-hosting traces. It did not create image derivatives or remove assets. It did not change the gallery loading UX. Those decisions remain for later Phase 06 stages and require their own validation.

## Acceptance status

| Criterion | Status | Evidence |
|---|---|---|
| Native optimization enabled | PASS | `images.unoptimized` removed from `next.config.mjs` |
| Responsive candidates emitted | PASS | Rendered `srcSet` with multiple width candidates |
| Optimized endpoint works | PASS | Representative `/_next/image` requests returned HTTP 200 |
| SEO regressions | PASS | 40/40 focused tests |
| Production build | PASS | Existing route table generated |
| Hero priority preserved | PASS | Existing `priority` props unchanged |
| Below-fold lazy loading preserved | PASS | Existing lazy behavior remained in rendered HTML |
| Protected architecture unchanged | PASS | No protected files changed |
| Production deployment compatibility | Pending | Local production server validated; host deployment not exercised |

**06A result: PASS.** Proceed to 06B only with the existing native optimization path and without adding a dependency or third-party image service.

## Rollback

Re-add the prior `images: { unoptimized: true }` block to `next.config.mjs`. No other Phase 02–05B rollback is required.

## References

[1]: https://github.com/mefahim/peoria-hardwood-floors/blob/main/06-seo-image-performance-read-only-audit.md "Phase 06 Image and Performance Read-Only Audit"
[2]: https://nextjs.org/docs/app/api-reference/components/image "Next.js Image Component Documentation"
