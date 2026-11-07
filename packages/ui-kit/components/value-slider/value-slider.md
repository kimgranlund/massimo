# Value slider

`ui-value-slider` (React `ValueSlider`): a range with its label and value inside the track. API, defaults and avoidance guidance: [value-slider.manifest.json](value-slider.manifest.json).

## Usage

```html
<ui-value-slider label="u" unit="px" min="2" max="12" step="0.5" value="4.5"></ui-value-slider>
```

```tsx
<ValueSlider label="u" unit="px" min={2} max={12} step={0.5} defaultValue={4.5} />
```

- It's compact, for panels of tunable numbers. For a form with room, use [`ui-field`](../field/field.md) with `ui-range`.
- It wraps the kit's range, so keyboard, pointer and form behavior are the same.

## Geometry and appearance

The track is a control's height, with the label and value 2u from its ends and a thin bar for a thumb (`resolveValueSlider`).

## Renderers and verification

Both renderers wrap the kit's range.
