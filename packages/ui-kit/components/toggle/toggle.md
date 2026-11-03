# Toggle

`ui-toggle`. API, defaults and avoidance guidance: [toggle.manifest.json](toggle.manifest.json) (`npm run registry -- component:toggle`). Examples: [toggle.examples.json](toggle.examples.json). Contract: [components.json](../../contracts/components.json).

## Intent

Turn one option or mode on and off with a button that shows its pressed state, such as bold in a text toolbar ([Base UI Toggle](https://base-ui.com/react/components/toggle)). A setting that reads as on / off is a switch; one of several exclusive options is a segmented control.

## Usage

```html
<ui-group>
  <ui-toggle aria-label="Bold" pressed><i slot="leading" name="text-b"></i></ui-toggle>
  <ui-toggle aria-label="Italic"><i slot="leading" name="text-italic"></i></ui-toggle>
</ui-group>
<ui-toggle default-pressed><i slot="leading" name="star"></i>Favorite</ui-toggle>
```

```tsx
import { Toggle } from '@massimo/ui-kit/components/toggle/react';
<Toggle aria-label="Bold" leading={<i name="text-b" />} pressed={bold} onPressedChange={(next) => setBold(next)} />
```

Keep the label the same in both states: `aria-pressed` says whether it is on. An icon-only toggle needs an `aria-label`.

## Anatomy

### Both forms

One part, the button, with the construction pattern `[leading] [prefix] [contents] [suffix] [trailing]` ([components spec](../../../../docs/specs/components.md#composition)).

```html
<ui-toggle pressed><span data-part="leading"><i name="star"></i></span><span data-part="contents">Favorite</span></ui-toggle>
```

```tsx
<Toggle defaultPressed leading={<i name="star" />} render={<button />} className={(s) => (s.pressed ? 'on' : undefined)}>Favorite</Toggle>
```

Web component: the host is the button (`role=button`, `aria-pressed`); children with `slot` move into the parts, authored `span[data-part]` slots are kept. React: a native `<button type="button" aria-pressed>`; `render` replaces it (the recipe class and data-* stay), `className` may be a function of the state `{ pressed, disabled }`.

## Keyboard

| Keys | Action |
|---|---|
| Enter, Space | flip pressed (as a click) |

## State attributes

Contract: [states.json](../../contracts/states.json); names follow [Base UI](https://base-ui.com).

| Element | Attributes |
|---|---|
| `ui-toggle` / Toggle | `data-pressed` while on, `data-disabled` |

## Events and values

| Renderer | Value | Events / callbacks |
|---|---|---|
| `ui-toggle` | `pressed`, `defaultPressed` (`default-pressed`) | `change`: `detail { pressed, reason: 'none', event }`, cancelable (`preventDefault` keeps the state) |
| React Toggle | `pressed`, `defaultPressed` | `onPressedChange(pressed, { reason: 'none', event })`; the native `onClick` still fires |

`value` identifies a toggle inside a [toggle group](../toggle-group/toggle-group.md) (`ui-toggle-group`, React `ToggleGroup`), which then owns its pressed state, disables it with itself and sets its roving tab index; a toggle has no form value. In a group a toggle is a composite option (7u, no fill until hovered, the raised selected fill while pressed).

## Geometry and appearance

Geometry family: `control` ([geometry-families.json](../../contracts/geometry-families.json): `resolveControl`, `resolveButtonContents`, `resolveTextRun`, `resolveIcon`): the button's 8u height, 6u slots, padding u − B and radius min(3u·s, 4u). Styles: [toggle.recipe.ts](toggle.recipe.ts) is the button recipe plus the pressed state: the primary solid with the contrast text (`fg.onSolid`), `primary.solidHover` on hover; forced colors paint it `Highlight`.

## Renderers and verification

- webComponent: completed (`./toggle.element.ts`)
- react: completed (`./toggle.react.tsx`)

Checks and their latest run: [verification/toggle.verification.json](verification/toggle.verification.json).
