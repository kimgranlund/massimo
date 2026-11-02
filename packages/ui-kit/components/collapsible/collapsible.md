# Collapsible

`ui-collapsible` (React `Collapsible`). API, defaults and avoidance guidance: [collapsible.manifest.json](collapsible.manifest.json) (`npm run registry -- component:collapsible`). Examples: [collapsible.examples.json](collapsible.examples.json). Contract: [components.json](../../contracts/components.json). Base UI reference: [Collapsible](https://base-ui.com/react/components/collapsible).

## Intent

- `ui-collapsible`: show or hide one section of content under a labelled trigger.

## Usage

```html
<ui-collapsible label="Recovery keys"><p>Store these keys somewhere safe.</p></ui-collapsible>
<ui-collapsible label="Shipping" default-open><p>Ships in 2–3 days.</p></ui-collapsible>
```

```tsx
<Collapsible label="Recovery keys" defaultOpen onOpenChange={(open, { reason }) => …}>
  <p>Store these keys somewhere safe.</p>
</Collapsible>
```

Direct children with `slot="leading" | "prefix" | "suffix" | "trailing"` adorn the preset's trigger (`<ui-collapsible label="Keys"><i slot="leading" name="key"></i>…</ui-collapsible>`).

`open` (attribute and property; React: controlled `open`) and `defaultOpen` (`default-open`) follow Base UI. A press on the trigger, or Enter / Space while it has focus, fires `openchange` (cancelable: `preventDefault` keeps the panel as it is) with `{ open, reason: 'trigger-press', event }`; React calls `onOpenChange(open, { reason, event })`. Setting `open` from script fires nothing. `disabled` ignores presses.

## Anatomy

Preset: `label` becomes the trigger's text and the children become the panel. Parts (Base UI Collapsible):

| Base UI | Web component | React |
|---|---|---|
| Collapsible.Root | `ui-collapsible` (host) | `Collapsible.Root` (`div[data-ui=collapsible]`) |
| Collapsible.Trigger | `[data-part=trigger]` (role=button) | `Collapsible.Trigger` (`<button>`) |
| Collapsible.Panel | `[data-part=panel]` | `Collapsible.Panel` |

- `part:collapsible-trigger` `:scope > [data-part=trigger]`: the trigger row, the construction pattern `[leading] [prefix] [contents] [suffix] [trailing]` with a `caret-down` icon in trailing (an authored trailing replaces it; React `trailing={null}` removes it).
- `part:collapsible-panel` `:scope > [data-part=panel]`: the panel, in the DOM while closed (`hidden`).

```html
<ui-collapsible>
  <div data-part="trigger"><i slot="leading" name="key"></i>Recovery keys<span slot="suffix">3</span></div>
  <div data-part="panel"><p>alien-bean-pasta</p></div>
</ui-collapsible>
```

```tsx
<Collapsible.Root defaultOpen>
  <Collapsible.Trigger leading={<i name="key" />} suffix="3">Recovery keys</Collapsible.Trigger>
  <Collapsible.Panel><p>alien-bean-pasta</p></Collapsible.Panel>
</Collapsible.Root>
```

Every part takes `render` and a `className` string or function of its state (`{ open, closed, disabled }`; the trigger also `panelOpen`).

## Keyboard

| Element | Keys | Action |
|---|---|---|
| trigger | Enter, Space | toggle the panel |

## State attributes

Contract: [states.json](../../contracts/states.json); names follow [Base UI](https://base-ui.com); ARIA (`aria-expanded`, `aria-controls`) stays for semantics.

| Element | Attributes |
|---|---|
| `ui-collapsible` / Collapsible.Root | `data-open` / `data-closed`, `data-disabled` |
| trigger | `data-panel-open` while open, `data-disabled` |
| panel | `data-open` / `data-closed` (and `hidden` while closed) |

## Geometry and appearance

Geometry family: `disclosure` ([geometry-families.json](../../contracts/geometry-families.json), resolver `resolveDisclosure` in `tokens/geometry/resolve.ts`). The trigger is a full-width control row: 8u tall, padding u − B inside a transparent border, the control radius, the label 2u from the start edge and 1u from the caret slot, the caret at icon size sm (turned 180° while open, toggle intent). Hover and press lay the control fill on it. The panel's text starts at the trigger's label edge (3u) and ends 2u below its content. Opening and closing animate the panel's height between 0 and auto on the reveal intent, in CSS only (`interpolate-size: allow-keywords`, `display` transitioning discretely, `@starting-style`); browsers without `interpolate-size` open at once, and reduced motion collapses the duration. Styles: [collapsible.recipe.ts](collapsible.recipe.ts).

## Renderers and verification

- webComponent: completed (`./collapsible.element.ts`)
- react: completed (`./collapsible.react.tsx`)

React props: `npm run registry -- --assembly component:collapsible` (under `react`).

Checks and their latest run: [verification/collapsible.verification.json](verification/collapsible.verification.json).
