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
- Desktop navigation uses one row on wide screens and two full-width rows on
  narrower desktops: brand, sort modes and Order above; type, Filters, search,
  Recenter and account below. The account control shows Sign in or the signed-in
  user's name, shortened visually when space is limited.
- Six sort modes: release, chronology, phase, title, IMDb and Rotten Tomatoes.
- Each released title shows its in-story timeframe (e.g. "Set in 1943–1945") on
  cards, list rows and details, alongside the release year. Chronological order
  follows those timeframes, and the mobile Chrono list groups by them.
- Mobile view navigation is List / Grid / Spatial. List rows place IMDb and
  Rotten Tomatoes numeric badges together beneath their phase/budget metadata,
  with rank numbers when sorting by rating.
- Choose direction from a separate order menu beside desktop sorting or beside
  mobile search on the second header row. Its label shows the current order
  (Newest, 6 → 1, Z–A). Mobile uses quieter search text and taller bottom sort tabs.
  Filters offers the two full order labels for the current mode without repeating
  the sort navigation; mobile A–Z is now a main navigation tab. Grid, List and
  Spatial use the same order; unrated titles stay last for either rating direction.
  Changing the sort mode or order animates mobile Grid/List: titles glide to their
  new slots, echoing Spatial (off with reduced motion).
- Phase, film/series and budget filters. All / Unseen / Seen / Watchlist is an
  always-visible switch (desktop toolbar; mobile second header row, beside the
  List/Grid/Spatial menu), with a dashed-ring, check and bookmark icon for each state.
- Cast drawer on desktop; Grid, List and Spatial views with detail sheets on mobile.
  Mobile opens in List; each device then remembers its last view, sort mode and order.
- Seen and watchlist controls on cards and details. Marking a watchlisted title
  seen moves it to seen; un-seeing returns it to untracked.
- Guest tracking saved in this browser; Google sign-in merges those marks and
  syncs the collection across devices. Merge precedence is seen > watchlist > none.
- Released-title completion computed from release dates and the local calendar
  date, with a separate watchlist count. Unreleased titles do not affect completion.
- In Spatial view, collection filters dim non-matching titles in place; Grid/List
  filter their contents. Changing a title's status does not reflow the canvas.
- Named mobile dialogs, keyboard focus handling and accessible pressed states.

## The data

- **64 titles** spanning Phases 1–6, 2008–2027 (40 films, 24 series)
- **83 characters**, connecting titles through shared character identities
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

No package installation, npm, bundler, router, application server or test runner.
The entry point is `index.html`. React, ReactDOM, Babel standalone and supabase-js
load from pinned CDN scripts with SRI; JSX compiles in the browser. Files share
exports through `window.*`, not ES modules.

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
`mcu.auth.v1`. Display preferences (mobile view, sort mode and order) use
`mcu.prefs.v1` on that device only; filters and search are not saved. Signed-in rows load from Supabase. Guest merges write only changed
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
**Retry sync** and pause collection editing until resolved.

A failed signed-in write can have an uncertain server outcome after a network
loss; reload to reconcile with the cloud. Unknown title ids are retained and
ignored by the UI. Sign-out clears the displayed account collection and never
copies it into guest storage; any independently retained, unmerged guest marks
remain guest data.

**Free-tier policy: accept pauses; no keep-alive automation.** Restore a paused
project from the Supabase dashboard when needed. Guest tracking continues during
an outage. See [Supabase project pausing](https://supabase.com/docs/guides/platform/free-project-pausing).

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
| `index.html` | Entry point; pinned/SRI CDN scripts and application script order |
| `data.js` | Static titles/characters, ratings, phases, stable ids and variant links |
| `media-data.js` | TMDB poster and actor-portrait paths |
| `config.js` | Public Supabase project URL and publishable key |
| `supabase-client.js` | Shared client as `window.mcuSupabase`, or graceful unavailability |
| `tracking.jsx` | Guest/account state, merge, request deadlines, queues, progress, status actions |
| `account.jsx` | Google auth/session state, account UI, sign-out and degraded-mode recovery |
| `app.jsx` | Desktop canvas, toolbar, cast drawer and shared root/mobile integration |
| `mobile.jsx` | Touch Grid/List/Spatial, filters, details and accessible sheets |
| `poster.jsx` | TMDB posters or generated abstract fallback |
| `connections.jsx` | Standalone connection layer retained for reference; not wired into the app |
| `styles.css` / `styles-mobile.css` | Desktop/touch layout, status treatments, focus and dialogs |
| `schema.sql` | Watch-state table, constraints, trigger, grants and ownership RLS |
| `V3-SPEC.md` / `V3-TASKS.md` | Architecture/decisions and phased delivery checklist |
| `KICKOFF-PROMPT.md` | Original kickoff and current continuation/approval rules |
| `docs/V3-VERIFICATION.md` | Detailed phase-by-phase evidence and limitations |
| `CHANGELOG.md` | Dated commit summaries, release context and verification links |
| `AGENTS.md` | Contributor workflow, shared Codex/Claude working tree, attribution and privacy instructions |
| `CLAUDE.md` | Points Claude to `AGENTS.md` so both agents follow one rule set |
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

Created and maintained by [André Ribeiro](https://github.com/AndreFelipeRibeiro),
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
| Catalog and images | TMDB poster/portrait paths; IMDb user ratings; Rotten Tomatoes critics scores; Marvel and Wikipedia references, with specific catalog evidence in the audit |
| Development and verification | Claude and ChatGPT/Codex; browser inspection and desktop/mobile manual checks; supporting Python/Node checks outside the application runtime |

[AGENTS.md](AGENTS.md) records the project workflow, changelog maintenance,
co-author attribution and privacy rules. These credits do not retroactively
change the authorship metadata of published commits.
