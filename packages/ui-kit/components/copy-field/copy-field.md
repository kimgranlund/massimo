# Copy field

`ui-copy-field` (React `CopyField`): a value to copy, such as a link or a key. API, defaults and avoidance guidance: [copy-field.manifest.json](copy-field.manifest.json).

## Usage

```html
<ui-copy-field label="Share link" value="massimo.app/p/mercury"></ui-copy-field>
```

```tsx
<CopyField label="Share link" value="massimo.app/p/mercury" />
```

- The value is read-only, so people can still select it. The button shows a check for a moment after copying.
- A hidden status tells screen readers when it's copied, or that the browser refused.
- The web tag fires `copy-value` after a copy, and React calls `onCopy`.

## Geometry and appearance

It's a `ui-input` with an inline action, so the sizes are the field's (`resolveFieldAction`). The value uses the mono face.

## Renderers and verification

Both renderers compose the kit's input and button.
