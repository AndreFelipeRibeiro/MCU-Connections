# MCU Connections — handoff

Written 2026-10-28 when development moved from a Claude chat session to Claude
Code. Codex continues to contribute; [AGENTS.md](../AGENTS.md) is the shared
rulebook and [decisions.md](decisions.md) the running decision log. This file is
the current handoff; the "Handoff — 2026-10-24" sections in `V3-SPEC.md`,
`V3-TASKS.md` and `KICKOFF-PROMPT.md` are historical.

## Where things stand

- Production (`main`) and staging (`version/3.0`) are at the same commit,
  `892b8c2` "Merge approved V3 batch 3 into main" (2026-10-27 23:30 EDT).
- On 2026-10-27 three backlog batches shipped (details in CHANGELOG.md):
  - **Batch 1:** phone crash when panning zoomed-out Spatial; Back closes phone
    sheets; poster and portrait fallbacks; production React builds.
  - **Batch 2:** accent-insensitive search; Spatial empty state; empty-canvas
    click closes a desktop selection; startup screen with failure recovery;
    larger selected title in the desktop ring.
  - **Batch 3:** WCAG AA contrast; page landmarks and List column labels; Escape
    and keyboard focus in desktop details; favicon, home-screen icon and link
    previews; Spatial cards reachable from the keyboard.
- The Notion V3 Tasks board matches: nothing In progress or Awaiting review.

## Architecture in short

A static single-page app with no build step. `index.html` loads `boot.js`
(startup screen), the locale files and `i18n.js`, then React 18, ReactDOM,
Babel standalone and supabase-js from unpkg (pinned, SRI). Then come the plain
data files and finally the `.jsx` files, which Babel compiles in the browser on
every visit. Modules talk through `window.*`.

- **Data:** `data.js` holds the catalog (64 titles, 84 characters, permanent ids,
  variant links, synopses per language); `media-data.js` holds TMDB poster and
  portrait paths.
- **Views:**
  - Desktop has Spatial (a pannable, zoomable canvas of cards with connection
    lines; selecting a title arranges related titles in rings) and List.
  - Phones have List, Grid and Spatial, with bottom sort tabs and sheets.
  - `app.jsx` owns state, layout and the desktop canvas; `mobile.jsx` owns the
    phone UI.
- **Tracking:** Seen and Watchlist are stored per device for guests, and in
  Supabase for Google-signed-in users (`tracking.jsx`, `supabase-client.js`,
  `schema.sql`). Preferences (view, sort, order, folded runs) are per device in
  localStorage.
- **Language:** English (base) and Brazilian Portuguese. Every UI string is a
  locale key, and search matches names in every language through
  `MCU_I18N.fold()`.
- **Deploy:** Vercel's Git integration publishes `version/3.0` as the preview
  and `main` as production.

## Key decisions (why things are the way they are)

The dated log is [decisions.md](decisions.md). The ones that shape day-to-day
work:

- **No build step.** The project stays a static site that anyone can run with a
  one-line Python server. We switched to React's production builds instead of
  adding a bundler. Precompiling JSX would cut startup time but is still an open
  decision.
- **Staging first, batches, explicit approval for main.** The user tries
  batches on the preview (often on a phone) before approving a merge.
- **One commit per ticket, real times in the CHANGELOG, recap after approval.**
  The user tracks the work in a calendar.
- **Spatial performance rules.** No per-card GPU layers or backdrop filters in
  the canvas, and the canvas is composited only at 30% zoom and above. Zoomed
  far out, the whole canvas is on screen, and iOS Safari reloaded the tab when
  it ran out of graphics memory.
- **Keyboard behaviour that never surprises mouse users.** Focus moves by script
  only after keyboard input; `:focus-visible` rings; Escape closes one layer at
  a time; the desktop drawer is modeless.

## Known quirks, gotchas and fragile areas

- **Startup cost.** Babel compiles about 10 JSX files in the browser on every
  visit: around a second on a laptop, much more on mid-range phones. The startup
  screen hides the blank page but not the wait.
- **Caching while developing.** After editing `.jsx`, hard-refresh
  (Cmd+Shift+R). A plain refresh can run a stale copy, and it looks like a fix
  didn't work.
- **Sign-in only works on allowed origins:** production, the preview,
  `localhost:8126` (and 8123 for browsing).
