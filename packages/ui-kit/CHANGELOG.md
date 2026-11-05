# Changelog

`@massimo/ui-kit`. Versions follow semver; until 1.0.0 a minor version may break, and each break is listed under **Breaking**. How to cut a release: [docs/guides/release.md](../../docs/guides/release.md).

## Unreleased

**Breaking**

- Type roles are renamed in `data-type`, `textStyle`, `typography.colors`, the DTCG tokens and `--ui-type-color-<role>`, with no aliases: `body-large` is `body-lg`, `body` is `body-md`, `caption` is `body-sm`, `control` is `control-md`, `control-small` is `control-sm`. The `body` voice keeps its name.
- `ui-container` nesting is padding first (decision 0017). A card's radius is its padding × min(1, s), not the control radius + padding. A nested container's radius is max(R_parent − p_parent, R_parent × k), and `container-ratio` now defaults to 0.4. `radius` on a card and `radius-card` run to 4. A nested card steps down the ladder to 3u. A group or collection with no `surface` or `padding` has no padding or border; set one of them to keep the inset.
- The `levels` attribute and the React `levels` prop are removed.
- The `label` type role is 3u, the size of `control-sm`, not the base step.
- A card's headings, paragraphs, `strong`, type roles and `data-row` rows start on the text edge, not the card's padding edge, except in a `padding="xs"` card.
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
