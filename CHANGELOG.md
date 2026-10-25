# Changelog

A backfilled record of the project through the current V3 maintenance branch.
Times below are **Git author timestamps**, converted to America/New_York (EDT
for these dates), including seconds. They identify commits, not the time a change
was deployed or a manual check was performed. This record was assembled from
commit messages, diffs, the planning/verification documents and user-reported
checks on 2026-10-24; it does not invent deployment times.

Each commit link opens its full message and exact diff. Early commits sometimes
landed related files separately; each is listed rather than implying those were
separate product releases. The merge checkpoint is included explicitly.

## V3 maintenance — Mobile opens in List view

Recorded: 2026-10-24 21:20:39 EDT (-0400).

- Mobile (and touch layouts under 900px) now start in List instead of Grid.
  Grid and Spatial remain one tap away. The choice is not yet remembered between
  visits. Desktop is spatial-only and unaffected.
- Verification: headless Chromium at 390×844, 320×640 and 899×1100 opened with
  List selected and all 64 rows; List→Grid→Spatial→List switching worked;
  1440×900 still rendered the desktop spatial canvas. No console errors. The
  user approved the change.
- Limits: browser emulation only; no physical-phone check by Claude.

## V3 maintenance — Animated grid/list reordering

Recorded: 2026-10-24 19:49:39 EDT (-0400).

- Mobile Grid and List now animate when the sort mode or order changes, instead
  of swapping content instantly. Titles still on screen glide to their new slot;
  titles arriving from off-screen slide in from the direction they came from;
  titles leaving the viewport slide toward their new position and fade, using
  temporary copies in a clipped, inert, aria-hidden layer that is removed when
  done. Travel is capped to part of the viewport.
- Uses the Web Animations API with the spatial view's easing (520ms). Titles are
  tracked by id, since the list rebuilds its phase/year groups on reorder. A new
  sort mid-animation continues from the cards' current positions. Search,
  filters and status toggles do not animate. Skipped for prefers-reduced-motion.
- Verification: headless Chromium with touch emulation at 390×844 and 320×640,
  using npm copies of the pinned React/Babel/Supabase builds because the CDN was
  unreachable from the test environment. Checked Release→IMDb, order reversal,
  sorting while scrolled, a rapid IMDb→RT interrupt, and List Phase→A–Z and
  reversal; inspected mid-animation frames. No console errors, no animations or
  copies left behind, no horizontal overflow; reduced motion runs none. The
  user reviewed the result locally and approved it.
- Limits: the automated run blocked poster images; a physical-phone check was
  not performed by Claude. Desktop Spatial behavior is unchanged.

## V3 maintenance — Shared Codex/Claude workflow

Recorded: 2026-10-24 19:35:53 EDT (-0400).

- Codex and Claude now both work directly in the `version/3.0` worktree, one at
  a time. AGENTS.md gains a shared-working-tree section: check `git status`
  first and ask before touching another agent's uncommitted work; fast-forward
  only; claim Notion tasks as "In progress — Codex/Claude"; no destructive git
  commands or worktree pruning without approval; read-only cross-reviews; local
  preview on port 8123 (8126 also allowed for Google sign-in).
- Add a Claude co-author trailer rule naming the model actually used, matching
  the earlier Claude credits in history. Codex attribution is unchanged.
- Add CLAUDE.md, which only imports AGENTS.md so both agents share one rule set.
  README credits and project-structure table updated accordingly.
- Claude's push access to this repository was set up through the Claude GitHub
  App; pushes remain limited to `version/3.0` and still require user approval.
- Verification: documentation-only change; reviewed the diff and confirmed no
  application files changed. A dry-run push to `version/3.0` succeeded before
  this commit.
- Limits: no app behavior changed, so no browser checks were run. A main merge
  remains separately gated.

## V3 maintenance — Approved responsive navigation and mobile order placement

Recorded: 2026-10-24 17:20:14 EDT (-0400).

