# Selection control

`ui-selection-control` (React `SelectionControl`): a control beside its label and live value. API, defaults and avoidance guidance: [selection-control.manifest.json](selection-control.manifest.json).

## Usage

```html
<ui-selection-control label="Volume" unit="%"><ui-range label="Volume" value="40"></ui-range></ui-selection-control>
<ui-selection-control label="Auto-save"><ui-switch label="Auto-save" checked></ui-switch></ui-selection-control>
```

The child keeps its own name, value, form and keyboard behavior. The value text is plain text. For an editable number, use `ui-number-field`.

## Geometry and appearance

Label, control and value are 3u apart. A range fills the row, and the value holds 8u so it doesn't shift the track.

## Renderers and verification

The web tag reads its child's value. React takes the value as a prop, because the caller already holds it.
