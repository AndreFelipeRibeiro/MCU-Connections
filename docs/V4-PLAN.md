# MCU Connections V4 — plan

Draft written 2026-10-31 for Andre's review, Phase 1 of
[V4-KICKOFF.md](V4-KICKOFF.md). Nothing here is settled: the open questions at
the end need answers before Phase 2 starts, and [AGENTS.md](../AGENTS.md) stays
the rulebook. Decisions taken from this plan go in
[decisions.md](decisions.md).

## 1. Goals and non-goals

V4 is three changes that have to happen in this order, because each one is only
safe once the previous is finished:

1. **A build step**, with behaviour identical to V3.
2. **A design system** mirrored from Figma as code tokens.
3. **A new look**, screen by screen, then Dark/Light mode on top of it.

Goals:

- Replace in-browser Babel with a real build, so startup is one bundle rather
  than fourteen `.jsx` files compiled in the page.
- Make modules and named imports possible, retiring the `window.*` hand-off.
- Unlock design tooling: tokens generated from Figma variables, and a component
  base with keyboard and screen-reader behaviour we do not hand-roll.
- Dark and light themes from one set of variables.

Non-goals for V4, so they cannot quietly widen the work:

- No catalog changes. Title ids stay permanent, and no new titles, guides or
  locales ship as part of the migration.
- No new features during Phases 2–4. The feature backlog waits.
- No TypeScript in Phase 2 (see §3.1), no router, no server-side rendering, no
  state library, no CSS-in-JS runtime.
- Email/password accounts stay deferred (AGENTS.md).

**Done, for the release to `main`:** the full regression passes on the built
site; the smoke check passes against the V4 preview; every screen has been
compared against its Figma frame at desktop and phone sizes in English and
Portuguese; WCAG AA contrast holds in both themes; Google sign-in, sync and
sign-out work on the preview and then on production; a real iPhone check on
Spatial zoomed out (the iOS memory rule); and Andre's explicit approval for
that merge.

## 2. What the migration is actually moving

Measured on `version/4.0` at `5a9a159`, so the plan is sized against the real
thing: about 17,000 lines across 14 `.jsx` files, 8 plain `.js` files and 2
stylesheets. `app.jsx` is 3,334 lines, `mobile.jsx` 1,518, `guides-ui.jsx`
1,012, `tracking.jsx` 916; `watch-data.js` is 4,205 lines of data.

Three things make this far more tractable than the line count suggests:

- **Every file already declares its exports.** Each one ends in
  `Object.assign(window, { ... })` (or an explicit `window.X =`), so the public
  surface of each file is written down in one place. Those footers become
  `export { ... }` almost mechanically.
- **Every cross-file read is already marked.** A file reaching into another
  reads `window.TITLES`, `window.MCU_I18N`, `window.PosterArt` and so on, so
  the imports a module needs can be derived from its `window.` reads rather
  than guessed.
- **The load order is explicit** in `index.html` and documented in AGENTS.md,
  which gives the dependency order the module graph has to reproduce.

The risk is not the volume. It is the handful of places where behaviour depends
on the *old* loading model, listed in §7.

## 3. The build step

### 3.1 Tool and language

**Decided 2026-10-31 (Andre): Vite with `@vitejs/plugin-react`, React 18.3.1,
plain JavaScript, with the TypeScript conversion as its own ticket straight
after Phase 2.**

Versions pinned when the scaffold landed, checked against npm that day rather
than copied from an earlier draft of this plan: **Vite 8.3.5**,
**@vitejs/plugin-react 6.1.2**, React and ReactDOM **18.3.1**. This draft
originally said Vite 7, which was out of date by the time the ticket started —
8.x is the current major and Node 20.19+ satisfies it, which this machine
(Node 20.20) does.

Vite because it is the default candidate in the kickoff, needs the least
configuration for this shape of app, has first-class Vercel support, and its
dev server gives the fast feedback the design phases need.

**Why not TypeScript in Phase 2 — and why it follows immediately.** This is
two safe steps instead of one risky one, not a verdict against types.