- Finalize the user-approved desktop layout: one row from 1920px, sorting above
  a full-width utilities row below that. Keep Order and Recenter labeled;
  show Sign in or the active session's name beside the desktop account icon.
  Long names truncate visually; profile values are never stored in the source.
- Move mobile Order beside search on header row two. Put Grid/List/Spatial and
  Filters together below it. Render search text at 13px using a scaled 16px
  input, retaining the existing iOS focus-zoom safeguard.
- Remove the visible Sort by caption while preserving an accessible navigation
  name. Increase bottom sort-tab height from 56px to 68px plus safe-area padding.
- Record the review-first Git workflow: keep future iterations local until the
  user approves committing/pushing. This change and V3 task completion were
  explicitly approved; a main merge remains separately gated.
- Verification: desktop fit and menus checked at 900–2560px during this review;
  the final row transition passed at 1919/1920px. Mobile fit passed at 320, 375,
  390, 430, 768 and 899px, with Order beside search, no horizontal overflow,
  13px rendered search text, no caption and 68px tabs. Selected both directions
  for all six mobile modes, searched/cleared VisionQuest, opened/closed Filters,
  switched Grid/List/Spatial and checked Escape focus return. No console errors.
- Limits: phone checks used Chrome viewport emulation, not a fresh physical iOS
  run; native keyboard/autozoom and live Google sign-in/cloud sync were not
  re-tested. Earlier entries below describe superseded layouts and review states.

## V3 maintenance — Desktop navigation spacing (awaiting review)

Recorded: 2026-10-24 16:45:26 EDT (-0400).

- Use two desktop rows at every desktop width: brand, search, Recenter and
  account in the first; sort mode/order, title type and Filters in the second.
  Give search the remaining first-row width with a 280px minimum container.
- Keep Recenter's text label visible and replace its ambiguous glyph with a
  crosshair. Preserve a DOM/tab order matching the visible row order.
- Replace the order selector's baseline-dependent text caret with a centered
  inline SVG chevron, shared by desktop and mobile. No new dependencies.
- Verification: both navigation rows fit without overflow at 900, 1000, 1100,
  1101, 1200, 1440, 1560 and 1920px; the search input had over 460px at 900px.
  Checked a one-title search and clearing it, Zoom in → Recenter restoring the
  previous canvas transform, order selection and matching Filters choices.
  Checked the mobile order popup at 390×844 and measured its chevron at the
  button's vertical center. The browser console contained no errors.
- Limits: mobile was browser-emulated; auth/cloud behavior was not re-tested.
  The V3 preview remains awaiting user review; main is not part of this change.

## V3 maintenance — Separate order menu (awaiting review)

Recorded: 2026-10-24 16:33:29 EDT (-0400).

- Replace the reversal arrows with the user-selected separate order menu:
  beside desktop sorting and above the mobile sort navigation. Compact labels
  show the current direction; the popover offers both full contextual labels.
- Keep mode selection in the main navigation. Move mobile A–Z out of Filters
  into the six-tab navigation; Filters contains only the current mode's two
  order choices, alongside its existing collection/phase/type/budget controls.
- Add full order choices to desktop Filters. Preserve existing sorting/layout
  functions, defaults, collection filtering and permanent title ids.
- Support pointer dismissal, Escape, focus return after selection and keyboard
  activation. Widen the desktop search-wrap breakpoint to accommodate the label.
- Verification: selected both directions for all six modes on desktop and mobile
  (24 menu selections); checked Filters wording/selection, mobile Grid/List Z–A,
  order-menu access in Spatial, keyboard Space/Escape/focus return, outside-click
  dismissal, no nested buttons and no browser console errors. Toolbar fit passed
  at 900/1000/1200/1440px; mobile navigation fit at 320px with 53px-wide tabs.
- Limits: phone layouts were browser-emulated, including 390×844; a new physical
  phone check and final user approval remain pending. No new auth/cloud checks
  were run. This change does not authorize merging into main.

