# Listbox, segmented, option

`ui-listbox`, `ui-segmented`, `ui-option`. API, defaults and avoidance guidance: [listbox.manifest.json](listbox.manifest.json) (`npm run registry -- component:listbox`). Examples: [listbox.examples.json](listbox.examples.json). Contract: [components.json](../../contracts/components.json).

## Intent

- `ui-listbox`: choose one value from a list that stays visible.
- `ui-segmented`: choose one of a few mutually exclusive views or modes.
- `ui-option`: present one choice inside a listbox, segmented control or select.

## Usage

```html
<ui-listbox label="Folder" name="folder"><ui-option value="inbox">Inbox<span slot="suffix">12</span></ui-option><ui-option>Sent</ui-option></ui-listbox>
<ui-segmented label="View" value="grid"><ui-option value="grid">Grid</ui-option><ui-option value="list">List</ui-option></ui-segmented>
```

Listbox and segmented are composites: 0.5u padding, options inset so a one-row segmented control is exactly 8u. The option uses the button construction pattern.

## Anatomy

Construction pattern (shared by every labelled component):

```
[leading icon] [prefix] [contents: the label] [suffix] [trailing icon]
```

Icons sit in 6u leading/trailing slots; prefix and suffix are short text adornments in the label color at 65%; empty parts are hidden. Text parts sit 1u apart, 1u beside a slot, and at the bare edge 2u (controls), 1u (tag, chip) or 0 (choices). Parts: [parts.json](../../contracts/parts.json).

## Keyboard

| Element | Keys | Action |
|---|---|---|
| `ui-listbox` | ArrowUp, ArrowDown (vertical) / ArrowLeft, ArrowRight (horizontal) | move and select |
| `ui-listbox` | Home, End | first / last enabled option |
| `ui-listbox` | printable characters | typeahead |
| `ui-segmented` | ArrowLeft, ArrowRight | move and select |
| `ui-segmented` | Home, End | first / last enabled option |
| `ui-segmented` | printable characters | typeahead |

## Geometry and appearance

Geometry families: `container`, `control` ([geometry-families.json](../../contracts/geometry-families.json), resolver `tokens/geometry/resolve.ts`, CSS `styles/geometry.ts`). Colors are Spectrum roles; states are keyed on ARIA and `data-*` ([states.json](../../contracts/states.json), `styles/defaults.ts`); motion in `styles/motion.ts`.

## Renderers and verification

- webComponent: completed (`./listbox.element.ts`)

Checks and their latest run: [verification/listbox.verification.json](verification/listbox.verification.json).
