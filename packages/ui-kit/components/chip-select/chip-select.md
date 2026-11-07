# Chip select

`ui-chip-select` (React `ChipSelect`): a compact choice beside the content it affects. API, defaults and avoidance guidance: [chip-select.manifest.json](chip-select.manifest.json).

## Usage

```html
<ui-chip-select label="Sort" hide-label name="sort" value="new">
  <ui-option value="new">Newest</ui-option>
  <ui-option value="top">Top rated</ui-option>
</ui-chip-select>
```

It's `ui-select` at chip size, so the popup, keyboard and form value are the same. Use `ui-select` in a form with room for a full field.

## Geometry and appearance

The trigger is 6u tall and hugs its value. The popup is the select's.

## Renderers and verification

Both renderers wrap the kit's select.
