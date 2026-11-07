# Date picker

`ui-date-picker` (React `DatePicker`): choose a date from a popup calendar. API, defaults and avoidance guidance: [date-picker.manifest.json](date-picker.manifest.json).

## Usage

```html
<ui-date-picker label="Due date" name="due" value="2026-11-06"></ui-date-picker>
```

It submits one ISO date. Choosing a day closes the popup. For a calendar that's always open, use [`ui-calendar`](../calendar/calendar.md).

## Renderers and verification

Both renderers compose the kit's popover and calendar.
