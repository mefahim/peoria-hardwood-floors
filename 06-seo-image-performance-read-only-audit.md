# Phase 06 — Image SEO + Performance Read-Only Audit

**Project:** Peoria Hardwood Floors  
**Audit mode:** Read-only inspection  
**Audit baseline:** `main` at `8653f53`  
**Phase 05B status:** Completed and verified before this audit  
**Implementation status:** No code, image asset, dependency, lockfile, URL, or architecture change was made during this audit

## 1. Executive Summary

The current image implementation is structurally consistent: public pages use `next/image`, meaningful images have non-empty alt text, image containers generally reserve layout space with `fill` plus aspect-ratio or minimum-height wrappers, and above-the-fold hero images are explicitly prioritized. The public production build renders all intended routes, the two interactive utility routes remain `noindex`, and no measured Core Web Vitals claim is made because no Lighthouse, field data, or browser performance trace was collected.

The strongest evidence-backed implementation risk is `next.config.*` setting `images.unoptimized: true`. Rendered HTML confirms that public images are emitted with their original `/images/...` paths, without `srcset` and without `/_next/image` optimization URLs. This means the current `next/image` components provide layout and loading semantics, but the application is not receiving Next.js server-side image resizing or format negotiation. The risk is material because the repository contains 107 image assets totaling approximately 125 MB under `public/images`; several referenced photographs are between approximately 1.7 MB and 3.2 MB, and some are 4,032–6,000 pixels wide.

The second major risk is gallery payload. `GalleryClient` renders 29 gallery records in the initial client page, and the rendered gallery contains 32 image tags including the page hero and repeated logo instances. The gallery images are lazy-loaded, which reduces immediate priority, but the default view still exposes all 29 records to the browser and can create substantial eventual bandwidth usage. There is no separate thumbnail/full-size strategy or modal image layer in the current gallery.

A third opportunity is metadata sharing imagery. No rendered public route contains `og:image`, and the root metadata and central resolver provide only Open Graph title, description, type, URL, and locale. This is a sharing-preview opportunity, not a ranking guarantee. Implementing it would require a later approved change to the existing Phase 02 metadata architecture and a verified image choice.

The recommended next step is **Phase 06 implementation: READY WITH CONDITIONS**. The highest-value work should begin with a measured test of native Next.js image optimization and deployment compatibility, followed by responsive delivery for the largest public images and a measured gallery strategy. No recommendation requires a third-party dependency. The current audit does not authorize any of these changes.

## 2. Current Image Architecture

The application is a Next.js App Router site. The public marketing routes live under `app/(site)`, while admin, API, authentication, and visualizer generation code remain separate. Public hero and content images are rendered through the shared `PageHero`, homepage components, service records, catalog components, and gallery records.

The shared `PageHero` uses `next/image` with `fill`, `priority`, `sizes="100vw"`, and `object-cover`. It is placed inside a section with `min-h-[62vh]`, so the hero has a stable visual box. The homepage hero uses the same pattern with `min-h-screen`. The shared `Logo` uses `next/image` with `fill`, an explicit `sizes` value, and `priority`, so the logo is requested eagerly on every public route.

The current image configuration is:

```ts
images: {
  unoptimized: true,
}
```

This is a confirmed configuration fact. Rendered production HTML corroborates it: image tags use original paths such as `/images/new-images/IMG_0210.jpg`, no `srcset` attributes were emitted, and no `/_next/image` URL was emitted. The `fill` layout behavior remains useful, but automatic responsive resizing and format negotiation are not active in the current build.

There are no CSS `background-image` references to public photographic assets in the inspected public pages. The visualizer uses a generated CSS color/linear-gradient preview, and the stain page uses color swatches rather than image elements for its visible stain grid.

The repository contains 107 image assets under `public`, including 43 `.jpg` files, 26 `.jpeg` files, 34 `.png` files, and 4 `.svg` files. The `public/images` directory is approximately 125 MB. A literal source-reference scan found 47 assets referenced by application source and 60 assets not referenced by literal paths in `app`, `components`, or `lib`. The latter is a review signal, not proof that every asset is safe to delete; framework conventions, future content, administrative flows, or dynamic data may account for some files.

## 3. Image Inventory

