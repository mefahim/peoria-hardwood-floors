# SEO Phase 06F — Open Graph & Social Image Report

**Project:** Peoria Hardwood Floors
**Stage:** 06F — OG / Social Image
**Previous stage:** 06E, commit `720c975`
**Status:** PASS

## Approved image

An existing homepage hero asset was used as the source. No new business, project, customer, location, date, award, or performance claim was added to the image.

```text
Source:  public/images/hero-kitchen.png
Output:  public/images/og-default.jpg
Dimensions: 1200 × 630
Format: progressive JPEG
Size: 117,302 bytes
Alt: Bright kitchen with light hardwood flooring
```

The output is a centered, 1200×630 crop of the existing bright kitchen and light hardwood flooring visual. It is intended only for social sharing metadata; it does not replace the homepage hero or change public page content.

## Implementation

The existing metadata architecture remains authoritative:

- `lib/seo/resolver.ts` now adds the approved image to route-level Open Graph metadata;
- `app/layout.tsx` adds the same image to the root metadata fallback;
- the production `metadataBase` remains `https://peoriahardwoodfloors.com`;
- route URLs, canonical generation, robots, sitemap, structured data, and page content remain unchanged.

The existing Twitter card value `summary` was deliberately preserved to satisfy the Phase 02 metadata contract. The image is included without changing the existing card-type behavior.

## Rendered validation

The final local production server rendered the following verified output on the homepage:

```text
og:image        https://peoriahardwoodfloors.com/images/og-default.jpg
og:image:width  1200
og:image:height 630
twitter:image   https://peoriahardwoodfloors.com/images/og-default.jpg
```

The OG asset returned HTTP 200 as `image/jpeg` with 117,302 bytes. The route-level resolver and root fallback both use the same approved asset path.

The initial 06F test run caught an unwanted Twitter card change (`summary_large_image` versus the existing `summary` expectation). That change was removed before completion; the approved image remains and the existing contract is restored.

## Validation

- Focused SEO suite: **40/40 tests passed** after the contract-preserving correction.
- Production build: **passed**.
- All 15 indexable public routes: HTTP 200, one H1, canonical present, `index, follow`, responsive image `srcSet` present, and all rendered image requests resolved.
- `/estimate-calculator` and `/visualizer`: HTTP 200, one H1, canonical present, `noindex, follow`, and no unintended structured-data change.
- `/robots.txt`: HTTP 200 and unchanged policy.
- `/sitemap.xml`: HTTP 200 and unchanged route architecture.
- No new page, URL, redirect, schema architecture, API, database, auth, dependency, or remote image host was introduced.

**06F result: PASS.**

## Rollback

Remove the `images` entries from `lib/seo/resolver.ts` and `app/layout.tsx`, then remove `public/images/og-default.jpg`. No Phase 02–05B rollback is required; the resolver and root metadata changes are isolated to the approved social-image implementation.

## References

[1]: https://github.com/mefahim/peoria-hardwood-floors/blob/main/06-seo-image-performance-read-only-audit.md "Phase 06 Image and Performance Read-Only Audit"
[2]: https://github.com/mefahim/peoria-hardwood-floors/blob/main/06A-image-optimization-experiment-report.md "Phase 06A Native Image Optimization Experiment"
[3]: https://nextjs.org/docs/app/building-your-application/optimizing/metadata "Next.js Metadata and Open Graph Documentation"
