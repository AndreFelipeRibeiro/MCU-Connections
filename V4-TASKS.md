# MCU Connections V4

Current branch: `codex/v4`, created from released V3 (`1f79b74`).
V3 Phases 1–5 are on main. Email/password (the deferred V3 Phase 6) is separate
from the MCU's Phase 6 slate and remains explicitly unapproved.

## 1. Catalog refresh

- [x] Review all released IMDb/RT scores and fill missing scores, prioritizing Phase 6.
- [x] Record sources, score scopes, dates, discrepancies and audit limits.
- [x] Correct supported release dates/windows and focused cast/chronology omissions.
- [x] Preserve all 64 permanent title ids and existing collection data contracts.
- [x] Verify data invariants, date-window behavior, rendering and rating sorts.
- [x] Commit this completed change and push the V4 branch; do not merge main.

## 2. Weekly review

- [x] Schedule Mondays at 9am Eastern in this chat (automation: Review MCU catalog updates).
- [x] Prepare sourced proposed patches for approval; never auto-apply or publish.
- [x] Flag source conflicts/missing dates instead of inventing ratings or premieres.

## Next work

Discuss further bugs/improvements with the user. Merge/deployment requires a
separate confirmation. Do not start email/password work without its own plan
and explicit approval.

Audit and source map: [docs/CATALOG-AUDIT.md](docs/CATALOG-AUDIT.md) and
[docs/CATALOG-SOURCES.json](docs/CATALOG-SOURCES.json).
