// Slot recipe for <ui-calendar> and the React Calendar (resolveCalendar): a month grid of control-square
// cells, with the selected day on the primary solid and today as an inset ring.
import { defineSlotRecipe } from '@pandacss/dev';
import { FORCED } from '../recipe-parts.ts';

const CELL = 'calc(8 * var(--u))';

export const calendar = defineSlotRecipe({
  className: 'ui-calendar',
  description: 'A month grid (ui-calendar, React Calendar).',
  slots: ['root', 'header', 'title', 'grid', 'row', 'weekday', 'cell'],
  base: {
    root: { display: 'inline-flex', flexDirection: 'column', gap: 'calc(2 * var(--u))', width: 'fit-content', fontFamily: 'ui' },
    header: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'calc(2 * var(--u))' },
    title: { textStyle: 'title' },
    grid: { display: 'flex', flexDirection: 'column' },
    row: { display: 'grid', gridTemplateColumns: `repeat(7, ${CELL})` },
    weekday: { display: 'grid', placeItems: 'center', height: CELL, textStyle: 'label' },
    cell: {
      display: 'grid', placeItems: 'center', height: CELL, textStyle: 'control-md', fontVariantNumeric: 'tabular-nums', borderRadius: 'min(calc(3 * var(--u) * var(--ui-radius-scale)), calc(4 * var(--u)))', cursor: 'default',
      '&:hover:not([aria-disabled])': { bg: 'bg.controlHover' },
      '&[data-outside]': { color: 'fg.subtle' },
      '&[data-today]': { boxShadow: 'inset 0 0 0 1px {colors.primary.solid}' },
      '&[data-in-range]': { bg: 'primary.subtle', borderRadius: 0 },
      '&[aria-selected=true]': { bg: 'primary.solid', color: 'fg.onSolid' },
      '&[aria-disabled]': { opacity: 0.5, cursor: 'not-allowed' },
      [FORCED]: { '&[aria-selected=true]': { forcedColorAdjust: 'none', bg: 'Highlight', color: 'HighlightText' } },
    },
  },
});
