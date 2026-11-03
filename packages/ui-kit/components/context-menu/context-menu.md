# Context Menu

`ui-context-menu` (React `ContextMenu`). API, defaults and avoidance guidance: [context-menu.manifest.json](context-menu.manifest.json) (`npm run registry -- component:context-menu`). Examples: [context-menu.examples.json](context-menu.examples.json). Contract: [components.json](../../contracts/components.json). Base UI reference: [Context Menu](https://base-ui.com/react/components/context-menu). Built on [Menu](../menu/menu.md): the popup, items, keys, submenus, dismissal and events are the menu's.

## Intent

- `ui-context-menu`: offer actions for an area or object at the pointer, on a secondary press.

## Usage

Preset: the area and the items as children; the popup is generated.

```html
<ui-context-menu>
  <div data-part="trigger" tabindex="0">Right-click the canvas</div>
  <div data-part="item">Copy<span slot="suffix">⌘C</span></div>
  <div data-part="item">Paste<span slot="suffix">⌘V</span></div>
  <div data-part="separator"></div>
  <div data-part="item">Delete</div>
</ui-context-menu>
```

```tsx
<ContextMenu label={<Canvas />} onOpenChange={(open, { reason }) => …}>
  <ContextMenu.Item suffix="⌘C" onClick={copy}>Copy</ContextMenu.Item>
  <ContextMenu.Item suffix="⌘V" onClick={paste}>Paste</ContextMenu.Item>
</ContextMenu>
```

The popup opens at the pointer on `contextmenu` (right click, or the platform's own gesture; the native menu is prevented) and on a 500 ms touch press, and at the focused element's start corner on Shift+F10 or the ContextMenu key (focus on the first item). The gesture fires `openchange` with `{ open: true, reason: 'trigger-press', event }`; repeating it while open moves the popup. Everything else is ui-menu's: `open`, `default-open`, `disabled` (the native context menu shows instead), item presses, checkbox and radio items, submenus, `openchange` reasons. Make the area focusable (or hold a focusable element) so keyboard users can reach the gesture.

## Anatomy

| Base UI | Web component | React |
|---|---|---|
| ContextMenu.Root | `ui-context-menu` (host) | `ContextMenu.Root` (`div[data-ui=context-menu]`) |
| ContextMenu.Trigger | `[data-part=trigger]` (the area; no role) | `ContextMenu.Trigger` (`<div>`) |
| ContextMenu.Portal, Positioner, Popup, Item, … | ui-menu's parts in `[data-part=popup]` | `ContextMenu.Portal`, `ContextMenu.Positioner`, `ContextMenu.Popup`, `ContextMenu.Item`, `ContextMenu.CheckboxItem`, `ContextMenu.RadioGroup`, `ContextMenu.RadioItem`, `ContextMenu.Group`, `ContextMenu.GroupLabel`, `ContextMenu.Separator`, `ContextMenu.SubmenuRoot`, `ContextMenu.SubmenuTrigger` (Menu's parts) |

- `part:context-menu-trigger` `:scope > [data-part=trigger]`: the area, the author's content as it is (no construction pattern).
- The popup and its items: [menu anatomy](../menu/menu.md#anatomy).

```html
<ui-context-menu>
  <div data-part="trigger" tabindex="0">Layer 1</div>
  <div data-part="popup" aria-label="Layer actions">
    <div data-part="item">Rename</div>
    <ui-menu>
      <div data-part="submenu-trigger">Arrange</div>
      <div data-part="popup"><div data-part="item">Bring to front</div><div data-part="item">Send to back</div></div>
    </ui-menu>
    <div data-part="separator"></div>
    <div data-part="checkbox-item" checked>Visible</div>
  </div>
</ui-context-menu>
```

```tsx
<ContextMenu.Root>
  <ContextMenu.Trigger tabIndex={0}>Layer 1</ContextMenu.Trigger>
  <ContextMenu.Portal><ContextMenu.Positioner><ContextMenu.Popup aria-label="Layer actions">
    <ContextMenu.Item>Rename</ContextMenu.Item>
    <ContextMenu.SubmenuRoot>
      <ContextMenu.SubmenuTrigger>Arrange</ContextMenu.SubmenuTrigger>
      <ContextMenu.Positioner><ContextMenu.Popup>
        <ContextMenu.Item>Bring to front</ContextMenu.Item><ContextMenu.Item>Send to back</ContextMenu.Item>
      </ContextMenu.Popup></ContextMenu.Positioner>
    </ContextMenu.SubmenuRoot>
    <ContextMenu.Separator />
    <ContextMenu.CheckboxItem defaultChecked>Visible</ContextMenu.CheckboxItem>
  </ContextMenu.Popup></ContextMenu.Positioner></ContextMenu.Portal>
</ContextMenu.Root>
```

Every part takes `render` and a `className` string or function of its state (the trigger `{ popupOpen, disabled }`; the others as in Menu).

## Keyboard

| Element | Keys | Action |
|---|---|---|
| area (or an element in it) | Shift+F10, ContextMenu | open at the focused element's start corner, on the first item |
| popup, items, submenus | as in [Menu](../menu/menu.md#keyboard) | |

## State attributes

| Element | Attributes |
|---|---|
| trigger | `data-popup-open`, `data-disabled` |
| popup, items, indicators, submenu triggers, separators | as in [Menu](../menu/menu.md#state-attributes) |

## Geometry and appearance

Geometry family: `menu` (resolver `resolveMenu`). The area has no geometry of its own (it is a block with the author's content and size; no text selection or touch callout while open). The popup is the menu's floating composite, placed from script at the pointer (a zero-size anchor, `pointAnchor`), 1u from it (below and start-aligned, flipping above or toward the start at the viewport edges), with the menu's 7u items and separators. Styles: [context-menu.recipe.ts](context-menu.recipe.ts) (root and trigger) and [menu.recipe.ts](../menu/menu.recipe.ts) (placement `point`).

## Renderers and verification

- webComponent: completed (`./context-menu.element.ts`, `UIContextMenu extends UIMenu`)
- react: completed (`./context-menu.react.tsx`)

React props: `npm run registry -- --assembly component:context-menu` (under `react`).

Checks and their latest run: [verification/context-menu.verification.json](verification/context-menu.verification.json).
