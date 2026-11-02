# Studio (jig)

`apps/studio`: a panel of token controls beside a content area of pages that render the ui-kit web components. Run `npm run studio`. This spec covers the panel, the pages and their header, canvas scoping, Copy JSON and the browser checks; the parameters it tunes are in [theming](theming.md) and [color](color.md); the hand-off steps are in the [jig guide](../guides/tune-and-hand-off.md).

## Rules

- Built exclusively from ui-kit web components (in React); no native form controls and no React component counterparts.
- The canvas renders inline (no iframe). Shape and type overrides are scoped to the `[data-canvas]` element, so the panel stays usable whatever they are:
  - geometry and motion parameters as inherited `--ui-*` custom properties on the element (with the u-based and motion Panda tokens redeclared there, `unitTokenCss()` and `motionTokenCss()`),
  - the icon set as `data-icons`.
- Color applies to the whole jig (panel and canvas):
  - the scheme as a `light` / `dark` class on `<html>` (none for Auto),
  - Spectrum as `spectrumCSS(data, roles, ':root')`.

## Panel

- **Pane grid** (Figma-style): each tab is one `ui-field-grid`; a row is a `ui-field layout="inline"` (label with a unit suffix, control, readout), so labels, controls and readouts line up across every group of the tab. Group titles are headings spanning the grid. The field's label names its control (no hidden labels); the container rows in the Geometry tab pair a padding and a gap menu, each named "<type> Padding" / "<type> Gap" through `labelledby`. Built from `Field`, `Range`, `Segmented`, `Select`, `Switch` and `Group` in `src/studio/wc.tsx`; a trailing `(unit)` in a label becomes the field's `unit`.
- **Tabs** (segmented, persisted in localStorage `studio:panel`): Geometry, Colors, Typography, Motion. The panel edits tokens only: switching a tab never changes the page (the page is the URL hash alone).
- **Header:** the title, then the tabs.
- **Geometry:** unit, border, corner radius, corner shape; icon set; a padding menu and a gap menu (in u, with px) for each container type: composite, group, collection, card-xs … card-xl, panel, region, page.
- **Colors:** Random, role groups (brand, feedback, data 1–6), hue set (Unique or Radix) and first hue, chroma (requested, base %, falloff, hue balance), tone (automatic peak, dark and light endpoints), neutral tint, scale, gamut. Generation runs on the main thread, debounced (~300ms per run). Role selects are grouped Brand (primary, secondary, neutral), Feedback (critical, warning, success, info) and Data 1–6, each option and the trigger led by a swatch of the family's step 9; **Random** reassigns the brand roles (the neutral included) and data 1–6 from the generated families, and feedback roles keep their colors.
- **Typography:** unit, ratio (named ratios), rhythm (none, ½u, 1u); a stack menu per face (sans, serif, mono, display) and a face menu per voice (display, heading, body, ui, numeric, code). Copy JSON carries `typography.faces` and `typography.voices`.
- **Motion:** `MotionPanel` (`src/studio/MotionPanel.tsx`) owns every motion control (duration scale, bounce, springs, intents); no other tab shows motion.
- **Copy:** JSON of every applied setting minus defaults (`theme`, `scheme`, `spectrum.settings`, `spectrum.roles`) plus `howToApply`, for an agent. **Reset:** all defaults.

## Pages

