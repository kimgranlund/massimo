# Studio (jig)

`apps/studio`: a panel of controls beside a canvas that renders every ui-kit web component. Run `npm run studio`.

## Rules

- Built exclusively from ui-kit web components (in React); no native form controls and no React component counterparts.
- The canvas renders inline (no iframe). Shape and type overrides are scoped to the `[data-canvas]` element, so the panel stays usable whatever they are:
  - geometry parameters as inherited `--ui-*` custom properties on the element,
  - the icon set as `data-icons`.
- Color applies to the whole jig (panel and canvas):
  - the scheme as a `light` / `dark` class on `<html>` (none for Auto),
  - Spectrum as `spectrumCSS(data, roles, ':root')`.

## Panel

- **Pane grid** (Figma-style): each group is a 5-column grid; a row is a label spanning 2 columns and a control spanning 3 (ranges show a tabular value readout, Containers rows pair a padding and a gap menu). Group titles span the row. Built from `Field`, `Range`, `Segmented`, `Select`, `Switch` and `Group` in `src/studio/wc.tsx`.
- **Tabs** (segmented, persisted in localStorage): Components, Containers, Colors, Typography; each switches panel and canvas.
- **Header:** title, then a single icon button at the trailing end that cycles the canvas scheme Auto (circle-half) → Light (sun) → Dark (moon); its `aria-label` names the current and next scheme.
- **Components:** unit, border, corner radius, corner shape; icon set.
- **Containers:** the same geometry, plus a padding menu and a gap menu (in u, with px) for each container type: composite, group, collection, tile, card, panel, region, page.
- **Colors:** roles (primary, neutral, critical), hue set and first hue, chroma (requested, base %, falloff, hue balance), tone (automatic peak, dark and light endpoints), neutral tint, scale, gamut. Generation runs on the main thread, debounced (~300ms per run).
- **Typography:** unit, ratio (named ratios), rhythm (none, ½u, 1u); a stack menu per face (sans, serif, mono, display) and a face menu per voice (display, heading, body, ui, numeric, code). Copy JSON carries `typography.faces` and `typography.voices`. The canvas shows the voice map, then every role with live metrics over a rhythm grid, then a short article set in the roles.
- **Copy:** JSON of every applied setting minus defaults (`theme`, `scheme`, `spectrum.settings`, `spectrum.roles`) plus `howToApply`, for an agent. **Reset:** all defaults.

## Canvas views

- **Components:** buttons, badges/tags/chips, fields (a real form), selection, checkbox/radio/switch, range/progress, swiper/image, swatch/palette.
- **Containers and Colors** share one page ("Containers and colors"); the Containers tab opens it at the container tokens, the Colors tab at Color in context. Order: Color in context, Container tokens (live padding, gap and radius per level, and what uses it), Levels (every level including composite), Nesting (page › region › panel › card › collection › tile › group with an input and select), Groups and collections (buttons, chips, tags, a tile list, a tile grid of images), Overrides (`gap="0|1|4"`, `data-size="3|4|5"`), Hue and chroma, Ramps.
- Canvas layouts use container queries on the canvas (`@container canvas`, 40rem and 64rem), not viewport breakpoints, since the panel takes part of the viewport. The Brand row stacks (ramp flat), then campaign with the ramp at its right (spanning both rows) over ink | tint, then one row of four.
- **Color in context:** (Brand: primary as material, accent as punctuation, the primary ramp as a vertical strip, ink and paper, tint and emphasis; Interface: a workspace of cards with actions, form, library, figures, progress, a chart, action states and feedback, all colored from the active roles and scheme), then "Hue and chroma" (summary line: T*, C* and its limiting accent, gamut, primary Lc 11/12 light and dark, generation time; a hue-quadrature chart; a max-chroma-per-tone chart with T* and C*), then every family's light and dark ramps. The accent is the family opposite primary in the hue set; callouts, chart and button states are canvas markup, not kit components.

## Checks

`/geometry-check.html` renders 44 configurations and compares 102 measured lengths each with the resolver (4488 in total), including every type role's size and line height; `"fails": []` means CSS and resolver agree.

Browser checks: `/geometry-check.html` (rendered CSS against the resolver) and `/react-check.html` (each native React renderer against its web component at five sizes); both print `"fails": []` when they match.

Colors view: role selects grouped as Brand (primary, secondary, neutral), Feedback (critical, warning, success, info) and Data 1–6; **Random** reassigns the brand roles (the neutral included) and data 1–6 from the generated families; feedback roles keep their colors. Role selects lead each option and the trigger with a swatch of the family's step 9 (`swatch` prop of the jig `Select`). Pane labels show a trailing `(unit)` as a suffix at the label's end.
