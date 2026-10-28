# Decision log

Newest first. Add an entry when a choice changes how the app works or how we
work: date (America/New_York), the decision, and why. Link the CHANGELOG entry or
Notion ticket when there is one. Earlier history is in CHANGELOG.md.

| Date | Decision | Reason |
|---|---|---|
| 2026-10-28 | Development moves to Claude Code; AGENTS.md stays the single agent-neutral rulebook (CLAUDE.md only imports it), with docs/HANDOFF.md and this log. | Claude Code and Codex share one worktree and need the same rules without chat history. |
| 2026-10-27 | Batches ship to staging (`version/3.0`) first and reach `main` only on the user's explicit approval; one commit per ticket; a calendar recap after each approval. | The user tests on a phone before production and logs the work in a calendar. |
| 2026-10-27 | CHANGELOG times come from git, never estimates; merge status is updated in a follow-up commit before merging. | An entry once carried a time later than its own commit. |
| 2026-10-27 | Desktop Spatial cards get an invisible first button: Tab reaches the card before its Seen/Watchlist buttons, and Enter opens it. A card tabbed to off-screen glides into view. | Keyboard users could not open details from Spatial (List already worked). |
| 2026-10-27 | Scripts move focus only after keyboard input (`lastInput`); rings use `:focus-visible`; Escape closes one layer at a time; the desktop drawer is modeless. | A scripted focus move showed a focus ring after mouse clicks; the user found it confusing. |
| 2026-10-27 | Text tokens raised to WCAG AA (`--text-muted #8389a1`, `--text-dim #9ea4b8`; RT tag `#cc2a0a`). | Muted text measured 2.7–3.2:1. A colour fix keeps the compact layout. |
| 2026-10-27 | `og:image` / `og:url` point at production. Icons are rendered from the brand mark, with no studio imagery. | Crawlers need absolute URLs; production is the canonical address. |
| 2026-10-27 | The selected title in the ring is drawn larger on desktop only. | The phone ring is compact and already overlaps neighbours. |
| 2026-10-27 | A startup screen lives in `index.html` and `boot.js`; the locale files load before the CDN libraries. | Visitors saw a blank page while libraries downloaded and JSX compiled, and nothing explained a failed start. |
| 2026-10-27 | One normalisation, `MCU_I18N.fold()`, for search filtering, suggestions and highlights. | "Capitao" suggested titles that the filter then hid. |
| 2026-10-27 | Use React and ReactDOM production builds (pinned, SRI) and keep the no-build architecture. Precompiling JSX is left open. | Smaller download and about twice the pan frame rate on slow phones, with no workflow change. |
| 2026-10-27 | Spatial canvas: no per-card GPU layers or backdrop filters, and composited only at ≥30% zoom (`LAYER_MIN_SCALE`). | iOS Safari reloaded the tab when panning zoomed out (out of graphics memory). |
| 2026-10-27 | Each phone sheet owns one history entry, so the browser Back button closes it. | Back left the site with a sheet open. |
| 2026-10-27 | Failed posters and portraits fall back to generated art or initials, remembered for the session. | Broken images showed spilling alt text and were retried repeatedly. |
| 2026-10-26 | Opening a title's rings hides unrelated cards instead of dimming them. | Dimmed cards behind the ring were distracting, especially in grid layouts. |
| 2026-10-26 | A guest sign-in reminder appears after 3 and 10 marks, once each. | A guest collection lives in one browser; a gentle prompt suggests signing in to keep and sync it. |
| 2026-10-26 | The Order menu became a two-state toggle. | It only ever had two options. |
| 2026-10-26 | Picking a character in search opens the character view (the pinned stepper), not a text search. | Users expect the character's titles, not every title matching the text. |
| 2026-10-26 | On phones, runs of seen titles fold into accordions on the All tab (closed by default, shared by List and Grid, remembered on the device). | Long seen stretches pushed unseen titles far down. |
| 2026-10-24/25 | The Notion V3 Tasks database is the backlog. Priority is the All tasks board's Backlog order, set by the user dragging cards; completion time and order follow fixed rules. | One source of truth for the user, Claude and Codex. |
| 2026-10-24 | Display preferences are per device (localStorage); filters and search start fresh each visit. | Nobody returns to a silently filtered catalog; there is no account schema change. |
| 2026-10-25 | English and Brazilian Portuguese; every UI string is a locale key, and search matches all languages. | The user's audience includes Brazil; this keeps adding languages cheap. |
| 2026-10-24 | Phases 1–5 are Google sign-in only. Email/password is Phase 6, deferred until a custom domain (for transactional email), its own plan and explicit approval. | Email delivery and account linking need a domain and careful design. |
| 2026-10-24 | Supabase free tier: accept pauses, no keep-alive automation. | Low traffic; avoid automation that works around the free tier. |
| V3 start | Keep the browser React/Babel architecture: no npm, bundler, router or ES modules; pinned CDN scripts with SRI; permanent catalog title ids. | Anyone can run it with a static server, and links and stored collections never break. |
