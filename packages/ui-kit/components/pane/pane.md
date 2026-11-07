# Pane

`ui-pane` (React `Pane`): a scrolling body with optional persistent header and footer. API, defaults and avoidance guidance: [pane.manifest.json](pane.manifest.json).

## Usage

```html
<ui-pane style="height: 240px">
  <div data-part="header"><strong>Layers</strong></div>
  <div data-part="body" tabindex="0">…</div>
  <div data-part="footer"><ui-button>Add</ui-button></div>
</ui-pane>
```

- The body scrolls, and the bars stay. Give it `tabindex="0"` so a keyboard can scroll it (React `PaneBody` does).
- The shell owns the pane's size, gutters and docking. It fills what it's given.
- Children are yours: a pane never reorders or remounts them.

## Geometry and appearance

Bars are at least 12u, and the regions are inset 4u (`resolveScrollRegion`). A separator rules each bar from the body.

## Renderers and verification

The web tag has no script. React `Pane` renders `<div data-ui="pane">` with the same rules.
