# Button

`ui-button`. API, defaults and avoidance guidance: [button.manifest.json](button.manifest.json) (`npm run registry -- component:button`). Examples: [button.examples.json](button.examples.json). Contract: [components.json](../../contracts/components.json).

## Intent

- `ui-button`: invoke an application-defined action; submit the owning form when type is submit; reset the owning form when type is reset.

## Usage

```html
<ui-button><i slot="leading" name="credit-card"></i><span slot="prefix">$</span>Pay 40<span slot="suffix">⌘P</span></ui-button>
<ui-button type="submit">Send</ui-button>
<ui-button aria-label="Add"><i slot="leading" name="plus"></i></ui-button>
<ui-button variant="primary">Save</ui-button>
```

React: `<Button variant="primary" leading={…} prefix="$" suffix="⌘P" trailing={…} iconSize="lg" size={3}>Pay</Button>` renders a native `<button data-ui="button">` with the same parts and the same recipe classes.

Plain HTML: the classes of the `button` slot recipe style any markup, e.g. `<button data-ui="button" class="ui-button__root ui-button__root--variant_primary"><span data-part="contents" class="ui-button__contents">Save</span></button>` (`data-ui` gives it the geometry variables).

## Composition

- In a row of related actions, wrap buttons in `<ui-container preset="group">` (1u gap).
- For exclusive selection among peers use `ui-segmented` with `ui-option` children, not buttons.
- The swiper paddles are ui-buttons; a framework that renders children into a ui-button must not re-key them (the button moves them into parts).

## Anatomy

### Both forms

One part (Base UI Button). Slot spans may be authored instead of `slot` attributes ([components spec](../../../../docs/specs/components.md#composition)); React's `render` swaps the element:

```html
<ui-button><span data-part="leading"><i name="plus"></i></span><span data-part="contents">Add</span><span data-part="suffix">⌘N</span></ui-button>
```

```tsx
<Button leading={<i name="plus" />} suffix="⌘N">Add</Button>
<Button render={<a href="/new" />}>New</Button>              {/* a link with the button's recipe class and data-* */}
<Button className={(state) => (state.busy ? 'saving' : '')} loading>Save</Button>
```

Construction pattern (shared by every labelled component):

```
[leading icon] [prefix] [contents: the label] [suffix] [trailing icon]
```

Icons sit in leading/trailing slots (6u on controls); prefix and suffix are short text adornments in the label color at 65%; empty parts are hidden. Label-wrapper padding: controls 2u at a bare edge, 1u beside a slot, text parts 1u apart; badge, tag and chip 1u′ on both sides (u′ = their height / 8); choices 1u after the indicator and 0 at the end. Parts: [parts.json](../../contracts/parts.json).

## Keyboard

| Element | Keys | Action |
|---|---|---|
| `ui-button` | Enter, Space | activate (click) |

## State attributes

Contract: [states.json](../../contracts/states.json); names follow [Base UI](https://base-ui.com); ARIA stays for semantics. Both renderers set the same attributes on the same elements; style with the conditions (`_checked`, `_invalid`, …), not ARIA.

| Element | Attributes |
|---|---|
| `ui-button` / Button | `data-disabled`; `data-busy` while `loading` (ours; Base UI has no loading state) |

## Geometry and appearance

Geometry families: `control` ([geometry-families.json](../../contracts/geometry-families.json), resolver `tokens/geometry/resolve.ts`, CSS `styles/geometry.ts`). Styles: the slot recipes in [button.recipe.ts](button.recipe.ts) (Panda `theme.slotRecipes`, one class per part, variants for finite attributes), applied by the web component and the React renderer alike; lengths read the geometry variables, colors are Spectrum roles, states use the shared conditions ([states.json](../../contracts/states.json), `styles/conditions.ts`), and motion and forced colors live in the same recipe.

## Renderers and verification

- webComponent: completed (`./button.element.ts`)
- react: completed (`./button.react.tsx`)
- html: in_progress

React props: `npm run registry -- --assembly component:button` (under `react`).

Checks and their latest run: [verification/button.verification.json](verification/button.verification.json).
