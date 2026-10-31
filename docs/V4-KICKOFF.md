# MCU Connections V4 — kickoff brief

Written 2026-10-31 when V4 was set up. This is the starting brief for Claude
Code (and Codex) on V4. [AGENTS.md](../AGENTS.md) stays the rulebook; this file
explains what V4 is, where it lives, and the order to work in. Update it as V4
decisions are made, and record each decision in [decisions.md](decisions.md).

## What V4 is

V3 is finished and live: Batch 10 was merged to production on 2026-10-31
(`a44891a`), and `main`, `version/3.0` and `version/4.0` all started from that
commit. V4 is the next major version:

1. **A build step.** Move from in-browser Babel to a standard React build (Vite
   is the default candidate), built by Vercel, keeping behaviour identical
   before anything is redesigned (Notion: "V4 - Tooling and build step").
2. **A brand-new design, look and feel**, designed by Andre in Figma and
   brought into code through the Figma MCP and design tokens (Notion: "Design:
   App Look and feel").
3. **Dark and light mode**, ideally with a Settings panel, built on the new
   design (Notion: "Design: Dark/Light mode").
4. **Other V4 features** from the V4 Backlog, starting with contextual guidance
   for Spatial and character browsing.

Andre is a designer and creative director. He owns the art direction and the
Figma file; agents own faithful, accessible implementation and say plainly when
a design choice conflicts with accessibility, performance or localisation.

## Where everything is

| What | Where |
|---|---|
| V4 code | Branch `version/4.0`, worktree folder `MCU-V4` (next to `MCU Connections`) |
| V3 maintenance | Branch `version/3.0`, worktree folder `MCU-V3` |
| Production | `main` → https://mcu-connections.vercel.app/ (still V3) |
| V4 preview | https://mcu-connections-git-version-40-afr-bfcd.vercel.app/ (first deployed 2026-10-31, from `a44891a`) |
| Backlog | Notion **MCU - V4** page → **V4 Tasks** (https://app.notion.com/p/f8e1ebb392a6450d8ef883458e12bd76) |
| V3 history | Notion **MCU - V3** → **V3 Tasks**; CHANGELOG.md; docs/HANDOFF.md |
| Figma | Figma MCP, registered in `.mcp.json`; frame links in each ticket's **Figma** field |
| Next major version | Notion **New Major Version Checklist** (https://app.notion.com/p/40a9e188029f811a85e4c6e333dd8c0b), the steps used to set up V4 |

`MCU-V3` and `MCU-V4` are linked worktrees of the `MCU Connections` checkout.
Sandboxed shells may report them as "prunable". They are not: never run
`git worktree prune`.

## First session checklist

Do these in order and report the result of each. Stop and ask when something
does not match.

1. **Check the worktree.** In `MCU-V4`: `git status -sb` should show
   `version/4.0...origin/version/4.0` with these uncommitted setup changes, made
   when V4 was set up and not yet approved:
   - `AGENTS.md` — retargeted to V4 (`version/4.0`, V4 Tasks, Figma section).
   - `.mcp.json` — registers the Figma MCP server for Claude Code.
   - `.vercelignore` — keeps `.mcp.json` out of the deployed site.
   - `docs/V4-KICKOFF.md` — this file.
   - `README.md` — the V4 preview link and its sign-in redirect row.
2. **Connect Figma.** Claude Code asks to approve the project's `figma` server
   on first open; approve it, then `/mcp` → **figma** → **Authenticate** →
   **Allow access** in the browser. Confirm the server is connected and can
   read a frame link Andre provides. (A full or Dev seat in Figma is needed;
   other seats have usage limits.)
3. **Check Notion.** Fetch V4 Tasks and list the Backlog in board order. The
   top ticket is "V4 kickoff — review and commit the V4 workspace setup".
4. **Ship the setup (after Andre approves).** One commit with the five files,
   a CHANGELOG entry (`## V4 maintenance — V4 workspace setup`, real time from
   git), push to `version/4.0`. Once Vercel reports the deploy, run
   `SITE_URL=https://mcu-connections-git-version-40-afr-bfcd.vercel.app/ node qa/smoke.js`.
5. **Tell Andre what he must do outside the code** (see "Andre's to-do"), then
   take the next Backlog ticket.

## Order of work

Each phase is a ticket (or a few) in V4 Tasks and needs Andre's approval
before code. Propose, don't start.

### Phase 1 — V4 plan (`docs/V4-PLAN.md`)

Write the plan for review before any migration. Cover:

- Goals and non-goals for V4; what "done" means for the release to `main`.
- Build-step plan: tool and versions (pinned), folder layout (`src/`, modules
  replacing `window.*`), how `index.html`, the locales, `data.js` and the
  other data files load, environment config, and how `qa/` runs against the
  built site (for example `vite preview`).
- **Vercel without touching production.** Build settings must come from a
  `vercel.json` committed on `version/4.0` (build command, output directory,
  framework), not from the Vercel dashboard, which applies to every branch and
  would break `main`'s static deploy.
- **Sign-in on new origins.** The V4 preview origin and the local dev port
  must be added to the Google OAuth client and Supabase's redirect URLs
  (README, "App redirects"). Prefer running the dev server on port 8126 with a
  strict port so the existing local entry keeps working.
- Design-system approach (see Phase 3) and the token pipeline from Figma.
- Risks: the Spatial canvas (camera, rings, iOS memory rules), Escape/focus
  behaviour, permanent title ids, localisation, Supabase sync.
- QA: which checks must pass after the migration, and new visual checks.
- How V3 fixes on `version/3.0` get merged forward.

### Phase 2 — Build step, behaviour identical

Migrate to the build with no visual or behavioural change, file by file, then
run the full regression (`bash qa/regress.sh`) and a real-device check. Ship as
its own batch so later design work never mixes with migration risk.

### Phase 3 — Design foundations

- Andre sets up the V4 Figma file: variables for colour (both themes), type,
  spacing, radius, elevation and motion; core components; key screens.
- Agents propose a base for the components, answering the open request in
  "Design: App Look and feel". Evaluate, with trade-offs, accessible headless
  primitives styled with our own tokens (Radix UI primitives, React Aria, Base
  UI) against styled kits (shadcn/ui on Tailwind). Criteria: keyboard and
  screen-reader behaviour matching AGENTS.md, theming through tokens, bundle
  size, and how well each maps to Figma variables. Recommend one; Andre
  decides.
- Mirror the Figma variables as code tokens in one file (CSS custom
  properties), named to match Figma.

### Phase 4 — Re-skin, screen by screen

One ticket per surface, each with Figma frames linked: toolbar and app bar,
desktop Spatial, desktop List, details drawer, phone List/Grid/Spatial and
sheets, dialogs (About, Account, "What have you seen?"), guides, startup
screen. Compare each against its frame at desktop and phone sizes, in English
and Portuguese, and keep the WCAG AA contrast checks.

### Phase 5 — Dark/Light mode and Settings

Build on the token system: both themes from the same variables, respecting
`prefers-color-scheme` with a user override, likely in a new Settings panel.

### Phase 6 — Remaining V4 features

The rest of the V4 Backlog in Andre's order, then the V4 release plan and the
merge to `main` (explicit approval only).

## The Figma round trip

1. **Code to Figma.** Capture the current V3 screens (screenshots, or the
   Figma MCP's write-to-canvas tools when Andre asks) as the starting point
   for the redesign.
2. **Refine in Figma.** Andre designs with variables and components, not
   loose values. Frame names match the app's surfaces.
3. **Figma to code.** Each design ticket links its frames. The agent reads the
   frame and its variables through the MCP, implements with tokens, and posts
   screenshots of the result beside the frame on the ticket.
4. **Back to Figma.** When code needs to differ (accessibility, a state Figma
   lacks, real content length), note it on the ticket so the Figma file can be
   updated and stays the source of truth.

## Andre's to-do (outside the code)

- Authenticate the Figma MCP in Claude Code (`/mcp`) and, for Codex, run
  `codex mcp add figma --url https://mcp.figma.com/mcp` and sign in.
- Create the V4 Figma file and add its link to the **MCU - V4** page in
  Notion.
- ~~Add the V4 preview to the Google OAuth client's JavaScript origins and to
  Supabase's Redirect URLs~~ — done 2026-10-31. Try Google sign-in, sync and
  sign-out on the preview once.
- Drag the V4 Tasks Backlog into the order you want; agents take the top card.

## Open decisions

- Build tool and language: Vite + React with plain JavaScript, or TypeScript?
- Component base (Phase 3 recommendation).
- Theme switch: toolbar control or a Settings panel (the Dark/Light ticket
  leans towards Settings).
- Whether V3 keeps receiving fixes while V4 is built, and how often they are
  merged forward.
- V4 release criteria and timing for `main`.
