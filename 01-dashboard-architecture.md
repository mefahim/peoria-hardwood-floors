# SEO Dashboard — Architecture

**Phase:** 01 — Architecture, Data Contracts & Read-Only Planning  
**Status:** PASS WITH DOCUMENTED LIMITATIONS  
**Repository baseline:** `463b0bd` (remote `main`)  
**Authority:** Existing Phase 02–08 SEO implementation remains the source of truth.

## Scope

This document defines a future control layer for the existing SEO system. It does not authorize dashboard UI, API routes, database migrations, public SEO changes, new URLs, or content publication in Phase 01.

The intended dependency direction is:

```text
SEO Dashboard
    ↓
SEO configuration and governance
    ↓
Existing SEO resolver and governance modules
    ↓
Metadata, canonical, robots, sitemap, structured data
    ↓
Public website
```

The dashboard must never become a parallel metadata or publishing engine.

## Existing implementation inventory

The repository already contains a centralized resolver in `lib/seo/resolver.ts`. It defines the production origin, public static routes, interactive noindex policy, metadata records, canonical validation, metadata construction, and approved public-path validation.

`lib/seo/structured-data.ts` defines Organization, WebSite, WebPage, Service, LocalBusiness eligibility, and BreadcrumbList relationships. `lib/seo/local.ts` protects verified business and location publication. `lib/seo/content.ts` defines Phase 05 topics, intents, purposes, geographic scopes, content records, templates, suggestions, link validation, orphan detection, and factual governance. `lib/seo/content-growth.ts` defines the Phase 07 planning clusters, content-brief contract, case-study evidence gate, internal-link recommendations, and conflict detection.

The current database is limited to visitors, leads, generations, and request events. It has no SEO dashboard persistence. The current admin surface manages visualizer credentials, password configuration, provider configuration, generation records, leads, and visitor status. It is not an SEO dashboard.

## Future modules

| Module | Purpose | Phase 01 behavior | Source of truth | Future persistence |
|---|---|---|---|---|
| Overview | Surface derived SEO health and issue counts | Read-only design | Existing validators and route records | Optional audit snapshots |
| Pages | Inspect page metadata and governance | Read-only design | Resolver, content records, rendered routes | Future reviewed overrides only |
| Services | Inspect six known services | Read-only design | `lib/site.ts` and service records | Future approval metadata |
| Topics & Content | Manage controlled briefs and conflicts | Read-only design | Phase 05/07 contracts | Proposed content-brief records |
| Local SEO | Show verified entity and location gates | Read-only design | `lib/seo/local.ts` | Proposed verified entity records |
| Case Studies | Store evidence-gated project records | Read-only design | Phase 07 case-study contract | Proposed case-study and evidence records |
| Internal Links | Review existing and recommended links | Read-only design | Phase 05/07 validators | Proposed recommendation records |
| Image SEO | Inspect alt, dimensions, optimization, OG, duplicates | Read-only design | Next.js image output and asset inventory | Optional audit records |
| SEO Audit | Record P0–P3 findings and resolution state | Read-only design | Existing tests and audit scripts | Proposed audit records |
| Settings | Expose safe defaults and protected rules | Read-only design | Resolver and governance constants | Carefully scoped settings records |
| Change History | Track approved mutations | Read-only design | Not currently present | Proposed append-only history |

## Overview design

The future Overview screen should show derived counts for indexable pages, noindex pages, missing metadata, canonical issues, schema issues, broken links, orphan pages, image issues, content-governance issues, local-SEO issues, and P0–P3 findings. It must not invent a score. A scoring model is **Decision Required**.

All dashboard cards must link to evidence: route, entity, validator code, rendered output, or source record. A count without evidence is not actionable.

## Protected boundaries

The dashboard must not directly override canonical rules, robots policy, sitemap eligibility, structured-data safety gates, location publication gates, case-study evidence gates, authentication, payment, quota, lead, or visualizer behavior. Critical rules are **Protected**. Suggestions are not publication.

## Phase 02 readiness

Ready for Phase 02: read-only data adapters, explicit DTOs, server-side authorization design, and a dashboard route plan.

Decision Required before Phase 02: persistence strategy, role implementation, audit-log storage, mutation approval workflow, and whether any SEO fields may be overridden from code-defined values.

## Validation statement

This document changes no application behavior. It creates no route, API, migration, package, or public SEO output.

## References

[1]: https://github.com/mefahim/peoria-hardwood-floors "Peoria Hardwood Floors repository"
[2]: https://docs.google.com/document/d/1pGxz1D5Hs-VzEYcgLcy63Rnl6g5OkuVnNbVqlOuHpIU/edit "SEO Dashboard — Phase 01 Architecture, Data Contracts & Read-Only Planning"
