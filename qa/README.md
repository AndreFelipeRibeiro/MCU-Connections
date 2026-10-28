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
| `bash qa/regress.sh` | Full regression, 14 checks (about 15 min). Every errors array should be `[]` or `0`. |
| `node qa/a11y-scan.js` | axe-core scan of 7 screens (desktop Spatial, details, List, account menu; phone List, details, Spatial). Add `LOC=pt-BR` for Portuguese. Expect no violations. |
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
  (phone views).
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

## Known noise

- `test-camera`: one desktop warning ("Unable to preventDefault inside passive
  event listener"). Its "wheel cancels the glide" step fails about 1 run in 4 on
  any version (timing-sensitive).
- External images and fonts are blocked on purpose, so posters show their
  generated fallback art in screenshots.

## Keeping it useful

Checks find elements by class names and texts. When a change renames or
restructures UI, update the affected checks in the same commit. Screenshots go
to `qa/shots/` (ignored by Git).
