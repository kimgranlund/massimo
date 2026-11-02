# Badge, tag, chip

`ui-badge`, `ui-tag`, `ui-chip`. API, defaults and avoidance guidance: [btg.manifest.json](btg.manifest.json) (`npm run registry -- component:chip`). Examples: [btg.examples.json](btg.examples.json). Contract: [components.json](../../contracts/components.json).

## Intent

- `ui-badge`: show a short status or a count.
- `ui-tag`: label an item with a category or attribute.
- `ui-chip`: toggle a filter on or off when selectable; remove a value from a set when removable; invoke a small action.

## Usage

```html
<ui-badge>3</ui-badge>
<ui-badge><span slot="prefix">+</span>12</ui-badge>
<ui-tag><i slot="leading" name="tag"></i>Size<span slot="suffix">M</span></ui-tag>
<ui-chip selectable>Unread<span slot="suffix">4</span></ui-chip>
<ui-chip removable>Remote</ui-chip>
```

Heights step 12px + k·u (badge 1, tag 2, chip 3), capped below the control height. All three use the label-wrapper padding system in a local unit u′ = height / 8, so spacing is relative to each element's size: host 0.5u′ − B, slots height − u′, labels 1u′ on both sides, text parts 0.5u′ apart. Radius is concentric with the slot: (0.5u′ + slot / 3) × corner radius, a pill at height / 2.

## Anatomy

Construction pattern (shared by every labelled component):

```
[leading icon] [prefix] [contents: the label] [suffix] [trailing icon]
```

Icons sit in leading/trailing slots (6u on controls); prefix and suffix are short text adornments in the label color at 65%; empty parts are hidden. Label-wrapper padding: controls 2u at a bare edge, 1u beside a slot, text parts 1u apart; badge, tag and chip 1u′ on both sides (u′ = their height / 8); choices 1u after the indicator and 0 at the end. Parts: [parts.json](../../contracts/parts.json).

- `part:chip-remove` `:scope > [data-part=trailing] > [data-remove]`: The x icon added by removable: a click target inside the chip, not a separate tab stop.

## Keyboard

| Element | Keys | Action |
|---|---|---|
| `ui-chip` | Enter, Space | activate (toggle when selectable) |
| `ui-chip` | Delete, Backspace | remove (removable) |

## Geometry and appearance

Geometry families: `btg` ([geometry-families.json](../../contracts/geometry-families.json), resolver `tokens/geometry/resolve.ts`, CSS `styles/geometry.ts`). Colors are Spectrum roles; states are keyed on ARIA and `data-*` ([states.json](../../contracts/states.json), `styles/defaults.ts`); motion in `styles/motion.ts`.

## Renderers and verification

- webComponent: completed (`./btg.element.ts`)

Checks and their latest run: [verification/btg.verification.json](verification/btg.verification.json).
