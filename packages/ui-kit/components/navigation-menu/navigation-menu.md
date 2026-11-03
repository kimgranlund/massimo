# Navigation menu

`ui-navigation-menu` (React `NavigationMenu`). API, defaults and avoidance guidance: [navigation-menu.manifest.json](navigation-menu.manifest.json) (`npm run registry -- component:navigation-menu`). Examples: [navigation-menu.examples.json](navigation-menu.examples.json). Contract: [components.json](../../contracts/components.json). Base UI reference: [Navigation Menu](https://base-ui.com/react/components/navigation-menu).

## Intent

- `ui-navigation-menu`: move between the sections of a site from a bar of links, some of which open a panel of more links.

## Usage

```html
<ui-navigation-menu label="Main">
  <div data-part="item" label="Docs">
    <a href="/docs/intro">Introduction</a>
    <a href="/docs/geometry" active>Geometry</a>
  </div>
  <div data-part="item"><a data-part="link" href="/blog">Blog</a></div>
</ui-navigation-menu>
```

```tsx
<NavigationMenu label="Main" onValueChange={(value, { reason }) => …}>
  <NavigationMenu.Item label="Docs">
    <NavigationMenu.Link href="/docs/intro">Introduction</NavigationMenu.Link>
    <NavigationMenu.Link href="/docs/geometry" active>Geometry</NavigationMenu.Link>
  </NavigationMenu.Item>
  <NavigationMenu.Item><NavigationMenu.Link href="/blog">Blog</NavigationMenu.Link></NavigationMenu.Item>
</NavigationMenu>
```

An item with `label` gets a trigger and its children become its content; an item holding one link is a plain link. `value` names the open item (`''` when closed; an item's `value` attribute, else its index) and `default-value` (React `defaultValue`) opens one at first. Hover opens an item after `delay` ms (default 50; moving between triggers while open switches at once) and closes it `close-delay` ms (default 50) after the pointer leaves the triggers and the popup; a press toggles it (a press on the item hover opened keeps it open). Escape, an outside press or focus leaving close it; a link with `close-on-click` (React `closeOnClick`) closes it when pressed. Each change fires `change` (cancelable) with `{ value, reason, event }`, reasons `trigger-hover`, `trigger-press`, `list-navigation`, `escape-key`, `outside-press`, `focus-out`, `link-press`; React calls `onValueChange(value, { reason, event })`. `active` on a link marks the current page (`data-active`, `aria-current=page`). `orientation="vertical"` stacks the list and opens contents to its side.

Submenus (Base UI: a Root inside a Content): a `ui-navigation-menu` (React `NavigationMenu` or `NavigationMenu.Root`) inside an item's content is a nested menu. It is vertical unless `orientation` is set, has no landmark of its own (a `div`, `data-nested`), and its triggers carry a `caret-right` (mirrored in RTL) that points where its content opens: beside the trigger, 1u away, top-aligned, as a menu's submenu. Hover, presses and keys work as in the top menu (ArrowRight opens a vertical trigger into its content); Escape, an outside press or focus leaving close the submenu first; switching or closing the parent's item closes it; a `close-on-click` link in it closes the whole menu.

```html
<ui-navigation-menu label="Main">
  <div data-part="item" label="Docs">
    <a href="/docs/intro">Introduction</a>
    <ui-navigation-menu>
      <div data-part="item" label="Guides"><a href="/guides/start">Getting started</a></div>
    </ui-navigation-menu>
  </div>
</ui-navigation-menu>
```

## Anatomy

Parts (Base UI Navigation Menu):

| Base UI | Web component | React |
|---|---|---|
| NavigationMenu.Root | `ui-navigation-menu` (role=navigation, `label`) | `NavigationMenu.Root` (`<nav>`) |
| NavigationMenu.List | `[data-part=list]` (role=list; generated around the items, or authored, `ul` works) | `NavigationMenu.List` |
| NavigationMenu.Item | `[data-part=item]` (role=listitem; `li` works) | `NavigationMenu.Item` (`value`; preset `label`) |
| NavigationMenu.Trigger | `[data-part=trigger]` (role=button; generated from `label`) | `NavigationMenu.Trigger` (`<button>`) |
| NavigationMenu.Icon | the trigger's trailing caret | the Trigger's `trailing` (default a caret) |
| NavigationMenu.Content | `[data-part=content]` (moved into the viewport) | `NavigationMenu.Content` (rendered into the Viewport) |
| NavigationMenu.Link | `a` / `[data-part=link]` | `NavigationMenu.Link` (`active`, `closeOnClick`) |
| NavigationMenu.Positioner | `[data-part=positioner]` (popover=manual, generated) | `NavigationMenu.Positioner` |
| NavigationMenu.Popup | `[data-part=popup]` | `NavigationMenu.Popup` |
| NavigationMenu.Viewport | `[data-part=viewport]` | `NavigationMenu.Viewport` |

- `part:navigation-menu-list` `:scope > [data-part=list]`; `part:navigation-menu-item` `… > [data-part=item]`; `part:navigation-menu-trigger` `… > [data-part=trigger]`: the construction pattern `[leading] [prefix] [contents] [suffix] [trailing]` with a `caret-down` icon in trailing.
- `part:navigation-menu-content` `:scope > [data-part=positioner] > [data-part=popup] > [data-part=viewport] > [data-part=content]`; `part:navigation-menu-link` `[data-part=link]`; `part:navigation-menu-positioner`, `-popup`, `-viewport`.

```html
<ui-navigation-menu label="Main">
  <ul data-part="list">
    <li data-part="item" value="learn">
      <div data-part="trigger"><i slot="leading" name="book-open"></i>Learn</div>
      <div data-part="content"><a href="/guides" active>Guides</a><a href="/api" close-on-click>API</a></div>
    </li>
    <li data-part="item"><a data-part="link" href="/about">About</a></li>
  </ul>
</ui-navigation-menu>
```

```tsx
<NavigationMenu.Root label="Main">
  <NavigationMenu.List>
    <NavigationMenu.Item value="learn">
      <NavigationMenu.Trigger leading={<i name="book-open" />}>Learn</NavigationMenu.Trigger>
      <NavigationMenu.Content>
        <NavigationMenu.Link href="/guides" active>Guides</NavigationMenu.Link>
      </NavigationMenu.Content>
    </NavigationMenu.Item>
  </NavigationMenu.List>
  <NavigationMenu.Positioner><NavigationMenu.Popup><NavigationMenu.Viewport /></NavigationMenu.Popup></NavigationMenu.Positioner>
</NavigationMenu.Root>
```

Every React part takes `render` and a `className` string or function of its state.

## Keyboard

| Element | Keys | Action |
|---|---|---|
| list | ArrowLeft / ArrowRight (ArrowUp / ArrowDown when vertical; mirrored in RTL), Home, End | move between triggers and links (wrapping) |
| trigger | Enter, Space | toggle its content |
| trigger | ArrowDown (ArrowRight when vertical) | open its content and focus its first link |
| trigger, content | Tab, Shift+Tab | from an open trigger into its content; from its last link on to the next item; Shift+Tab from the first link back to the trigger |
| anywhere | Escape | close; focus returns to the trigger |

## State attributes

Contract: [states.json](../../contracts/states.json); names follow [Base UI](https://base-ui.com).

| Element | Attributes |
|---|---|
| `ui-navigation-menu` / Root, list | `data-orientation` (ours) |
| trigger | `data-popup-open` while its content is open, `data-disabled` |
| content | `data-open` / `data-closed`; `data-activation-direction` (`left`, `right`, `up`, `down`) when it replaced another item's content |
| link | `data-active` (the current page) |
| positioner, popup | `data-open` / `data-closed`; while open `data-side`, `data-align`; positioner `data-placement` (ours) |

Popup variables (Base UI): `--popup-width`, `--popup-height` (the open content's size in px, set by script), and the positioner variables of the [popover](../popover/popover.md#state-attributes).

## Geometry and appearance

Geometry family: `popup` ([geometry-families.json](../../contracts/geometry-families.json), resolver `resolveNavigationMenu`). The list is a composite row without a fill: 8u tall (edge 0.5u, padding 0.5u − B), the composite gap between items; triggers and links are composite options (7u, inset 0.5u, the label 2u from a bare edge and 1u beside a slot), the trigger's caret at icon size sm in its trailing slot, turned 180° while open (toggle intent); hover and the open trigger lay the control fill on them; the active link takes the primary text colour. The popup sits 1u below the open trigger (beside it when vertical), aligned to its start: a composite container (edge 0.5u, radius (3 + 0.5)u·s) on the overlay fill whose content's links are composite options too, at most 120u wide. Switching items animates the popup's width and height to the new content and slides the content in 2u from the side it came from, on the reveal intent. Styles: [navigation-menu.recipe.ts](navigation-menu.recipe.ts) on the shared [popup-parts.ts](../popover/popup-parts.ts).

## Renderers and verification

- webComponent: completed (`./navigation-menu.element.ts`, behavior in `dom/navigation.ts`)
- react: completed (`./navigation-menu.react.tsx`, the same `dom/navigation.ts` controller)

React props: `npm run registry -- --assembly component:navigation-menu` (under `react`).

Checks and their latest run: [verification/navigation-menu.verification.json](verification/navigation-menu.verification.json).
