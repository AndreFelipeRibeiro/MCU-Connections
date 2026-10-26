# Changelog

A backfilled record of the project through the current V3 maintenance branch.
Backfilled commit entries use **Git author timestamps**, converted to
America/New_York (EDT for these dates), including seconds. Entries labeled
**Recorded** identify the time the checkpoint was written, not an inferred
deployment time. Deployment checks are identified explicitly. This record was assembled from
commit messages, diffs, the planning/verification documents and user-reported
checks on 2026-10-24; it does not invent deployment times.

Each commit link opens its full message and exact diff. Early commits sometimes
landed related files separately; each is listed rather than implying those were
separate product releases. The merge checkpoint is included explicitly.

## V3 fix and improvement — Menu layering and filter animations

Recorded: 2026-10-25 21:59:44 EDT (-0400).

- Layering: the desktop toolbar was a sticky layer at z-index 50, below the
  details drawer (60), so the language, order, filters and account menus and the
  search suggestions opened under the drawer. The toolbar now sits at 70 (the
  drawer starts below it). The Spatial zoom control, hidden under the open drawer,
  now moves left of it. On phones the app bar (30) sat under the floating count
  and character pills, covering search suggestions in Spatial; it is now 50
  (sheets stay above).
- Animations: the mobile Grid/List reorder animation now also runs for All /
  Unseen / Seen / Watchlist and the phase, films/series and budget filters, and
  between List and Grid (titles move from their old spot while the old layout
  fades). The desktop List uses the same animation for sort tabs, column headers,
  order, collection and filters; leaving rows fade in a layer inside the list so
  they keep its columns. On phones, filter-sheet changes play when the sheet
  closes. Returning from an empty result animates titles in. Off with reduced
  motion; search typing does not animate.
- Verification: headless Chromium. A layering audit (elementFromPoint over a 5x5
  grid) of every toolbar menu, suggestions, zoom, count, banner controls and
  drawer close at 1440 and 1100px in Spatial and List with details open and a
  character pinned, and on a 390px phone in List and Spatial with the pill: all
  clear after the change (menus under the drawer, hidden zoom and covered phone
  suggestions before). Animation script: animations start and clean up for each
  toggle, filter, sort, List/Grid switch and a scrolled desktop List (leaving
  copies keep 11 columns); none while the phone filter sheet is open, played on
  close, nothing when it closes unchanged. Fit sweeps, context summary, List,
  panel, search, suggestions, synopsis, alignment and language scripts pass.
  Recorded clips of the phone and desktop List animations were reviewed by the
  user, who approved committing and merging to main.
- Limits: below 1280px the drawer still overlays the desktop List by design;
  marking a title seen while a filter hides it removes it without animation.

## V3 feature — Synopses and character highlighting

Recorded: 2026-10-25 21:12:20 EDT (-0400).

- Synopses: a short, spoiler-light summary for each of the 64 titles in English
  and Brazilian Portuguese (`synopses` locale tables, `MCU_I18N.synopsis()`),
  written for this app rather than copied. Unreleased titles state only what has
  been announced; Daredevil: Born Again S3 and Secret Wars say the plot has not
  been announced. Shown under the title in the desktop drawer and above the cast
  in the phone sheet, clamped to three lines with See more / See less.
- Character highlighting: picking a character in the details pins them. Their
  titles are laid out in the current order (the connection rings stay with a
  selected title) and the stepper (‹ ›, or the arrow keys) starts on the title it
  was pinned from, gliding or scrolling to each and opening its details on
  desktop. The current card gets a ring in the character's colour and a slight
  lift; their other titles step back. Clicking a card while pinned makes it
  current without the rings; unpinning with details open returns to them.
- Desktop: banner with photo, actor and title count, Their titles / All titles
  switch, stepper and clear. Phones: picking a character closes the sheet and a
  floating pill above the sort bar shows the character, actor, stepper and clear;
  phones always show only that character's titles.
- Phone sheets gain a close (×) button and swipe-down to close (from the handle,
  or the content when scrolled to the top; short drags spring back).
