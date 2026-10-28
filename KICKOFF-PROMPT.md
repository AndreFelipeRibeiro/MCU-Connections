# Kickoff prompt

## Handoff — 2026-10-24 (historical; current: docs/HANDOFF.md)

Phases 1–5 were initially released to `main` at `1f79b74`.
The subsequent V3 maintenance release was approved on 2026-10-24: catalog
refresh, reverse sorting, responsive navigation, mobile List/animations,
per-device preferences, Safari Order handling and spatial camera improvements.
These changes are included in the current `main` release, not a new major version.
Further development continues on `version/3.0` in
`<your-developer-folder>/MCU-V3`. The Notion V3 Tasks database is the active
backlog; the former checklist is archived.
Current setup is in [README.md](README.md), catalog work and sources are in
[docs/CATALOG-AUDIT.md](docs/CATALOG-AUDIT.md), and the original phase verification
is in [docs/V3-VERIFICATION.md](docs/V3-VERIFICATION.md).

**Next gates:** the user approved this maintenance merge on 2026-10-24.
Future changes still require review before committing/pushing and a new approval
before another main merge. Continue the user's bugs/improvements before Phase 6.
Email/password implementation and service setup require their own plan and
explicit approval; this maintenance release does not authorize them.

## Original kickoff template

This template describes the initial build. Do not restart Phase 1 when resuming
the current worktree; use the current handoff above.

Drop `V3-SPEC.md`, `V3-TASKS.md`, and `schema.sql` into the root of
`<your-developer-folder>/MCU-V3`, then paste the block below.

---

I'm building V3 of MCU Connections in this worktree: watch tracking (seen /
watchlist) with Google sign-in and cloud sync. Email/password accounts are a
deferred Phase 6, not part of the initial Google-only phases.

Three files in this repo are the plan. Read all three before writing any code:

- `V3-SPEC.md` — the full spec. Architecture, decisions, UI integration points.
- `V3-TASKS.md` — phased task breakdown with acceptance criteria.
- `schema.sql` — the database schema, ready to run.

They were written after a careful read of this codebase, so the file paths,
component names, and line numbers in them are real. Verify as you go.

**Ground rules:**

1. **Start with Phase 1 only.** Read the spec, then read the actual files it
   references (`app.jsx`, `mobile.jsx`, `index.html`, `data.js`), then give me a
   short plan for Phase 1 and wait for my go-ahead. Don't start editing.

2. **Preserve the architecture.** No `package.json`, no bundler, no router, no
   test runner, no npm. JSX compiles in the browser via Babel standalone.
   Cross-file sharing is `window.*` only — these scripts are not ES modules.
   Every CDN script tag carries an SRI `integrity` hash; anything new must too.

3. **§3 of the spec lists eight settled decisions (D1–D8).** Implement them as
   written. If you think one is wrong, tell me before implementing — don't
   silently deviate.

4. **Two things in the spec are marked as the highest-risk work.** Read them
   properly before you touch either:
   - §7.1 — why the collection filter must NOT go into the existing `filtered`
     memo (it would recenter the spatial viewport mid-click).
   - §7.3 — the mobile nested-`<button>` refactor, which breaks the primary
     navigation of the touch app if done carelessly.

5. **Don't hardcode 59.** The released-title denominator is computed at runtime
   from release dates. Verify the 2026-10-13 → 2026-10-14 boundary (59 → 60).

6. **Verify entry-point references against the code.** The entry is `index.html`.
   The original planning claim about already-correct README references proved
   inaccurate; the user authorized correcting them in Phase 5 on 2026-10-24.

7. **No secrets in the repo.** The Supabase URL and publishable key are
   intentionally public and committed. The `service_role` key, the Google OAuth
   client secret, and any DB credential must never be committed — the Google
   secret lives only in the Supabase dashboard.

8. **Commit at the end of each phase**, not per file. There's no CI and no
   tests, so verification is the manual checklist in §10 of the spec — run the
   relevant items and tell me what you actually checked versus what you assumed.

9. If something in the spec conflicts with what you find in the code, **the code
   wins** — tell me about the discrepancy rather than working around it quietly.

10. **Phase 6 (email/password accounts) is deferred.** Before starting it, read
    spec §5.5 and the Phase 6 tasks, present a plan, and ask me for explicit
    confirmation. Do not treat earlier phase approvals or this roadmap as
    permission to implement it. Keep the Email provider disabled until that
    phase is approved and its flows are ready. No auth or schema changes for
    email/password as part of Phases 1–5.

Start by reading the three plan files and the four source files, then give me
your Phase 1 plan.

---

## If you're using Codex instead

Same text works. Two adjustments:

- Codex is more likely to reach for a build step or npm on its own. Restate rule
  2 if you see it creating a `package.json`.
- Ask it to show you the diff for the `mobile.jsx` button refactor (task 1.3)
  before it moves on — that's the change most likely to quietly break tap
  handling.

## Resuming mid-build

For later phases, replace rule 1 with:

> Phases 1–N are done and committed. Read `V3-SPEC.md` and `V3-TASKS.md`, check
> the current state of the code against what Phase N claims to have landed, then
> give me a plan for Phase N+1 and wait for my go-ahead.


When the next phase is Phase 6, explicitly say that email/password work is
waiting for confirmation. Present its plan and wait for a new approval before
editing code or configuring services. The existing collection schema is provider
independent; no SQL change is needed just to record this future phase.

For the current handoff, do not automatically advance from Phase 5 to Phase 6.
Continue bugs/improvements on `version/3.0`; obtain a fresh merge decision for
those changes. Phase 6 remains separately gated even though the original V3
release is already merged.
