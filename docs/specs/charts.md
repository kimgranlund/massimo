# Charts

How `ui-chart` chooses forms and colors. The component's API is in its [guide](../../packages/ui-kit/components/chart/chart.md); the code is `dom/chart.ts`.

## Data color

Series take the role family `data` in fixed order, `data.1` to `data.6` (step 9 of the roles the theme's `roles.data` requests; [color](color.md)). The theme owns the hues, so a brand's chart follows the brand, and each scheme takes its own steps.

- The data roles share one tone, so hue alone doesn't separate them for colour-blind readers. Every second series moves 30% toward the text role, which gives each pair a lightness step in either scheme and for any brand's hues. On the default theme, the worst adjacent pair goes from ΔE 3.8 to 10.9 for colour-blind readers in light and 6.3 in dark, measured with the dataviz validator. Dark stays in the 6–8 band, so the legend, 2px gaps and table are required there, not optional.
- A series keeps its position, so a filter never repaints the survivors. Pass series in a stable order.
- Beyond six, the last series fold into Other. A seventh hue is never generated.
- Feedback roles (critical, warning, success, info) mean state and aren't series.
- Sequential scales (heatmap) take one family's steps, light to dark. Diverging scales take two families and a neutral midpoint. Neither ships yet.

## Marks

Marks are drawn in px, not u, since they're the data and not the layout: 2px lines, 4px rounded data ends anchored at the baseline, 8px markers, and 2px surface gaps between adjacent fills. Only the figure's height and legend spacing come from geometry (`resolveChart`).

## Text and identity

Text wears text roles, never a series color. Two or more series always have a legend, so identity is never color alone, and a table inside the figure carries every value to assistive technology. One axis only: two measures of different scale take two charts. `null` is a gap, not a zero.

## Forms

| Job | Form |
|---|---|
| Compare magnitudes | `column`, or `bar` for long labels |
| Parts over categories | `stacked` |
| Change over time | `line`, or `area` for one or two series |
| Parts of a whole, at most six | `donut` |

Histogram, scatter, heatmap, pie, rings, timeline, bullet and sparkline are a later ticket, as are time windows.
