# Changelog

`@massimo/ui-kit`. Versions follow semver; until 1.0.0 a minor version may break, and each break is listed under **Breaking**. How to cut a release: [docs/guides/release.md](../../docs/guides/release.md).

## Unreleased

**Added**

- `variant="ghost"` on `ui-button`: no resting fill, for repeated or low-priority actions.
- `ui-section` (React `Section`): a card's child, supplying the card's inset, or part of it at a smaller `size`; `divided` makes its children rows, and `header` makes it a title row, padded or, with `collapse`, collapsing into the next section's margin.
- `ui-row` (React `Row`): a line of text and actions.
- `color.spectrum.generator`: `oklch` generates the ramps in OKLCH with the same families, steps, contrast targets and anchors. `hct` stays the default.
- `reach` on a color anchor: `key` or `ramp`, how far the anchor's chroma spreads through its family.

**Breaking**

- Ramp tokens lose the `spectrum` level, with no aliases: `--colors-spectrum-indigo-9` is `--colors-indigo-9`, `colors.spectrum.indigo.9` is `colors.indigo.9` and DTCG `color.spectrum.indigo.9` is `color.indigo.9`. The neutral family's tokens are `gray` (`--colors-gray-9`), because `--colors-neutral-9` is the role.
- Type roles are renamed in `data-type`, `textStyle`, `typography.colors`, the DTCG tokens and `--ui-type-color-<role>`, with no aliases: `body-large` is `body-lg`, `body` is `body-md`, `caption` is `body-sm`, `control` is `control-md`, `control-small` is `control-sm`. The `body` voice keeps its name.
- `ui-container` nesting is padding first (decision 0017). A card's radius is its padding × min(1, s), not the control radius + padding. A nested container's radius is max(R_parent − p_parent, R_parent × k), and `container-ratio` now defaults to 0.4. `radius` on a card and `radius-card` run to 4. A nested card steps down the ladder to 3u. A group or collection with no `surface` or `padding` has no padding or border; set one of them to keep the inset.
- The `levels` attribute and the React `levels` prop are removed.
- Every type role is `(10 + u) × r^step`. `body-sm`, `label`, `control-sm` and `code` are step −½, not `3u`, so small text stays smaller than body at every size. `label` was step 0.
- Heading line height is `1.3 − step/20` and tracking `−(step − 1)/100`: display 1.0 and −0.05em, heading-1 −0.03em.
- Card padding `lg` is 6u and `xl` is 8u, so every padding comes from {½, 1, 2, 3, 4, 6, 8}. Dialogs follow `xl`.
- A card has no padding of its own (decision 0018): wrap its content in `ui-section`, or it sits edge to edge. A section of size c sits p − c in and pads c, so its text stays on the card's inset. This also removes `data-row` and the card text inset: use `ui-row` for a line of items.
- `divided` moves from `ui-container` to `ui-section`: `<ui-section size="sm" divided>`.
- A card is block flow, and its sections are spaced by collapsing margins. `gap` on a card applies inside its sections, and `layout` has no effect on it.
- A color anchor's chroma reaches only steps 9–12 by default, capped at the anchor's chroma or the step's generated chroma, whichever is larger. Tints on an anchored accent keep their generated chroma, so they get quieter. `reach: 'ramp'` restores the old spread. Neutral anchors keep it by default.
- Field labels, descriptions and errors start where the control's text starts, not at its edge. In `ui-field` this applies to the stacked layout over a text control.

## 0.1.0 (2026-11-03)

The first versioned state. Everything below is new relative to no release; the breaks are listed against the shapes that existed in the repository before, for anyone who used them from source.

**Breaking**

- The container level tags `ui-group`, `ui-collection`, `ui-card`, `ui-panel`, `ui-region`, `ui-page` and the React `Group`, `Collection`, `Card`, `Panel`, `Region`, `Page` are removed. Use `<ui-container preset="…">` / React `Container` ([decision 0016](../../docs/decisions/0016-remove-container-level-tags.md)).
- The theme object is schema version 2: parameters live in the `geometry`, `typography`, `color` and `motion` parts. Version 1 themes still load through `loadTheme` / `migrateTheme`; `validateThemeObject` alone accepts version 2 only.
- The React `Container` renders `<div data-ui="container">` with plain attributes and no recipe class.

**Added**

- Brands: `brand.schema.json`, `validateBrand`, `hydrate`, `lintBrand`, `buildBrand` and `npm run brand -- validate | lint | hydrate | build`. The catalogue has 14 groundings and 12 territories, with face pairings; there are three worked brands and their briefs.
- Character descriptors: 15 closed scales in the domain manifests, `themeFromCharacter` and `describeTheme`.
- Theme domains: `contracts/domains/*.json` with verification records, plus `domain:`, `descriptor:`, `constraint:`, `grounding:` and `territory:` registry nodes.
- Color anchors (`color.anchors`, with an optional `dark` color), the emphasis parameter, and scoped themes (`themeScopeCss`, `themeRootCss`).
- The face catalogue (24 faces, measured), `typography.sources`, and the lints `typography.face-weights` and `typography.web-face-source`.
- Containers: a 1u padding floor, depth 8, areas restart the chain mid-tree, and `levels` works at any depth.

**Fixed**

- WebKit dropped deep container padding: the chain's properties are now registered as lengths.
- The React `Container` skipped the nesting chain (a CSS layer order issue).
- The dark selection text did not match an anchored dark solid.
