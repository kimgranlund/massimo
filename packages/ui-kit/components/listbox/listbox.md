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

### Both forms

The options are already parts: `ui-option` children of a `ui-listbox` or `ui-segmented`, each with the construction pattern, which may also be written as `[data-part]` spans ([components spec](../../../../docs/specs/components.md#composition)):

```html
<ui-listbox label="Folder" value="inbox">
  <ui-option value="inbox"><span data-part="leading"><i name="tray"></i></span><span data-part="contents">Inbox</span><span data-part="suffix">12</span></ui-option>
  <ui-option value="sent"><span data-part="contents">Sent</span></ui-option>
</ui-listbox>
```

```tsx
<Listbox.Root label="Folder" defaultValue="inbox">
  <Listbox.Item value="inbox" leading={<i name="tray" />} suffix="12"><Listbox.ItemText>Inbox</Listbox.ItemText><Listbox.ItemIndicator /></Listbox.Item>
  <Listbox.Item value="sent">Sent</Listbox.Item>
</Listbox.Root>
<Segmented.Root label="View" defaultValue="grid"><Segmented.Item value="grid">Grid</Segmented.Item></Segmented.Root>
```

`Listbox`, `Segmented` and `Option` are the same components as `.Root` and `.Item`. Items are direct children of the Root, which reads their value, label and disabled. `ItemText` is the contents part; `ItemIndicator` a check in the trailing slot of the selected item (opt-in: the presets draw none). Every part takes `render` and `className` (a string or a function of the state: `selected`, `highlighted`, `disabled`, …).

Construction pattern (shared by every labelled component):

```
[leading icon] [prefix] [contents: the label] [suffix] [trailing icon]
```

Icons sit in leading/trailing slots (6u on controls); prefix and suffix are short text adornments in the label color at 65%; empty parts are hidden. Label-wrapper padding: controls 2u at a bare edge, 1u beside a slot, text parts 1u apart; badge, tag and chip 1u′ on both sides (u′ = their height / 8); choices 1u after the indicator and 0 at the end. Parts: [parts.json](../../contracts/parts.json).

## Keyboard

| Element | Keys | Action |
|---|---|---|
| `ui-listbox` | ArrowUp, ArrowDown (vertical) / ArrowLeft, ArrowRight (horizontal) | move and select |
| `ui-listbox` | Home, End | first / last enabled option |
| `ui-listbox` | printable characters | typeahead |
| `ui-segmented` | ArrowLeft, ArrowRight | move and select |
| `ui-segmented` | Home, End | first / last enabled option |
| `ui-segmented` | printable characters | typeahead |

## State attributes

Contract: [states.json](../../contracts/states.json); names follow [Base UI](https://base-ui.com); ARIA stays for semantics. Both renderers set the same attributes on the same elements; style with the conditions (`_checked`, `_invalid`, …), not ARIA.

| Element | Attributes |
|---|---|
| `ui-listbox` / Listbox, `ui-segmented` / Segmented | `data-orientation`; field state: `data-disabled`, `data-required`, `data-valid` / `data-invalid` (once shown: after blur or a blocked submit; an author error at once), `data-dirty`, `data-touched`, `data-filled`, `data-focused` |
| `ui-option` / Option | `data-selected`, `data-highlighted` (the active option while the list has focus; was `data-active`), `data-disabled` |

## Events and values

Base UI's props and event details ([components spec](../../../../docs/specs/components.md#events-and-values)).

| Renderer | Value | Events / callbacks |
|---|---|---|
| `ui-listbox`, `ui-segmented` | `value`, `defaultValue` (`default-value`) | `change` and `input` (same moment): `detail { value, reason, event }`, reason `item-press` (pointer) or `keyboard` (arrows, Home / End, typeahead) |
| React Listbox, Segmented | `value`, `defaultValue` | `onValueChange(value, { reason, event })`, the same reasons |

## Geometry and appearance

Geometry families: `container`, `control` ([geometry-families.json](../../contracts/geometry-families.json), resolver `tokens/geometry/resolve.ts`, CSS `styles/geometry.ts`). Styles: the slot recipes in [listbox.recipe.ts](listbox.recipe.ts) (Panda `theme.slotRecipes`, one class per part, variants for finite attributes), applied by the web component and the React renderer alike; lengths read the geometry variables, colors are Spectrum roles, states use the shared conditions ([states.json](../../contracts/states.json), `styles/conditions.ts`), and motion and forced colors live in the same recipe.

**Attached** (`inset="none"`, React `inset="none"`): the list or segmented control keeps its own radius, but its edge is the border alone, options touch the edge and each other (no gap) and lose their curvature; the first and last keep the container's outer corners (R − D) and a 1px border-role divider separates neighbours. One segmented row is still the control height. Use it for a stacked choice list (settings rows, a plan picker inside a card) where rows read as one surface.

## Renderers and verification

- webComponent: completed (`./listbox.element.ts`)
- react: completed (`./listbox.react.tsx`)

React props: `npm run registry -- --assembly component:listbox` (under `react`).

Checks and their latest run: [verification/listbox.verification.json](verification/listbox.verification.json).
