# Tabs

`ui-tabs` (React `Tabs`). API, defaults and avoidance guidance: [tabs.manifest.json](tabs.manifest.json) (`npm run registry -- component:tabs`). Examples: [tabs.examples.json](tabs.examples.json). Contract: [components.json](../../contracts/components.json). Base UI reference: [Tabs](https://base-ui.com/react/components/tabs).

## Intent

- `ui-tabs`: switch between peer panels that share one area, from a list naming each.

## Usage

Preset: panels alone, each with a `label`; the list, its tabs and the indicator are generated.

```html
<ui-tabs label="Project">
  <div data-part="panel" value="overview" label="Overview">…</div>
  <div data-part="panel" value="activity" label="Activity">…</div>
</ui-tabs>
```

```tsx
<Tabs label="Project" variant="underline" onValueChange={(value, { reason }) => …}
  items={[{ value: 'overview', label: 'Overview', content: … }, { value: 'activity', label: 'Activity', content: … }]} />
```

`value` (the active tab; React controlled) and `defaultValue` (`default-value`) follow Base UI; the default is the first enabled tab. Tab and panel values are their `value` attributes, else their index. `variant` is `segmented` (default) or `underline`; `orientation` `horizontal` (default) or `vertical`; `activate-on-focus` (React `Tabs.List activateOnFocus`) makes arrow-key focus activate the tab. A user change fires `change` (cancelable: `preventDefault` keeps the current tab) with `{ value, reason: 'none', event }` (Base UI's reason for user changes); React `onValueChange(value, details)`. Setting `value` from script fires nothing.

## Anatomy

| Base UI | Web component | React |
|---|---|---|
| Tabs.Root | `ui-tabs` (host) | `Tabs.Root` (`div[data-ui=tabs]`) |
| Tabs.List | `[data-part=list]` (role=tablist) | `Tabs.List` |
| Tabs.Tab | `[data-part=list] > [data-part=tab]` (role=tab) | `Tabs.Tab` (`<button role=tab>`) |
| Tabs.Indicator | `[data-part=list] > [data-part=indicator]` (generated when absent) | `Tabs.Indicator` |
| Tabs.Panel | `[data-part=panel]` (role=tabpanel) | `Tabs.Panel` |

- `part:tabs-list` `:scope > [data-part=list]`: the tablist.
- `part:tabs-tab` `:scope > [data-part=list] > [data-part=tab]`: a tab in the construction pattern `[leading] [prefix] [contents] [suffix] [trailing]` (children with `slot`).
- `part:tabs-indicator` `:scope > [data-part=list] > [data-part=indicator]`: the active tab's marker.
- `part:tabs-panel` `:scope > [data-part=panel]`: a panel, hidden while inactive.

```html
<ui-tabs variant="underline" default-value="files" label="Repository">
  <div data-part="list">
    <div data-part="tab" value="code"><i slot="leading" name="code"></i>Code</div>
    <div data-part="tab" value="files">Files<span slot="suffix">12</span></div>
    <div data-part="tab" value="wiki" disabled>Wiki</div>
  </div>
  <div data-part="panel" value="code">…</div>
  <div data-part="panel" value="files">…</div>
  <div data-part="panel" value="wiki">…</div>
</ui-tabs>
```

```tsx
<Tabs.Root variant="underline" defaultValue="files">
  <Tabs.List label="Repository">
    <Tabs.Tab value="code" leading={<i name="code" />}>Code</Tabs.Tab>
    <Tabs.Tab value="files" suffix="12">Files</Tabs.Tab>
    <Tabs.Tab value="wiki" disabled>Wiki</Tabs.Tab>
    <Tabs.Indicator />
  </Tabs.List>
  <Tabs.Panel value="code">…</Tabs.Panel>
  <Tabs.Panel value="files">…</Tabs.Panel>
  <Tabs.Panel value="wiki">…</Tabs.Panel>
</Tabs.Root>
```

Every part takes `render` and a `className` string or function of its state (`{ orientation, activationDirection }`; a tab also `active`, `disabled`; a panel `hidden`).

### Indicator variables

Base UI's: `--active-tab-left`, `--active-tab-top`, `--active-tab-right`, `--active-tab-bottom`, `--active-tab-width`, `--active-tab-height`, px from the active tab's box in the list, set on the indicator by script after layout and whenever the list resizes (both renderers; none in React server markup, where the indicator has no size until hydration). The recipe places the indicator with them (`translate`, `width`, `height`), so it slides on the toggle intent. Before the first change `data-activation-direction` is `none` and the indicator does not animate.

## Keyboard

| Element | Keys | Action |
|---|---|---|
| tab | ArrowRight, ArrowLeft (mirrored in RTL); ArrowDown, ArrowUp when vertical | focus the next / previous enabled tab, wrapping (with activate-on-focus: activate it) |
| tab | Home, End | focus the first / last enabled tab |
| tab | Enter, Space | activate it |

Roving focus: the active tab is the list's tab stop (tabindex 0, the others −1); Tab moves on to the active panel (tabindex 0).

## State attributes

Contract: [states.json](../../contracts/states.json); names follow [Base UI](https://base-ui.com).

| Element | Attributes |
|---|---|
| `ui-tabs` / Tabs.Root | `data-orientation`, `data-activation-direction` |
| list, indicator | `data-orientation`, `data-activation-direction` |
| tab | `data-active`, `data-disabled`, `data-orientation`, `data-activation-direction` |
| panel | `data-hidden`, `data-orientation`, `data-activation-direction` (and structural `data-index`) |

## Geometry and appearance

Geometry family: `disclosure` ([geometry-families.json](../../contracts/geometry-families.json), resolver `resolveTabs`). The list sits 2u above the panels (beside them when vertical).

- **segmented**: the list is a composite on the control fill (edge D = max(B, 0.5u), one row 8u, radius capped at half the height); tabs are composite options (7u, inset Ic, the option radius), muted until hovered or active; the indicator is the active tab's box, `bg.selected` with a small shadow, so the active label reads `fg.selected` on it.
- **underline**: tabs are 8u control rows (padding u − B inside a transparent border) side by side over a track of the thin border-width token (1px, border role) on the list's end edge; the indicator is a 0.5u `primary.solid` bar (radius 0.25u) on the track under the active tab (on the inline-end edge when vertical).

Tab labels use the construction pattern (2u at a bare edge, 1u beside a slot); the focus ring is drawn inside the tab, so it stays within the list. Styles: [tabs.recipe.ts](tabs.recipe.ts).

## Renderers and verification

- webComponent: completed (`./tabs.element.ts`)
- react: completed (`./tabs.react.tsx`)

React props: `npm run registry -- --assembly component:tabs` (under `react`).

Checks and their latest run: [verification/tabs.verification.json](verification/tabs.verification.json).
