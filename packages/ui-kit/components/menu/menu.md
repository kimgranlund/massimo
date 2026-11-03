# Menu

`ui-menu` (React `Menu`). API, defaults and avoidance guidance: [menu.manifest.json](menu.manifest.json) (`npm run registry -- component:menu`). Examples: [menu.examples.json](menu.examples.json). Contract: [components.json](../../contracts/components.json). Base UI reference: [Menu](https://base-ui.com/react/components/menu).

## Intent

- `ui-menu`: offer a list of actions or options from a trigger, shown on demand.

## Usage

Preset: the items alone, with `label`; the trigger (the label and a caret) and the popup are generated.

```html
<ui-menu label="Edit">
  <div data-part="item">Cut<span slot="suffix">⌘X</span></div>
  <div data-part="item">Copy<span slot="suffix">⌘C</span></div>
  <div data-part="separator"></div>
  <div data-part="item" disabled>Paste</div>
</ui-menu>
```

```tsx
<Menu label="Edit" onOpenChange={(open, { reason }) => …}>
  <Menu.Item suffix="⌘X" onClick={cut}>Cut</Menu.Item>
  <Menu.Item suffix="⌘C" onClick={copy}>Copy</Menu.Item>
  <Menu.Separator />
  <Menu.Item disabled>Paste</Menu.Item>
</Menu>
```

`open` (reflected; React controlled) and `defaultOpen` (`default-open`) follow Base UI. An interaction fires `openchange` (cancelable: `preventDefault` keeps the popup as it is) with `{ open, reason, event }`; React `onOpenChange(open, details)`. Reasons (Base UI's): `trigger-press`, `trigger-hover` (open-on-hover, submenus, or a hovered sibling closing a submenu), `list-navigation` (an arrow key opened it, or ArrowLeft closed a submenu), `item-press`, `outside-press`, `escape-key`, `focus-out`. Setting `open` fires nothing and leaves focus alone.

An item press is the item's `click`: listen on the item (React `onClick`) or on the host. It closes the whole menu (`close-on-click="false"`, React `closeOnClick={false}`, keeps it open). Checkbox items keep their state in the `checked` attribute and radio groups in `value`; a press toggles them and fires a cancelable `change` on the item (`{ checked, reason: 'item-press', event }`) or the group (`{ value, … }`); React `CheckboxItem` `checked` / `defaultChecked` / `onCheckedChange`, `RadioGroup` `value` / `defaultValue` / `onValueChange`. They stay open unless `close-on-click` is set.

`side` (`bottom`, `top`) and `align` (`start`, `center`, `end`) place the popup (React: `Menu.Positioner side align`); `open-on-hover` with `delay` (ms, default 100) opens on a resting pointer.

## Anatomy

| Base UI | Web component | React |
|---|---|---|
| Menu.Root | `ui-menu` (host) | `Menu.Root` (`div[data-ui=menu]`) |
| Menu.Trigger | `[data-part=trigger]` (role=button) | `Menu.Trigger` (`<button>`) |
| Menu.Portal, Menu.Positioner | the popup (top layer, placement) | `Menu.Portal`, `Menu.Positioner` (no element; `side`, `align`) |
| Menu.Popup | `[data-part=popup]` (role=menu, popover) | `Menu.Popup` |
| Menu.Item | `[data-part=item]` (role=menuitem) | `Menu.Item` |
| Menu.CheckboxItem, CheckboxItemIndicator | `[data-part=checkbox-item]`, its `[data-part=indicator]` (generated) | `Menu.CheckboxItem`, `Menu.CheckboxItemIndicator` (its default `leading`) |
| Menu.RadioGroup, RadioItem, RadioItemIndicator | `[data-part=radio-group]`, `[data-part=radio-item]`, `[data-part=indicator]` | `Menu.RadioGroup`, `Menu.RadioItem`, `Menu.RadioItemIndicator` |
| Menu.Group, GroupLabel | `[data-part=group]`, `[data-part=group-label]` | `Menu.Group`, `Menu.GroupLabel` |
| Menu.Separator | `[data-part=separator]` | `Menu.Separator` |
| Menu.SubmenuRoot, SubmenuTrigger | a nested `ui-menu` in the popup, its `[data-part=submenu-trigger]` | `Menu.SubmenuRoot`, `Menu.SubmenuTrigger` |

- `part:menu-trigger` `:scope > [data-part=trigger]`: the trigger, in the construction pattern `[leading] [prefix] [contents] [suffix] [trailing]` (children with `slot`).
- `part:menu-popup` `:scope > [data-part=popup]`: the popup (Base UI's positioner and popup in one element).
- `part:menu-item`, `part:menu-checkbox-item`, `part:menu-radio-item`, `part:menu-submenu-trigger`: items in the construction pattern; every kind also carries the `item` class.
- `part:menu-indicator`: a checkable item's indicator, in its leading slot.
- `part:menu-group`, `part:menu-group-label`, `part:menu-radio-group`, `part:menu-separator`.

```html
<ui-menu>
  <div data-part="trigger"><i slot="leading" name="sliders"></i>View</div>
  <div data-part="popup">
    <div data-part="checkbox-item" checked>Show grid</div>
    <div data-part="group">
      <div data-part="group-label">Sort by</div>
      <div data-part="radio-group" value="name">
        <div data-part="radio-item" value="name">Name</div>
        <div data-part="radio-item" value="date">Date</div>
      </div>
    </div>
    <div data-part="separator"></div>
    <ui-menu>
      <div data-part="submenu-trigger">Export</div>
      <div data-part="popup"><div data-part="item">PNG</div><div data-part="item">SVG</div></div>
    </ui-menu>
  </div>
</ui-menu>
```

```tsx
<Menu.Root>
  <Menu.Trigger leading={<i name="sliders" />}>View</Menu.Trigger>
  <Menu.Portal><Menu.Positioner><Menu.Popup>
    <Menu.CheckboxItem defaultChecked>Show grid</Menu.CheckboxItem>
    <Menu.Group>
      <Menu.GroupLabel>Sort by</Menu.GroupLabel>
      <Menu.RadioGroup defaultValue="name">
        <Menu.RadioItem value="name">Name</Menu.RadioItem>
        <Menu.RadioItem value="date">Date</Menu.RadioItem>
      </Menu.RadioGroup>
    </Menu.Group>
    <Menu.Separator />
    <Menu.SubmenuRoot>
      <Menu.SubmenuTrigger>Export</Menu.SubmenuTrigger>
      <Menu.Positioner><Menu.Popup><Menu.Item>PNG</Menu.Item><Menu.Item>SVG</Menu.Item></Menu.Popup></Menu.Positioner>
    </Menu.SubmenuRoot>
  </Menu.Popup></Menu.Positioner></Menu.Portal>
</Menu.Root>
```

Every part takes `render` and a `className` string or function of its state (the trigger `{ popupOpen, pressed, disabled }`; the popup `{ open, closed, side, align }`; an item `{ highlighted, disabled }`, a checkable one also `checked` / `unchecked`).

## Keyboard

| Element | Keys | Action |
|---|---|---|
| trigger | Enter, Space, ArrowDown | open on the first item (Enter / Space close it when open) |
| trigger | ArrowUp | open on the last item |
| popup | ArrowDown, ArrowUp | focus the next / previous enabled item, wrapping |
| popup | Home, End | focus the first / last enabled item |
| popup | a printable character | focus the next item starting with the typed text |
| item | Enter, Space | activate it (its click) |
| submenu trigger | ArrowRight (ArrowLeft in RTL), Enter, Space | open the submenu on its first item |
| submenu | ArrowLeft (ArrowRight in RTL) | close it, focus back on its trigger |
| any | Escape | close the topmost menu, focus back on its trigger |
| any | Tab | close (focus-out) and move on |

Focus moves to the highlighted item (every item tabindex −1); the pointer highlights the item under it, and resting on a submenu trigger opens its submenu after `delay`. While a submenu is open, a pointer moving toward it across other items (inside the triangle from the pointer to the submenu's near edge: Base UI's safe polygon) leaves the highlight and the submenu as they are; resting on an item for 300 ms, or turning away, highlights it and closes the submenu. A press on the trigger opens the popup with focus on the popup itself, so the first arrow key highlights the first item.

## State attributes

Contract: [states.json](../../contracts/states.json); names follow [Base UI](https://base-ui.com).

| Element | Attributes |
|---|---|
| trigger | `data-popup-open`, `data-pressed` (while open), `data-disabled` |
| popup | `data-open` / `data-closed`, `data-side`, `data-align` (while open) |
| item | `data-highlighted`, `data-disabled` |
| checkbox item, radio item | `data-checked` / `data-unchecked`, `data-highlighted`, `data-disabled` |
| indicator | `data-checked` / `data-unchecked`, `data-disabled` |
| submenu trigger | `data-popup-open`, `data-highlighted`, `data-disabled` |
| separator | `data-orientation` (horizontal) |

## Geometry and appearance

Geometry family: `menu` ([geometry-families.json](../../contracts/geometry-families.json), resolver `resolveMenu`).

- The trigger is a neutral control row: 8u, padding u − B inside the border, the control radius, the construction pattern (a preset's caret is trailing, icon size sm, and turns while open); `bg.control`, pressed `bg.controlActive` while open.
- The popup is a floating layer ([floating layers](../../../../docs/specs/components.md#floating-layers)): 1u below the trigger (beside a submenu trigger), at least as wide as its anchor, at most as tall as the space left (it scrolls), flipping when there is no room; `bg.overlay`, the border role, `md` shadow, the reveal motion. Its box is a composite: edge D = max(B, 0.5u), padding D − B, the composite gap, the control radius min(3u·s, 4u); items split the difference (R − D).
- Items, submenu triggers and group labels are composite options: 7u, inset Ic, the option radius concentric with the popup; labels 2u from a bare edge, 1u from a slot; a suffix (a shortcut) is `fg.muted`, 2u after the label, and the label fills the row so shortcuts line up at the end. Highlighted: `bg.control`. Disabled: 45%.
- Checkbox and radio items keep a 6u leading slot for the indicator (the `check` icon, or a 1.5u dot), in `primary.solid`, hidden but in place while unchecked, so labels align.
- A separator is the separator rule, max(1px, B), with 0.5u above and below beyond the gap.

Styles: [menu.recipe.ts](menu.recipe.ts) (placement variants `anchor`, `submenu`, `point`).

## Renderers and verification

- webComponent: completed (`./menu.element.ts`)
- react: completed (`./menu.react.tsx`)

React props: `npm run registry -- --assembly component:menu` (under `react`).

Checks and their latest run: [verification/menu.verification.json](verification/menu.verification.json).