The following inventory covers the important public image groups. File sizes and dimensions are recorded only where inspected directly or where repository/file metadata provided evidence.

| Image group | Source and component | Route coverage | Loading and position | Evidence-backed notes |
|---|---|---|---|---|
| Homepage hero | `/images/hero-kitchen.png`, `components/home/home-hero.tsx` | `/` | `next/image`, `fill`, `priority`, `sizes="100vw"`; above the fold | PNG, 1024×1024, approximately 1.5 MB. The rendered hero is a bright kitchen with hardwood flooring. |
| Shared page heroes | Route-specific `image` passed to `components/page-hero.tsx` | `/about`, `/services`, six service pages, `/finishes`, `/stains`, `/products`, `/gallery`, `/pricing`, `/contact` | `next/image`, `fill`, `priority`, `sizes="100vw"`; above the fold | The shared component makes every page hero eager. This is appropriate in principle because the hero is the main above-the-fold visual, but the raw-source payload remains a risk while optimization is disabled. |
| Homepage intro | `/images/about-craft.png`, `components/home/home-intro.tsx` | `/` | `next/image`, `fill`, responsive `sizes`; below the hero | PNG, 1024×1024, approximately 1.2 MB. Alt text describes a craftsman hand-finishing a hardwood floor. |
| Homepage visualizer CTA | `/images/cta-room.png`, `components/home/home-visualizer.tsx` | `/` | `next/image`; below the fold | PNG asset used in the visualizer promotional section. It is not the noindex visualizer’s generated result. |
| Service cards | `services[].image` in `lib/site.ts`, rendered by `home-services.tsx` and the service page | `/`, `/services`, service detail pages | `next/image`, `fill`, responsive `sizes`; below the hero | Six centralized service image records are reused. Alt values on cards use the service title, which is descriptive but not image-specific. |
| Service detail hero images | `services[].image` in `lib/site.ts` | Six service detail routes | Shared `PageHero` with `priority` | Representative files include a 6,000×3,368, approximately 3.0 MB refinishing image; a 4,032×3,024, approximately 1.7 MB commercial image; and a 4,032×3,024, approximately 2.6 MB cabinet image. |
| About image | `/images/new-images/IMG_0216.jpg`, `app/(site)/about/page.tsx` | `/about` | `next/image`, `fill`, responsive `sizes`; below hero | JPEG, 6,000×3,368, approximately 2.9 MB. Alt text is contextual and non-keyword-stuffed. |
| Gallery hero and gallery grid | `galleryImages` in `lib/site.ts`, `GalleryClient.tsx` | `/gallery` | Hero is priority; 29 grid images use `next/image`, `fill`, `loading="lazy"` through default behavior; all records are in the initial client render | The rendered page has 32 image tags, including the hero, logo occurrences, and gallery records. The gallery has no separate thumbnail/full-size implementation. |
| Product cards | `products` in `ProductsClient.tsx` | `/products` | Seven product cards use `next/image`, `fill`, responsive `sizes`; below hero and lazy by default | The largest referenced product assets include 6,000×3,368 photographs of approximately 2.7–3.0 MB. Product alt text follows the pattern `{title} flooring example`. |
| Product catalog modal | `catalogProducts` in `ProductsClient.tsx` | `/products`, only after catalog selection | The selected catalog image is rendered only when the dialog opens; no image is rendered for an unopened catalog entry | This is a positive behavior: unopened catalog images are not included in the initial rendered modal tree. |
| Finish cards | `finishes` in `lib/site.ts`, `app/(site)/finishes/page.tsx` | `/finishes` | Four `next/image` card images plus the hero; cards are lazy by default | Finish records point to real image assets and render meaningful finish-oriented alt text. Representative finish hero PNG is 1024×1024 and approximately 0.9 MB. |
| Stain page | `stains` in `lib/site.ts`, `StainsClient.tsx` | `/stains` | Hero is an image; visible stain grid uses CSS color swatches, not image elements | The data records include image paths, but the current visible UX does not render those paths. This is a data/UI consistency opportunity, not a confirmed performance defect. |
| Logo | `/images/peoriahardwoodfloors-logo.png`, `components/logo.tsx` | Every public route through the header/footer | `next/image`, `fill`, `priority`; repeatedly eager | PNG, 2,170×725, approximately 0.3 MB. It is meaningful and has alt text, but its eager preload competes with the page hero on every route. |
| Icons and browser assets | `public/icon.svg`, `public/apple-icon.png`, 32px icon PNGs, Lucide icons | Site chrome and browser metadata | SVG/icon rendering or framework conventions | These are not content images. They do not require descriptive alt text when used as decorative UI icons with surrounding labels. |
| Interactive visualizer images | Browser-selected upload previews and generated result URLs in `VisualizerClient.tsx` | `/visualizer` only; noindex | Plain `<img>` for user-selected/generated runtime images | These are interactive, user/runtime assets and are outside the indexable-image SEO path. The route remains noindex and has no JSON-LD. |
| OG/social images | None identified | Metadata for all public routes | No `og:image` or Twitter image output | The current architecture has title/description/social-card metadata but no image fallback or route-specific social image. |

