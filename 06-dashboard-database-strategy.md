# SEO Dashboard — Database Strategy

**Phase:** 01  
**Status:** Architecture proposal only; no migrations or schema changes.

## Existing database

The repository uses SQLite through Node’s built-in SQLite support. The current idempotent schema contains `visitors`, `leads`, `generations`, and `request_events`, including indexes and foreign keys for visualizer, lead, quota, and request-event workflows.

There are no SEO pages, topics, content briefs, case studies, evidence, local entities, audits, internal-link records, or change-history tables. Existing tables must not be repurposed for SEO data.

## Classification

### Code-defined

Keep these code-defined unless an approved governance change says otherwise:

- production origin and canonical hostname;
- public static routes;
- interactive noindex policy;
- resolver metadata defaults;
- structured-data relationships;
- verified content facts;
- content taxonomies and templates;
- approved service records;
- local publication gates;
- Phase 07 case-study gates;
- internal-link allowlists.

### Runtime-derived

These may be calculated without persistence:

- rendered metadata status;
- canonical and robots checks;
- sitemap membership;
- structured-data checks;
- route H1 and link counts;
- image dimensions and optimization output;
- broken-link findings;
- orphan warnings;
- topic conflicts;
- current P0–P3 audit results.

### Future persisted

Subject to later approval, candidate records include:

- page review metadata;
- content briefs;
- topic opportunities;
- case studies and evidence;
- verified local entity records;
- internal-link recommendations;
- audit snapshots;
- change history;
- approval assignments.

These are candidate concepts, not approved table names.

## Persistence requirements

Every future persisted SEO record requires a stable ID, version, status, timestamps, actor metadata, approval state, validation snapshot, and rollback relationship. Evidence records require access control and safe storage. Change history should be append-only.

The dashboard must not persist a value merely because it is displayed. Derived values should remain derived unless there is a clear operational need for historical snapshots.

## Migration policy

No migration framework exists for the current database. Any future SEO persistence requires a separate approved database design, backup/restore plan, forward migration, rollback plan, test fixtures, and production deployment procedure. No migration is part of Phase 01.

## Data safety

Do not store secrets, password hashes, raw authentication tokens, or unnecessary lead data in SEO tables. Do not copy business facts into multiple ungoverned tables. Verified facts should have provenance and review status.

## References

[1]: https://github.com/mefahim/peoria-hardwood-floors "Peoria Hardwood Floors repository"
[2]: https://docs.google.com/document/d/1pGxz1D5Hs-VzEYcgLcy63Rnl6g5OkuVnNbVqlOuHpIU/edit "SEO Dashboard — Phase 01 Architecture, Data Contracts & Read-Only Planning"
