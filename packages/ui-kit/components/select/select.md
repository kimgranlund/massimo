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

Construction pattern (shared by every labelled component):

```
[leading icon] [prefix] [contents: the label] [suffix] [trailing icon]
```

Icons sit in leading/trailing slots (6u on controls); prefix and suffix are short text adornments in the label color at 65%; empty parts are hidden. Label-wrapper padding: controls 2u at a bare edge, 1u beside a slot, text parts 1u apart; badge, tag and chip 1u′ on both sides (u′ = their height / 8); choices 1u after the indicator and 0 at the end. Parts: [parts.json](../../contracts/parts.json).

- `part:select-trigger` `:scope > [data-part=trigger]`: The combobox (role=combobox, tabindex 0) laid out as [leading] [prefix] [value] [suffix] [icon] (Base UI Select.Trigger); keeps focus while the popup is open.
- `part:select-value` `:scope > [data-part=trigger] > [data-part=value]`: The selected option label, or the placeholder (data-placeholder); Base UI Select.Value, in the construction pattern's contents place.
- `part:select-icon` `:scope > [data-part=trigger] > [data-part=icon]`: The caret-down icon (Base UI Select.Icon, in the construction pattern's trailing place; icon size sm); turns 180° when open.
- `part:select-popup` `:scope > [data-part=popup]`: The [popover=manual] listbox on bg.overlay (Base UI Select.Popup) holding the list; placed 1u from the trigger.
- `part:select-list` `:scope > [data-part=popup] > [data-part=list]`: The ui-option children's parent (Base UI Select.List; the options are its items), display: contents so the options lay out in the popup. Web component only: the native select has none.

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
| popup (web component) | `data-open` / `data-closed`; while open `data-side` (bottom or top, read back after anchor positioning) and `data-align` (start) |
| `ui-option` in the popup | `data-selected`, `data-highlighted` (the active option), `data-disabled` |

The React Select is a native customizable select: its open state (`select:open`), option selection (`:checked`) and highlight (`:focus`) and the popup (`::picker(select)`) stay native, because the browser does not report them to script. Enter and exit motion is `@starting-style` (no `data-starting-style` / `data-ending-style`).

## Popup variables

The popup carries Base UI's positioner variables (Select.Positioner), and the recipe sizes it from them: `min-width: var(--anchor-width)`, `max-height: var(--available-height)`, `transform-origin: var(--transform-origin)`.

| Variable | Anchor positioning (CSS) | Script fallback (`placePopup`, `popupVars`) | React (`::picker(select)`) |
|---|---|---|---|
| `--anchor-width`, `--anchor-height` | `anchor-size(width)`, `anchor-size(height)` | trigger size in px | as CSS |
| `--available-width` | `100%` of the position-area cell (trigger start to viewport end) | viewport width − left − 8px, px | as CSS |
| `--available-height` | `calc(100% - var(--u))`: the cell on the open side, less the 1u offset | the space on the chosen side, px | as CSS |
| `--transform-origin` | `top center`, `bottom center` with `data-side="top"` | the same, inline | `top center` only: the browser does not report a flip |

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
