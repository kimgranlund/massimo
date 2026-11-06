# Elevation

How surfaces stack: six levels, each a fill, a shadow and a layer, tuned by six theme parameters. Reference: `packages/ui-kit/tokens/elevation/index.ts` (`ELEVATION`); tokens in `tokens/colors/index.ts`. Neighbors: [color](color.md#roles) (the fills and the shadow color), [components](components.md#floating-layers) (the floating and top layers), [theming](theming.md) (the parameters).

## Levels

| Level | | Fill | Elevation (default) | Layer | Used by |
|---|---|---|---|---|---|
| 0 | page | `bg` | none | inline | the document; the page and region presets |
| 1 | panel | `elevation.panel` (bg.muted) | none | inline | the panel preset; `surface="panel"` |
| 2 | card | `elevation.card` (bg.subtle) | none | inline | the card preset, `surface="card"`; a card in a card takes the page fill |
| 3 | raised | `elevation.card` | `shadow-raised` (2dp) | inline | `surface="raised"`; every card when `card-raised` is 1 |
| 4 | floating | `elevation.overlay` (bg.overlay) | `shadow-floating` (8dp) | floating layer, 1u from its anchor | popover, preview card, menus, select and combobox popups, navigation menu, toast |
| 5 | modal | `elevation.overlay` | `shadow-modal` (24dp) | top layer, over `bg.backdrop` | dialog, alert dialog, drawer |

Surfaces separate by fill, not lines: the page, panel and card fills differ by one neutral step each, so nested levels read without borders. A floating or modal surface adds a shadow and the border role's edge (B). Small lifts inside a component (a selected option or segment, a range thumb, a pressed toggle in a group, a tooltip) use the base `shadows.sm` (1dp) and `shadows.md` (3dp); they are not levels.

## Compound shadows

Every shadow is three layers, an improved form of Material's compound elevation: a key-light **umbra** (tight, dark), a **penumbra** (its soft edge) and an **ambient** layer (wide, faint). Each layer's offset, blur and spread are linear in the elevation e (dp), fitted to Material's tables at 2, 8 and 24dp, so any elevation is valid and the jig tunes it continuously (`SHADOW_LAYERS`, `tokens/colors/spectrum/index.ts`):

| Layer | y | blur | spread | alpha light / dark |
|---|---|---|---|---|
| umbra | 0.5e | 0.6e | −0.3e | 0.14 / 0.5 |
| penumbra | e | 1.6e | 0.125e | 0.1 / 0.36 |
| ambient | 0.4e | 1.9e | 0.33e | 0.08 / 0.3 |

What improves on Material: the shadow is tinted by the `shadow` role (neutral 12 in light, the darkest neutral in dark), never black, so it follows the palette and runtime color ramps; dark mode has its own, stronger alphas; elevation is a continuous input, not a lookup; and every layer's alpha × `shadow-strength` × min(1, e), so 0dp casts nothing.

## Parameters

| Parameter | Range | Default | Effect |
|---|---|---|---|
| `shadow-strength` | 0–2 (0.05) | 1 | every shadow's alpha × this (0 flat, 2 heavy; clamped at 100%) |
| `surface-contrast` | 0–1 (0.05) | 1 | each level fill = mix(level fill, page fill): 1 the level's own fill, 0 one fill everywhere (shadows alone separate) |
| `shadow-raised`, `shadow-floating`, `shadow-modal` | 0–24 dp (whole) | 2, 8, 24 | the level's elevation: the size of its compound shadow (0 casts none) |
| `card-raised` | 0, 1 | 0 | cards cast the raised shadow (level 3) |

## Tokens

- `colors.elevation.panel | card | overlay`: `color-mix(in oklab, <fill> calc(100% × surface-contrast), bg)`.
- `colors.shadowLayer.umbra | penumbra | ambient`: each layer's color, the `shadow` role at its per-scheme alpha, so the shadow tokens are scheme-independent: they scale a layer with `color-mix(in oklch, <layer> x%, transparent)`, which multiplies its alpha.
- `shadows.raised | floating | modal`: the compound shadow at `shadow-<level>` dp; `shadows.card` is the raised shadow × `card-raised`.
- `shadows.sm | md`: the base shadows (1dp, 3dp) × `shadow-strength`. The DTCG files carry them at strength 1 (DTCG cannot reference a theme variable).

Panda declares these tokens on `:root` (and per scheme, so a `.dark` / `.light` subtree re-resolves them), where the `--ui-*` inputs resolve with the root values. A scope that sets elevation parameters for its own subtree (the jig canvas) redeclares them with `elevationTokenCss()`, as it does `unitTokenCss()` and `motionTokenCss()`.

Shadows take the `shadow` role's color per scheme (neutral 12 light, neutral 1 dark) at a per-scheme alpha (`SHADOWS`), so they follow runtime color ramps. Forced colors drop shadows and fills; surfaces keep a system edge.
