# Spinner

`ui-spinner` (React `Spinner`): a ring for pending work of unknown length. API, defaults and avoidance guidance: [spinner.manifest.json](spinner.manifest.json).

## Intent

Show that something is happening when you can't say how far along it is. With a known amount, use [`ui-progress`](../range/range.md). Mount it while work is pending, and remove it when the work ends.

## Usage

```html
<ui-spinner></ui-spinner>
<ui-spinner label="Saving changes"></ui-spinner>
<ui-spinner label="Loading results" hide-label></ui-spinner>
```

```tsx
<Spinner label="Saving changes" />
```

- `label` is the visible text and the accessible name. With no label the name is "Loading". Name what's happening when you can.
- `hide-label` keeps the name and drops the text, for tight spaces.
- It's a polite status: screen readers announce it once, without moving focus. It has no focus stop.

## Geometry and appearance

The ring is 4u with a u/2 stroke, 2u from the label (`resolveSpinner`). It paints in the surrounding text color, so it works on any surface, and it follows `size`. One turn takes three `reveal` durations at a linear pace. Under reduced motion the ring stays still.

## Renderers and verification

Both renderers set `role="status"` and the same parts. `apps/studio/geometry-check.html` compares the ring, stroke and gap with the resolver; `react-check.html` compares the twins.
