# Popover

`ui-popover` (React `Popover`). API, defaults and avoidance guidance: [popover.manifest.json](popover.manifest.json) (`npm run registry -- component:popover`). Examples: [popover.examples.json](popover.examples.json). Contract: [components.json](../../contracts/components.json). Base UI reference: [Popover](https://base-ui.com/react/components/popover).

## Intent

- `ui-popover`: show interactive content (a form, settings, details with actions) anchored to the control that opened it, without leaving the page.

## Usage

```html
<ui-popover label="Notifications">
  <h2 data-part="title">Notifications</h2>
  <p data-part="description">You are all caught up.</p>
</ui-popover>
```

```tsx
<Popover label="Notifications" onOpenChange={(open, { reason }) => …}>
  <Popover.Title>Notifications</Popover.Title>
  <Popover.Description>You are all caught up.</Popover.Description>
</Popover>
```

`open` (attribute and property; React: controlled `open`) and `defaultOpen` (`default-open`) follow Base UI. A press on the trigger (pointer, Enter, Space) toggles the popup and fires `openchange` (cancelable: `preventDefault` keeps it as it is) with `{ open, reason, event }`; React calls `onOpenChange(open, { reason, event })`. Reasons: `trigger-press`, `outside-press`, `escape-key` (the topmost layer only), `focus-out` (focus left trigger and popup; not when modal), `close-press` (a Close part), `trigger-hover` (with `open-on-hover`). Setting `open` from script fires nothing and does not move focus.

- `side` (`top`, `bottom` default, `left`, `right`) and `align` (`start`, `center` default, `end`): the preferred placement (Base UI Positioner); the popup flips to the other side when there is no room. React: on `Popover.Positioner`.
- `modal`: focus stays inside the popup while it is open (Tab wraps) and the page does not scroll (`html[data-scroll-locked]`, as a modal dialog; not while hovering opened it); `aria-modal`.
- `open-on-hover` (React `openOnHover`): also opens when the pointer rests on the trigger for `delay` ms (default 300) and closes `close-delay` ms (default 0) after it leaves trigger and popup; a popover opened by a press stays until dismissed.
- `disabled`: never opens.

## Anatomy

Preset: `label` becomes a `ui-button` trigger and the children become the popup. Parts (Base UI Popover):

| Base UI | Web component | React |
|---|---|---|
| Popover.Root | `ui-popover` (host, display: contents) | `Popover.Root` (`div[data-ui=popover]`) |
| Popover.Trigger | `[data-part=trigger]` (a `ui-button`, or any element) | `Popover.Trigger` (the kit `Button`) |
| Popover.Positioner | `[data-part=positioner]` (popover=manual) | `Popover.Positioner` (`side`, `align`) |
| Popover.Popup | `[data-part=popup]` (role=dialog) | `Popover.Popup` |
| Popover.Arrow | `[data-part=arrow]` | `Popover.Arrow` (inside the Positioner, after the Popup) |
| Popover.Title | `[data-part=title]` | `Popover.Title` (`h2`) |
| Popover.Description | `[data-part=description]` | `Popover.Description` (`p`) |
| Popover.Close | `[data-part=close]` | `Popover.Close` (the kit `Button`) |

- `part:popover-trigger` `:scope > [data-part=trigger]`: opens the popup; `aria-haspopup=dialog`, `aria-expanded`, `aria-controls`.
- `part:popover-positioner` `:scope > [data-part=positioner]`: the floating layer in the top layer; Base UI's positioner variables.
- `part:popover-popup` `:scope > [data-part=positioner] > [data-part=popup]`: the surface, labelled by the title and described by the description.
- `part:popover-arrow`, `part:popover-title`, `part:popover-description`, `part:popover-close`: optional.

```html
<ui-popover side="top">
  <ui-button data-part="trigger">Share</ui-button>
  <div data-part="popup">
    <h2 data-part="title">Share link</h2>
    <p data-part="description">Anyone with the link can view.</p>
    <ui-button data-part="close">Done</ui-button>
    <div data-part="arrow"></div>
  </div>
</ui-popover>
```

```tsx
<Popover.Root>
  <Popover.Trigger>Share</Popover.Trigger>
  <Popover.Positioner side="top">
    <Popover.Popup>
      <Popover.Title>Share link</Popover.Title>
      <Popover.Description>Anyone with the link can view.</Popover.Description>
      <Popover.Close>Done</Popover.Close>
    </Popover.Popup>
    <Popover.Arrow />
  </Popover.Positioner>
</Popover.Root>
```

The web component moves an authored arrow beside the popup in the positioner (the popup scrolls when the space runs out; the arrow stays outside it). Every React part takes `render` and a `className` string or function of its state (`{ open, closed, side, align, … }`).

## Keyboard

| Element | Keys | Action |
|---|---|---|
| trigger | Enter, Space | toggle the popup; opening moves focus to its first focusable element (else the popup) |
| popup | Escape | close it; focus returns to the trigger |
| popup | Tab, Shift+Tab | move through it; leaving closes a non-modal popover, a modal one wraps |

## State attributes

Contract: [states.json](../../contracts/states.json); names follow [Base UI](https://base-ui.com).

| Element | Attributes |
|---|---|
| `ui-popover` / Popover.Root | `data-open` / `data-closed`, `data-disabled` |
| trigger | `data-popup-open` while open |
| positioner, popup | `data-open` / `data-closed`; while open `data-side`, `data-align` (measured); positioner `data-placement` (ours: the preferred `<side>-<align>`) |
| arrow | `data-open` / `data-closed`, `data-side`, `data-align`, `data-uncentered` |

Positioner variables (Base UI): `--anchor-width`, `--anchor-height`, `--available-width`, `--available-height`, `--transform-origin` (CSS anchor functions where anchor positioning runs, px from the script positioner elsewhere); the arrow's `--arrow-offset` (px from the popup's start along its edge).

## Geometry and appearance

Geometry family: `popup` ([geometry-families.json](../../contracts/geometry-families.json), resolver `resolvePopup('popover')` in `tokens/geometry/resolve.ts`). The popup sits 1u from the trigger, at least as wide as it, at most 80u wide and as tall as the space beside it (then it scrolls). It is a small card: padding 3u − B (the theme's card-sm padding) inside the edge, radius 3u·min(1, s), the group gap (1u; the `gap` attribute wins) between title, description and content; the overlay fill, the border role edge and the md shadow. The title uses the title type role, the description body in fg.muted. The arrow is a 2u-wide triangle spanning the 1u gap, in the edge colour with its fill B inside. Opening fades and scales it from the edge facing the trigger on the reveal intent; closing reverses it (`display` and `overlay` transition discretely). Styles: [popover.recipe.ts](popover.recipe.ts) on the shared [popup-parts.ts](popup-parts.ts).

## Renderers and verification

- webComponent: completed (`./popover.element.ts`, machinery in `./popup-base.ts`)
- react: completed (`./popover.react.tsx`; Tooltip and PreviewCard reuse its parts)

React props: `npm run registry -- --assembly component:popover` (under `react`).

Checks and their latest run: [verification/popover.verification.json](verification/popover.verification.json).
