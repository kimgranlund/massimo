# Color: Spectrum

The kit's colors are Spectrum: HCT-generated, Radix-style 12-step ramps, generated separately for light and dark. The engine is ported unchanged from massimo-ui (`packages/ui-kit/tokens/colors/spectrum/runtime.json`; provenance and embedded licenses in its `NOTICE.md`).

## Ramps

- Each family has steps 1–12 per scheme. Step semantics follow Radix: 1–2 backgrounds, 3–5 interactive, 6–8 borders, 9–10 solids, 11–12 text.
- Step 1 is the scheme endpoint: the **Light endpoint** tone (default HCT tone 97.5) in light, the **Dark endpoint** tone (default 5) in dark. 100 / 0 give pure white / black. There is no step 0.
- Tokens: `colors.spectrum.{family}.{1..12}`; CSS `--colors-spectrum-indigo-9`. Each token carries both scheme values.
- Kit defaults differ from the engine's original defaults in two settings: Dark endpoint 5 (was 2.5) and neutral tint 75 (was 50).
- Default hue set is "Unique" (12 accents + a tinted `neutral`): cyan, indigo, plum, crimson, tomato, orange, amber, yellow, lime, grass, jade, teal.

## Roles

Roles alias ramp steps (`ROLE_STEPS` in `tokens/colors/spectrum/index.ts`). Defaults: primary `indigo`, neutral `neutral`, critical `crimson` (requested families resolve to the nearest generated hue).

| Role variable | Step |
|---|---|
| `--colors-bg` (page) | neutral 1 |
| `--colors-bg-subtle`, `--colors-bg-muted` | neutral 2, 3 |
| `--colors-border`, `--colors-border-strong` | neutral 6, 7 |
| `--colors-fg-muted`, `--colors-fg` | neutral 11, 12 |
| `--colors-accent-subtle`, `-solid`, `-solid-hover`, `-fg` | primary 3, 9, 10, 11 |
| `--colors-focus-ring` | primary 8 |
| `--colors-danger-solid`, `-solid-hover`, `-fg` | critical 9, 10, 11 |
| `--colors-fg-on-solid` | the engine's APCA black/white choice for primary 9 |

## Schemes

Light by default; dark under `prefers-color-scheme: dark`; `.light` / `.dark` on any element force a scheme for its subtree. Role tokens are redeclared in every scheme block so a subtree class re-resolves them.

## Design tokens

`tokens/dtcg/color.light.dtcg.json` and `color.dark.dtcg.json`: every ramp step as an oklch `color` token, every role as an alias (`{color.spectrum.indigo.9}`). See [system](system.md#design-tokens-dtcg).

## Defaults and overrides

- Kit tokens are built from `tokens/colors/spectrum/defaults.json`, a generated snapshot (`npm run spectrum:defaults`), so builds never run the engine. Values are rounded to 4 decimals.
- At runtime: `generateSpectrum(settings)` (~300ms, debounce it) and `spectrumCSS(data, resolveRoles(data, roles), scope?)` from `@massimo/ui-kit/spectrum` emit the same variable names. Without `scope` the CSS mirrors the kit's scheme structure on `:root`; with a scope selector (the jig uses `[data-canvas]`) everything is declared on that element only.
- Settings schema: `SPECTRUM_FIELDS` in `tokens/colors/spectrum/config.ts` (hue set, first hue, chroma, base, falloff, distribution, hue balance, chroma origin, peak tone, endpoints, scale, tinted neutral and tint, grays, harmony, gamut). `normalizeSpectrum` validates field by field.
