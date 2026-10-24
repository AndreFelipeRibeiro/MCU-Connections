# MCU Connections V3 — Phased Task Breakdown

Companion to `V3-SPEC.md`. Section references below (§) point into that file.

Ground rule: **each phase ends in a working, committed, manually verified
state.** Don't start the next phase with the previous one half-landed.

Phase 6 is deferred and requires a new, explicit user confirmation before any
implementation or service configuration. Approval of this roadmap is not approval
to start Phase 6; Phases 1–5 remain Google-only.

---

## Phase 1 — Collection foundation (no backend, no auth)

Everything here works signed out, with `localStorage` only. It is a complete,
shippable feature on its own.

### 1.1 Tracking state module
- [ ] Create `tracking.jsx` following the `window.*` export convention (§2).
- [ ] Internal state: `{ [titleId]: 'seen' | 'watchlist' }`. No `'none'` entries —
      clearing removes the key (§4.2).
- [ ] Transitions per D1: watchlist → seen moves; un-seen → `none`, not back to
      watchlist.
- [ ] Guest persistence to `localStorage` key `mcu.collection.v1`, shaped
      `{ version: 1, states: {...} }` (§6.1). Reads must tolerate malformed or
      absent JSON without throwing.
- [ ] `releasedCount()` helper computing the denominator at runtime from
      `t.release <= todayISO()`. **Do not hardcode 59** (D3).
- [ ] Dev-only console warning listing stored ids with no catalog match (§4.4).

**Acceptance:** mark titles, reload, state survives. `localStorage` cleared →
clean empty state, no errors.

### 1.2 `TitleStatusActions`
- [ ] Toggle buttons using `aria-pressed`, not checkboxes (§7.2).
- [ ] Labels naming the title: `"Mark Iron Man as seen"`.
- [ ] `stopPropagation()` on **both** `onMouseDown` and `onClick` — the desktop
      `Card` starts dragging on mousedown (§7.2).
- [ ] Pending and error slots (unused in Phase 1, wired in Phase 3).
- [ ] Hit targets ≥ 32px at scale 1; decide and document small-scale behaviour.

**Acceptance:** on the desktop canvas, clicking a status button at 3 different
zoom levels never selects, focuses, or drags the card.

### 1.3 Mobile nested-button refactor ⚠️ highest-risk task
- [ ] `MobileGrid` — `<button className="m-card">` → `<div>` + dedicated primary
      button.
- [ ] `MobileList` — `<button className="m-lrow">` → same treatment.
- [ ] `FocusPop` — `<button className="m-focuspop">` → same treatment.
- [ ] Update `styles-mobile.css` for the changed element types (button resets,
      `:active` states, focus rings).

**Acceptance:** no `<button>` inside `<button>` anywhere in the rendered DOM
(check via devtools, not by reading source). Tap-to-open still works on all
three. Keyboard tab order still reaches every card exactly once. Active/pressed
visual states unchanged.

*This task breaks the primary navigation of the mobile app if done carelessly.
If it goes badly, stop and report rather than layering fixes.*

### 1.4 Collection filter and dimming
- [ ] Read §7.1 in full before touching any filter code.
- [ ] Spatial (desktop + mobile spatial): dimming only. **Do not add collection
      to the `filtered` memo** (D4).
- [ ] Mobile grid/list: real filter, as a memo derived from `ordered`,
      downstream of `filtered`.
- [ ] Collection group in the desktop `Toolbar` filters popover.
- [ ] Collection group in mobile `FilterSheet`.
- [ ] Wire into `activeFilters` (inside `Toolbar`) and the `filterCount` prop
      (to `MobileTopBar`) — two separate things (§7.4).
- [ ] Wire into both clear paths: `pop-clear`, and `onClear` passed to
      `FilterSheet` from `App()`.

**Acceptance:** with "Unseen" active on the spatial canvas, marking a title seen
dims it in place — the graph does not reflow and the viewport does not recenter.

### 1.5 Progress and seen treatment
- [ ] `X of N released titles seen`, N runtime-computed.
- [ ] Watchlist count shown separately.
- [ ] Seen badge + subtle desaturation on cards; must not obscure connection
      lines or phase colours.
