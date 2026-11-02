# Input

`ui-input`. API, defaults and avoidance guidance: [input.manifest.json](input.manifest.json) (`npm run registry -- component:input`). Examples: [input.examples.json](input.examples.json). Contract: [components.json](../../contracts/components.json).

## Intent

- `ui-input`: enter a single line of text; enter an email address when type is email; enter a secret when type is password.

## Usage

```html
<ui-input label="Price" name="price" value="40"><span slot="prefix">$</span><span slot="suffix">USD</span></ui-input>
<ui-input label="Search"><i slot="leading" name="magnifying-glass"></i><span slot="suffix">⌘K</span></ui-input>
```

React: `<Input label="Price" prefix="$" suffix="USD" />` renders a native `<input data-part="contents">` inside the same control.

`hide-label` keeps the label as the accessible name without drawing it (React: `<Input hideLabel />`), for layouts that show the name elsewhere, such as an inspector row. Never drop `label` instead: the control would have no name.

## Validation timing

Built-in problems (required, email, minlength, pattern) set validity at once but show only after blur or a blocked submit (`data-invalid`, with `data-touched` after a blur). `error` is shown immediately. `reportValidity()` reveals the current problem.

## Anatomy

### Both forms

Preset or parts ([components spec](../../../../docs/specs/components.md#composition)); the same DOM, classes and data-*:

```html
<ui-input name="price" value="40">
  <span data-part="label">Price</span>
  <div data-part="control">
    <span data-part="prefix">$</span><span data-part="contents"></span><span data-part="suffix">USD</span>
  </div>
  <span data-part="description">Before tax</span>
</ui-input>
```

```tsx
<Input.Root name="price" defaultValue="40">
  <Input.Label>Price</Input.Label>
  <Input.Control prefix="$" suffix="USD" />
  <Input.Description>Before tax</Input.Description>
  <Input.Error>…</Input.Error>  {/* an author error: data-invalid at once */}
</Input.Root>
```

Web component: authored parts are adopted onto the generated ones; label, description and error text seed those properties. React: Base UI's Field.Label, Field.Control, Field.Description and Field.Error on the input's recipe. The native `<input>` is inside `Input.Control` and is not a part of its own: its props (value, name, events) come from `Input.Root`, which wires it from the Label, Description and Error among its direct children.

Construction pattern (shared by every labelled component):

```
[leading icon] [prefix] [contents: the label] [suffix] [trailing icon]
```

Icons sit in leading/trailing slots (6u on controls); prefix and suffix are short text adornments in the label color at 65%; empty parts are hidden. Label-wrapper padding: controls 2u at a bare edge, 1u beside a slot, text parts 1u apart; badge, tag and chip 1u′ on both sides (u′ = their height / 8); choices 1u after the indicator and 0 at the end. Parts: [parts.json](../../contracts/parts.json).

- `part:input-control` `:scope > [data-part=control]`: The field box (pad = u − B) laid out as [leading] [prefix] [editor] [suffix] [trailing]. A press outside the editor focuses it; the focus ring paints here.
- `part:input-editor` `:scope > [data-part=control] > [data-part=contents]`: The contenteditable role=textbox editor (2u text padding). The editor getter returns it for selection APIs.

## Keyboard

| Element | Keys | Action |
|---|---|---|
| `ui-input` | Enter | request submit of the owning form |

## State attributes

Contract: [states.json](../../contracts/states.json); names follow [Base UI](https://base-ui.com); ARIA stays for semantics. Both renderers set the same attributes on the same elements; style with the conditions (`_checked`, `_invalid`, …), not ARIA.

| Element | Attributes |
|---|---|
| `ui-input` / Input (host) | field state: `data-disabled`, `data-required`, `data-valid` / `data-invalid` (once shown: after blur or a blocked submit; an author error at once), `data-dirty`, `data-touched`, `data-filled`, `data-focused`; `data-readonly` |

The editor's own `data-placeholder` is its placeholder text (drawn with `attr()`), not a state.

## Events and values

Base UI's props and event details ([components spec](../../../../docs/specs/components.md#events-and-values)).

| Renderer | Value | Events / callbacks |
|---|---|---|
| `ui-input` | `value`, `defaultValue` (`default-value`; without it the `value` attribute) | `input` while typing: `detail { value, reason: 'none', event }` (the editor's native input event stops at the editor and is `detail.event`); `change` on blur when the value changed since focus, like a native input |
| React Input | native `value` / `defaultValue` | `onValueChange(value, { reason: 'none', event })`; native `onChange` still fires |

## Geometry and appearance

Geometry families: `field` ([geometry-families.json](../../contracts/geometry-families.json), resolver `tokens/geometry/resolve.ts`, CSS `styles/geometry.ts`). Styles: the slot recipes in [input.recipe.ts](input.recipe.ts) (Panda `theme.slotRecipes`, one class per part, variants for finite attributes), applied by the web component and the React renderer alike; lengths read the geometry variables, colors are Spectrum roles, states use the shared conditions ([states.json](../../contracts/states.json), `styles/conditions.ts`), and motion and forced colors live in the same recipe.

## Renderers and verification

- webComponent: completed (`./input.element.ts`)
- react: completed (`./input.react.tsx`)
- html: in_progress

React props: `npm run registry -- --assembly component:input` (under `react`).

Checks and their latest run: [verification/input.verification.json](verification/input.verification.json).
