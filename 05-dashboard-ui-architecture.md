# SEO Dashboard — UI Architecture

**Phase:** 01  
**Status:** Future UX design; no dashboard UI is implemented.

## Design principles

The future dashboard must use the existing application design system and must not redesign the public website. It should make source, derived, proposed, verified, unverified, and approval states visible. Every action must show its consequence and rollback path.

## Shell

The dashboard should use an authenticated admin shell with a persistent sidebar, page title, breadcrumb, current user/role indicator, and a compact change-history link. The sidebar modules are Overview, Pages, Services, Topics & Content, Local SEO, Case Studies, Internal Links, Image SEO, SEO Audit, Settings, and Change History.

The existing admin shell is visualizer-oriented. Reuse its authenticated boundary only after a future permission model is approved. Do not place SEO controls into the public layout.

## Core screens

### Overview

Show derived health cards, issue counts by P0–P3, indexability summary, content-governance summary, local-SEO gates, image findings, and recent approved changes. Each card must link to evidence. No score should be shown until the scoring decision is approved.

### Pages and Services

Use searchable tables with route, title, indexability, canonical, primary topic, intent, schema relationship, audit status, last reviewed, and approval state. Service rows must show the six existing services and link to their current routes. Avoid editable fields until a persistence and approval design exists.

### Topics & Content

Use filters for topic cluster, intent, purpose, service, geographic scope, status, and conflict state. Brief screens must separate planning from publication. A visible warning must appear when a proposed URL conflicts with an existing route.

### Local SEO and Case Studies

Local screens must distinguish verified values from unverified values and show why a location or schema record is ineligible. Case-study screens must show evidence checklist, client approval, fact review, SEO review, and publication status. Empty state should explicitly say that no verified case studies are currently publishable.

### Internal Links and Image SEO

Show existing links, approved destinations, broken-link findings, orphan warnings, and recommendations. Image screens should show asset path, purpose, alt text, dimensions, optimization, OG eligibility, and duplicate status. Recommendations require human approval.

### SEO Audit

Use issue cards with severity, route/entity, description, evidence, detected time, status, recommended action, and resolution metadata. Filters must support P0–P3, category, status, and route.

## States

Every data screen requires loading, empty, error, unauthorized, and stale-data states. Mutating screens require review, conflict, validation-error, approval-pending, and success states.

Confirmation dialogs are mandatory for approval, publication, protected-setting changes, evidence approval, and rollback. They must show the exact payload and affected routes.

## Accessibility

Use semantic headings, keyboard navigation, visible focus, accessible labels, status text that is not color-only, table headers, error associations, and confirmation dialog focus management. Destructive or protected actions must be explicit and reversible where possible.

## Not implemented

No route, component, API, styling, dependency, or public-site change is made in Phase 01.

## References

[1]: https://github.com/mefahim/peoria-hardwood-floors "Peoria Hardwood Floors repository"
[2]: https://docs.google.com/document/d/1pGxz1D5Hs-VzEYcgLcy63Rnl6g5OkuVnNbVqlOuHpIU/edit "SEO Dashboard — Phase 01 Architecture, Data Contracts & Read-Only Planning"
