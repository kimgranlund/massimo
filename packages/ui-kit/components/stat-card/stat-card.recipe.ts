// Slot recipe for <ui-stat-card> and the React StatCard (resolveStatCard): a metric on a card, its delta
// on the value's baseline, then the comparison and a trend. Tone is stated by the author: a falling
// number can be good news, so the sign never picks a color.
import { defineSlotRecipe } from '@pandacss/dev';
import { STAT_CARD } from '../../tokens/geometry/resolve.ts';

export const statCard = defineSlotRecipe({
  className: 'ui-stat-card',
  description: 'A metric with its delta, comparison and trend (ui-stat-card, React StatCard).',
  slots: ['root', 'label', 'value', 'delta', 'comparison', 'trend'],
  base: {
    root: { display: 'block', minWidth: 0 },
    label: { textStyle: 'label' },
    value: { textStyle: 'heading-1', fontVariantNumeric: 'tabular-nums', display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', gap: `calc(${STAT_CARD.deltaGap} * var(--u))` },
    delta: {
      textStyle: 'label', color: 'fg.muted',
      '&[data-tone=positive]': { color: 'success.fg' },
      '&[data-tone=negative]': { color: 'critical.fg' },
    },
    comparison: { textStyle: 'body-sm' },
    trend: {
      display: 'block', width: '100%', height: `calc(${STAT_CARD.trend} * var(--u))`, overflow: 'visible', color: 'primary.solid',
      '& > polyline': { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round', vectorEffect: 'non-scaling-stroke' },
    },
  },
});

export { statCard as 'stat-card' };
