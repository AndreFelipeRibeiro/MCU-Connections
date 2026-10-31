# Repository instructions

The single shared rulebook for every agent working on MCU Connections (Claude
Code, Codex, or any other). It assumes no chat history. `CLAUDE.md` only imports
this file; put new rules here. For the current state of the project, open
threads and why things are the way they are, read
[docs/HANDOFF.md](docs/HANDOFF.md) and [docs/decisions.md](docs/decisions.md)
before starting. `V3-SPEC.md`, `V3-TASKS.md` and `KICKOFF-PROMPT.md` are the
original V3 plan, kept as history: each opens with a note saying so, and lines
that no longer hold carry dated *Superseded* notes. The README describes the
app as it is now.

This checkout is **V4** (branch `version/4.0`, worktree `MCU-V4`). Read
[docs/V4-KICKOFF.md](docs/V4-KICKOFF.md) before V4 work: it sets out the V4
plan, the environment and the Figma workflow.

## Start of every session

1. `git status` in the worktree. If there are uncommitted changes you did not
   make in this session, stop and ask the user. Never edit, stash, reset,
   discard or commit another agent's pending work.
2. `git fetch origin`; if `version/4.0` moved, fast-forward only
   (`git pull --ff-only`) on a clean tree.
3. Open the Notion **V4 Tasks** board. Ship anything already in **Approved**
   first (the user cleared it; commit, push, then complete it), then take the
   right ticket and claim it (see Backlog workflow) before writing code.

## Stack and layout

- Static site, no build: React 18.3.1 and ReactDOM (production UMD builds),
  Babel standalone 7.29.0 (compiles the `.jsx` files in the browser) and
  supabase-js 2.112.2, all from unpkg with pinned versions, `crossorigin` and SRI
  hashes. Supabase (Postgres + Google OAuth) stores signed-in collections.
  Vercel serves the repository as static files.
- **Rule for V3: the app has no build step.** No npm, package.json, bundler,
  router or ES modules in the app; files share APIs through `window.*`. Do not
  migrate piecemeal (no partial bundling or precompiling).
- **Exception: `qa/`** is development-only tooling with its own `package.json`
  (Playwright, axe-core). Nothing in the app may load from `qa/`; Vercel does not
  deploy it (`.vercelignore`) and its installs stay out of Git (`.gitignore`).
- **V4 moves to a build step** (React with a standard bundler such as Vite,
  built by Vercel) to unlock design-system tooling, Figma round trips, faster
  startup and modules. That migration is the first V4 project, with its own plan
  and approval (docs/decisions.md, docs/V4-KICKOFF.md). On `version/4.0` the
  no-build rule above stays in force until that plan is approved; the ticket
  that lands it rewrites this section.
- Load order lives in `index.html`: `boot.js`, locales + `i18n.js`, CDN
  libraries, `data.js`, `guides.js`, `media-data.js`, `watch-data.js`, `config.js`,
  `supabase-client.js`, then the `.jsx` files with `app.jsx` last (`guides-ui.jsx`
  after `watch.jsx`, then `picker.jsx`). Keep that order.