- AGENTS.md: new catalog titles also need a written synopsis per locale.
- Verification: headless Chromium. Synopsis clamp/toggle and reset on title
  change (en, pt-BR, phone). Desktop: Iron Man → pin Tony Stark gives 12 cards,
  no selection, "1 of 12" on Iron Man; stepping through all 12 keeps the current
  card centred on its layout position (0 px offset; the first build's CSS
  `scale` lift drifted up to ~125 px, fixed before commit); card click and unpin
  behave as above. Phone 390px: × and swipe close (a 50 px drag springs back);
  pin closes the sheet, pill 48 px tall without overflow; stepping in List and
  Spatial (0 px offset). Toolbar fit sweeps (en, pt-BR), context summary, List,
  panel, search, suggestions and language scripts pass. The user reviewed the
  desktop and phone flows and approved committing and merging to main.
- Limits: swipe tested with synthetic touch events, not on a physical phone;
  posters and photos were not loadable in the test browser; the camera script's
  passive-listener warning also occurs on the previous code.

## V3 feature — Search suggestions

Recorded: 2026-10-25 14:41:47 EDT (-0400).

- New `search-suggest.jsx` (`window.SearchInput`), shared by the desktop toolbar
  and the mobile app bar. From two letters it lists matching actors (with their
  characters and title count), characters (actor, title count) and titles (type,
  year) under the search box, with the matched part in bold and photo/poster
  thumbnails. Matching folds accents and covers names in every language. Names
  or words starting with the query rank first; people by title count, titles by
  release. Up to eight rows.
- Picking an actor or character searches for that name; picking a title also
  opens its details (desktop drawer, with the card selected in Spatial; mobile
  sheet). Combobox keyboard pattern (arrows, Enter, Escape); free-text search is
  unchanged. On phones the list spans the search row.
- Verification: headless Chromium. Desktop: no list for one letter; "tom" lists
  Tom Holland, Tom Hiddleston, Tommy Shepherd; arrows + Enter, click, title pick
  (drawer + Spatial selection), Escape, reopen on typing, close on blur, ARIA
  combobox attributes. pt-BR: "iron" and "vinga" results. Mobile 390px: full-row
  list, actor pick filters to 13 rows, title pick opens the sheet. Toolbar fit,
  desktop List, search highlighting, context summary, camera and language
  scripts pass. The user reviewed and approved committing and merging to main.
- Limits: on phones the open list covers the collection row until the box loses
  focus; thumbnails were not loadable in the test browser.

## V3 feature — Desktop List view

Recorded: 2026-10-25 14:22:35 EDT (-0400).

- Desktop gets a List view beside Spatial (switch at the end of the sort row,
  remembered as `desktopView` in `mcu.prefs.v1`, Spatial by default). New
  `desktop-list.jsx`: one row per title with poster, title, type, phase,
  release, in-story years, budget, IMDb, RT, character faces and status
  buttons; group headers follow the sort and rating sorts are ranked. Title,
  Phase, Released, Set in, IMDb and RT headers sort the list (click again to
  reverse) and stay in step with the sort row and Order menu. Columns drop by
  the List's own width (container queries). No desktop Grid: it would echo
  Spatial.
- A row opens the cast drawer, which now slides in and out and opens below the
  toolbar so the view switch, language and account stay usable. From 1280px the
  List makes room for it. Switching to Spatial with a title open selects that
  card; re-entering Spatial frames the camera like a fresh load.
- Search: a match badge under each List title shows the matched character at
  every width; character-name matches now come before actor-name ones (also on
  Spatial cards and mobile); the drawer and mobile details sheet underline
  matched names in the character's colour.
- Verification: headless Chromium, en-US and pt-BR. List: default Spatial,
  switch and reload persistence, mobile/desktop view independence, invalid
  value fallback, header sorting and reversal synced with the sort row, row
  open/highlight, status toggle without opening, character dimming, Spatial
  hand-off selection, filters/search/empty state, Spatial re-entry framing.
  No row overflow or clipped headers at 900–1920px with and without the drawer.
  Drawer slide traced frame by frame. Toolbar fit sweep, context summary,
  camera and language scripts pass (the camera script's wheel-cancels-glide
  step is timing-flaky on old and new code alike). The user reviewed and
  approved committing and merging to main.
