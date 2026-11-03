# Combobox

`ui-combobox`. API, defaults and avoidance guidance: [combobox.manifest.json](combobox.manifest.json) (`npm run registry -- component:combobox`). Examples: [combobox.examples.json](combobox.examples.json). Contract: [components.json](../../contracts/components.json).

## Intent

- `ui-combobox`: choose one or several values from a long list by typing to filter it ([Base UI Combobox](https://base-ui.com/react/components/combobox)).

For free text with suggestions, where any typed value is kept, use `ui-autocomplete`; for a short list with no typing, `ui-select`.

## Usage

```html
<ui-combobox label="Country" name="country" placeholder="Search…">
  <ui-option value="ca">Canada</ui-option>
  <ui-option value="fi">Finland</ui-option>
  <ui-option value="jp"><i slot="leading" name="flag"></i>Japan</ui-option>
</ui-combobox>
<ui-combobox label="Labels" multiple value="bug,docs">
  <ui-option value="bug">Bug</ui-option><ui-option value="docs">Docs</ui-option><ui-option value="ui">UI</ui-option>
</ui-combobox>
```

Typing filters: an option shows while its label contains the text, ignoring case and accents (Base UI's default filter). Single selection writes the chosen label into the input; closing without a choice restores it; emptying the input clears the value. `multiple` keeps a chip per value before the input (a press toggles an option and the popup stays open; Backspace in the empty input removes the last chip). The trigger opens the full list; the clear button removes the value and the text. While nothing matches, the popup shows `empty-text` ("No results." by default; empty hides the popup instead).

`hide-label` keeps the label as the accessible name without drawing it (React: `hideLabel`).

## Anatomy

### Both forms

The one-element form (`<ui-combobox label …>`, `<Combobox label leading …>`) is a preset; the parts can also be written out (Base UI Combobox anatomy, [components spec](../../../../docs/specs/components.md#composition)). Both render the same DOM, recipe classes and data-*.

```html
<ui-combobox name="city">
  <span data-part="label">City</span>
  <div data-part="control">
    <span data-part="leading"><i name="map-pin"></i></span>
    <span data-part="trigger"><i name="caret-up-down"></i></span>   <!-- replaces the caret -->
  </div>
  <div data-part="popup">
    <div data-part="list"><ui-option value="osl">Oslo</ui-option><ui-option value="rig">Riga</ui-option></div>
    <div data-part="empty">No city by that name.</div>              <!-- seeds empty-text -->
  </div>
  <span data-part="description">Where the event takes place.</span>
</ui-combobox>
```

```tsx
<Combobox.Root name="city" multiple defaultValue={['osl']}>
  <Combobox.Label>City</Combobox.Label>
  <Combobox.Control leading={<i name="map-pin" />}>
    <Combobox.Chips />
    <Combobox.Input placeholder="Search…" />
    <Combobox.Clear />
    <Combobox.Trigger />
  </Combobox.Control>
  <Combobox.Positioner>
    <Combobox.Popup>
      <Combobox.List>
        <Combobox.Item value="osl"><Combobox.ItemText>Oslo</Combobox.ItemText><Combobox.ItemIndicator /></Combobox.Item>
        <Combobox.Item value="rig">Riga</Combobox.Item>
      </Combobox.List>
      <Combobox.Empty>No city by that name.</Combobox.Empty>
    </Combobox.Popup>
  </Combobox.Positioner>
  <Combobox.Description>Where the event takes place.</Combobox.Description>
</Combobox.Root>
```

Web component: each authored `[data-part]` is adopted onto the generated part (author attributes and classes; adornment, clear and trigger content; the label, description, error and empty text seed `label`, `description`, `error` and `empty-text`); missing parts are generated; the chips are generated from the value. React: `Combobox.Root` reads its items (value, label text, disabled) from the parts tree; `Combobox.Control` (ours, the input row) renders Chips, Input, Clear and Trigger when given no children, and its `leading`, `prefix` and `suffix` props are the adornments; `Combobox.Chips` renders a `Combobox.Chip` per value (label and `Combobox.ChipRemove`); `Combobox.Positioner` renders no element (the popup is its own positioner, as on the web component). Every other part takes `render` and `className` (a string or a function of the state).

The input row follows the construction pattern, as the select trigger:

```
[leading] [prefix] [chips] [input] [suffix] [clear] [trigger]
```

- `part:combobox-control` `:scope > [data-part=control]`: the input row; the popup's anchor. A press on its padding focuses the input.
- `part:combobox-chips` `… > [data-part=chips]`: Combobox.Chips, one chip per value (multiple), `display: contents`; each chip (`[data-part=chip]`, `data-value`) holds its label (`contents`) and a `chip-remove` press button.
- `part:combobox-input` `… > [data-part=input]`: Combobox.Input, the contenteditable text (role=combobox); React: a native `<input>`.
- `part:combobox-clear` `… > [data-part=clear]`: Combobox.Clear (x); hidden while there is no value and no text.
- `part:combobox-trigger` `… > [data-part=trigger]`: Combobox.Trigger (caret-down, turned while open).
- `part:combobox-popup` `:scope > [data-part=popup]`: Combobox.Popup, the [popover] listbox 1u below the row.
- `part:combobox-list` `… > [data-part=list]`: Combobox.List, the options' parent (`display: contents`).
- `part:combobox-empty` `… > [data-part=empty]`: Combobox.Empty, the empty text (role=status) while nothing matches.

Clear, trigger and chip-remove are press buttons, not tab stops: focus stays in the input.

## Keyboard

| Element | Keys | Action |
|---|---|---|
| input | printable characters | edit the text: filter and open |
| input | ArrowDown, ArrowUp | open (closed; Alt+ArrowDown without a highlight); move the highlight over visible, enabled options (open) |
| input | PageDown, PageUp | highlight the last / first visible option |
| input | Enter | commit the highlighted option |
| input | Escape, Alt+ArrowUp | close without committing |
| input | Tab | close and move focus |
| input | Backspace (empty, multiple) | remove the last chip |
| input | Home, End | move the caret |

## State attributes

Contract: [states.json](../../contracts/states.json); names follow Base UI Combobox; ARIA stays for semantics.

| Element | Attributes |
|---|---|
| host | field state: `data-disabled`, `data-readonly`, `data-required`, `data-valid` / `data-invalid`, `data-dirty`, `data-touched`, `data-filled`, `data-focused` |
| input | `data-popup-open`, `data-list-empty` (nothing matches), `data-disabled`, `data-readonly` |
| trigger | `data-popup-open`, `data-pressed` while open, `data-disabled` |
| clear, chip | `data-disabled` |
| popup | `data-open` / `data-closed`; while open `data-side`, `data-align`; `data-empty` |
| list | `data-empty` |
| option (item) | `data-selected`, `data-highlighted`, `data-disabled` |

## Popup variables

The popup is the select's floating layer ([select guide](../select/select.md#popup-variables)): anchored below the input row (`--ui-combobox-control`, scoped per combobox), flipped above when there is no room, at least as wide as the row (`--anchor-width`), as tall as the space allows (`--available-height`); the script positioner where anchor positioning is missing. An outside press closes it (`outside-press`); Escape, Tab and blur stay with the input.

## Events and values

| Renderer | Value | Text | Events / callbacks |
|---|---|---|---|
| `ui-combobox` | `value` (multiple: comma-separated), `default-value` | `input-value` | `change` and `input` `{ value, reason, event }` (value `string[]` with multiple; reason `item-press`, `clear-press`, `chip-remove-press`, `input-clear`, `keyboard`); `inputvaluechange` `{ value, reason, event }` (`input-change`, `input-clear`, `item-press`, `clear-press`); `openchange` (cancelable) `{ open, reason, event }` (`input-change`, `list-navigation`, `trigger-press`, `item-press`, `outside-press`, `escape-key`, `focus-out`) |
| React Combobox | `value` / `defaultValue` (`string`, or `string[]` with `multiple`) | `inputValue` / `defaultInputValue` | `onValueChange(value, details)`, `onInputValueChange(text, details)`, `onOpenChange(open, details)`; `name` adds one hidden input per value |

The form value is the selected value; with `multiple` and a `name`, one entry per value. `required` fails with no value.

## Geometry and appearance

Geometry family `field` (`resolveCombobox`, [geometry-families.json](../../contracts/geometry-families.json)): the row is the select trigger (8u, pad u − B); the input text 2u from a bare edge, 1u from a slot, 0.5u from text and from the last chip's gap; clear and trigger are 6u slots with sm icons; chips are 6u tall, radius min(3u, control radius − u), the label 1u in, a 6u remove square, 0.5u apart, and the row wraps onto lines 0.5u apart (8u + 6.5u per extra line). The popup is the composite (edge 0.5u, 7u options); the empty text sits at an option label's inset (Ic + 2u). Chips are `bg.control`; the popup `bg.overlay`. Styles: [combobox.recipe.ts](combobox.recipe.ts).

## Renderers and verification

- webComponent: completed (`./combobox.element.ts`)
- react: completed (`./combobox.react.tsx`)

React props: `npm run registry -- --assembly component:combobox` (under `react`).

Checks and their latest run: [verification/combobox.verification.json](verification/combobox.verification.json).
