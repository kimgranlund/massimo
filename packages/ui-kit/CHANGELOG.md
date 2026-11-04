# Changelog

`@massimo/ui-kit`. Versions follow semver; until 1.0.0 a minor version may break, and each break is listed under **Breaking**. How to cut a release: [docs/guides/release.md](../../docs/guides/release.md).

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