## 4. Next.js Image Implementation Audit

### Confirmed implementation behavior

The public content components consistently import `Image` from `next/image`. The inspected public source contains 13 `next/image` occurrences outside the visualizer’s plain runtime `<img>` path. Public rendered HTML contains no `srcset` attributes because `images.unoptimized` is enabled. The emitted `src` values point directly to original public assets.

Most content images use `fill` inside an explicit aspect-ratio or minimum-height wrapper. This is a valid way to reserve layout geometry when the wrapper dimensions are reliable. The main examples are the PageHero `min-h-[62vh]` wrapper, homepage `min-h-screen`, gallery aspect-ratio cards, product aspect-ratio cards, finish aspect-ratio cards, and the modal’s minimum-height image container.

The public image components provide `sizes` values in the inspected implementations. The gallery uses `(min-width: 1024px) 33vw, 100vw`; product cards use `(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw`; service cards use `(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw`; and the PageHero uses `100vw`.

The `priority` prop is intentionally present on the homepage hero and the shared PageHero. The shared logo also uses `priority`. There is no evidence that below-the-fold content cards are marked `priority` in the public components inspected.

### Confirmed issue

**P1 — Native image optimization is disabled.** The evidence is the `unoptimized: true` setting and the rendered absence of `srcset` and `/_next/image` URLs. This is an implementation risk, not a measured Core Web Vitals result. It prevents the existing `next/image` components from automatically selecting smaller responsive widths or modern encodings at request time.

### Warning

The shared `Logo` is prioritized on every public route. Rendered pages generally show two image preloads: the logo and the page hero. The logo is visible above the fold, so this is not automatically incorrect. However, the shared eager preload can compete with the likely LCP hero request. Whether it harms LCP depends on connection, device, cache state, and actual browser timing; it was not measured here.

The gallery’s first grid item spans two columns and two rows on larger screens, but its `sizes` value is the same as the other cards. If native optimization is enabled later, the first item may deserve a larger desktop size calculation. This is a responsive-sizing opportunity rather than a current measured defect because the current build does not emit `srcset`.

### Positive implementation findings

No public meaningful image was found with a missing `alt` value. No public image uses `width` and `height` incorrectly alongside `fill`. No public image uses an unnecessary `priority` prop in the inspected content-card loops. Unopened product catalog modal images are not rendered until a catalog is selected.

## 5. Alt Text Audit

### Confirmed strengths

All inspected public `next/image` components provide non-empty alt text. The homepage hero alt text describes the scene and floor context. The homepage craft image describes the visible activity. PageHero alt text is supplied by each route. Finish cards use the finish name plus floor-finish context. Product cards use a category-specific flooring-example pattern. Gallery records include human-readable descriptions rather than filenames or keyword strings.

The visually inspected homepage hero shows a bright kitchen with a person and light wood flooring, which is consistent with its descriptive scene-level alt text. The inspected finish image shows a close-up light wood surface, which is consistent with its finish-oriented context. These checks do not establish that every gallery alt is perfectly image-specific; they establish that the main examples are not empty or obviously misleading.

### Warnings

Several gallery alts are generic, including phrases equivalent to “Completed flooring project,” “Wood flooring craftsmanship,” “Hardwood flooring close-up,” and “Beautiful completed hardwood floor.” These are not keyword-stuffed, but they provide less useful information than a description of the visible subject, room, floor pattern, or finish detail. The data also repeats similar descriptions across the 29-image set. This should be reviewed image-by-image before any text is changed.

