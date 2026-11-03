# Color: Spectrum

Every color in the kit: ramps, roles, schemes, shadows, the snapshot and runtime overrides. Neighbors: [components](components.md#states) (which state uses which role), [studio](studio.md) (the Colors tab), [system](system.md#design-tokens-dtcg) (DTCG export).

The kit's colors are Spectrum: HCT-generated, Radix-style 12-step ramps, generated separately for light and dark. The engine is ported unchanged from massimo-ui (`packages/ui-kit/tokens/colors/spectrum/runtime.json`; provenance and embedded licenses in its `NOTICE.md`).

## Ramps

- Each family has steps 1–12 per scheme. Step semantics follow Radix: 1–2 backgrounds, 3–5 interactive, 6–8 borders, 9–10 solids, 11–12 text.
- Step 1 is the scheme endpoint: the **Light endpoint** tone (default HCT tone 97.5) in light, the **Dark endpoint** tone (default 5) in dark. 100 / 0 give pure white / black. There is no step 0.
- Tokens: `colors.spectrum.{family}.{1..12}`; CSS `--colors-spectrum-indigo-9`. Each token carries both scheme values.
- Kit defaults differ from the engine's original defaults in two settings: Dark endpoint 5 (was 2.5) and neutral tint 75 (was 50).
- Default hue set is "Unique" (12 accents + a tinted `neutral`): cyan, indigo, plum, crimson, tomato, orange, amber, yellow, lime, grass, jade, teal.

## Roles

Roles alias ramp steps; an entry may name a different dark step, a different dark family (`darkFamily`) or an alpha (`roleStep`, translucent roles emit `color-mix(… transparent)`) (`ROLE_STEPS` in `tokens/colors/spectrum/index.ts`). Each role is a family (`Roles`, `ROLE_NAMES`): brand (primary, secondary, neutral), feedback (critical = errors and danger, warning, success, info) and data 1–6 (chart series and categories). Defaults request primary `indigo`, secondary `amber`, neutral `neutral`, critical `red`, warning `orange`, success `green`, info `cyan`, data `indigo`, `cyan`, `grass`, `amber`, `tomato`, `plum`; each resolves to the nearest generated hue (`resolveRoles`).

One name per role: a role's tokens are named after the role (`primary.solid`, never an alias such as `accent` or `danger`). Panda token paths are camelCase (`primary.solidHover`); CSS variables are kebab-case (`--colors-primary-solid-hover`).

**Scale roles.** Every brand and feedback role (primary, secondary, neutral, critical, warning, success, info) carries the same set:

| Token | Step | Use |
|---|---|---|
| `<role>.subtle`, `<role>.subtleHover` | 3, 4 | tinted fills (selected options, callouts) and their hover |
| `<role>.border` | 7 | the role's edge |
| `<role>.solid`, `<role>.solidHover` | 9, 10 | filled controls and their hover / press |
| `<role>.fg` | 11 | the role's text and icons on page fills |
| `<role>.1` … `<role>.12` | 1–12 | the whole ramp (swatches, scales, anything off the semantic set) |

**Page roles** (all neutral unless stated):

| Token (CSS variable) | Step |
|---|---|
| `bg` (`--colors-bg`, page) | neutral 1 |
| `bg.subtle`, `bg.muted` | neutral 2, 3 |
| `bg.mutedHover`, `bg.mutedActive` (hover, press) | neutral 4, 5 |
| `bg.control`, `bg.controlHover`, `bg.controlActive` (button, tag, chip and segmented fills; option hover and press) | neutral 12 at 12 / 19 / 25% (dark 20 / 29 / 39%): a translucent layer that reads on any surface; equals neutral 3 / 4 / 5 on the page tone |
| `bg.overlay` (menus, popovers, dialogs, drawers; with `shadows.md`) | neutral 1 light, 2 dark |
| `bg.selected`, `fg.selected` (selected option in a listbox or segmented control) | neutral 1 / neutral 12 in light; primary 9 / its contrast color (`fg.onSolid`) in dark |
| `bg.inverse`, `fg.inverse` (tooltips) | neutral 12, 1 (inverts in each scheme) |
| `bg.backdrop` (modal scrim) | neutral 12 at 40% light, neutral 1 at 70% dark |
| `border`, `border.strong` | neutral 6, 7 |
| `fg.subtle` (placeholders), `fg.muted`, `fg` | neutral 8, 11, 12 |
| `fg.onSolid` | the engine's APCA black/white choice for primary 9 |
| `focusRing` | primary 8 |
| `data.1` … `data.6` | data 1–6 at 9 (chart series, categories) |
| `shadow` | neutral 12 light, neutral 1 dark (the shadow color) |

**Shadows.** Which surface casts which shadow, and the elevation tokens built on these, are in [elevation](elevation.md). `shadows.sm` and `shadows.md` are semantic tokens: layers of the `shadow` color at a per-scheme alpha (`SHADOWS` in `tokens/colors/spectrum/index.ts`; light 12% / 8% + 16%, dark 50% / 36% + 56%), so they follow the scheme and a runtime spectrum. They live in the color DTCG files (`shadow.sm`, `shadow.md`).

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