Phase 2's only claim is "behaviour identical", and the regression suite is what
certifies it. A type migration is not just annotation: every genuine type error
is a question about what the code is *supposed* to do, and answering it is a
behaviour decision. Landed in the same commits as the loading-model change, a
red check no longer says which of the two caused it, and the migration's whole
safety budget has been spent on a second change.

TypeScript also buys unusually little during this particular step. The
conversion is 43 globals becoming named imports (§3.3), and the bundler already
fails the build on a missing or misspelled import — the main failure mode is
covered for free.

Where types do pay is Phases 3–5: component variants, props that must accept
only valid token names, the shape of the token set. That is a different kind of
bug from anything Phase 2 can introduce. The usual objection — that TypeScript
slows the author down — carries little weight here, because agents write most
of this code and types catch *our* mistakes before they reach review.

So the order is: Phase 2 in plain JavaScript with a `jsconfig.json` for editor
inference; then a TypeScript conversion as its own ticket, mechanical and
verified against the same green suite, **before Phase 3 starts**, so the design
system is built on types from its first component. The honest price is one
extra pass over the files; what it buys is that each pass answers one question
and a failing check always has one explanation.

React 18.3.1 stays as it is; a React 19 move is a separate decision with its
own risks.

### 3.2 Folder layout

One module per existing file, same names, so the Phase 2 diff stays reviewable
and `qa/checks.json`'s file-to-check mapping keeps working with a path prefix
rather than a rewrite:

```
index.html            (entry, at the root, as Vite expects)
vercel.json           (build settings; see §4)
package.json
jsconfig.json
vite.config.js
src/
  main.jsx            new: the entry that mounts the app
  app.jsx             app shell, Spatial canvas, toolbar, details, state
  mobile.jsx  desktop-list.jsx  poster.jsx  tracking.jsx  upnext.jsx
  watch.jsx  guides-ui.jsx  picker.jsx  account.jsx  about.jsx
  celebrate.jsx  search-suggest.jsx
  boot.js  i18n.js  supabase-client.js  config.js
  data/
    data.js  guides.js  media-data.js  watch-data.js
  locales/
    en.js  pt-BR.js
  styles/
    styles.css  styles-mobile.css
public/
  favicon.png  apple-touch-icon.png  og-image.jpg  schema.sql
qa/                   unchanged (see §5)
```

`connections.jsx` is not loaded today and is kept only for reference: it moves
to `docs/` or is deleted in Phase 2, not ported.

### 3.3 Modules replacing `window.*`

Per file, in the load order from `index.html` (leaves first, `app.jsx` last):

1. Turn the trailing `Object.assign(window, { ... })` into `export { ... }`.
2. For each `window.X` the file reads, add a named import from the module that
   now exports `X`.
3. Delete the `window.` prefix at the use sites.

Two kinds of global do **not** simply disappear:

- **Genuine cross-cutting state** — `window.MCU_detailSlots` (which `watch.jsx`
  and `guides-ui.jsx` both extend), `window.MCU_activeGuideId`,
  `window.MCU_isOwnSheetPop`, `window.MCU_openGuide`, `window.MCU_openPicker`.
  These are a small registry and a few imperative hooks. They become one
  explicit module (`src/bridge.js`) with the same semantics, rather than being
  redesigned mid-migration. Redesigning them is a later ticket if it is worth
  doing at all.
- **The surface the QA checks read** — see §5, which is the single most
  invasive consequence of this change and the thing most likely to be
  discovered late.

Order of work: one commit per file or small group, each keeping the app running
(a file can export *and* keep its `window.` publication until its last reader
is converted, so the tree is never broken for more than one commit).

### 3.4 How the pieces load now

- **`index.html`** keeps the startup screen markup and loses the fourteen
  `<script type="text/babel">` tags and the four CDN `<script>` tags; Vite
  injects the bundle. The pinned CDN versions with SRI hashes are replaced by
  pinned `package.json` versions — the supply-chain story changes from "SRI on
  a CDN" to "a lockfile and Vercel's install", which is worth stating in
  `decisions.md` rather than letting it pass silently.
- **Locales** are imported by `i18n.js` instead of loading as two scripts
  before the libraries. They are small; both ship in the main bundle. If
  Spanish arrives later (a V5 ticket), revisit with dynamic import.
