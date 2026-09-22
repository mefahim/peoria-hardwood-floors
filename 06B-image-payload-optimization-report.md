# SEO Phase 06B — Image Payload & Responsive Delivery Report

**Project:** Peoria Hardwood Floors
**Stage:** 06B — Image Payload & Responsive Delivery
**Previous stage:** 06A, commit `57e2456`
**Status:** PASS

## Implementation

06A enabled native Next.js image optimization. 06B retained that delivery path and corrected the gallery lead-card `sizes` hint in `app/(site)/gallery/GalleryClient.tsx`.

The first gallery item spans two columns and two rows at desktop widths. Its previous `sizes="(min-width: 1024px) 33vw, 100vw"` described a regular one-column card rather than the actual lead-card width. The first item now uses:

```text
(min-width: 1024px) 66vw, 100vw
```

Regular gallery cards retain the existing `33vw` desktop hint. The mobile and tablet fallback remains `100vw`, matching the responsive grid behavior.

No original asset was renamed, moved, deleted, recompressed, or replaced. Native Next.js optimization now creates request-time responsive variants, so no unnecessary derivative set was added to the repository.

## Evidence

The focused SEO suite passed with **40/40 tests**. The production build passed and generated the same public route set, six service URLs, `/robots.txt`, and `/sitemap.xml`.

Native rendered image tags continue to emit `srcSet`, `sizes`, and `/_next/image` URLs. Representative 06A measurements remain valid:

- `hero-kitchen.png`: 1,546,071-byte source versus 188,230-byte local optimized 640px response;
- `IMG_0214.jpg`: 3,158,922-byte source versus 44,724-byte local optimized 1200px response;
- `IMG_0210.jpg`: 2,829,683-byte source versus 18,826-byte local optimized 640px response.

These are local production-server measurements, not production-host or Core Web Vitals claims.

## Preserved behavior

The gallery filter state, 29-record data set, captions, responsive grid, public `/gallery` URL, and SEO content boundary remain unchanged. The change adjusts only the responsive width hint for the lead card.

The existing hero priority behavior and below-the-fold lazy loading remain unchanged. Product, finish, stain, service, and homepage image call sites were not altered in this stage.

## Acceptance status

| Criterion | Status | Evidence |
|---|---|---|
| Actual display width reflected in `sizes` | PASS | Lead gallery card now uses `66vw` at desktop; regular cards retain `33vw` |
| Native responsive delivery preserved | PASS | `srcSet` and `/_next/image` remain present |
| Source quality and aspect ratio preserved | PASS | No asset transformation or crop introduced |
| Gallery UX preserved | PASS | Filters, captions, grid, and route unchanged |
| SEO regression suite | PASS | 40/40 focused tests |
| Production build | PASS | Existing route table generated |
| Protected systems unchanged | PASS | No protected SEO, API, admin, database, auth, or dependency files changed |

**06B result: PASS.** No additional source derivatives were justified after native optimization. The next stage is 06C gallery performance measurement and controlled loading evaluation.

## Rollback

Revert the `GalleryClient.tsx` change. Keep the independent 06A commit and native optimization unless that stage is separately rolled back.

## References

[1]: https://github.com/mefahim/peoria-hardwood-floors/blob/main/06-seo-image-performance-read-only-audit.md "Phase 06 Image and Performance Read-Only Audit"
[2]: https://github.com/mefahim/peoria-hardwood-floors/blob/main/06A-image-optimization-experiment-report.md "Phase 06A Native Image Optimization Experiment"
[3]: https://nextjs.org/docs/app/api-reference/components/image "Next.js Image Component Documentation"
