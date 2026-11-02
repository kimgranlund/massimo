# Meter

`ui-meter`. API, defaults and avoidance guidance: [meter.manifest.json](meter.manifest.json) (`npm run registry -- component:meter`). Examples: [meter.examples.json](meter.examples.json). Contract: [components.json](../../contracts/components.json).

## Intent

Show a measurement within a known range, such as storage used or a password's strength ([Base UI Meter](https://base-ui.com/react/components/meter)). Task completion is a progress bar (`ui-progress`); a value the user sets is a range.

## Usage

```html
<ui-meter label="Battery" value="72"></ui-meter>
<ui-meter label="Storage" value="38.5" max="50" format='{"style":"unit","unit":"gigabyte"}'></ui-meter>
```

```tsx
import { Meter } from '@massimo/ui-kit/components/meter/react';
<Meter label="Storage" value={38.5} max={50} format={{ style: 'unit', unit: 'gigabyte' }} />
```

The value text is `formatNumber` from `@massimo/ui-kit/format` (U+2212 minus, a narrow no-break space before units): of the value with `format` (Intl.NumberFormat options; JSON in the attribute), else of the ratio as a whole percentage (`72%`). It is shown in the value part and is the meter's `aria-valuetext`, unless `value-text` (React `valueText`) gives another. `locale` picks the locale.

## Anatomy

### Both forms

Preset or parts ([components spec](../../../../docs/specs/components.md#composition)); the same DOM, classes and data-*.

```html
<ui-meter value="24"><span data-part="label">Strength</span><span data-part="value"></span><span data-part="track"><span data-part="indicator"></span></span></ui-meter>
```

```tsx
<Meter.Root value={24}>
  <Meter.Label>Strength</Meter.Label>
  <Meter.Value>{(formatted) => formatted}</Meter.Value>
  <Meter.Track><Meter.Indicator /></Meter.Track>
</Meter.Root>
```

Web component: authored parts are adopted (attributes and classes); the label part's text seeds `label`; the value part is always the formatted value. React: `Meter.Value` takes Base UI's children function `(formatted, value) => node`; the Root points `aria-labelledby` at a `Meter.Label` with content.

- `part:meter-label` `:scope > [data-part=label]`: the label, start of the text row; hidden when empty.
- `part:meter-value` `:scope > [data-part=value]`: the formatted value, end of the row, tabular figures; `aria-hidden` (the root's `aria-valuetext` says it).
- `part:track`, `part:track-indicator`: the progress track and its fill (`--ui-ratio`).

## Keyboard

None: a meter is not focusable.

## State attributes

None (Base UI Meter has no data attributes). The value is ARIA (`role=meter`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-valuetext`) and `--ui-ratio`.

## Events and values

| Renderer | Value | Events |
|---|---|---|
| `ui-meter` | `value`, `min`, `max`, `format`, `locale`, `value-text` | none |
| React Meter | `value`, `min`, `max`, `format`, `locale`, `valueText` | none |

## Geometry and appearance

Geometry family: `track` ([geometry-families.json](../../contracts/geometry-families.json), resolver `resolveMeter`: the progress track of `resolveTrack`, 4u with fill = ratio × width, under a label | value row in the control voice, column gap 2u, 1.5u above the track; CSS `--track`, `--track-r` in `styles/geometry.ts`). Styles: [meter.recipe.ts](meter.recipe.ts): the indicator is `primary.solid` on `bg.muted`, its width moves with the reveal intent.

## Renderers and verification

- webComponent: completed (`./meter.element.ts`)
- react: completed (`./meter.react.tsx`)

Checks and their latest run: [verification/meter.verification.json](verification/meter.verification.json).
