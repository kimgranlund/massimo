# massimo

A design system and its tuning jig, as npm workspaces: `packages/ui-kit` (`@massimo/ui-kit`: light-DOM web components with React renderers, a headless `dom/` layer, geometry in a unit u, Spectrum colors, springs, icons, a PandaCSS preset, generated CSV and DTCG tokens) and `apps/studio` (the jig: tunes the theme live on a canvas of every component; Copy hands the settings to an agent as JSON).

## Route

1. Components: ask the registry before reading source: `npm run registry -- --start`, `--find <term>`, `--assembly component:<id>`.
2. Read the one spec that owns the topic; [system.md](docs/specs/system.md) is the map. Routine tasks: [guides](docs/guides/AGENTS.md).

| Topic | Spec |
|---|---|
| Add or change a component | [authoring](docs/specs/authoring.md), [manifest language](docs/specs/manifest-language.md) |
| Element API, foundations, states, React renderers | [components](docs/specs/components.md) |
| Manifests, graph, registry CLI, verification records | [registry](docs/specs/registry.md) |
| Lengths, sizes, radii, containers, Panda spacing | [geometry](docs/specs/geometry.md) |
| Colors, roles, schemes / type roles, fonts / springs | [color](docs/specs/color.md) / [typography](docs/specs/typography.md) / [motion](docs/specs/motion.md) |
| Elevation: levels, fills, shadows, layers | [elevation](docs/specs/elevation.md) |
| The system as a function: every input and what it drives (`contracts/parameters.json`) | [system](docs/specs/system.md#the-system-as-a-function) |
| Theme parameters, the theme object (`contracts/theme.schema.json`), domains, descriptors, the Brand (`contracts/brand.schema.json`), saved themes, Panda preset and configs | [theming](docs/specs/theming.md) |
| Icons / the jig | [icons](docs/specs/icons.md) / [studio](docs/specs/studio.md) |

## Rules that bite

- Zero native form elements (`input`, `button`, `select`, `label`, …) inside web components; forms go through `UIFormElement`. Tests enforce it.
- Every length comes from geometry (`tokens/geometry/resolve.ts` and `styles/geometry.ts` change together); every color is a Spectrum role. Panda configs are `strictTokens`; a one-off uses `[..]`.
- Typed element properties use `declare`, never class fields; avoid built-in property names (`role`, `prefix`, `ariaChecked`).
- Continuous values reach CSS only as custom properties set by script; finite choices are attributes and selectors. No runtime stylesheets in components.
- Labelled components use the construction pattern `[leading] [prefix] [contents] [suffix] [trailing]` (`components/slots.ts`). The jig uses ui-kit web components only.
- A component change updates its manifest, guide, examples and contract in the same commit.
- Containers are `<ui-container preset="…">` (React `Container`); the old level tags were removed (decision 0016). A type role is the one source of a text's color: never pair `textStyle` with an explicit color unless it is a deliberate one-off.
- CSS traps ([authoring](docs/specs/authoring.md#traps)): React `className` on an upgraded kit element wipes its recipe classes; Panda extracts `css()` at build time, so generated style objects emit nothing; a custom property that depends back on itself (through others) is empty, and one that reads another twice per level grows exponentially (register it); a per-depth rule must match exactly its depth; tokens that read `--ui-*` must be redeclared on a scoped theme.
- Never hand-edit a generated file: `docs/geometry.csv`, `tokens/dtcg/*`, `tokens/colors/spectrum/defaults.json`, `graph.json`, `contracts/theme.schema.json`, `contracts/brand.schema.json`, the face catalogue's `measured` blocks, the mirrored manifest fields, verification hashes, `styled-system/`, `dist/`. Generators: [system](docs/specs/system.md#generated-outputs). Tests fail when one is stale.

## Checks

From the root: `npm run ui-kit:test`, `npm run ui-kit:typecheck`, `npm run typecheck -w @massimo/studio`, `npm run ui-kit:build`. Browser: `npm run studio`, then `/geometry-check.html` and `/react-check.html` print `"fails": []` when they agree.

Cross-browser: `npm run check:browsers` (or `-- firefox webkit`) runs both check pages, the select popup's placement and every motion easing in Chromium, Firefox and WebKit through Playwright on its own Vite server, and exits non-zero on any fail (`apps/studio/scripts/check-browsers.ts`; browsers once: `npx playwright install chromium firefox webkit`). Findings: [docs/reports/2026-11-02-cross-browser.md](docs/reports/2026-11-02-cross-browser.md).

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