The service-card alt pattern is the service title rather than a description of the actual photograph. It is acceptable as a fallback contextual label, but it may not accurately describe each underlying image. A future review should compare each service image to its alt text before refining it.

The product and gallery figures repeat the image alt text in visible captions in some contexts. This is not an accessibility failure by itself, but it can create redundant spoken content for screen-reader users if the figure caption is not treated as a complementary description. Any change should be validated with an accessibility pass and should not remove useful visible context automatically.

The stain grid uses color blocks with text labels and does not use images. These swatches do not require alt text as images, but their color-only representation should continue to preserve the existing text names and explanatory note for users who cannot distinguish the color visually.

### No unsupported additions recommended

No alt-text change should add locations, customers, dates, project results, awards, or repetitive “Peoria hardwood flooring” phrases. The current audit does not authorize a bulk alt rewrite.

## 6. Image Asset Quality Audit

### Confirmed issues

The asset repository contains a large raw payload. `public/images` is approximately 125 MB across 107 image assets. The largest inspected files include:

- `IMG_0214.jpg`: 6,000×3,368, approximately 3.0 MB; used for refinishing content and gallery records.
- `IMG_0216.jpg`: 6,000×3,368, approximately 2.9 MB; used on About and gallery content.
- `IMG_0210.jpg`: 6,000×3,368, approximately 2.7 MB; used for product content and catalog content.
- `IMG_1629.jpeg`: 4,032×3,024, approximately 2.6 MB; used for cabinet content.
- `IMG_0500.jpeg`: approximately 2.4 MB; used for finish content.

The repository also contains multiple 4,032×3,024 and 3,264×2,448 photographs. These dimensions are materially larger than many display slots, but the current build does not resize them at request time because image optimization is disabled.

One byte-identical duplicate was confirmed: `/images/10369051_10204214669036335_2065058541013683204_o.jpg` and `/images/new-images/10369051_10204214669036335_2065058541013683204_o.jpg` have the same SHA-256 hash. This is an asset hygiene issue, but removal requires a complete reference and deployment review.

### Warnings

Many source filenames are camera-generated names such as `IMG_0214.jpg`, UUID-like names, or imported archive names. These names are not descriptive image SEO signals. Renaming them would change asset URLs and requires a migration plan; filename quality alone does not justify an unreviewed bulk rename.

A literal source scan found 60 assets not referenced by literal paths in the application source. Some appear to be older gallery, service, Hously-template, placeholder, or duplicate assets. This count is not sufficient evidence for deletion because dynamic references, framework conventions, future content, and non-public flows must be checked separately.

### Opportunities

A later implementation can prioritize native responsive delivery before creating a separate asset pipeline. After optimization is validated, the team can identify assets that still exceed their actual display needs and create approved derivatives without adding a third-party package. Duplicate and unused assets can then be retired in a separate reversible cleanup change.

## 7. Performance Audit

### What is measured

The audit measured repository file sizes, image dimensions for representative assets, rendered HTML image counts, loading attributes, preload hints, `srcset` presence, and route-level metadata. It did not measure LCP milliseconds, CLS score, INP, total blocking time, transfer sizes over a real connection, or field performance.

### Confirmed implementation risks

**P1 — Raw source delivery.** The disabled optimizer and absence of `srcset` mean a browser can receive the original source file for a display slot instead of a display-appropriate derivative. This is especially relevant to hero and gallery assets.

**P1 — Large gallery surface.** The initial gallery HTML contains 29 gallery images plus the hero and shared image elements. The gallery grid uses lazy loading for the image tags, which is helpful, but all 29 records are present in the initial client-rendered page. A long scroll or browser behavior that reaches those images can request a large cumulative payload.

**P2 — Repeated eager logo request.** The logo is prioritized across routes and appears as a preload alongside the hero. The logo is relatively small at approximately 0.3 MB, but the repeated priority policy should be evaluated alongside real LCP traces.

**P2 — No social image.** Every checked public route lacks `og:image`. This does not directly affect Core Web Vitals, but it reduces the quality of social link previews and is part of the image metadata architecture.

