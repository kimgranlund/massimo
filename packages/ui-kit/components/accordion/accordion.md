# Accordion

`ui-accordion` (React `Accordion`). API, defaults and avoidance guidance: [accordion.manifest.json](accordion.manifest.json) (`npm run registry -- component:accordion`). Examples: [accordion.examples.json](accordion.examples.json). Contract: [components.json](../../contracts/components.json). Base UI reference: [Accordion](https://base-ui.com/react/components/accordion).

## Intent

- `ui-accordion`: show one or several of a set of labelled sections, each under its own trigger.

## Usage

The items are [collapsibles](../collapsible/collapsible.md): every `ui-collapsible` child is an item.

```html
<ui-accordion default-value="shipping">
  <ui-collapsible value="shipping" label="Shipping"><p>Ships in 2–3 days.</p></ui-collapsible>
  <ui-collapsible value="returns" label="Returns"><p>30 days, free.</p></ui-collapsible>
</ui-accordion>
```

```tsx
<Accordion defaultValue={['shipping']} onValueChange={(value, { reason }) => …}>
  <Accordion.Item value="shipping" label="Shipping"><p>Ships in 2–3 days.</p></Accordion.Item>
  <Accordion.Item value="returns" label="Returns"><p>30 days, free.</p></Accordion.Item>
</Accordion>
```

The accordion owns the open state. `value` is the list of open item values (attribute: comma-separated; React: `string[]`, controlled), `defaultValue` (`default-value`) the first one; an item's value is its `value`, else its index. Without either, the items' `open` / `default-open` seed it (in single mode only the first). `multiple` lets several items be open; otherwise opening one closes the others. `disabled` disables every item (an item's own `disabled` disables it alone). `orientation="horizontal"` lays the items in a row and moves focus with Left / Right.

A trigger press fires the item's `openchange` (cancelable), then the accordion's `change` (cancelable: `preventDefault` keeps every item as it is) with `{ value: string[], reason: 'trigger-press', event }`. React: `onValueChange(value, details)` on the Root and `onOpenChange(open, details)` on each Item. Set the accordion's `value` from script, not an item's `open`.

## Anatomy

Parts (Base UI Accordion):

| Base UI | Web component | React |
|---|---|---|
| Accordion.Root | `ui-accordion` (host) | `Accordion.Root` / `Accordion` (`div[data-ui=accordion]`) |
| Accordion.Item | `ui-collapsible` child (`data-part=item`) | `Accordion.Item` (`div[data-ui=collapsible][data-part=item]`) |
| Accordion.Header | the item's `[data-part=header]` (role=heading, aria-level 3) | `Accordion.Header` |
| Accordion.Trigger | the item's `[data-part=trigger]` (role=button) | `Accordion.Trigger` (`<button>`) |
| Accordion.Panel | the item's `[data-part=panel]` (role=region) | `Accordion.Panel` |

- `part:accordion-item` `:scope > [data-part=item]`: one item, a ui-collapsible.
- `part:accordion-header` `:scope > [data-part=item] > [data-part=header]`: the heading around the item's trigger. Base UI renders an `<h3>`; both renderers here use `role=heading aria-level=3` on a div, so the page's heading styles do not reach it (`render={<h3 />}` gives an h3).

Preset items (`label` on the collapsible or the React Item) generate the header, trigger and panel. Written out:

```html
<ui-accordion>
  <ui-collapsible value="a">
    <div data-part="header"><div data-part="trigger"><i slot="leading" name="truck"></i>Shipping</div></div>
    <div data-part="panel"><p>Ships in 2–3 days.</p></div>
  </ui-collapsible>
</ui-accordion>
```

```tsx
<Accordion.Root>
  <Accordion.Item value="a">
    <Accordion.Header><Accordion.Trigger leading={<i name="truck" />}>Shipping</Accordion.Trigger></Accordion.Header>
    <Accordion.Panel><p>Ships in 2–3 days.</p></Accordion.Panel>
  </Accordion.Item>
</Accordion.Root>
```

Every part takes `render` and a `className` string or function of its state.

## Keyboard

| Element | Keys | Action |
|---|---|---|
| trigger | Enter, Space | open or close that item |
| trigger | ArrowDown, ArrowUp (horizontal: ArrowRight, ArrowLeft, mirrored in RTL) | focus the next / previous enabled trigger, wrapping |
| trigger | Home, End | focus the first / last enabled trigger |

Every trigger stays in the tab order (APG accordion); arrow keys move focus only.

## State attributes

Contract: [states.json](../../contracts/states.json); names follow [Base UI](https://base-ui.com).

| Element | Attributes |
|---|---|
| `ui-accordion` / Accordion.Root | `data-orientation`, `data-disabled` |
| item | `data-open` / `data-closed`, `data-disabled`, `data-index` |
| header | `data-open`, `data-disabled`, `data-index` |
| trigger | `data-panel-open`, `data-disabled`, `data-index` |
| panel | `data-open` / `data-closed`, `data-disabled`, `data-orientation`, `data-index` |

## Geometry and appearance

Geometry family: `disclosure` ([geometry-families.json](../../contracts/geometry-families.json), resolver `resolveDisclosure`). Each item is a collapsible: an 8u control-row trigger with a caret (icon size sm) and a panel whose text starts at the label edge (3u) and ends 2u below; the panel height animates on the reveal intent in CSS. Items are separated by a divider of the thin border-width token (1px) in the border role, outside the trigger's padding, so a closed item is 8u + 1px at any border setting (inline end when horizontal). Styles: [accordion.recipe.ts](accordion.recipe.ts) (the stack, dividers and header) over [collapsible.recipe.ts](../collapsible/collapsible.recipe.ts).

## Renderers and verification

- webComponent: completed (`./accordion.element.ts`)
- react: completed (`./accordion.react.tsx`)

React props: `npm run registry -- --assembly component:accordion` (under `react`).

Checks and their latest run: [verification/accordion.verification.json](verification/accordion.verification.json).
