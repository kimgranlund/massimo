# System overview

massimo is a design system (`packages/ui-kit`, `@massimo/ui-kit`) and its tuning jig (`apps/studio`). This page is the map; each area has its own spec.

## Principles

- **Generative, not enumerated.** Geometry derives from one unit `u` and a handful of coefficients; colors derive from Spectrum settings. Values are computed, never hand-tuned per component.
- **One source, many outputs.** The geometry and type resolvers drive the CSS, `docs/geometry.csv` and the DTCG files; the Spectrum snapshot drives the color tokens and their DTCG files. Tests fail when a committed output is stale.
- **Light-DOM web components, zero native form elements.** Components are custom elements styled from the outside; form behavior comes from `UIFormElement` (ElementInternals), not from embedded `<input>`s.
- **Headless behavior is shared.** `dom/` returns attribute maps and handles keys; web components apply them, and React counterparts (button, input) spread the same maps.
- **No component styles beyond defaults.** `styles/defaults.ts` is one boilerplate stylesheet keyed on tags, `data-part` and ARIA state. Every length comes from `styles/geometry.ts`.

## Layers (`packages/ui-kit`)

| Folder | Holds | Spec |
|---|---|---|
| `core/` | signals, `html`/`render`/`repeat`, `UIElement`, `UIFormElement`, input-modality tracking | [components](components.md) |
| `dom/` | headless behaviors: button, field, text entry, listbox/select, range | [components](components.md) |
| `components/` | one folder per element module: element, React renderer, manifest, guide, examples, verification record | [components](components.md), [registry](registry.md) |
| `contracts/` | schemas and shared contracts: components, parts, composition, geometry families, foundations, states, tokens | [registry](registry.md) |
| `registry.json`, `system.manifest.json`, `graph.json` | registry entry, system identity and routes, the generated graph index | [registry](registry.md) |
| `tokens/geometry/` | the geometry resolver (numerical reference) | [geometry](geometry.md) |
| `tokens/colors/` | Spectrum engine, settings, snapshot, color tokens | [color](color.md) |
| `tokens/typography/` | type roles, ratios, font families (numerical reference) | [typography](typography.md) |
| `tokens/motion/` | SwiftUI-style springs → CSS `linear()` easings and settle durations | [motion](motion.md) |
| `tokens/themes/` | theme parameters and saved themes | [theming](theming.md) |
| `icons/` | `<i name>` runtime, icon sets, SVG sanitizer | [icons](icons.md) |
| `styles/` | reset, geometry CSS, defaults (states), motion, FOUC guard, page patterns | [geometry](geometry.md), [components](components.md), [motion](motion.md) |
| `preset.ts` | the PandaCSS preset assembling all of the above | [theming](theming.md) |
| `scripts/` | generators: `geometry:csv`, `tokens:dtcg`, `spectrum:defaults`, `manifests` (mirrored manifest fields), `registry:graph`; the `registry` CLI; `verification` | below, [registry](registry.md) |

## Generated outputs

| File | Generator | Source |
|---|---|---|
| `packages/ui-kit/docs/geometry.csv` | `npm run geometry:csv` | resolver |
| `packages/ui-kit/tokens/dtcg/*.dtcg.json` | `npm run tokens:dtcg` | resolvers and Spectrum snapshot (DTCG 2025.10, see below) |
| `packages/ui-kit/tokens/colors/spectrum/defaults.json` | `npm run spectrum:defaults` | Spectrum engine at default settings |
| `packages/ui-kit/styled-system/`, `dist/ui-kit.css` | `npm run build` | Panda preset |
| mirrored fields of `packages/ui-kit/components/*/*.manifest.json` | `npm run manifests` | element classes, dispatched events, `contracts/components.json`, React renderer types ([registry](registry.md#generated-manifest-fields)) |

## Design tokens (DTCG)

`packages/ui-kit/tokens/dtcg/` (exported as `@massimo/ui-kit/dtcg/*`) holds DTCG 2025.10 files generated from the kit's sources. Merge geometry, typography and one color scheme; `index.json` lists them.

| File | Tokens |
|---|---|
| `geometry.dtcg.json` | every geometry length (`dimension`), inputs and container pad/gap multiples (`number`) |
| `typography.dtcg.json` | faces (`fontFamily`), voices (aliases to faces), role styles (`typography`, fontFamily aliasing the voice), role sizes and line heights (`dimension`), ratio and rhythm (`number`) |
| `color.light.dtcg.json`, `color.dark.dtcg.json` | Spectrum ramps (`color`, oklch) and roles (aliases to ramp steps; text-on-solid as srgb), scheme shadows (`shadow`) |

DTCG has no arithmetic or modes: `$value` is the default-theme value; `$extensions["com.massimo.formula"]` carries the rule and `com.massimo.bySize` the value at every size; schemes are separate files. DTCG `typography.lineHeight` is a multiplier and `letterSpacing` has no `em`, so roles store the ratio and px, with the rhythm-rounded px and the em tracking in `$extensions`. Tests validate every file against the vendored official schema (`test/fixtures/dtcg-2025.10-format.json`), check that every alias resolves, and fail when a committed file is stale. Motion is not covered yet.

## The jig

`apps/studio` renders every component inline and tunes geometry, icons, scheme and Spectrum live, scoped to the canvas. See [studio](studio.md).
