# Row

`ui-row` (React `Row`): a line of text and actions. API, defaults and avoidance guidance: [row.manifest.json](row.manifest.json).

## Intent

`ui-row` lays out its children in a line, spaced apart and centered. It is layout only: its inset comes from the [`ui-section`](../section/section.md) that holds it.

`header` marks a title row. It gets the height of a divided row, so a title above a list reads as part of it.

## Usage

```html
<ui-container preset="card">
  <ui-section><ui-row header><strong>Notifications</strong><ui-button variant="ghost">Edit</ui-button></ui-row></ui-section>
  <ui-section size="sm" divided>
    <ui-row><span>Comments</span><ui-switch label="Comments"></ui-switch></ui-row>
    <ui-row><span>Mentions</span><ui-switch label="Mentions"></ui-switch></ui-row>
  </ui-section>
</ui-container>
```

## Geometry and appearance

No fill or border of its own. A `header` row has 3u × the density factor above and below (`resolveSection`).

## Renderers and verification

The web tag has no script. React `Row` renders `<div data-ui="row">` with the same rules.