- **`app.jsx` is large (about 2,150 lines)**, and the Spatial camera is the most
  fragile part. That covers glides (`glideTo` / `stopGlide`), the
  return-to-previous-view memory on deselect, the ring layout, the pair view and
  drag versus click detection on cards. Change it carefully and test pan, zoom,
  select, close, sort while selected, and zoomed out.
  - After the pair view, closing a selection does not return the camera to its
    pre-selection position.
- **Escape handling order matters.** Menus close themselves on `keydown` and
  React re-renders between listeners, so the details' Escape handler listens in
  the capture phase and checks the page for open menus or dialogs before acting.
- **Spatial keyboard button.** Each card's first child is an invisible
  `.card-open` button with `pointer-events: none`. Clicks still go to the card;
  keyboard activation calls the same handler.
- **Phone sheet history** (`sheetHistory` in `mobile.jsx`). Each sheet owns one
  history entry; a sheet handing off to another (Account → About) reuses it.
  Opening two sheets at once would confuse it.
- **Image fallbacks** remember failed addresses until reload, so a brief
  offline moment keeps generated art for the session.
- **Link previews.** `og:image` and `og:url` point at production, so staging
  links show the production preview image.
- **Supabase free tier** pauses idle projects; restore from the dashboard (no
  keep-alive by policy).
- **Notion.** Agents cannot reorder board cards; only the user sets priority.
- **The local worktree can look missing.** `MCU-V3` is a linked worktree of the
  `MCU Connections` checkout, and sandboxed shells may list it as prunable. It
  is not; never prune it.
- **The headless camera regression check is flaky.** Its "wheel cancels the
  glide" step fails about 1 run in 4 on any version. The desktop wheel handler
  also logs "Unable to preventDefault inside passive event listener"; worth a
  small ticket.
- **Catalog upkeep.** Unreleased titles (Avengers: Doomsday, Friendly
  Neighborhood Spider-Man S2, Daredevil: Born Again S3, Avengers: Secret Wars)
  need ratings and story years when they come out. Several series have thin
  casts.

## QA scripts

During V3, verification used about 85 headless Playwright scripts (many of
them one-off checks), including a 14-script regression run (`regress.sh`). They cover layout fit, Spatial camera and animations,
List, search suggestions, languages, About and welcome, accessibility (axe-core)
and performance. They are **not in the repository** (no-npm rule); the user has
a zip of them from 2026-10-28. Committing them under a `qa/` folder, or keeping
them outside, is an open decision. Until then, verify in a real browser and
record what was checked.

## Open threads and what's next

- **Backlog** (Notion, in the user's board order). At handoff it held the
  following, not in priority order:
  - Align character-variant scope, counts and browsing (for example "Peter
    Parker (Raimi)" says 1 title but opens all 13).
  - Correct per-title actor and voice-performer credits; Cast (movie vs
    post-credit).
  - Change "Estréia" to "Lançamento" (Portuguese sort label).
  - Panning with easing.
  - Keep a selected search title connected to its neighbourhood.
  - Expose selected filter states and group labels.
  - Expose account-wide sync failure and Retry outside Account.
  - Recheck the delayed guest sign-in reminder after Undo.
  - Verify and fix Spatial touch input on wide screens.
  - Audit unknown catalog budgets; expand returning characters in sparse
    series.
  - Maintain shared regression checks and real-device evidence; reconcile the
    V3 planning documents with the app.
- **Decisions waiting on the user:**
  - Precompile JSX (a build step) or not.
  - Whether to commit the QA scripts.
  - Which preferences sync across devices.
  - How variant characters should behave.
  - A wider first Spatial view on desktop.
- **Deferred:**
  - Phase 6 email/password accounts (needs a custom domain, a plan and
    approval).
  - Light mode and the V4 look and feel.
  - Feature ideas in the Deferred column: shareable URLs, "what to watch next",
    watch guides and catch-up paths, Coming Soon, where to watch, character
    journeys, title comparison, spoiler-aware browsing, installable app and
    offline catalog, Spanish, collection backups, a first-visit walkthrough,
    community features.
- **Design pass.** The user is a designer and wants a Figma round trip: take the
  running app into Figma, refine the art direction and design system, then bring
  it back to code for V4. The tokens and standards in AGENTS.md are the current
  baseline to start from.
- **Real devices.** Most verification was headless Chromium. An iPhone (Safari)
  and Android pass before larger releases is still worthwhile.
- **Review and plan.** A 2026-10-27 review of usability, bugs, speed,
  accessibility and features (Claude Docs, "MCU Connections: Review and Plan")
  produced most of the current tickets.
