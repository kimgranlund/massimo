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

- **Pane grid** (Figma-style): each group is a 5-column grid; a row is a label spanning 2 columns and a control spanning 3 (ranges show a tabular value readout, Containers rows pair a padding and a gap menu). Group titles span the row. Built from `Field`, `Range`, `Segmented`, `Select`, `Switch` and `Group` in `src/studio/wc.tsx`.
- **Tabs** (segmented, persisted in localStorage): Components, Containers, Colors, Typography; each switches panel and canvas.
- **Components:** unit, border, corner radius, corner shape; icon set; scheme.
- **Containers:** the same geometry, plus a padding menu and a gap menu (in u, with px) for each container type: composite, group, collection, tile, card, panel, region, page.
- **Colors:** roles (primary, neutral, critical), scheme, hue set and first hue, chroma (requested, base %, falloff, hue balance), tone (automatic peak, dark and light endpoints), neutral tint, scale, gamut. Generation runs on the main thread, debounced (~300ms per run).
- **Typography:** unit, ratio (named ratios), rhythm (none, ½u, 1u), scheme; a stack menu per face (sans, serif, mono, display) and a face menu per voice (display, heading, body, ui, numeric, code). Copy JSON carries `typography.faces` and `typography.voices`. The canvas shows the voice map, then every role with live metrics over a rhythm grid, then a short article set in the roles.
- **Theme:** start from a saved theme, name, save geometry and icons to `packages/ui-kit/tokens/themes/themes.json` (dev-only `POST /__studio/themes`, validated).
- **Copy:** JSON of every applied setting minus defaults (`theme`, `scheme`, `spectrum.settings`, `spectrum.roles`) plus `howToApply`, for an agent. **Reset:** all defaults.

## Canvas views

- **Components:** buttons, badges/tags/chips, fields (a real form), selection, checkbox/radio/switch, range/progress, swiper/image, swatch/palette.
- **Containers:** the container demo and every level.
- **Colors:** "Color in context" (Brand: primary as material, accent as punctuation, the primary ramp, ink and paper, tint and emphasis; Interface: a workspace of cards with actions, form, library, figures, progress, a chart, action states and feedback, all colored from the active roles and scheme), then "Hue and chroma" (summary line: T*, C* and its limiting accent, gamut, primary Lc 11/12 light and dark, generation time; a hue-quadrature chart; a max-chroma-per-tone chart with T* and C*), then every family's light and dark ramps. The accent is the family opposite primary in the hue set; callouts, chart and button states are canvas markup, not kit components.

## Checks

`/geometry-check.html` renders 44 configurations and compares 102 measured lengths each with the resolver (4488 in total), including every type role's size and line height; `"fails": []` means CSS and resolver agree.
