# SEO Dashboard — Permissions & Security

**Phase:** 01  
**Status:** Future design; roles are not implemented.

## Existing security boundary

The repository currently protects `/admin/:path*` and `/api/admin/:path*` with `middleware.ts`. `/admin/login` and `/api/admin/login` are public entry points. Other admin requests fail closed when the session secret is absent or redirect/return an authentication error when the session is invalid.

The session cookie is HTTP-only, SameSite Lax, path-scoped, and secure in production. The session token is derived with Web Crypto from a signing secret. The existing admin surface is for visualizer and lead operations, not SEO management.

## Future roles

| Role | View | Edit | Approval | Admin-only actions |
|---|---|---|---|---|
| Admin | All dashboard modules and sensitive evidence | Configuration, permissions, protected settings | May approve any eligible change | Role management, secrets, rollback, protected-rule changes |
| SEO Manager | All SEO records, audits, governance, services | Page proposals, briefs, links, audit status | Approves SEO metadata proposals and briefs | Cannot change secrets or bypass evidence gates |
| Content Editor | Pages, topics, briefs, links, image alt proposals | Draft briefs and suggestions | Cannot publish alone | No local facts, schema, robots, canonical, or case-study approval |
| Reviewer | Assigned briefs, evidence, audit findings | Review comments and decisions | Approves or rejects assigned content/evidence | No configuration or direct publishing |

These are **Proposed** roles. The existing single admin credential does not implement this matrix.

## Permission rules

Authorization must be enforced server-side for every read and mutation. Client-side role state is informational only. Permissions must fail closed. A missing identity, role, or authorization record must deny the action.

Critical SEO rules are **Protected** and cannot be freely overridden:

- canonical hostname and HTTPS requirement;
- robots and sitemap exclusion rules;
- noindex utility-route policy;
- verified local-business gate;
- location publication gate;
- case-study evidence gate;
- approved internal-link allowlist;
- absence of fabricated claims;
- public URL and redirect safety.

## Mutation controls

Every mutation requires authenticated identity, authorization, schema validation, conflict detection, fact/evidence validation, and an audit-log entry. Mutations affecting public output require reviewer or SEO Manager approval. Mutations affecting protected settings require Admin approval and a clear rollback path.

The intended content lifecycle is:

```text
Suggestion → Draft → Review → Approval → Publish
```

AI suggestions cannot publish business facts, locations, client claims, reviews, testimonials, awards, certifications, case studies, or local claims.

## Security requirements

Future implementation must provide server-side authorization, CSRF protection where applicable, strict input validation, output escaping, secret exclusion from client bundles, no direct database access from client components, rate limiting for sensitive actions, secure cookies, and audit logging for sensitive mutations.

Evidence uploads require content-type validation, size limits, safe storage, non-executable handling, access control, and explicit association with a project record. Uploaded evidence must not become public content automatically.

## Audit logging

The change-history record must capture actor, timestamp, entity, entity ID, field, previous value, new value, action, source, and approval state. Sensitive actions include role changes, credential changes, protected SEO-rule changes, publication approval, evidence approval, and rollback.

## Not implemented in Phase 01

No roles, permissions, middleware changes, database tables, API routes, UI, or authentication changes are implemented by this phase.

## References

[1]: https://github.com/mefahim/peoria-hardwood-floors "Peoria Hardwood Floors repository"
[2]: https://docs.google.com/document/d/1pGxz1D5Hs-VzEYcgLcy63Rnl6g5OkuVnNbVqlOuHpIU/edit "SEO Dashboard — Phase 01 Architecture, Data Contracts & Read-Only Planning"
