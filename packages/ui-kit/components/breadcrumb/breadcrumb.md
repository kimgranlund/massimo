# Breadcrumb

`ui-breadcrumb` (React `Breadcrumb`): where a page sits, as links to its ancestors. API, defaults and avoidance guidance: [breadcrumb.manifest.json](breadcrumb.manifest.json).

## Intent

Show the path to the current page and let people step back up it. For moving between sections at the same level, use [`ui-tabs`](../tabs/tabs.md) or [`ui-navigation-menu`](../navigation-menu/navigation-menu.md).

## Usage

```html
<ui-breadcrumb label="Project">
  <a href="/">Home</a>
  <a href="/projects">Projects</a>
  <span>Mercury</span>
</ui-breadcrumb>
```

```tsx
<Breadcrumb maxItems={3}>
  <a href="/">Home</a>
  <a href="/projects">Projects</a>
  <a href="/projects/mercury">Mercury</a>
  <span>Settings</span>
</Breadcrumb>
```

- Author crumbs root first. The last is the current page and gets `aria-current="page"`, so write it as text.
- `max-items` folds the middle behind an ellipsis, keeping the root and the current page. Pressing it shows every crumb and moves focus to the first one revealed.
- Name the trail with `label` when a page has more than one navigation.
- A long crumb truncates at 40u, and the trail wraps onto more lines.

## Geometry and appearance

Crumbs and carets sit 1u apart, the caret at icon size sm and the ellipsis a 5u target (`resolveBreadcrumb`). The caret mirrors in RTL. Ancestors use the muted text color and the current page the strong one.

## Renderers and verification

Both renderers produce a navigation landmark with an ordered list. The web tag needs the kit's icons for its carets. `apps/studio/geometry-check.html` compares the gap and target with the resolver; `react-check.html` compares the twins.
