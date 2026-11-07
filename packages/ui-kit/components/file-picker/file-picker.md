# File picker

`ui-file-picker` (React `FilePicker`): choose local files for a form, with a button or by dropping them. API, defaults and avoidance guidance: [file-picker.manifest.json](file-picker.manifest.json).

## Usage

```html
<ui-file-picker label="Attachment" name="attachment" accept="image/*,.pdf" description="PNG or PDF."></ui-file-picker>
```

```tsx
<FilePicker label="Attachment" name="attachment" accept="image/*,.pdf" onFiles={setFiles} />
```

- `accept` also applies to dropped files, which the platform's picker doesn't check.
- The web tag submits through `UIFormElement`. It keeps no native input in the page.
- Files stay on the device until your form submits them. The picker doesn't upload.

## Geometry and appearance

A button and the chosen name sit in a muted strip, 2u apart, with a dashed outline while dragging.

## Renderers and verification

The web tag opens the platform's picker from an input that never joins the page. React uses a hidden native input.
