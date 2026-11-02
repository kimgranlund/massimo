# Studio (jig)

`apps/studio`: a panel of controls beside a canvas that renders every ui-kit web component. Run `npm run studio`.

## Rules

- Built exclusively from ui-kit web components (in React); no native form controls and no React component counterparts.
- The canvas renders inline (no iframe). All overrides are scoped to the `[data-canvas]` element, so the panel keeps the default theme:
  - geometry parameters as inherited `--ui-*` custom properties on the element,
  - the scheme as a `light` / `dark` class (none for Auto),
  - the icon set as `data-icons`,
  - Spectrum as `spectrumCSS(data, roles, '[data-canvas]')`.

## Panel

- **Tabs** (segmented, persisted in localStorage): Components, Containers, Colors; each switches panel and canvas.
- **Components / Containers:** unit, border, corner radius, corner shape; icon set; scheme.
- **Colors:** roles (primary, neutral, critical), scheme, hue set and first hue, chroma (requested, base %, falloff, hue balance), tone (automatic peak, dark and light endpoints), neutral tint, scale, gamut. Generation runs on the main thread, debounced (~300ms per run).
- **Theme:** start from a saved theme, name, save geometry and icons to `packages/ui-kit/tokens/themes/themes.json` (dev-only `POST /__studio/themes`, validated).
- **Copy:** JSON of every applied setting minus defaults (`theme`, `scheme`, `spectrum.settings`, `spectrum.roles`) plus `howToApply`, for an agent. **Reset:** all defaults.

## Canvas views

- **Components:** buttons, badges/tags/chips, fields (a real form), selection, checkbox/radio/switch, range/progress, swiper/image, swatch/palette.
- **Containers:** the container demo and every level.
- **Colors:** roles preview and every family's light and dark ramps.

## Checks

`/geometry-check.html` renders 44 configurations and compares 76 measured lengths each with the resolver (3344 in total); `"fails": []` means CSS and resolver agree.
