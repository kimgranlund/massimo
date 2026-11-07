# Calendar

`ui-calendar` (React `Calendar`): a keyboard-navigable month grid. API, defaults and avoidance guidance: [calendar.manifest.json](calendar.manifest.json).

## Usage

```html
<ui-calendar name="due" value="2026-11-06" min="2026-01-01"></ui-calendar>
```

```tsx
<Calendar defaultValue="2026-11-06" onValueChange={setDue} />
```

- Values are ISO dates, and `mode="range"` takes `start/end`. Day and month names come from `Intl`, following `locale`.
- Arrow keys move a day or a week, Home and End the week, PageUp and PageDown a month, and with Shift a year. Enter and Space choose.
- For a field that opens a calendar, use [`ui-date-picker`](../date-picker/date-picker.md).

## Geometry and appearance

Cells are 8u square, and the selected day takes the primary solid. Today has an inset ring (`resolveCalendar`).

## Renderers and verification

Both renderers share `dom/calendar.ts` and `dom/grid-nav.ts`-style keys. Dates are computed in UTC, so a time zone can't shift a day.
