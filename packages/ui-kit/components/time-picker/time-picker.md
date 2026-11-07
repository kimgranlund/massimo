# Time picker

`ui-time-picker` (React `TimePicker`): enter a wall-clock time. API, defaults and avoidance guidance: [time-picker.manifest.json](time-picker.manifest.json).

## Usage

```html
<ui-time-picker label="Start time" name="start" value="09:30" step="15"></ui-time-picker>
```

Type a time or pick a suggestion. `9:30 pm`, `2130` and `21:30` all mean the same time, and the form gets `HH:MM`. `step` sets the suggestions in minutes. A time has no date or zone.

## Renderers and verification

Both renderers wrap the kit's autocomplete.