- **Routing:** the URL hash `#/<route>` picks the page (`src/pages/route.ts`; routes and labels in `src/pages/types.ts`: `ROUTES`, `ROUTE_LABEL`). An empty or unknown route is Home; every navigation is a history entry, so back and forward work and a reload keeps the page. Every page takes `PageProps` (params, spectrum, voices, faces) and nothing about the panel.
- **Content header** (`nav`, at the default theme, outside `[data-canvas]`): stays at the top of the content column, which scrolls below it. A page menu (`ui-select`, ROUTES with ROUTE_LABEL) at the start; page menus, then the scheme button, at the end. The scheme button cycles Auto (circle-half) → Light (sun) → Dark (moon); its `aria-label` names the current and next scheme. The header wraps at narrow widths.
- **Home** (`pages/Home.tsx`): realistic layouts built only from the kit.
- **Components:** every component by family: Actions (button), Labels (badge, tag, chip), Fields (input, select, a real form), Selection (listbox, segmented, select), Choices (checkbox, radio, switch), Tracks (range, progress), Color (swatch, palette), Media (swiper, image). The header's family menu (All by default) filters them and lives in the hash query, `#/components?family=fields`, so a filtered view can be linked and survives reloads; it resets when you leave the page.
- **Containers:** Container tokens (live padding, gap and radius per level, and what uses it), Levels (every level including composite), Nesting (areas › cards, a small card inside › collection › group, with an input and select), Groups and collections (buttons, chips, tags, a tile list, a tile grid of images), Overrides (`gap="0|1|4"`, `data-size="3|4|5"`).
- **Geometry:** the control ladder from the resolvers in `@massimo/ui-kit/tokens` at the live border and corner radius: per size (u 2 … 12, plus the theme unit, highlighted) height, slot, padding, text and line height, icon sm/md/lg, radius and badge/tag/chip heights with an icon button specimen; the construction pattern (start | end padding per text part for five part combinations); badge, tag and chip at the theme unit (u′, slot, edges, radius); fields and composites (input, select trigger, segmented); choices, tracks and swatches. Tables scroll sideways at narrow widths.
- **Typography:** the voice map, then every role with live metrics over a rhythm grid, then a short article set in the roles.
- **Colors:** Roles overview, Color in context, Hue and chroma, Ramps.
  - **Color in context:** Brand (primary as material, secondary as punctuation, the primary ramp as a vertical strip, ink and paper, tint and emphasis) and Interface (a workspace of cards with actions, form, library, figures, progress, a chart, action states and feedback), all colored from the active roles and scheme. Every color there comes from role tokens (static classes); callouts and the chart are canvas markup, not kit components.
  - **Hue and chroma:** summary line (T*, C* and its limiting accent, gamut, primary Lc 11/12 light and dark, generation time), a hue-quadrature chart and a max-chroma-per-tone chart with T* and C*; then every family's light and dark ramps.
- **Motion** (`pages/Motion.tsx`): plots each spring's live curve over the exact spring, replays a thumb per spring, maps each intent to its current spring and where components use it, and replays component demos (switch, radio, select popup, chip, button, progress, swiper); notes when reduced motion is on.
- Shared pieces (`Page`, `Section`, `Row`, `Divider`, common styles, sample images) are in `src/pages/shared.tsx`. Page layouts use container queries on the canvas (`[data-canvas]` is the `canvas` container; 40rem and 64rem), not viewport breakpoints, since the panel takes part of the viewport. Below the md breakpoint the panel stacks above the content column.

## Checks

Browser checks: `/geometry-check.html` (rendered CSS, every type role included, against the resolver; see [geometry](geometry.md#verification)) and `/react-check.html` (each native React renderer against its web component at five sizes); both print `"fails": []` when they match.

## Styling

 the jig sets no style attributes for theming. Live overrides (theme parameters, faces and serif weights that differ from the kit defaults, scoped to `[data-canvas]`, plus the generated Spectrum CSS on `:root`) live in one constructed stylesheet adopted by the document (`useSheet`). Canvas demos color everything through role tokens as static `css()` classes; the only inline style left is the chart's data ratio (`--v`).

- **Size ladders** (`SizeLadder` in `pages/shared.tsx`): every component family shows sizes the same way: sizes 3, 4 and 6 plus the theme unit (highlighted; it inherits the canvas unit), one row each, the size and the family's resolver metrics on the left (like the Typography roles), specimens on the right.
- **Tables** (`dataTable` and helpers in `pages/shared.tsx`): every tabular view (Geometry ladders, Container tokens, Motion intents) is a real `<table>` in one style: full container width, one value per column, group headers over related columns, the live theme row highlighted, a horizontal scroller when narrow.