- [ ] `EmptyState` gains a message prop; collection-specific copy.

**Acceptance:** progress reflects reality; unreleased titles can be watchlisted
but never affect the denominator.

---

## Phase 2 — Backend and auth (shipped together)

Schema and sign-in land in one phase on purpose. Splitting them produces a
sign-in button that authenticates and then has nowhere to write.

### 2.1 Supabase project
- [ ] Create the project. Run `schema.sql` as-is.
- [ ] Run the three sanity checks at the bottom of that file.
- [ ] Keep the dedicated Email provider OFF until Phase 6 is approved and ready
      (§5.2/§5.5). Keep Google and new-user signup ON, anonymous sign-ins OFF.
      The publishable key is committed to a public repo.

### 2.2 Google OAuth
- [ ] Follow the 7-step checklist in §5.2 exactly.
- [ ] Confirm the redirect URI in Google is the **Supabase** callback, not the
      app's own URL — this is the most commonly mixed-up step.

### 2.3 Client wiring
- [ ] `config.js` — `window.MCU_CONFIG`, committed, public key only.
- [ ] `supabase-client.js` — sets `window.mcuSupabase`, or `null` on failure
      **without throwing** (§6.4).
- [ ] `index.html` — supabase-js CDN script pinned to an exact version **with an
      SRI `integrity` hash**, matching the existing React/Babel pattern. Not the
      floating `@2` tag. Then `config.js`, `supabase-client.js`, `tracking.jsx`,
      `account.jsx`, then `app.jsx`.

**Never commit:** `service_role` key, Google client secret, DB credentials.

### 2.4 Auth state machine
- [ ] `account.jsx` with explicit states: `initializing | signed_out |
      signing_in | signed_in | error` (§5.3).
- [ ] `onAuthStateChange` handling `SIGNED_IN` / `SIGNED_OUT` / `TOKEN_REFRESHED`.
      Failed refresh → `signed_out`, not a crash.
- [ ] During `initializing`: catalog renders normally, only collection controls
      show loading. **No flash of "all unseen."**
- [ ] Strip auth params from the URL with `history.replaceState` after the code
      exchange resolves.

### 2.5 Account UI
- [ ] Desktop signed-out: "Sign in" at the right edge of `tb-row`.
- [ ] Desktop signed-in: avatar → popover, modelled on `filters-pop`
      (click-outside + Escape).
- [ ] ⚠️ Verify `tb-row` at 900px, 1000px, 1200px. It is already dense and the
      mobile breakpoint is exactly 900px (§7.6).
- [ ] Mobile: avatar in `m-appbar-top`; move `m-viewswitch` to its own compact
      row; account opens as a `Sheet`.
- [ ] Menu: Google avatar/name/email, seen + watchlist summary, collection
      shortcuts, sign out. No profile table, no editable profile.
- [ ] Sign-out clears account data from React state and **does not** write it
      into the guest key (§5.4).

**Acceptance:** sign in, see your Google name and avatar, sign out, sign in as a
different account — no visual or data bleed between them.

---

## Phase 3 — Sync

### 3.1 Remote read/write
- [ ] Load all rows on `SIGNED_IN`.
- [ ] Upsert on set; **DELETE** on clear (there is no `'none'` status).
- [ ] Set `seen_at` when status becomes `seen`; clear it otherwise — the schema
      has a CHECK constraint enforcing `seen_at is null` for non-seen rows, so
      forgetting this produces a constraint violation, not silent drift.

### 3.2 Write queue
- [ ] Serialize writes per `title_id` with last-intent-wins (§6.3).
- [ ] No unbounded concurrent upserts.

**Acceptance:** toggle one title seen→none→seen→none rapidly ~10 times; the final
DB state matches the final UI state every time.

### 3.3 Optimistic updates
- [ ] Apply in React immediately; roll back on failure.
- [ ] Error shown inline on the affected title, not as a global toast.

### 3.4 Guest merge
- [ ] Status precedence `seen > watchlist > none` (D5) — **not** remote-wins.
- [ ] Write back only changed rows.
- [ ] Clear the guest key **only after** the write succeeds (§6.2).

