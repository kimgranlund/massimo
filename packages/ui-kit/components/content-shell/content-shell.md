# Content shell

`ui-content-shell` (React `ContentShell`): a document scrollport beside optional navigation. API, defaults and avoidance guidance: [content-shell.manifest.json](content-shell.manifest.json).

## Usage

```html
<ui-content-shell width="readable" style="height: 320px">
  <nav data-part="sidebar">…</nav>
  <main data-part="main">
    <header data-part="header">Title</header>
    <div data-part="body">…</div>
    <footer data-part="footer">…</footer>
  </main>
</ui-content-shell>
```

- `sidebar` and `main` are direct children, and `header`, `body` and `footer` are direct children of `main`. Each is optional except `main`.
- `main` owns document scrolling, and the sidebar scrolls on its own. The header stays at the top of `main`.
- `width` limits the body: `readable`, `wide` (the default) or `full`.
- It has no workflow state. For panes that open and close, use [`ui-admin-shell`](../admin-shell/admin-shell.md).

## Geometry and appearance

A 60u sidebar and 12u bars (`resolveShell`, `resolveScrollRegion`).

## Renderers and verification

The web tag has no script. React `ContentShell` renders `<div data-ui="content-shell">` with the same rules.
