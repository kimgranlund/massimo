# Component geometry

Based on Differential Forms v0.2.2 (`mathematical-design-system` skill), adapted:
- **Size is the unit.** `size="2|2.25|2.5|3|3.5|4|4.5"` (or `data-size`) sets u for an element and its subtree. A control is 8u tall: 16, 18, 20, 24, 28, 32, 36px. Default u comes from the theme `unit` (4 → 32px).
- **Slots.** Controls have `leading`, `contents` and `trailing` slots, each at least 6u square, inside 1u of padding.
- **Text** is 10px + u.

Quick reference: [geometry.csv](geometry.csv), every formula with its value at each size (generated from the resolver: `npm run geometry:csv`; a test fails if it is stale).

Sources of truth, kept in agreement by tests:
- `tokens/geometry/resolve.ts`: numerical reference (`resolveControl`, `resolveComposite`, `resolveField`, `resolveSelectTrigger`, `resolveIcon`).
- `styles/geometry.ts`: the same formulas in CSS, computed per element from inherited inputs.
- `styles/defaults.ts`: where each length applies; no numbers of its own.

## Inputs

| Input | Where | Values | Default |
|---|---|---|---|
| u | theme `--ui-unit`; `size` / `data-size` per subtree | 2, 2.25, 2.5, 3, 3.5, 4, 4.5 | 4 |
| B (border) | theme `--ui-border` | whole px, 0..u/2 (clamped) | 1 |
| curvature scale | theme `--ui-radius-scale` | 0..3 | 1 (soft = 3u) |
| icon size | `icon-size` / `data-icon-size`, any element, inherited | sm, md, lg, fill | md |
| Q (composite inset) | `inset` on listbox/segmented/select | 0, 0.5, 1, 1.5 (×u) | 0.5 |

## Control: ui-button (and the shape ui-input / ui-select share)

| | Formula | at u=4 |
|---|---|---|
| height | 8u | 32 |
| padding | 1u − B (the border lives inside the 1u) | 4 at B=0 |
| slots | leading, contents, trailing: min 6u × 6u; empty slots are hidden | 24 |
| contents padding | 1u inline, 0.75u block, line height 4.5u | 4 / 3 / 18 |
| font | 10px + u | 14 |
| icon sm / md / lg | font − 0.5u / font + 0.5u / font + 1.5u, capped at 6u | 12 / 16 / 20 |
| icon fill | the whole 6u slot, object-fit cover, centered; radius = control radius − u | 24 |
| radius | min(3u × scale, 4u) | 12 |

| u | 2 | 2.25 | 2.5 | 3 | 3.5 | 4 | 4.5 |
|---|---|---|---|---|---|---|---|
| height | 16 | 18 | 20 | 24 | 28 | 32 | 36 |
| font | 12 | 12.25 | 12.5 | 13 | 13.5 | 14 | 14.5 |

Icons capped by the slot: `md` below u≈2.2 and `lg` below u≈2.9 (at u=2: md and lg are 12px, the slot size), so a control never grows past 8u.

Usage: `<ui-button><svg slot="leading">…</svg>Save</ui-button>`. Anything with `slot="leading"`/`"trailing"` goes in that slot; everything else is contents. An icon-only button is an 8u square (give it an `aria-label`). React: `<Button leading={…} trailing={…} iconSize="lg" size={3}>`.

Text fields put their text where button contents sit (padding + 1u each side). The select trigger is contents (value) plus the chevron in a trailing 6u slot.

## Composite: ui-listbox, ui-segmented, select popup

Options use the control anatomy (same slots) with an inset reduced by the parent's edge distance.

| | Formula | default (u=4, B=1, Q=0.5u) |
|---|---|---|
| edge distance D | max(B, Q) | 2 |
| parent padding | D − B | 1 |
| gap | Q | 2 |
| option inset Ic | max(B, u − D) | 2 |
| option height | 6u + 2Ic | 28 |
| one-row height | option + 2D | 32 (= control) |
| parent radius | segmented: min(3u × scale, row/2); list and popup: 3u × scale | 12 |
| option radius | min(option/2, parent − D); 0 when Q = 0 | 10 |

When the border leaves no room the composite grows rather than shrinking the slot (u=3, B=1, Q=1.5u: 20px options in a 29px row). `inset="0"` is an attached group with square options. The popup sits 1u below its trigger.

## Verification

- `npm test`: the size table, slot and contents padding, icon formulas and caps, border conservation, composite growth, Q=0, slot sorting.
- Browser: `npm run studio`, open `/geometry-check.html`. It renders 17 configurations (7 sizes × 2 borders with rotating icon sizes, plus growth, Q=0, Q=1u) and compares 19 measured lengths each with the resolver; `"fails": []` means CSS and resolver agree.

Browsers snap fractional borders to device pixels, so use whole-pixel borders. Not covered yet: chips/badges, cards, collections, multiline fields.
