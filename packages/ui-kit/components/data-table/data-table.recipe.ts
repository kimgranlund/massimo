// Slot recipe for <ui-data-table> and the React DataTable (resolveDataTable): a scroll region around a
// native table. Its header stays in view, and numbers line up in tabular figures.
import { defineSlotRecipe } from '@pandacss/dev';
import { DATA_TABLE } from '../../tokens/geometry/resolve.ts';

const INLINE = `calc(${DATA_TABLE.inline} * var(--u))`;
const align = { '&[data-align=center]': { textAlign: 'center' }, '&[data-align=end]': { textAlign: 'end' } };
const RULE = { borderBlockEndWidth: 'var(--separator)', borderBlockEndStyle: 'solid', borderColor: 'border' };

export const dataTable = defineSlotRecipe({
  className: 'ui-data-table',
  description: 'Semantic tabular records (ui-data-table, React DataTable).',
  slots: ['root', 'content', 'header', 'sort', 'row', 'cell'],
  base: {
    root: { display: 'block', width: '100%', minWidth: 0, maxWidth: '100%', bg: 'bg', overflow: 'auto', overscrollBehavior: 'contain', position: 'relative' },
    content: { width: '100%', borderCollapse: 'separate', borderSpacing: 0, textStyle: 'body-md' },
    header: {
      position: 'sticky', top: 0, zIndex: 1, height: `calc(${DATA_TABLE.header} * var(--u))`, paddingInline: INLINE, textAlign: 'start', textStyle: 'label', fontWeight: 'semibold', whiteSpace: 'nowrap', bg: 'bg', ...RULE, ...align,
    },
    sort: {
      display: 'inline-flex', alignItems: 'center', gap: 'var(--u)', cursor: 'default', borderRadius: 'calc(var(--u) * var(--ui-radius-scale))',
      '&:hover': { color: 'fg.strong' },
      '& > i': { width: 'var(--icon-sm)', height: 'var(--icon-sm)', opacity: 0 },
      '[aria-sort=ascending] > & > i, [aria-sort=descending] > & > i': { opacity: 1 },
      '[aria-sort=descending] > & > i': { rotate: '180deg' },
    },
    row: { '&:hover > td': { bg: 'bg.controlHover' }, '&:last-child > td': { borderBlockEndWidth: 0 } },
    cell: {
      paddingInline: INLINE, paddingBlock: `calc(${DATA_TABLE.block} * var(--u) * (0.5 + 0.5 * var(--ui-density)))`, verticalAlign: 'middle', ...RULE, ...align,
      '&[data-align=end]': { textAlign: 'end', fontVariantNumeric: 'tabular-nums' },
    },
  },
});

export { dataTable as 'data-table' };
