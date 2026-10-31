# QA checks

Development-only browser checks (headless Playwright). They are **not part of
the app**: the site never loads anything from `qa/`, Vercel does not deploy this
folder (`.vercelignore`), and installed packages stay out of Git
(`.gitignore`). This is the one place npm is allowed in V3 (see AGENTS.md).

## Setup (once per machine)

    bash qa/setup.sh

Installs Playwright and axe-core into `qa/node_modules`, downloads Chromium,
and fetches the pinned React, ReactDOM, Babel standalone and supabase-js
packages into `qa/vendor`. The checks serve those packages in place of unpkg,
so they test exactly the versions `index.html` loads and need no network.

## Running

Run from the repository root:

| Command | What it does |
|---|---|
| `bash qa/regress.sh` | Full regression: 41 check scripts in 42 runs (`test-fit` runs twice, one per language) plus the accessibility scan in English and Portuguese, 4 at a time; about 5–6 minutes (it was about 24 one at a time). Every errors field should read `[]` or `0`, the scans "no violations"; lines marked `!!` are failures and the run exits non-zero. Ends with the total time and the ten slowest. `JOBS=1` runs one at a time; `QA_VERBOSE=1` prints the tail of a failing check. |
| `bash qa/quick.sh [checks…]` | The per-ticket run: the checks `qa/checks.json` lists for the files changed in the working tree, plus the checks named (the ticket's own), side by side. A typical ticket takes 1–3 minutes. |
| `SITE_URL=<address> node qa/smoke.js` | One-minute smoke check against a deployed site (real CDN libraries and in-browser Babel): loads, titles appear, Spatial and List open, details open and close, the phone List opens a sheet, no console errors. Run it against staging after each push and production after each merge. |
| `node qa/a11y-scan.js` | axe-core scan of 16 screens (desktop Spatial, details, List in Release and in By Phase, account menu, an open guide in the List and in Spatial, the Guides popover, the "What have you seen?" dialog, the guide promotion; phone List, details, Spatial, an open guide, the picker sheet, the guide promotion). Add `LOC=pt-BR` for Portuguese. Exits non-zero and prints `!!` when it finds any violation (it used to exit 0 regardless, so read the output of older runs). |
| `X=1 node qa/<check>.js` | One check; most print JSON with their findings. |
| `node qa/perf2.js` | Time to first title, desktop and a 4×-slowed phone. |

Each check starts its own static server, serving the repository root, on the
port in `PORT` (each check keeps its old fixed port as the default, so a check
run on its own works as before). `regress.sh` and `quick.sh` give every check
its own port so they can run side by side. To compare two versions, set `SITE`
to another folder, relative to `qa/`: `SITE=../../old-copy node qa/test-panel.js`.

## What makes the runs fast (2026-10-30)

- **`qa/run.js`** runs the checks (`JOBS`, default 4), buffers each one's output
  and prints them in the list's order, so the report reads the same however
  many run at once. The timing-sensitive checks ("serial" in `checks.json`:
  camera, inertia, animation, wide touch) run afterwards, alone.
- **Pre-compiled scripts:** `run.js` loads `qa/precompile.js` into every check
  (`NODE_OPTIONS=--require`). It serves the app's `.jsx` files compiled with the
  same pinned Babel and the same settings Babel standalone uses in the page,
  cached in `qa/.cache` (ignored by Git), and serves `index.html` with those
  script tags as plain scripts in the same order. A check run directly with
  `node` still compiles in the page, and `test-boot` and `perf2` are never run
  through it, so production's way of loading stays covered.
- **A ready signal:** the app sets `data-ready="1"` on `<html>` once its first
  render is on screen and the collection has loaded. `qa/ready.js`
  (`appReady(page)`) waits for it plus a short margin (700ms, `QA_READY_MARGIN`)
  instead of a fixed 2.2s sleep. The timing-sensitive checks and `test-boot`
  keep their fixed waits.
- **`qa/checks.json`** lists the full run, the serial group and which checks
  cover which app files (for `quick.sh`). Add a new check to it in the same
  change.

## The checks

- Regression set (`regress.sh`): `test-fit` (layout fit for every sort, both
  languages), `test-ctxfn2` (context summary and filters), `test-panel`
  (details panel and drawer), `test-i18n`, `test-dlist` (desktop List),
  `test-suggest` (search suggestions), `test-layers` (menu layering),
  `test-anim` (reorder animations), `test-cel` (counters and celebrations; with the details open, the confetti stays left of the drawer, centred on the toast),
  `test-align2` (Spatial alignment), `test-about`, `test-welcome`,
  `test-camera` (Spatial camera, glides, selection return), `test-v2`
  (phone views), `test-widetouch` (touch pan and pinch on a wide screen),
  `test-variant` (character-variant scope), `test-nudgeundo` (the guest
  sign-in reminder against Undo), `test-pickperson` (every actor and character
  picked from the search opens the pinned widget), `test-escpin` (Escape
  unwinds one layer per press, down to the pinned widget), `test-mviewport`
  (the phone document does not scroll behind the shell), `test-inertia`
  (panning decelerates on release and stops dead when grabbed),
  `test-portrait` (a recast row never shows the default performer's face),
  `test-recastname` (the performer named beside a recast character follows
  the title in view, and a character search offers one row per performer),
  `test-bannerhold` (the character banner stops at the details panel with the
  same indent pinned or hovered, and the panel hangs from the toolbar),
  `test-progress` (phase meters on By Phase only and one All titles meter on
  every other order, across all 30 view and order combinations; counts
  released titles only, ignores the collection tab and hides during a search;
  sticky headers, Spatial framing and the scroll reveal),
  `test-release` (release status worked out from the dates at run time:
  released / upcoming / expected at their real precision, badges only on
  titles not out yet, the Released only filter, Portuguese dates),
  `test-urlstate` (a shared address opens the state it names, the address
  follows changes and survives a reload, bad values are dropped, Back and
  Forward on a phone close and reopen the details, closing the filter sheet
  keeps the filter just chosen, and only our keys ever appear),
  `test-bulk` (desktop List selection, Shift ranges and the mixed header;
  bulk marks change exactly the right titles, never an unreleased one seen,
  with one guest-storage write and one announcement; Undo restores each title,
  a replaced watchlist included; over 20 asks first and Cancel keeps the
  selection; real Escape presses clear the selection before the details; the
  phone section headers' "Mark all seen" / "Mark N more seen"; on desktop in
  By Phase, a phase header's checkbox selects exactly that phase (mixed for
  part of it, cleared on a second click) and its "Mark N more seen" marks only
  that phase's remaining released titles, with Undo; the All titles meter's
  button in Release order),
  `test-details` (the desktop drawer and the phone sheet show the same
  sections in the same order from one shared body: poster beside eyebrow,
  title, release and story, then scores, budget, status, synopsis, Where to
  watch, Part of (only for a title in a guide, one row per guide) and the cast; the cast starts open and
  Where to watch closed, each toggling only itself; "Ratings after release"
  for a title not out yet, "Not published" for an unknown budget, the search
  highlighted in the title, nothing under the close button or past the edge
  at 320px, Portuguese labels; samples picked from the catalogue at run time),
  `test-watch` (Where to watch, against a test snapshot served in place of
  watch-data.js: the section starts closed; the country guessed from the
  browser's languages, then the time zone, then the US; stream and free logos
  with the name kept when a logo fails; the rent-or-buy line; rent only; no
  offers; not checked yet with no "Checked" date beside it; the series note;
  nothing on a title not out yet; the picker, an unsupported country with
  TMDB's own page, the choice kept across a reload; the 30-day warning; the
  external link's target, rel and name with no tracking; the phone sheet in
  Portuguese; and the real snapshot as committed),
  `test-nextup` (Up next: a new guest gets the first title out in release
  and in story order, never one not out yet; Mark seen moves on and Undo
  brings it back, with a polite announcement; the × hides it until the page
  is reloaded and stores nothing; the phone card sits at the top, above the
  meter, with no duplicate row; A–Z, Z–A and IMDb follow the list itself and
  say so; hidden while searching; caught up names the next arrival; the
  Watchlist states and Show from everything; filters narrow it and are named;
  the Grid card, the phone Spatial chip, the desktop List strip and the
  Spatial meter row; 320px; Portuguese. Expectations come from the catalogue
  and today's date),
  `test-guides` (Guides: the data first, every stop a real title once, both
  languages, a reason per stop, release order, essential numbers 1..n that
  never shift when optional stops show, valid continuity; then the desktop
  popover and Escape, the banner, List rows, next stop, meter, Include
  optional, the stepper, no All titles switch, `?guide=` on load and a bad value,
  Escape closing the guide; "Mark N more seen" on its meter with Undo; an
  empty search box listing every guide; search suggesting it first under
  Guides by mouse and keyboard; a character with a guide offering it and one without not;
  Part of in the details opening the guide at that title; Spatial badges
  and route; confetti once per guide, not on opening a complete guide, none
  with reduced motion; the phone sheet and Back, List rows, the optional
  switch, the pill's ×, Grid cards, the Up next chip clear of the pill, the
  character pill's button; 320px and Portuguese),
  `test-picker` ("What have you seen?": a new guest opens it from the
  welcome; released titles only, by phase in release order; Select all /
  Clear, picks, the live count, Space and Enter on a poster; saving marks
  exactly the picks with one toast, no confirmation even over 20, at most one
  burst, and Undo clears them; the sign-in reminder shows once afterwards;
  opened later from the account menu, seen titles start ticked and labelled,
  unticking marks unseen in the same change with one mixed toast and one
  Undo that restores a replaced Watchlist mark; × closes at once with no
  changes and asks with some, Escape closing one layer, Keep picking and
  Leave without saving; on a phone, Back closes it or asks (and asks again),
  the footer stays on screen, nothing past the edge; the Seen tab's empty
  state opens it, in Portuguese),
  `test-listkeys` (desktop List keys: with the details open, ← → step through
  the rows shown, across a sort, a filter and a search, wrap at both ends and
  announce the position; ↑ ↓ keep the column (checkbox, title, Seen), Home
  and End, stopping at the ends, the details following without taking focus;
  Enter still focuses the details; Alt+→, the search box, Space, Shift-click
  ranges and Escape (selection, then details) unchanged; a pinned character
  and a guide keep their own stepping; a wrapped-to row is never under the
  meter or column headers, in Release and By Phase at 1280 and 1440px;
  reduced motion; the Portuguese announcement),
  `test-promo` (guide promotion and resume, with the date fixed: Doomsday's
  guide on 2026-11-01, the animated series on 2026-12-20, the evergreen guide
  on 2027-02-01; once per guide; never on a first visit, after a link, for a
  completed guide or in an automated browser; Tomorrow on the last day and
  none on release day; the started state with checks, the next stop, the
  meter and Continue; Escape, Not now and phone Back; Start opens and
  remembers the guide, the home page reopens it, a link wins without
  forgetting, closing or finishing forgets it; cover labels never overlap at
  320, 390 and desktop widths, in English and Portuguese),
  `test-home` (the logo is a link home: from a search with filters, the
  Watchlist tab and a bulk selection in the List, a pinned character with
  details in Spatial (mid-glide, by keyboard), a followed guide, and phone
  List and Grid, it resets everything but the view, sorts by Release,
  re-frames Spatial, scrolls to the top, brings Up next back and announces
  it; Back restores the search, filters, sort and title; the collection is
  untouched; the remembered guide is forgotten; Cmd/Ctrl-click opens a tab
  instead; Portuguese),
  `test-unreleased` (with the date fixed: Doomsday has no Seen button on
  2026-12-10 and one from 2026-12-11, in the desktop List, a Spatial card,
  the details drawer, the phone List and details; Watchlist stays and the
  row doesn't shift; marking inside the window works with its toast; the
  progress count adds it only on 2026-12-18; Daredevil S3, dated by month,
  never has one; a title marked seen early keeps its button and unmarks),
  `test-partof` ("Part of" in the details: a collapsible section with its
  count, open from the List and closed inside a guide, on the drawer and the
  phone sheet; the in-guide choice holds on the next stop and doesn't change
  the other context's state; a reload restores the defaults; Enter and Space
  toggle; a title in no guide has no section; a row opens its guide;
  Portuguese),
  `test-refocus` (the view lands on the title whose details closed: She-Hulk
  opened from Up next in desktop Spatial is centred at 70% or more, and on
  a phone at 60% or more once the selection clears; a card clicked on the
  canvas returns the camera exactly; the desktop List row comes into view
  below the headers, flashes and takes keyboard focus; on a phone the Up
  next title scrolls nothing and a folded seen title brings its fold's
  header into view, still folded),
  `test-skip` (skipping a guide stop: Skip beside Seen by keyboard, the
  minimized row with Unskip, focus and announcements; the stop leaves the
  meter, next stop, "Mark N more seen", stepper and Up next, with a dash on
  its Spatial badge; remembered per guide across a reload; seen wins and drops
  the skip; skipping the last unseen stop completes the guide, and finishing
  with a stop skipped bursts the confetti; phone List and Grid; Portuguese),
  `test-guidemode` (an open guide sets aside what it doesn't use: the Guides
  button shows as on and is named after the guide; in the List the layout
  tabs, Order, Filters, type and collection are dimmed, aria-disabled and
  inert, while search and the view switch stay live; in Spatial the layout
  tabs and Order work again, and with Series set every stop of a film guide is
  laid out and lit with no count summary; closing the guide brings Series and
  every control back; phones: the bar shortens (Filters and the collection row
  fold away, the view menu sits beside search), the sort tabs slide away, the
  dock shows the next stop with Seen instead of the meter and Up next card,
  the next stop is framed at a readable size, and the zoom control rests
  hidden until a double-tap; closing brings it all back; Portuguese hint).
- Checks written for specific fixes (run them when touching that area):
  - `test-pan`: zoomed-out Spatial layers and memory.
  - `test-back`: phone Back closes sheets.
  - `test-img`: image fallbacks.
  - `test-accent`: accent-insensitive search.
  - `test-empty`: Spatial empty state.
  - `test-bgclick`: empty-canvas click.
  - `test-boot`: startup screen.
  - `test-esc`: Escape and focus in details.
  - `test-kbspatial`: Spatial cards from the keyboard.
  - `test-ringfocus`: enlarged ring card.
- `test-jit2.js` and `test-jit2-env.js` also hold the shared harness (server,
  vendor routing, page helpers) that other checks load. Edit them with care.

## Reporting

`regress.sh` (through `run.js`) prints every errors field it finds under each
script name, flags anything that is not `[]` or `0` with `!!`, and exits
non-zero if there was any. It also fails a check that exits non-zero or prints
no errors field at all, so a crashed or hung check can no longer look like a
pass. Each check is capped at 300s.

History: the bash runner capped checks with GNU `timeout`, which is **absent on
macOS**; before its fallback existed, every check died with "command not found"
and the whole run passed, silently, in a couple of seconds. `run.js` caps
checks itself, so that can't recur.

Four checks print their JSON indented (`JSON.stringify(out, null, 1)`), so a
non-empty errors array spans several lines. The matcher flattens each check's
output before reading it; a single-line pattern could not match such an array
and printed a bare `"desktopErrors": `, which read as harmlessly as an empty
one.

## Known noise

- `test-camera`: one desktop console warning ("Unable to preventDefault inside
  passive event listener"), which React causes by attaching wheel listeners
  passively at the root. `regress.sh` allows that one string by name, and
  `test-widetouch` reports it as `knownWarning` rather than in `errors`.
- `test-camera` used to fail at "sort change while selected", and separately to
  report a false "wheel cancels the glide" about one run in four. Both were the
  check, not the app, and both are fixed. A full run should now report **44 check runs clean** (42 check runs and two scans);
  treat any `test-camera` failure as real, and compare against a clean copy with
  `SITE=` if in doubt.
  - `page.mouse.click` moves the cursor and presses in the same tick. Hovering a
    card re-lays the canvas out, so the press could land after the cards had
    shifted and select nothing, leaving `.drawer-close` with no target. Card
    clicks go through `clickCard()` (move, let the hover settle, then press),
    and the two that must open a card go through `openCentreCard()`, which
    waits for the drawer and re-measures if the press missed. It reports
    `cardOpenAttempts`: more than one attempt is normal after a wheel zoom, and
    a run of `"failed"` is worth looking at.
  - The glide steps guessed at 60ms and 80ms. They now wait for the transition
    to appear and to clear, which is what the "1 in 4" was.

## Assertions have to be named "errors" to count

`regress.sh` only reads fields whose name contains `errors`. A check that
prints `"somethingWorked": false` therefore gates nothing — the run reports
clean. `test-camera` had six such booleans, any of which could be false
unnoticed; they are now collected into `assertErrors`. Worth remembering when
writing a check: **an assertion that is not in an errors field is decorative.**
- External images and fonts are blocked on purpose, so posters show their
  generated fallback art in screenshots.

## Keeping it useful

Checks find elements by class names and texts. When a change renames or
restructures UI, update the affected checks in the same commit. Screenshots go
to `qa/shots/` (ignored by Git).