## V3 maintenance — Reverse sort order (initial implementation)

Recorded: 2026-10-24 15:55:24 EDT (-0400).

- Add a desktop reverse-order arrow and mobile Order button; expose A–Z/Z–A
  alongside the other explicit direction choices in mobile Filters.
- Make release, chronology, phase, title, IMDb and RT ordering consistent across
  Grid, List and Spatial. Reverse phase groups and their within-phase release
  order; keep unrated titles last for either rating direction.
- Keep the leading timeline title visible when its phase band starts below the
  initial viewport. Reselecting the active mode preserves its current direction;
  changing modes retains the existing natural default for that new mode.
- Preserve collection dimming without reflow/recentering on status changes.
- Record the agreed Notion priority, approval and completion-date workflow.
- Verification: all 12 sort/direction combinations checked against the actual
  sort/layout functions; all 48 rendered combinations checked across desktop
  Spatial and mobile Grid/List/Spatial. Checked 900/1000/1200/1440px toolbar fit,
  mobile alphabetical direction chips, keyboard reversal, active-mode reselect,
  no nested buttons and the Unseen status-click viewport invariant. Local guest
  test marks were removed; the final browser console had no errors.
- Limits: mobile checks used a 390×844 browser viewport, not a physical phone.
  No fresh Google sign-in or cloud-sync regression was run; auth/schema/config,
  catalog ids, runtime dependencies and script loading are unchanged. Main merge
  and task completion still await user approval.

## Current documentation and privacy update — not yet on main

Recorded: 2026-10-24 15:11:55 EDT (-0400).

- Backfill this chronological commit overview and link it from the README.
- Credit Claude and ChatGPT/Codex, supporting tools, services and data sources.
- Add repository instructions to maintain this log and use Codex co-author credit.
- Correct README wording left over from before the initial V3 production merge.
- Review tracked files and reachable Git history for credentials and personal data;
  remove machine-specific home paths from current plans, expand ignore rules and
  configure the local repository to use the owner's GitHub noreply email for
  future commits. Old commit metadata is unchanged.
- Record findings and limits in [the privacy review](docs/PRIVACY-REVIEW.md).

## V3 maintenance — awaiting a separate merge approval

Catalog updates and this documentation update continue on `version/3.0`.
The weekly checker runs Mondays at 9am Eastern and prepares sourced patches for
review; it does not apply or publish them. It was configured outside Git, so it
has no standalone commit or inferred commit/deployment time.

