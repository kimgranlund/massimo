# Tree view

`ui-tree-view` (React `TreeView`): select one item in a bounded hierarchy. API, defaults and avoidance guidance: [tree-view.manifest.json](tree-view.manifest.json).

## Usage

```html
<ui-tree-view label="Files" items='[{"id":"src","label":"src","children":[{"id":"app","label":"app.ts"}]},{"id":"readme","label":"README.md"}]'></ui-tree-view>
```

- Up and Down move focus, Right and Left expand, collapse or step in and out, Home and End jump, and Enter or Space selects. Moving focus doesn't select.
- The caret toggles a branch, and the row selects it.
- Editing, multiple selection and loading on demand aren't included.

## Geometry and appearance

Rows are 7u tall and indent 4u per level.