### Positive findings

Below-the-fold public content images generally rely on lazy loading through the default `next/image` behavior. The gallery and product card image boxes reserve geometry with aspect-ratio wrappers, reducing the risk of layout movement from missing intrinsic dimensions. The PageHero and homepage hero reserve vertical space with stable section sizing. The product catalog dialog does not render its selected image before the user opens a category.

### No measured-performance conclusion

The findings above are implementation risks and opportunities. They are not measured Core Web Vitals failures. A later implementation phase should use a repeatable local production trace and, if available, field data to compare before and after behavior.

## 8. LCP Analysis

The likely LCP candidate on the homepage is `/images/hero-kitchen.png` because it is the full-viewport visual background of the first section. The likely LCP candidate on the Services hub, representative service pages, Gallery, Products, Finishes, Stains, Pricing, About, and Contact pages is the respective PageHero image. These images are all above the fold and currently marked `priority`.

The current priority decision is directionally appropriate: the first visible hero should not be treated like a below-the-fold card. However, the likely LCP images are also subject to the disabled optimizer and raw source dimensions. The homepage hero is a 1.5 MB square PNG, while several PageHero images are multi-megabyte photographs. The highest-value implementation test is therefore to preserve hero priority while enabling or otherwise validating responsive delivery, rather than removing priority blindly.

The logo is also prioritized on every route. This may cause two eager image requests on a page. It should be evaluated in an actual trace before changing the shared header behavior.

## 9. CLS / Layout Shift Analysis

No measured CLS score was collected. The implementation has several protections against image-induced layout shift:

- PageHero reserves a large fixed minimum height.
- Homepage hero reserves a minimum viewport height.
- Gallery cards use `aspect-square` or `aspect-[4/3]` containers.
- Product cards use `aspect-[4/3]` containers.
- Finish cards use `aspect-[4/3]` containers.
- The product modal reserves a minimum-height image container.
- `fill` images are positioned inside their parent boxes with `object-cover` or `object-contain`.

The main remaining CLS warning is not missing dimensions; it is the possibility that future responsive or modal changes could alter these wrapper constraints. Any Phase 06 implementation should preserve the existing aspect-ratio and minimum-height contracts and validate the rendered layout at mobile and desktop widths.

## 10. Gallery Audit

`GalleryClient` is a client component with filter state. It builds a filter list from the 29 centralized `galleryImages` records and shows all records by default. Each image is a `next/image` with `fill`, a fixed aspect-ratio wrapper, `sizes="(min-width: 1024px) 33vw, 100vw"`, and a descriptive alt string from `lib/site.ts`. The first item spans two columns and two rows on larger screens, but uses the same sizes expression as regular cards.

The rendered gallery has lazy image loading for gallery entries, which is an appropriate default for below-the-fold content. There is no separate thumbnail/full-image modal, no lightbox, and no explicit pagination or viewport virtualization. The user can filter the already-present dataset, but filtering does not constitute a network-level loading strategy because the records are already in the client component.

The gallery copy deliberately frames images as visual direction and does not create project case studies or unsupported location/result claims. That content boundary should be preserved.

**Proposed gallery direction:** measure the default gallery payload first. If the payload remains material after native responsive optimization, evaluate a reversible strategy such as a smaller initial set, explicit load-more interaction, or carefully designed route-preserving pagination. Do not change the UX during the audit and do not invent project metadata.

## 11. Products / Finishes / Stains Audit

### Products

The Products page renders seven product card images in the initial view. The hero is eager; card images are lazy by default. The catalog modal image is conditionally rendered only after a user selects a category, so unopened catalog entries do not create initial modal image downloads. Card alt text is non-empty and category-specific, though it is a template rather than a visual description.

The main product risk is asset weight. Several product images are high-resolution source photographs between approximately 1.7 MB and 3.0 MB, while the display cards occupy approximately one-third of the desktop content width. This is a strong responsive-delivery opportunity.

### Finishes

The Finishes page renders four finish-card images plus its hero. Each card has an explicit aspect-ratio wrapper, `fill`, `sizes`, and contextual alt text such as the finish name plus “hardwood floor finish.” The page is server-rendered and its finish records are centralized. The main risk is again raw asset delivery; the page has multiple photographic cards but no responsive derivatives in the rendered HTML.

