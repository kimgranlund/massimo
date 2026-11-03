# Elevation

How surfaces stack: six levels, each a fill, a shadow and a layer, tuned by six theme parameters. Reference: `packages/ui-kit/tokens/elevation/index.ts` (`ELEVATION`); tokens in `tokens/colors/index.ts`. Neighbors: [color](color.md#roles) (the fills and the shadow color), [components](components.md#floating-layers) (the floating and top layers), [theming](theming.md) (the parameters).

## Levels

| Level | | Fill | Shadow (default) | Layer | Used by |
|---|---|---|---|---|---|
| 0 | page | `bg` | none | inline | ui-page, ui-region, the document |
| 1 | panel | `elevation.panel` (bg.muted) | none | inline | ui-panel |
| 2 | card | `elevation.card` (bg.subtle) | none | inline | ui-card; a card in a card takes the page fill |
| 3 | raised | `elevation.card` | `shadow-raised` (sm) | inline | ui-card when `card-raised` is 1 |
| 4 | floating | `elevation.overlay` (bg.overlay) | `shadow-floating` (md) | floating layer, 1u from its anchor | popover, preview card, menus, select and combobox popups, navigation menu, toast |
| 5 | modal | `elevation.overlay` | `shadow-modal` (md) | top layer, over `bg.backdrop` | dialog, alert dialog, drawer |

Surfaces separate by fill, not lines: the page, panel and card fills differ by one neutral step each, so nested levels read without borders. A floating or modal surface adds a shadow and the border role's edge (B). Small lifts inside a component (a selected option or segment, a range thumb, a pressed toggle in a group, a tooltip) use the base `shadows.sm`; they are not levels.

## Parameters

| Parameter | Range | Default | Effect |
|---|---|---|---|
| `shadow-strength` | 0–2 (0.05) | 1 | every shadow's alpha × this (0 flat, 2 heavy; clamped at 100%) |
| `surface-contrast` | 0–1 (0.05) | 1 | each level fill = mix(level fill, page fill): 1 the level's own fill, 0 one fill everywhere (shadows alone separate) |
| `shadow-raised`, `shadow-floating`, `shadow-modal` | 0, 1, 2 | 1, 2, 2 | the shadow that level casts: none, sm, md |
| `card-raised` | 0, 1 | 0 | cards cast the raised shadow (level 3) |

## Tokens

- `colors.elevation.panel | card | overlay`: `color-mix(in oklab, <fill> calc(100% × surface-contrast), bg)`.
- `colors.shadowLayer.sm1 | md1 | md2`: each shadow layer's color, the `shadow` role at its per-scheme alpha (`SHADOWS`), so the shadow tokens are scheme-independent: they scale a layer with `color-mix(in oklch, <layer> x%, transparent)`, which multiplies its alpha.
- `shadows.raised | floating | modal`: the sm and md layers, weighted by the level's step n without conditionals (sm = 1 − (n − 1)², md = n(n − 1) / 2, so n = 0, 1, 2 gives none, sm, md), every layer's alpha × `shadow-strength`. `shadows.card` is the raised shadow × `card-raised`.
- `shadows.sm | md`: the base shadows × `shadow-strength`. The DTCG files carry them at strength 1 (DTCG cannot reference a theme variable).

Panda declares these tokens on `:root` (and per scheme, so a `.dark` / `.light` subtree re-resolves them), where the `--ui-*` inputs resolve with the root values. A scope that sets elevation parameters for its own subtree (the jig canvas) redeclares them with `elevationTokenCss()`, as it does `unitTokenCss()` and `motionTokenCss()`.

Shadows take the `shadow` role's color per scheme (neutral 12 light, neutral 1 dark) at a per-scheme alpha (`SHADOWS`), so they follow a runtime spectrum. Forced colors drop shadows and fills; surfaces keep a system edge.
