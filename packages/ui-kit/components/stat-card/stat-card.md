# Stat card

`ui-stat-card` (React `StatCard`): a metric with its change, comparison and trend. API, defaults and avoidance guidance: [stat-card.manifest.json](stat-card.manifest.json).

## Intent

Show one number and whether it's good news. For a full chart, or several series, use a chart once the kit has one.

## Usage

```html
<ui-stat-card label="Revenue" value="$48,200" delta="+12%" tone="positive" comparison="vs last month" trend="31,34,33,40,44,48"></ui-stat-card>
```

```tsx
<StatCard label="Revenue" value="$48,200" delta="+12%" tone="positive" comparison="vs last month" trend={[31, 34, 33, 40, 44, 48]} />
```

- `tone` says whether the delta is good news: `positive`, `negative` or `neutral`. The sign never sets it, because a falling number can be good.
- `trend` needs at least two values. It's drawn as a line and described in words for assistive technology.
- Empty parts are left out.

## Geometry and appearance

It's a medium card with the value in the heading role, the delta on its baseline 2u away, and a 10u trend (`resolveStatCard`). The trend has no axes: it shows direction, not exact values.

## Renderers and verification

Both renderers produce the same card and parts. `apps/studio/geometry-check.html` compares the trend height and the gap with the resolver; `react-check.html` compares the twins.
