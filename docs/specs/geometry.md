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
| icon size | `icon-size` / `data-icon-size`, any element, inherited | sm, md, lg, xl, fill | md |
| density | theme `--ui-density`; `density` / `data-density` per subtree | compact, default, loose | default ([density](#density)) |
| gap | `gap` on a container or composite; that element only | 0 … 8 (0.5 steps, ×u) | = the padding level |

## Density

Density is how much fits at the same scale, separate from scale (u). The theme's `density` (0 compact, 1 default, 2 loose) sets it for the document; `density="compact | default | loose"` (or `data-density`, React `data-density`) sets it for a subtree and inherits like `size`.

| | compact | default | loose | formula of the index n |
|---|---|---|---|---|
| control inset I | 0.5u | 1u | 2u | 0.5 + 0.25n + 0.25n² |
| control height 6u + 2I | 7u | 8u | 10u | |
| container ladder (padding, gap) | × 0.5 | × 1 | × 1.5 | 0.5 + 0.5n |

Type, the 6u slot, icons and text-run edges never change with density. Everything built on the control follows it: padding I − B, the control radius cap (half the height), composite rows (edge D = max(B, pad-composite × factor), option inset max(B, I − D), so one row is the control height), chips (never taller than a control), swiper paddles, steppers and panel indents. An explicit `gap` attribute is taken as written. Where the compact inset cannot hold both a composite's edge and its option's edge (B ≥ I / 2, only at u = 2 with a 1px border), the row grows to 6u + 4B instead of shrinking anything. CSS computes the same formulas from `--ui-density` (`--di`, `--df`, `--ctl-h` in `styles/geometry.ts`); the resolvers take `density`. The tables below are at default density.

## Control: ui-button (and the shape ui-input / ui-select share)

| | Formula | at u=4 |
|---|---|---|
| height | 6u + 2I: 8u at default density (7u compact, 10u loose) | 32 |
| padding | 1u − B (the border lives inside the 1u) | 4 |
| parts | construction pattern `[leading] [prefix] [contents] [suffix] [trailing]`; leading/trailing are icon slots, min 6u × 6u; empty parts are hidden | 24 |
| text run | prefix, contents (the label) and suffix: 0.5u on a side next to another text part (so they sit 1u apart), 1u beside a slot, 2u at a bare edge (`resolveTextRun`); single-line text: line height 1.2 × font, capped at the 6u slot, centered by equal block padding (slot − line) / 2 | 2, 4 or 8 / 3.6 / 16.8 |
| font | 10px + u | 14 |
| icon sm / md / lg / xl | max(font, 3.5u) + k·u, k = −0.5 / 0.5 / 1.5 / 2.5, capped at 6u (in general font + k·u, at least (3.5 + k)/6 of the slot) | 12 / 16 / 20 / 24 |
| icon fill | the whole 6u slot, object-fit cover, centered; radius = control radius − u | 24 |
| radius | min(3u × scale, 4u) | 12 |

| u | 2 | 2.25 | 2.5 | 3 | 3.5 | 4 | 4.5 |
|---|---|---|---|---|---|---|---|
| height | 16 | 18 | 20 | 24 | 28 | 32 | 36 |
| font | 12 | 12.25 | 12.5 | 13 | 13.5 | 14 | 14.5 |

Icons follow the text up to u = 4 and the slot above it. The text term is font + k·u. The slot term is (3.5 + k)/6 of the slot: 3u, 4u, 5u and 6u for sm, md, lg and xl in a 6u slot. The two meet at u = 4, where 10 + u = 3.5u, so nothing changes at u ≤ 4, and above it each tier keeps its share of the slot. At u = 12, md is 48px in the 72px slot instead of 28px, and the caret (sm) is 36px. Tiers are 1u apart. xl is the slot at every size: the glyph counterpart of `fill`, which covers the slot with an image. The cap keeps a control at 8u: at u = 2, md, lg and xl are 12px, the slot size. Badge, tag and chip use the same rule against their own font and slot.

Usage: `<ui-button><i slot="leading" name="credit-card"></i><span slot="prefix">$</span>Pay<span slot="suffix">⌘P</span></ui-button>`. Anything with `slot="leading" | "prefix" | "suffix" | "trailing"` goes in that part; everything else is contents. Prefix and suffix are short text adornments (a currency, a unit, a shortcut, a count) in the label color at 65%. An icon-only button is an 8u square (give it an `aria-label`). React: `<Button leading={…} prefix={…} suffix={…} trailing={…} iconSize="lg" size={3}>`.

The same pattern and text-run rule apply to every labelled component: button, option, the input control, the select trigger, badge, tag and chip (label edges of their own local unit, see below), and checkbox/radio/switch (the indicator is the leading slot; bare end edge 0).

Inputs and select triggers are laid out as buttons: the host (input `[data-part=control]`, select `[data-part=trigger]`) has only 1u (padding u − B plus border), and its parts carry the rest with the button rules. The input control is `[leading] [prefix] [contents = editor] [suffix] [trailing]`, filled from children with those `slot` values (`<ui-input label="Price"><span slot="prefix">$</span><span slot="suffix">USD</span></ui-input>`); with no adornments the text has 2u each side, as a slotless label. The select trigger is `[leading] [prefix] [contents = value] [suffix] [trailing = chevron]`; authors may fill leading, prefix and suffix. Field states (`aria-invalid`, `aria-readonly`, `aria-disabled`) sit on the input's contents and the select's trigger; styles read both through `:has()`. Indicators (the select chevron, any `caret-*` icon and the `x` close icon in a slot) are always icon size sm, whatever `icon-size` says.

The combobox input row (`resolveCombobox`) is the select trigger's row with the editable text as its contents: `[leading] [prefix] [chips] [input] [suffix] [clear] [trigger]`. The text starts 2u from a bare edge, 1u after a slot, 0.5u after text and 1u after the last chip (its 0.5u gap plus 0.5u), and ends 1u before the clear or trigger slot (6u each, sm icons), 2u at a bare edge. Chips (multiple) are slot-sized: 6u tall, radius min(3u, control radius − u), label 1u from the start, a 6u remove square, 0.5u apart (and 0.5u after a leading slot or prefix); the row wraps onto lines 0.5u apart, so it is 8u + 6.5u per extra line, with the clear and trigger slots held on the first line at the end. The popup is the select's composite 1u from the row; its empty text sits at an option label's inset (Ic + 2u) in one option row (7u). The autocomplete is the same row without chips; without its trigger and while the clear slot is hidden, the text ends 2u from the bare edge.

## Choices, tracks, swatches, swiper, image, field rows

| | Formula | at u=4 |
|---|---|---|
| checkbox / radio box | 5u, in the 6u leading slot; label start padding u (1.5u from the box) | 20 |
| switch | 9u × 5u track, 4u thumb inset 0.5u, travels 4u | 36 × 20 |
| checkbox radius | u × s (radio and switch round) | 4 |
| range / progress | 4u track, radius min(3u × s, 2u); range thumb inside it like the switch thumb: track − u, inset 0.5u, radius track radius − 0.5u, offset 0.5u + ratio × (width − track); range fill = track + ratio × (width − track) with the track radius, so its cap stays concentric around the thumb (maison-ui's construction); a two-thumb range's fill starts r0 × (width − track) and is track + (r1 − r0) × (width − track) wide, wrapping both thumbs (`trackPairFill`); progress fill = ratio × width; min width 24u | 16 / 12 / 16 |
| swatch | 6u square, radius u × s; palette strip radius 2u × s, no gaps | 24 |
| swiper | paddles are 8u icon buttons inset 2u; dots 2u (active 4u) in 4u hit areas, gap u, 2u above the bottom edge | 32 / 8 |
| image | square frame (radius 0), height = width / ratio (presets or a custom w/h; none or invalid: the content sets it); a slideshow is a swiper filling the frame (`resolveImage`) | |
| field row | column gap 2u; row gap 1.5u stacked, 1u inline; readout min width 10u; field grid gaps 2u, label column ≤ 40%, 4u above every heading but the first (`resolveFieldRow`, `resolveFieldGrid`) | 8 / 6 / 40 |

Swiper paddles are fully round (radius = half their height) whatever the curvature setting, like the dots, and use icon size lg.

## Scroll area

`ui-scroll-area` (`resolveScrollArea`, CSS in `styles/geometry.ts`): scrollbars over a natively scrolling viewport.

| Quantity | Formula | u = 4 / 6 |
|---|---|---|
| track thickness | 2u, at the inline end (vertical) or block end (horizontal) | 8 / 12 |
| thumb | 0.5u inside the track: u thick, at least 4u long, else track × visible / total | 4 / 6, ≥ 16 / 24 |
| radii | track min(3u·s, u), thumb min(3u·s, u / 2): pills | 4 / 6, 2 / 3 |
| corner | 2u square where both bars show, else 0 | 8 / 12 |

No border; the bars overlay the content's edge. Lengths that follow the scroll position (thumb length and offset, corner, overflow distances) are custom properties set by script.

## Disclosure: collapsible, accordion, tabs

| | Formula | at u=4 |
|---|---|---|
| trigger | a control row: height 8u (grows with a wrapping label), padding u − B inside a transparent border, the control radius, full width; construction pattern with the label 2u from a bare start edge (1u beside a leading slot) and 1u from the trailing caret slot | 32 / 4 / 12 |
| caret | icon size sm in the 6u trailing slot, turned 180° while open | 12 |
| panel | text starts at the trigger's label edge: inline padding u + 2u; end padding 2u (0 while closed); height 0 ↔ auto on the reveal intent (`resolveDisclosure`) | 12 / 8 |
| accordion item | a collapsible; items are separated by the thin border-width token (1px, border role) outside the trigger's padding, so a closed item is 8u + 1px at any B (inline end when horizontal) | 33 |
| tabs, segmented | the list is a composite (edge D, one row 8u, the control radius min(3u·s, 4u)); tabs are composite options (7u, the option radius); the indicator is the active tab's box (`resolveTabs`) | 32 / 28 / 12 |
| tabs, underline | tabs are 8u control rows (padding u − B), no gap, over a thin (1px) track on the list's end edge; the indicator is a 0.5u bar, radius 0.25u, under the active tab | 32 / 2 / 1 |
| tabs, both | list to panel 2u; the indicator is placed by `--active-tab-left / -top / -width / -height` (px, script, snapped to 1/64 px) and slides on the toggle intent | 8 |

## Toast

| | Formula | at u=4 |
|---|---|---|
| toast | a container at the card-sm level: padding pad-card-sm (3u) − B, radius 3u × min(1, s) (`resolveToast`) | 12 / 12 |
| content | title and description in one column 0.5u apart; the action (an 8u control row, label 2u at its edges, the control radius) and the close (a 6u slot, icon size sm, radius min(control radius, 3u)) after it, 1u apart | 2 / 32 / 24 / 4 |
| viewport | 80u wide, at most the window less 8u; 4u from the window edges (inline: in flow, toasts 2u apart) | 320 / 16 |
| stack | expanded toasts 2u apart (`--toast-offset-y` + index × 2u), collapsed ones peek 2u a step and shrink 5% a step at `--toast-frontmost-height`; the variables are px from layout (script, snapped to 1/64 px) | 8 |

## Entry fields: number field, OTP field

| | Formula | at u=4 |
|---|---|---|
| number field | the field control (8u, padding u − B, the control radius) with the decrement in the leading 6u slot and the increment in the trailing one; the text run (prefix, input, suffix) is 1u from each stepper, 0.5u between text parts; stepper glyph at icon size sm, stepper radius R − u (concentric); the label (in the scrub area) 1.5u above (`resolveNumberField`) | 32 / 24 / 4 / 8 |
| OTP field | each cell a square field control, 8u × 8u, padding u − B, the control radius and font, one centered character; cells 1u apart; a separator is a 2u × 0.5u dash, radius 0.25u, in that gap (`resolveOtpField`) | 32 / 4 / 8 × 2 |

## Dialogs: dialog, alert dialog

| | Formula | at u=4 |
|---|---|---|
| popup | a container at the card-xl level: padding p·u − B (p = pad-card-xl, 8u) inside a B edge, radius p·u × min(1, s) (`resolveDialog`) | 24 / 24 |
| parts | title, description, content and the actions row 2u apart (the collection gap; the `gap` attribute on the host wins); actions 2u apart at the end edge | 8 / 8 |
| size | width min(96u, viewport − 8u), centered; max height viewport − 8u, then the popup scrolls | 384 / 16 |
| backdrop | the whole viewport, `bg.backdrop` | |

## Drawer

| | Formula | at u=4 |
|---|---|---|
| popup | an area at the panel level: padding p·u − B (p = pad-panel, 6u), square at any corner scale (it meets the viewport edge), parts 2u apart, actions 2u apart (`resolveDrawer`) | 24 / 0 / 8 |
| left, right | the viewport's height; width min(80u, viewport − 8u) | 320 |
| top, bottom | the full width; height of its content, at most viewport height − 8u, then it scrolls | 32 kept |

## Menus: menu, context menu, menubar

| | Formula | at u=4 |
|---|---|---|
| trigger | a control row: 8u, padding u − B, the control radius, the construction pattern (a preset's caret is trailing, icon size sm) (`resolveMenu`) | 32 |
| popup | a floating composite 1u from its anchor (below the trigger, beside a submenu trigger, at the pointer): edge D = max(B, 0.5u), padding D − B, the composite gap, the control radius min(3u·s, 4u) (items R − D inside it); at least as wide as the anchor, at most the space left | 4 / 2 / 12 |
| item | a composite option: 7u, inset Ic, radius min(item / 2, popup radius − D); labels 2u from a bare edge, 1u from a slot; a suffix (shortcut) 2u after the label; checkbox and radio items keep a 6u leading indicator slot; group labels share the item row | 28 / 12 |
| separator | the separator rule max(1px, B) with 0.5u above and below, beyond the gap | 1 / 2 |
| menubar | a composite row (edge D, one row 8u, the control radius min(3u·s, 4u), vertical too) of its menus' triggers as composite options (7u, the option radius); its menus open 1u below the trigger (beside a vertical bar) (`resolveMenubar`) | 32 / 28 / 14 |

## Popups: popover, tooltip, preview card

| | Formula | at u=4 |
|---|---|---|
| offset | 1u from the trigger on the side in use (the preferred side unless the popup does not fit there and the other side has more room) | 4 |
| width | at least the trigger's width (tooltip excepted); at most min(available width, cap): popover and preview card 80u, tooltip 60u | ≥ trigger / 320 |
| height | at most the space beside the trigger (`--available-height`); the popup then scrolls | |
| arrow | 2u wide, tip 1u from the popup (it spans the gap), centered on the trigger, kept radius + u inside the popup ends | 8 × 4 |
| popover | the card-sm level: padding 3u − B, radius 3u·min(1, s), the group gap 1u (the `gap` attribute wins) (`resolvePopup('popover')`) | 12 / 12 / 4 |
| tooltip | a 7u text row: the control font at line height 1.2 in a 6u text slot inside a 0.5u edge (block padding 0.5u − B + line padding), 2u − B at the ends, radius min(3u·s, 3.5u), at most 60u wide, no trigger-width minimum; inverse fill (`resolvePopup('tooltip')`) | 28 / 8 / 12 |
| navigation menu | the list a composite row without a fill (8u, edge 0.5u); triggers and links composite options (7u, labels 2u / 1u, the caret icon sm in trailing); the popup a composite container (edge 0.5u, the control radius) 1u below the open trigger, aligned to its start, sized to the open content (at most 120u) (`resolveNavigationMenu`) | 32 / 28 / 14 |
| preview card | the card-md level: padding 4u − B, radius 4u·min(1, s), the collection gap 2u, at most 80u (`resolvePopup('preview-card')`) | 16 / 16 / 8 |

## Containers

Containers come in four families, each with one radius rule. Every level has a padding p; padding and gap are theme parameters per level (`pad-<level>`, `gap-<level>`, in u; the table shows their defaults), the `gap` attribute overrides the gap on one element, and the border lives inside the padding. All radii are capped at half the height.

- **Composite** (listbox, segmented, toggle group, tabs list, menubar, the select, menu and navigation popups): a control. It takes the control radius, min(3u × s, 4u), the same as a button beside it, and its options split the difference: R − D, concentric inside it.
- **Wrapper** (group, collection): hugs its controls, so its radius is concentric with them when painted: the control radius + p, min(3u × s, 4u) + p·u, at every corner scale; at s = 0 everything is square (the p term is multiplied by min(1, 100·s)). A wrapper with no `surface` and no `padding` paints nothing, so it has no padding or border; it keeps its ladder gap, and its contents share an edge with what sits beside it.
- **Container** (`ui-container preset="card"`, `padding="xs | sm | md | lg | xl"` = 2u, 3u, 4u, 6u, 8u; md is the default): a self-contained surface, never rounder than it is deep: R = p × min(1, s). Floating and modal surfaces on a card level (toast card-sm, popover card-sm, preview card card-md, dialog card-xl) take the same radius. A card may hold a smaller card (it takes the base fill). A card has no padding of its own: `ui-section` supplies it, as a control's content fills its inset. A section of size c sits p − c in from the edge and pads c, so its text lands on p whatever c is (`resolveSection`), and its corners stay concentric, R′ = max(R − (p − c), kR). A bare child is full-bleed, clipped to the corners. A card is block flow: sections are spaced by collapsing margins, p or p − c, and `ui-section header` is padded instead, or, with `collapse`, margined below, so the next section's top stays put. The text edge, the control inset + 2u (`resolveField` textEdge), belongs to field labels.
- **Area** (panel, region, page): meets the viewport or other areas, so it is square.

**Radius magnitude.** Wrappers and cards express their radius as a magnitude t of their family's radius R0: R = t × R0, t from 0 to 1 in 0.05 steps (cards to 4). 1 is the default and 0 square, so a collection of pill buttons can sit in a nearly square box, and a card at t = 2 is twice as round as it is deep. The theme sets t per family (`radius-group`, `radius-collection`, `radius-card`); the `radius` attribute sets it on one element (`<ui-container preset="group" radius="0.5">`, React `radius={0.5}`) and, like `gap`, does not inherit. Composites are controls and areas square, so neither takes t.

Nesting: areas hold containers, containers hold wrappers (page › region › panel › card › collection › group; a level may be skipped). Page is region spacing plus a centered max width (72rem; `page({ width, gap })` in Panda code, where `gap` is in units of u).

### Nesting (ui-container)

`ui-container` (presets group, collection, card, panel, region, page; the old level tags were removed, decision 0016) nests under one rule: padding is the input and radius follows (`resolveContainerTree`, the chain in `container.recipe.ts`; [decision 0017](../decisions/0017-padding-first-containers.md)).

| Node | Radius | Padding | Gap |
|---|---|---|---|
| root (no container ancestor, the first under an area, or the first under an unpainted root) | its preset's | its preset's ladder padding | ladder |
| nested card | max(R_parent − p_parent, R_parent × k), k = `container-ratio` (0.4) | max(min(3u, p_parent), p_parent − 1u) × density | its padding |
| nested with `padding`, or a painted wrapper | as a nested card | ladder | ladder |
| unpainted wrapper | passes its parent through | 0, and no border | ladder |
| `ui-section` | c = `size`, default p | sits p − c in; a sized one has gap c; a `divided` one has 0 and its rows pad c, 3u·f above and below (`resolveSection`), with a 1px line between |
| area (panel, region, page) | 0 | its ladder padding; the chain restarts below it | ladder |

At u = 4.5 a card holding cards holding a card: 18 · 18 → 7.2 · 13.5 → 2.9 · 13.5. When a card is rounder than it is deep (`radius` above 1), the curve inside is concentric: R 40, p 12 → 28. A nested radius can fall below the control radius, so a button in a nested card can be rounder than the card; the padding keeps them apart. CSS reads the parent through depth-indexed variables (`--uc-r<n>`, `--uc-p<n>`, a rule per exact depth, up to 8; a deeper container repeats its parent's radius). An area inside the chain restarts it: the area sets `--uc-a<n>: 1` at every depth, and the first container below it reads its parent depth's flag and takes its own preset geometry as a root. An unpainted wrapper passes the flag on. A container that is not nested is exactly the level rule above.

### Panda tokens in u

Panda code uses the same unit. `spacing` and `sizes` keys are multiples of u (`p: '8'` is 8u, `gap: '0.5'` is 0.5u; keys 0, 0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24), and `radii` are u × corner scale (`sm` 1u, `md` 1.5u, `lg` 2u, `xl` 3u; `full` is a pill). The container ladder is named (`<level>` as in the table: `group`, `card-md`, `page`…): `pad.<level>` and `gap.<level>` are the theme's `pad-<level>` / `gap-<level>` in u, and `inset.<level>` is the padding inside a border, max(0, pad − B), the way containers use it. `page()` is `p: inset.page`, `gap: gap.page`. Panda declares token variables on `:root`, where they resolve with the root unit, so every element with `size` / `data-size` redeclares the u-based ones (`unitTokenVars()`), and a theme scope that sets `--ui-unit` or a ladder parameter on its own element includes `unitTokenCss()` (the jig canvas does). There is no fixed rem grid. `sizes` also has keywords: `full` (100%), `min`, `max`, `fit` and `prose` (65ch). A length that is not one of these tokens is a type error ([theming](theming.md#panda-configs)).

| level | element | padding p | gap | max radius | at u=4: pad / gap / radius |
|---|---|---|---|---|---|
| composite (control) | ui-listbox, ui-segmented, ui-toggle-group, select popup | 0.5u | 0.5u | 3u | 2 / 2 / 12 |
| group (wrapper) | `preset="group"` | 1u | 1u | 4u | 4 / 4 / 16 |
| collection (wrapper) | `preset="collection"` | 2u | 2u | 5u | 8 / 8 / 20 |
| card-xs (container) | `preset="card" padding="xs"` | 2u | 2u | 2u | 8 / 8 / 8 |
| card-sm (container) | `preset="card" padding="sm"` | 3u | 3u | 3u | 12 / 12 / 12 |
| card-md (container) | `preset="card"` (padding="md") | 4u | 4u | 4u | 16 / 16 / 16 |
| card-lg (container) | `preset="card" padding="lg"` | 6u | 6u | 6u | 24 / 24 / 24 |
| card-xl (container) | `preset="card" padding="xl"` | 8u | 8u | 8u | 32 / 32 / 32 |
| panel (area) | `preset="panel"` | 6u | 6u | 0 | 24 / 24 / 0 |
| region (area) | `preset="region"` | 8u | 8u | 0 | 32 / 32 / 0 |
| page (area) | `preset="page"`, `page()` pattern | 8u | 8u | 0 | 32 / 32 / 0 |

Example: `<ui-container preset="card" size="5" gap="2">` has 20px padding and 10px gaps. Containers use the inherited size, so one `size` on a panel compacts everything inside it. A group keeps its controls full height (10u around 8u controls). Layout containers are CSS only: they need no script. Their styles are slot recipes (`components/container/container.recipe.ts`, the composite in `components/recipe-parts.ts`), also emitted on the tags ([components](components.md#styles)).

### Composite detail

Options use the control anatomy with their inset reduced by the composite edge D = max(B, 0.5u): option inset Ic = max(B, u − D), option height 6u + 2Ic = 7u, so a one-row segmented control is always exactly 8u. Option radius = min(option/2, composite radius − D) = 2.5u at s = 1: the composite has the control radius and its options split the difference (the composite is exempt from radius ≤ padding). The popup sits 1u below its trigger.

### Choice cards

A radio or checkbox group with `variant="card"` makes each choice a card-md surface (`resolveChoiceCard`): padding 4u − B (× density), the card radius (padding × min(1, s), × `radius-card`), cards the collection gap apart, contents 1u apart; a 1px border-role stroke, checked a 2px primary stroke and the primary-subtle fill (inset shadows, no space).

### Attached (inset="none")

Listbox, segmented, toggle group, range and switch take `inset="none"`: attached, Differential Forms' zero-inset composite. The edge D is the border alone and the gap 0, so children touch the edge and each other; children lose their curvature (radius 0) and the first and last keep the container's outer corners (R − D), passed to the options as `--child-r` and `--c-ss | -se | -es | -ee` (`attachedComposite`, `recipe-parts.ts`). A 1px border-role divider (an inset shadow, no space) separates neighbours. The option inset grows to max(B, I − B), so one row stays the control height. A range thumb fills the track (4u, the track radius, offset ratio × (W − track)); a switch thumb fills its track inside the border (5u − 2B) and still travels 4u. `resolveComposite`, `resolveTrack` and `resolveChoice` take `inset: 'none'`.

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
