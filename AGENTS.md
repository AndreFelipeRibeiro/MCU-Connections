# Repository instructions

## Architecture and scope

Read V3-SPEC.md and V3-TASKS.md before implementation. Keep the existing browser
React/Babel architecture: no npm, package.json, bundler, router, ES modules or
test runner. Shared cross-file APIs use window.*; CDN dependencies are pinned
with SRI. Preserve permanent catalog title ids and the spatial-filter invariants.
Email/password Phase 6 and merges to main require separate explicit approval.

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
- Claim the Notion task before working by noting "In progress — Codex" or
  "In progress — Claude" beneath it; change it to "Awaiting review — <agent>"
  when ready. Do not pick up a task the other agent has claimed.
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

Use the top unchecked task in the user's current V3 Notion checklist unless the
user explicitly names another task. Work on one item at a time. Keep it unchecked
and mark it Awaiting review after implementation and verification. Move it to
Completed only after explicit user approval and its changes are committed and
pushed to GitHub. Add a bracketed completion date using America/New_York, commit
links and verification notes. Completion on V3 does not approve a main merge.