### Stains

The Stains page renders a finish hero and a grid of CSS color blocks. The visible stain cards do not download the image paths stored in the `stains` data records. This avoids image payload for the current swatch UX. It also creates a data/UI consistency question: the records contain `image` fields, but the UI intentionally uses color swatches and text. That question should be resolved before either removing the fields or changing the UX. No change is recommended during this audit.

## 12. OG / Social Image Audit

No Open Graph image exists in the root metadata, central resolver, or rendered public HTML. The checked public routes contain `og:title`, `og:description`, `og:type`, `og:url`, and `og:locale`, but zero `og:image` tags. Twitter metadata contains a `summary` card and text fields but no image field.

There is no route-specific social-image fallback and no image dimension declaration for social previews. A later implementation could reuse an approved existing asset or create a separately approved social asset, but it must preserve the existing Phase 02 metadata architecture and avoid inventing business facts. This audit does not select or add an OG image.

## 13. Confirmed Issues

1. **Native Next.js image optimization is disabled.** Evidence: `images.unoptimized: true`; rendered images lack `srcset` and `/_next/image` URLs.
2. **The public asset library is large and contains oversized source candidates.** Evidence: 107 assets, approximately 125 MB under `public/images`; several referenced files are approximately 1.7–3.2 MB and up to 6,000×3,368 pixels.
3. **The default gallery renders 29 image records in its initial client page.** Evidence: `GalleryClient` maps all `galleryImages` by default; rendered gallery contains 32 image tags in total and 29 lazy gallery entries.
4. **One byte-identical duplicate asset exists.** Evidence: the two `10369051...jpg` paths share the same SHA-256 hash.

These are implementation or asset issues. None is a measured Core Web Vitals failure.

## 14. Warnings

1. Shared `Logo` is marked `priority` and is preloaded on every public route alongside the hero. This may compete with LCP, but no timing measurement was collected.
2. Gallery alt text varies in specificity. Several descriptions are generic and should be reviewed against the actual pixels before any rewrite.
3. Service-card alt text uses service titles rather than image-specific descriptions. It is contextual but may not describe each photograph precisely.
4. A literal source scan identifies 60 unreferenced assets, but this is not sufficient evidence for deletion.
5. Many asset filenames are camera-generated or archive-style names. Renaming them would require an asset URL migration and is not automatically justified.
6. The first gallery card occupies more desktop area than regular cards but uses the same `sizes` expression. This matters mainly after responsive optimization is enabled.
7. No external performance trace, Lighthouse run, field data, image CDN measurement, or real-device bandwidth test was performed.
8. The project’s existing Node requirement and environment warnings remain outside this read-only image audit. No dependency or runtime change was made.

## 15. Opportunities

1. Validate native Next.js responsive image delivery in the deployment environment before adding any image library or service.
2. Prioritize responsive derivatives for hero, gallery, product, and finish assets after measuring actual display widths.
3. Measure gallery transfer behavior and evaluate a load-more or smaller initial set only if responsive delivery does not address the payload.
4. Add an approved Open Graph image through the existing metadata resolver rather than creating a separate metadata system.
5. Review generic gallery and service-card alt text image-by-image.
6. Resolve the duplicate asset and unused-asset candidates through a separate reference audit and reversible cleanup.
7. Decide whether the `stains[].image` fields are intentionally retained for future UI or should be removed in a later data cleanup; do not change the current swatch UX without approval.
8. Reassess shared logo priority using an actual trace rather than removing priority based on assumption.

## 16. Proposed Phase 06 Change Matrix

