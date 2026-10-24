# MCU Connections

V3 TEST

An interactive explorer for the Marvel Cinematic Universe — every film and series laid out as a spatial map, connected by the actors and characters who link them together.

No frameworks to install, no build step. Open `MCU Explorer.html` in a browser and it runs.

## What it does

Pick any title and the canvas redraws around it, pulling every other title that shares a character into a ring, with a labelled connection line for each one. Hover a character in the cast list and every title they appear in lights up across the whole map, even ones you haven't clicked. It's built to answer "wait, who else was in this?" without leaving the page.

## Features

- **Spatial connection canvas** — pan, zoom, and drag cards freely. Clicking a title reflows related titles into rings around it, sized by how many characters they share.
- **Six sort modes** — release date, in-universe chronological order, phase, alphabetical, IMDb rating, Rotten Tomatoes score.
- **Filters** — by phase, film vs. series, and production budget tier.
- **Cast drawer** — every title's featured cast, with actor headshots, that doubles as a way to jump into a character's connection thread.
- **Grid and list views** — a denser, non-spatial way to browse when you just want to scan titles.
- **Dedicated mobile shell** — a separate touch-first UI (grid/list/spatial + bottom sheets) rather than a squeezed-down desktop layout.
- **Variant-aware character model** (see below) — Kang the Conqueror, He Who Remains, and Victor Timely read as three distinct names and colors, but still form one continuous connection thread.

## The data

- **64 titles** spanning Phases 1–6, 2008–2027 (40 films, 24 series)
- **80 characters**, driving **321 connection segments** between titles
- Posters and actor portraits sourced from TMDB
- IMDb and Rotten Tomatoes scores where available

Titles and cast lists are maintained by hand in [`data.js`](data.js) against Wikipedia's per-character MCU filmographies — this isn't pulled from a live API, so it reflects whatever was true as of the last update. Unreleased titles (anything past a "Not yet rated" badge) carry pre-release cast announcements, which can and do change before release.

### Variant characters

Some actors play more than one identity in the MCU — Jonathan Majors as He Who Remains, Kang the Conqueror, and Victor Timely; Hayley Atwell as Peggy Carter and Captain Carter; the multiverse Peter Parkers in *No Way Home*. Each variant is its own entry in the character map with its own name and connection-line color, but can declare a `prime` identity it threads through:

```js
kang:             { name: 'Kang the Conqueror', color: '#3f9fa8' },
'he-who-remains': { name: 'He Who Remains', color: '#6fd0c0', prime: 'kang' },
'victor-timely':  { name: 'Victor Timely', color: '#2f7f8f', prime: 'kang' },
```

Connections chain on the prime, so *Loki* → *Quantumania* → *Loki Season 2* draws as one unbroken arc — but each segment is still labeled and colored by whichever face actually appeared in that title. Titles where multiple variants of the same identity share a single credit (e.g. all three Peter Parkers in *No Way Home*) collapse to one appearance per title, so that never produces a self-referential loop.

## Running it locally

No build tooling required — it's plain HTML/CSS/JS loaded straight into the browser (React and Babel come from a CDN). Any static file server works:

```bash
python3 -m http.server 8123
```

Then open `http://localhost:8123/MCU%20Explorer.html`.

## Project structure

| File | Purpose |
|---|---|
| `MCU Explorer.html` | Entry point — loads React/Babel from CDN, then the app scripts in order |
| `data.js` | The 64 titles and 80 characters: cast lists, phases, budgets, ratings, variant `prime` links |
| `media-data.js` | TMDB poster and actor-portrait paths |
| `app.jsx` | Desktop app: spatial canvas, connection-line rendering and label layout, toolbar, cast drawer |
| `mobile.jsx` | Touch shell: grid/list/spatial views, filter and cast sheets |
| `poster.jsx` | Poster rendering — real art from TMDB, or a generated abstract fallback if none is set |
| `connections.jsx` | A standalone SVG connection-layer component (not currently wired into the running app — kept for reference) |
| `styles.css` / `styles-mobile.css` | Desktop and touch stylesheets |

