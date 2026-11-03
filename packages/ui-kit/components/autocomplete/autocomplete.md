# Autocomplete

`ui-autocomplete`. API, defaults and avoidance guidance: [autocomplete.manifest.json](autocomplete.manifest.json) (`npm run registry -- component:autocomplete`). Examples: [autocomplete.examples.json](autocomplete.examples.json). Contract: [components.json](../../contracts/components.json).

## Intent

- `ui-autocomplete`: enter free text with suggestions from a list, optionally completed inline ([Base UI Autocomplete](https://base-ui.com/react/components/autocomplete)).

The value is whatever is typed. When the value must be one of the options, use `ui-combobox`; it shares this component's machinery and recipe (`ui-autocomplete` extends `UICombobox`).

## Usage

```html
<ui-autocomplete label="City" name="city" placeholder="Where to?">
  <ui-option>Oslo</ui-option><ui-option>Osaka</ui-option><ui-option>Ottawa</ui-option><ui-option>Paris</ui-option>
</ui-autocomplete>
<ui-autocomplete label="Command" mode="both" show-trigger>
  <i slot="leading" name="terminal"></i>
  <ui-option>build</ui-option><ui-option>bench</ui-option><ui-option>check</ui-option>
</ui-autocomplete>
```

`mode` (Base UI): `list` (default) filters the suggestions by the text (contains, case- and accent-insensitive); `both` also completes inline; `inline` completes without filtering; `none` does neither. Inline completion follows typing at the end: the input shows the first suggestion that starts with the text, its rest selected, so the next key replaces it and Backspace removes it; arrow keys write the highlighted suggestion into the input. A press or Enter on a highlighted suggestion writes its label and closes; Enter with none highlighted closes the popup and submits the form, as from a text field. `show-trigger` adds the caret that opens every suggestion; the clear button shows while there is text. With no `empty-text` (the default) the popup hides while nothing matches.

## Anatomy

### Both forms

The one-element form (`<ui-autocomplete label …>`, `<Autocomplete label leading …>`) is a preset; the parts can also be written out. Both render the same DOM, recipe classes and data-*.

```html
<ui-autocomplete name="tag" mode="both">
  <span data-part="label">Tag</span>
  <div data-part="control"><span data-part="leading"><i name="tag"></i></span></div>
  <div data-part="popup">
    <div data-part="list"><ui-option>design</ui-option><ui-option>docs</ui-option></div>
    <div data-part="empty">A new tag.</div>
  </div>
</ui-autocomplete>
```

```tsx
<Autocomplete.Root name="tag" mode="both">
  <Autocomplete.Label>Tag</Autocomplete.Label>
  <Autocomplete.Control leading={<i name="tag" />}>
    <Autocomplete.Input placeholder="Type a tag" />
    <Autocomplete.Clear />
  </Autocomplete.Control>
  <Autocomplete.Positioner>
    <Autocomplete.Popup>
      <Autocomplete.List>
        <Autocomplete.Item value="design">design</Autocomplete.Item>
        <Autocomplete.Item value="docs">docs</Autocomplete.Item>
      </Autocomplete.List>
      <Autocomplete.Empty>A new tag.</Autocomplete.Empty>
    </Autocomplete.Popup>
  </Autocomplete.Positioner>
</Autocomplete.Root>
```

The parts are the Combobox's ([combobox guide](../combobox/combobox.md#anatomy)) without chips: `Autocomplete.Root` is `Combobox.Root` with free text and the autocomplete recipe; `Autocomplete.Control` without children renders Input and Clear (add `Autocomplete.Trigger` for the caret).

```
[leading] [prefix] [input] [suffix] [clear] [trigger]
```

- `part:autocomplete-control` `:scope > [data-part=control]`: the input row; the popup's anchor.
- `part:autocomplete-input` `… > [data-part=input]`: the contenteditable text (role=combobox, `aria-autocomplete` = mode); React: a native `<input>`.
- `part:autocomplete-clear` `… > [data-part=clear]`: empties the text; hidden while it is empty.
- `part:autocomplete-trigger` `… > [data-part=trigger]`: opens every suggestion; hidden unless `show-trigger`.
- `part:autocomplete-popup`, `part:autocomplete-list`, `part:autocomplete-empty`: the popup listbox, the suggestions' parent and the empty text.

## Keyboard

| Element | Keys | Action |
|---|---|---|
| input | printable characters | edit the text: filter, complete inline, open |
| input | ArrowDown, ArrowUp | open; move the highlight (mode both / inline: the input shows it) |
| input | Enter | write the highlighted suggestion and close; none highlighted: close and submit |
| input | Escape, Alt+ArrowUp | close |
| input | Tab | close and move focus |
| input | Home, End | move the caret |

## State attributes

The combobox's names ([states.json](../../contracts/states.json)): host field state; input `data-popup-open`, `data-list-empty`, `data-disabled`, `data-readonly`; trigger `data-popup-open`, `data-pressed`, `data-disabled`; clear `data-disabled`; popup `data-open` / `data-closed`, `data-side`, `data-align`, `data-empty`; list `data-empty`; suggestions `data-highlighted`, `data-disabled` (never `data-selected`).

## Events and values

| Renderer | Value | Events / callbacks |
|---|---|---|
| `ui-autocomplete` | `value` (the text), `default-value` | `input` `{ value, reason, event }` on every change (`input-change`, `input-clear`, `item-press`, `clear-press`, `keyboard`); `change` on a chosen suggestion, the clear button or blur with a new text (`item-press`, `clear-press`, `focus-out`); `openchange` (cancelable) `{ open, reason, event }` |
| React Autocomplete | `value` / `defaultValue` (string) | `onValueChange(text, details)` on every change; `onOpenChange(open, details)`; `name` adds a hidden input |

## Geometry and appearance

Geometry family `field` (`resolveCombobox`): the combobox row without chips; without the trigger the text ends 1u before the clear slot, 2u from a bare edge. The popup is the composite floating layer. Styles: the `autocomplete` recipe in [combobox.recipe.ts](../combobox/combobox.recipe.ts) (the combobox's slots without chips).

## Renderers and verification

- webComponent: completed (`./autocomplete.element.ts`)
- react: completed (`./autocomplete.react.tsx`)

React props: `npm run registry -- --assembly component:autocomplete` (under `react`).

Checks and their latest run: [verification/autocomplete.verification.json](verification/autocomplete.verification.json).
