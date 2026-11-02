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
theme parameter   --ui-accent-hue: 265                (themes.json / live postMessage)
  -> ramp         --colors-accent-600: oklch(.53 … var(--ui-accent-hue))
  -> role         --colors-accent-solid  (light/dark)
  -> defaults     ui-option[aria-selected=true] { background: var(--colors-accent-subtle) }
```

Theme values are CSS variables, so nothing is regenerated while you drag a slider. Components currently use the boilerplate `styles/defaults.ts` only.

Panda setup note: `@pandacss/preset-base` must be listed explicitly in Panda 2.
