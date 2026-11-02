# Component geometry

Based on Differential Forms v0.2.2 (`mathematical-design-system` skill), adapted:
- **Size is the unit.** `size` (or `data-size`) sets u for an element and its subtree: 2, 2.25, 2.5, 3, 3.5, 4, 4.5, then every 0.5 up to 12. A control is 8u tall (16 to 96px). Default u comes from the theme `unit` (4 → 32px).
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
| u | theme `--ui-unit`; `size` / `data-size` per subtree | 2, 2.25, 2.5, 3, 3.5, 4, 4.5, 5 … 12 (0.5 steps) | 4 |
| B (border) | theme `--ui-border` | whole px, 0..u/2 (clamped) | 1 |
| curvature scale | theme `--ui-radius-scale` | 0..3 | 1 (soft = 3u) |
| icon size | `icon-size` / `data-icon-size`, any element, inherited | sm, md, lg, fill | md |
| gap | `gap` on a container or composite; that element only | 0 … 8 (0.5 steps, ×u) | = the padding level |

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

## Containers

Every container has a padding level p and a max radius. Gap = padding unless `gap` overrides it. The border lives inside the padding. Radius = min(max × corner scale, height/2); up to card the max is 3u + p, so corners stay concentric with a 3u control in the corner. Panel, region and page are square because they usually meet the viewport edge. Page is region spacing plus a centered max width (72rem; `page({ width, gap })` in Panda code, where `gap` is in units of u).

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

| | Height | Text | Slots | at u = 3 / 4 / 5 |
|---|---|---|---|---|
| chip | min(12 + 3u, 8u) | 10 + u | chip − u (= tag) | 21 / 24 / 27 |
| tag | min(12 + 2u, chip − u) | 10 + 0.5u | tag − u (= badge) | 18 / 20 / 22 |
| badge | min(12 + u, tag − u) | 10 | none | 15 / 16 / 17 |

The cap only bites below u = 2.5 (u = 2: 12 / 14 / 16). Padding is max(0, 0.5u − B); tag and chip contents get 1u inline padding like control contents; min width = height (a single character is a circle); radius min(3u × s, h/2), so all three are pills at default. Icons use the control icon formulas against the element's own font and slot.

`<ui-badge>` is static text. `<ui-tag>` is a static label with slots. `<ui-chip>` is interactive: `selectable` toggles `aria-pressed`; `removable` adds a trailing ✕, and clicking it, Delete or Backspace fires a cancelable `remove` event (the chip then removes itself and focus moves to a neighbouring chip).

## Verification

- `npm test`: the size table, slot and contents padding, icon formulas and caps, border conservation, composite growth, Q=0, slot sorting.
- Browser: `npm run studio`, open `/geometry-check.html`. It renders 44 configurations (22 sizes × 2 borders, rotating icon sizes, a gap override on every third) and compares 55 measured lengths each (2420 in total) with the resolver; radii are compared as painted (min(declared, height/2)); `"fails": []` means CSS and resolver agree.

Browsers snap fractional borders to device pixels, so use whole-pixel borders. Not covered yet: multiline fields, chips inside inputs, table cells.
