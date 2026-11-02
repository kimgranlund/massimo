# System overview

massimo is a design system (`packages/ui-kit`, `@massimo/ui-kit`) and its tuning jig (`apps/studio`). This page is the map; each area has its own spec.

## Principles

- **Generative, not enumerated.** Geometry derives from one unit `u` and a handful of coefficients; colors derive from Spectrum settings. Values are computed, never hand-tuned per component.
- **One source, many outputs.** The geometry resolver drives the CSS, `docs/geometry.csv` and `tokens/tokens.dtcg.json`; the Spectrum snapshot drives the color tokens. Tests fail when a committed output is stale.
- **Light-DOM web components, zero native form elements.** Components are custom elements styled from the outside; form behavior comes from `UIFormElement` (ElementInternals), not from embedded `<input>`s.
- **Headless behavior is shared.** `dom/` returns attribute maps and handles keys; web components apply them, and React counterparts (button, input) spread the same maps.
- **No component styles beyond defaults.** `styles/defaults.ts` is one boilerplate stylesheet keyed on tags, `data-part` and ARIA state. Every length comes from `styles/geometry.ts`.

## Layers (`packages/ui-kit`)

| Folder | Holds | Spec |
|---|---|---|
| `core/` | signals, `html`/`render`/`repeat`, `UIElement`, `UIFormElement`, input-modality tracking | [components](components.md) |
| `dom/` | headless behaviors: button, field, text entry, listbox/select, range | [components](components.md) |
| `components/` | the web components (and React button/input) | [components](components.md) |
| `tokens/geometry/` | the geometry resolver (numerical reference) | [geometry](geometry.md) |
| `tokens/colors/` | Spectrum engine, settings, snapshot, color tokens | [color](color.md) |
| `tokens/typography/` | type roles, ratios, font families (numerical reference) | [typography](typography.md) |
| `tokens/themes/` | theme parameters and saved themes | [theming](theming.md) |
| `icons/` | `<i name>` runtime, icon sets, SVG sanitizer | [icons](icons.md) |
| `styles/` | reset, geometry CSS, defaults, FOUC guard, page patterns | [geometry](geometry.md), [theming](theming.md) |
| `preset.ts` | the PandaCSS preset assembling all of the above | [theming](theming.md) |
| `scripts/` | generators: `geometry:csv`, `tokens:dtcg`, `spectrum:defaults` | below |

## Generated outputs

| File | Generator | Source |
|---|---|---|
| `packages/ui-kit/docs/geometry.csv` | `npm run geometry:csv` | resolver |
| `packages/ui-kit/tokens/tokens.dtcg.json` | `npm run tokens:dtcg` | resolver (DTCG 2025.10; formula and per-size values in `$extensions`) |
| `packages/ui-kit/tokens/colors/spectrum/defaults.json` | `npm run spectrum:defaults` | Spectrum engine at default settings |
| `packages/ui-kit/styled-system/`, `dist/ui-kit.css` | `npm run build` | Panda preset |

## The jig

`apps/studio` renders every component inline and tunes geometry, icons, scheme and Spectrum live, scoped to the canvas. See [studio](studio.md).
