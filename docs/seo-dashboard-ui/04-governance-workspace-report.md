# Phase UI-04 — SEO Governance Workspace Report

## Executive summary

Phase UI-04 refines the existing SEO governance areas into a cohesive, premium operations workspace inside `/admin/seo`. The implementation adds an integrated governance navigator, improves the evidence/review desk for Internal Links, Image SEO, and Change History, adds clearer empty/error/status treatment, and preserves the existing Topics, Content Opportunities, Content Briefs, Local SEO, Business Entity, Service Areas, and Case Study governance components and their APIs.

This phase is UI-only. Existing validators, lifecycle rules, publication gates, API contracts, persistence, authentication, authorization, SEO behavior, public routes, dependencies, and database schema remain unchanged.

## Files changed

| File | Purpose |
| --- | --- |
| `app/admin/seo/GovernanceWorkspaceNav.tsx` | Added an integrated section navigator using existing `/admin/seo` anchors for Topics, Content Opportunities, Content Briefs, Local SEO, Case Studies, Internal Links, Image SEO, and Change History. |
| `app/admin/seo/Phase07Client.tsx` | Refined the existing Internal Links, Image SEO, and Change History workspace with clearer evidence cards, status badges, review feedback, history search/action filtering, and responsive layouts while reusing the Phase 07 APIs. |
| `app/admin/seo/page.tsx` | Added the governance workspace map and existing section anchors without creating routes or changing data behavior. |
| `docs/seo-dashboard-ui/04-governance-workspace-report.md` | This implementation and validation report. |

The existing `SeoGovernanceClient` and `LocalGovernanceClient` remain the authoritative UI/API surfaces for their existing Topics, Content Opportunities, Content Briefs, Business Entity, Service Areas, and Case Study functionality. They were not replaced with a second governance engine.

## Workspace architecture

The protected `/admin/seo` page now presents a governance operations map directly below the SEO workspace header. The navigator links to existing section anchors only; it does not create fake routes or claim new functionality. Existing governance areas remain in one integrated page and continue to use their original server-derived snapshots and protected APIs.

The Phase 07 area is presented as an `Evidence & history` review desk with three tab views: Internal Links, Image SEO, and Change History. It remains a client presentation layer over the existing `Phase07Snapshot` and `/api/admin/seo/phase07` endpoints.

## Topics UX

The existing Topics view remains available from the integrated navigator and retains search, topic-cluster filtering, intent filtering, status filtering, related route counts, opportunity counts, source state, review state, and persisted-topic editing. Existing/code-defined topics remain distinguishable from persisted planning topics. No arbitrary keywords or new topics were introduced.

## Content Opportunities UX

Content opportunities continue to use the existing governance snapshot and are grouped with the Content Brief experience through existing tabs and anchors. Opportunity records remain planning/governance records and communicate their existing content ID, working title, purpose, topic, intent, audience, service relationship, geographic relevance, proposed URL, conflicts, CTA, internal links, evidence, unsupported claims, source material, fact review, SEO review, human approval, and lifecycle fields where available in the existing read model.

The workflow remains `FLAG → REVIEW → DECIDE`; no automatic publishing path was introduced.

## Content Brief UX

Content Briefs remain in the existing structured governance editor and are reachable from the shared workspace map. The existing form continues to group identity, purpose, topics, intent, audience, service relationship, geography, URL, CTA, links, evidence, reviews, approval, and lifecycle data through the approved API. Draft, review, approved, rejected, and published values remain governed by the existing validator; the UI does not bypass lifecycle rules or force publication.

## Local SEO UX

The existing Local SEO workspace remains reachable through the integrated navigator and preserves its Business Entity, Service Areas, Verification, and publication-readiness separation. Verified/current facts remain distinct from pending/unverified fields. Pending saves remain governance data only and cannot verify address, hours, profiles, reviews, awards, certifications, memberships, affiliations, or founded dates.

Service-area records continue to show verification, evidence, publication eligibility, indexability, related services, and governance issues. Dashboard-created locations remain blocked from public route, sitemap, canonical, robots, and schema output unless the authoritative server gates pass.

## Case Studies UX

The existing evidence-first Case Study workspace remains reachable from the shared map. It continues to expose title, slug, service relationship, project identity, description, images, factual details, documented work, materials, evidence, source material, fact review, SEO review, human approval, and lifecycle fields supplied by the current record contract.