| Priority | File/component | Current behavior | Evidence | Proposed change | Expected benefit | Risk | Validation method |
|---|---|---|---|---|---|---|---|
| P1 | `next.config.*` and deployment image support | `images.unoptimized: true`; raw source URLs and no `srcset` | Rendered HTML and config inspection | Test enabling native Next.js image optimization, or document a deployment-compatible equivalent using existing architecture | Responsive widths, modern formats, lower transfer cost | Build/runtime incompatibility, hosting limitations, or sharp/deployment differences | Production build, rendered `srcset` inspection, local network trace, representative mobile/desktop tests |
| P1 | Existing hero and content image assets; existing `Image` call sites | Multi-megabyte source images are used for smaller display slots | Asset sizes and dimensions above | After optimization compatibility is proven, create only necessary responsive derivatives and preserve public URL behavior or provide a documented migration | Lower LCP and gallery/product transfer cost | Quality loss, cache churn, asset URL changes, extra maintenance | Compare visual quality, dimensions, transfer sizes, and route screenshots |
| P1 | `app/layout.tsx` / `lib/seo/resolver.ts` | No `og:image` or Twitter image fallback | Zero rendered `og:image` tags | Add a verified, approved social image through the existing Phase 02 metadata architecture | Better social previews and consistent sharing output | Protected metadata architecture change; wrong or invented imagery | Render every public route, inspect dimensions and absolute URLs, validate social card markup |
| P2 | `app/(site)/gallery/GalleryClient.tsx` and gallery data | 29 gallery images are in the initial client page; all are lazy but available | Rendered gallery count and component mapping | Measure first; if needed, add a reversible load-more or initial subset strategy without changing URLs or inventing case-study claims | Lower initial HTML and eventual gallery bandwidth | UX change, discoverability loss, hydration/state complexity | Mobile/desktop interaction test, image request trace, accessibility test |
| P2 | `components/logo.tsx` | Shared logo is `priority` on every public route | Two image preloads on rendered routes | Evaluate whether logo priority should be conditional or removed after LCP measurement | Reduce competing eager image request if it is not needed | Header/logo may become late or visually delayed | LCP trace, cold-cache mobile test, visual regression check |
| P2 | `lib/site.ts` gallery/service records | Some alt strings are generic or service-level rather than image-level | Source audit and representative visual inspection | Review and refine alt text only where the visible image supports a more specific description | Better accessibility and image context | Misdescription, fabricated location/project details, keyword stuffing | Image-by-image review, accessibility tree inspection, focused content tests |
| P2 | `public/images` asset inventory | One exact duplicate and 60 literal-source-scan candidates are present | SHA-256 and reference scan | Remove or archive only confirmed unused/duplicate files after a complete reference audit | Smaller repository and simpler asset maintenance | Broken dynamic references or historical content removal | Full source/build scan, route crawl, asset 404 check, rollback verification |
| P2 | `lib/site.ts` and `app/(site)/stains/StainsClient.tsx` | Stain records contain image fields, but visible UX uses color blocks | Source comparison | Decide whether image fields are future-only data or should support an approved accessible visual treatment | Data/UI consistency if needed | Unrequested UX change and extra payload | Product/content approval, accessibility review, payload comparison |

No P0 issue was identified. No proposed change should be implemented until the deployment constraints, measurement plan, and approved image choices are confirmed.

## 17. Files Likely to Change

If Phase 06 implementation is approved, likely files are:

- `next.config.*`, only if native image optimization is tested and supported;
- `components/logo.tsx`, only if measurement supports a priority change;
- `components/page-hero.tsx` or route-level hero call sites, only if responsive sizing or loading behavior needs adjustment;
- `app/(site)/gallery/GalleryClient.tsx`, only if measured gallery payload justifies a UX-preserving loading strategy;
- selected image asset paths under `public/images`, only for approved derivative or cleanup work;
- `app/layout.tsx` and/or `lib/seo/resolver.ts`, only for an approved OG image addition through the existing metadata system;
- `lib/site.ts`, only for approved alt/data cleanup.

No file was modified during this audit except this report.

## 18. Protected Files

The following areas remain protected and were not modified:

- `lib/seo/resolver.ts`, except as a possible future OG-image implementation location after approval;
- `app/robots.ts`;
- `app/sitemap.ts`;
- `lib/seo/structured-data.ts`;
- `lib/seo/local.ts`;
- all canonical and indexability policies;
- public URLs and redirects;
- `app/api/**`;
- `app/admin/**`;
- authentication and middleware security behavior;
- database, payment, quota, and lead-capture logic;
- visualizer generation logic;
- `package.json`, lockfiles, and dependency versions.

The current noindex policy for `/estimate-calculator` and `/visualizer` remains unchanged. The rendered utility routes retain `noindex, follow` and emit zero JSON-LD blocks.

