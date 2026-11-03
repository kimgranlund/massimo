# Component geometry

Every length in the kit: the unit u, controls, choices and tracks, badges/tags/chips, the container ladder and the Panda spacing, sizes and radii tokens, and how they are verified. Neighbors: [typography](typography.md) (text sizes on the same u), [theming](theming.md) (the parameters), [components](components.md) (where lengths apply).

Based on Differential Forms v0.2.2 (`mathematical-design-system` skill), adapted:
- **Size is the unit.** `size` (or `data-size`) sets u for an element and its subtree: 2, 2.25, 2.5, 2.75, 3, 3.5, 4, 4.5, then every 0.5 up to 12. A control is 8u tall (16 to 96px). Default u comes from the theme `unit` (4.5 → 36px controls, 14.5px control text).
- **Slots.** Controls have `leading`, `contents` and `trailing` slots, each at least 6u square, inside 1u of padding.
- **Text** is 10px + u.

Design tokens: [geometry.dtcg.json](../../packages/ui-kit/tokens/dtcg/geometry.dtcg.json) (DTCG 2025.10; see [system](system.md#design-tokens-dtcg)).

Quick reference: [geometry.csv](../../packages/ui-kit/docs/geometry.csv), every formula with its value at each size (generated from the resolver: `npm run geometry:csv`; a test fails if it is stale).

Sources of truth, kept in agreement by tests:
- `packages/ui-kit/tokens/geometry/resolve.ts`: numerical reference (`resolveControl`, `resolveComposite`, `resolveField`, `resolveSelectTrigger`, `resolveIcon`).
- `packages/ui-kit/styles/geometry.ts`: the same formulas in CSS, computed per element from inherited inputs.
- `packages/ui-kit/components/<name>/<name>.recipe.ts`: where each length applies (the slot recipes read the variables); no numbers of their own.

## Inputs

| Input | Where | Values | Default |
|---|---|---|---|
| u | theme `--ui-unit`; `size` / `data-size` per subtree | 2, 2.25, 2.5, 2.75, 3, 3.5, 4, 4.5, 5 … 12 (0.5 steps) | 4.5 (tables below show u = 4) |
| B (border) | theme `--ui-border` | whole px, 0..u/2 (clamped) | 0 |
| curvature scale | theme `--ui-radius-scale` | 0..3 | 1 (soft = 3u) |
| corner shape k | theme `--ui-corner-shape`: `corner-shape: superellipse(k)` on every element with a radius | −1..4 (1 round, 2 squircle, 0 bevel, <0 scoop) | 1 |
| icon size | `icon-size` / `data-icon-size`, any element, inherited | sm, md, lg, fill | md |
| gap | `gap` on a container or composite; that element only | 0 … 8 (0.5 steps, ×u) | = the padding level |

## Control: ui-button (and the shape ui-input / ui-select share)

| | Formula | at u=4 |
|---|---|---|
| height | 8u | 32 |
| padding | 1u − B (the border lives inside the 1u) | 4 |
| parts | construction pattern `[leading] [prefix] [contents] [suffix] [trailing]`; leading/trailing are icon slots, min 6u × 6u; empty parts are hidden | 24 |
| text run | prefix, contents (the label) and suffix: 0.5u on a side next to another text part (so they sit 1u apart), 1u beside a slot, 2u at a bare edge (`resolveTextRun`); single-line text: line height 1.2 × font, capped at the 6u slot, centered by equal block padding (slot − line) / 2 | 2, 4 or 8 / 3.6 / 16.8 |
| font | 10px + u | 14 |
| icon sm / md / lg | font − 0.5u / font + 0.5u / font + 1.5u, capped at 6u | 12 / 16 / 20 |
| icon fill | the whole 6u slot, object-fit cover, centered; radius = control radius − u | 24 |
| radius | min(3u × scale, 4u) | 12 |

| u | 2 | 2.25 | 2.5 | 3 | 3.5 | 4 | 4.5 |
|---|---|---|---|---|---|---|---|
| height | 16 | 18 | 20 | 24 | 28 | 32 | 36 |
| font | 12 | 12.25 | 12.5 | 13 | 13.5 | 14 | 14.5 |

Icons capped by the slot: `md` below u≈2.2 and `lg` below u≈2.9 (at u=2: md and lg are 12px, the slot size), so a control never grows past 8u.

Usage: `<ui-button><i slot="leading" name="credit-card"></i><span slot="prefix">$</span>Pay<span slot="suffix">⌘P</span></ui-button>`. Anything with `slot="leading" | "prefix" | "suffix" | "trailing"` goes in that part; everything else is contents. Prefix and suffix are short text adornments (a currency, a unit, a shortcut, a count) in the label color at 65%. An icon-only button is an 8u square (give it an `aria-label`). React: `<Button leading={…} prefix={…} suffix={…} trailing={…} iconSize="lg" size={3}>`.

The same pattern and text-run rule apply to every labelled component: button, option, the input control, the select trigger, badge, tag and chip (label edges of their own local unit, see below), and checkbox/radio/switch (the indicator is the leading slot; bare end edge 0).

Inputs and select triggers are laid out as buttons: the host (input `[data-part=control]`, select `[data-part=trigger]`) has only 1u (padding u − B plus border), and its parts carry the rest with the button rules. The input control is `[leading] [prefix] [contents = editor] [suffix] [trailing]`, filled from children with those `slot` values (`<ui-input label="Price"><span slot="prefix">$</span><span slot="suffix">USD</span></ui-input>`); with no adornments the text has 2u each side, as a slotless label. The select trigger is `[leading] [prefix] [contents = value] [suffix] [trailing = chevron]`; authors may fill leading, prefix and suffix. Field states (`aria-invalid`, `aria-readonly`, `aria-disabled`) sit on the input's contents and the select's trigger; styles read both through `:has()`. Indicators (the select chevron, any `caret-*` icon and the `x` close icon in a slot) are always icon size sm, whatever `icon-size` says.

## Choices, tracks, swatches, swiper, image, field rows

| | Formula | at u=4 |
|---|---|---|
| checkbox / radio box | 5u, in the 6u leading slot; label start padding u (1.5u from the box) | 20 |
| switch | 9u × 5u track, 4u thumb inset 0.5u, travels 4u | 36 × 20 |
| checkbox radius | u × s (radio and switch round) | 4 |
| range / progress | 4u track, radius min(3u × s, 2u); range thumb inside it like the switch thumb: track − u, inset 0.5u, radius track radius − 0.5u, offset 0.5u + ratio × (width − track); range fill = track + ratio × (width − track) with the track radius, so its cap stays concentric around the thumb (maison-ui's construction); progress fill = ratio × width; min width 24u | 16 / 12 / 16 |
| swatch | 6u square, radius u × s; palette strip radius 2u × s, no gaps | 24 |
| swiper | paddles are 8u icon buttons inset 2u; dots 2u (active 4u) in 4u hit areas, gap u, 2u above the bottom edge | 32 / 8 |
| image | square frame (radius 0), height = width / ratio (presets or a custom w/h; none or invalid: the content sets it); a slideshow is a swiper filling the frame (`resolveImage`) | |
| field row | column gap 2u; row gap 1.5u stacked, 1u inline; readout min width 10u; field grid gaps 2u, label column ≤ 40%, 4u above every heading but the first (`resolveFieldRow`, `resolveFieldGrid`) | 8 / 6 / 40 |

Swiper paddles are fully round (radius = half their height) whatever the curvature setting, like the dots, and use icon size lg.

## Disclosure: collapsible, accordion, tabs

| | Formula | at u=4 |
|---|---|---|
| trigger | a control row: height 8u (grows with a wrapping label), padding u − B inside a transparent border, the control radius, full width; construction pattern with the label 2u from a bare start edge (1u beside a leading slot) and 1u from the trailing caret slot | 32 / 4 / 12 |
| caret | icon size sm in the 6u trailing slot, turned 180° while open | 12 |
| panel | text starts at the trigger's label edge: inline padding u + 2u; end padding 2u (0 while closed); height 0 ↔ auto on the reveal intent (`resolveDisclosure`) | 12 / 8 |
| accordion item | a collapsible; items are separated by the thin border-width token (1px, border role) outside the trigger's padding, so a closed item is 8u + 1px at any B (inline end when horizontal) | 33 |
| tabs, segmented | the list is a composite (edge D, one row 8u, radius min(3.5u·s, 4u)); tabs are composite options (7u, the option radius); the indicator is the active tab's box (`resolveTabs`) | 32 / 28 / 12 |
| tabs, underline | tabs are 8u control rows (padding u − B), no gap, over a thin (1px) track on the list's end edge; the indicator is a 0.5u bar, radius 0.25u, under the active tab | 32 / 2 / 1 |
| tabs, both | list to panel 2u; the indicator is placed by `--active-tab-left / -top / -width / -height` (px, script, snapped to 1/64 px) and slides on the toggle intent | 8 |

## Dialogs: dialog, alert dialog

| | Formula | at u=4 |
|---|---|---|
| popup | a container at the card-xl level: padding p·u − B (p = pad-card-xl, 6u) inside a B edge, radius p·u × min(1, s) (`resolveDialog`) | 24 / 24 |
| parts | title, description, content and the actions row 2u apart (the collection gap; the `gap` attribute on the host wins); actions 2u apart at the end edge | 8 / 8 |
| size | width min(96u, viewport − 8u), centered; max height viewport − 8u, then the popup scrolls | 384 / 16 |
| backdrop | the whole viewport, `bg.backdrop` | |

## Drawer

| | Formula | at u=4 |
|---|---|---|
| popup | an area at the panel level: padding p·u − B (p = pad-panel, 6u), square at any corner scale (it meets the viewport edge), parts 2u apart, actions 2u apart (`resolveDrawer`) | 24 / 0 / 8 |
| left, right | the viewport's height; width min(80u, viewport − 8u) | 320 |
| top, bottom | the full width; height of its content, at most viewport height − 8u, then it scrolls | 32 kept |

## Containers

Containers come in three families, each with one radius rule. Every level has a padding p; padding and gap are theme parameters per level (`pad-<level>`, `gap-<level>`, in u; the table shows their defaults), the `gap` attribute overrides the gap on one element, and the border lives inside the padding. All radii are capped at half the height.

- **Wrapper** (composite, group, collection): hugs its children (options, controls, rows), so its radius is concentric with them: (3u + p) × corner scale. Composite options keep the 3u control radius.
- **Container** (`ui-card`, `padding="xs | sm | md | lg | xl"` = 2u, 3u, 4u, 5u, 6u; md is the default): a self-contained surface whose radius equals its padding, p × min(1, corner scale): never rounder than it is deep; the corner scale can lower it, not raise it. Children keep their own radii, so they are not concentric with it. A card may hold a smaller card (it takes the base fill).
- **Area** (panel, region, page): meets the viewport or other areas, so it is square.

Nesting: areas hold containers, containers hold wrappers (page › region › panel › card › collection › group; a level may be skipped). Page is region spacing plus a centered max width (72rem; `page({ width, gap })` in Panda code, where `gap` is in units of u).

### Panda tokens in u

Panda code uses the same unit. `spacing` and `sizes` keys are multiples of u (`p: '8'` is 8u, `gap: '0.5'` is 0.5u; keys 0, 0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24), and `radii` are u × corner scale (`sm` 1u, `md` 1.5u, `lg` 2u, `xl` 3u; `full` is a pill). The container ladder is named (`<level>` as in the table: `group`, `card-md`, `page`…): `pad.<level>` and `gap.<level>` are the theme's `pad-<level>` / `gap-<level>` in u, and `inset.<level>` is the padding inside a border, max(0, pad − B), the way containers use it. `page()` is `p: inset.page`, `gap: gap.page`. Panda declares token variables on `:root`, where they resolve with the root unit, so every element with `size` / `data-size` redeclares the u-based ones (`unitTokenVars()`), and a theme scope that sets `--ui-unit` or a ladder parameter on its own element includes `unitTokenCss()` (the jig canvas does). There is no fixed rem grid. `sizes` also has keywords: `full` (100%), `min`, `max`, `fit` and `prose` (65ch). A length that is not one of these tokens is a type error ([theming](theming.md#panda-configs)).

| level | element | padding p | gap | max radius | at u=4: pad / gap / radius |
|---|---|---|---|---|---|
| composite (wrapper) | ui-listbox, ui-segmented, select popup | 0.5u | 0.5u | 3.5u | 2 / 2 / 14 |
| group (wrapper) | ui-group | 1u | 1u | 4u | 4 / 4 / 16 |
| collection (wrapper) | ui-collection | 2u | 2u | 5u | 8 / 8 / 20 |
| card-xs (container) | ui-card padding="xs" | 2u | 2u | 2u | 8 / 8 / 8 |
| card-sm (container) | ui-card padding="sm" | 3u | 3u | 3u | 12 / 12 / 12 |
| card-md (container) | ui-card (padding="md") | 4u | 4u | 4u | 16 / 16 / 16 |
| card-lg (container) | ui-card padding="lg" | 5u | 5u | 5u | 20 / 20 / 20 |
| card-xl (container) | ui-card padding="xl" | 6u | 6u | 6u | 24 / 24 / 24 |
| panel (area) | ui-panel | 6u | 6u | 0 | 24 / 24 / 0 |
| region (area) | ui-region | 8u | 8u | 0 | 32 / 32 / 0 |
| page (area) | ui-page, `page()` pattern | 8u | 8u | 0 | 32 / 32 / 0 |

Example: `<ui-card size="5" gap="2">` has 20px padding and 10px gaps. Containers use the inherited size, so one `size` on a panel compacts everything inside it. A group keeps its controls full height (10u around 8u controls). Layout containers are CSS only: they need no script. Their styles are slot recipes (`components/container/container.recipe.ts`, the composite in `components/recipe-parts.ts`), also emitted on the tags ([components](components.md#styles)).

### Composite detail

Options use the control anatomy with their inset reduced by the composite edge D = max(B, 0.5u): option inset Ic = max(B, u − D), option height 6u + 2Ic = 7u, so a one-row segmented control is always exactly 8u. Option radius = min(option/2, composite radius − D) = 3u, the control radius (the composite is exempt from radius ≤ padding). The popup sits 1u below its trigger.

## Badge, tag, chip

Heights sit on a 12px base plus k·u, capped so a chip is never taller than a control and each level stays one u below the next.

| | Height | Text | Slots (u′ = height / 8) | at u = 3 / 4 / 5 |
|---|---|---|---|---|
| chip | min(12 + 3u, 8u) | 10 + u | chip − u′ | 21 / 24 / 27 |
| tag | min(12 + 2u, chip − u) | 10 + 0.5u | tag − u′ | 18 / 20 / 22 |
| badge | min(12 + u, tag − u) | 10 | badge − u′ | 15 / 16 / 17 |

The cap only bites below u = 2.5 (u = 2: 12 / 14 / 16). All three use the construction pattern with the label-wrapper padding system, measured in a local unit u′ = height / 8 (a control is 8u tall), so spacing is relative to each element's size: the host has max(0, 0.5u′ − B), slots are height − u′, labels carry 1u′ on both sides (beside a slot too; chip labels get +0.5u′ at a bare edge, 1.5u′, to balance icon artwork) and text parts sit 0.5u′ apart. At u = 4: chip u′ = 3px, tag 2.5px, badge 2px. Text is single-line at line height 1.2 × font (capped at the slot); chip centers it with block padding (slot − line) / 2, tag and badge have no block padding; min width = height (a badge is never narrower than tall; a one-digit badge is a circle at default sizes); radius is concentric with the slot, the button's rule in their own unit: (0.5u′ + slot / 3) × s, capped at h/2 (the button: 1u + 6u / 3 = 3u). At u = 4: chip 8.5, tag 7.1, badge 5.7; a corner radius above about 1.4 makes them pills. Fill slots nest at R − 0.5u′. Icon containers have a set size: the slot (height − u′) square, glyph centered. Icons use the control icon formulas against the element's own font and slot.

`<ui-badge>` and `<ui-tag>` are static labels. `<ui-chip>` is interactive: `selectable` toggles `aria-pressed`; `removable` adds a trailing ✕, and clicking it, Delete or Backspace fires a cancelable `remove` event (the chip then removes itself and focus moves to a neighbouring chip).

## Verification

- `npm run ui-kit:test`: the size table, slot and contents padding, icon formulas and caps, border conservation, composite growth, Q=0, slot sorting.
- Browser: `npm run studio`, open `/geometry-check.html`. It renders every size × 2 borders (rotating icon sizes, a gap override on every third) and compares each measured length, type roles included, with the resolver; radii are compared as painted (min(declared, height/2)). It prints the `cases` and `checks` counts; `"fails": []` means CSS and resolver agree.

Browsers snap fractional borders to device pixels, so use whole-pixel borders. Not covered yet: multiline fields, chips inside inputs, table cells.
