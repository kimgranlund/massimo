# System overview

massimo is a design system (`packages/ui-kit`, `@massimo/ui-kit`) and its tuning jig (`apps/studio`). This page is the map: principles, package layers, generated outputs and the DTCG export. Each area has its own spec, linked from the layer table; the entry router is [AGENTS.md](../../AGENTS.md), how-tos are in [guides](../guides/AGENTS.md).

## Principles

- **Generative, not enumerated.** Geometry derives from one unit `u` and a handful of coefficients; colors derive from Spectrum settings. Values are computed, never hand-tuned per component.
- **One source, many outputs.** The geometry and type resolvers drive the CSS, `docs/geometry.csv` and the DTCG files; the Spectrum snapshot drives the color tokens and their DTCG files. Tests fail when a committed output is stale.
- **Light-DOM web components, zero native form elements.** Components are custom elements styled from the outside; form behavior comes from `UIFormElement` (ElementInternals), not from embedded `<input>`s.
- **Headless behavior is shared.** `dom/` returns attribute maps and handles keys; web components apply them, and React counterparts (button, input) spread the same maps.
- **One slot recipe per component.** Each component's styles are a Panda slot recipe (`components/<name>/<name>.recipe.ts`) applied as classes by the web component and the React renderer alike; states use shared conditions keyed on ARIA and native state. Every length comes from the geometry variables in `styles/geometry.ts`.

## The system as a function

The kit is a function of a small set of inputs: every rendered length, color, type size and curve is computed from them, and nothing is set per component.

```
inputs ──▶ resolvers ──▶ tokens and CSS variables ──▶ slot recipes ──▶ components
```

| Inputs | Resolver | Outputs |
|---|---|---|
| unit u, border B, radius scale s, corner shape k, container pad and gap | `tokens/geometry/resolve.ts`, `styles/geometry.ts` | every length and radius ([geometry](geometry.md)) |
| type ratio r, rhythm, faces, voices | `tokens/typography/resolve.ts` | type roles: size (10px + u) × r^step, line heights ([typography](typography.md)) |
| Spectrum settings, role mapping | `tokens/colors/spectrum/` | 12-step ramps per scheme, role tokens ([color](color.md)) |
| motion scale, motion bounce, springs, intents | `tokens/motion/` | `linear()` easings and durations ([motion](motion.md)) |
| per subtree: `size`, `icon-size`, `gap`, `.light` / `.dark`, `data-font-<voice>`, `data-type` | the same resolvers, evaluated locally | the subtree's values ([theming](theming.md#per-element-inputs)) |

### Concepts

The inputs are organized by the peer concepts the system governs. Each parameter group expresses one concept (`concept` in the contract; registry `concept:<id>`).