**Acceptance:** guest has X seen, account has X watchlisted → result is `seen`.
Force the write to fail → guest data still intact, error shown.

---

## Phase 4 — Hardening

- [ ] Degraded mode: block the Supabase domain in devtools, reload. Catalog
      renders, guest tracking works, "sync unavailable" shown, no white screen,
      no unhandled promise rejection (§6.4).
- [ ] Free-tier pausing: decide keep-alive vs accept-the-pause, and document the
      choice in the README. Either way degraded mode must hold.
- [ ] OAuth cancellation: start sign-in, hit back. Returns to `signed_out`, no
      stuck spinner.
- [ ] Cross-account isolation at the API layer, not just the UI: request account
      B's rows with account A's JWT, expect empty.
- [ ] Mobile interaction pass on a real device: tap targets, sheet behaviour,
      the new view-switch row, scroll performance with dimming applied.
- [ ] Accessibility: `aria-pressed` states announce correctly, focus visible on
      all new controls, tab order sane after the button refactor.
- [ ] Desktop toolbar at 900–1200px.
- [ ] Progress denominator: fake the clock past 2026-10-14, confirm 59 → 60.

---

## Phase 5 — Docs

- [ ] README: Supabase + Google setup, new files table, the tracking feature,
      and the manual verification checklist from §10.
- [ ] `data.js`: comment that title ids are permanent and never reused.
- [ ] ⚠️ The README's entry-point references are **already correct**. An earlier
      planning pass claimed they say `MCU Explorer.html` — they do not. Don't
      "fix" them (§8).


---

## Phase 6 — Email/password accounts (deferred; confirmation required)

**Not authorized to start.** Added to the roadmap on 2026-10-24. Complete the
Google-only phases first; then present a Phase 6 plan and ask the user for new,
explicit confirmation. Do not infer approval from earlier phase approvals or
from the request to update these documents. See spec §5.5.

### 6.1 Approval and design
- [ ] Review current code and current Supabase Auth documentation; present the
      plan and obtain explicit user confirmation before implementation or setup.
- [ ] Define signup, confirmation, recovery and reset states without introducing
      a router, npm, bundler or server; preserve browser Babel and `window.*`.
- [ ] Review same-email Google/password identity behavior, including existing
      users; document the intended behavior and verify it with test accounts.
      Never merge collections by email string.

### 6.2 Account UI and flows (only after approval)
- [ ] Add email/password signup and sign-in alongside Google on desktop/mobile.
- [ ] Add accessible field labels, validation, pending states and auth errors.
- [ ] Add confirmation instructions and resend; keep confirmation required.
- [ ] Add forgot-password and reset-password forms, recovery-session handling,
      and useful expired/used/invalid-link states.
- [ ] Support account display without Google name/avatar metadata.

### 6.3 Service setup and documentation (only after approval)
- [ ] Configure transactional email/SMTP and verify confirmation/recovery delivery
      before public launch; keep SMTP credentials in service dashboards only.
- [ ] Configure and test confirmation/recovery redirects for local development,
      V3 preview and production. Keep anonymous sign-ins disabled.
- [ ] Enable the Email provider when complete flows are ready for verification.
- [ ] Keep `schema.sql` unchanged unless an approved new data requirement demands
      a migration: existing `auth.users(id)` ownership/RLS supports either method.
      Never store passwords in application tables.
- [ ] Update setup docs, account help and the manual verification record.

### 6.4 Manual acceptance and phase commit
- [ ] Signup → confirmation → sign-in, resend, wrong password and duplicate signup.
- [ ] Recovery email → reset → sign-in with new password; invalid/expired/reused
      links show useful errors without leaving a stuck or misleading auth state.
- [ ] Google still works; same-email behavior matches the reviewed design without
      lost collections or accidental account merging.
- [ ] Reload/session persistence, guest merge, sign-out clearing, cross-device
      sync and cross-account isolation (UI and API) pass for both sign-in methods.
- [ ] Verify desktop/mobile forms and supported redirect origins; record what was
      actually tested and any remaining limitations.
- [ ] Commit at phase end after relevant manual acceptance, not per file.
