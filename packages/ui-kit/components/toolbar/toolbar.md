# Toolbar

`ui-toolbar` (React `Toolbar`): a named strip of commands. API, defaults and avoidance guidance: [toolbar.manifest.json](toolbar.manifest.json).

## Usage

```html
<ui-toolbar label="Formatting">
  <ui-button aria-label="Bold"><i slot="leading" name="text-b"></i></ui-button>
  <ui-button aria-label="Italic"><i slot="leading" name="text-italic"></i></ui-button>
</ui-toolbar>
```

- It's one tab stop: arrow keys move along it, and Home and End jump to the ends.
- Commands that don't fit hide, and a More menu runs them.
- `orientation="vertical"` stacks it, and vertical toolbars don't overflow.

## Geometry and appearance

A muted strip with a ½u edge, and commands 1u apart.
