# Button

`ui-button`. API, defaults and avoidance guidance: [button.manifest.json](button.manifest.json) (`npm run registry -- component:button`). Examples: [button.examples.json](button.examples.json). Contract: [components.json](../../contracts/components.json).

## Intent

- `ui-button`: invoke an application-defined action; submit the owning form when type is submit; reset the owning form when type is reset.

## Usage

```html
<ui-button><i slot="leading" name="credit-card"></i><span slot="prefix">$</span>Pay 40<span slot="suffix">⌘P</span></ui-button>
<ui-button type="submit">Send</ui-button>
<ui-button aria-label="Add"><i slot="leading" name="plus"></i></ui-button>
```

React: `<Button leading={…} prefix="$" suffix="⌘P" trailing={…} iconSize="lg" size={3}>Pay</Button>` renders a native `<button data-ui="button">` with the same parts and styles.

## Composition

- In a row of related actions, wrap buttons in `ui-group` (1u gap).
- For exclusive selection among peers use `ui-segmented` with `ui-option` children, not buttons.
- The swiper paddles are ui-buttons; a framework that renders children into a ui-button must not re-key them (the button moves them into parts).

## Anatomy

Construction pattern (shared by every labelled component):

```
[leading icon] [prefix] [contents: the label] [suffix] [trailing icon]
```

Icons sit in 6u leading/trailing slots; prefix and suffix are short text adornments in the label color at 65%; empty parts are hidden. Text parts sit 1u apart, 1u beside a slot, and at the bare edge 2u (controls), 1u (tag, chip) or 0 (choices). Parts: [parts.json](../../contracts/parts.json).

## Keyboard

| Element | Keys | Action |
|---|---|---|
| `ui-button` | Enter, Space | activate (click) |

## Geometry and appearance

Geometry families: `control` ([geometry-families.json](../../contracts/geometry-families.json), resolver `tokens/geometry/resolve.ts`, CSS `styles/geometry.ts`). Colors are Spectrum roles; states are keyed on ARIA and `data-*` ([states.json](../../contracts/states.json), `styles/defaults.ts`); motion in `styles/motion.ts`.

## Renderers and verification

- webComponent: completed (`./button.element.ts`)
- react: in_progress (`./button.react.tsx`)
- html: in_progress

Checks and their latest run: [verification/button.verification.json](verification/button.verification.json).
