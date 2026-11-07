# Color picker

`ui-color-picker` (React `ColorPicker`): edit a color's OKLCH channels and accept or cancel. API, defaults and avoidance guidance: [color-picker.manifest.json](color-picker.manifest.json).

## Usage

```html
<ui-color-picker label="Accent" name="accent" value="oklch(0.6 0.15 250)"></ui-color-picker>
```

```tsx
<ColorPicker label="Accent" name="accent" onValueChange={setAccent} />
```

- Dragging changes a draft. The value and the form change only on Apply, and Cancel or dismissing the popover discards it.
- The value is an `oklch()` string. For a fixed set of colors, use `ui-palette`.

## Geometry and appearance

A trigger with a swatch opens a popover holding a 10u preview and three ranges, 2u apart, 56u wide. Sizes come from the kit's button, popover and range.

## Renderers and verification

Both renderers compose the kit's popover, range and button.
