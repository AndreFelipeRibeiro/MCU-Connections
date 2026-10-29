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
| `bash qa/regress.sh` | Full regression, 28 check scripts in 29 runs (`test-fit` runs twice, one per language); about 25 min. Every errors field should read `[]` or `0`; lines marked `!!` are failures and the run exits non-zero. |
| `node qa/a11y-scan.js` | axe-core scan of 7 screens (desktop Spatial, details, List, account menu; phone List, details, Spatial). Add `LOC=pt-BR` for Portuguese. Exits non-zero and prints `!!` when it finds any violation (it used to exit 0 regardless, so read the output of older runs). |
| `X=1 node qa/<check>.js` | One check; most print JSON with their findings. |
| `node qa/perf2.js` | Time to first title, desktop and a 4×-slowed phone. |

Each check starts its own static server on a fixed local port, serving the
repository root. To compare two versions, set `SITE` to another folder,
relative to `qa/`: `SITE=../../old-copy node qa/test-panel.js`.

## The checks

- Regression set (`regress.sh`): `test-fit` (layout fit for every sort, both
  languages), `test-ctxfn2` (context summary and filters), `test-panel`
  (details panel and drawer), `test-i18n`, `test-dlist` (desktop List),
  `test-suggest` (search suggestions), `test-layers` (menu layering),
  `test-anim` (reorder animations), `test-cel` (counters and celebrations),
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
  phone section headers' "Mark all seen" / "Mark N more seen").
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

`regress.sh` prints every errors field it finds under each script name, flags
anything that is not `[]` or `0` with `!!`, and exits non-zero if there was any.
It also fails a check that exits non-zero or prints no errors field at all, so a
crashed or hung check can no longer look like a pass.

It caps each check at 300s with GNU `timeout`, falling back to `gtimeout` and
then to perl's `alarm`. GNU `timeout` is part of coreutils and is **absent on
macOS**: before the fallback existed, every check died with "command not found"
and the whole run passed, silently, in a couple of seconds.

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
  check, not the app, and both are fixed. A full run should now report **24 check runs clean**;
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
