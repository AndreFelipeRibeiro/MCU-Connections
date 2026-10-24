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

## V3 Phase 2 checkpoint — 2026-10-24

Phase 2 remains open pending Google OAuth setup and real-account acceptance.
Public project configuration is populated for `wauhmmftltlxzrcwpdvp`. The supplied
root `schema.sql` (the plan calls it `supabase/schema.sql`) was deployed unchanged
as migration `v3_title_states`. Verified RLS, all four ownership policies, table
constraints, authenticated grants and denied anon grants. An unauthenticated
PostgREST read returned permission denied; the Supabase security advisor returned
no findings. This does not yet prove two-account isolation through real sessions.

Auth initialization now ignores stale initial session results after newer auth
events, cancels its timeout on those events, and accepts later recovery. Sign-out
uses local scope and reports returned SDK errors without pretending to sign out.
Collection buttons and account counts show loading during session restoration.
At 900–960px, desktop search occupies a second toolbar row to keep it usable.

Manual browser checks used the current working copy, including pre-existing
uncommitted Phase 3 sync changes. A temporary, out-of-repo fake client exercised:
initial loading/disabled controls; signed-in event followed by stale session
resolution; failed refresh; five-second timeout fallback; failed and successful
sign-out; and a recoverable OAuth-start error. These are controlled UI checks,
not live Google or cloud-sync tests. The real configured client initialized on a
fresh localhost origin. Desktop toolbar checks at 900/1000/1200px found no
horizontal overflow; Escape closed the account popover. At 390px, the account
sheet rendered and the grid/list/spatial controls remained in their own row.

Still required: enable Google, disable email/password, verify redirect settings,
complete a real Google round trip (profile, reload, cancellation, clean callback
URL), sign out, and switch to a second Google account without state/data bleed.
At this checkpoint, Google was disabled, email enabled and anonymous auth disabled.

