// Flow layouts: <ui-column>, <ui-list> and <ui-grid> and their React twins. CSS-only tags, like ui-row:
// each recipe object is also emitted as global rules on the tag and its [data-ui] twin. They arrange
// their children and own nothing else: no fill, no inset, no keyboard. Gap comes from the gap attribute
// (--ui-gap, units of u), the track minimum from resolveFlow's ladder.
import { defineSlotRecipe } from '@pandacss/dev';
import { tagRules } from '../recipe-parts.ts';
import { FLOW_GAP, GRID_COLUMNS, GRID_MIN } from '../../tokens/geometry/resolve.ts';

const gap = `calc(var(--ui-gap, ${FLOW_GAP}) * var(--u))`;
const align = Object.fromEntries((['start', 'center', 'end', 'stretch'] as const).map((a) => [a, { root: { alignItems: a } }]));
const stack = { display: 'flex', flexDirection: 'column', gap, minWidth: 0 };

export const column = defineSlotRecipe({
  className: 'ui-column',
  description: 'Children in a stack (ui-column, React Column).',
  slots: ['root'],
  base: { root: stack },
  variants: { align },
});

export const list = defineSlotRecipe({
  className: 'ui-list',
  description: 'List items in a stack (ui-list, React List).',
  slots: ['root'],
  base: { root: { ...stack, listStyleType: 'none', margin: 0, padding: 0, '& > li': { display: 'block' } } },
  variants: { align },
});

export const grid = defineSlotRecipe({
  className: 'ui-grid',
  description: 'Tiles that wrap to fill the row (ui-grid, React Grid).',
  slots: ['root'],
  base: {
    root: {
      display: 'grid', gap, minWidth: 0,
      gridTemplateColumns: `repeat(auto-fill, minmax(min(100%, calc(${GRID_MIN.md} * var(--u))), 1fr))`,
    },
  },
  variants: {
    min: Object.fromEntries(Object.entries(GRID_MIN).map(([k, v]) => [k, { root: { gridTemplateColumns: `repeat(auto-fill, minmax(min(100%, calc(${v} * var(--u))), 1fr))` } }])),
    columns: Object.fromEntries(GRID_COLUMNS.map((n) => [String(n), { root: { gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` } }])),
  },
});

export const flowTags = {
  ...tagRules(':is(ui-column, [data-ui=column])', column),
  ...tagRules(':is(ui-list, [data-ui=list])', list),
  ...tagRules(':is(ui-grid, [data-ui=grid])', grid),
};
