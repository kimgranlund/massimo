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

Built-in problems (required, email, minlength, pattern) set validity at once but show only after blur or a blocked submit (`data-user-invalid`). `error` is shown immediately. `reportValidity()` reveals the current problem.

## Anatomy

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

## Geometry and appearance

Geometry families: `field` ([geometry-families.json](../../contracts/geometry-families.json), resolver `tokens/geometry/resolve.ts`, CSS `styles/geometry.ts`). Colors are Spectrum roles; states are keyed on ARIA and `data-*` ([states.json](../../contracts/states.json), `styles/defaults.ts`); motion in `styles/motion.ts`.

## Renderers and verification

- webComponent: completed (`./input.element.ts`)
- react: completed (`./input.react.tsx`)
- html: in_progress

React props: `npm run registry -- --assembly component:input` (under `react`).

Checks and their latest run: [verification/input.verification.json](verification/input.verification.json).
