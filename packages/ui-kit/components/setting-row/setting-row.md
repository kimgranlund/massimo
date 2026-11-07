# Setting row

`ui-setting-row` (React `SettingRow`): a setting's copy beside its controls. API, defaults and avoidance guidance: [setting-row.manifest.json](setting-row.manifest.json).

## Intent

Lay out one setting: what it is on one side, how to change it on the other. For a line of mixed text and actions, use [`ui-row`](../row/row.md).

## Usage

```html
<ui-setting-row>
  <div data-part="copy">
    <span data-part="title">Weekly digest</span>
    <span data-part="description">A summary every Monday.</span>
  </div>
  <ui-switch label="Weekly digest" hide-label></ui-switch>
</ui-setting-row>
```

```tsx
<SettingRow title="Weekly digest" description="A summary every Monday.">
  <Switch aria-label="Weekly digest" />
</SettingRow>
```

- Copy and controls sit at opposite edges, and the controls wrap below the copy when the row gets narrow.
- The row isn't a label, so give each control its own name.

## Geometry and appearance

Copy and controls are 4u apart, and the copy holds at least 40u before wrapping (`resolveSettingRow`). There's no fill, border or padding: a section supplies the inset.

## Renderers and verification

The web tag has no script. React renders `<div data-ui="setting-row">` with the same rules.