- Main files: `app.jsx` (app shell, desktop Spatial canvas, toolbar, details
  drawer, state), `mobile.jsx` (phone views, sheets, `Highlight`, `Portrait`
  users), `desktop-list.jsx` (desktop List), `connections.jsx` (an early line layer,
  kept for reference and not loaded; the lines are drawn in `app.jsx`),
  `poster.jsx` (`PosterArt`, `Portrait`, image fallbacks), `search-suggest.jsx`,
  `tracking.jsx` (Seen/Watchlist + sync, the Up next rule), `upnext.jsx`
  (the Up next card, strip, meter row and chip), `watch.jsx` (Where to watch
  in the details, the region picker), `guides.js` (curated guides and the
  continuity marker; content needs the user's approval) + `guides-ui.jsx`
  (the guide menu, views, banner, pill and "Part of"), `picker.jsx` ("What
  have you seen?", the poster-grid picker), `account.jsx`, `about.jsx`
  (`ModalDialog`), `celebrate.jsx` (counters, confetti, sign-in reminder),
  `boot.js` (startup screen), `i18n.js` + `locales/*.js`, `data.js` (catalog;
  permanent title ids), `media-data.js` (TMDB paths), `config.js` (public
  Supabase URL + publishable key), `schema.sql`, `styles.css`,
  `styles-mobile.css`. The README's "Project structure" table is the full list.
- Docs: `README.md` (features, setup, deploy), `CHANGELOG.md`, `docs/` (handoff,
  decisions, catalog audit and sources, privacy review, V3 verification log).

## Commands

- Install: nothing to install.
- Run locally, from the repository root: `python3 -m http.server 8123`, then
  open `http://localhost:8123/`. Google sign-in works only from origins the
  OAuth client allows: use port **8126** (`python3 -m http.server 8126`) to test
  sign-in locally. Other ports browse fine but cannot sign in.
- Build: none. Pushing a branch is the deploy.
- Hard-refresh (Cmd+Shift+R) after changing `.jsx` files: Babel fetches them
  and browsers can serve a cached copy on a plain refresh.
- QA checks (`qa/`, details in qa/README.md): once per machine
  `bash qa/setup.sh` (needs Node 18+). Checks run side by side (4 at a time)
  with the app's scripts pre-compiled and wait for the app's ready signal, so
  a full run takes minutes (user decisions, 2026-10-29 and 2026-10-30):
  - **Per ticket, before handing it over for review:** `bash qa/quick.sh
    <the ticket's own check>`. It also runs every check that `qa/checks.json`
    lists for the files changed in the working tree. A new check goes into
    `checks.json` ("regress" and the files it covers) in the same change.
  - **Once per batch, before pushing it to staging:** `bash qa/regress.sh`
    (41 check scripts in 42 runs plus the accessibility scan in English and
    Portuguese, about 5–6 minutes; it exits non-zero and marks failures with
    `!!`), on the final tree with nothing edited while it runs. Read the
    output, not just the exit code.
  - **After each push to staging, and after each merge to `main`:**
    `SITE_URL=<the deployed address> node qa/smoke.js` (about a minute)
    against the deployed site, once Vercel reports the deploy.
  Update checks in the same commit when you rename or restructure UI they
  rely on.
- The QA checks are headless Chromium. Still look at the change in a real
  browser (desktop and a phone-sized viewport, English and Portuguese), and
  record what you actually verified, including what was not checked (for
  example real iPhone Safari).

## Branches, deploys and approvals

- `version/4.0` is **V4 staging**, checked out in the `MCU-V4` worktree. Every
  push deploys the Vercel preview
  `https://mcu-connections-git-version-40-afr-bfcd.vercel.app/` (first
  deployed 2026-10-31).
- `version/3.0` is **V3 staging** (worktree `MCU-V3`, preview
  `https://mcu-connections-git-version-30-afr-bfcd.vercel.app/`). V3 fixes, if
  any, are made there under that branch's own AGENTS.md and then merged
  forward into `version/4.0` with the user's approval.
- `main` is **production** and still serves V3:
  `https://mcu-connections.vercel.app/`. V4 reaches `main` only as a planned,
  explicitly approved release.
- All three deploy automatically through Vercel's Git integration; there is no
  Vercel CLI step. Check a deploy with the commit status on GitHub.
- Keep iterations local and uncommitted until the user approves committing and
  pushing **that** revision, either in chat or by setting the ticket's Status to
  **Approved** in Notion. Prior approval does not carry over to a new revision.
  Do not push layout experiments for review.
- **Never merge to `main` without the user's explicit approval for that merge.**
  Merge with `git merge --no-ff version/3.0` from an up-to-date `main`, push
  `main`, then fast-forward `version/3.0` to the merge commit so both match.
- Work usually ships in batches: implement and verify a few tickets, push the
  batch to staging for the user to try (often on a phone), then merge when they
  approve.
- Do not run `git reset --hard`, `git checkout -- .`, `git clean`, `git stash`,
  rebases, force pushes or `git worktree prune` without explicit approval.
  `MCU-V3` and `MCU-V4` are linked worktrees of the `MCU Connections`
  checkout; they can look missing or "prunable" from a sandboxed shell. They
  are not.

## Commits and CHANGELOG.md

- One commit per ticket where possible, so each ticket maps to its own commit.
- Author is the maintainer's verified GitHub noreply identity
  (`Andre Ribeiro <19270235+AndreFelipeRibeiro@users.noreply.github.com>`).
  Add a blank line and a co-author trailer for the assisting tool and the model
  actually used, e.g. `Co-authored-by: Claude Opus 5.5 <noreply@anthropic.com>`
  or `Co-authored-by: Codex <codex@openai.com>`. Keep existing credits; never
  claim tools or checks that were not used.
- Every committed change gets a CHANGELOG.md entry at the top:
  `## V4 fix|improvement|feature|design|maintenance — <short title>` (older
  entries keep their `V3` prefix), then
  `Recorded: YYYY-MM-DD HH:MM EDT (-0400).` and its staging/production status,
  then bullets for the change, the verification actually performed, and the
  limits. Times are real: take them from git
  (`TZ=America/New_York git log -1 --date=format-local:'%Y-%m-%d %H:%M %Z' --format=%cd`),
  never estimated or written ahead. When a batch reaches `main`, update those
  entries' status line in a small follow-up commit before merging.
- Keep README.md current when behaviour, setup, release status or workflow
  changes.
- Before pushing, check staged content and commit metadata (no personal emails,
  home paths or secrets), and verify the pushed tree matches what you tested.

## Backlog workflow (Notion V4 Tasks)

The backlog is the Notion database **V4 Tasks**, under the **MCU - V4** page
(`https://app.notion.com/p/f8e1ebb392a6450d8ef883458e12bd76`; data source
`collection://629a6bf8-a98d-47b1-b64d-9bad9d29a2b8`). **V3 Tasks** (under
**MCU - V3**) is V3's history and holds any V3 maintenance tickets. Open V4,
V5 and unversioned tickets were copied from it on 2026-10-31; each copy links
its original in **V3 ticket**.

- **Priority = the order of the Backlog column in the "All tasks" board view**,
  top first. Take the top unclaimed ticket unless the user names others. Do not
  use the **Queue** table's order (Notion keeps a separate manual order per
  view). The user drags cards to set the order; agents cannot reorder cards
  and must not add priority numbers. A card titled `———` is the user's divider:
  tickets above it are the next ones to do.
- Fields: **Status** (Backlog, In progress, Awaiting review, Approved, Blocked,
  Deferred, Completed), **Assigned to** (Codex, Claude, Andre), **Type** (Bug,
  Improvement, Feature, Design, Workflow, Maintenance), **Version** (V4, V5),
  **Batch** (Batch 1…n), **Source**, **Figma** (frame links), **V3 ticket**
  (the original record, for tickets ported from V3), **Latest commit**,
  **Completed on** (date-time), **Completion order** (number, starting at 1).
- **Version** and **Batch** say where a ticket belongs in the shipping history.
  Set both when you claim a ticket: Version is V4 for V4 work, and Batch is the
  batch it is being worked in. They are what the calendar recap's title line is
  built from, so a ticket with no batch has no recap to belong to.
  - V4 batches start again at **Batch 1**. Add the next Batch option when a
    new batch starts. Tickets closed together in one approval share a batch.
  - V5 tickets and unversioned ideas ported from V3 stay **Deferred**. Leave a
    ticket without a Version unless it says which one it is for; guessing a
    version for an idea nobody has scheduled is worse than leaving it blank.
- Read the whole ticket page, **including any screenshots or images**: fetch
  the page with its file URLs and look at each image before deciding what the
  ticket means. If the **Figma** field holds links, read those frames with the
  Figma MCP as well (see "Figma" below). New requests from the user in chat
  become tickets first.
- Claim: set Assigned to = your agent and Status = In progress, then re-read the
  record to confirm no one else holds it. Work on one ticket at a time; claim
  the next only when the current one is handed off.
- Ready: Status = Awaiting review. The page body keeps the request, the
  changes, the verification actually done and the remaining limits.
- Pushed for review: record the commit in **Latest commit** and the page body;
  the ticket stays Awaiting review until the user approves it.
- **Approved** is the user's own flag, set by them and nobody else. It means
  they have approved *that ticket's current revision* and you may commit and
  push it to `version/4.0` without asking again. Never set it yourself, and
  never read it as approval for anything beyond that ticket.
  - It does **not** authorise a merge to `main`. That still needs the user's
    explicit approval for that merge (see "Branches, deploys and approvals").
  - It does not survive a new revision: if you change the work after it was
    approved, move it back to Awaiting review and ask again.
  - Approval given in chat counts the same; the flag exists so an approval
    outlives the conversation and is visible to the other agent.
  - At the start of a session, a ticket sitting in Approved is work the user
    has already cleared — commit and push it, then complete it.
- Complete (only after the user approves and the change is committed and
  pushed): Status = Completed, Latest commit = the final implementation commit,
  every related commit listed in the body. **Completed on** = the actual
  approval/merge time in America/New_York with `is_datetime = 1` (never the
  creation or edit time). Query the database for the highest **Completion
  order** and add one; tickets closed together take consecutive numbers in
  their shipping order. Leave older date-only records as they are.
- Notion-only tasks still need the user's review but no commit. Completing a
  ticket on staging is not approval to merge to `main`.

## Recap after each approval

When the user approves and closes a ticket or batch, reply with a recap they
paste into the Notion Calendar event. Write it as **ordinary chat text, with
real Markdown bold** — not inside a code fence. Plain text out of a fence
pastes unformatted into Notion Calendar, which is the whole problem the format
exists to avoid.

Title line, then one bullet per ticket:

> **MCU V4 – Backlog batch <n> (<a few keywords>)**
>
> - **Fixed:** search now matches with or without accents ("Capitao" finds "Capitão").
> - **Improved:** clicking empty canvas on desktop closes the selected title and its details.

- The title carries the version, the batch number and a short keyword phrase
  saying what the batch was about.
- **One bullet per ticket**, opening with a bold label — Fixed, Improved,
  Added — and then what changed, in the user's terms rather than the
  implementation's. Use only the labels that apply.
- No date, duration or commit-count line in the body: the calendar event
  itself holds the time.

Times quoted anywhere else are America/New_York and come from real events
(when work started on the batch, when it was pushed or merged).

The assistant can also create the event directly on the user's Google
**Personal** calendar (the one Notion Calendar fronts) with the Notion
calendar tools. Creating an event is an outward-facing action: offer, and
only create it when the user says yes.

## Design, accessibility and interaction standards

These are the V3 standards and still describe the app. The V4 design system
replaces the visual tokens and type below as it lands (Figma first, then
code); the accessibility, keyboard, focus, Escape, phone-history,
reduced-motion and Spatial performance rules carry over unchanged.

- Dark theme tokens (`styles.css :root`): `--bg #0a0c14`, `--bg-2 #11141f`,
  `--surface #161a26`, `--surface-2 #1c2030`, `--border #232838`,
  `--border-strong #2e344a`, `--text #e6e8f0`, `--text-dim #9ea4b8`,
  `--text-muted #8389a1`, `--accent #4a8de8`. Phase colours are
  `PHASE_COLORS` in `app.jsx`. Use the tokens; do not add near-duplicate greys.
- Type: Inter for UI, JetBrains Mono for labels, numbers and badges, Bebas Neue
  for display. Brand mark: the conic-gradient square (`.brand-mark`).
- Contrast: informative text meets WCAG AA (4.5:1 for normal text) against its
  real background; check with axe-core and a contrast calculation. Making text
  bigger is not a contrast fix. RT tag `#cc2a0a`, IMDb tag `#f5c518`.
- Structure: one `<h1>` (the app name), toolbar and app bar are the banner, the
  canvas/List/phone main area is `main`; columns and icon-only controls have
  accessible names (visually hidden text uses `.story-sr`).
- Focus and keyboard:
  - Focus rings use `:focus-visible`.
  - Scripts move focus only after keyboard input (the `lastInput` tracker in
    `app.jsx`), so mouse and touch users never see a ring they didn't cause.
  - Escape closes the nearest layer first: search suggestions, then menus and
    popovers, then dialogs and phone sheets, then the pair view, then the
    desktop List's bulk selection, then the details, then the pinned character
    or performer. Never close two layers
    with one press. The details and the pin share one listener for that reason:
    two listeners both see the same press, and React re-renders between them,
    so the second acts on state the first just cleared.
  - The desktop details drawer is modeless (no focus trap). Phone sheets and
    dialogs trap focus and restore it to their opener.
  - Every Spatial card is reachable with Tab (an invisible first button) and
    opens with Enter or Space.
- Phones: each sheet owns one history entry, so the browser Back button closes
  it. Respect `prefers-reduced-motion`.
- Motion: layout moves use `600ms cubic-bezier(.2,.8,.2,1)`.
- Spatial canvas performance: no per-card GPU layers (no `will-change` or 3D
  transforms on cards) and no `backdrop-filter` inside the canvas. The canvas is
  composited only at 30% zoom and above (`LAYER_MIN_SCALE`). These rules keep
  iOS Safari from running out of memory when zoomed out.
- Images: posters and portraits go through `PosterArt` / `Portrait`, which fall
  back to generated art or initials and remember failed addresses per session.
- Search uses one normalisation, `MCU_I18N.fold()` (case and accents), for
  filtering, suggestions and highlights.

## Figma (V4)

V4's new look is designed in Figma and brought into code through the Figma MCP
server (remote, `https://mcp.figma.com/mcp`). `.mcp.json` in the repository
root registers it for Claude Code in this folder; each person authenticates
once (`/mcp`, then figma, then Authenticate). Codex adds it with
`codex mcp add figma --url https://mcp.figma.com/mcp`.

- Figma is the source of truth for the V4 design: variables (colour, type,
  spacing, radius, motion) and components. Code mirrors the variables as
  design tokens in one place, with the same names; components use tokens,
  never raw values copied from a frame.
- Work from links, not descriptions: a design ticket's **Figma** field links
  the frame(s). Read the frame with the MCP (design context, variables, a
  screenshot) before coding, and compare the result against the frame in a
  real browser at desktop and phone sizes, in English and Portuguese.
- When a frame and the rules here disagree (accessibility, keyboard, contrast,
  localisation), the rules win: flag the difference on the ticket instead of
  silently copying the frame.
- Do not write to the user's Figma files (create or change frames, variables
  or components) unless the ticket or the user asks for it.
