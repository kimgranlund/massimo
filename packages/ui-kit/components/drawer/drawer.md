# Drawer

`ui-drawer` (React `Drawer`). API, defaults and avoidance guidance: [drawer.manifest.json](drawer.manifest.json) (`npm run registry -- component:drawer`). Examples: [drawer.examples.json](drawer.examples.json). Contract: [components.json](../../contracts/components.json). Base UI reference: [Drawer](https://base-ui.com/react/components/drawer).

## Intent

- `ui-drawer`: slide a panel of navigation, filters or a short task in from an edge of the screen, with swipe to dismiss.

## Usage

```html
<ui-drawer side="right" label="Filters" description="Narrow the list.">
  <ui-button data-part="trigger">Filters</ui-button>
  <ui-checkbox checked>In stock</ui-checkbox>
  <div data-part="actions">
    <ui-button data-part="close">Reset</ui-button>
    <ui-button data-part="close" variant="primary">Show results</ui-button>
  </div>
</ui-drawer>
```

```tsx
<Drawer side="right" label="Filters" trigger="Filters" onOpenChange={(open, { reason }) => …}>
  <Checkbox defaultChecked>In stock</Checkbox>
  <Drawer.Actions><Drawer.Close variant="primary">Show results</Drawer.Close></Drawer.Actions>
</Drawer>
```

It is the [dialog](../dialog/dialog.md) (same parts, props, events, modality, focus and nesting) on an edge sheet:

- `side` (`bottom` by default, `top`, `right`, `left`): the viewport edge it is anchored to, slides in from and swipes away toward; the popup carries Base UI's `data-swipe-direction` (`down`, `up`, `right`, `left`). Sides are physical, as a swipe direction is: `left` stays on the left in RTL.
- Swipe to dismiss (`dom/swipe.ts`): a press on the popup dragged toward its edge moves it with the pointer through Base UI's `--drawer-swipe-movement-x` / `-y` (px) and `data-swiping`; dragging the other way does not move it. Released past 40% of its size, or flicked, it closes with reason `swipe` (`data-swipe-dismiss`; it leaves from where it was dragged); otherwise it springs back. A press needs 6px of movement before it becomes a swipe, so clicks inside stay clicks. Elements marked `[data-swipe-ignore]` (and text entry, sliders) never start one.
- `openchange` reasons: the dialog's plus `swipe`.

Base UI's snap points, swipe area, indent and virtual-keyboard parts are not implemented.

## Anatomy

As the dialog's, under `Drawer.*` in React:

| Base UI | Web component | React |
|---|---|---|
| Drawer.Root | `ui-drawer` (host, display: contents) | `Drawer.Root` (`div[data-ui=drawer]`) |
| Drawer.Trigger | `[data-part=trigger]` | `Drawer.Trigger` (a kit `Button`) |
| Drawer.Portal | none: the top layer lifts the popup | `Drawer.Portal` (renders in place) |
| Drawer.Backdrop | `[data-part=backdrop]` | `Drawer.Backdrop` |
| Drawer.Popup | `[data-part=popup]` (role=dialog) | `Drawer.Popup` |
| Drawer.Title | `[data-part=title]` | `Drawer.Title` (h2) |
| Drawer.Description | `[data-part=description]` | `Drawer.Description` (p) |
| *actions* (ours) | `[data-part=actions]` | `Drawer.Actions` |
| Drawer.Close | `[data-part=close]` | `Drawer.Close` (a kit `Button`) |

```html
<ui-drawer side="left">
  <ui-button data-part="trigger">Menu</ui-button>
  <div data-part="backdrop"></div>
  <div data-part="popup"><h2 data-part="title">Navigation</h2><ui-button data-part="close">Inbox</ui-button></div>
</ui-drawer>
```

```tsx
<Drawer.Root side="left">
  <Drawer.Trigger>Menu</Drawer.Trigger>
  <Drawer.Portal>
    <Drawer.Backdrop />
    <Drawer.Popup><Drawer.Title>Navigation</Drawer.Title><Drawer.Close>Inbox</Drawer.Close></Drawer.Popup>
  </Drawer.Portal>
</Drawer.Root>
```

Every part takes `render` and a `className` string or function of its state (as the dialog's).

## Keyboard

| Element | Keys | Action |
|---|---|---|
| trigger | Enter, Space | open the drawer |
| popup | Escape | close the topmost drawer or dialog (`escape-key`) |
| popup | Tab, Shift+Tab | move among its tabbables, wrapping (modal, trap-focus) |

## State attributes

[states.json](../../contracts/states.json) `ui-drawer`: the dialog's (host and backdrop `data-open` / `data-closed`; trigger `data-popup-open`; popup `data-open` / `data-closed`, `data-nested`, `data-nested-dialog-open`) plus, on the popup, Base UI Drawer's `data-swipe-direction`, `data-swiping` and `data-swipe-dismiss`. A nested drawer uses the dialog's nesting names (Base UI Drawer says `data-nested-drawer-open`, `--nested-drawers`).

## Geometry and appearance

Geometry family: `drawer` ([geometry-families.json](../../contracts/geometry-families.json), resolver `resolveDrawer`). The popup is an area at the panel level: padding p·u − B inside a B edge in the border role (p = the theme's `pad-panel`, 6u), square at any corner scale (it meets the viewport edge), its parts 2u apart (the collection gap; the `gap` attribute wins), the actions 2u apart at the end edge. Left and right sheets are the viewport's height and 80u wide, at most the viewport less 8u; top and bottom sheets are the full width, as tall as their content, at most the viewport height less 8u, scrolling inside. The fill is `bg.overlay` with the `md` shadow over the `bg.backdrop` role. It slides in from its edge and out again on the reveal intent (`translate`, `display` and `overlay` discrete); while swiped it follows the pointer with no transition. Styles: [drawer.recipe.ts](drawer.recipe.ts) (`side` is a variant).

## Renderers and verification

- webComponent: completed (`./drawer.element.ts`)
- react: completed (`./drawer.react.tsx`)

React props: `npm run registry -- --assembly component:drawer` (under `react`).

Checks and their latest run: [verification/drawer.verification.json](verification/drawer.verification.json).
