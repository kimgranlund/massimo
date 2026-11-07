// Slot recipe for <ui-chart> and the React Chart (resolveChart): SVG marks on the data roles, in fixed
// order. Text wears text roles, never a series color. Nothing here is a length a viewer can tune:
// marks are thin, in px, by the chart spec (docs/specs/charts.md).
import { defineSlotRecipe } from '@pandacss/dev';
import { CHART } from '../../tokens/geometry/resolve.ts';
import { FORCED, UI_FONT } from '../recipe-parts.ts';

// The data roles share one tone, so hue alone fails colour-blind readers: every second series moves 30%
// toward the text color, which stays right in each scheme and for any brand's hues (docs/specs/charts.md).
const series = Object.fromEntries([1, 2, 3, 4, 5, 6].map((n) => [`& [data-series="${n}"]`, { '--chart-c': n % 2 ? `{colors.data.${n}}` : `color-mix(in oklab, {colors.data.${n}} 70%, {colors.fg.strong})` }]));

export const chart = defineSlotRecipe({
  className: 'ui-chart',
  description: 'Data as column, bar, line, area or donut marks (ui-chart, React Chart).',
  slots: ['root'],
  base: {
    root: {
      position: 'relative', display: 'block', width: '100%', minWidth: 0, scrollPaddingTop: 'var(--u)', ...series,
      '& > [data-part=plot]': { display: 'block', maxWidth: '100%' },
      '& [data-part=grid]': { stroke: 'border', strokeWidth: 1, opacity: 0.5 },
      '& [data-part=tick]': { fill: 'fg.muted', fontFamily: UI_FONT, fontSize: '12px' },
      '& [data-part=total]': { fill: 'fg.strong', fontFamily: UI_FONT, fontSize: '18px', fontWeight: 'semibold' },
      '& [data-part=hit]': { fill: 'transparent' },
      '& [data-part=cross]': { stroke: 'fg.muted', strokeWidth: 1, opacity: 0 },
      '& [data-i]:hover > [data-part=cross]': { opacity: 1 },
      '& [data-mark=fill], & [data-mark=dot]': { fill: 'var(--chart-c)' },
      '& [data-mark=dot]': { stroke: 'bg', strokeWidth: CHART.gap },
      '& [data-mark=slice]': { fill: 'var(--chart-c)', stroke: 'bg', strokeWidth: CHART.gap },
      '& [data-mark=line]': { fill: 'none', stroke: 'var(--chart-c)', strokeWidth: CHART.line, strokeLinejoin: 'round', strokeLinecap: 'round' },
      '& [data-mark=area]': { fill: 'var(--chart-c)', opacity: 0.16 },
      '& > [data-part=legend]': { display: 'flex', flexWrap: 'wrap', gap: `var(--u) calc(${CHART.legend} * 2 * var(--u))`, paddingBlockStart: `calc(${CHART.legend} * var(--u))`, textStyle: 'label' },
      '& [data-part=legend-item], & [data-part=tip-row]': { display: 'inline-flex', alignItems: 'center', gap: 'var(--u)' },
      '& [data-part=key]': { flex: 'none', width: '8px', height: '8px', borderRadius: '2px', bg: 'var(--chart-c)' },
      '& > [data-part=data]': { position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clipPath: 'inset(50%)', whiteSpace: 'nowrap' },
      '& > [data-part=tooltip]': {
        position: 'absolute', left: 'var(--tip-x, 0)', top: 'var(--tip-y, 0)', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 'calc(0.5 * var(--u))', padding: 'calc(2 * var(--u))', pointerEvents: 'none', borderRadius: 'calc(var(--u) * var(--ui-radius-scale))', bg: 'bg.raised', boxShadow: 'md', textStyle: 'label', whiteSpace: 'nowrap',
        '&[hidden]': { display: 'none' },
      },
      '& [data-part=tip-row] > :last-child': { marginInlineStart: 'auto', paddingInlineStart: 'calc(2 * var(--u))', color: 'fg.strong', fontVariantNumeric: 'tabular-nums' },
      [FORCED]: { '& > [data-part=plot], & [data-part=key]': { forcedColorAdjust: 'none' } },
    },
  },
});
