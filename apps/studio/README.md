# Studio

Tune ui-kit themes live and save them back into the kit.

```sh
npm run studio        # from the repo root; http://localhost:5173
```

- **Left panel:** the theme parameters from `packages/ui-kit/tokens/themes/params.ts` (accent and neutral hue/chroma, danger hue, corner radius, control size) plus light/dark.
- **Canvas:** `canvas.html` in an iframe, showing the same prototype with web components and with React. It is its own document so a theme applies to `<html>` there and never leaks into the studio UI.
- **Save theme:** writes the changed parameters to `packages/ui-kit/tokens/themes/themes.json` via a dev-only endpoint (`POST /__studio/themes`, validated against the parameter schema). Restart the dev server or rerun ui-kit's build to regenerate the theme CSS; any page then opts in with `<html data-ui-theme="<name>">`.

## How styling flows

```
theme parameter   --ui-accent-hue: 265                (themes.json / live postMessage)
  -> ramp         --colors-accent-600: oklch(.53 … var(--ui-accent-hue))
  -> role         --colors-accent-solid  (light/dark)
  -> defaults     ui-option[aria-selected=true] { background: var(--colors-accent-subtle) }
```

Theme values are CSS variables, so nothing is regenerated while you drag a slider. Components currently use the boilerplate `styles/defaults.ts` only.

Panda setup note: `@pandacss/preset-base` must be listed explicitly in Panda 2.
