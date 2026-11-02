# Select

`ui-select`. API, defaults and avoidance guidance: [select.manifest.json](select.manifest.json) (`npm run registry -- component:select`). Examples: [select.examples.json](select.examples.json). Contract: [components.json](../../contracts/components.json).

## Intent

- `ui-select`: choose one value from a list of options that opens on demand.

## Usage

```html
<ui-select label="Role" name="role" required>
  <ui-option value="design">Designer</ui-option>
  <ui-option value="eng"><i slot="leading" name="code"></i>Engineer</ui-option>
</ui-select>
<ui-select label="Sort"><span slot="prefix">By</span><ui-option>Name</ui-option><ui-option>Date</ui-option></ui-select>
```

The trigger shows the selected option's text (icons and adornments excluded) or the placeholder.

`hide-label` keeps the label as the accessible name without drawing it (React: `<Select hideLabel />`), for layouts that show the name elsewhere, such as an inspector row. Never drop `label` instead: the control would have no name.

## Anatomy

### Both forms

The one-element form (`<ui-select label …>`, `<Select label leading …>`) is a preset; the parts can also be written out (Base UI Select anatomy, [components spec](../../../../docs/specs/components.md#composition)). Both render the same DOM, recipe classes and data-*.

```html
<ui-select name="sort">
  <span data-part="label">Sort</span>
  <div data-part="trigger">
    <span data-part="leading"><i name="sort-ascending"></i></span>
    <span data-part="value">Choose…</span>                <!-- text: the placeholder -->
    <span data-part="icon"><i name="caret-up-down"></i></span>  <!-- replaces the chevron -->
  </div>
  <div data-part="popup"><div data-part="list">
    <ui-option value="name">Name</ui-option><ui-option value="date">Date</ui-option>
  </div></div>
  <span data-part="description">Applies to the list below.</span>
</ui-select>
```

```tsx
<Select.Root name="sort" defaultValue="name">
  <Select.Label>Sort</Select.Label>
  <Select.Trigger leading={<i name="sort-ascending" />}>
    <Select.Value />
    <Select.Icon />
  </Select.Trigger>
  <Select.Popup>
    <Select.List>
      <Select.Item value="name"><Select.ItemText>Name</Select.ItemText><Select.ItemIndicator /></Select.Item>
      <Select.Item value="date"><Select.ItemText>Date</Select.ItemText><Select.ItemIndicator /></Select.Item>
    </Select.List>
  </Select.Popup>
  <Select.Description>Applies to the list below.</Select.Description>
</Select.Root>
```

Web component: each authored `[data-part]` is adopted onto the generated part (author attributes and classes; slot and icon content; the label, description, error and value text seed `label`, `description`, `error` and `placeholder`); missing parts are generated. React: the parts are direct children of `Select.Root`, which puts the Trigger and the Popup's items inside the native `<select>`; `Select.Popup` and `Select.List` render no element (the browser draws `::picker(select)`), so they take neither `render` nor `className`. `Select.Trigger` without children renders Value and Icon; its `leading`, `prefix` and `suffix` props are the adornments. `Select.ItemIndicator` (a check in the item's trailing slot) renders on the selected item only and is hidden inside the trigger's copy of it (`<selectedcontent>`); the web component's options draw no indicator. `Select.Description` and `Select.Error` are Base UI's Field.Description and Field.Error on the select's own recipe. Every other part takes `render` and `className` (a string or a function of the state).

Construction pattern (shared by every labelled component):

```
[leading icon] [prefix] [contents: the label] [suffix] [trailing icon]
```

Icons sit in leading/trailing slots (6u on controls); prefix and suffix are short text adornments in the label color at 65%; empty parts are hidden. Label-wrapper padding: controls 2u at a bare edge, 1u beside a slot, text parts 1u apart; badge, tag and chip 1u′ on both sides (u′ = their height / 8); choices 1u after the indicator and 0 at the end. Parts: [parts.json](../../contracts/parts.json).

- `part:select-trigger` `:scope > [data-part=trigger]`: The combobox (role=combobox, tabindex 0) laid out as [leading] [prefix] [value] [suffix] [icon] (Base UI Select.Trigger); keeps focus while the popup is open.
- `part:select-value` `:scope > [data-part=trigger] > [data-part=value]`: The selected option label, or the placeholder (data-placeholder); Base UI Select.Value, in the construction pattern's contents place.
- `part:select-icon` `:scope > [data-part=trigger] > [data-part=icon]`: The caret-down icon (Base UI Select.Icon, in the construction pattern's trailing place; icon size sm); turns 180° when open.
- `part:select-popup` `:scope > [data-part=popup]`: The [popover=manual] listbox on bg.overlay (Base UI Select.Popup) holding the list; placed 1u from the trigger.
- `part:select-list` `:scope > [data-part=popup] > [data-part=list]`: The ui-option children's parent (Base UI Select.List; the options are its items), display: contents so the options lay out in the popup. Web component only: the native select has none (React's `Select.List` renders no element).

## Keyboard

| Element | Keys | Action |
|---|---|---|
| `ui-select` | Enter, Space, Alt+ArrowDown, ArrowDown | open (closed) |
| `ui-select` | Home, End | open on the first / last option (closed); move (open) |
| `ui-select` | ArrowUp, ArrowDown, PageUp, PageDown | move the highlight (open) |
| `ui-select` | Enter, Space | commit and close (open) |
| `ui-select` | Tab | commit and move focus (open) |
| `ui-select` | Escape | close without committing |
| `ui-select` | printable characters | typeahead |

## State attributes

Contract: [states.json](../../contracts/states.json); names follow [Base UI](https://base-ui.com); ARIA stays for semantics. Both renderers set the same attributes on the same elements; style with the conditions (`_checked`, `_invalid`, …), not ARIA.

| Element | Attributes |
|---|---|
| `ui-select` / Select (host) | field state: `data-disabled`, `data-required`, `data-valid` / `data-invalid` (once shown: after blur or a blocked submit; an author error at once), `data-dirty`, `data-touched`, `data-filled`, `data-focused` |
| trigger (web component) | `data-popup-open` and `data-pressed` while open, `data-placeholder` with no selection, `data-disabled` |
| popup (web component) | `data-open` / `data-closed`; while open `data-side` (bottom or top, read back after anchor positioning; where the list is squeezed on that side, the side with more room, which `data-side="top"` then places in CSS) and `data-align` (start) |
| `ui-option` in the popup | `data-selected`, `data-highlighted` (the active option), `data-disabled` |

The React Select is a native customizable select: its open state (`select:open`), option selection (`:checked`) and highlight (`:focus`) and the popup (`::picker(select)`) stay native, because the browser does not report them to script. Enter and exit motion is `@starting-style` (no `data-starting-style` / `data-ending-style`).

## Popup variables

The popup is a floating layer ([components spec, Floating layers](../../../../docs/specs/components.md#floating-layers)): the shared positioner places it, the dismiss layer closes it on an outside press (Escape and focus-out stay with the trigger, which keeps focus), and it sits in the top layer (`popover="manual"`). It carries Base UI's positioner variables (Select.Positioner), and the recipe sizes it from them: `min-width: var(--anchor-width)`, `max-height: var(--available-height)`, `transform-origin: var(--transform-origin)`.

| Variable | Anchor positioning (CSS) | Script fallback (floating positioner: `placeFloating`, `positionerVars`) | React (`::picker(select)`) |
|---|---|---|---|
| `--anchor-width`, `--anchor-height` | `anchor-size(width)`, `anchor-size(height)` | trigger size in px | as CSS |
| `--available-width` | `100%` of the position-area cell (trigger start to viewport end) | viewport width − left − 8px, px | as CSS |
| `--available-height` | `calc(100% - var(--u))`: the cell on the open side, less the 1u offset | the space on the chosen side, px | as CSS |
| `--transform-origin` | `top center`, `bottom center` with `data-side="top"` | the same, inline | `top center` only: the browser does not report a flip |

Each opening starts below. Chrome and Firefox flip by `position-try-order: most-block-size`; Safari 27 parses it but keeps the first position that fits, squeezed to its `max-height`, so the element reads the popup back and, when its list overflows, sets `data-side` to the side with more room (`data-side="top"` moves the position area above, with `flip-block` still as the fallback). The React picker has no script; in Safari it can open squeezed below a trigger near the viewport bottom (open: [cross-browser report](../../../../docs/reports/2026-11-02-cross-browser.md)).

Browsers without `appearance: base-select` (Firefox 157) show the React Select as the platform select, painted as the field control (fill, edge, radius, 2u bare-edge padding, the control height) with the platform's arrow and picker; adornments and rich option content are not drawn there.

The CSS values are anchor functions and percentages of the anchored containing block, so they resolve where they are used (sizing, inset and margin properties); `getComputedStyle` returns them unresolved. The script values are px, written inline when the element places the popup itself. The React picker has no `data-side` / `data-align`: it is a pseudo-element the browser places.

## Events and values

Base UI's props and event details ([components spec](../../../../docs/specs/components.md#events-and-values)).

| Renderer | Value | Open | Events / callbacks |
|---|---|---|---|
| `ui-select` | `value`, `defaultValue` (`default-value`) | `open`, `defaultOpen` (`default-open`) | `change` and `input`: `detail { value, reason, event }`, reason `item-press` (pointer, Enter, Space) or `focus-out` (Tab commits); `openchange` (cancelable): `detail { open, reason, event }`, reason `trigger-press`, `list-navigation`, `item-press`, `outside-press`, `escape-key` or `focus-out`. Setting `open` fires none. |
| React Select | native `value` / `defaultValue` | `open`, `defaultOpen` (both through `showPicker`, which needs user activation; a native picker cannot be closed from script) | `onValueChange(value, { reason: 'item-press', event })`; `onOpenChange(open, { reason, event })` from `select:open` reread after each pointer, key, change and blur; native `onChange` still fires |

## Geometry and appearance

Geometry families: `field` ([geometry-families.json](../../contracts/geometry-families.json), resolver `tokens/geometry/resolve.ts`, CSS `styles/geometry.ts`). Styles: the slot recipes in [select.recipe.ts](select.recipe.ts) (Panda `theme.slotRecipes`, one class per part, variants for finite attributes), applied by the web component and the React renderer alike; lengths read the geometry variables, colors are Spectrum roles, states use the shared conditions ([states.json](../../contracts/states.json), `styles/conditions.ts`), and motion and forced colors live in the same recipe.

## Renderers and verification

- webComponent: completed (`./select.element.ts`)
- react: completed (`./select.react.tsx`)

React props: `npm run registry -- --assembly component:select` (under `react`).

Checks and their latest run: [verification/select.verification.json](verification/select.verification.json).
