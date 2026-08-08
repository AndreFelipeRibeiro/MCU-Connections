# MCU Connections

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
