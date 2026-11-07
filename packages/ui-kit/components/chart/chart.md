# Chart

`ui-chart` (React `Chart`): data as column, bar, line, area or donut marks. API, defaults and avoidance guidance: [chart.manifest.json](chart.manifest.json). The design rules are in [charts](../../../../docs/specs/charts.md).

## Usage

```html
<ui-chart label="Revenue" kind="column"
  data='{"categories":["Q1","Q2"],"series":[{"name":"North","values":[3,5]},{"name":"South","values":[2,4]}]}'></ui-chart>
```

```tsx
<Chart label="Revenue" kind="line" data={data} />
```

- `kind`: `column`, `bar`, `line`, `area` or `donut`. `stacked` stacks columns and bars.
- A `null` value is a gap: lines break there.
- Colors follow the series' position, on the data roles `data.1` to `data.6`, with every second series shaded. A seventh series folds into Other.
- Two or more series get a legend. Hovering names the values, and a hidden table carries them to assistive technology.
- A donut draws the first series across the categories.

## Geometry and appearance

64u tall by default (`resolveChart`). Lines are 2px, the rounded data end 4px and the marker 8px, with 2px surface gaps. Those stay in px, since they're marks and not layout.

## Renderers and verification

Both renderers draw `dom/chart.ts`'s markup. Scatter, histogram and the rest are in a later ticket.
