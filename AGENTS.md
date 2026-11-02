# massimo

## What this repository is

A design system and its tuning jig, as npm workspaces:

- `packages/ui-kit` (`@massimo/ui-kit`): light-DOM web components (no native form elements), a headless behavior layer, a generative geometry system, Spectrum (HCT) colors, theme-aware icons, a PandaCSS preset, and generated token outputs (CSV, DTCG). Specs: [docs/specs/](docs/specs/system.md).
- `apps/studio` (`@massimo/studio`): the jig. Tunes geometry, icons, scheme and Spectrum colors live on a canvas of every component; Copy hands the settings to an agent as JSON. Spec: [docs/specs/studio.md](docs/specs/studio.md).

Start at [docs/specs/system.md](docs/specs/system.md), then the spec for the area you touch.

## Shared rules

- Web components contain zero native form elements (`input`, `button`, `select`, `textarea`, `label`, `fieldset`, `option`, `output`, …). Form participation goes through `UIFormElement` (ElementInternals). Tests enforce this.
- Every length comes from the geometry system: change `packages/ui-kit/tokens/geometry/resolve.ts` and `styles/geometry.ts` together, then regenerate `docs/geometry.csv` and `tokens/dtcg/`. Never hard-code a component length elsewhere.
- Colors come from Spectrum. Change defaults through settings and `npm run spectrum:defaults`; never hand-edit `tokens/colors/spectrum/defaults.json` or `runtime.json` (vendored engine, see its `NOTICE.md`).
- Generated files (`docs/geometry.csv`, `tokens/dtcg/*`, `tokens/colors/spectrum/defaults.json`, `styled-system/`, `dist/`) are never edited by hand; tests fail when the committed ones are stale.
- Preset style objects merge per selector (`mergeGlobalCss`); shared-variable rules use `:where()` so per-component rules win.
- Typed element properties use `declare`, never class fields (a field shadows the reactive accessor). Avoid names that collide with built-in element properties (`role`, `ariaChecked`, …).
- Continuous values reach CSS only as custom properties set by script (`--ui-ratio`, `--ui-swatch-color`); finite choices are attributes and CSS selectors. No runtime stylesheet generation in components.
- The jig uses ui-kit web components exclusively.

## Checks

From the repository root:

- `npm run ui-kit:test`: unit tests (node:test + happy-dom), including staleness checks for the CSV, DTCG tokens and Spectrum snapshot.
- `npm run ui-kit:typecheck` and `npm run typecheck -w @massimo/studio`.
- `npm run ui-kit:build`: Panda codegen and `dist/ui-kit.css`.
- Design tokens: `tokens/dtcg/` holds DTCG 2025.10 files (geometry, typography, color light/dark), validated against the vendored official schema in the tests.
- After geometry, typography or color changes: `npm run geometry:csv -w @massimo/ui-kit`, `npm run tokens:dtcg -w @massimo/ui-kit`, `npm run spectrum:defaults -w @massimo/ui-kit`.
- Browser: `npm run studio`, then open `/geometry-check.html`; `"fails": []` means rendered CSS matches the resolver.

<!-- sdlc:managed:start v1 sha256:5af188d5b00b -->
## Documents

Read [the docs entry](docs/AGENTS.md) before adding or moving a document.

Managed by SDLC onboard, template 1.

## Work records

`.sdlc/tickets/` holds SDLC tickets and their task plans (plan docs under review go to `docs/planning/`); run records live in the git-ignored `.sdlc/runtime/tasks/<folder>/`, and a closed ticket keeps only its `handoff.md` with its `## Outcome`.

- Pick the lane first with `steps.py lane <task dir>` (in the plugin's `scripts/` folder): `solo` is the default for ticket levels L1 and L2, `/sdlc:fix` runs only when asked or when the lane script prints `fix`, and the full chain (`/sdlc:chain`) needs a stated reason (an L4 or L5 step, a merge step, or cross-cutting scope). Roles launch with `run.sh`. Do not spawn another plugin's builder, planner, or reviewer agent in their place.
- Worktrees: lanes live in `../<repo>.worktrees/` (`wtroot.py root`, in the plugin's `scripts/` folder). Lane open, the solo and verifier runs in a lane, land and close write `.git` or the lane tree outside the checkout, so under Codex run them with full access, not the `workspace-write` sandbox.
- Several hosts in one repo (Claude Code, Codex, Pi): one factory writes main; a worker writes only its locked lane, commits nothing, and runs `lanes.py ready` when done (the Lanes section of the plugin's `AGENTS.md`).
- Handoff files follow the `sdlc:handoff-format` skill.
- Tickets are created, closed, and archived through the `sdlc:ticket` skill.
- `.sdlc/roadmap.md` is generated. Do not edit it by hand.
- `.sdlc/messages/` is a local mailbox. Never commit it; a `.gitignore` line for it is advised.
- Do not move or rewrite a finished run record. Write no loose file at the top of `.sdlc/` or the project root: notes go to `.sdlc/notes.md`, an answer to another agent goes by `messages.py send`. The `.sdlc/AGENTS.md` Folder layout lists what may sit at the top; `tickets.py check` warns on anything else and `tickets.py tidy` moves it into `.sdlc/archive/`.
<!-- sdlc:managed:end -->
