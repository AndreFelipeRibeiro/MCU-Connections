# MCU Connections

An interactive explorer for the Marvel Cinematic Universe: films and series on
a spatial map, connected by shared actors and characters. V3 adds seen/watchlist
tracking, Google sign-in and cloud sync across devices.

- [V3 preview](https://mcu-connections-git-version-30-afr-bfcd.vercel.app/)
- [Production](https://mcu-connections.vercel.app/) — V3, published from `main`.
  See the changelog for approved maintenance changes and deployment checks.
- Catalog maintenance continues on `version/3.0`; [audit and sources](docs/CATALOG-AUDIT.md),
  [phase roadmap](V3-TASKS.md). The Notion V3 Tasks database holds the live queue.
  Future changes still require review and approval before committing/pushing
  and a separate approval before merging to main. Email/password Phase 6 is deferred.

See the [dated changelog](CHANGELOG.md) for commit-by-commit history and the
[privacy review](docs/PRIVACY-REVIEW.md) for the repository audit and its limits.

## Features

- Spatial connection canvas with pan, zoom, draggable cards and cast highlighting.
  Release/Chrono open closer and centred on the titles in view; closing a title's
  details glides the camera back to where you were.
- Desktop navigation is grouped like the mobile header. The top row has the
  brand, then search, Order, Filters and All/Films/Series, then the language
  menu and account at the right; the second row has the sort modes and
  Unseen/Seen/Watchlist. Below 1280px the search group moves to its own row
  between them, and labels shorten step by step on narrower desktops. The account
  control shows Sign in or the signed-in user's name, shortened visually when
  space is limited.
- A context summary shows what the controls don't: how many titles match and
  which filters are on. On desktop it floats at the top-left of Spatial: the
  count, a removable chip per active filter (search, collection, type, phase,
  budget) and Clear all when two or more are on. On phones it is one line at the
  top of List and Grid and a small pill in Spatial (count, how many filters,
  Clear).
- Six sort modes: release, chronology, phase, title, IMDb and Rotten Tomatoes.
- Each released title shows its in-story timeframe (e.g. "Set in 1943–1945") on
  cards, list rows and details, alongside the release year. Chronological order
  follows those timeframes, and the mobile Chrono list groups by them.
- Mobile view navigation is List / Grid / Spatial. List rows place IMDb and
  Rotten Tomatoes numeric badges together beneath their phase/budget metadata,
  with rank numbers when sorting by rating.
- Flip the direction with the Order toggle beside desktop sorting or beside
  mobile search on the second header row: every sort has two directions, so a
  tap reverses the order. Its label shows the current order (Newest, 6 → 1,
  Z–A) and its sort icon's bars flip with it. In Spatial, connection lines and
  row labels wait for the cards to finish moving after a new layout (row labels
  also after a selection closes), then fade back in. Mobile uses quieter search text and taller bottom sort tabs.
  Filters offers the two full order labels for the current mode without repeating
  the sort navigation; mobile A–Z is now a main navigation tab. Grid, List and
  Spatial use the same order; unrated titles stay last for either rating direction.
  Changing the sort mode, order, All / Unseen / Seen / Watchlist or the phase,
  films/series and budget filters animates mobile Grid/List and the desktop List:
  titles glide to their new slots, echoing Spatial. On phones, changes made in the
  filter sheet play when the sheet closes.
  Switching between List and Grid on phones moves each title from its old spot
  while the old layout fades (all off with reduced motion).
- Menus in the desktop toolbar (language, order, filters, account, search
  suggestions) open over the details drawer; the zoom control moves left of it.
- Phase, film/series, budget and release (Released only) filters. All / Unseen / Seen / Watchlist is an
  always-visible switch (desktop toolbar; mobile second header row, beside the
  List/Grid/Spatial menu), with a dashed-ring, check and bookmark icon for each state.
- English and Brazilian Portuguese. The first visit follows the browser/phone
  language; a language menu in the header (desktop toolbar, mobile app bar)
  overrides it per device. Portuguese shows official Brazilian release titles,
  and search matches titles and characters in either language, with or without
  accents ("Capitao" finds "Capitão").
- Desktop has Spatial and List views (switch at the end of the sort row). The
  List is one row per title with sortable column headers (title, phase, release,
  in-story years, IMDb, RT) that stay in step with the sort row; a row opens the
  cast drawer, which sits below the toolbar. Columns drop as the List narrows.
- Cast drawer on desktop; Grid, List and Spatial views with detail sheets on mobile.
- Details read the same on desktop and phones: poster beside the phase, type,
  year, title, release date and story timeframe; then IMDb and RT scores
  ("Ratings after release" for a title not out yet), the budget ("Not
  published" when unknown), Seen and Watchlist, the synopsis and the cast.
  Both surfaces render one shared body (`TitleDetailsBody` in `mobile.jsx`).
- Up next suggests what to watch now: the first released title you haven't
  marked seen, earliest first in release order (story order on Chronological),
  or the first of the list itself on A–Z, IMDb and RT. It has Mark seen,
  Watchlist and a × that hides it until the page is reloaded. It follows the
  Watchlist tab, a pinned character and the type, phase and budget filters,
  and says so in one line. Phones show it as a card at the top of the List and
  Grid (the title's own row is left out, so it never appears twice), the
  desktop List as a strip above the table, desktop Spatial as a row in the All
  titles meter and phone Spatial as a chip. When everything out is seen it
  says you're caught up and names the next arrival.
- Where to watch: a section of the details, closed until you open it (the
  cast folds the same way), lists the services offering a released title in
  your country (stream and free with their logos, rent or buy on one line),
  with one link to TMDB's page for all options and prices. The country is
  guessed from the browser (language, then time zone, then the US) and can be
  changed in the section; it is kept on this device only. The data is a dated
  snapshot from JustWatch via TMDB (`watch-data.js`), refreshed by a
  maintainer script; the app makes no API calls of its own. United States and
  Brazil to start; titles not out yet show their release date instead.
- Guides: short, curated paths through the catalogue (a Guides button in the
  desktop toolbar and the phone app bar). Catch up before Avengers: Doomsday,
  the Infinity Saga essentials, Spider-Man, the Avengers films, the Multiverse
  Saga and the animated series. Each stop says why it is there; essential
  stops are numbered and optional ones sit behind "Include optional". An open
  guide works like a pinned character: the List and Grid show its stops in
  order with the next one marked, Spatial dims the rest and draws the route
  between its numbered cards (an arrow on an event guide's destination), the
  stepper walks the stops, Up next suggests the next stop, Escape or × closes
  it (closing is how to see every title again: a guide shows only its own),
  and `?guide=` shares it. Search suggests guides by name, a character
  with a guide offers "See the curated path", and a title's details list the
  guides it belongs to ("Part of"). Finishing a guide's essential stops bursts
  green confetti once per guide (none with reduced motion). Every title also
  carries a continuity marker (main, alternate reality or anthology).
- "What have you seen?": a poster grid of every released title, by phase in
  release order, to mark many as seen in one go. The first-visit welcome
  offers it ("Mark what I've seen"), and it stays reachable from the account
  menu or sheet and from the Seen tab's empty state. Each phase has Select
  all / Clear; titles already seen start ticked and can be unticked. Saving is
  one change with one toast and Undo (no extra confirmation: the button names
  the number); closing with unsaved picks asks first. A full-height sheet on
  phones, a dialog on desktop.
- The synopsis is short and spoiler-light (three lines, then See more),
  written for this app in each language.
- Shareable addresses: the open title, a pinned character, the view, sort,
  order and catalogue filters live in the URL (for example
  `?sort=chrono&phase=3&title=thor-ragnarok`), so a view can be bookmarked or
  sent. A link opens exactly that state; what it leaves out takes the app's
  defaults. The Seen / Unseen / Watchlist filter, the search text, the language
  and anything from the account never go in. On phones, Back and Forward close
  and reopen the details.
- Release status at the precision it is known: "Released May 2, 2008",
  "Coming December 18, 2026", or "Expected March 2027 · day not yet confirmed"
  for a title with only an announced month (never counted as released, even
  once the month passes). Titles not out yet carry an Upcoming or Expected
  badge on cards and rows; released titles carry none.
- Selecting a title in Spatial arranges the titles that share its characters in
  rings around it, closest when they share the most; on desktop the selected
  title is drawn slightly larger. Unrelated cards fade out
  while the rings show (and come back when it closes), and lines are drawn
  among the ring's titles only. On desktop a click on empty canvas closes the
  selection, as a background tap does on phones. While a title is selected the
  count pill reads, for example, "17 of 64": the titles left on the canvas.
- When a search or filter leaves no titles, Spatial says so and offers to clear
  the search, the filters or both.
- Picking a character in the details highlights them: their titles are laid out
  in the current order (the rings belong to a selected title), with a Their
  titles / All titles switch (only their titles, or everything with the rest
  dimmed) and a stepper (‹ ›, or the arrow keys) that starts on the title you
  came from and visits each of their titles. The current title is ringed in the
  character's colour. Desktop shows this in a banner; phones close the details
  sheet and show a floating pill above the sort bar (character, actor, stepper:
  their number of titles, then 1/13 and so on)
  and always show only that character's titles; stepping in List or Grid scrolls
  the current title fully into view, clear of the pill and the top edge.
  Recast characters (Bruce Banner, James Rhodes, Thaddeus Ross, Monica Rambeau)
  keep one chain across all their performers: the banner names whoever plays
  the character in the title in view, with that performer's own title count,
  while the stepper counts the whole chain ("6 of 8"). On desktop the banner
  stops at the details panel's edge, the same as its hover preview.
- On phones' All tab, each run of two or more consecutive seen titles gets an
  accordion header that folds it into one summary row; order is never changed.
  In List the seen titles are compact rows (headings inside a folded run hide
  with it); in Grid each run is its own section and cards glide when runs form
  or split. Folds stay closed across visits on this device (shared by List and
  Grid). Rows shrink, grow and fold with an animation once the collection has
  loaded (none with reduced motion). The Seen tab keeps full rows and cards.
  Watchlisted titles have a thin amber outline outside the Watchlist tab.
- Phone sheets close with the × button, a tap on the handle, a swipe down or
  the browser's Back button (each open sheet owns one history entry).
- Spatial timelines have labelled rows: Release by phase, Chronological by
  in-story era (Before 2008, 2008–2012, … 2027–2028), so both read as a
  left-to-right staircase. Character labels on a hovered or selected title's
  connections draw above the cards and avoid covering them; hovering a line
  highlights the two titles it joins and names them in its tooltip. Clicking a
  connection brings its two titles side by side (Escape or a background click
  restores the layout); links between titles in the same row arc below it.
  Hovering a character in the drawer lights only that character's lines.
- Escape closes the desktop details unless the search box, a menu or the pair
  view claims it. Details opened from the keyboard take focus and give it back
  when they close.
- In desktop Spatial, Tab reaches each card (then its Seen and Watchlist
  buttons) and Enter opens it; a card tabbed to off-screen glides into view.
- On phones, Spatial's grid layouts (Phase, A–Z, IMDb, RT) open with three
  whole columns and the next column and row peeking past the right and bottom
  edges, so it's clear the canvas pans; the first row sits below the count pill.
- Marking a title seen or adding it to the watchlist pops the button and shows a
  toast with Undo; completing every released title in a phase (or the whole MCU)
  adds confetti. Seen and Watchlist show a count badge (hidden at zero) that
  animates as it changes. Motion is skipped with reduced motion.
- Progress: in By Phase order each phase has a header with a segmented meter
  (one tick per released title), the count (5/6), a check disc once complete
  and "+N" for titles not yet released. Every other order shows one All titles
  meter over the whole catalogue instead. In both Lists and the phone Grid the
  header pins while its section is on screen and its meter fills as it scrolls
  into view; on Spatial, phase headers sit on pills above their rows and the
  All titles meter floats top-right (desktop) or under the count pill (phones).
  Counts ignore the Seen/Watchlist tab, and the headers stand down during a
  text search or with a character pinned.
- About MCU Connections (account menu footer on desktop, account sheet on phones,
  for guests too): what the app is, ways to explore it, and credits. A future
  Settings entry will join it there. First-time visitors see it once as a
  welcome (a browser with no saved preferences, language, collection or sign-in);
  to see it again, use a private/incognito window or add `?welcome` to the URL.
- Search suggestions: from two letters, a list under the search box previews
  matching actors, characters and titles (names in every language). Picking a
  character (or an actor who plays one character) opens that character's view,
  with Their titles / All titles and the stepper, and clears the box; an actor
  with two roles stays a text search. Picking a title opens its details and
  clears the box rather than filtering by its name, so on Spatial it is selected
  among its neighbours; a pinned character steps aside first. A recast
  character offers one row per performer, each naming who played the part.
  Arrow keys, Enter and Escape work; free-text search is unchanged.
  Mobile opens in List; each device then remembers its last view, sort mode and order.
- Seen and watchlist controls on cards and details. Marking a watchlisted title
  seen moves it to seen; un-seeing returns it to untracked.
- Marking many at once. Every progress header, on phones and in the desktop
  List, offers "Mark all seen" or "Mark 4 more seen" (each phase in By Phase,
  All titles in every other order). In the desktop List you can also tick rows
  (Shift-click for a range, a phase header's box for that phase in By Phase,
  the column header box for everything shown) and use the bar that appears:
  Mark as seen, Add to Watchlist, or Mark as unseen under More. Unreleased titles are never marked
  seen in bulk, anything over 20 titles (and any Mark as unseen) asks first, and
  the toast's Undo puts every title back as it was, a replaced watchlist
  included. Escape clears the selection before it closes the details.
- Guest tracking saved in this browser; Google sign-in merges those marks and
  syncs the collection across devices. Merge precedence is seen > watchlist > none.
  A signed-out guest (when sign-in is available) is reminded once, right after
  marking a 3rd title, that signing in saves the list across devices, and once
  more at 10 (`mcu.signInNudge.v1` remembers it; dialog on desktop, sheet on
  phones; it waits until any open sheet or dialog closes).
- Released-title completion computed from release dates and the local calendar
  date, with a separate watchlist count. Unreleased titles do not affect completion.
- In Spatial view, collection filters dim non-matching titles in place; Grid/List
  filter their contents. Changing a title's status does not reflow the canvas.
- Named mobile dialogs, keyboard focus handling and accessible pressed states.

## The data

- **64 titles** spanning Phases 1–6, 2008–2027 (40 films, 24 series)
- **84 characters**, connecting titles through shared character identities
- Posters and actor portraits sourced from TMDB (credited in About with TMDB's
  notice; TMDB also asks for its logo there, not added yet)
- A poster or portrait that fails to load falls back to generated art or the
  character's initials
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

The app needs no package installation, npm, bundler, router or application
server (V3 rule; V4 plans a build step, see docs/decisions.md). The optional QA
checks in `qa/` are the one development-only exception (below).
The entry point is `index.html`. React and ReactDOM (production builds), Babel
standalone and supabase-js load from pinned CDN scripts with SRI; JSX compiles in the browser. Files share
exports through `window.*`, not ES modules.

`boot.js` loads first and shows a startup screen inside `#root` (brand, spinner,
"Loading…") until React's first render replaces it. A script that cannot load
or an error before that render turns it into a short explanation with a Reload
button; a slow start says so after 25 seconds. The locale files and `i18n.js`
load before the CDN scripts so that screen is translated.

From the repository directory, run a static server:

```bash
python3 -m http.server 8123
```

Open [http://localhost:8123/](http://localhost:8123/). The direct
`http://localhost:8123/index.html` address works too, but Google sign-in requires
that exact page URL to be in Supabase's redirect allowlist. Do not use `file://`
for OAuth. The verification sessions used port 8126; any different port must
also be configured in Google/Supabase before testing sign-in.

The catalog does not require Supabase to render. A cold page load still needs
access to the CDN libraries; this is not a bundled offline app or service worker.

### Automated checks (optional)

`qa/` holds headless browser checks (Playwright and axe-core) for agents and
maintainers. Set up once with `bash qa/setup.sh` (Node 18+), then run
`bash qa/regress.sh` for the full regression or `node qa/a11y-scan.js` for
accessibility. They are development-only: the site never loads them and Vercel
does not deploy the folder. Details are in [qa/README.md](qa/README.md).

## Supabase and Google setup

### Database and public client configuration

1. Create a Supabase project, or use the existing project
   `wauhmmftltlxzrcwpdvp`. Its schema is already deployed; a new project needs
   [schema.sql](schema.sql) run in its SQL editor.
2. Run the sanity checks at the bottom of the schema: RLS enabled, four ownership
   policies, and two-account isolation tested with actual signed-in client requests.
   `authenticated` has CRUD grants; `anon` cannot access `title_states`.
3. Put the project's URL and **public publishable key** in
   [config.js](config.js). Both are intentionally committed. Never add a
   service-role/secret key, Google client secret, database or SMTP credential.
4. In Supabase → Authentication → Sign In / Providers: Google ON, new-user signup
   ON, anonymous sign-ins OFF, and **Email → Enable email provider OFF**.
   Email/password is deferred to Phase 6 and requires separate approval.

Collections use `title_states.user_id → auth.users.id`, with RLS based on
`auth.uid()`. Auth credentials stay with Supabase Auth; there is no application
password table or profile table. Title ids in `data.js` are permanent and must
never be renamed or reused. `none` is the absence of a row, so clearing deletes it.

### Google OAuth client

1. In [Google Auth Platform](https://console.cloud.google.com/auth/overview),
   create/select the project, configure branding/support details and audience,
   and create a **Web application** OAuth client. If the app is in Testing,
   add the Google accounts that will test it to the test-user audience.
2. Configure the required basic identity scopes: openid, email and profile.
3. Under **Authorized JavaScript origins**, add the origins in the table below
   without a trailing slash.
4. Under **Authorized redirect URIs**, use the Supabase callback, not an app URL:

   ```text
   https://wauhmmftltlxzrcwpdvp.supabase.co/auth/v1/callback
   ```

   For a different Supabase project, use that project's exact callback value.
5. Enter the Google client ID and secret in Supabase's Google provider dashboard
   and enable it. The secret belongs only in that dashboard.

### App redirects

In Supabase → Authentication → URL Configuration, set the **Site URL** to
`https://mcu-connections.vercel.app/` and allow the exact app page URLs needed:

| Environment | Google JavaScript origin | Supabase redirect URL |
|---|---|---|
| Production | `https://mcu-connections.vercel.app` | `https://mcu-connections.vercel.app/` |
| V3 preview | `https://mcu-connections-git-version-30-afr-bfcd.vercel.app` | `https://mcu-connections-git-version-30-afr-bfcd.vercel.app/` |
| Local default | `http://localhost:8123` | `http://localhost:8123/` |
| Local verification | `http://localhost:8126` | `http://localhost:8126/` |

Add the corresponding `/index.html` URL separately if entering the app that way.
The app supplies `redirectTo = origin + pathname`, so sign-in returns to the
origin/page where it began. Preview and production share the configured Supabase
project and collections, but browser sessions/guest storage are separate per
origin. No callback route is needed: supabase-js handles PKCE, then the account
provider removes OAuth parameters from the URL.

References: [Supabase Google setup](https://supabase.com/docs/guides/auth/social-sign-in/auth-google)
and [redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls).

## Sync, errors and availability

Guest marks use `localStorage` key `mcu.collection.v1`; the auth client uses
`mcu.auth.v1`. Display preferences (mobile view, desktop view, sort mode and order) use
`mcu.prefs.v1` on that device only; filters and search are not saved. The
language choice uses `mcu.lang.v1`. Signed-in rows load from Supabase. Guest merges write only changed
rows and clear guest storage only after success. Per-title write queues retain
their original account scope, keep the latest intent, and prevent stale responses
from changing a different account's UI. Writes are optimistic; failures roll back
to the last confirmed value and show an inline error.

Initial loading disables collection controls without blocking the catalog.
Five-second deadlines cover session restoration, collection operations and stalled
OAuth startup. If the initial cloud read/merge cannot reach the service, tracking
falls back to guest mode with **Sync unavailable**. Account data is never copied
into guest storage. **Retry connection** reloads to restore the saved session and
merge local marks once service is reachable. Permission/validation failures offer
**Retry sync** and pause collection editing until resolved. A failed sync also
shows a chip with **Retry** in the desktop toolbar and the phone app bar, so it
is visible without opening Account; while syncing, the chip shows a spinner.

A failed signed-in write can have an uncertain server outcome after a network
loss; reload to reconcile with the cloud. Unknown title ids are retained and
ignored by the UI. Sign-out clears the displayed account collection and never
copies it into guest storage; any independently retained, unmerged guest marks
remain guest data.

**Free-tier policy: accept pauses; no keep-alive automation.** Restore a paused
project from the Supabase dashboard when needed. Guest tracking continues during
an outage. See [Supabase project pausing](https://supabase.com/docs/guides/platform/free-project-pausing).

## Languages

Each language is one file in `locales/` that registers itself on
`window.MCU_LOCALES`; `i18n.js` loads after them. English (`locales/en.js`) holds
every key and is the fallback for anything another language omits (missing keys
are reported once in the console on localhost). Strings use `{placeholders}`;
`{ one, other }` objects are plural forms chosen with `Intl.PluralRules`.
Besides interface text, a locale may provide `titles` (official local release
names by title id), `titleAliases` (other names people search for),
`characters`, `storyWords`, `storyNotes` and `synopses` (English is the
fallback for any title a language leaves out).

To add a language: copy `locales/pt-BR.js` to `locales/<code>.js`, set its
`meta` (name in that language, short code, `htmlLang`, matching browser
prefixes), translate it, and add its `<script>` tag to `index.html` before
`i18n.js`. The header menu lists it automatically. Check long labels at the
narrowest desktop and phone widths; the toolbar steps down labels by width.

## Deploying and releasing

- Commit locally, then push `version/3.0` to update the Vercel preview. A commit
  alone does not upload anything. The Vercel Git integration deploys that branch
  separately from the production branch.
- To rebuild with changed Vercel settings, select the latest **version/3.0**
  deployment and Redeploy into **Preview / Pre-Production**. Confirm the source
  branch and commit in the modal. Redeploy rebuilds source; it does not merge Git.
- Vercel's deployment protection is separate from MCU Google sign-in. Public
  browsing can be enabled for previews in Deployment Protection. The toolbar's
  Preview setting is separate and changes apply to new deployments.
- **Wait for fresh user confirmation before merging maintenance into main.** That merge
  can trigger the production deployment. After approval and deployment, verify
  production Google sign-in, reload, sync and sign-out at the production URL.
- Continue the user's bug/improvement work on `version/3.0` before Phase 6.
  Email/password work needs its own plan and explicit confirmation.

## Project structure

| File | Purpose |
|---|---|
| `index.html` | Entry point; startup screen markup, pinned/SRI CDN scripts and application script order |
| `boot.js` | Startup screen states (loading, slow, failed start with Reload) before the first render |
| `favicon.png`, `apple-touch-icon.png`, `og-image.jpg` | Tab icon, home-screen icon and link-preview image (from the brand mark) |
| `data.js` | Static titles/characters, ratings, phases, stable ids and variant links |
| `media-data.js` | TMDB poster and actor-portrait paths |
| `config.js` | Public Supabase project URL and publishable key |
| `supabase-client.js` | Shared client as `window.mcuSupabase`, or graceful unavailability |
| `tracking.jsx` | Guest/account state, merge, request deadlines, queues, progress, status actions |
| `account.jsx` | Google auth/session state, account UI, sign-out and degraded-mode recovery |
| `about.jsx` | About dialog (desktop) and sheet (phones) with credits; shared dialog shell |
| `celebrate.jsx` | Status toast with Undo, milestone confetti and the guest sign-in reminder |
| `app.jsx` | Desktop canvas, toolbar, cast drawer and shared root/mobile integration |
| `mobile.jsx` | Touch Grid/List/Spatial, filters, details and accessible sheets |
| `upnext.jsx` | Up next: the suggestion card, List strip, Spatial meter row and phone chip (the rule is `MCU_nextUp` in `tracking.jsx`) |
| `watch.jsx` | Where to watch in the details: offers for the chosen country, the country picker, credits |
| `watch-data.js` | The where-to-watch snapshot (written by `tools/refresh-watch.js`; do not edit by hand) |
| `tools/refresh-watch.js` | Maintainer script: refreshes `watch-data.js` from TMDB (needs `TMDB_READ_TOKEN` in your environment; not deployed) |
| `guides.js` | Guides data (stops, weights, reasons in each language) and the per-title continuity marker; edited by hand, reviewed before shipping |
| `guides-ui.jsx` | Guides: the menu, desktop banner and List, phone views and pill, the meter, "Part of" in the details |
| `picker.jsx` | "What have you seen?": the poster-grid picker opened from the welcome, the account menu/sheet and the Seen empty state |
| `desktop-list.jsx` | Desktop List view: grouped rows, sortable column headers, status actions |
| `search-suggest.jsx` | Search box with guide/actor/character/title suggestions, shared by desktop and mobile |
| `poster.jsx` | TMDB posters or generated abstract fallback (also when an image fails); cast portraits with initials fallback |
| `connections.jsx` | Standalone connection layer retained for reference; not wired into the app |
| `styles.css` / `styles-mobile.css` | Desktop/touch layout, status treatments, focus and dialogs |
| `schema.sql` | Watch-state table, constraints, trigger, grants and ownership RLS |
| `V3-SPEC.md` / `V3-TASKS.md` | Architecture/decisions and phased delivery checklist |
| `KICKOFF-PROMPT.md` | Original kickoff and current continuation/approval rules |
| `qa/` | Development-only headless checks (Playwright, axe-core); not deployed. See qa/README.md |
| `docs/HANDOFF.md` | Current handoff: state, architecture, quirks, open threads |
| `docs/decisions.md` | Running decision log (date, decision, reason) |
| `docs/V3-VERIFICATION.md` | Detailed phase-by-phase evidence and limitations |
| `CHANGELOG.md` | Dated commit summaries, release context and verification links |
| `AGENTS.md` | Contributor workflow, shared Codex/Claude working tree, attribution and privacy instructions |
| `CLAUDE.md` | Points Claude to `AGENTS.md` so both agents follow one rule set |
| `i18n.js` | Language runtime: detection, `tr()` lookup with English fallback, plurals, title/character names, formatting |
| `locales/en.js` / `locales/pt-BR.js` | One catalog per language: UI strings, official titles, search aliases, character names, story labels |
| `docs/PRIVACY-REVIEW.md` | Source/history review, findings and proposed historical cleanup |

## Manual verification

There is no test runner. The checklist below summarizes spec §10; rerun the
relevant items after changes and record actual evidence in the
[verification log](docs/V3-VERIFICATION.md). Results below are from 2026-10-24.

| Check | Result and evidence |
|---|---|
| Cross-device sync | Passed on deployed V3: user marked as guest on desktop, signed in, then restored marks on phone. |
| Cross-account isolation | Passed with two Google accounts switched in the same browser and a real account A API request for account B's populated rows returning zero. Separate browser-profile testing remains unperformed. |
| Sign-out clearing | Passed with a populated account; guest key was not filled from account rows. |
| Account switching | Passed with distinct populated collections; no UI/data bleed. |
| Guest merge | Real guest merge passed. Controlled failures preserved the guest copy; precedence seen > watchlist verified. |
| Drag/click isolation | Passed on desktop at 100/75/50% and mobile Spatial; status changes kept the canvas transform. |
| Mobile nesting and navigation | No nested buttons; Grid/List/Spatial detail navigation and keyboard order passed. User repeated phone sheet/scroll checks after Phase 4. |
| Degraded mode | Real browser CSP blocked backend connections; bounded recovery, guest persistence and missing-CDN behavior passed. Hung-request fixtures recorded no unhandled rejection. |
| OAuth cancellation | Real Google chooser → Back returned to usable signed-out state; stalled-start fixture also recovered. |
| Release denominator | Browser-local clock overrides gave 59 on Oct 13 and 60 on Oct 14; no constant denominator. |

Additional hardening: toolbar fit at 900–1200px; modal focus trapping/Escape/return
and visible focus rings passed; selected/saving state exposed in browser
accessibility output. **Spoken VoiceOver/TalkBack output is untested.** Controlled
fixtures lived outside the repository. No CI/test runner is claimed; Vercel's
successful deployment status is a deployment check.

The initial V3 release has been merged into main. The checks above retain their
original preview scope; a fresh post-merge production OAuth/sync check is not
claimed here. The catalog audit supersedes the earlier release-date boundary
example for VisionQuest.

## Catalog maintenance

IMDb scores represent whole movies/series; released season entries share their
series IMDb score. RT scores are season-specific critics’ Tomatometer values.
The [2026-10-24 audit](docs/CATALOG-AUDIT.md) records sources and research limits.
Month-only release windows do not count toward released completion until a day
is confirmed. A weekly Codex task prepares sourced updates for review on Mondays
at 9am Eastern; it does not apply, commit or publish changes.

Where to watch is refreshed with the weekly audit, and in the week a title
reaches streaming. With a TMDB API Read Access Token in your own environment
(never in the repository or chat):

    TMDB_READ_TOKEN=... node tools/refresh-watch.js

It finds each released title's TMDB id from its IMDb id in
`docs/CATALOG-SOURCES.json`, warns when the TMDB title or year does not match,
rewrites `watch-data.js` and prints what changed. Review the diff and commit it
like any catalogue change. TMDB's data is free for non-commercial use with
attribution to TMDB and JustWatch; affiliate or tracking links would need a
commercial licence first.

## Known limitations

- Catalog/cast lists, ratings and budgets are hand-maintained. Upcoming cast
  announcements and release dates can change.
- Some titles have no shared-character connections with the rest of the graph.
- Cold loads require the CDN libraries; there is no service worker/offline bundle.
- Changing the collection filter itself intentionally recenters Spatial to frame
  matches. Changing a title's tracking status under that filter does not recenter.
- Active filters/view preferences are device-scoped; only collection rows sync.
- Email/password signup, recovery and SMTP are deferred to Phase 6.

Keep this README current when behavior/setup changes. Treat the dated verification
log as evidence, not as a live list of pending setup tasks.


## Credits and tools

Created and maintained by [Andre Ribeiro](https://github.com/AndreFelipeRibeiro),
with development, planning, documentation and verification assistance from
**Anthropic Claude** and **OpenAI ChatGPT/Codex**. Earlier commits include Claude
co-author credits. Codex and Claude now share the `version/3.0` working tree;
assisted commits carry a Codex or Claude co-author trailer while retaining the
maintainer as the primary author.

| Area | Tools, services and sources used |
|---|---|
| Application | React, ReactDOM, Babel standalone; browser HTML, CSS and JavaScript |
| Source control and hosting | Git, GitHub and Vercel |
| Accounts and cloud data | Supabase Auth/Postgres and Google OAuth |
| Catalog and images | TMDB poster/portrait paths; where-to-watch data from JustWatch via TMDB; IMDb user ratings; Rotten Tomatoes critics scores; Marvel and Wikipedia references, with specific catalog evidence in the audit |
| Development and verification | Claude and ChatGPT/Codex; browser inspection and desktop/mobile manual checks; supporting Python/Node checks outside the application runtime |

[AGENTS.md](AGENTS.md) records the project workflow, changelog maintenance,
co-author attribution and privacy rules. These credits do not retroactively
change the authorship metadata of published commits.