## 19. Validation Plan

Before any Phase 06 implementation is accepted, run the following validation sequence:

1. Run the focused 40-test Phase 02–05 SEO suite and confirm no regression.
2. Run the production build without installing a new dependency.
3. Compare rendered image markup before and after, including `srcset`, `sizes`, preload hints, and final URLs.
4. Verify all 15 indexable public pages still have one H1, valid canonical, `index, follow`, valid internal links, and no unsupported claims.
5. Confirm `/estimate-calculator` and `/visualizer` remain `noindex, follow` and do not gain unintended structured data.
6. Capture local production traces at representative desktop and mobile widths for the homepage, Services, one service page, Gallery, Products, Finishes, and Stains.
7. Record actual LCP, CLS, image request count, transfer size, and layout screenshots. Do not substitute implementation assumptions for measurements.
8. Run an asset 404 crawl and confirm every public image URL resolves.
9. Check keyboard and screen-reader behavior for gallery filters, product catalog dialogs, and any future load-more control.
10. Verify no package, lockfile, API, database, authentication, URL, canonical, robots, sitemap, structured-data, or local-gate changes occurred outside the approved matrix.

## 20. Risk Assessment

The most important risk is enabling image optimization without confirming the current deployment environment. The repository’s build configuration and existing environment have previously shown runtime and dependency constraints. A native optimization change should therefore be tested in the same production-like environment before it is treated as safe.

The second risk is image-quality regression. Responsive derivatives can become too soft, crop important floor details, or change the visual focal point. Any derivative work must preserve the existing aspect-ratio and object-position behavior and be reviewed visually.

The third risk is changing the gallery’s loading behavior in a way that harms discoverability or keyboard use. The current filters are simple and client-side. A future payload optimization should preserve filter semantics, captions, focus behavior, and no invented project claims.

The fourth risk is metadata coupling. OG image support belongs in the existing Phase 02 metadata architecture. A separate social metadata path would create drift and is not recommended.

No security, database, authentication, payment, quota, API, or URL risk was introduced by this read-only audit.

## 21. Final Recommendation

**PHASE 06 IMPLEMENTATION: READY WITH CONDITIONS**

The repository has enough evidence to begin a controlled Phase 06 implementation, but not enough evidence to justify blind optimization. The first approved implementation step should be a reversible native image-optimization experiment with production-like validation. It should preserve hero priority, aspect-ratio wrappers, public URLs, and existing image alt semantics.

After that experiment, address the largest verified payloads and measure the gallery. Treat OG image support as a separate metadata change that requires explicit approval of the image source. Review generic alt text and asset cleanup only after image-by-image and reference audits. Do not install an image library, performance library, third-party SEO tool, analytics tool, or image service for this phase.

## References

[1]: https://github.com/mefahim/peoria-hardwood-floors/blob/main/00-seo-implementation-master.md "SEO Implementation Master Specification"
[2]: https://github.com/mefahim/peoria-hardwood-floors/blob/main/01-seo-audit-and-baseline.md "SEO Phase 01 — Audit and Baseline"
[3]: https://github.com/mefahim/peoria-hardwood-floors/blob/main/02-seo-technical-foundation.md "SEO Phase 02 — Technical SEO Foundation"
[4]: https://github.com/mefahim/peoria-hardwood-floors/blob/main/03-seo-structured-data-entity.md "SEO Phase 03 — Structured Data & Entity SEO"
[5]: https://github.com/mefahim/peoria-hardwood-floors/blob/main/04-seo-local-seo-business-entity.md "SEO Phase 04 — Local SEO & Business Entity Expansion"
[6]: https://github.com/mefahim/peoria-hardwood-floors/blob/main/05-seo-content-on-page.md "SEO Phase 05 — Content & On-Page SEO"
[7]: https://github.com/mefahim/peoria-hardwood-floors/blob/main/05B-seo-content-execution-report.md "Phase 05B SEO Content & On-Page Execution Report"
[8]: https://nextjs.org/docs/app/api-reference/components/image "Next.js Image Component Documentation"
[9]: https://nextjs.org/docs/app/building-your-application/optimizing/metadata "Next.js Metadata and Open Graph Documentation"