- **`data.js`, `guides.js`, `media-data.js`** are imported normally.
  **`watch-data.js`** is 4,205 lines and only the "Where to watch" panel needs
  it: it is the one clear candidate for `import()` on first use, which also
  shrinks the initial bundle. This is a *behaviour* change (the data is no
  longer present at first paint), so it needs its own check and should be
  judged on measurement, not assumed.
- **`config.js`** keeps the two public Supabase values. They are public by
  design and committed today; the simplest faithful port keeps them in the
  module and changes nothing. Vite's `import.meta.env` with `VITE_`-prefixed
  variables is available if Andre later wants preview and production to point
  at different Supabase projects — that is a real option but not part of
  "behaviour identical", so it is a separate decision.
- **`boot.js`** exists because visitors watched a blank page while the CDN
  libraries downloaded and Babel compiled (decisions.md, 2026-10-27). With a
  build, that wait mostly goes away. The startup screen should stay for the
  slow-network and failed-start cases, but its timings are tuned for the old
  delay and will need re-tuning in Phase 2, and `test-boot` (which deliberately
  exercises the real in-browser Babel path) no longer describes anything that
  exists — see §5.

## 4. Vercel, without touching production

This is the part that can break the live site, so it is spelled out.

`main` has no `vercel.json` and deploys as static files. Vercel's **dashboard**
build settings apply to every branch of the project, so setting a framework
preset or a build command there would make `main` try to build a project that
has no `package.json` and would break production.

Therefore: **all V4 build settings live in a `vercel.json` committed on
`version/4.0`**, and the dashboard is not touched.

