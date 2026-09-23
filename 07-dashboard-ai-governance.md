# SEO Dashboard — AI Governance

**Phase:** 01  
**Status:** Future governance; no AI generation or publishing is implemented.

## Permitted assistance

A future dashboard may use AI to suggest SEO titles, meta descriptions, topic relationships, content briefs, internal links, alt-text improvements, and explanations of audit findings. Each output must be clearly labelled as an AI suggestion and linked to the source evidence used.

AI may summarize existing verified records. It may not convert an image, filename, keyword, radius statement, or generic service description into a new factual business claim.

## Prohibited autonomous publication

AI must never independently publish or approve:

- business facts;
- addresses, hours, or local claims;
- cities or locations;
- client or project claims;
- reviews or testimonials;
- awards, certifications, memberships, or affiliations;
- case studies;
- project outcomes;
- schema eligibility;
- redirects, canonical changes, robots changes, or sitemap inclusion.

The required lifecycle is:

```text
Suggestion → Human Review → Approval → Publish
```

## Grounding and evidence

Suggestions must cite the repository field, approved source material, or verified evidence on which they are based. If no supporting evidence exists, the output must say **Unverified** and remain non-publishable.

A content suggestion must pass existing Phase 05 taxonomy, URL conflict, internal-link, and factual checks. A case-study suggestion must pass the Phase 07 evidence and human-approval gates. A local suggestion must pass the Phase 04 verification gates.

## Review requirements

The reviewer must see the original value, proposed value, evidence, affected route/entity, claim classification, conflict result, and expected output impact. Approval must be explicit and actor-attributed. Rejected suggestions remain non-published.

## Model and data controls

Future implementation must define approved model providers, prompt versioning, retention, request logging, redaction, rate limits, and failure behavior. Secrets must remain server-side. User or lead data must not be sent to an AI provider without an approved data-handling policy.

## Not implemented

No AI package, provider, prompt, content, case study, route, API, or third-party service was added in Phase 01.

## References

[1]: https://github.com/mefahim/peoria-hardwood-floors "Peoria Hardwood Floors repository"
[2]: https://docs.google.com/document/d/1pGxz1D5Hs-VzEYcgLcy63Rnl6g5OkuVnNbVqlOuHpIU/edit "SEO Dashboard — Phase 01 Architecture, Data Contracts & Read-Only Planning"
