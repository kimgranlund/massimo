# Menubar

`ui-menubar` (React `Menubar`). API, defaults and avoidance guidance: [menubar.manifest.json](menubar.manifest.json) (`npm run registry -- component:menubar`). Examples: [menubar.examples.json](menubar.examples.json). Contract: [components.json](../../contracts/components.json). Base UI reference: [Menubar](https://base-ui.com/react/components/menubar). Its menus are [Menu](../menu/menu.md)s.

## Intent

- `ui-menubar`: keep an application's menus in one bar, moving between them with the arrow keys and the pointer.

## Usage

```html
<ui-menubar label="Editor">
  <ui-menu label="File"><div data-part="item">New</div><div data-part="item">Open…</div></ui-menu>
  <ui-menu label="Edit"><div data-part="item">Undo</div><div data-part="item">Redo</div></ui-menu>
  <ui-menu label="View"><div data-part="checkbox-item" checked>Ruler</div></ui-menu>
</ui-menubar>
```

```tsx
<Menubar label="Editor">
  <Menu label="File"><Menu.Item>New</Menu.Item><Menu.Item>Open…</Menu.Item></Menu>
  <Menu label="Edit"><Menu.Item>Undo</Menu.Item><Menu.Item>Redo</Menu.Item></Menu>
  <Menu.Root>
    <Menu.Trigger>View</Menu.Trigger>
    <Menu.Positioner><Menu.Popup><Menu.CheckboxItem defaultChecked>Ruler</Menu.CheckboxItem></Menu.Popup></Menu.Positioner>
  </Menu.Root>
</Menubar>
```

The bar's children are menus (presets or parts); their triggers become the bar's items (`role=menuitem`, no caret) with one tab stop. `orientation` is `horizontal` (default) or `vertical` (the menus then open beside the bar). One menu is open at a time: another opening closes the rest, which fire `openchange` with reason `sibling-open`. While a menu is open, hovering another trigger opens it at once (`trigger-hover`), and ArrowRight / ArrowLeft inside it switch to the adjacent menu (`list-navigation`). The menus keep their own API and events ([Menu](../menu/menu.md#usage)).

## Anatomy

| Base UI | Web component | React |
|---|---|---|
| Menubar | `ui-menubar` (host, role=menubar) | `Menubar` (`div[data-ui=menubar]`) |
| Menu.Root, Menu.Trigger, … | `ui-menu` children and their parts | `Menu.Root` / `Menu` children and their parts |

The bar has no parts of its own: it holds `ui-menu` elements.

```html
<ui-menubar orientation="vertical" label="Tools">
  <ui-menu><div data-part="trigger"><i slot="leading" name="pencil"></i>Draw</div><div data-part="popup"><div data-part="item">Pen</div><div data-part="item">Brush</div></div></ui-menu>
  <ui-menu><div data-part="trigger"><i slot="leading" name="shapes"></i>Shapes</div><div data-part="popup"><div data-part="item">Rectangle</div></div></ui-menu>
</ui-menubar>
```

```tsx
<Menubar orientation="vertical" label="Tools">
  <Menu.Root><Menu.Trigger leading={<i name="pencil" />}>Draw</Menu.Trigger><Menu.Popup><Menu.Item>Pen</Menu.Item><Menu.Item>Brush</Menu.Item></Menu.Popup></Menu.Root>
  <Menu.Root><Menu.Trigger leading={<i name="shapes" />}>Shapes</Menu.Trigger><Menu.Popup><Menu.Item>Rectangle</Menu.Item></Menu.Popup></Menu.Root>
</Menubar>
```

`Menubar` takes `render` and a `className` string or function of its state (`{ orientation, hasSubmenuOpen }`).

## Keyboard

| Element | Keys | Action |
|---|---|---|
| trigger | ArrowRight, ArrowLeft (mirrored in RTL); ArrowDown, ArrowUp when vertical | focus the next / previous enabled trigger, wrapping (with a menu open: open that one) |
| trigger | Home, End | focus the first / last enabled trigger |
| trigger | ArrowDown (ArrowRight when vertical), Enter, Space | open its menu on the first item |
| trigger | ArrowUp (horizontal) | open its menu on the last item |
| open menu | ArrowRight, ArrowLeft (horizontal bars) | close it and open the next / previous menu, on its first item |
| open menu | Escape | close it, focus back on its trigger |

Roving focus: the last focused trigger is the tab stop (tabindex 0, the others −1), else the first enabled one.

## State attributes

| Element | Attributes |
|---|---|
| `ui-menubar` / Menubar | `data-orientation`, `data-has-submenu-open` (a menu of the bar is open) |
| menus, triggers, popups, items | as in [Menu](../menu/menu.md#state-attributes) |

## Geometry and appearance

Geometry family: `menu` (resolver `resolveMenubar`). The bar is a composite on the control fill: edge D = max(B, 0.5u), padding D − B, the composite gap, one row 8u with the radius capped at half the height (uncapped when vertical). Its menus' triggers are composite options: 7u, inset Ic, the option radius concentric with the bar, labels 2u from a bare edge (1u beside a slot); transparent until hovered (`bg.control`), `bg.controlHover` while their menu is open; the focus ring is drawn inside the trigger, so it stays within the bar. The menus open 1u below their trigger (beside it when vertical), as in [Menu](../menu/menu.md#geometry-and-appearance). Styles: [menubar.recipe.ts](menubar.recipe.ts).

## Renderers and verification

- webComponent: completed (`./menubar.element.ts`)
- react: completed (`./menubar.react.tsx`)

React props: `npm run registry -- --assembly component:menubar` (under `react`).

Checks and their latest run: [verification/menubar.verification.json](verification/menubar.verification.json).
