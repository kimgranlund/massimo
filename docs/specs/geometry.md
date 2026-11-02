# Component geometry

Based on Differential Forms v0.2.2 (`mathematical-design-system` skill), adapted:
- **Size is the unit.** `size` (or `data-size`) sets u for an element and its subtree: 2, 2.25, 2.5, 3, 3.5, 4, 4.5, then every 0.5 up to 12. A control is 8u tall (16 to 96px). Default u comes from the theme `unit` (4 → 32px).
- **Slots.** Controls have `leading`, `contents` and `trailing` slots, each at least 6u square, inside 1u of padding.
- **Text** is 10px + u.

Design tokens: [geometry.dtcg.json](../../packages/ui-kit/tokens/dtcg/geometry.dtcg.json) (DTCG 2025.10; see [system](system.md#design-tokens-dtcg)).

Quick reference: [geometry.csv](../../packages/ui-kit/docs/geometry.csv), every formula with its value at each size (generated from the resolver: `npm run geometry:csv`; a test fails if it is stale).

Sources of truth, kept in agreement by tests:
- `packages/ui-kit/tokens/geometry/resolve.ts`: numerical reference (`resolveControl`, `resolveComposite`, `resolveField`, `resolveSelectTrigger`, `resolveIcon`).
- `packages/ui-kit/styles/geometry.ts`: the same formulas in CSS, computed per element from inherited inputs.
- `packages/ui-kit/styles/defaults.ts`: where each length applies; no numbers of its own.

## Inputs

| Input | Where | Values | Default |
|---|---|---|---|
| u | theme `--ui-unit`; `size` / `data-size` per subtree | 2, 2.25, 2.5, 3, 3.5, 4, 4.5, 5 … 12 (0.5 steps) | 4 |
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

## Choices, tracks, swatches, swiper

| | Formula | at u=4 |
|---|---|---|
| checkbox / radio box | 5u, in the 6u leading slot; label start padding u (1.5u from the box) | 20 |
| switch | 9u × 5u track, 4u thumb inset 0.5u, travels 4u | 36 × 20 |
| checkbox radius | u × s (radio and switch round) | 4 |
| range / progress | 4u box; the track fills it (radius min(3u × s, 2u)); range thumb 4u inside it, fill = ratio × (width − 4u) + 4u; min width 24u | 16 / 16 / 16 |
| swatch | 6u square, radius u × s; palette strip radius 2u × s, no gaps | 24 |
| swiper | paddles are 8u icon buttons inset 2u; dots 2u (active 4u) in 4u hit areas, gap u | |

## Containers

Every container has a padding level p and a max radius. Padding and gap are theme parameters per level (`pad-<level>`, `gap-<level>`, in u; the table shows their defaults); the max radius follows the padding (3u + p). The `gap` attribute overrides the gap on one element. The border lives inside the padding. Radius = min(max × corner scale, height/2); up to card the max is 3u + p, so corners stay concentric with a 3u control in the corner. Panel, region and page are square because they usually meet the viewport edge. Page is region spacing plus a centered max width (72rem; `page({ width, gap })` in Panda code, where `gap` is in units of u).

| level | element | padding p | gap | max radius | at u=4: pad / gap / radius |
|---|---|---|---|---|---|
| composite | ui-listbox, ui-segmented, select popup | 0.5u | 0.5u | 3.5u | 2 / 2 / 14 |
| group | ui-group | 1u | 1u | 4u | 4 / 4 / 16 |
| collection | ui-collection | 2u | 2u | 5u | 8 / 8 / 20 |
| tile | ui-tile | 3u | 3u | 6u | 12 / 12 / 24 |
| card | ui-card | 4u | 4u | 7u | 16 / 16 / 28 |
| panel | ui-panel | 6u | 6u | 0 | 24 / 24 / 0 |
| region | ui-region | 8u | 8u | 0 | 32 / 32 / 0 |
| page | ui-page, `page()` pattern | 8u | 8u | 0 | 32 / 32 / 0 |

Example: `<ui-card size="5" gap="2">` has 20px padding and 10px gaps. Containers use the inherited size, so one `size` on a panel compacts everything inside it. A group keeps its controls full height (10u around 8u controls). Layout containers are CSS only: they need no script.

### Composite detail

Options use the control anatomy with their inset reduced by the composite edge D = max(B, 0.5u): option inset Ic = max(B, u − D), option height 6u + 2Ic = 7u, so a one-row segmented control is always exactly 8u. Option radius = min(option/2, composite radius − D) = 3u, the control radius. The popup sits 1u below its trigger.

## Badge, tag, chip

Heights sit on a 12px base plus k·u, capped so a chip is never taller than a control and each level stays one u below the next.

| | Height | Text | Slots (u′ = height / 8) | at u = 3 / 4 / 5 |
|---|---|---|---|---|
| chip | min(12 + 3u, 8u) | 10 + u | chip − u′ | 21 / 24 / 27 |
| tag | min(12 + 2u, chip − u) | 10 + 0.5u | tag − u′ | 18 / 20 / 22 |
| badge | min(12 + u, tag − u) | 10 | badge − u′ | 15 / 16 / 17 |

The cap only bites below u = 2.5 (u = 2: 12 / 14 / 16). All three use the construction pattern with the label-wrapper padding system, measured in a local unit u′ = height / 8 (a control is 8u tall), so spacing is relative to each element's size: the host has max(0, 0.5u′ − B), slots are height − u′, labels carry 1u′ on both sides (beside a slot too) and text parts sit 0.5u′ apart. At u = 4: chip u′ = 3px, tag 2.5px, badge 2px. Text is single-line at line height 1.2 × font (capped at the slot); chip centers it with block padding (slot − line) / 2, tag and badge have no block padding; min width = height (a badge is never narrower than tall; a one-digit badge is a circle at default sizes); radius min(3u × s, h/2), so all three are pills at default. Icons use the control icon formulas against the element's own font and slot.

`<ui-badge>` and `<ui-tag>` are static labels. `<ui-chip>` is interactive: `selectable` toggles `aria-pressed`; `removable` adds a trailing ✕, and clicking it, Delete or Backspace fires a cancelable `remove` event (the chip then removes itself and focus moves to a neighbouring chip).

## Verification

- `npm test`: the size table, slot and contents padding, icon formulas and caps, border conservation, composite growth, Q=0, slot sorting.
- Browser: `npm run studio`, open `/geometry-check.html`. It renders 44 configurations (22 sizes × 2 borders, rotating icon sizes, a gap override on every third) and compares 102 measured lengths each (4488 in total), including type roles with the resolver; radii are compared as painted (min(declared, height/2)); `"fails": []` means CSS and resolver agree.

Browsers snap fractional borders to device pixels, so use whole-pixel borders. Not covered yet: multiline fields, chips inside inputs, table cells.
