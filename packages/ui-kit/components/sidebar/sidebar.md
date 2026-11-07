# Sidebar

`ui-sidebar` (React `Sidebar`): named navigation sections that collapse to an icon rail. API, defaults and avoidance guidance: [sidebar.manifest.json](sidebar.manifest.json).

## Usage

```html
<ui-sidebar label="Main">
  <div data-part="section">
    <span data-part="heading">Workspace</span>
    <a href="/home" aria-current="page"><i name="house"></i><span>Home</span></a>
  </div>
</ui-sidebar>
```

Give each link an icon and a `span` label. Collapsed, the label is hidden from view and still read by assistive technology.

## Geometry and appearance

60u wide, or 12u as a rail, with 8u rows.