```jsonc
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

Checks before anyone relies on this:

- Confirm in the Vercel project that Build & Development Settings are still at
  their defaults (no framework preset, no build command) and leave them there.
- After the first V4 build deploys, redeploy `main` once and confirm production
  still serves V3 unchanged. Do that while V4 is still only a preview, so a
  surprise is cheap.
- Keep `.vercelignore` as it is; `qa/`, `tools/` and `.mcp.json` stay out of the
  deploy, and `node_modules` is never uploaded.

A rollback is "revert the commit that added `vercel.json` and the build", which
returns `version/4.0` to a static deploy. Worth confirming once, deliberately,
rather than discovering under pressure.

## 5. QA against the built site

The checks are the reason to trust "behaviour identical", so they have to keep
working. Today, each of the 42 check scripts starts its own small web server
serving the repository root, and `qa/precompile.js` wraps `http.createServer`
globally to hand the browser pre-compiled `.jsx` and a rewritten
`index.html`.

Three consequences, from the smallest to the largest:

1. **Serving the built site is cheap, but not as free as this plan first
   claimed.** `precompile.js` already resolves a document root as
   `process.env.SITE ? path.join(QA, process.env.SITE) : path.join(QA, '..')`,
   and the draft concluded that `SITE=../dist` alone would point all 42 checks
   at the build with no change to the check scripts. **That was wrong, and the
   scaffold proved it.** `precompile.js` intercepts only `.jsx` files and
   `/index.html`; every other request falls through to each check's own
   server, which serves the working tree. The built site asks for its
   stylesheet at a hashed path under `/assets/`, that path does not exist in
   the working tree, the page renders unstyled, and 50 layout assertions fail
   for a reason that has nothing to do with the app.

   The correction is still small and still touches no check script: the
   fall-through gains a branch that serves any existing file under the root
   when `SITE` is set, with a content type from the extension. Guarded on
   `SITE`, so a normal run against the working tree behaves exactly as before.
   That branch landed with the scaffold out of necessity — step 1 cannot be
   verified without it — and the rest of step 2 (the `checks.json` paths and
   the globals-surface decision) is unchanged. (`vite preview` is the
   alternative; the `SITE` route is preferred because it keeps each check
   isolated on its own port, which is what makes the parallel run work.)
2. **`precompile.js` must preserve script *order*, not just content.** It
   rewrites each `<script type="text/babel" src="x.jsx">` into a plain
   classic script. In the real page Babel fetches and runs those after
   `DOMContentLoaded`, which is after any module script; rewritten as plain
   classic scripts they run *during parsing*, before the bundle. The moment
   any app code moved into the bundle, every check failed at once because
   `app.jsx` read globals the bundle had not set yet — 43 of 44, with nothing
   wrong in the app. Fixed on 2026-10-31 by emitting `defer`, which puts those
   scripts in the same ordered queue as the module and restores the real
   order. The general lesson: the harness's fidelity to production is now
   load-bearing, and each conversion slice should be checked against a
   working-tree baseline run rather than against an absolute pass.

3. **`test-boot` and `perf2` lose their subject.** Both deliberately bypass
   `precompile.js` to exercise the real in-browser Babel path that production
   used. After the migration there is no such path. `test-boot` should be
   rewritten to check the startup screen and a failed-start on the built site;
   `perf2` should be re-pointed at the bundle, and its numbers re-baselined
   rather than compared to V3's.
4. **17 of the 42 checks read the app's globals from inside the page** —
   `window.TITLES` (37 uses), `window.MCU_I18N` (21), `window.MCU_isReleased`
   (13), `window.MCU_GUIDE`, `window.WATCH`, `window.CHARACTERS`,
   `window.GUIDES`, `window.MEDIA`, `window.MCU_credit`, and
   `window.MCU_SEED_TITLES` which a check *sets* to seed data. Under ES modules
   those names do not exist, and those checks fail for a reason that has
   nothing to do with the app being wrong.

   **Decided 2026-10-31.** The app keeps publishing exactly that set of names
   from one module, unconditionally, as a documented test surface, with a
   comment saying it exists for `qa/` and not for the app to read back. Not
   dev-only: a surface stripped from production builds would mean the checks
   no longer exercise the artifact that ships. Nothing is exposed that was not
   already there — the catalog is in the bundle in full and the i18n runtime
   already runs in the page. Rewriting those checks to drive only the UI is
   better engineering and much more work, and doing it inside the migration
   would change the tests and the loading model at once, destroying the
   evidence that behaviour is identical. Narrow it after Phase 2 if it still
   looks worthwhile.

   A closer reading on 2026-10-31 found that `window.MCU_SEED_TITLES` is **not**
   an app-side hook: `qa/shots-progress.js` sets and reads it entirely within
   its own injected script, and that tool is not in the regress run. Every
   other use of these names is a read.

5. **Three checks read `data.js` from disk and execute it in Node.**
   `test-pickperson`, `test-nextup` and `test-refocus` load
   `path.join(SITE, 'data.js')` and run it through `new Function` or
   `vm.runInNewContext` to build their expectations from the same source the
   app loads. Once `data.js` is an ES module, neither can execute it, and once
   it is bundled it is not in `dist` at all. **Decided 2026-10-31:** those
   three import the module from the *source tree* instead, which Node 20 can
   do directly. That is a few lines each and is more correct than today, since
   their expectations should come from the source rather than from whatever
   happens to be in the build.

6. **One regress check replaces a source file over the network.**
   `test-watch` serves a fixture by intercepting `**/watch-data.js`
   (`qa/test-watch.js:112`). Bundle that file and the request never happens:
   the fixture silently does not apply and the check fails, or worse passes
   while testing the real data. **Decided 2026-10-31:** `watch-data` stays
   separately fetchable at a **stable, unhashed** chunk name, which also
   answers §10 question 1 — it is loaded on demand, the initial bundle shrinks,
   and the interception keeps working. The stable name has to be configured
   deliberately in the Rollup output options; the default hashed name would
   break the check quietly again. (`test-boot` also intercepts source and CDN
   files, but it is already being rewritten under point 2 and is not in the
   regress run.)

Also: `qa/checks.json` maps changed files to checks. Its `files` keys gain the
`src/` prefix in the same commit that moves the files, and the `data-ready="1"`
contract that `qa/ready.js` waits on must be preserved by `src/main.jsx`.

**What must pass before Phase 2 ships:** the full `bash qa/regress.sh` on the
built tree (41 check scripts in 42 runs plus the accessibility scan in English
and Portuguese), green, read as output and not just as an exit code; then
`node qa/smoke.js` against the V4 preview; then a real-device look at Spatial
zoomed out on an iPhone, because no headless check covers the iOS memory rule.

## 6. Design system and the Figma pipeline

Phase 3 proper, sketched here because the build has to support it.

- **Tokens in one place.** Figma variables (colour for both themes, type,
  spacing, radius, elevation, motion) are mirrored as CSS custom properties in
  one file, with names matching Figma's. Components read tokens; no raw values
  copied out of a frame. The V3 `:root` tokens in `styles.css` are the thing
  being replaced, and the phase colours (`PHASE_COLORS` in `app.jsx`) need to
  become tokens too or they will drift.
- **Generated, not transcribed, if it is worth it.** A small script that reads
  the Figma variables through the MCP and writes the token file makes the round
  trip repeatable and the diff reviewable. Worth building once the variable set
  is stable, not before.
- **Component base.** The kickoff asks for a recommendation with trade-offs
  between headless primitives styled with our own tokens (Radix UI primitives,
  React Aria, Base UI) and styled kits (shadcn/ui on Tailwind). That evaluation
  is its own ticket and should be written against our actual requirements — the
  Escape ladder, the modeless desktop drawer, phone sheets that trap focus and
  own a history entry, and `:focus-visible` rings driven by the `lastInput`
  tracker. A kit that fights any of those costs more than it saves. No
  recommendation is offered here on purpose: it deserves evidence, and Andre
  decides. **Decided 2026-10-31:** shadcn/ui on Base UI, Vega style
  (decisions.md). The requirements listed here are the setup ticket's
  acceptance checks.
- **Two themes from one set of variables**, honouring `prefers-color-scheme`
  with a user override, most likely in a Settings panel (Phase 5). Both themes
  must meet WCAG AA against their real backgrounds; the V3 contrast work
  (decisions.md, 2026-10-27) is the standard, not a starting point to relax.

## 7. Risks

In rough order of how much they would cost to find late.

- **The Spatial canvas.** No per-card GPU layers, no `backdrop-filter` inside
  the canvas, composited only at or above 30% zoom (`LAYER_MIN_SCALE`). These
  rules exist because iOS Safari reloaded the tab when panning zoomed out. A
  bundler changes nothing here by itself, but a design system that adds
  transforms, shadows or blurs to cards can reintroduce it, and only a real
  device shows it. Check on hardware at the end of Phase 2 and again in Phase 4.
- **The QA globals surface** (§5.4). The single most likely cause of a Phase 2
  that looks broken while the app is fine.
- **Escape, focus and the one-layer rule.** The ladder closes exactly one layer
  per press, and the details and the pinned subject deliberately share **one**
  listener because two listeners both see the same press and React re-renders
  between them (decisions.md, 2026-10-28). Any reshuffle of where listeners are
  attached — which a module split or a component library can easily cause — can
  break this in a way no static review catches. `test-esc` and `test-escpin`
  are the guards; they must stay green at every step.
- **The `lastInput` tracker.** Focus moves only after keyboard input, so mouse
  and touch users never see a ring they did not cause. This is global input
  state and needs a real home in the module graph rather than becoming a
  per-component effect.
- **Permanent title ids** and the spatial-filter invariant (collection status
  dims cards and never removes them from the layout, V3-SPEC §7.1). Links and
  stored collections break if ids move. Nothing in the migration should touch
  `data.js` ids; `test-urlstate` guards the links.
- **Localisation.** Every string is a locale key read through `tr()`, `mtr()`
  or `MCU_I18N.tr()`, and search folds case and accents through one
  `MCU_I18N.fold()`. The locale files changing how they load is the risk; a
  missing key shows as a visible key rather than a crash, so check both
  languages, not just English.
- **Supabase sync.** `supabase-js` moves from a UMD CDN build to an npm
  dependency. The client is created once in `supabase-client.js`; the risk is
  initialisation order and the blank-config guest fallback, which must keep
  working (config.js documents it as supported). Test signed-out, signed-in,
  and the blank-config path.
- **Startup behaviour** (§3.4): `boot.js` timings tuned for a delay that no
  longer exists.
- **The supply-chain change**: SRI-pinned CDN scripts become lockfile
  dependencies installed by Vercel. Not worse, but different, and it should be a
  recorded decision.

## 8. V3 fixes merging forward

`version/3.0` keeps its own AGENTS.md and ships V3 fixes to production if any
are needed. Those commits merge forward into `version/4.0` with Andre's
approval (AGENTS.md).

Before Phase 2 lands, a forward merge is ordinary. **After** Phase 2, the file
layout has moved to `src/` and a V3 fix will conflict on every file it touches.
So:

- Merge `version/3.0` forward **immediately before** starting Phase 2, so the
  migration begins from a tree with nothing outstanding.
- After Phase 2, treat a V3 fix as a port, not a merge: read the V3 diff, apply
  the same change to the V4 module, and say so on the ticket. Trying to merge
  it will produce conflicts in every hunk and tempt someone into resolving them
  carelessly.
- The honest question underneath this is how long V3 keeps receiving fixes at
  all. The less time `main` and `version/4.0` diverge, the cheaper all of this
  is — which is an argument for shipping Phase 2 promptly rather than bundling
  it with design work.

## 9. Order of tickets

1. **This plan**, approved.
2. **Build scaffold** — `package.json`, `vite.config.js`, `vercel.json`,
   `jsconfig.json`; app not yet converted. Confirm the preview builds and
   `main` still deploys. *(As built: no `src/main.jsx` and no change to
   `index.html`. Vite takes `index.html` as its entry as it stands, bundles
   the two stylesheets and fingerprints the icons, while every app script
   still loads the V3 way; a `LEGACY` list in `vite.config.js` copies those
   files into the build. An entry module has nothing to do until step 3
   converts the first file, so creating an empty one would have been a file
   written to match a plan bullet rather than a need.)*
3. **QA harness for a built site** — the `SITE=../dist` hook, `checks.json`
   paths, and the decision on the globals surface. Done before the conversion,
   so every conversion commit can be checked.
4. **Convert the modules**, leaves first, `app.jsx` last, in small commits.
5. **Retire the old loading path** — CDN scripts, `precompile.js`'s Babel role,
   `test-boot` and `perf2` rewritten; `connections.jsx` removed.
6. **Full regression, real-device check, batch to staging** (Phase 2 ends).
7. **TypeScript conversion** — its own ticket and its own batch, against the
   green suite from step 6: rename to `.tsx`/`.ts`, type the module boundaries
   and the catalog shapes, no behaviour change. Before Phase 3, so the design
   system starts typed.
8. Then Phase 3 onwards, per the kickoff.

**One approved exception to "Phases 2 and 3 do not overlap"** (2026-10-31):
the design system is set up on its own Vite entry, `design.html`, which the
app never loads and which never loads the app. Andre wanted to see and react
to the new look without waiting for the migration. The rule exists to keep
migration risk and design churn out of the same batch, and a separate entry
mixes neither: `index.html`, the app's bundle and its behaviour are untouched.
The components built there become the real ones in Phase 4.

Phases 2 and 3 do not overlap. Migration risk and design churn must not share a
batch — that is the whole reason the build goes first.

## 10. Open questions for Andre

1. **`watch-data.js` lazy loading** (§3.4): worth the behaviour change for a
   smaller initial bundle, or keep everything in the main bundle for now?
   *Answered 2026-10-31:* loaded on demand, at a stable unhashed chunk name.
   The decision was forced by §5.5 — `test-watch` replaces that file over the
   network — and the smaller initial bundle comes with it.
2. **The QA globals surface** (§5.4): keep publishing those names as a
   documented test surface, or budget the work to rewrite 17 checks to drive
   only the UI?
   *Answered 2026-10-31:* keep the surface, unconditionally, and narrow it
   after Phase 2 if it still looks worthwhile.
3. **Supabase config** (§3.4): keep the committed public values as they are, or
   move to `VITE_` environment variables so preview and production can point at
   different projects?
4. **V3 support window** (§8): does `version/3.0` keep receiving fixes once V4
   is on staging, and for how long?
5. **Component base** (§6): happy for the evaluation to be its own ticket with
   a written recommendation, or do you already have a preference?
   *Answered 2026-10-31:* shadcn/ui on Base UI, Vega style, light and dark.