- Limits: posters and actor photos were not loadable in the test browser;
  below 1280px the open drawer overlays the List's right-hand columns; no
  physical tablet check.

## V3 workflow — Completion time and order rules

Recorded: 2026-10-25 12:35:17 EDT (-0400).

- AGENTS.md (Backlog workflow) now matches the MCU - V3 Notion page: priority is
  the drag order of the Backlog column in the All tasks board (no priority
  numbers); closing a task records the actual America/New_York date and time and
  the next Completion order (highest existing value plus one, queried first),
  never creation or last-edited time; All tasks and Completed sort by Completed
  on, then Completion order, both descending. The Notion page's stale "Queue
  sorted by Order" instruction was replaced to match.
- Documentation only; no application change. Verified by re-reading both
  documents and querying the All tasks view (latest completion listed first).

## V3 maintenance — Floating desktop context summary

Recorded: 2026-10-25 12:15:11 EDT (-0400).

- The desktop context summary no longer takes a strip under the toolbar. It
  floats at the top-left of Spatial like the mobile pill: a count pill ("64
  titles" / "8 of 64"), one removable chip per active filter and Clear all when
  two or more are on. The desktop header returns to its previous height.
- Removed text the controls already show (sort and order) and the seen count on
  every screen size (seen without watchlist was arbitrary). Phones now read
  "24 of 64 · 2 filters · Clear".
- Removed the Recenter button again and its strings, plus the unused
  `header.seen`.
- Verification: headless Chromium, en-US and pt-BR. Fit sweep at 20 desktop and 4
  phone widths with All and Watchlist active: no overflow, overlaps, clipping,
  horizontal scroll or console errors; header 121px from 1280px, 177px below.
  Desktop: count matches the undimmed cards, chips match the filters, removing
  one resets its control, Clear all appears only with two or more chips and
  resets everything, the floating group covers no card at the default framing.
  Mobile: count matches rows, Clear works from the line, empty state and Spatial
  pill. Camera regression and language scripts pass. The user reviewed
  screenshots and approved committing and merging to main.
- Limits: many filters can wrap the chips to a second row over the top of the
  canvas; no physical-device check.

## V3 maintenance — Context summary on every screen size

Recorded: 2026-10-25 11:47:47 EDT (-0400).

- New context summary for what the view is showing. Desktop: a bar under the
  toolbar with the matching count, sort and seen count, one removable chip per
  active filter (search, collection, type, phase, budget), Clear all and a
  Recenter button (restored). Phones: one line at the top of List and Grid
  (count · seen · N filters, Clear) that scrolls with the list, and a pill at the
  top-left of Spatial clear of the zoom control; the line also shows above the
  empty state.
- The logo subtitles are gone on desktop and mobile, which also resolves the
  320px mobile subtitle overflow. The count is now the titles matching every
  filter, including the collection filter, on every surface (Spatial previously
  also counted cards the collection filter only dims). Below 360px the language
  globe hides so the app name fits.
- Locales: added `context.*`, restored `canvas.recenter*`; removed the unused
  `header.countOfTitles` and `sort.by.*` keys.
- Verification: headless Chromium, en-US and pt-BR. Fit sweep at 20 desktop and 4
  phone widths with All and Watchlist active: no overflow, overlaps, clipping,
  horizontal scroll or console errors. Desktop: chips match the filters, removing
  one resets its control, Clear all resets everything, Recenter restores the
  start camera after a pan, count equals the undimmed cards. Mobile: count equals
  list rows, Clear resets search and collection, empty state keeps the line, the
  Spatial pill does not overlap the zoom control and its Clear does not select a
  card. Camera regression and language scripts pass (the camera script now
  measures the card actually selected in its A→B step). The user reviewed
  screenshots and approved committing, pushing and merging to main.
- Limits: the desktop bar adds about 40px; the compact collection switch at 320px
  in Portuguese remains tight (pre-existing); no physical-device check.

## V3 maintenance — Even Spatial card layout; backlog priority rule

Recorded: 2026-10-25 09:44:26 EDT (-0400).

- Spatial cards sit on an even grid. Each card used to get a pseudo-random
  offset (±18–30px) for an "organic" look, which broke row alignment and made
  gaps uneven: Release/Chrono neighbours ranged from 8px overlapping to 57px
  apart, grid sorts from 15 to 110px. Gaps are now constant (25px in
  Release/Chrono, 60px in Phase/A–Z/IMDb/RT) and rows share a top edge.
- Card footers reserve room for a two-line title plus the year and story rows
  (92px), so every poster is the same height (176px) and the status buttons and
  rating badges line up; a one-line title previously left a taller poster
  (177–209px). Cards showing a search match badge shrink their posters equally.
- AGENTS.md: backlog priority is the order of the Backlog column in the Notion
  All tasks board (Notion keeps a separate manual order per view, so the Queue
  table's order is not the priority).
- Verification: headless Chromium at 1440px in all six sorts: no overlapping
  cards; neighbour gaps 25–26px (Release/Chrono) and 60px (grid sorts). Footer
  92px and poster 176px on all 64 cards in en-US, pt-BR and mobile Spatial; no
  card overflow while searching. Camera regression script (desktop
  select/close/glide/wheel/sort, mobile enter/select/restore/re-enter) unchanged;
  its mobile half was updated for the view menu. The user reviewed screenshots
  and approved committing and pushing to `version/3.0`.
- Limits: posters were blocked in the test browser, so poster cropping at the
  new height was not checked there; the canvas looks less scattered by design.

## V3 maintenance — Desktop navigation grouped like mobile

Recorded: 2026-10-25 00:57:40 EDT (-0400).

- The desktop toolbar now follows the mobile header's grouping. Top row: brand,
  then search, Order, Filters and All / Films / Series, then the language menu
  and account at the right. Second row: the six sort modes (sharing the width)
  and Unseen / Seen / Watchlist. Below 1280px the search group wraps onto its
  own full-width row between them (three rows).
- Step-downs sized for Portuguese: short sort labels at 1300px and below; at
  1150px and below the collection switch labels only All and the active option
  and "Order:" is hidden; below 1000px the switch is icon-only apart from All and
  Filters loses its text. The former single-row layout at 1920px+ is replaced.
- Removed the Recenter button (and its unused `canvas.recenter*` strings).
  Spatial still frames itself when the layout, filters or selection change and
  when details close.
- Verification: headless Chromium, pt-BR and en-US, with All and Watchlist
  active: no offscreen controls, row overflow, overlaps, clipped buttons,
  horizontal scroll or console errors at 20 desktop widths (900–2560, including
  1279/1280/1300/1301) and 4 phone widths (320–430). The 1280px breakpoint was
  measured with a long 176px account name in Portuguese (search ≈ 274px).
  Filters, Order and language popovers open inside the viewport; Order,
  language, sort, type and search work. Header height: 121–129px from 1280px,
  177px below. The user reviewed and approved committing and merging to main.
- Limits: no manual way to re-frame Spatial after panning other than changing a
  sort or filter; no physical-device or signed-in check.

## V3 maintenance — English and Brazilian Portuguese

Recorded: 2026-10-25 00:38:53 EDT (-0400).

- Added a build-free language system: one catalog per language in `locales/`
  (`en.js` is the complete base, 160 keys; `pt-BR.js` translates all of them)
  and `i18n.js`, which picks the language (saved choice `mcu.lang.v1`, then the
  browser/phone language, then English), falls back to English per key, handles
  plurals, budget formatting and collation, and re-renders on change.
- All interface text now goes through the catalogs. Portuguese shows official
  Brazilian release titles for all 64 entries (with search aliases), Brazilian
  character names where they differ, and translated story labels and notes.
  Search matches titles and characters in every language; A–Z sorts by the
  shown name.
- Header language menu (EN / PT) on the desktop toolbar and the mobile app bar.
  The mobile subtitle now truncates instead of running under the header
  buttons; the desktop toolbar steps labels down sooner so both languages fit.
- AGENTS.md requires new UI text to be added to every locale; README documents
  adding a language; docs/CATALOG-AUDIT.md lists the Brazilian title sources.
- Verification: headless Chromium with pt-BR and en-US browser locales: automatic
  detection, menu switching and persistence; no leftover English or missing keys
  across list, grid, spatial, filters, details, account and menus; cross-language
  search; fit at 16 desktop widths (900–2560) and 4 phone widths (320–430) in
  both languages with All and Watchlist active. No console errors. The user
  reviewed and approved committing and merging to main.
- Limits: Portuguese copy written by Claude; Supabase server error text stays in
  its original language; no physical-device or OAuth check.

## V3 maintenance — Always-visible Unseen / Seen / Watchlist switch

Recorded: 2026-10-24 23:48:23 EDT (-0400).

- All / Unseen / Seen / Watchlist moved out of Filters into an always-visible
  switch with icons (dashed ring = Unseen, check = Seen, bookmark = Watchlist).
  Desktop: second toolbar row beside All / Films / Series, stepping down to
  All + active label (and icon-only Recenter) below 1250px and on the joined
  1920–2399px row, icon-only below 1000px.
- Mobile header reorganised: search · order menu (no "Order:" text) · icon-only
  Filters on row two; collection switch · List/Grid/Spatial menu on row three.
  The switch labels All and the active option (all four from 400px).
- Collection no longer appears in the Filters popover/sheet, badge or Clear
  actions. Account modal "Show …" links gained the icons.
- Verification: headless Chromium with All and Watchlist active at desktop 900,
  1000, 1100, 1250, 1251, 1440, 1600, 1919, 1920, 2099, 2100 and 2560 and mobile
  320, 360, 390 and 430: no off-screen controls, row overflow or overlaps.
  Mobile list filtered 64 → 52 / 12 / 4; desktop dimmed 52 cards for Seen; view
  menu stayed on screen and switched to Grid. No console errors. The user
  approved committing and merging to main.
- Limits: the existing 320px title/subtitle overflow (e.g. with RT selected)
  is unchanged; no physical-phone, OAuth or cloud-write check by Claude.

## V3 maintenance — Remove mobile List rating bars

Recorded: 2026-10-24 23:15 EDT (-0400).

- Removed the score-length progress bars from mobile List when sorting by IMDb
  or Rotten Tomatoes. Numeric rating badges and rank numbers remain. Removed
  the unused bar styles and score calculation.
- User approved committing, pushing and merging all current V3 work into main,
  including the earlier in-story timeframe / Chrono update in
  [cbd8b3f](https://github.com/AndreFelipeRibeiro/MCU-Connections/commit/cbd8b3f).
  Original commit attribution is preserved.
- Verified locally in Chrome at 320px and 390px with IMDb and RT selected:
  all 64 List rows rendered, numeric badges and ranks remained, and rating bars
  were absent. List rows fit both widths; no browser errors were observed.
  `git diff --check` passed.
- Limits: existing header overflow with RT selected at 320px (340px content)
  remains separate from this List-only change. No physical-device, OAuth or
  cloud-write checks were repeated. These checks describe the local change,
  not a verified production deployment.

## V3 maintenance — In-story timeframes and a story-ordered Chrono view

Recorded: 2026-10-24 23:10:58 EDT (-0400).

- Every released title now has an in-story timeframe (`story`, plus
  `storyNote` for alternate realities) in `data.js`: a year, a range, `c.` for
  approximate years, or "Outside time" / "Multiverse". Primary source: Marvel's
  2023 official timeline book via Wikipedia's MCU timeline article; the book wins
  disputes (e.g. Iron Man 2008). Unreleased titles have none yet. Sources and
  judgment calls are in `docs/CATALOG-AUDIT.md`.
- A shared hourglass label shows it on desktop spatial cards, mobile grid cards,
  list rows and the mobile focus pop-up; the drawer and detail sheet read
  "Set in 1943–1945" plus any reality note. Release years stay visible.
- Chronological order now follows those timeframes (`chronOrder` renumbered
  1–64; about 17 backwards jumps removed). Within a year it follows the book's
  seasons; undated Loki/What If…? seasons keep their neighbours; unreleased
  titles sit at the end. The mobile Chrono list groups under story-timeframe
  headers and rows show their release year.
- Verification: headless Chromium. Labels on all 60 released titles on desktop
  1440×900 and mobile 390×844/320×640, none on the 4 unreleased; no clipped card
  text or horizontal overflow. 35 Chrono headers, none backwards, in both
  directions; Release headers unchanged; desktop Chrono opens with Eyes of
  Wakanda, First Avenger, Fantastic Four, Captain Marvel, Iron Man. No console
  errors. The user reviewed and approved it.
- Limits: in-universe years are partly disputed and judged from the cited
  sources; posters were blocked in the test renders; no physical-phone check by
  Claude.

## V3 maintenance — Main merge and production verification

Recorded: 2026-10-24 22:19:17 EDT (-0400).

- Final mobile layout and release documentation:
  [e36e4fd](https://github.com/AndreFelipeRibeiro/MCU-Connections/commit/e36e4fd5fa1fc8316649ad105da0203d3ff10a71).
  Approved V3 maintenance merged and pushed to main in
  [8731121](https://github.com/AndreFelipeRibeiro/MCU-Connections/commit/8731121cb4f9ab85e228315e44236532fda326d3).
  This preserved all original maintenance commits and coauthor credits.
- Closed both Notion tasks (List information layout and List/Grid navigation)
  with the 2026-10-24 completion date, implementation commit and merge link.
  Main and version/3.0 were synchronized; local worktrees were clean.
- Production smoke check at mcu-connections.vercel.app: at 390×844, List / Grid /
  Spatial appeared in order, all 64 rows loaded, ratings appeared inline under
  metadata and no horizontal overflow occurred. VisionQuest search returned one
  row with IMDb 8.0 / RT 90%; clearing restored the list. At 1440×900, desktop
  navigation loaded with Order and no toolbar overflow. No console errors.
- This proves the updated UI was observed on production; it does not establish
  the exact deployment time or repeat live OAuth, cloud-write, physical-device,
  Safari or screen-reader acceptance tests. No account data was modified.

## V3 maintenance — Mobile List layout and approved main release

Recorded: 2026-10-24 22:16:01 EDT (-0400).

- Move IMDb and Rotten Tomatoes together beneath List metadata, retaining
  RT-first ordering on RT sorts, rank numbers/bars, search matches, the unrated
  fallback and independent tracking/detail buttons.
- Order the mobile view switch List / Grid / Spatial with stable view ids;
  existing defaults and saved preferences continue to work.
- User approved these two tasks and merging all current V3 maintenance into
  main. The release includes the catalog refresh, reverse sorts, responsive
  navigation, mobile animations/default List, saved preferences, Safari Order
  fix and spatial camera/framing work recorded below. Preserve their original
  commits and tool attribution.
- Refresh README, spec/task/kickoff handoffs, catalog release status and the
  verification record. Notion is the live task database; code-task closure
  records approval, completion date and implementation commit after the push.
- Verification for this mobile change: Chrome at 320, 390, 430, 768 and 899px
  with Release/IMDb/RT sorts; ratings were below metadata and paired inline,
  with no row overflow or nested buttons. Checked unrated copy, details,
  seen/watchlist actions without opening details, Grid/Spatial/List switching
  and List persistence after reload. No console errors; whitespace check passed.
- Limits: physical phone/Safari keyboard, live sign-in and cloud sync were not
  repeated. Earlier maintenance checks below are preserved as historical
  evidence, not claimed as newly rerun. Email/password Phase 6 stays deferred.

## V3 maintenance — Spatial keeps your place and opens bolder

Recorded: 2026-10-24 22:07:27 EDT (-0400).

- Closing title details no longer drops the camera at the Phase 1 end. The
  focus ring is laid out near the canvas origin and the camera stayed there
  after the cards returned. The camera position is now remembered on selection
  and restored on close with a 600ms glide (cancelled by any pointer or wheel
  input). If the visitor hopped to another card through the ring, that card's
  layout position is centred at the original zoom. A layout change or Recenter
  in between clears the memory.
- Release/Chrono open at about 7.5 titles across on desktop and 2.5 on touch
  (capped at 100%), centred vertically on the titles in view instead of the
  top-left corner, keeping the leading title visible in reverse order.
  Grid-style sorts are unchanged.
- Entering Spatial on mobile from List/Grid now frames the canvas; it previously
  opened unframed at 100% on the top-left corner.
- Verification: headless Chromium. Desktop 1440×900: from a Phase 6 card,
  open/close restored the exact camera position (two runs); A→B through the
  ring centred B with 0px offset at the original zoom; sorting while open did not
  jump on close. Mobile 390×844: deselect restored the framed view; List → detail
  sheet → Spatial → deselect framed at 80%. Opening zoom for Release: 1280 65→87%,
  1440 74→98%, 1920 98→100%, phone 50→80%. No new console errors. The user
  reviewed and approved it.
- Limits: no physical phone/trackpad check by Claude; posters were blocked in
  the test renders. A pre-existing passive-listener warning on desktop wheel
  zoom remains.

## V3 maintenance — Fix the Order menu in Safari (awaiting phone check)

Recorded: 2026-10-24 21:41:19 EDT (-0400).

- Choosing an option in the Order menu did nothing on iPhone. Safari (iOS and
  macOS) does not focus a tapped button, so tapping an option blurred the
  focused one with no new focus target; the menu treated that as focus leaving
  and closed, unmounting the option before its click fired. The menu now only
  closes on focus loss when focus moves to an element outside it. Outside taps
  (pointerdown listener) and Escape still close it. Shared by desktop and mobile.
- Verification: headless Chromium with a script reproducing Safari's tap focus
  behavior. Before the fix both options failed on mobile 390×844 and desktop
  1440×900; after it both work in both directions, with and without the
  emulation. Outside tap, Escape with focus return, Enter to open, Tab out to
  close and keyboard selection pass. No console errors.
- Limits: WebKit was not available to Claude; pushed to the V3 preview so the
  user can confirm on a real iPhone.

## V3 maintenance — Agent workflow uses the Notion task database

Recorded: 2026-10-24 21:41:19 EDT (-0400).

- AGENTS.md now points Codex and Claude to the Notion V3 Tasks database instead
  of the archived checklist: take the next task from the Queue view, claim it
  with Assigned to + Status In progress and re-read the record, set Awaiting
  review when ready, and complete code tasks only after approval and a push,
  filling Completed on and Latest commit. Phase 6 stays Deferred.
- Verification: documentation-only; diff reviewed against the database's own
  workflow notes. No application files changed.

## V3 maintenance — Remember view, sort mode and order per device

Recorded: 2026-10-24 21:34:34 EDT (-0400).

- Each device now remembers the mobile view (List/Grid/Spatial), the sort mode
  and the order direction, on desktop and mobile, in `localStorage` key
  `mcu.prefs.v1` (`{ version: 1, viewMode, sort, sortDir }`), per V3-SPEC D6.
- Nothing is written until the visitor changes one of these, so first visits keep
  following the defaults (List, Release, oldest first). Preferences are not tied
  to the account and are not cleared on sign-out.
- Filters, search and the spatial camera are deliberately not saved, so nobody
  returns to a silently filtered catalog. D6 and README note this.
- Missing, malformed, wrong-version or unknown values fall back to defaults; an
  invalid direction falls back to that mode's default; blocked storage keeps
  choices for the visit only.
- Verification: headless Chromium. Mobile 390×844: Grid + IMDb lowest-first and
  Spatial + Chrono latest-first survived reloads; returning to List/Release
  persisted too; a Series filter (24 titles) reset to all 64 after reload with
  nothing stored. Desktop 1440×900: Phase 6→1 survived reload. Malformed JSON,
  wrong version, unknown values, an invalid direction and throwing storage all
  loaded without console errors. The user reviewed locally and approved it.
- Limits: browser emulation only; no physical-phone or private-browsing check by
  Claude.

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
