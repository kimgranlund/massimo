# Studio

The jig: tune ui-kit themes live on a canvas of every component and hand the result to an agent. Spec: [docs/specs/studio.md](../../docs/specs/studio.md). Steps: [tune and hand off](../../docs/guides/tune-and-hand-off.md).

```sh
npm run studio        # from the repo root; http://localhost:5173
npm run typecheck -w @massimo/studio
npm run studio:build  # production build (hashed class names)
```

- Built only from ui-kit web components (in React); no native form controls.
- **Tabs:** Components, Containers, Colors, Typography; each switches the panel and the canvas.
- **Header:** one button cycles the scheme Auto → Light → Dark; **Copy** puts every applied setting (minus defaults) on the clipboard as JSON with `howToApply` instructions; **Reset** restores all defaults. Nothing is saved to disk.
- **Canvas:** rendered inline; theme overrides are scoped to `[data-canvas]` so the panel keeps the default theme. Color (scheme and Spectrum) applies to the whole page.
- **Checks:** `/geometry-check.html` (CSS against the resolver) and `/react-check.html` (React renderers against the web components) print `"fails": []` when they agree.

## How styling flows

```
Spectrum settings  ->  engine (HCT)  ->  ramps   --colors-spectrum-indigo-9 (light and dark values)
                                         roles   --colors-primary-solid: var(--colors-spectrum-indigo-9)
theme parameters   ->  --ui-unit, --ui-border, --ui-radius-scale, --ui-corner-shape, --ui-type-*, --ui-motion-*, --ui-pad-*, --ui-gap-*
                       -> geometry CSS and the u-based Panda tokens (--spacing-*, --radii-*, …)
```

The kit ships the default Spectrum as tokens; the Colors tab regenerates it live and overrides the same variables.
