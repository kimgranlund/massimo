# Component geometry

Adapted from Differential Forms v0.2.2 (`mathematical-design-system` skill). One deliberate change: Differential Forms' density axis is merged into **size** (`sm`/`md`/`lg` = compact/default/loose). Size changes inset and gap only; slot, text and label edge stay fixed.

Sources of truth, kept in agreement by tests:
- `tokens/geometry/resolve.ts`: numerical reference (`resolveControl`, `resolveComposite`, `resolveSelectTrigger`, `resolveLabelEdges`).
- `styles/geometry.ts`: the same formulas in CSS, computed at each element from inherited inputs.
- `styles/defaults.ts`: where each length applies; it contains no numbers of its own.

## Inputs

| Input | Where | Range | Default |
|---|---|---|---|
| u (unit) | theme param `--ui-unit` | 3..6px | 4 |
| B (border) | theme param `--ui-border` | 0..u/2 (clamped in CSS) | 1 |
| L (label edge) | theme param `--ui-label-edge` | 0..3u | 1.5u |
| curvature scale | theme param `--ui-radius-scale` | 0..3 | 1 (soft = 3u) |
| size | `size` or `data-size` attribute, any element, inherited | sm, md, lg | md |
| Q (composite inset) | `inset` attribute on listbox/segmented/select | 0, 0.5, 1, 1.5 (×u) | 0.5 |

Theme params live on `<html>`; size and inset work on any subtree.

## Control family: ui-button, ui-input, ui-select trigger

| | Formula | sm / md / lg at u=4 |
|---|---|---|
| slot S | 6u | 24 |
| inset I | [0.5, 1, 2]u | 2 / 4 / 8 |
| gap G | [0, 1, 2]u | 0 / 4 / 8 |
| height H | S + 2I (border included, never added) | 28 / 32 / 40 |
| padding | I − B | |
| text | 2u + 6px, line height 5u | 14 / 20 |
| icon | min(4u, S − 2B) | 16 |
| radius | min(3u × scale, H/2) | 12 |

Label edges add to padding on exposed sides. Button and input with no slots: L both sides. Select trigger: L at the start, 0 beside the trailing chevron slot (S × S). Buttons and options double the opposite edge when exactly one slot is present; text fields do not.

## Composite family: ui-listbox, ui-segmented, select popup

| | Formula | default (md, B=1, Q=0.5u) |
|---|---|---|
| edge distance D | max(B, Q) | 2 |
| parent padding | D − B | 1 |
| gap | Q | 2 |
| child inset Ic | max(B, I − D) | 2 |
| child height | S + 2Ic | 28 |
| one-row height | child + 2D | 32 (= control height) |
| parent radius | segmented: min(3u × scale, row/2); list and popup: 3u × scale | 12 |
| child radius | min(child/2, parent − D); 0 when Q = 0 | 10 |

When the border leaves no room (I − D < B) the composite grows rather than shrinking the slot: `sm` with B=2 and Q=1.5u gives 28px options in a 40px row. `inset="0"` makes an attached group: no gap, square options inside the rounded outline. Popup offset from its trigger is 1u.

## Verification

- `npm test` (resolver golden values, border conservation, growth, Q=0, label edges, theme-parameter integrity).
- Browser: run the studio (`npm run studio`) and open `/geometry-check.html`. It renders 12 configurations (3 sizes × 3 borders, plus growth, Q=0 and Q=1u) and compares 16 measured lengths each against the resolver; `"fails": []` means CSS and resolver agree.

Not covered yet: icon slots inside buttons and options, chips/badges, cards and collections, multiline fields.