| Date/time (EDT, UTC−04:00) | Commit | Overview |
|---|---|---|
| 2026-10-24 11:37:19 | [`902377c`](https://github.com/AndreFelipeRibeiro/MCU-Connections/commit/902377c03f422e702964687684b97e6e1265052c) | Refresh released-title IMDb/RT ratings and Phase 6 release/cast metadata; preserve title ids, clarify rating scopes and handle month-only release windows. |
| 2026-10-24 11:57:53 | [`807cbf3`](https://github.com/AndreFelipeRibeiro/MCU-Connections/commit/807cbf3d04f3db85df49855afe0ffcd4df03aafc) | Classify catalog work as V3 maintenance, consolidate its plan into V3 tasks and retire the temporary major-version branch. |

## History included in the initial V3 release

The user approved the V3 merge after the Phase 5 checkpoint (`1f79b74`).
Its commit time below is not a claim about the exact merge/deployment time.

| Date/time (EDT, UTC−04:00) | Commit | Overview |
|---|---|---|
| 2026-08-08 00:13:47 | [`663ad24`](https://github.com/AndreFelipeRibeiro/MCU-Connections/commit/663ad24e2911aa9b908fb256eee56d663467fd59) | Create the repository and initial README. |
| 2026-08-08 00:43:22 | [`3f88b18`](https://github.com/AndreFelipeRibeiro/MCU-Connections/commit/3f88b1816c849cfb751fb894fdfe2e5cf55a60a5) | Add the browser app shell, views and desktop/mobile styles. |
| 2026-08-08 00:44:08 | [`556a16e`](https://github.com/AndreFelipeRibeiro/MCU-Connections/commit/556a16e2ebe1cee58fa9805fc019643c2ed513a4) | Add poster rendering and a standalone connection layer. |
| 2026-08-08 00:44:34 | [`4d87f66`](https://github.com/AndreFelipeRibeiro/MCU-Connections/commit/4d87f661f115c90cedc3bc70ca4ff64d3e418aa6) | Add the standalone connection-layer source. |
| 2026-08-08 00:45:31 | [`bf57573`](https://github.com/AndreFelipeRibeiro/MCU-Connections/commit/bf575733d8a27124390b310a0b9f31aba724c3e7) | Add touch navigation with Grid, List and Spatial views. |
| 2026-08-08 00:46:38 | [`870a832`](https://github.com/AndreFelipeRibeiro/MCU-Connections/commit/870a832d9587322dead80214092b32a7f1640d1d) | Add desktop and mobile layout and visual styles. |
| 2026-08-08 07:28:51 | [`4a45847`](https://github.com/AndreFelipeRibeiro/MCU-Connections/commit/4a45847201d8d81bc03c7c168ff133b927a943b3) | Add mobile styling and the TMDB media mapping. |
| 2026-08-08 07:31:37 | [`572af14`](https://github.com/AndreFelipeRibeiro/MCU-Connections/commit/572af14397fb15e98d27675a17bef00a4546ba35) | Add TMDB poster and actor-portrait paths. |
| 2026-08-08 07:34:16 | [`ba5abc1`](https://github.com/AndreFelipeRibeiro/MCU-Connections/commit/ba5abc1bef17532fb3846280588163bf02f78eb2) | Add the 64-title MCU catalog, character variants and cast connections. |
| 2026-08-08 07:37:49 | [`c7bde87`](https://github.com/AndreFelipeRibeiro/MCU-Connections/commit/c7bde87db229e29f0b6d2b2b3619c4c0c18fbd5e) | Add canvas pan/zoom, connection threading, toolbar, search/filter controls and cast drawer. |
| 2026-08-08 07:43:08 | [`1d706bb`](https://github.com/AndreFelipeRibeiro/MCU-Connections/commit/1d706bb3c1669b118e4c491be7ad90d1d65c5f13) | Restore missing connection-grouping comments. |
| 2026-08-08 07:50:55 | [`baac6ae`](https://github.com/AndreFelipeRibeiro/MCU-Connections/commit/baac6ae36657a921d5fea92c29117e1cd4a02501) | Document features, data model, local startup and known limitations. |
| 2026-08-08 08:00:06 | [`5e9c236`](https://github.com/AndreFelipeRibeiro/MCU-Connections/commit/5e9c236e77c9423b9b077ff2d1614efd0286c2b9) | Use index.html as the static Vercel entry point. |
| 2026-08-08 10:44:10 | [`713c67e`](https://github.com/AndreFelipeRibeiro/MCU-Connections/commit/713c67ed160942584fb573fa6b56b60e83a95c27) | Search character/actor names, highlight matching cast and show full actor names. |
| 2026-08-08 10:47:23 | [`044fc4e`](https://github.com/AndreFelipeRibeiro/MCU-Connections/commit/044fc4e439335b8d1c7c259c55050c3541edd5ed) | Merge pull request #1 containing the character/actor search improvements; integration checkpoint, not another implementation. |
| 2026-08-08 11:37:34 | [`f567dbf`](https://github.com/AndreFelipeRibeiro/MCU-Connections/commit/f567dbfd7480009e04afa89e78e51297ded38ebf) | Prevent mobile search/input focus from zooming the page. |
| 2026-08-08 12:23:56 | [`47b947d`](https://github.com/AndreFelipeRibeiro/MCU-Connections/commit/47b947dddfb0b736e920a73ad8f839f08514648f) | Add the V3 planning/setup checkpoint. |
| 2026-08-08 17:38:36 | [`1bf565a`](https://github.com/AndreFelipeRibeiro/MCU-Connections/commit/1bf565aee62daccea21de973097ae5d729a73a47) | Implement local guest seen/watchlist tracking, status controls and collection filters; add the proposed database schema. |
| 2026-08-08 18:01:25 | [`4130f8c`](https://github.com/AndreFelipeRibeiro/MCU-Connections/commit/4130f8c071c475a9efb5993d1d365f069034dac0) | Add the Supabase browser client, Google OAuth state and desktop/mobile account surfaces. |
| 2026-08-09 13:06:55 | [`cd43999`](https://github.com/AndreFelipeRibeiro/MCU-Connections/commit/cd439997b6439bbc57e09ba0a6018690bca5be80) | Fix mobile list-row status-control placement and frame collection matches when recentering; keep status clicks from moving the viewport. |
| 2026-08-09 13:15:11 | [`b4609f8`](https://github.com/AndreFelipeRibeiro/MCU-Connections/commit/b4609f84d686f7372de5c9cdbe2860c4c420e89e) | Fit the full matching set when recentering, with a minimum zoom and selected-card protection. |
| 2026-10-24 00:30:45 | [`5f34d7d`](https://github.com/AndreFelipeRibeiro/MCU-Connections/commit/5f34d7d4121ecf61efa997bbde930078bc87f6bc) | Record Phase 1 manual verification and remaining checks. |
| 2026-10-24 10:08:37 | [`5d238d1`](https://github.com/AndreFelipeRibeiro/MCU-Connections/commit/5d238d1579ed77fa286d168b9c6c0d0c54df8b2b) | Complete the Google-auth setup checkpoint; document deferred, separately approved email/password accounts. |
| 2026-10-24 10:23:00 | [`b36910e`](https://github.com/AndreFelipeRibeiro/MCU-Connections/commit/b36910e494fef793406bb16ede82743dc6a22944) | Add cloud collection loading, guest merging, account-scoped per-title queues, rollback/retry and stale-response protection. |
| 2026-10-24 10:59:41 | [`a2364d7`](https://github.com/AndreFelipeRibeiro/MCU-Connections/commit/a2364d797e56088350bc0a8d8b66f568aff84301) | Harden offline recovery, bounded requests and OAuth cancellation; improve modal focus, keyboard handling and mobile accessibility. |
| 2026-10-24 11:03:31 | [`503963a`](https://github.com/AndreFelipeRibeiro/MCU-Connections/commit/503963afe465e9c90c9f9d873594522f2a4acde2) | Record the user’s successful post-hardening phone sheet, tap and scroll checks. |
| 2026-10-24 11:12:28 | [`1f79b74`](https://github.com/AndreFelipeRibeiro/MCU-Connections/commit/1f79b7430efc8d0553c77a824f19407ec743b2b1) | Complete Phase 5 setup/release documentation and verification evidence. This is the V3 commit subsequently approved and merged to main. |

## Verification and source notes

- [V3 manual verification](docs/V3-VERIFICATION.md): actual checks, user phone
  confirmations and untested areas; a successful commit alone is not verification.
- [Catalog audit](docs/CATALOG-AUDIT.md) and [source mapping](docs/CATALOG-SOURCES.json):
  score definitions, changed values, source URLs, dates and research limits.
- [V3 tasks](V3-TASKS.md): completion status and remaining approval gates.
- Email/password accounts remain deferred to Phase 6 and require explicit approval.
- Historical messages and timestamps are retained as recorded, including earlier
  naming decisions; the current workflow is V3 maintenance.

Future commits should add a dated overview, meaningful verification and any
material limitation here. Do not copy personal profile data, emails, tokens or
private local paths into this file.
