# Tooltip

`ui-tooltip` (React `Tooltip`). API, defaults and avoidance guidance: [tooltip.manifest.json](tooltip.manifest.json) (`npm run registry -- component:tooltip`). Examples: [tooltip.examples.json](tooltip.examples.json). Contract: [components.json](../../contracts/components.json). Base UI reference: [Tooltip](https://base-ui.com/react/components/tooltip).

## Intent

- `ui-tooltip`: name or explain a control in a few words while the pointer rests on it or it has keyboard focus.

## Usage

```html
<ui-tooltip content="Bold (⌘B)">
  <ui-button aria-label="Bold"><i slot="leading" name="text-b"></i></ui-button>
</ui-tooltip>
```

```tsx
<Tooltip content="Bold (⌘B)">
  <Button aria-label="Bold" leading={<i name="text-b" />} />
</Tooltip>
```

The first child element is the trigger and `content` the popup's text. It opens after `delay` ms (default 600) while the pointer rests on the trigger, at once when the trigger gets keyboard focus (`:focus-visible`), and at once without the reveal motion while the tooltip group is warm (another tooltip closed less than 400 ms ago; `data-instant="delay"`). It closes `close-delay` ms (default 0) after the pointer leaves trigger and popup (moving onto the popup across the 1u gap keeps it open), on blur, a press on the trigger, an outside press or Escape. Each interaction fires `openchange` (cancelable) with `{ open, reason, event }`, reasons `trigger-hover`, `trigger-focus`, `trigger-press`, `focus-out`, `outside-press`, `escape-key`; React calls `onOpenChange(open, { reason, event })`. `open` / `defaultOpen` (`default-open`), `side` (`top` default, `bottom`, `left`, `right`), `align` (`center` default, `start`, `end`) and `disabled` follow Base UI.

React: `Tooltip.Provider` sets `delay`, `closeDelay` and the warm-group `timeout` for the tooltips inside it. The web components share one warm group (400 ms).

## Anatomy

Parts (Base UI Tooltip):

| Base UI | Web component | React |
|---|---|---|
| Tooltip.Provider | (one shared group) | `Tooltip.Provider` (no element) |
| Tooltip.Root | `ui-tooltip` (host, display: contents) | `Tooltip.Root` (`div[data-ui=tooltip]`) |
| Tooltip.Trigger | the first child element, or `[data-part=trigger]` | `Tooltip.Trigger` (the kit `Button`; `render` for another element) |
| Tooltip.Positioner | `[data-part=positioner]` (popover=manual) | `Tooltip.Positioner` (`side`, `align`) |
| Tooltip.Popup | `[data-part=popup]` (role=tooltip) | `Tooltip.Popup` |
| Tooltip.Arrow | `[data-part=arrow]` | `Tooltip.Arrow` (inside the Positioner, after the Popup) |

- `part:tooltip-trigger` `:scope > [data-part=trigger]`: the described control; `aria-describedby` names the popup after any description it already has.
- `part:tooltip-positioner` `:scope > [data-part=positioner]`, `part:tooltip-popup` `… > [data-part=popup]`, `part:tooltip-arrow` `… > [data-part=arrow]` (optional).

```html
<ui-tooltip side="bottom">
  <ui-button data-part="trigger">Publish</ui-button>
  <div data-part="popup">Visible to everyone<div data-part="arrow"></div></div>
</ui-tooltip>
```

```tsx
<Tooltip.Root>
  <Tooltip.Trigger>Publish</Tooltip.Trigger>
  <Tooltip.Positioner side="bottom">
    <Tooltip.Popup>Visible to everyone</Tooltip.Popup>
    <Tooltip.Arrow />
  </Tooltip.Positioner>
</Tooltip.Root>
```

## Keyboard

| Element | Keys | Action |
|---|---|---|
| trigger | Tab (keyboard focus) | show the tooltip |
| trigger | Escape | hide it |

## State attributes

Contract: [states.json](../../contracts/states.json); names follow [Base UI](https://base-ui.com).

| Element | Attributes |
|---|---|
| `ui-tooltip` / Tooltip.Root | `data-open` / `data-closed`, `data-disabled` |
| trigger | `data-popup-open` while open |
| positioner, popup | `data-open` / `data-closed`; while open `data-side`, `data-align`, and `data-instant="delay"` when the warm group skipped the motion; positioner `data-placement` (ours) |
| arrow | `data-open` / `data-closed`, `data-side`, `data-align`, `data-uncentered` |

## Geometry and appearance

Geometry family: `popup` ([geometry-families.json](../../contracts/geometry-families.json), resolver `resolvePopup('tooltip')`). A single-line tooltip is a 7u row: the control font (10px + u) at line height 1.2 centered in a 6u text slot inside a 0.5u edge (padding 0.5u − B plus the line padding), 2u from its ends (padding 2u − B), radius min(3u·s, 3.5u). It wraps at 60u and is not stretched to its trigger's width. It sits 1u from the trigger, above it unless there is no room. The fill is the inverse surface (`bg.inverse`, `fg.inverse`) with the sm shadow; the arrow is a 2u-wide triangle in the same fill spanning the gap. It enters and leaves on the reveal intent (opacity and scale from the trigger's side). Styles: [tooltip.recipe.ts](tooltip.recipe.ts) on the shared [popup-parts.ts](../popover/popup-parts.ts).

## Renderers and verification

- webComponent: completed (`./tooltip.element.ts`, on `../popover/popup-base.ts`)
- react: completed (`./tooltip.react.tsx`, on the popover's parts)

React props: `npm run registry -- --assembly component:tooltip` (under `react`).

Checks and their latest run: [verification/tooltip.verification.json](verification/tooltip.verification.json).
