# Data table

`ui-data-table` (React `DataTable`): semantic records with shared columns, sorting and interactive cells. API, defaults and avoidance guidance: [data-table.manifest.json](data-table.manifest.json).

## Usage

```html
<ui-data-table label="Orders" sort="total:desc"
  columns='[{"key":"name","label":"Name","sort":"text"},{"key":"total","label":"Total","sort":"number","align":"end"}]'
  rows='[{"name":"Ada","total":120},{"name":"Lin","total":80}]'></ui-data-table>
```

```tsx
<DataTable label="Orders" columns={[{ key: 'name', label: 'Name', render: (r) => <a href={r.url}>{r.name}</a> }]} rows={rows} />
```

- It's a native `table` in a scroll region. The header stays in view, and the host is a tab stop so a keyboard can scroll it.
- A column with `sort` (`text` or `number`) has a header control that goes ascending, descending, then unsorted. Empty values sort last, and `sortchange` reports it.
- A column's `render(row)` puts anything in a cell: a node in the element, a React node in `DataTable`.
- `navigable` makes it an ARIA grid: one tab stop, and arrows, Home, End, PageUp and PageDown move between cells. Focus lands on a cell's control when it has one.
- Selection, pagination and virtual scrolling aren't here yet.

## Geometry and appearance

Cells are 3u in and 2u × density above and below, under an 8u header (`resolveDataTable`). End-aligned cells use tabular figures.

## Renderers and verification

Both renderers share `dom/table.ts`, and navigation reuses `dom/grid-nav.ts`.
