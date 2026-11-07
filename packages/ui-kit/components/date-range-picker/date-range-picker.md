# Date range picker

`ui-date-range-picker` (React `DateRangePicker`): edit and apply one inclusive date range. API, defaults and avoidance guidance: [date-range-picker.manifest.json](date-range-picker.manifest.json).

## Usage

```html
<ui-date-range-picker label="Report period" name="period" value="2026-11-01/2026-11-30"></ui-date-range-picker>
```

The value is `start/end` in ISO dates. Picking two days fills the range in either order. The value and the form change only on Apply.

## Renderers and verification

Both renderers compose the kit's popover, calendar and buttons.
