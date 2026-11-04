# Separator

`ui-separator`. API, defaults and avoidance guidance: [separator.manifest.json](separator.manifest.json) (`npm run registry -- component:separator`). Examples: [separator.examples.json](separator.examples.json). Contract: [components.json](../../contracts/components.json).

## Intent

Divide groups of content in a list, menu, toolbar or panel with a visible rule ([Base UI Separator](https://base-ui.com/react/components/separator)).

## Usage

```html
<ui-container preset="collection"><span>Account</span><span>Billing</span><ui-separator></ui-separator><span>Sign out</span></ui-container>
<ui-container preset="group"><ui-button>Cut</ui-button><ui-separator orientation="vertical"></ui-separator><ui-button>Paste</ui-button></ui-container>
```

```tsx
import { Separator } from '@massimo/ui-kit/components/separator/react';
<Separator />
<Separator orientation="vertical" />
```

The separator has no margin: the container's gap spaces it from its neighbours. A vertical separator takes its height from its flex or grid line, so put it in a row (a group, a toolbar).

## Anatomy

### Both forms

One part, the host (Base UI Separator has no parts). The preset is the part.

```html
<ui-separator orientation="vertical"></ui-separator>
```

```tsx
<Separator orientation="vertical" render={<hr />} className={(s) => (s.orientation === 'vertical' ? 'v' : 'h')} />
```

Web component: the host is the rule (`role=separator`, `aria-orientation`). React: a `<div role="separator">`; `render` replaces the element (the recipe class and data-* stay), and `className` may be a function of the state `{ orientation }`.

## Keyboard

None: the separator is not focusable.

## State attributes

Contract: [states.json](../../contracts/states.json); names follow [Base UI](https://base-ui.com).

| Element | Attributes |
|---|---|
| `ui-separator` / Separator | `data-orientation` (`horizontal`, `vertical`) |

## Events and values

None.

## Geometry and appearance

Geometry family: `separator` ([geometry-families.json](../../contracts/geometry-families.json), resolver `resolveSeparator` in `tokens/geometry/resolve.ts`, CSS `--separator` in `styles/geometry.ts`): thickness max(1px, B) with B = min(border, u/2), so a hairline at B = 0 and 1 and the theme border above. Color: the `border` role; forced colors paint it `CanvasText`. Styles: [separator.recipe.ts](separator.recipe.ts).

## Renderers and verification

- webComponent: completed (`./separator.element.ts`)
- react: completed (`./separator.react.tsx`)

Checks and their latest run: [verification/separator.verification.json](verification/separator.verification.json).