Missing evidence remains visible, and the existing validator remains authoritative. No client, date, location, measurement, material, outcome, testimonial, quote, award, certification, or performance claim was invented.

## Internal Links UX

The refined review desk displays source, target, context, relation, search intent, geographic relevance, existing-link state, governance status, and review state from the existing Phase 07 rows. Suggested, Review, Accepted, and Rejected states remain visible through text badges. Governance issues are displayed in a dedicated warning panel. Self-links, blocked targets, noindex/private routes, nonexistent routes, and other blocked destinations remain evidence rather than being hidden.

Review actions continue through the protected Phase 07 API. Accepted governance state does not rewrite public content.

## Image SEO UX

The image inventory now uses stronger evidence cards showing asset/reference, file type, size, dimensions, usage availability, alt availability, decorative state, OG state, validation notes, and review state. Known values and unavailable values are clearly separated. The UI never invents subjects, usage pages, accessibility facts, or alt text. Review actions remain governance-only and do not mutate public content.

## Change History UX

The Change History tab remains read-only and uses the existing append-only history snapshot. It displays timestamp, actor/source, entity/ID, field, action, previous/new values where present in the existing record, and clear action badges. Local search supports actor, entity, entity ID, field, and source text; action filtering supports the existing `set` and `reset` actions. No edit or delete control exists.

The existing bounded API/history architecture remains unchanged. The client does not write history records directly.

## Empty/error states

The refined Phase 07 workspace includes clear empty states for no internal links, no orphan candidates, no supported image assets, and no matching history records. Review failures now produce an accessible status message instead of silently disappearing. Unavailable telemetry remains explicitly listed at the bottom of the workspace. Existing Topics and Local SEO components retain their existing empty, permission, pending, blocked, and validation states.

## Accessibility

The governance navigator uses semantic navigation and accessible link names. Phase 07 tabs use `role="tab"` and `aria-selected`; search and action filters have labels; review buttons remain keyboard focusable with visible focus states; status is communicated with text as well as color; history and inventory layouts use readable headings and labels; responsive cards avoid page-wide horizontal overflow. Existing form components retain their labels and status messaging.

## Security preservation

Authentication and authorization remain server-side and unchanged. All governance mutations continue through the existing protected APIs and server validators. The UI does not trust client-side validation, expose secrets, bypass evidence gates, alter lifecycle transitions, modify history records, or publish content. No API contract, persistence format, database schema, SEO rule, or public route was changed.

## Tests

Focused UI-04 validation passed:

- **9 test files passed**
- **63 tests passed**

The run covered governance, local SEO management, local SEO, content SEO, SEO dashboard, Phase 07, structured data, SEO management, and dashboard foundation tests. No UI-04 test failed.

No UI-04 changed file produced a new TypeScript diagnostic. The full repository type check continues to report the previously documented SQLite typing issues.

## Build result

`pnpm run build` passed:

- Next.js compilation: passed
- Page data collection: passed
- Static page generation: passed, 36/36
- Protected `/admin/seo` route: included

The environment continues to report the pre-existing Node 22 versus declared Node 24 engine mismatch and middleware convention deprecation warning. ESLint remains unavailable as previously documented.

## Known limitations

The governance workspace continues to use the existing long-form governance clients and their existing read models; this phase intentionally did not create a second governance engine or rewrite their server contracts. Search Console, analytics, ranking, traffic, and external monitoring are not connected. Image usage and alt associations remain unavailable where repository source contracts do not provide them. The current single-admin-session model remains unchanged.

## Manual verification

A temporary local production server was used for an authenticated runtime check:

- Authenticated `/admin/seo` returned `200`.
- The rendered HTML contained `SEO governance workspace`, `Topics`, `Content Opportunities`, `Local SEO`, `Case Studies`, `Governance review desk`, and `Change History` markers.
- The workspace remained protected by the existing server-side session middleware.

No live production-domain verification is claimed. No screenshot artifact was generated in this sandbox.

## Commit SHA

The dedicated implementation commit is:

`feat(dashboard-ui): refine seo governance workspace`

`600a984e3eb8037dc3d65635e9b419e24fda0cf3`

## Final status

**PASS WITH DOCUMENTED LIMITATIONS**

Phase UI-04 is complete. Phase UI-05 was not started.
