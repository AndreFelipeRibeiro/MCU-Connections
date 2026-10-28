# V3 verification log

Recorded on 2026-10-24. These chronological checkpoints preserve what was
checked at each phase, including temporary fixtures, user-reported device tests,
and limitations. Earlier statements such as “pending” describe that checkpoint;
use the [current README checklist](../README.md#manual-verification) for current
status. Nothing here claims that simulated clients replace real Google/device
checks. Temporary fixtures were outside the repository and are not required to
run the app.

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

Final device follow-up passed: on 2026-10-24, the user reloaded the updated
Phase 4 preview and confirmed Account, Filters, title details and scrolling
inside long sheets all worked normally. Phase 4 is complete. Actual spoken
VoiceOver/TalkBack output was not checked; browser accessibility state and
keyboard behavior were verified above.
Production OAuth remains to be verified after an explicitly authorized merge.
Email/password Phase 6 remains deferred and requires separate confirmation.

## V3 Phase 5 documentation — 2026-10-24

- Consolidated the README into current feature, setup, deployment and §10
  verification guidance; preserved the earlier checkpoints above as dated evidence.
- Corrected the legacy entry-point references to `index.html` with explicit user
  approval. Updated spec/task/kickoff status and release/Phase 6 approval gates.
- Added the permanent-title-id comment in `data.js`; compared everything from
  `const TITLES` onward against HEAD and confirmed it is byte-for-byte unchanged.
- Checked all relative Markdown file links, actual script targets/load order,
  pinned CDN SRI/crossorigin attributes, public config and schema statements.
  Confirmed the catalog still contains 64 titles (40 films, 24 series).
- `git diff --check` passed. No package manifest/tooling introduced; schema.sql
  remains unchanged. No runtime checks were rerun for this docs/comment-only phase.
- Fetched origin and confirmed the current V3 branch contains remote `main`.
  Merge and production deployment remain pending explicit user confirmation.

Separate-profile isolation and spoken screen-reader checks remain unperformed;
the README identifies those limits and the post-release production smoke check.

## V3 maintenance release — 2026-10-24

The user approved the mobile List layout/navigation changes and promoting all
current V3 maintenance to main. Earlier checkpoints above remain historical;
their pending merge gates were satisfied by this approval.

- Final mobile layout checked in Chrome at 320, 390, 430, 768 and 899px across
  Release, IMDb and RT: paired ratings under metadata, no row overflow, stable
  List / Grid / Spatial ids and no nested buttons.
- Unrated copy, details opening, separate seen/watchlist actions, view switching
  and List persistence after reload passed. Temporary guest marks were cleared.
  No browser console errors; no new runtime dependencies or schema changes.
- Previous catalog, ordering, responsive navigation, animation, preferences,
  Safari-tap emulation and camera checks are recorded in the changelog and
  catalog audit. They were not all repeated for this release preparation.
- Limits: no fresh physical-device, WebKit, spoken screen-reader, live Google
  OAuth or cross-device cloud-sync acceptance test for this maintenance merge.

### Post-merge production smoke check

Main merge: `8731121`; final mobile implementation/release docs: `e36e4fd`.
Both were pushed, and the two mobile tasks were closed in Notion with their
completion date and links. Main and version/3.0 were synchronized.

Observed production at mcu-connections.vercel.app in Chrome: 390×844 showed
List / Grid / Spatial, 64 List rows and inline ratings below metadata without
horizontal overflow. VisionQuest search returned one result with IMDb 8.0 and
RT 90%; clearing restored the list. Desktop at 1440×900 showed the updated
toolbar and Order label without overflow. Console error log was empty.
No account marks were changed and no new OAuth/cloud-sync flow was exercised.
This records an observed deployment result, not its exact deployment timestamp.

## V3 batch 4 — 2026-10-28

First batch worked in Claude Code. Five tickets: the regression script's silent
pass, the Portuguese release label, the guest sign-in reminder against Undo,
Spatial touch input on wide screens, and character-variant scope. Nothing was
committed or pushed at the time of writing, so this records local verification.

### The checks themselves were not trustworthy

`qa/regress.sh` wrapped every check in GNU `timeout`, which macOS does not
ship. Each check died with "command not found", the output grep matched
nothing, and the run reported success in about two seconds having executed no
browser at all. Separately, four checks print indented JSON, so a non-empty
errors array spans lines; the single-line pattern could not match one and fell
back to matching zero digits, printing a bare `"desktopErrors": ` that was
indistinguishable from an empty array. Both are fixed, and the script now exits
non-zero, so earlier "clean" macOS runs of this script should not be trusted.

### Full suite on the final working tree

- `bash qa/regress.sh`: **18 of 19 checks clean**. `test-camera` failed
  (`exited 1`, no errors field); it fails the same way on unmodified code, as
  recorded under "The camera check" below.
- `node qa/a11y-scan.js` and `LOC=pt-BR node qa/a11y-scan.js`: no violations on
  any of the 7 screens, in either language.
- All ten `.jsx` files and both locale files compile through the pinned Babel
  standalone build.

### Before and after, against a pristine HEAD copy

Each fix has a check that was run against an unmodified export of `HEAD`
(`SITE=` pointing at a clean copy) and then against the working tree, so the
reported behaviour is observed rather than assumed.

- `test-widetouch` at 1440×900 with touch reported: on HEAD `touchPan` did not
  move and `pinch` did not grow — finger input was entirely absent, because the
  touch handlers were attached on a width breakpoint. After: pan follows the
  finger by the full 90px, pinch zooms, mouse drag still moves exactly its 70px
  and is not doubled, the wheel still zooms, a card still opens its drawer, and
  the layout stays the desktop one.
- `test-variant`: on HEAD the suggestion offered "1 title" for Peter Parker
  (Raimi) and pinning him opened "13 titles" and 13 cards. After: 1 in the
  suggestion, the banner, the stepper and the narrowed catalog. Tom Holland's
  Peter is unchanged at 13, Captain Carter agrees at 4, and Jonathan Majors
  stays a text search instead of pinning one of his three portrayals.
- `test-nudgeundo`: on HEAD the check cannot complete, because the reminder's
  modal scrim is on screen after the Undo and blocks the next mark — the
  reminder had opened anyway. After: three marks advance the stage, Undo during
  the wait cancels the reminder and returns the stage, and marking again opens
  it once with a count that matches the collection.
- A direct probe of `data.js` recorded the scope change for every variant:
  He Who Remains and Victor Timely 3 to 1, Captain Carter 10 to 4, White Vision
  7 to 2, Peter Parker (Raimi) and (Webb) 13 to 1, Kang 3 to 1, Peggy Carter 10
  to 6, Vision 7 to 6. Tom Holland's Peter Parker stays 13.

### The camera check

`test-camera` was run four times, twice on the working tree and twice on an
unmodified export of `HEAD`. All four failed identically with `locator.click:
Timeout 30000ms exceeded`, so this is not a regression from this batch, and the
expected result of a full run at the time was 18 of 19. (Fixed in batch 5: the
cause was the check, not the app — see that checkpoint.)

The failing step is "sort change while selected", not the "wheel cancels the
glide" step `qa/README.md` previously blamed — `glideCancelledByWheel` was true
in every run. A diagnostic copy of the check showed that after the preceding
wheel-zoom step, the click on the centre card leaves nothing selected
(`.card.selected` count 0, drawer closed) while the sort button itself is
clickable, so the following `.drawer-close` click has no target. Whether that is
brittleness in the check or a genuine "a click after a wheel zoom does not
select" bug in the app was not established, and is worth its own ticket. The
old "about 1 run in 4" description is not what this machine shows.

### Picking an actor or a character from search

Added after the user reported that picking "Hayley Atwell" fell back to a text
search instead of opening the pinned widget. Narrowing `pickPerson` to
single-role actors (done earlier the same day, for the variant scope) had
removed the widget for every performer with more than one role. A pinned
subject is now either one portrayal or a performer.

`qa/test-pickperson.js` is a full pass rather than a sample: it drives the
search box for **all 84 characters and all 79 actors**, clicks each suggestion
and reads the banner back.

- Working tree: 163 of 163 open the widget, with the banner name, the count and
  the stepper total all matching the catalogue. No console errors.
- Against an unmodified export of `HEAD` the same check reports the two bugs it
  was written for: Robert Downey Jr. opens no widget at all (two separate
  identities, so this one predates the batch), and 14 counts are wrong because
  variants still resolved to their prime — Peggy Carter 10 instead of 6, Vision
  7 instead of 6, Kang, He Who Remains and Victor Timely 3 instead of 1, Captain
  Carter 10 instead of 4, and so on.

One bug in this work was caught only by running the full pass: `pinnedChars` was
declared above the state it reads, so its dependency array captured `undefined`
on every render and the memo never recomputed. The app still booted and every
character still behaved, because the character path does not read that value —
only actors did, and only then did it surface. Moving the declaration below
`pinnedActor` and `highlightedChar` fixed it.

### Escape and the pinned widget

Added at the user's request: Escape now clears the pinned character or
performer. `qa/test-escpin.js` checks the rung and, more importantly, its place
in the ladder.

- Escape clears a pin and gives the catalogue back, 13 cards to 64.
- Details over a pin: the first Escape closes only the details, the pin survives
  with its 13 cards, and a second Escape clears it.
- Escape with the search suggestions open closes the suggestions only.
- Phone width: tapping a cast row pins, and Escape clears the pill.

The first attempt used a second listener that bailed while details were open,
and it closed both layers on one press. Two listeners each see the same press;
React re-renders between them for a discrete event like `keydown`; and a
listener added to `window` during the capture phase is still called when the
event bubbles back to `window`. So the pin's re-subscribed listener ran for the
same press with a closure in which the details were already gone. Both rungs
now share one listener that decides once. `qa/test-esc.js`, which covers the
details rung this rewrote, still passes.

### Limits, not covered by this batch

- **No real-device checks.** Everything above is headless Chromium. The
  wide-screen touch fix was exercised with emulated touch at 1440×900; a real
  touch laptop or an iPad in landscape, including orientation changes, has not
  been tried, and that is named in the ticket's own criteria.
- No iPhone/Safari or Android pass, no WebKit engine, no spoken screen reader.
- No live Google OAuth and no cross-device cloud sync. The reminder check runs
  as a signed-out guest only.
- The Portuguese label was verified through `test-fit` in Portuguese and the
  axe-core scan, not by eye in a real browser at 320px.
- `test-camera`'s own flake was identified but not fixed; its "wheel cancels
  the glide" and mobile selection steps remain timing-sensitive.
