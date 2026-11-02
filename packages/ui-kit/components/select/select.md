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

- `part:select-trigger` `:scope > [data-part=trigger]`: The combobox (role=combobox, tabindex 0) laid out as [leading] [prefix] [value] [suffix] [chevron]; keeps focus while the popup is open.
- `part:select-value` `:scope > [data-part=trigger] > [data-part=contents]`: The selected option label, or the placeholder (data-placeholder).
- `part:select-chevron` `:scope > [data-part=trigger] > [data-part=trailing]`: The caret-down icon (icon size sm); turns 180° when open.
- `part:select-popup` `:scope > [data-part=popup]`: The [popover=manual] listbox on bg.overlay holding the ui-option children; placed 1u from the trigger.

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

## Geometry and appearance

Geometry families: `field` ([geometry-families.json](../../contracts/geometry-families.json), resolver `tokens/geometry/resolve.ts`, CSS `styles/geometry.ts`). Styles: the slot recipes in [select.recipe.ts](select.recipe.ts) (Panda `theme.slotRecipes`, one class per part, variants for finite attributes), applied by the web component and the React renderer alike; lengths read the geometry variables, colors are Spectrum roles, states use the shared conditions ([states.json](../../contracts/states.json), `styles/conditions.ts`), and motion and forced colors live in the same recipe.

## Renderers and verification

- webComponent: completed (`./select.element.ts`)
- react: completed (`./select.react.tsx`)

React props: `npm run registry -- --assembly component:select` (under `react`).

Checks and their latest run: [verification/select.verification.json](verification/select.verification.json).
