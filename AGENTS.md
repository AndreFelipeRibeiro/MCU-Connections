# Repository instructions

## Architecture and scope

Read V3-SPEC.md and V3-TASKS.md before implementation. Keep the existing browser
React/Babel architecture: no npm, package.json, bundler, router, ES modules or
test runner. Shared cross-file APIs use window.*; CDN dependencies are pinned
with SRI. Preserve permanent catalog title ids and the spatial-filter invariants.
Email/password Phase 6 and merges to main require separate explicit approval.

## Change records and attribution

- Update CHANGELOG.md for each coherent committed change. Include date/time with
  timezone, an overview, verification actually performed and material limitations.
  Distinguish commit/record times from deployment times; do not invent old dates.
- Keep README.md current when behavior, setup, release status or workflow changes.
- For commits assisted by Codex, retain the maintainer as primary author and add
  a blank line followed by: Co-authored-by: Codex <codex@openai.com>
- Preserve existing Claude credits and acknowledge the actual tools used. Do not
  claim tools or verification that were not used, or rewrite old credits merely
  to add a new tool.

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
