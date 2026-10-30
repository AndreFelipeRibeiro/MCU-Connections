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

## V3 improvement — move through the desktop List with the arrow keys

Recorded: 2026-10-30 08:54 EDT (-0400). Pushed to `version/3.0` (staging). ([`5752bc8`](https://github.com/AndreFelipeRibeiro/MCU-Connections/commit/5752bc8f7d61ce985f73e345d09bf75b01f847fe))

- With a title's details open, ← → step through the titles in the order the
  List shows (sort, tab, filters, search), wrapping at the ends, and a screen
  reader hears "title, n of N". ↑ ↓ move between rows keeping the column, Home
  and End go to the ends, and the details follow, also after a mouse click.
  The Guides table works the same way. A pinned character or a guide keeps its
  own stepping, and arrow steps no longer pull focus into the details.
- Fixed: a row stepped to (wrapping to Iron Man with Tony pinned, for example)
  no longer sits half under the pinned meter and column headers: 38px were
  hidden before, none now. On phones a step onto the Up next title scrolls to
  its card.
- Verified: new `qa/test-listkeys.js`; checked in the in-app browser. Limits:
  not checked in Safari itself or with a real screen reader.

## V3 feature — "What have you seen?"

Recorded: 2026-10-30 08:54 EDT (-0400). Pushed to `version/3.0` (staging). ([`0b7be83`](https://github.com/AndreFelipeRibeiro/MCU-Connections/commit/0b7be835d20609623e8a7c10802e9296360a3ae8))

- A poster grid of every released title by phase, to mark many as seen in one
  go. The first-visit welcome offers it ("Mark what I've seen"); the account
  menu or sheet and the Seen tab's empty state open it later, with titles
  already seen ticked and untickable. Saving is one change: one toast with
  Undo, at most one celebration, no extra confirmation. Closing with unsaved
  picks asks first (Back too, on phones).
- Verified: new `qa/test-picker.js`; the accessibility scan covers it on
  desktop and phone. Limits: saving while signed in and a real iPhone not
  checked.

## V3 feature — curated watch guides

Recorded: 2026-10-30 08:54 EDT (-0400). Pushed to `version/3.0` (staging). ([`fec0e8b`](https://github.com/AndreFelipeRibeiro/MCU-Connections/commit/fec0e8ba6f3fe96b655e2074cffc943a46655dda))

- Six guides: before Avengers: Doomsday, the Infinity Saga essentials,
  Spider-Man, the Avengers films, the Multiverse Saga and the animated series.
  Each stop says why it is there; optional stops sit behind "Include
  optional". An open guide shows only its own titles (close it to see all):
  a List and Grid of stops, a route in Spatial, a stepper, Up next on the next
  stop and "Mark N more seen". Search suggests guides, a character with a guide
  offers it, a title's details list its guides, and finishing a guide bursts
  green confetti once.
- Verified: new `qa/test-guides.js`; the Guides List's columns line up with
  their headers at every width. Four older checks now tell the Guides button
  from the Filters button.

## V3 improvement — a whole phase at once in the desktop List

Recorded: 2026-10-30 08:54 EDT (-0400). Pushed to `version/3.0` (staging). ([`40f8fa5`](https://github.com/AndreFelipeRibeiro/MCU-Connections/commit/40f8fa5656bcfb693cf053dd12fdf95df13168d1))

- In By Phase, each phase header has a checkbox that selects that phase for
  the bulk bar, and every progress header offers "Mark all seen" / "Mark N
  more seen" with the phones' confirmation and Undo.
- Verified: `qa/test-bulk.js` covers the phase checkbox, its mixed state and
  the header button.
- Batch verification, on the final tree: `bash qa/regress.sh` 35 check runs
  clean; the accessibility scan empty for 13 screens in English and
  Portuguese.

## V3 feature — Up next: what to watch now

Recorded: 2026-10-29 23:28 EDT (-0400). Pushed to `version/3.0` (staging); merged to main
(production) on 2026-10-29 after the user's approval, in the Batch 8 merge. ([`9a092a6`](https://github.com/AndreFelipeRibeiro/MCU-Connections/commit/9a092a62e2b9ac781fdeedd98f924f4a8c85924d))

- One suggestion: the first released title not marked seen, earliest first in
  release order (story order on Chronological), or the first of the list itself
  on A–Z, IMDb and RT, in the list's direction. It follows the Watchlist tab, a
  pinned character and the type, phase and budget filters, and says which.
- A card at the top of the phone List and Grid (the title's own row left out),
  a strip above the desktop List, a row in desktop Spatial's All titles meter,
  a chip in phone Spatial. Mark seen and Watchlist go through the usual toast,
  Undo and sync; the × hides it until the page is reloaded. Caught up names the
  next arrival; the Watchlist tab has its own states.
- Verified: new `qa/test-nextup.js` (expectations from the catalogue and
  today's date); full suite and both scans on the final tree. Limits: the
  wait for a signed-in collection was checked as a guest only.

## V3 improvement — collapsible sections in the title details

Recorded: 2026-10-29 23:28 EDT (-0400). Pushed to `version/3.0` (staging); merged to main
(production) on 2026-10-29 after the user's approval, in the Batch 8 merge. ([`0d7d6bd`](https://github.com/AndreFelipeRibeiro/MCU-Connections/commit/0d7d6bd1bef96d6aa394214b9bf2a6fb87a4265b))

- The cast and Where to watch are collapsible (one shared `DetailSection`):
  the cast starts open and Where to watch closed, so the details stay short as
  sections are added. A section stays as you left it while you move between
  titles; a reload restores the defaults. Nothing is stored.
- Verified: `qa/test-details.js` and `qa/test-watch.js` check the defaults and
  that each heading toggles only its own section.

## V3 feature — where to watch, by country

Recorded: 2026-10-29 23:28 EDT (-0400). Pushed to `version/3.0` (staging); merged to main
(production) on 2026-10-29 after the user's approval, in the Batch 8 merge. ([`182acb0`](https://github.com/AndreFelipeRibeiro/MCU-Connections/commit/182acb0fc03a13f7ba5b5a86284e71d150f7c558))

- A Where to watch section lists the services offering a released title in
  your country (stream and free with logos, rent or buy on one line), with one
  link to TMDB's page and a "Checked <date> · Data from JustWatch via TMDB"
  credit. The country is guessed from the browser and can be changed; it is
  kept on this device only. United States and Brazil to start.
- Data: a dated snapshot (`watch-data.js`) written by `tools/refresh-watch.js`
  from TMDB (token from the maintainer's environment only; the script is not
  deployed). First run 2026-10-29: 60 released titles, no title or year
  warnings. The app makes no API calls of its own. About credits JustWatch.
- Verified: new `qa/test-watch.js` (every state against a test snapshot, plus
  the real one); screenshots with real logos.

## V3 improvement — the same title details on desktop and phones

Recorded: 2026-10-29 23:28 EDT (-0400). Pushed to `version/3.0` (staging); merged to main
(production) on 2026-10-29 after the user's approval, in the Batch 8 merge. ([`32ba5a5`](https://github.com/AndreFelipeRibeiro/MCU-Connections/commit/32ba5a56c1a33e52f4f13e3ac471ec940e836055))

- One shared body for the desktop drawer and the phone sheet: poster beside
  the title and dates, then scores ("Ratings after release" when not out yet),
  budget ("Not published" when unknown), Seen and Watchlist, synopsis and cast.
  The drawer gains the poster, scores and budget and scrolls as one; phones
  gain the budget and the search highlight in the title.
- Verified: new `qa/test-details.js` (desktop, 390 and 320px).

## V3 improvement — desktop List meters above the column headers

Recorded: 2026-10-29 23:28 EDT (-0400). Pushed to `version/3.0` (staging); merged to main
(production) on 2026-10-29 after the user's approval, in the Batch 8 merge. ([`17a2dde`](https://github.com/AndreFelipeRibeiro/MCU-Connections/commit/17a2dde8e31b83f08a17e21fd76f7075ef84b4b8))

- The All titles meter (or the current phase's, in By Phase) pins at the top
  of the List with the column headers right beneath it; each phase takes the
  top slot at its boundary. The table's ARIA stays valid.
- Verified: `qa/test-progress.js` updated to the new positions.

## V3 improvement — subtler desktop List checkboxes

Recorded: 2026-10-29 23:28 EDT (-0400). Pushed to `version/3.0` (staging); merged to main
(production) on 2026-10-29 after the user's approval, in the Batch 8 merge. ([`09db23e`](https://github.com/AndreFelipeRibeiro/MCU-Connections/commit/09db23ec4be718dbab2d0c0d6968226f6014c03a))

- Drawn checkboxes instead of the browser's white boxes: a muted outline, the
  accent with a dark tick when selected, a dash for the mixed header. Contrast
  measured at 4.66:1 or better for the outline and 4.83:1 for the fill.

## V3 workflow — the full suite runs once per batch

Recorded: 2026-10-29 00:15 EDT (-0400). Pushed to `version/3.0` (staging); merged to main
(production) on 2026-10-29 after the user's approval, in the Batch 7 merge. ([`24c6150`](https://github.com/AndreFelipeRibeiro/MCU-Connections/commit/24c6150c6b6521a52e5d30ef40182b52cff0a877))

- User decision: each ticket runs the targeted check for its area before
  review; the full regression and both accessibility scans run once per batch,
  on the final tree, before staging, reading the scan's output rather than its
  exit code. Recorded in AGENTS.md and the handoff doc.
- [`4eba664`](https://github.com/AndreFelipeRibeiro/MCU-Connections/commit/4eba664b8693c138243b13aadd635c1c432181df) restores the executable bit on `qa/regress.sh`, which the
  Batch 7 commits dropped (they were assembled from per-ticket file contents
  staged as mode 100644). `bash qa/regress.sh` was unaffected.

## V3 feature — mark many titles at once

Recorded: 2026-10-29 00:15 EDT (-0400). Pushed to `version/3.0` (staging); merged to main
(production) on 2026-10-29 after the user's approval, in the Batch 7 merge. ([`8e6543d`](https://github.com/AndreFelipeRibeiro/MCU-Connections/commit/8e6543d826a8848fcaf4c2042226a7386c92c018))

- Desktop List: a checkbox column (header box with a mixed state, Shift-click
  ranges) and a bar with Mark as seen, Add to Watchlist, More > Mark as unseen
  and Clear, each showing how many titles it will change. Escape clears the
  selection before it closes the details.
- Phones: "Mark all seen" / "Mark 4 more seen" on each By Phase header and on
  the All titles header in every other order.
- Per-title writes (user decision): one commit and one guest-storage write per
  action, then each title through its own writer queue, so failures roll back
  per title. One rule (`bulkTargets`) decides what an action changes, for the
  counts and the action alike: unreleased titles are never marked seen in
  bulk. One toast and one announcement, with Undo restoring each title (a
  replaced watchlist included); over 20 titles, and any Mark as unseen, ask
  first, and Cancel keeps the selection.
- **Verified:** `qa/test-bulk.js` (selection, exact targets, one storage write
  and one announcement, Undo, the confirmation, real Escape presses, phone
  headers); looked at the bar, the confirmation and both phone headers.
- **Limits:** the signed-in path (the same queue a single mark uses) has not
  been exercised against a real session; not checked on a real phone.

## V3 feature — shareable addresses

Recorded: 2026-10-29 00:15 EDT (-0400). Pushed to `version/3.0` (staging); merged to main
(production) on 2026-10-29 after the user's approval, in the Batch 7 merge. ([`2597259`](https://github.com/AndreFelipeRibeiro/MCU-Connections/commit/2597259ef26aa5a9c63a7549e3c703e5ce2b3f02))

- The address carries the open title, a pinned character, the view, sort,
  order and catalogue filters; a link opens exactly that state, and what it
  leaves out takes the app's defaults. The collection filter, search text,
  language and anything from the account never go in; names avoid the sign-in
  redirect's `code` / `state` / `error`.
- The address follows the state without adding history (keeping the phone
  sheets' Back working); Back and Forward restore the title and character, and
  a phone sheet closing itself restores nothing. The first version treated that
  as Back and unpinned a character just pinned from the details; the regression
  run caught it (`test-align2`).
- **Verified:** `qa/test-urlstate.js`; looked at two example links rendered.
- **Limits:** opening a link saves its view and sort as this device's
  preferences; desktop Back still leaves the site; a first-time visitor sees
  the welcome first; not checked on a real phone.

## V3 fix — the desktop List's All titles header is valid ARIA, and pins

Recorded: 2026-10-29 00:15 EDT (-0400). Pushed to `version/3.0` (staging); merged to main
(production) on 2026-10-29 after the user's approval, in the Batch 7 merge. ([`d8f2434`](https://github.com/AndreFelipeRibeiro/MCU-Connections/commit/d8f243441dc7be6d52b3a9acde76ff873a1be880))

- Batch 6 shipped the header in a rowgroup with no row: a **critical** axe
  `aria-required-children` violation in production, and the reason it never
  pinned. It is now a row owned by the table.
- `qa/a11y-scan.js` now exits non-zero on any violation. It used to exit 0
  whatever it found, which is how the Batch 6 entry below came to report a
  clean scan.
- **Verified:** axe output empty for 7 screens in both languages; `test-progress`
  checks the header pins under the column header.

## V3 feature — release status at the precision the catalog knows it

Recorded: 2026-10-29 00:15 EDT (-0400). Pushed to `version/3.0` (staging); merged to main
(production) on 2026-10-29 after the user's approval, in the Batch 7 merge. ([`c54e685`](https://github.com/AndreFelipeRibeiro/MCU-Connections/commit/c54e6859f814c6aa909a124b214a4da98ea4d962))

- "Released May 2, 2008", "Coming December 18, 2026", or "Expected March 2027 ·
  day not yet confirmed" in the details; Upcoming / Expected badges on titles
  not out yet; Released only in the Filters panel. A month window never counts
  as released.
- **Verified:** `qa/test-release.js` (expectations from the dates at run time);
  badge contrast computed (4.83 and 6.51 at worst); looked at in both languages.
- **Limits:** not checked on a real phone.

## Batch 7 verification

Full regression on the final tree: 29 check runs clean. axe: no violations in
7 screens × 2 languages, read from the output.

## V3 feature — progress: phase meters on By Phase, one catalogue meter everywhere else

Recorded: 2026-10-28 22:13 EDT (-0400). Pushed to `version/3.0` (staging); merged to main (production) on
2026-10-28 after the user's approval, in the Batch 6 merge.
Revises the progress entry below after the user's design review
([`1fc30af`](https://github.com/AndreFelipeRibeiro/MCU-Connections/commit/1fc30af58978698053888ec313ecc39583bfdb5a)).

- **One rule.** Per-phase meters appear on the By Phase tab only; every other
  order (Release, Chronological, A–Z, IMDb, Tomatometer) shows one **All
  titles** meter over the whole catalogue, so the Release and Phase tabs no
  longer repeat each other. The rule is shaped once (`viewProgress` in
  `app.jsx`); the views draw whichever tallies they are handed.
- **Segmented meter**, one tick per released title (a solid bar past 24), so
  it reads as "5 of 6" without the number. A complete group shows a check disc
  sized to the label's cap height instead of a glyph that read too small. The
  meter fills when its header scrolls into view (once; never with reduced
  motion). Type scale: 13px label, 11px count.
- **Sticky headers** in the desktop List (one rowgroup per phase, pinned under
  the column header), the phone List and the phone Grid, which now share one
  component. Seen runs on the phone no longer straddle a phase boundary.
- **Spatial:** phase headers sit on opaque pills above their rows (no
  `backdrop-filter` inside the canvas); row names without a meter hug their
  text. Pill and camera share `BAND_LABEL_H`, which fixes the first By Phase
  pill being cut off and the Chronological one sliding under the count pill.
  By Phase now has bands at all. The All titles meter floats top-right on
  desktop and takes its own row under the count pill and zoom control on
  phones, and stands down while a title is selected.
- **Verified:** `test-progress` rewritten around the rule — all 30 view and
  order combinations, the counts (released only, collection tab ignored,
  hidden during search), stickiness, framing and the reveal; full regression
  (26 check runs) clean; axe clean in English and Portuguese. **Correction:**
  it was not — see "the desktop List's All titles header is valid ARIA"
  above; the claim was read from an exit code that never failed. Looked at in the
  browser at 1440 and 375 wide.
- **Limits:** not checked on a real iPhone; the phone layout is from Chromium
  device emulation.

## V3 improvement — the Spatial count follows a selected title

Recorded: 2026-10-28 22:13 EDT (-0400). Pushed to `version/3.0` (staging); merged to main (production) on
2026-10-28 after the user's approval, in the Batch 6 merge. ([`3b2a5f5`](https://github.com/AndreFelipeRibeiro/MCU-Connections/commit/3b2a5f5bc510a47c2606cea35bf91e8119f1adb2))

- Selecting a title fades the unconnected cards out, but the count pill kept
  saying "64 titles". It now reads, for example, "17 of 64": the selected title
  plus every title sharing a character with it, the same set the canvas keeps
  lit. Closing the selection returns it to the total.
- **Verified:** `test-camera` compares the pill with the number of lit cards
  rather than a fixed figure; checked by hand on The Incredible Hulk (17 lit,
  "17 of 64").

## V3 fix — every character has a portrait

Recorded: 2026-10-28 22:13 EDT (-0400). Pushed to `version/3.0` (staging); merged to main (production) on
2026-10-28 after the user's approval, in the Batch 6 merge. ([`958dc3d`](https://github.com/AndreFelipeRibeiro/MCU-Connections/commit/958dc3d741a1d620ac0389591000fe4b41cdf27d))

- Ten portraits were missing because adding a character does not add its TMDB
  path: the five sparse-series characters (Maria Hill, Talos, Monica Rambeau,
  Mobius, Sylvie), four added earlier (Frank Castle, Tommy, Paladin, Silver
  Surfer) and the recast credit Akira Akbar. Each path was taken from TMDB's
  person search and confirmed to return a real image.
- Mike McGill stays as initials: TMDB has no photo for either person of that
  name.
- **Verified:** `test-recastname` fails when any character or credited
  performer has no portrait, with Mike McGill the one allowed exception.

## V3 improvement — a recast performer's own title count beside their name

Recorded: 2026-10-28 22:13 EDT (-0400). Pushed to `version/3.0` (staging); merged to main (production) on
2026-10-28 after the user's approval, in the Batch 6 merge. ([`56f44b7`](https://github.com/AndreFelipeRibeiro/MCU-Connections/commit/56f44b73b68d295883bc22cd138f036b755be67d))

- The banner names the performer credited on the title in view, but counted the
  whole character's titles beside the name while the stepper already showed
  the chain ("Mike McGill · 8 titles", "6 of 8"). It now counts that
  performer's share, the figure the search suggestion shows: Mike McGill 1,
  Harrison Ford 1, William Hurt 5.
- **Verified:** `test-pickperson` now keeps the stepper total and the subtitle
  count apart (it had failed on every recast) and passes for all 179 subjects;
  `test-recastname` checks Norton (1) and Ruffalo (8).

## V3 improvement — the character banner stops at the details panel

Recorded: 2026-10-28 22:13 EDT (-0400). Pushed to `version/3.0` (staging); merged to main (production) on
2026-10-28 after the user's approval, in the Batch 6 merge. ([`3ae170c`](https://github.com/AndreFelipeRibeiro/MCU-Connections/commit/3ae170c5fefd70911b9f0c9376674abbf925862d))

- Reverses the full-width pinned banner recorded further down ("the pinned
  banner holds its place…"). That kept the stepper still, but the hover preview
  stopped at the panel, so pinning a character changed the bar's width, which
  the user found worse than the controls moving. Both now take the same 402px
  indent; the panel hangs from the toolbar at full height and the `--cb-h`
  measurement is removed.
- **Verified:** `test-bannerhold` rewritten for the new rule (content stops
  before the panel, panel hangs from the toolbar, hover and pinned indents
  equal).

## V3 feature — phase and era progress, on four of the five surfaces

Recorded: 2026-10-28 17:43 EDT (-0400). Pushed to `version/3.0` (staging); merged to main (production) on
2026-10-28 after the user's approval, in the Batch 6 merge.
Revised after design review; see the progress entry above.

- One shared `ProgressHeader` carries the label, the `9/18` count in JetBrains
  Mono, a slim bar in the group's colour and a screen-reader sentence
  ("9 of 18 seen"). Complete swaps the count for a check; nothing-seen shows an
  empty track rather than hiding, so the structure stays consistent.
- **Desktop List:** By Phase headers become progress headers, and Release gains
  a phase divider above the first year of each phase, acting as a super-header
  while the year rows below are untouched. **Desktop and phone Spatial:** phase
  bands (Release) and era bands (Chrono) carry the count and bar. **Phone
  List:** the same divider, including inside the folded seen-runs branch, which
  renders through a different path and needed the divider added separately —
  it deliberately does not fold with a run, being the super-header.
- Counts are computed from `filtered`, never `visible`: the collection tab must
  not feed its own numbers, or Seen would always read 100% and Unseen 0%. They
  follow the type, phase and budget filters, count seen over **released** only,
  report "+N" for upcoming, and update live.
- Hidden during a text search and while a character is pinned — both narrow the
  base set, and pinned-character progress is the one thing the ticket rules out.
- **The phone Grid is NOT done.** It has no group headers at all today, only
  seen-run sections, so "the same component" means giving the Grid grouping it
  has never had. That is a visible change to that view's design rather than a
  styling job, so it is left for the user's call.
- Verification: checked in a real browser on desktop List (Release and By
  Phase), desktop Spatial (Release and Chrono), phone List and phone Spatial,
  in English and Portuguese, with complete, partial and zero states and the
  live update after marking. At 320px all six dividers sit on one line and fit
  the width. axe-core clean on 7 screens in both languages. Contrast measured
  against real composited backgrounds: complete count 8.34:1, partial count and
  the upcoming hint 5.63:1.
- One fix found by measuring rather than looking: `.pgh-up` had `opacity: .75`
  over `--text-muted`, which sits exactly at AA, so the fade would have pushed
  the "+N" hint under the line. The opacity is gone.
- `qa/test-progress.js` guards the rules that are easy to get subtly wrong:
  one divider per phase, the denominator counting **released** titles only
  (Phase 6 reads 0/7 with "+4"), a live update after marking, the count
  **not** following the collection tab, and the headers standing down during
  a text search and returning after it.
- `qa/shots-progress.js` is a screenshot run, not part of regress.sh: it
  captures all eight surfaces in both languages into `qa/shots/` for the
  design review the ticket requires.
- The full suite ran clean against the committed change — **all 25 check
  runs clean, exit 0**, with nothing edited underneath it.
- Limits: the phone Grid is outstanding and needs the user's decision, and
  the screenshots still need their approval before this merges.

## V3 maintenance — five source-verified characters for the sparse series

Recorded: 2026-10-28 17:17 EDT (-0400). Pushed to `version/3.0` (staging); merged to main (production) on
2026-10-28 after the user's approval, in the Batch 6 merge.

- The review counted 11 series with two or fewer featured characters. Five
  characters were added, each verified per production and each chosen because
  it joins titles already in the catalog: **Maria Hill** (6 titles), **Talos**
  (2), **Monica Rambeau** (3), **Mobius M. Mobius** (2) and **Sylvie** (2).
- Sparse titles **13 → 9**. Captain Marvel and Secret Invasion are no longer
  sparse; Secret Invasion gains threads to five earlier titles through Hill and
  to Captain Marvel through Talos.
- **The credit-scene rule decided three of these**, and kept the pass honest.
  Maria Hill is *not* added to Infinity War — her only appearance there is the
  post-credits scene Fury was removed from. Talos is *not* added to Far From
  Home: Mendelsohn appears only in the post-credits reveal, since through the
  main feature he is disguised as Fury. Maria Hill *is* added to Far From Home,
  which looks like the opposite call but follows the same rule — the Hill on
  screen is Soren in disguise, yet Cobie Smulders plays her throughout.
- Two claims were checked and rejected. **Maria Hill is not in Civil War**: a
  Deadline piece lists her, but Wikipedia and CinemaBlend have her absent and
  that same list also mislabels Winter Soldier. **Mobius is not in Deadpool &
  Wolverine**: a pre-release cast guide predicted it, and the post-release
  cameo round-ups name only Happy Hogan and Thor. A prediction is not a credit.
- Monica Rambeau is a child/adult recast, so Captain Marvel carries
  `credits: { monica: 'Akira Akbar' }` and the batch 5 machinery handles it.
  Sylvie is a Loki variant and carries `prime: 'loki'`, the treatment He Who
  Remains and Victor Timely get for Kang.
- **Eyes of Wakanda stays at zero deliberately.** It is an anthology set
  centuries before the modern MCU, so its characters are genuine one-offs, not
  a missing appearance — the distinction the ticket asks for.
- Verification: checked in a real browser — all five are searchable and pin
  correctly with the right counts, and the credit resolver returns Akira Akbar
  for Captain Marvel and Teyonah Parris for WandaVision and The Marvels. No
  character was left with zero titles.
- Limits: the five have **no TMDB portraits**, so they fall back to initials.
  That is the designed behaviour and is better than risking a wrong face, but
  it is unfinished polish. The full suite had not yet run against this change
  when it was committed.

## V3 improvement — picking a title from search navigates to it instead of filtering by its name

Recorded: 2026-10-28 16:59 EDT (-0400). Pushed to `version/3.0` (staging); merged to main (production) on
2026-10-28 after the user's approval, in the Batch 6 merge.

- Picking a title put its name in the search box, which left a text filter
  behind. On the Spatial canvas that narrowed 64 cards down to the one just
  picked, stranding it with nothing to connect to — the one thing that view is
  for. Codex reproduced it with Iron Man 2.
- A title pick now clears the box and opens the title selected, so its rings
  come up and it lands among its neighbours. Typing text without picking still
  filters, exactly as before.
- The phase, type and collection filters are **not** touched, so a deliberate
  filter survives the pick rather than being silently reset.
- Verification: checked in a real browser — picking Iron Man 2 leaves the box
  empty, all 64 cards on the canvas, the card selected with its ring up and 41
  unrelated cards hidden, the details open, and the count still reading "64
  titles". `test-suggest` now asserts all three of those (empty box, catalog
  intact, title selected); it already captured them and never checked them.
- A pinned character now steps aside when a title is picked. Its narrowed
  canvas otherwise hid the very title just picked: pin Tommy Shepherd, who
  is in one title, then pick Endgame, and Endgame's details filled the panel
  while Endgame was not on the canvas at all. Only the pin goes; the phase,
  type and collection filters stay.
- That one was found by the new assertion rather than by eye — the first
  version of this change fixed the text filter and left this second way of
  stranding a title untouched.
- Limits: the phone path rests on `test-suggest`'s existing mobile case; no
  phone-width browser pass.

## V3 improvement — the pinned banner holds its place when the details panel opens

Recorded: 2026-10-28 16:55 EDT (-0400). Pushed to `version/3.0` (staging); merged to main (production) on
2026-10-28 after the user's approval, in the Batch 6 merge.
Reversed before release by "the character banner stops at the details panel".

- The banner was indented by `padding-right: 402px` to clear the drawer, which
  slid its mode toggle, stepper and close button 402px left the moment a title
  opened. Stepping with `›` is what opens a title, so the controls moved at the
  exact moment they were in use and the button left the cursor.
- The pinned banner now spans the full width and the drawer opens **below** it:
  `--cb-h` is measured with a ResizeObserver, like `--tb-h`, because the banner
  wraps and is taller in Portuguese — a constant would be wrong for the same
  reason it would be wrong for the toolbar.
- **Only the pinned banner counts.** The hover banner comes and goes as the
  cursor crosses a cast row *inside* the open drawer; tying the drawer's top to
  that would slide it out from under the pointer. The hover banner keeps the
  402px indent so its close button stays clear. The ticket did not anticipate
  this case.
- The cost is that the drawer's top moves on pin and unpin, which are
  deliberate and occasional, instead of on every step. It is transitioned, and
  `prefers-reduced-motion` keeps the slide-in but drops the reflow.
- Verification: new `qa/test-bannerhold.js` asserts the stepper's box is
  identical before and after the panel opens, that the panel starts at the
  banner's bottom and still reaches the viewport floor, and that hovering a
  cast row does not move it. `test-panel` and `test-camera`, which both measure
  drawer geometry, still pass. axe-core clean on 7 screens in both languages.
- Limits: desktop only by design; phones show a floating pill, not this banner.

## V3 improvement — a failed collection sync is visible without opening Account

Recorded: 2026-10-28 16:55 EDT (-0400). Pushed to `version/3.0` (staging); merged to main (production) on
2026-10-28 after the user's approval, in the Batch 6 merge.

- A failed account-wide load was reported only inside the Account panel, so a
  signed-in visitor browsed on with collection editing silently paused and no
  way to retry without opening a menu. `SyncStatus` now sits in the desktop
  toolbar and the phone app bar, and carries the Retry with it.
- It takes space only when something needs attention — a failure, or an account
  load in progress. Working sync and guest storage are reported through
  `role="status"` to assistive technology and nothing more: a permanent "all
  fine" chip is noise, and the Sign in button already says who you are.
- On phones "Syncing…" loses its words and leaves the spinner to say it,
  clipped rather than `display: none`, which would take the text from screen
  readers too. A failure keeps its words; it is the state that must be legible.
- It reuses `.acct-error`'s red rather than introducing a colour, so a failure
  reads the same wherever it is met. Measured against the real composited
  toolbar background: failure text 5.21:1, "Syncing…" 7.86:1, Retry 14.89:1 —
  all above the 4.5:1 the standards section requires.
- Verification: the guest path checked in a real browser (no visible chip, the
  hidden status reading "Collection saved on this device", no console errors),
  and axe-core clean on 7 screens in both languages. The two visible states'
  styling and contrast were measured by injecting their markup.
- **Limits, and this one matters:** the failure and loading states were **not**
  exercised live. Reaching them needs a signed-in session whose network then
  fails, which neither the headless checks (external requests are blocked) nor
  a guest session can produce. The logic that picks the state is unverified at
  runtime; only its rendering is. Worth one real signed-in test with the
  network cut before this is called done.

## V3 improvement — one name for a recast character, everywhere, and one unbroken chain

Recorded: 2026-10-28 16:37 EDT (-0400). Pushed to `version/3.0` (staging); merged to main (production) on
2026-10-28 after the user's approval, in the Batch 6 merge.

- **The name now follows the title.** The pinned banner, the phone pill and the
  card match badge all named the character's *default* performer, so the banner
  read "Mark Ruffalo" above a cast row reading "Edward Norton", about the same
  title, at the same moment. All three now resolve through the credit for the
  title in view. The badge needed the title passed to it at four call sites —
  it had no way to know which title it was describing.
- A character search offers **one row per performer** of a recast part:
  "Bruce Banner · Mark Ruffalo" and "Bruce Banner · Edward Norton". A part that
  never changed hands keeps its single row.
- **The chain stays whole.** A performer of one character now pins that
  character and keeps the entire run, opening on their first title. Rhodes
  walks 1–10 through Terrence Howard and Don Cheadle; Ross walks 1–8 through
  William Hurt, Mike McGill, Travis Willingham and Harrison Ford. Breaking a
  recast into separate runs broke the chain the stepper exists to walk — a
  recast is the same person. A performer of *several* characters (Majors,
  Atwell, Bettany) still pins as themselves; those are genuinely different
  people. This **reverses** part of the rule set on 2026-10-28, which named a
  recast performer as themselves with their own titles.
- Card search matching also moved onto the per-title credit, so "Edward Norton"
  finds The Incredible Hulk and nothing else.
- One shared helper, `window.MCU_creditRoster()`, backs the banner, the pill
  and the suggestions. Naming a performer differently in two places is the bug
  this replaced, so they read from one source.
- **A bug the checks caught, worth recording:** the first version decided
  whether a performer was a recast from `charToTitleIds`, which is built from
  the *filtered* set. A search narrows it, so the test silently failed at
  exactly the moment it is asked — while the user is searching. The
  whole-catalog `charTitleTotals` exists for this; deleting it as unused was
  the mistake. The trap is now written above it.
- `qa/regress.sh` counted its own checks wrong: the summary said "all 22 checks
  clean" for a run of 23, because the number was hardcoded in two places. It
  now counts what actually ran, and says **runs** rather than checks, since
  `test-fit` runs twice and the two can fail independently.
- Verification: full `qa/regress.sh` — **all 24 check runs clean, exit 0** —
  including the rewritten `test-pickperson` (168 subjects, every actor and
  character picked from the search) and a new `qa/test-recastname.js`. Checked
  in a real desktop browser in both languages: the Rhodes and Ross chains
  walked end to end, and the List badge reading "Edward Norton" on
  *O Incrível Hulk* while every other Banner title reads "Mark Ruffalo".
- Limits: no phone-width browser pass for this change; the phone pill rests on
  the checks. `test-pickperson`'s expectations were rewritten to the new rule,
  so it no longer guards the old one.

## V3 workflow — Version and Batch tags on the Notion backlog

Recorded: 2026-10-28 15:45 EDT (-0400). Pushed to `version/3.0` (staging); merged to main (production) on
2026-10-28 after the user's approval, in the Batch 6 merge.

- The backlog recorded *when* a ticket was completed but not *what it shipped
  in*, so reconstructing a batch meant reading completion timestamps and
  guessing at the clusters. **Version** (V3, V4) and **Batch** (Pre-batch,
  Batch 1…n) are now fields on the V3 Tasks database.
- All 70 completed tickets were backfilled: 43 Pre-batch, then 4 / 5 / 5 / 8 /
  5 across batches 1 to 5. The five batch 6 tickets are tagged, and the three
  unbatched backlog tickets carry V3 with no batch.
- The batch boundaries are anchored, not guessed. The user's own calendar
  screenshot of "Backlog batch 2" lists five bullets that match completion
  orders 44–48 exactly, which fixes batch 2 and therefore the numbering on
  either side of it. Batch 4 is 54–61 and batch 5 is 62–66, both confirmed
  against their merge commits.
- Deferred tickets are deliberately left without a Version, except the two
  explicitly named "V4 -". Guessing a version for an idea nobody has scheduled
  is worse than leaving it blank.

## V3 improvement — the two open credit-scene cases, decided

Recorded: 2026-10-28 15:35 EDT (-0400). Pushed to `version/3.0` (staging); merged to main (production) on
2026-10-28 after the user's approval, in the Batch 6 merge.

- The credit-scene audit left two cases for the user rather than deciding
  them. Both are now settled, and together they sharpen the rule: what counts
  is a **physical, in-story appearance by the performer** — not a mention, not
  footage shown on a screen inside the film, and not invalidated by a later
  reveal that the character was someone else in disguise.
- **Nick Fury stays in Spider-Man: Far From Home.** The Fury on screen through
  the main feature is Talos impersonating him, which the post-credits scene
  reveals. Samuel L. Jackson is in the film; the reveal changes who the
  character was, not whether the performance is there. No data change.
- **Steve Rogers leaves Spider-Man: Homecoming.** He appears only through a
  series of low-budget in-universe educational videos and a post-credits gag,
  never as a physical live-action presence in the story. Being shown on a
  screen inside the film is not being in it.
- That is the audit's 19th removal, across 13 titles. Rogers drops from 10
  titles to 9. No character was left with zero titles.
- Verification: `test-pickperson`, `test-variant`, `test-suggest` and
  `test-ctxfn2`, all `errors: []`. The full `qa/regress.sh` was still running
  when this was committed; nothing is pushed until it is green.
- Limits: no new browser pass for this one-entry change; it rests on the
  checks and on the earlier desktop pass for the audit as a whole.

## V3 improvement — credit-scene-only cast comes out of the catalog

Recorded: 2026-10-28 15:30 EDT (-0400). Pushed to `version/3.0` (staging); merged to main (production) on
2026-10-28 after the user's approval, in the Batch 6 merge.

- Rule, set by the user: a character counts for a title only if they appear
  in the **main feature**. A character whose sole appearance is a mid- or
  post-credit scene leaves that title's `cast`, which also removes the
  connection line it drew. No new field: membership in `cast` is the whole
  mechanism, so nothing in the app had to learn a new concept.
- 18 cast entries removed across 12 titles — Nick Fury from Iron Man, Thor
  and Infinity War; Bruce Banner from Iron Man 3, Captain Marvel and
  Shang-Chi; Carol Danvers from Infinity War, Shang-Chi and Ms. Marvel;
  Steve Rogers and Bucky Barnes from Ant-Man; Wanda from The Winter Soldier;
  Thor from Doctor Strange; Bucky from Black Panther; Steve, Natasha and
  Rhodes from Captain Marvel; Scott Lang from Deadpool & Wolverine.
- Two are not credit-scene cases at all: **Carol Danvers never appears in
  Infinity War** (only her insignia on the pager), and **Scott Lang is not in
  Deadpool & Wolverine** (a giant Ant-Man corpse is; Paul Rudd is not in the
  film). Both are removed as absent.
- Two of the audit's starting assumptions were wrong and are recorded as
  such. **Sam Wilson stays in Ant-Man**, though the ticket named him: Falcon
  fights Scott Lang at the Avengers facility in the main feature. **Tony
  Stark stays in The Incredible Hulk**: his bar scene with Ross plays before
  the credits and is the last scene of the main feature, however often it is
  described as a post-credits scene.
- Counts drop accordingly: Fury 14 → 11, Carol 7 → 4, Banner 12 → 9, Steve
  12 → 10, Bucky 12 → 10, Thor 12 → 11, Rhodes 11 → 10, Natasha 10 → 9,
  Scott 10 → 9, Wanda 9 → 8. No character was left with zero titles.
- Every removal is sourced in docs/CATALOG-SOURCES.json under
  `creditSceneAudit`, with the reasoning and the kept cases in
  docs/CATALOG-AUDIT.md.
- Verification: full `qa/regress.sh` — **22 of 22 clean, exit 0** — including
  `test-pickperson` (166 subjects), `test-variant` and `test-suggest`. Then
  checked in a real desktop browser: Ant-Man reads 5 cast with Sam Wilson
  present and Rogers and Barnes gone, Captain Marvel 2, Shang-Chi 3 with Wong
  kept, Iron Man 4 with Rhodes still credited to Terrence Howard.
- Limits: the browser pass was **English and desktop only**; Portuguese and
  phone widths rest on the headless checks. Two judgement calls are flagged
  open rather than decided — Fury in Far From Home (the one on screen is
  Talos) and Rogers in Homecoming (he appears only in in-universe PSAs). The
  unreleased titles have provisional casts and were not audited, and Marvel
  Zombies was not checked scene by scene.

## V3 workflow — the calendar recap format, so it pastes with its formatting

Recorded: 2026-10-28 15:30 EDT (-0400). Pushed to `version/3.0` (staging); merged to main (production) on
2026-10-28 after the user's approval, in the Batch 6 merge.

- The recap the user pastes into their Notion Calendar event was specified
  inside a code fence, so it reached them as plain text and pasted
  unformatted — the exact problem the format exists to prevent. It is now
  specified as ordinary chat text with real Markdown bold.
- The shape is a title line carrying the version, batch number and a short
  keyword phrase, then **one bullet per ticket** opening with a bold Fixed /
  Improved / Added label. The date, duration and commit-count lines are gone:
  the calendar event itself holds the time.
- Recorded that the assistant can create the event directly on the user's
  Google Personal calendar through the Notion calendar tools, and that doing
  so is an outward-facing action to offer rather than perform unasked.
- Verified by creating the batch 4 and batch 5 events. **Two limits found and
  worth knowing:** the connector strips HTML from the description, so bold
  labels arrive as plain text, and neither the create nor the update tool has
  a colour field, so the event colour must be set by hand.

## V3 fix — a recast cast row shows the credited performer's face, or none

Recorded: 2026-10-28 13:29 EDT (-0400). Pushed to `version/3.0` (staging); merged to
main (production) after user approval, 2026-10-28 15:10 EDT
(`ca3112d`).

- Correcting the per-title credits left the right name under the wrong face:
  `MEDIA.actors` is keyed by character, so Iron Man read "Terrence Howard"
  beside Don Cheadle's photo. A right name under a wrong face is worse than
  both being wrong together.
- `MEDIA.performers` maps a performer name to a TMDB profile path.
  `castPortrait(title, charId)` uses the character's portrait when the credited
  performer is the default, the performer map when it is not, and `null`
  otherwise — which `Portrait` already renders as initials, so an unknown
  performer costs a face rather than borrowing someone else's.
- `performerPortrait(name, repCharId)` does the same for the pinned banner and
  the phone pill, keeping the character's portrait when that character's
  default performer *is* the pinned person. Without it, pinning Jonathan
  Majors would have lost his photo even though Kang's portrait is his face.
- Four profile paths were each verified against that person's own credits
  before use, then confirmed to return 200. Mike McGill is deliberately
  absent: the only TMDB person of that name has no profile photo and no
  What If…? credit, so it is someone else, and What If…? shows initials.
- Verification: new `qa/test-portrait.js` (9 cases, all `errors: []`) and the
  full `qa/regress.sh` — 22 of 22 clean.
- Limits: the check asserts the resolver, not rendered pixels, because
  external images are blocked in these runs. No real browser load of a
  recast title's drawer is claimed by this entry.

## V3 improvement — a pan coasts to a stop instead of stopping dead

Recorded: 2026-10-28 13:14 EDT (-0400). Pushed to `version/3.0` (staging); merged to
main (production) after user approval, 2026-10-28 15:10 EDT
(`68b1953`).

- A drag now ends with a short inertial glide on both the mouse and the touch
  path. Velocity is sampled from the last few moves rather than the whole
  drag, capped, and decays exponentially, settling in about a third of a
  second. A slow release places the canvas rather than throwing it.
- Any press, touch or wheel on the viewport stops the glide exactly where it
  is, so the canvas is never moving when you reach for it.
- This **reverses** the earlier rule that a manual pan must stop instantly;
  the comment beside `glideTo` was rewritten rather than left contradicting
  the code (docs/decisions.md).
- Verification: new `qa/test-inertia.js` (deceleration on release, and a dead
  stop when grabbed), plus `qa/test-camera.js`, which needed a new
  `settleCanvas()` because it had been snapshotting a camera position
  mid-glide. Full `qa/regress.sh` clean.
- Limits: the deceleration constants were chosen by eye on a trackpad. How
  the throw feels under a finger on a real phone is **not** verified.

## V3 fix — per-title performer credits

Recorded: 2026-10-28 12:56 EDT (-0400). Pushed to `version/3.0` (staging); merged to
main (production) after user approval, 2026-10-28 15:10 EDT
(`5d153f0`, `41e61aa`).

- One `actor` per character leaked the current performer into every title:
  Iron Man credited Don Cheadle as Rhodes, and The Incredible Hulk credited
  Mark Ruffalo and Harrison Ford. A title may now carry `credits` (character
  id to performer) and `CHARACTERS[id].actor` is only the default.
- `window.MCU_credit(title, charId)` resolves it. The character's identity,
  colour and connection thread are untouched, so the arc stays continuous.
- Search suggestions are built per title, not per character, so searching
  either performer returns that performer's own titles and no others. A
  performer pins as themselves unless they are that character's whole run —
  Terrence Howard plays Rhodes in one title of eleven, so pinning him must
  not open the other ten.
- Eight titles were sourced: Rhodes (Terrence Howard), Banner (Edward
  Norton), and Ross (William Hurt ×5, Mike McGill, Travis Willingham).
- Verification: `qa/test-pickperson.js` picks every actor and character from
  the search — 166 subjects, all opening the pinned widget. Full
  `qa/regress.sh` clean.
- Limits: **the audit is not finished.** What If…? lists 31 cast members and
  only Ross is corrected; Tony Stark, Steve Rogers, Natasha Romanoff and
  Peter Parker are voiced by different performers there and still carry
  their live-action defaults, as do Marvel Zombies' ten. Those remain open on
  the ticket.

## V3 maintenance — ignore editor swap files

Recorded: 2026-10-28 12:28 EDT (-0400). Pushed to `version/3.0` (staging); merged to
main (production) after user approval, 2026-10-28 15:10 EDT
(`b5e9bf7`).

- An open vim session leaves `.<name>.swp` beside the file; `git difftool -y
  -x vimdiff` produced one in the worktree. `*.swp` is now ignored.

## V3 fix — the phone document no longer scrolls behind the app shell

Recorded: 2026-10-28 12:27 EDT (-0400). Pushed to `version/3.0` (staging); merged to
main (production) after user approval, 2026-10-28 15:10 EDT
(`3413caf`).

- Dragging up from the bottom nav scrolled the page behind the app, exposing
  a band below it. `html, body` now take `min-height: 100vh` then
  `100dvh` — `100vh` is the *largest* viewport, excluding collapsed browser
  chrome, while `100dvh` is what is actually visible — and below 900px they
  are locked to `height: 100%` with `overflow: hidden` and
  `overscroll-behavior: none`.
- Verification: new `qa/test-mviewport.js` asserts the document does not
  scroll behind the shell at phone sizes. Full `qa/regress.sh` clean.
- Limits: **headless Chromium treats `100vh` and `100dvh` alike**, so the
  symptom itself cannot be reproduced or disproved there. The check proves
  the lock is applied, not that the band is gone. Real iPhone Safari is not
  checked.

## V3 fix — test-camera is reliable, and its assertions now count

Recorded: 2026-10-28 12:27 EDT (-0400). Pushed to `version/3.0` (staging); merged to
main (production) after user approval, 2026-10-28 15:10 EDT
(`00894d8`, `53412fb`).

- `test-camera` failed at "sort change while selected", and separately
  reported a false "wheel cancels the glide" about one run in four. Both were
  the check, not the app. `page.mouse.click` moves the cursor and presses in
  the same tick; hovering a card re-lays the canvas out, so the press landed
  after the cards had shifted. Card clicks now go through `clickCard()`, and
  the two that must open a card through `openCentreCard()`, which waits for
  the drawer and re-measures. The glide steps guessed at 60ms and 80ms; they
  now wait for the transition to appear and to clear.
- `qa/regress.sh` only reads fields whose name contains `errors`, so
  `test-camera`'s six standalone booleans gated nothing — a run could report
  clean with `glideCancelledByWheel=False`. They are collected into
  `assertErrors`. Recorded in qa/README.md: an assertion that is not in an
  errors field is decorative.
- Verification: repeated `test-camera` runs, then the full `qa/regress.sh` —
  22 of 22 clean, exit 0.
- Limits: this is development tooling; no app behaviour changed in these two
  commits.

## V3 maintenance — the regression run reports failures instead of passing in silence

Recorded: 2026-10-28 11:14 EDT (-0400). Pushed to `version/3.0` (staging); merged to
main (production) after user approval, 2026-10-28 11:30 EDT
(`b28c271`; development tooling only, no app files changed).

- `qa/regress.sh` wrapped every check in GNU `timeout`, which is part of
  coreutils and ships with neither macOS nor this machine. Each check exited
  "command not found", the grep matched nothing, and the run reported success
  in about two seconds having started no browser. It now falls back to
  `gtimeout` and then to perl's `alarm`.
- Four checks print their JSON indented, so a non-empty errors array spans
  lines. The single-line pattern could not match one and fell back to matching
  zero digits, printing a bare `"desktopErrors": ` that read exactly like an
  empty array. Output is flattened before matching, and a field must hold `[]`
  or a real number.
- The run marks anything that is not `[]` or `0` with `!!`, fails a check that
  exits non-zero or prints no errors field, and exits non-zero overall.
- Verification: the reporting logic was exercised against six output shapes
  (empty and non-empty indented arrays, the documented warning, zero, a
  non-zero count, and a crash with no JSON). It found a real failure on first
  use — `test-camera` fails at "sort change while selected" on unmodified code
  too, which the old script swallowed; raised as its own ticket, not fixed here.
- Limits: no real-device work is claimed by this entry. The second half of its
  ticket, current iPhone/Safari and Android evidence, is not done.

## V3 improvement — "Lançamento" and "Lançado" replace "Estreia" in Portuguese

Recorded: 2026-10-28 11:15 EDT (-0400). Pushed to `version/3.0` (staging); merged to
main (production) after user approval, 2026-10-28 11:30 EDT
(`088b9c1`).

- "Estreia" alone reads as something still to come, the opposite of what the
  release sort means. `sort.release` becomes "Lançamento";
  `sort.short.release` and `list.col.release` become "Lançado", which fits the
  phone sort tabs and the desktop compact span beside Crono, Fase, A–Z, IMDb
  and RT, where "Lançamento" at ten characters would not.
- **The commit message on `088b9c1` is wrong.** It says the short label became
  "Saiu", because that is what the agent set and verified. The maintainer
  edited the file to "Lançado" for both keys while the batch was being
  prepared, and the agent staged the file without re-reading it, so the commit
  shipped "Lançado" under a message describing "Saiu". The message cannot be
  corrected in place now that it is in production; this entry is the record.
- Verification: the earlier run covered the "Saiu" wording. What actually
  shipped was re-checked afterwards: `test-fit` in Portuguese (24 fields, all
  `errors: 0`), `test-i18n`, `test-dlist`, and the painted label read back at
  1440, 390 and 320px with no horizontal overflow. "Lançado" is seven
  characters, the same length as the "Estreia" it replaces.
- Limits: not viewed by eye in a real browser; whether "Lançado" reads well to
  a Brazilian user is a judgement the maintainer owns, and in this case made.

## V3 fix — the guest sign-in reminder stays true to the saved collection

Recorded: 2026-10-28 11:15 EDT (-0400). Pushed to `version/3.0` (staging); merged to
main (production) after user approval, 2026-10-28 11:30 EDT
(`6d74b0c`).

- The reminder captured its mark count at the tap, so undoing that mark during
  its delay left it opening anyway with a number the collection no longer had.
- The cause runs deeper than the count: the toast's `undo()` calls `setStatus`
  directly and never goes through `emitStatusChange`, so the reminder could not
  learn about a removal on that path at all. It now reads the live collection
  when the reminder comes due, and hands its stage back if the marks are under
  the threshold again.
- Verification: new `qa/test-nudgeundo.js`. Against unmodified code the check
  cannot finish, because the reminder's scrim blocks the next mark.
- Limits: guest only, signed out; no live Google OAuth. Only the 3-mark
  threshold was driven end to end, not the 10.

## V3 fix — Spatial touch, portrayal scope, performer pins and Escape

Recorded: 2026-10-28 11:15 EDT (-0400). Pushed to `version/3.0` (staging); merged to
main (production) after user approval, 2026-10-28 11:30 EDT
(`87ccb33`). Four tickets in one commit: they edit overlapping lines in the same
functions, and each later one corrected the earlier before any of it was
committed, so separate commits would have recorded states already known wrong.

- **Touch follows the device, not the window width.** The canvas attached its
  touch handlers from a 900px layout breakpoint, so a touch laptop or a tablet
  in landscape took the desktop layout and lost pan and pinch altogether. It
  now reads `navigator.maxTouchPoints` and `(any-pointer: coarse)`. Mouse and
  wheel are untouched, and mouse events synthesized within 400ms of a touch are
  ignored so a background tap cannot step back twice.
- **A selected character means one exact portrayal.** "Peter Parker (Raimi)"
  offered 1 title and opened Tom Holland's 13. The pin's scope is now keyed by
  the exact character; a separate prime-keyed map keeps the connection
  threading, so arcs like Kang's stay continuous. It also narrows Kang 3→1,
  Peggy Carter 10→6, Vision 7→6, Captain Carter 10→4, White Vision 7→2.
- **A pin is one portrayal or a performer.** Picking an actor who plays several
  characters pins the performer — the union of their own roles' titles, named
  as themselves. This restored the widget for Jonathan Majors, Hayley Atwell
  and Paul Bettany, and gave it to Robert Downey Jr., who had never had it.
- **Escape clears the pin**, last in the ladder. The details rung and the pin
  rung share one listener, because two listeners both see the same press and
  React re-renders between them.
- Verification: new `test-widetouch`, `test-variant`, `test-pickperson` and
  `test-escpin`, each run against an unmodified copy of the previous tree as
  well. `test-pickperson` is a full pass over all 84 characters and all 79
  actors: 163 of 163 open the widget with the right count, against 162 and 14
  wrong counts before.
- Limits: **no real-device verification.** The wide-screen touch fix was
  exercised with emulated touch at 1440×900 only; a real touch laptop or an
  iPad in landscape, including orientation changes, has not been tried, and
  that is the first acceptance criterion of its ticket. The pick pass is
  desktop and English only.

## V3 workflow — Approved status, new checks in the regression run, verification log

Recorded: 2026-10-28 11:15 EDT (-0400). Pushed to `version/3.0` (staging); merged to
main (production) after user approval, 2026-10-28 11:30 EDT
(tooling and documentation; no app files changed).

- Notion **V3 Tasks** gains an **Approved** status between Awaiting review and
  Blocked. The maintainer sets it; it clears that ticket's current revision to
  be committed and pushed to staging, never a merge to `main`, and it lapses if
  the work changes. AGENTS.md records the rule and asks agents to ship anything
  already Approved at the start of a session.
- The five new checks join `qa/regress.sh`, taking the run from 14 to 19
  checks (about 20 minutes). `qa/README.md` gains a Reporting section and a
  corrected account of the `test-camera` failure.
- `.gitignore` now ignores a root `shots/`. Checks resolve their screenshot
  path relative to the working directory, so running one from the repository
  root, as qa/README.md says to, wrote PNGs outside the ignored `qa/shots/`.
- `docs/V3-VERIFICATION.md` gains the batch 4 checkpoint and
  `docs/decisions.md` the decisions behind each change.
- Expected result of a full run right now is **18 of 19**, with `test-camera`
  the only failure, for a reason that predates this batch.

## V3 workflow — QA checks in the repository; no-build rule with a V4 exit

Recorded: 2026-10-28 08:55 EDT (-0400). Pushed to `version/3.0` (staging); merged to
main (production) after user approval, 2026-10-28 11:30 EDT
(tooling and documentation only; no app files changed).

- New `qa/`: the curated headless checks used during V3. That is the 14-check
  regression run (`qa/regress.sh`), the axe-core scan (`qa/a11y-scan.js`), a
  startup timing check and one targeted check per recent fix, all serving the
  repository root. Its own `package.json` pins Playwright 1.63.0 and axe-core
  4.10.2; `qa/setup.sh` installs them and fetches the pinned app libraries.
  `.gitignore` keeps installs out of Git; new `.vercelignore` keeps `qa/` off
  the deployed site.
- Rule recorded in AGENTS.md and docs/decisions.md: the V3 app stays build-free
  (`qa/` is the one development-only npm exception); V4 moves to a standard
  build step as one planned migration. AGENTS.md now asks agents to run the
  regression and axe scan before handing work over. README and HANDOFF updated.
- Verification: in a fresh copy of the repository, setup steps and
  `qa/test-panel.js` passed (no errors); Git ignores the installed packages. The
  full `qa/regress.sh` run was still in progress at push time; its result is
  recorded on the Notion ticket.

## V3 workflow — handoff to Claude Code

Recorded: 2026-10-28 08:39 EDT (-0400). Pushed to `version/3.0` (staging); merged to
main (production) after user approval, 2026-10-28 11:30 EDT
(documentation only).

- AGENTS.md rewritten as a self-contained, agent-neutral rulebook: stack and
  load order, local commands (no install or build; `python3 -m http.server`
  on 8123, 8126 for sign-in), staging/production flow and approvals, commit and
  CHANGELOG rules with real git times, the Notion V3 Tasks workflow (board
  priority, screenshots, statuses, completion time and order), the calendar
  recap, design/accessibility/keyboard standards, deferred work (Phase 6 waits
  on a custom domain) and secrets.
- New docs/HANDOFF.md (state, architecture, decisions, quirks, open threads) and
  docs/decisions.md (decision log). The 2026-10-24 handoff sections in V3-SPEC.md,
  V3-TASKS.md and KICKOFF-PROMPT.md are labelled historical; README lists the
  new docs.
- Verification: documents reviewed against the code, git state, CHANGELOG and
  the Notion board; no application files changed.

## V3 improvement — Spatial cards from the keyboard

Recorded: 2026-10-27 23:26 EDT (-0400). Pushed to `version/3.0` (staging); merged to
main (production) after user approval, 2026-10-27 23:30 EDT.

- On desktop each Spatial card starts with an invisible button over the whole
  card, so Tab reaches the card before its Seen/Watchlist buttons and Enter or
  Space opens it; pointer clicks pass through to the card as before. A card
  tabbed to off-screen glides into view, the clipped canvas never scrolls, and
  Escape from its details returns focus to it.
- Verification: headless Chromium, 1440×900. First Tab into a card lands on the
  card (it used to land on Seen) with the ring around the whole card; 20 more Tabs
  go card, Seen, Watchlist… with every card in view; Enter opened Thor: The
  Dark World with focus on its title and Escape returned focus to the card; a
  mouse click opens without a ring. Full regression suite and axe scan pass.
- Limits: Tab follows catalog order rather than on-screen position; phones
  unchanged.

## V3 improvement — favicon, home-screen icon and link previews

Recorded: 2026-10-27 23:26 EDT (-0400). Pushed to `version/3.0` (staging); merged to
main (production) after user approval, 2026-10-27 23:30 EDT.

- New `favicon.png`, `apple-touch-icon.png` and `og-image.jpg` (1200×630),
  rendered from the app's brand mark with no studio imagery. `index.html` adds a
  description, theme colour, icon links, Open Graph and `twitter:card` tags; no
  manifest or service worker.
- Verification: headless Chromium, desktop and phone: all three files served
  and linked, no console errors; icon checked at 32 and 16 px.
- Limits: the description is English (crawlers do not run scripts); `og:image`
  points at production, so previews work once this reaches main.

## V3 improvement — Escape and keyboard focus for desktop details

Recorded: 2026-10-27 23:26 EDT (-0400). Pushed to `version/3.0` (staging); merged to
main (production) after user approval, 2026-10-27 23:30 EDT.

- Escape closes the open desktop details and selection unless the pair view,
  a text field, or an open menu, popover or dialog claims it first (listened in
  the capture phase so an open menu is still seen). Details opened from the
  keyboard move focus to their title and give it back to the opener on close;
  mouse and touch opens leave focus alone, so no focus ring appears (revised
  after review).
- Verification: headless Chromium. List: Enter → focus on the title, Escape →
  closed with focus back on the row; Escape in the search box or with the
  account menu open only closes those; Spatial: Escape closes the selection;
  pair view first leaves the pair. A mouse open leaves no outline. No console
  errors.
- Limits: after the pair view, closing does not return the camera to its
  pre-selection position; not tried with a screen reader.

## V3 improvement — page landmarks and List column labels

Recorded: 2026-10-27 23:26 EDT (-0400). Pushed to `version/3.0` (staging); merged to
main (production) after user approval, 2026-10-27 23:30 EDT.

- The app name is the page's `<h1>`; the desktop toolbar and phone app bar are
  the banner; the Spatial canvas, the List or the phone's main area is `main`.
  The List's blank poster and actions headers get screen-reader-only labels
  (new keys `list.col.poster`, `list.col.actions`).
- Verification: axe-core on the same 7 screens in both languages reports no
  violations of any kind; screenshots are pixel-identical before and after.
- Limits: not tried with VoiceOver or NVDA.

## V3 improvement — readable muted text and RT tags

Recorded: 2026-10-27 23:26 EDT (-0400). Pushed to `version/3.0` (staging); merged to
main (production) after user approval, 2026-10-27 23:30 EDT.

- `--text-muted` `#5c6278` → `#8389a1` (2.67–3.23:1 → 4.66–5.63:1 across the
  app's surfaces) and `--text-dim` `#8a90a6` → `#9ea4b8` so it stays a step
  brighter. The RT tag red `#fa320a` → `#cc2a0a` (white text 3.80 → 5.38:1). List
  cast initials pick dark or white text by the character colour.
- Verification: axe-core 4.10 on 7 screens (desktop Spatial, details, List,
  account menu; phone List, details, Spatial): `color-contrast` failures 61 → 0
  (English), 60 → 0 (Portuguese). Before/after screenshots checked; sizes and
  layout unchanged.
- Limits: text over poster art keeps its own semi-opaque backing and was not
  flagged; not checked on physical screens.

## V3 improvement — selected title drawn larger in the Spatial ring

Recorded: 2026-10-27 22:20 EDT (-0400). Pushed to `version/3.0` (staging); merged to
main (production) after user approval, 2026-10-27 22:21 EDT.

- On desktop, the title at the centre of an open connection ring is drawn 18%
  larger (its existing lift scale), above its neighbours. Phones keep their
  compact ring unchanged.
- Verification: headless Chromium. Rings for Iron Man 2, Endgame and Shang-Chi:
  1.18× with 17–22 px to the nearest card and no overlaps; phone sizes unchanged.
  Screenshot checked; Spatial regression scripts pass.
- Limits: a larger centre card on phones would need a wider phone ring.

## V3 improvement — startup screen with failure recovery

Recorded: 2026-10-27 22:20 EDT (-0400). Pushed to `version/3.0` (staging); merged to
main (production) after user approval, 2026-10-27 22:21 EDT.

- `index.html` shows the brand, a spinner and a localized "Loading…" inside
  `#root` until React's first render replaces it, instead of a blank page. New
  `boot.js` (loaded first) turns it into "couldn't start" with Reload when a
  script fails to load or startup errors, and into a "taking longer than usual"
  note after 25 s. Locale files and `i18n.js` now load before the CDN scripts.
- Verification: headless Chromium. Normal start in English and Portuguese; React
  blocked and a tampered ReactDOM (SRI) both show the failure screen; a JSX
  compile error in one file shows it only until the app renders; a held-back
  Babel shows the slow note after a fast-forwarded 25 s. Image and font failures
  never trigger it. All 14 regression scripts pass with this batch.
- Limits: if even the locale files fail, the Reload button shows ↻ with an
  English accessible name. Caching of HTML and scripts on Vercel is unchanged.

## V3 improvement — click empty canvas to close a desktop selection

Recorded: 2026-10-27 22:20 EDT (-0400). Pushed to `version/3.0` (staging); merged to
main (production) after user approval, 2026-10-27 22:21 EDT.

- In desktop Spatial a click on empty background (not a drag) now steps back one
  level: out of the pair view, or else closes the selected title and its
  details, as a background tap does on phones. Cards, lines and on-canvas
  controls keep their own clicks.
- Verification: headless Chromium, 1440×900. A drag keeps the selection; a click
  closes it and the drawer and returns the camera to its exact earlier position;
  a connection line still opens the pair view, which a background click leaves
  (a second click closes the drawer); clicking another card switches the
  selection. No console errors.
- Limits: not checked on a trackpad or touch laptop.

## V3 fix — Spatial explains an empty result

Recorded: 2026-10-27 22:20 EDT (-0400). Pushed to `version/3.0` (staging); merged to
main (production) after user approval, 2026-10-27 22:21 EDT.

- When a search or filter leaves no titles, Spatial (desktop and phone) shows
  "No titles match" with one button that clears the search, the filters or both,
  instead of a blank canvas. The phone's "Tap a title" hint hides meanwhile. New
  key `empty.clearBoth` in both languages; collection dimming is unchanged.
- Verification: headless Chromium. Desktop "zzzz" → "Clear search" restores 64
  titles; Phase 1 + "Endgame" → "Clear search and filters" restores 64; phone in
  Portuguese shows "Limpar busca" centred and hides the hint. Screenshots checked;
  no console errors.
- Limits: not checked on a physical phone.

## V3 fix — search matches with or without accents

Recorded: 2026-10-27 22:20 EDT (-0400). Pushed to `version/3.0` (staging); merged to
main (production) after user approval, 2026-10-27 22:21 EDT.

- One shared `MCU_I18N.fold()` (case and accents removed) now drives the search
  filter behind Spatial, List and Grid, the suggestions and the highlights. Before,
  suggestions ignored accents but the filter did not, so "Capitao" suggested
  Captain America titles and then showed none. Highlights map folded matches back
  to the original text, so "capitao" marks "Capitão".
- Verification: headless Chromium, desktop Spatial and List, phone List and Grid,
  English and Portuguese. "Capitao" 0 → 4 results (4 suggestions), "capitao
  america" 0 → 4, "Viuva" 0 → 1; accented queries, actors and character names
  unchanged. No console errors; regression scripts pass.
- Limits: punctuation still matters ("homem formiga" without the hyphen finds
  nothing, in suggestions and results alike).

## V3 improvement — production React and ReactDOM builds

Recorded: 2026-10-27 21:28 EDT (-0400). Pushed to `version/3.0` (staging); merged to
main (production) after user approval, 2026-10-27 22:21 EDT.

- `index.html` loads the production UMD builds of React and ReactDOM 18.3.1
  instead of the development builds, with the same pinned version,
  `crossorigin` and new SRI hashes computed from the npm package files (the
  same method reproduces the old development hashes exactly). No npm, bundler
  or precompile step.
- Verification: headless Chromium, which enforces the SRI on every load.
  About 214 KB less to download (gzipped). First title on screen locally:
  desktop 3.5–4.1 s → 3.3–4.0 s; slowed-phone runs too noisy to show a
  difference. Spatial panning with the CPU slowed 4×: 16–17 → 24–31 fps at the
  default zoom and 13 → 28–29 fps fully zoomed out. All 14 regression scripts
  pass on the four changes together; `test-camera` logs one desktop
  passive-listener warning that the unchanged base logs too.
- Limits: React's development warnings no longer appear in the console on the
  live site. Not measured on a real network or device.

## V3 fix — fallbacks for posters and cast photos that fail to load

Recorded: 2026-10-27 21:28 EDT (-0400). Pushed to `version/3.0` (staging); merged to
main (production) after user approval, 2026-10-27 22:21 EDT.

- A poster that fails to load now shows the generated poster art instead of a
  broken image with spilling alt text. A cast photo that fails shows the
  character's initials, in the desktop details, phone details and character
  pills (new shared `window.Portrait`; the desktop List already had this).
  Failed addresses are remembered for the session, so they are not requested
  again when a card or sheet comes back.
- Verification: headless Chromium, desktop and phone. With images blocked,
  16 broken posters on desktop and 31 on the phone became generated art (0
  broken), and all 5 portraits in details showed initials without overflow.
  With images served, all posters and portraits render as images. Reopening
  details makes no new requests for failed images. Regression scripts pass.
- Limits: an image that fails while briefly offline stays on the fallback until
  the page is reloaded. The Google account avatar is unchanged.

## V3 fix — browser Back closes phone sheets

Recorded: 2026-10-27 21:28 EDT (-0400). Pushed to `version/3.0` (staging); merged to
main (production) after user approval, 2026-10-27 22:21 EDT.

- Back now closes the open phone sheet (details, Filters, Account, About, the
  welcome sheet and the sign-in reminder) instead of leaving the app. Each sheet
  owns one history entry (`pushState`/`popstate`, no router). Closing a sheet
  any other way steps back over its entry, a sheet that hands off to another
  (Account → About) reuses it, and an entry left by Forward or a reload is
  reused rather than duplicated.
- Verification: headless Chromium, phone viewport. Details → Back closes it
  and stays in the app; Forward reopens nothing; five open/close cycles leave
  history length unchanged; Escape and Back both close Filters cleanly; Account
  → About → Back closes About, and the next Back leaves the app; Back closes the
  first-visit welcome sheet; desktop adds no history entries. Regression
  scripts pass.
- Limits: not tried on a physical phone or with the system swipe-back gesture;
  the Google sign-in return was not exercised end to end. Desktop dialogs and
  the details drawer are unchanged.

## V3 fix — zoomed-out Spatial no longer exhausts phone memory

Recorded: 2026-10-27 21:28 EDT (-0400). Pushed to `version/3.0` (staging) for
testing on a phone; merged to main (production) after user approval,
2026-10-27 22:21 EDT.

- Phones could reload or crash when panning Spatial zoomed out to about 5–10%.
  It was graphics memory, not a script error: the whole canvas was one GPU
  layer (12,687×2,595 at full size) and every card, badge and seen-title wash
  had its own layer as well, all on screen at once when zoomed out.
- Cards are now positioned with a 2D transform and no `will-change`; the canvas
  keeps its GPU layer only at 30% zoom and above (`LAYER_MIN_SCALE`) and below
  that is drawn at screen resolution. Spatial cards no longer use backdrop
  blur (the badges are opaque enough), and the seen wash desaturates the poster
  itself instead of using a backdrop filter.
- Verification: headless Chromium, 390×844 at 3× pixel density. At minimum zoom
  223 compositor layers covering about 37 million pixels became 6 layers
  covering 0.4 million; at the default zoom 340 became 8. Desktop Spatial
  screenshots differ in 0.07% of pixels (anti-aliasing). Pan frame rate with
  the CPU slowed 4× is unchanged at the default zoom and lower when fully zoomed
  out with development React (23 → 17 fps). Regression scripts pass; two that
  parsed `translate3d(` now accept both forms.
- Limits: iOS Safari could not be run here, so the crash itself was not
  reproduced; confirmation is pending on a real phone. Below 30% zoom each pan
  frame is redrawn rather than moved as a cached layer.

## V3 fix — Spatial rings hide unrelated cards

Recorded: 2026-10-26 22:01:32 EDT (-0400).

- While a selected title's rings are showing in Spatial, unrelated cards fade
  out in place (no clicks, no tab stop) instead of staying dimmed under the
  ring, which was most visible in the A–Z and Phase grids. They fade back when
  the selection closes; nothing reflows. Lines are drawn among the ring's
  titles only, so none lead to a hidden card. The pair view and a title with no
  connections are unchanged.
- Phones: closing the rings by tapping the background no longer lets the
  browser's follow-up click select the card that reappears under the finger.
- Verification: headless Chromium.
  - Desktop A–Z with Black Panther: Wakanda Forever: 7 visible cards, 57
    hidden, no overlaps, no lines to hidden cards, all 64 back after closing.
  - Desktop Release with Iron Man 2: 24 visible, no orphan lines.
  - Phone A–Z: same result; a tap on empty space over a hidden card closes the
    selection without selecting anything.
  - No console errors; regression scripts and the label test pass.
  - Screenshot reviewed by the user, who approved committing and merging to
    main.
- Limits: an unrelated title can't be clicked while the rings are showing
  (close the selection first). Not checked on a physical phone.

## V3 feature — guest sign-in reminder

Recorded: 2026-10-26 21:39:35 EDT (-0400).

- A signed-out guest (when Google sign-in is available) is reminded that
  signing in saves their list to an account and syncs it across devices: about
  1.4s after the tap that brings their seen + watchlist marks to 3, and once
  more at 10, never again after that and never on page load
  (`mcu.signInNudge.v1`). It waits until any open sheet or dialog closes.
- Dialog on desktop and sheet on phones, in the About style: "Keep your list on
  every device", how many titles they've marked, "Everything you've marked so
  far comes with you", then Sign in with Google (with the Google mark, as in
  the account menu) and Not now. English and Brazilian Portuguese.
- `about.jsx`: the About dialog's shell (scrim, focus trap, Escape, ×, focus
  return) is now a shared `ModalDialog`; `account.jsx` exports `GoogleMark`.
- Verification: headless Chromium.
  - Desktop, fresh guest: nothing after 2 marks, shown after the 3rd, Not now
    closes it, quiet through 9, shown at 10, Escape closes it, nothing at 11 or
    after a reload.
  - Phone (Portuguese): marking from a details sheet waits until the sheet
    closes, then shows the sheet version.
  - Sign in with Google starts the Supabase Google authorize redirect; Undo on
    the status toast stays usable while the dialog is open.
  - No console errors; regression scripts pass. Test helpers mark the reminder
    as already shown unless a test asks for it.
  - Screenshots reviewed by the user, who approved committing and merging to
    main.
- Limits: a guest who already has 10+ marks sees it once on their next mark,
  then never again. A real Google sign-in wasn't completed in testing. Not
  checked on a physical phone.

## V3 improvement — Order toggle and smoother Spatial reorders

Recorded: 2026-10-26 20:47:14 EDT (-0400).

- Order (desktop toolbar and phone search row) is now a toggle: every sort has
  exactly two directions, so a tap reverses the order with no dropdown. It
  shows the current direction (Oldest, Highest, 1 → 6, A–Z…) beside a sort icon
  whose bars flip with the order. Its accessible name and tooltip say the
  current order and what it switches to (`order.toggleAria` replaces
  `order.aria`, English and Brazilian Portuguese). The Filters panel keeps its
  explicit two-option choice.
- Spatial: after a new layout (order, sort, filters, a pinned character) the
  connection lines, their labels and the row labels are hidden before the next
  paint and fade back in once the cards have finished gliding. Row labels also
  wait for the cards to return after a selected title closes, and rise slightly
  as they fade in (fade only with reduced motion).
- Phone character pill: before the first step it shows just the number of
  titles ("‹ 13 ›", read as "13 titles"), then "1/13".
- Verification: headless Chromium.
  - Toggle: desktop List Oldest ↔ Newest (first title Iron Man ↔ Avengers:
    Secret Wars, choice saved); IMDb by Enter and Space; Spatial Earliest →
    Latest; phone List Highest → Lowest with the reorder animation; phone Grid
    in Portuguese 1 → 6 ↔ 6 → 1. No dropdown opens.
  - Spatial: lines and row labels at opacity 0 while the cards move (to about
    600ms), back by about 1s, for the toggle and Release → IMDb/Chrono; row
    labels hidden while the cards return after closing a title.
  - Pill reads "13" (accessible "13 titles"), then "1/13".
  - No console errors; regression scripts and the label test pass (test-camera
    still has its known intermittent desktop timeout).
  - Videos and screenshots reviewed by the user, who approved committing and
    merging to main.
- Limits: not checked on a physical phone.

## V3 improvement — picking a character from search opens the character view

Recorded: 2026-10-26 19:07:38 EDT (-0400).

- Picking a character in the search suggestions now opens the character view,
  as if pinned from a cast list: photo, Their titles / All titles (desktop) and
  the stepper. The search box clears. An actor suggestion does the same when the
  actor plays one character (variants included). Robert Downey Jr. (Tony Stark
  and Doom) stays a text search. Title suggestions and free-text search are
  unchanged. Picking a new character while another is pinned switches to it.
  After a keyboard pick on desktop, focus moves to the stepper.
- Phone pill: before the first step it shows the number of titles (stacked "13
  / titles") instead of "–/13"; new `highlight.titlesWord` string in English and
  Brazilian Portuguese.
- Desktop banner: Their titles / All titles is now as tall as the stepper
  buttons (34px).
- Verification: headless Chromium at 1440×900 and 320/360/390px phones (English
  and Portuguese):
  - Peter Parker (Tom Holland) shows 13 titles, then › gives 1 of 13; Benedict
    Wong shows 9 titles; Wanda by keyboard pins and focuses the stepper;
    Robert Downey Jr. stays a text search; Iron Man 3 opens its details.
  - Pill counts "9 titles", "13 títulos", "1 title", then "1/9" after ›.
  - The banner switch and stepper buttons are both 34px and aligned.
  - No console errors; regression scripts pass.
  - Screenshots reviewed by the user, who approved committing and merging to
    main.
- Limits: Peter Parker (Raimi) and (Webb) are variants of Peter Parker, so
  picking them shows all of Peter Parker's titles while the suggestion says "1
  title" (same as pinning them from a cast list). At 320px long names still
  truncate in the pill. Not checked on a physical phone.

## V3 feature — folded seen titles on phones

Recorded: 2026-10-26 18:21:23 EDT (-0400).

- Phones, All tab (no character pinned, no search): each run of two or more
  consecutive seen titles gets an accordion header ("✓ 11 seen") that folds the
  run into one summary row (stacked posters, count, first – last title). Order
  never changes: a run only groups neighbours, and headings inside a folded run
  hide with it (a group that continues after it repeats its heading).
- List shows seen titles as compact rows (small poster, title, buttons side by
  side); Grid keeps full cards, with each run as its own section, and cards
  glide to their new cells when runs form or split. The Seen tab keeps full rows
  and cards.
- Rows shrink and grow when marked or unmarked, runs fold and unfold with a
  height animation, and the header morphs between bar and summary. Motion
  starts once the saved collection has loaded (new `ready` flag on the
  collection context), so the list opens already compact; none with reduced
  motion.
- Folded runs are remembered on this device (`mcu.seenFolds.v1`, not synced to
  the account) and shared by List and Grid. The folded titles are stored
  rather than runs: a run is folded when most of its titles were.
- Watchlisted titles have a thin amber outline on List rows and Grid cards
  outside the Watchlist tab.
- Folder headers fit the column (long summaries end in "…"), and the phone
  list/grid area never scrolls sideways.
- English and Brazilian Portuguese strings.
- Verification: headless Chromium at 390×760 (and 320/360/375 where noted):
  - marking Ant-Man seen shrank its row 95 → 52px over ~0.34s and merged the
    runs (11 → 13); folding hid the run; unmarking restored it;
  - folds stayed closed after a reload, matched across List/Grid switches
    without reloading, and reopened state was remembered;
  - order kept in Release, Phase, Chrono, IMDb and A–Z;
  - no horizontal overflow in 48 combinations (320/360/390 × Grid/List × four
    sorts × open/folded), where 40 overflowed before the guardrail;
  - no console errors; regression scripts pass (test-camera's known
    intermittent desktop timeout recurred once and passed on re-run).
  - Videos and screenshots reviewed by the user, who approved committing and
    merging to main.
- Limits: fold memory is per device; a Grid run ending on an odd count leaves
  the cell beside its last card empty; not checked on a physical phone.

## V3 fix — mobile stepping keeps the current title in view

Recorded: 2026-10-26 13:37:21 EDT (-0400).

- On phones, stepping through a character's titles (‹ › on the floating pill)
  in List or Grid scrolled each title flush with the scroll area's edges: from
  about the fifth result the current row sat under the pill, and stepping back
  to the first title clipped its 2px ring at the top. The scroll area now has
  scroll padding (10px at the top, and 84px at the bottom while the pill shows),
  so the browser keeps the current title clear of both. CSS only.
- Verification: headless Chromium, Wong with the IMDb sort, stepping ten times
  at 390×760 and 375×667 (List) and 390×760 (Grid): the current row went from
  60px under the pill to at least 24px clear of it, and the first title's ring
  from 2px above the scroll area to 8px inside it. No console errors; the
  regression scripts pass. Before/after screenshots reviewed by the user, who
  approved committing and merging to main.
- Limits: not checked on a physical phone or in Safari.

## V3 fix — mobile Spatial grids peek at the edges

Recorded: 2026-10-26 13:00:55 EDT (-0400).

- On phones, Spatial's grid layouts (Phase, A–Z, IMDb, RT) opened at exactly
  three columns' width, so the canvas looked complete. The opening view now
  picks a zoom (80–100% of the previous one) and top offset that keep three whole
  columns on screen while the next column and row peek past the right and bottom
  edges (allowing for the hint bar), and puts the first row below the count
  pill. Release/Chrono and grids that fit the screen are unchanged.
- Verification: headless Chromium at 360×640, 390×760 and 430×880 for Phase,
  A–Z and IMDb: three full columns in every case, right peek 21–60% and bottom
  peek 18–67% of a card, the count pill never over a card, zoom 47–57% (was
  52–62%). Regression scripts listed above pass. Before/after screenshots
  reviewed by the user, who approved committing and merging to main.
- Limits: cards open about 8–15% smaller; on short phones A–Z leaves up to
  ~70px above the first row, and at 430×880 its bottom peek is about a fifth of
  a card. Not checked on a physical phone.

## V3 Spatial — chronological eras and connection labels

Recorded: 2026-10-26 13:00:42 EDT (-0400).

- Chronological Spatial rows are in-story eras (Before 2008, 2008–2012, …
  2027–2028, from the titles' own years); an undated title stays in the era of
  the one before it, so Chrono reads as the same left-to-right staircase as
  Release (phase rows made it zigzag). Both timelines label their rows ("Phase
  1"… in phase colours, or the era years; translated), hidden while a title is
  selected, and the opening view keeps the first label clear of the count pill.
- Character labels on a hovered or selected title's connections draw in their
  own layer above the cards, at the nearest point on the line no card covers
  (or just above/below the row), with a soft shadow; pill widths come from the
  measured name, so padding is even.
- Hovering a connection line highlights the two titles it joins and names them
  in its tooltip. Clicking a line opens a pair view: the two titles move side by
  side, the rest dims and the camera glides to them; Escape, a background click,
  tapping a card or a new layout restores it. Links between titles in the same
  row arc below the row instead of running behind the cards between them.
- Hovering a character in the drawer lights only that character's lines, and
  related titles are judged by core identity (character variants such as Captain
  Carter count as Peggy Carter), so a lit line never leads to a dimmed card.
- Verification: headless Chromium at 1440×900 and 390px (pt-BR). QA sweep of
  all 64 titles × 403 cast hovers: no lit line led to a dimmed card, no console
  errors. Labels overlapping a card when hovering Iron Man 2 / The Avengers /
  with a selection: 11/14/9 before, 1/2/2 after. Pair view: Fantastic Four ↔
  Avengers: Doomsday side by side, 62 others dimmed, restored by Escape and a
  background click. Fit, context, panel, language, List, suggestions, layering,
  animation, celebration, alignment, About, welcome and camera scripts pass; the
  camera script fails intermittently (about 1 in 4 runs) at a timing-dependent
  step on both this and the previous revision. Screenshots reviewed by the user,
  who approved committing and merging to main.
- Limits: the pair view and line tooltips were checked on desktop only (lines
  are hard to tap on phones); a few labels can still sit on a card when many
  share one spot. Notion screenshots on the tickets could not be opened by
  Claude, so the states were reproduced in the app.

## V3 feature — Seen/Watchlist counters and celebrations

Recorded: 2026-10-26 10:39:08 EDT (-0400).

- Count badges on Seen and Watchlist in the collection switch (desktop and
  phones): green and amber, hidden at zero and never on Unseen; they pop in when
  they first appear and bump with the number rolling up or down (not on load).
- Marking a title seen or adding it to the watchlist pops the tapped button with
  a coloured ring (lifted above the neighbouring button so the ring is never
  hidden) and shows a toast with Undo (restores the previous state, including the
  watchlist) and dismiss, paused while hovered or focused. Removals only update
  the counters. The toast stays clear of the desktop drawer, the phone sort bar
  and character pill, moves to the top while a phone sheet is open, and renders
  outside the app so sheets don't block Undo.
- Confetti only for milestones newly completed by the tap: every released title
  in a phase ("Phase 1 complete!") or every released title ("You're all caught
  up!"). New `celebrate.jsx`; `tracking.jsx` announces only taps on the
  seen/watchlist buttons, never sync or merges. English and Brazilian Portuguese.
  Pop, badge motion and confetti are skipped with reduced motion.
- Verification: headless Chromium. Desktop List: watchlist badge 4→5 and toast;
  seen + Undo; watchlisted title seen then Undo returns it to the watchlist;
  Ant-Man completing Phase 2 and re-marking The Avengers completing Phase 1
  (confetti removed after ~2 s); auto-hide; toast centred beside the open drawer;
  fresh visitor has no badges until the first mark; the popping button sits above
  its neighbour (z-index 2 vs auto) on rows and cards. Phone 390px: badges on the
  icon-only switch, toast 11px above the sort bar, at the top inside a details
  sheet with a working Undo. Fit, context, panel, language, List, suggestions,
  layering, animation, About and welcome scripts pass, with the October 26 catalog
  data loaded. Recorded clips reviewed by the user, who approved committing and
  merging to main.
- Limits: not checked on a physical phone; milestone confetti was checked with
  seeded collections, not a real account.

## V3 catalog — October 26 review

Recorded: 2026-10-26 10:31:09 EDT (-0400).

- VisionQuest now includes Paladin / Todd Stashwick, confirmed by Disney's
  publisher article. Adds the character id `paladin`, with the existing initials
  portrait and proper-name fallback in English and Portuguese. All 64 title ids
  are preserved; the documented character count is now 84.
- Spider-Man: Brand New Day IMDb 8.0 → 7.9, from a newer indexed primary
  ratings-page snapshot (363,885 votes). Rechecked October 26; direct access
  returned 403 and an older title-page index still shows 8.0. This is not live
  verification. Evidence and per-entry checked dates are in the catalog audit
  and source mapping; other scores and release dates are unchanged.
- Verification: Node VM checks passed for stable title ids, 84 characters, cast
  references, the new IMDb value, unchanged release/RT values and upcoming
  unrated entries. Browser checks: desktop and 390px mobile VisionQuest cast
  shows four entries including Paladin / Todd Stashwick; mobile Brand New Day
  shows IMDb 7.9 / RT 90 in English and Portuguese; Portuguese Paladin search
  returns VisionQuest with the correct actor. `git diff --check` passed.
- An initially stale cached entry page omitted the language scripts and failed
  to render; loading the current entry page with a fresh query parameter
  resolved that issue without code changes. No physical-device, auth, cloud
  write or production checks were performed. The user approved committing and
  merging to main on 2026-10-26; this record is not a deployment timestamp.

## V3 feature — About and first-visit welcome

Recorded: 2026-10-26 10:02:00 EDT (-0400).

- New `about.jsx`: About MCU Connections, opened from a footer link in the account
  menu (desktop) and account sheet (phones), for guests and signed-in users. The
  footer is the planned home for a future Settings entry. Desktop shows a centred
  dialog (focus kept inside; Escape, × or a click outside closes it; focus returns
  to the account button); phones use the bottom sheet.
- Content (English and Brazilian Portuguese): a short description, four ways to
  explore in a 2 × 2 grid (one column on narrow screens) and credits: TMDB's
  notice for posters and photos, IMDb and Rotten Tomatoes ratings, synopses
  written for the site, and a fan-project disclaimer.
- First-time visitors see the same content once as a welcome with a "Start
  exploring" button. It is decided when the page loads, before anything is saved:
  browsers with saved preferences, language, collection or a sign-in count as
  returning and never see it; the result is kept in `mcu.welcome.v1`. A private
  window counts as a first visit and `?welcome` forces it for testing. Not shown
  when storage is unavailable.
- Phone sheets and the About dialog now focus the sheet/dialog itself on open, so
  no focus ring appears on a control the visitor didn't choose.
- Verification: headless Chromium. Desktop en/pt-BR: footer link, dialog focus,
  Tab/Shift+Tab containment, Escape/scrim close with focus return, no scrolling at
  1440x900. Phones 390 (pt-BR) and 320 (en): About sheet without horizontal
  overflow. Welcome: shown on a first visit, gone after Start exploring and
  reload, forced by `?welcome`, never for a returning visitor, not shown with
  storage blocked. Fit, context, panel, language, List, suggestions, layering,
  animation and camera scripts pass. The user reviewed the screenshots and
  approved committing and merging to main.
- Limits: TMDB's terms also ask for its logo in this section; only the notice
  text is shown for now. The welcome was not checked on a physical phone.

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