## Known limitations

- Cast lists are hand-maintained, not live-fetched — accuracy is only as current as the last edit
- A few self-contained titles (*Eternals*, *Moon Knight*, *Eyes of Wakanda*) currently have no character overlap with anything else, so they don't connect to the rest of the graph
- Ratings and budgets are populated only where a reliable public figure was found; many recent/unreleased titles show "Not yet rated" rather than a guess

## Keeping this file current

This README should get a pass whenever a major feature lands — new views, a data-model change like the variant system, a meaningful jump in title/character counts. Small data corrections (a missing cast credit, a fixed rating) don't need a README update on their own.


## V3 Phase 1 verification — 2026-10-24

Phase 1 already exists in commit `1bf565a`. This pass reviewed the current
`version/3.0` working copy, including its existing auth wiring and uncommitted
sync changes, in signed-out mode. No application changes were needed for the
Phase 1 behaviors checked below. This is not a validation of cloud sync.

Browser checks used an isolated local origin (`http://127.0.0.1:8124`), with
mobile layouts at 390px and the default panel width, and desktop at 1200px.

- [x] Guest watchlist → seen → none transitions; un-seeing does not restore
  watchlist. Seen state survives a browser reload.
- [x] Tracking actions exercised on desktop cards/drawer and mobile grid,
  list, cast sheet, and spatial focus card.
- [x] Mobile grid/list/focus primary actions still open the cast sheet.
  Rendered DOM checks found no nested buttons. Grid keyboard navigation goes
  primary action → seen → watchlist → next primary action; Enter opens details.
  List keyboard navigation reaches its status control and Enter opens details.
- [x] Desktop status clicks at 100%, 75%, and 50% zoom do not select cards or
  change the canvas transform. At 100%, all card position styles were also
  compared before/after and remained identical. With Unseen active, the changed
  card dims in place. Mobile spatial status clicks also preserve the transform.
- [x] Below 50% spatial zoom, interactive status controls disappear while the
  seen marker remains. Measured mobile grid toggle targets are approximately
  36 × 36 CSS pixels at scale 1; source CSS provides at least 32px targets.
- [x] Collection filters update mobile grid/list contents, show the active
  filter count, and produce the empty-watchlist message. Both desktop and mobile
  clear-filter controls reset the collection filter.
- [x] Progress shows 60 released titles with the current catalog/date. Adding
  unreleased Secret Wars to the watchlist increments the separate watchlist
  count; marking it seen does not increment released-title completion.

Additional direct helper probes used Node's built-in VM with the actual
`data.js` and guest-storage/date helpers, without adding a test runner or test
files. Absent/malformed storage and unsupported versions return an empty state;
`none` entries are omitted; unknown IDs survive a save and generate a local-dev
warning; clearing storage returns an empty state. Explicit date inputs give
59 released titles on 2026-10-13 and 60 on 2026-10-14 and 2026-10-24. These were
helper probes, not browser storage fault injection or a browser clock override.

Remaining manual verification from spec §10 (not claimed by this pass):

- [ ] Cross-device cloud sync.
- [ ] Cross-account isolation in separate profiles and directly through PostgREST.
- [ ] Sign-out clearing without copying account data to guest storage.
- [ ] Account switching without data bleed.
- [ ] Guest merge precedence and preservation after a failed remote write.
- [ ] Block Supabase and verify degraded mode, errors, and guest tracking.
- [ ] OAuth cancellation without a stuck spinner.
- [ ] Browser clock override across the release boundary (helper probe passed).
- [ ] Real-device touch gestures, screen-reader announcements, complete keyboard
  traversal, and pressed/focus visual states across all mobile surfaces.

The existing code also intentionally recenters when the collection filter itself
is changed (commits `cd43999`/`b4609f8`). This differs from a literal reading of
§7.1's “nothing recenters”; changing a title's status under that filter does not
recenter. This existing behavior was preserved.
