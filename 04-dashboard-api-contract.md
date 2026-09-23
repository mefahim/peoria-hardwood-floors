# SEO Dashboard — API Contract

**Phase:** 01  
**Status:** Proposed boundaries only; no API routes are created.

## API principles

The dashboard API must be server-side only, authenticated, authorized, schema-validated, and audit-logged. It must call existing SEO validators and resolver functions rather than duplicate their logic. No endpoint may publish directly without the approval and evidence gates defined in Phase 05 and Phase 07.

The API must return explicit status fields and structured validation errors. It must never return secrets, password hashes, signing secrets, raw private evidence, or database credentials to client components.

## Read boundaries

| Future responsibility | Suggested endpoint family | Authentication | Authorization | Source |
|---|---|---|---|---|
| Overview health | `/api/dashboard/overview` | Required | Admin, SEO Manager, Reviewer | Derived validators |
| Page records | `/api/dashboard/pages` | Required | Dashboard roles | Resolver and content records |
| Services | `/api/dashboard/services` | Required | Dashboard roles | `lib/site.ts` |
| Topics and clusters | `/api/dashboard/topics` | Required | Dashboard roles | Phase 05/07 contracts |
| Content briefs | `/api/dashboard/content-briefs` | Required | Editor and above | Phase 07 contract |
| Local entity | `/api/dashboard/local-entity` | Required | SEO Manager, Admin | `lib/seo/local.ts` |
| Case studies | `/api/dashboard/case-studies` | Required | Reviewer and above | Evidence-gated records |
| Internal links | `/api/dashboard/internal-links` | Required | SEO Manager and Editor | Existing allowlists |
| Image audit | `/api/dashboard/images` | Required | Dashboard roles | Rendered output and assets |
| Audit findings | `/api/dashboard/audits` | Required | Dashboard roles | P0–P3 issue records |
| Settings | `/api/dashboard/settings` | Required | Admin for mutations | Protected resolver rules |
| Change history | `/api/dashboard/change-history` | Required | Admin, SEO Manager read | Append-only history |

These paths are **Proposed** and must not be created during Phase 01.

## Mutation shape

Future mutations should use a common envelope:

```ts
type MutationResponse<T> = {
  ok: boolean
  data?: T
  errors?: { code: string; field?: string; message: string }[]
  approvalRequired: boolean
  auditEventId?: string
}
```

Mutation requests must include an idempotency key for retryable actions, a client-request ID, expected version or revision, and the intended action. Optimistic concurrency must prevent overwriting a newer reviewed record.

## Content brief endpoints

A brief read endpoint returns the brief, validation issues, URL-conflict result, linked service, required evidence, and approval status. A draft mutation may create or update a planning record. Review and approval are separate actions. Publishing is not permitted unless all required reviews and evidence conditions pass.

## Case-study endpoints

A case-study read endpoint returns metadata and evidence status. Evidence upload, fact verification, client approval, SEO review, and publication approval are separate server-side actions. A publish action must re-run `canPublishCaseStudy` and refuse incomplete records. No case-study route is created automatically.

## Local SEO endpoints

Local reads expose verified and unverified fields separately. Mutations cannot turn a radius statement into a city list, create a location page, or publish LocalBusiness schema without the existing verification gate.

## Error behavior

Use stable error codes such as `AUTH_REQUIRED`, `FORBIDDEN`, `VALIDATION_FAILED`, `CONFLICT`, `EVIDENCE_REQUIRED`, `UNVERIFIED_FACT`, `PROTECTED_RULE`, `UNKNOWN_ROUTE`, and `REVISION_MISMATCH`. Avoid leaking whether private records exist to unauthorized users.

## Audit logging

Every mutation must write an append-only change-history event after authorization and validation. Failed protected mutations should also be recorded when security policy requires it. Logs must not contain secrets or raw sensitive lead data.

## Not implemented

No API route, handler, schema, migration, dependency, or authentication change is included in Phase 01.

## References

[1]: https://github.com/mefahim/peoria-hardwood-floors "Peoria Hardwood Floors repository"
[2]: https://docs.google.com/document/d/1pGxz1D5Hs-VzEYcgLcy63Rnl6g5OkuVnNbVqlOuHpIU/edit "SEO Dashboard — Phase 01 Architecture, Data Contracts & Read-Only Planning"