For local OAuth testing, the preview is `http://localhost:8126/`. Google Web OAuth
client JavaScript origin: `http://localhost:8126`; authorized redirect URI:
`https://wauhmmftltlxzrcwpdvp.supabase.co/auth/v1/callback`. Put the Google client ID
and secret only in Supabase's Google provider settings. Add the exact local page
URL to Supabase's redirect allowlist; add `/index.html` separately if using that
entry URL. Choose the actual production URL when publishing. See the official
[Google provider setup](https://supabase.com/docs/guides/auth/social-sign-in/auth-google)
and [redirect configuration](https://supabase.com/docs/guides/auth/redirect-urls).

### Phase 2 live Google check — 2026-10-24

A real Google sign-in completed at `http://localhost:8126/`. The account sheet
showed the Google name and email, remained signed in after reload, and the
callback URL contained no auth parameters. The browser error log was empty.
Sign-out returned to the guest UI with zero counts and remained signed out after
reload. This account had no collection rows, so this check does not establish
clearing of a populated account or cross-account data isolation.

Live Auth settings now report Google enabled, Email disabled, anonymous sign-in
disabled. A second-account round trip remains pending. Phase 6 is still deferred.


### Phase 2 second-account check — 2026-10-24

After signing out of the first Google account, the same browser signed in as a
second Google account. Its profile displayed correctly and persisted after
reload; the first profile was absent. Both accounts had empty collections, so
this establishes profile/session switching only, not isolation of populated
collections. That remains required in the sync/hardening verification.

Google OAuth now requests `prompt=select_account`, and the real Google account
chooser was verified, avoiding automatic reuse of the last Google session.
The localhost checks above used the working copy with its existing Phase 3 sync
work; the Phase 2 follow-up commit intentionally leaves that sync work uncommitted.
Preview/production round trips and real-device checks remain pending.


## V3 Phase 3 verification — 2026-10-24

Signed-in tracking now loads from Supabase, merges guest marks using
`seen > watchlist > none`, and saves through one queue per title. Setting a
status upserts; clearing deletes. `seen_at` is populated only for seen status.
Failed writes roll back to the last confirmed value and report an inline error.
An initial read/merge failure preserves guest storage, pauses editing, and offers
Retry sync in the account surface.

Account/guest transitions create a new request scope. Queued writes retain the
original user id; old completions cannot update a new account's UI, continue its
queue, or clear a newer guest copy. Account rows are never written to guest
storage. A changed guest copy from another tab is retained for a later merge.

Actual checks (browser Babel; no npm, runner or build step):

- [x] Real Google account: mark Iron Man seen and Thor watchlisted; SQL confirmed
  the stored statuses and correct null/non-null `seen_at`. Reload restored both.
- [x] Twenty rapid live toggles ended with the intended database status. A
  seen → watchlist transition cleared `seen_at`; clearing marks deleted rows.
- [x] Sign out of a populated account: guest UI was empty, and a temporary
  browser probe reported the guest storage key absent. A new guest Hulk mark
  merged into the other Google account and the guest key was cleared afterward.
- [x] Switch back: each real account loaded its own saved collection. With the
  second account's rows populated, the first account's actual Supabase/PostgREST
  session requested that user's id and received an empty result without error.
  This was a client API/RLS check, not an admin SQL read used as proof of RLS.
- [x] Temporary title marks were removed through the UI after the live checks.
- [x] An out-of-repo manual browser fixture used the actual application scripts
  with a controlled client. Guest seen beat remote watchlist; 20 toggles under
  delayed responses kept maximum concurrent requests per title at one; final
  remote state matched the UI. A failed save rolled back and showed an error.
- [x] The same fixture switched from A to B with an A write pending: B's state
  remained separate, and the remaining A queue did not run under B. Cancelling
  an in-flight guest merge preserved guest storage after its response arrived.
- [x] Failed initial reads and merge writes retained guest data and disabled
  status controls; keyboard activation of Retry sync succeeded and cleared
  guest storage only after the successful merge. The fixture's floating panel
  overlapped its mobile sheet, so pointer activation of Retry was not used as
  evidence; this panel is not part of the product or repository.
- [x] `git diff --check` passed. No schema or CDN dependency changes were needed.

Remaining: real-device/cross-device sync, full Phase 4 accessibility/degraded-mode
checks, and preview/production OAuth round trips. Local reloads and controlled
clients do not substitute for those. Email/password Phase 6 remains deferred and
requires a new explicit user confirmation.

Deployment URLs for Supabase's exact redirect allowlist:

- `https://mcu-connections.vercel.app/` (production Site URL)
- `https://mcu-connections-git-version-30-afr-bfcd.vercel.app/` (V3 preview)
- `http://localhost:8126/` (verification origin; README local-dev port 8123 can
  also be allowed when used)

Google's callback remains
`https://wauhmmftltlxzrcwpdvp.supabase.co/auth/v1/callback`; its JavaScript origins
use the deployment origins without trailing slashes. Keep Email and anonymous
sign-in disabled for the Google-only phases.


## V3 Phase 4 hardening — 2026-10-24

### Backend availability and free-tier policy

**Decision: accept free-tier pauses; no keep-alive automation.** Restore the
project from the Supabase dashboard when needed. See
[Supabase's project-pausing guidance](https://supabase.com/docs/guides/platform/free-project-pausing).
The catalog/guest collection remain usable when cloud services cannot be reached.
This does not promise a cold offline page load without cached React/Babel/CDN
assets: the existing static architecture still obtains those libraries online.

Session restoration, collection reads/merges/writes and OAuth-start waits now
have five-second UI deadlines. Collection operations abort their SDK request,
including its automatic retry loop. A failed initial read/merge caused by a
network error, timeout or server outage falls back to guest tracking and shows
Sync unavailable. Account collection data is hidden and never copied to the
guest key. Existing unmerged guest marks are preserved. Late auth results cannot
silently switch this degraded guest session back into account mode.

Retry connection reloads the page, restoring the saved session and merging guest
marks once service is reachable. Permission/validation errors retain the existing
Retry sync path. A failed signed-in write rolls back and reports its error inline;
a network failure can leave its server outcome uncertain, so reload to reconcile
with the cloud before assuming that write did or did not land.

### Dialog and keyboard behavior

Account, Filters and title-detail sheets have named modal dialog semantics.
Opening focuses Close; Tab/Shift-Tab stay within the sheet; Escape/scrim/Close
close it; focus returns to the opener where it still exists. Background app
siblings are inert while open. Sheet scrolling is contained, and the close target
is now 46 × 32px. Focus rings cover account actions, filters and view controls.
View and collection filter buttons expose selected state with aria-pressed;
status buttons expose saving through aria-busy. The primary mobile card buttons
and spatial-layout filtering were preserved.

### Verification record

- [x] User reported the deployed V3 preview's full desktop-guest → Google merge →
  phone sign-in flow passed, with saved titles restored on the phone.
- [x] User reported phone account/filter sheets, Grid/List details, Spatial
  pan/pinch and filtered-list scrolling all worked normally on the Phase 3
  preview. This is user evidence, not an agent-performed device test.
- [x] Browser network blocking: an out-of-repo local server applied CSP
  `connect-src 'self'` while the actual Supabase client restored its cached
  Google session. Initially this reproduced stuck collection loading; after the
  fix it fell back to guest mode. Guest marking survived reload under the block.
  This uses real browser connection blocking, not DevTools' request-blocking UI.
- [x] Supabase CDN omitted: full catalog and guest controls rendered, with the
  specific sync-unavailable message. This test did not block React/Babel assets.
- [x] Controlled clients with non-settling auth and collection requests recovered
  to guest mode after the deadline. A test-page unhandledrejection counter stayed
  at zero for the hung collection case. The production repository has no fixture.
- [x] Real Google flow: sign out locally, open Google account chooser, browser
  Back; signed-out app and enabled sign-in returned without a stuck spinner.
- [x] Non-settling OAuth-start fixture: error/retry button returned after five
  seconds, with zero unhandledrejection events recorded by the test page.
- [x] Successful guest merge and failed-save rollback still passed using the
  actual application with the controlled client after adding request deadlines;
  a stalled save rolled back and its control exposed aria-busy while pending.
- [x] Account modal: initial focus on Close; Shift-Tab wrapped to last action;
  Tab wrapped back; Escape restored Account focus. DOM showed inert background
  siblings. Grid, List and Spatial primary buttons opened named details dialogs.
- [x] Space toggled seen and aria-pressed; view and collection-filter pressed
  states changed correctly. Rendered DOM had zero nested buttons. Status targets
  measured 36 × 36px at mobile scale 1. Status/Close focus outlines measured 2px.
- [x] Desktop toolbar: no horizontal overflow at 900, 960, 961, 1000, 1100 and
  1200px; input widths were approximately 819, 879, 167, 206, 266 and 362px.
  Escape from the account popover returned focus to its opener.
- [x] Page-local browser Date override at local noon on 2026-10-13 and
  2026-10-14: account UI denominator changed from 59 to 60. Host/device clocks
  were unchanged. This extends Phase 1's direct helper probes to the rendered UI.
- [x] API-level isolation carried forward from Phase 3: a real signed-in account
  requested the other account's populated title_states rows and received zero
  rows. No schema/RLS changes were made in Phase 4.
- [x] `git diff --check` passed; no npm, build pipeline, router or test runner.

Final device follow-up: recheck opening/closing sheets and scrolling the updated
Phase 4 preview on the phone, because modal focus/inert behavior changed after
the user's earlier device pass. Actual spoken VoiceOver/TalkBack output was not
checked; browser accessibility state and keyboard behavior were verified above.
Production OAuth remains to be verified after an explicitly authorized merge.
Email/password Phase 6 remains deferred and requires separate confirmation.