| Concept | Governs | Mechanism | Spec |
|---|---|---|---|
| Scale | how big everything is | one unit u; `size` per subtree | [geometry](geometry.md#inputs) |
| Density | how much fits at the same scale | not yet separate from scale (planned: compact, default, loose) | [geometry](geometry.md#containers) |
| Space | margins and gutters | the container ladder `pad-<level>` / `gap-<level>`; `gap` per element | [geometry](geometry.md#containers) |
| Curvature | roundness and corner shape | radius scale s, corner shape k, the concentric rule, the container magnitude t | [geometry](geometry.md#containers) |
| Line | edges and separators | border B inside the padding; the separator rule; fills separate surfaces | [geometry](geometry.md#inputs) |
| Elevation | how surfaces stack | six levels (page, panel, card, raised, floating, modal), each a fill, a shadow and a layer; shadow strength, surface contrast | [elevation](elevation.md) |
| Vibrancy | richness and diversity of color | the Spectrum settings and the role mapping | [color](color.md) |
| Emphasis | how loudly something speaks | variants, role steps (subtle, solid, fg), APCA text on solids | [color](color.md#roles) |
| Typography | hierarchy and voice of text | type ratio and rhythm, faces, voices, roles | [typography](typography.md) |
| Movement | motion and transitions | springs, intents, motion scale and bounce | [motion](motion.md) |
| State | how components respond | the data-* state contracts, the focus ring, input modality | [components](components.md#states) |
| Iconography | symbols | icon sets, system glyphs, icon sizes | [icons](icons.md) |
| Adaptivity | how the system bends to its environment | light / dark per subtree, forced colors, reduced motion | [color](color.md#schemes) |

The machine-readable form is `packages/ui-kit/contracts/parameters.json`: every input, its formula, what it drives, and the coefficients the formulas fix (8u controls, 6u slots, 3u curvature, 10px + u fonts). The registry indexes it: `npm run registry -- --find "radius scale"`, `parameter:<id>` for a range and default, and `--assembly component:<id>` lists the parameter groups a component responds to ([registry](registry.md#parameters)). A theme sets inputs only (`tokens/themes/params.ts`, [theming](theming.md)); changing a fixed coefficient is a geometry change.

## Layers (`packages/ui-kit`)

| Folder | Holds | Spec |
|---|---|---|
| `core/` | signals, `html`/`render`/`repeat`, `UIElement`, `UIFormElement`, input-modality tracking | [components](components.md) |
| `dom/` | headless behaviors: button, field, text entry, listbox/select, range | [components](components.md) |
| `components/` | one folder per element module: element, React renderer, manifest, guide, examples, verification record | [components](components.md), [registry](registry.md) |
| `contracts/` | schemas and shared contracts: components, parts, composition, geometry families, foundations, states, tokens, parameters | [registry](registry.md) |
| `registry.json`, `system.manifest.json`, `graph.json` | registry entry, system identity and routes, the generated graph index | [registry](registry.md) |
| `tokens/geometry/` | the geometry resolver (numerical reference) | [geometry](geometry.md) |
| `tokens/colors/` | Spectrum engine, settings, snapshot, color tokens | [color](color.md) |
| `tokens/typography/` | type roles, ratios, font families (numerical reference) | [typography](typography.md) |
| `tokens/motion/` | SwiftUI-style springs → CSS `linear()` easings and settle durations | [motion](motion.md) |
| `tokens/themes/` | theme parameters and saved themes | [theming](theming.md) |
| `icons/` | `<i name>` runtime, icon sets, SVG sanitizer | [icons](icons.md) |
| `styles/` | reset, geometry CSS, defaults (states), state conditions (`conditions.ts`), motion, FOUC guard, page patterns | [geometry](geometry.md), [components](components.md), [motion](motion.md), [theming](theming.md#preset) |
| `preset.ts` | the PandaCSS preset assembling all of the above | [theming](theming.md) |
| `scripts/` | generators: `geometry:csv`, `tokens:dtcg`, `spectrum:defaults`, `manifests` (mirrored manifest fields), `registry:graph`; the `registry` CLI; `verification` | below, [registry](registry.md) |

## Generated outputs

Never edit these by hand; `npm run ui-kit:test` fails when a committed one is stale. Commands run in `packages/ui-kit` (from the root, add `-w @massimo/ui-kit`).

| File | Generator | Source |
|---|---|---|
| `packages/ui-kit/docs/geometry.csv` | `npm run geometry:csv` | resolver |
| `packages/ui-kit/tokens/dtcg/*.dtcg.json` | `npm run tokens:dtcg` | resolvers and Spectrum snapshot (DTCG 2025.10, see below) |
| `packages/ui-kit/tokens/colors/spectrum/defaults.json` | `npm run spectrum:defaults` | Spectrum engine at default settings |
| `packages/ui-kit/graph.json` | `npm run registry:graph` | manifests and contracts ([registry](registry.md)) |
| verification hashes in `components/*/verification/*.json` | `npm run verification -- run <folder…\|--all>`, stamped only when the checks pass | bound sources ([registry](registry.md)) |
| `packages/ui-kit/styled-system/`, `dist/ui-kit.css` (not committed) | `npm run build` | Panda preset |
| mirrored fields of `packages/ui-kit/components/*/*.manifest.json` | `npm run manifests` | element classes, dispatched events, `contracts/components.json`, React renderer types ([registry](registry.md#generated-manifest-fields)) |

## Design tokens (DTCG)

`packages/ui-kit/tokens/dtcg/` (exported as `@massimo/ui-kit/dtcg/*`) holds DTCG 2025.10 files generated from the kit's sources. Merge geometry, typography, motion and one color scheme; `index.json` lists them.

| File | Tokens |
|---|---|
| `geometry.dtcg.json` | every geometry length (`dimension`), inputs and container pad/gap multiples (`number`) |
| `typography.dtcg.json` | faces (`fontFamily`), voices (aliases to faces), role styles (`typography`, fontFamily aliasing the voice), role sizes and line heights (`dimension`), ratio and rhythm (`number`) |
| `color.light.dtcg.json`, `color.dark.dtcg.json` | Spectrum ramps (`color`, oklch) and roles (aliases to ramp steps; text-on-solid as srgb), scheme shadows (`shadow`) |
| `motion.dtcg.json` | springs (`duration`, a `cubicBezier` fit, `transition`) and intent aliases ([motion](motion.md#tokens)) |

DTCG has no arithmetic or modes: `$value` is the default-theme value; `$extensions["com.massimo.formula"]` carries the rule and `com.massimo.bySize` the value at every size; schemes are separate files. DTCG `typography.lineHeight` is a multiplier and `letterSpacing` has no `em`, so roles store the ratio and px, with the rhythm-rounded px and the em tracking in `$extensions`. Tests validate every file against the vendored official schema (`test/fixtures/dtcg-2025.10-format.json`), check that every alias resolves, and fail when a committed file is stale.

## The jig

`apps/studio` renders every component inline and tunes geometry, icons, scheme and Spectrum live, scoped to the canvas. See [studio](studio.md).
