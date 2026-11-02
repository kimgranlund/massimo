# Studio

Tune ui-kit themes live and save them back into the kit.

```sh
npm run studio        # from the repo root; http://localhost:5173
```

The jig is built entirely from ui-kit components (web components in React; no native form controls).

- **Tabs** (segmented control): Components, Containers, Colors. Each switches the panel and the canvas.
- **Components / Containers:** geometry (unit, border, corner radius, corner shape), icon set and scheme.
- **Colors:** Spectrum (HCT) settings: hue set, first hue, chroma, falloff, hue balance, peak tone, tone endpoints, neutral tint, scale, gamut; and the role families (primary, neutral, critical). Generation is debounced (~300ms per run) and recolors the canvas live.
- **Theme:** save the geometry and icon settings into `packages/ui-kit/tokens/themes/themes.json` (dev-only endpoint).
- **Copy:** puts every applied setting (minus defaults) on the clipboard as JSON with instructions for applying it, ready to hand to an agent. **Reset** restores all defaults.
- **Canvas:** `canvas.html` in an iframe, so themes apply to its `<html>` only. `/geometry-check.html` compares rendered geometry with the resolver.

## How styling flows

```
Spectrum settings  ->  engine (HCT)  ->  ramps   --colors-spectrum-indigo-9 (light and dark values)
                                         roles   --colors-accent-solid: var(--colors-spectrum-indigo-9)
components                               ui-option[aria-selected=true] { background: var(--colors-accent-subtle) }
geometry           theme parameters      --ui-unit, --ui-border, --ui-radius-scale, --ui-corner-shape
```

The kit ships the default Spectrum as tokens; the Colors tab regenerates it live and overrides the same variables.

Panda setup note: `@pandacss/preset-base` must be listed explicitly in Panda 2.
