# Color: Spectrum

The kit's colors are Spectrum: HCT-generated, Radix-style 12-step ramps, generated separately for light and dark. The engine is ported unchanged from massimo-ui (`packages/ui-kit/tokens/colors/spectrum/runtime.json`; provenance and embedded licenses in its `NOTICE.md`).

## Ramps

- Each family has steps 1–12 per scheme. Step semantics follow Radix: 1–2 backgrounds, 3–5 interactive, 6–8 borders, 9–10 solids, 11–12 text.
- Step 1 is the scheme endpoint: the **Light endpoint** tone (default HCT tone 97.5) in light, the **Dark endpoint** tone (default 5) in dark. 100 / 0 give pure white / black. There is no step 0.
- Tokens: `colors.spectrum.{family}.{1..12}`; CSS `--colors-spectrum-indigo-9`. Each token carries both scheme values.
- Kit defaults differ from the engine's original defaults in two settings: Dark endpoint 5 (was 2.5) and neutral tint 75 (was 50).
- Default hue set is "Unique" (12 accents + a tinted `neutral`): cyan, indigo, plum, crimson, tomato, orange, amber, yellow, lime, grass, jade, teal.

## Roles

Roles alias ramp steps; an entry may name a different dark step or an alpha (`roleStep`, translucent roles emit `color-mix(… transparent)`) (`ROLE_STEPS` in `tokens/colors/spectrum/index.ts`). Each role is a family (`Roles`, `ROLE_NAMES`): brand (primary, secondary, neutral), feedback (critical = errors and danger, warning, success, info) and data 1–6 (chart series and categories). Defaults request primary `indigo`, secondary `amber`, neutral `neutral`, critical `red`, warning `orange`, success `green`, info `cyan`, data `indigo`, `cyan`, `grass`, `amber`, `tomato`, `plum`; each resolves to the nearest generated hue (`resolveRoles`).

| Role variable | Step |
|---|---|
| `--colors-bg` (page) | neutral 1 |
| `--colors-bg-subtle`, `--colors-bg-muted` | neutral 2, 3 |
| `--colors-bg-muted-hover`, `--colors-bg-muted-active` (hover, press) | neutral 4, 5 |
| `--colors-bg-overlay` (menus, popovers, dialogs, drawers; with `shadow.md`) | neutral 1 light, 2 dark |
| `--colors-bg-inverse`, `--colors-fg-inverse` (tooltips) | neutral 12, 1 (inverts in each scheme) |
| `--colors-bg-backdrop` (modal scrim) | neutral 12 at 40% light, neutral 1 at 70% dark |
| `--colors-border`, `--colors-border-strong` | neutral 6, 7 |
| `--colors-fg-muted`, `--colors-fg` | neutral 11, 12 |
| `--colors-accent-subtle`, `-subtle-hover`, `-solid`, `-solid-hover`, `-fg` | primary 3, 4, 9, 10, 11 |
| `--colors-focus-ring` | primary 8 |
| `--colors-danger-solid`, `-solid-hover`, `-subtle`, `-fg` | critical 9, 10, 3, 11 |
| `--colors-secondary-solid`, `-solid-hover`, `-subtle`, `-fg` | secondary 9, 10, 3, 11 |
| `--colors-warning-*`, `--colors-success-*`, `--colors-info-*` (`-solid`, `-subtle`, `-fg`) | warning, success, info 9, 3, 11 |
| `--colors-data-1` … `--colors-data-6` | data 1–6 at 9 |
| `--colors-fg-on-solid` | the engine's APCA black/white choice for primary 9 |

## Schemes

Light by default; dark under `prefers-color-scheme: dark`; `.light` / `.dark` on any element force a scheme for its subtree. Role tokens are redeclared in every scheme block so a subtree class re-resolves them.

## Diagnostics

`spectrumDiagnostics(data, roles)` reports what shaped a generation: the peak tone **T*** (the weakest hue's chroma peak, from the engine's checks), the shared peak chroma **C*** (accents' step-9 chroma) and the accent that limits it, the primary's step 11/12 APCA checks in both schemes, each accent's CAM16 **hue quadrature** H (unique hues red 20.14°, yellow 90°, green 164.25°, blue 237.53° at H 0/100/200/300), and the **max in-gamut chroma per accent by tone** (20–92) from `gamutBoundary(hue, tone, gamut)`. The jig's Colors tab draws it as a summary line and two charts.

`gamutBoundary` is the vendored engine's internal `boundary` function, which the runtime API does not re-export; `load()` keeps a reference to it by wrapping the global `Function` constructor during the first generation only. The vendored file is not modified.

## Design tokens

`tokens/dtcg/color.light.dtcg.json` and `color.dark.dtcg.json`: every ramp step as an oklch `color` token, every role as an alias (`{color.spectrum.indigo.9}`). See [system](system.md#design-tokens-dtcg).

## Defaults and overrides

- Kit tokens are built from `tokens/colors/spectrum/defaults.json`, a generated snapshot (`npm run spectrum:defaults`), so builds never run the engine. Values are rounded to 4 decimals.
- At runtime: `generateSpectrum(settings)` (~300ms, debounce it) and `spectrumCSS(data, resolveRoles(data, roles), scope?)` from `@massimo/ui-kit/spectrum` emit the same variable names. Without `scope` the CSS mirrors the kit's scheme structure on `:root`; with a scope selector (the jig uses `[data-canvas]`) everything is declared on that element only.
- Settings schema: `SPECTRUM_FIELDS` in `tokens/colors/spectrum/config.ts` (hue set, first hue, chroma, base, falloff, distribution, hue balance, chroma origin, peak tone, endpoints, scale, tinted neutral and tint, grays, harmony, gamut). `normalizeSpectrum` validates field by field.