- Never put Figma access tokens or other credentials in the repository,
  Notion or chat; the MCP signs in through the browser.

## Language

User-facing text is translated: never hard-code UI strings in components. Add a
key to `locales/en.js` (the complete base), translate it in every other
`locales/*.js`, and read it with `tr()` (app.jsx), `mtr()` (mobile.jsx) or
`window.MCU_I18N.tr()`. Show titles and character names through
`MCU_I18N.titleName()` / `charName()`; search keeps matching every language's
names. New catalog titles need an official local title and a short,
spoiler-light synopsis per locale; write synopses rather than copying studio or
TMDB text. Preserve permanent title ids and the spatial-filter invariants
described in V3-SPEC.md §7.1 (collection status dims cards, it never removes
them from the Spatial layout).

## Deferred work and constraints

- **Phase 6, email/password accounts:** Deferred. It waits on a custom domain
  (for reliable transactional email) and on its own plan and explicit
  approval. Do not add forms, recovery handlers or SMTP settings before then.
- The build step, the new look and feel and Dark/Light mode are V4 Backlog
  tickets (Notion V4 Tasks). V5 tickets and unversioned ideas stay Deferred
  there until the user moves them.
- Other open decisions are listed in docs/HANDOFF.md.
- Supabase free tier: accept pauses; no keep-alive automation.

## Secrets and privacy

- Never write secrets into the repository, commit messages, the CHANGELOG,
  Notion or chat: no service-role or secret keys, OAuth client secrets,
  database credentials, SMTP credentials, session tokens or personal emails.
  The Supabase project URL and publishable key in `config.js` are intentionally
  public.
- Do not record machine-specific home paths or real user data in tracked files;
  account values come from the active session at runtime.
- Do not echo suspected secrets in tool output or reports. Removing a value from
  current files does not remove it from history: explain any exposure and get
  explicit approval before any history rewrite or force push.

## Working with another agent

Claude and Codex take turns in the same `version/4.0` worktree (`MCU-V4`).
Uncommitted changes are the hand-off point; the Notion claim says who holds
which ticket. When asked to review the other agent's work, read only
(`git diff`) and report. Edit only if the user asks.
