# Repository instructions

## Architecture and scope

Read V3-SPEC.md and V3-TASKS.md before implementation. Keep the existing browser
React/Babel architecture: no npm, package.json, bundler, router, ES modules or
test runner. Shared cross-file APIs use window.*; CDN dependencies are pinned
with SRI. Preserve permanent catalog title ids and the spatial-filter invariants.
Email/password Phase 6 and merges to main require separate explicit approval.

User-facing text is translated: never hard-code UI strings in components. Add
a key to locales/en.js (the complete base), translate it in every other
locales/*.js file, and read it with `tr()` (app.jsx), `mtr()` (mobile.jsx) or
`window.MCU_I18N.tr()`. Show titles and character names through
`MCU_I18N.titleName()` / `charName()`; search should keep matching every
language's names. New catalog titles need an official local title and a short,
spoiler-light synopsis (`synopses`) per locale; write synopses rather than
copying studio or TMDB text.

## Change records and attribution

- Keep iterations local and uncommitted until the user explicitly approves
  committing and pushing the current changes. Prior approval does not carry
  over to a new revision. Do not push layout experiments for review.
- Update CHANGELOG.md for each coherent committed change. Include date/time with
  timezone, an overview, verification actually performed and material limitations.
  Distinguish commit/record times from deployment times; do not invent old dates.
- Keep README.md current when behavior, setup, release status or workflow changes.
- For commits assisted by Codex, retain the maintainer as primary author and add
  a blank line followed by: Co-authored-by: Codex <codex@openai.com>
- For commits assisted by Claude, do the same with the model actually used, e.g.
  Co-authored-by: Claude Opus 5.5 <noreply@anthropic.com>
- Preserve existing Claude credits and acknowledge the actual tools used. Do not
  claim tools or verification that were not used, or rewrite old credits merely
  to add a new tool.

## Shared working tree (Codex and Claude)

Codex and Claude both work directly in this `version/3.0` worktree, one at a
time. Uncommitted changes are the hand-off point, so treat them carefully.

- Before starting, run `git status`. If there are uncommitted changes you did
  not make in the current session, stop and ask the user. Do not edit, stash,
  reset, discard or commit another agent's pending work.
- Fetch before starting; if `version/3.0` moved on GitHub, fast-forward only
  (`git pull --ff-only`) on a clean tree.
- Claim the task in the Notion V3 Tasks database before working (see Backlog
  workflow). Do not pick up a task the other agent has claimed.
- Do not run `git reset --hard`, `git checkout -- .`, `git clean`, `git stash`,
  rebases, force pushes or `git worktree prune` without explicit user approval.
  The worktree path can look missing or prunable from a sandboxed shell; it is not.
- When asked to review the other agent's work, read only (`git diff`) and report
  findings. Edit only if the user asks.
- Local preview: `http://localhost:8123/` (README). Google OAuth also allows
  `http://localhost:8126/`; other ports cannot complete sign-in.

## Privacy

- Use the maintainer's verified GitHub noreply identity for future commits.
  Do not record personal author emails, user records, session/OAuth tokens,
  privileged API keys, credentials or machine-specific home paths in tracked files.
- Supabase project URLs and publishable keys are intentionally public. Never add
  service-role/secret keys, Google OAuth client secrets or database credentials.
- Account profile values must come from the active session at runtime; do not
  commit fixtures containing real users or database exports.
- Check staged content and commit metadata before pushing. Do not echo suspected
  secrets in tool output, commit messages, changelogs or review reports.
- Removing a value from current files does not remove its history. Explain any
  existing exposure and obtain explicit approval before rewriting published
  history or force-pushing. Do not claim that a Git rewrite removes external
  clones, caches or all historical deployments.

## Backlog workflow

The user's Notion **V3 Tasks** database (under the MCU - V3 page) is the backlog;
the old checklist is a read-only archive. Priority is the order of the **Backlog**
column in the **All tasks** board view, top first: take the top unclaimed task
unless the user names another. The user sets that order by dragging cards; do
not add priority numbers. Notion keeps a separate manual order per view, so the
**Queue** table lists the same tasks but its order is not the priority.
Work on one task at a time.

- Claim: set **Assigned to** to your agent and **Status** to **In progress**, then
  re-read the record to confirm no one else claimed it. Ownership is a
  coordination convention, not a file lock.
- Ready: set **Status** to **Awaiting review**. Keep the request, changes, actual
  verification and remaining limits in the task page body.
- Complete code tasks only after explicit user approval and once the approved
  change is committed and pushed: set **Status** to **Completed**, **Latest
  commit** to the final implementation commit, and list every related commit in
  the page body. Completed tasks move to the Completed view automatically.
- Completion time and order: set **Completed on** to the actual completion date
  and time in America/New_York (include the time, `is_datetime = 1`). Never use
  the task's creation or last-edited time. Query the database first, then set
  **Completion order** to the highest existing value plus one; tasks closed
  together take their confirmed completion sequence. Older date-only records
  (and the backfilled Completion order estimates) stay as they are unless the
  real time can be verified. The **All tasks** board and the **Completed** view
  both sort by Completed on descending, then Completion order descending, so the
  latest completion is first in the Completed column.
- Notion-only tasks still need the user's review but no code commit. Phase 6
  (email/password) stays **Deferred** until its own plan and approval.
  Completion on V3 does not approve a main merge.
