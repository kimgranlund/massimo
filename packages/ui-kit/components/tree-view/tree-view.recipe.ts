// Slot recipe for <ui-tree-view> and the React TreeView: one row per visible item, indented 4u a level,
// with a caret on branches. Selection and focus are separate states.
import { defineSlotRecipe } from '@pandacss/dev';

export const treeView = defineSlotRecipe({
  className: 'ui-tree-view',
  description: 'A hierarchy to browse and select from (ui-tree-view, React TreeView).',
  slots: ['root', 'row', 'caret', 'label'],
  base: {
    root: { display: 'flex', flexDirection: 'column', minWidth: 0 },
    row: {
      display: 'flex', alignItems: 'center', gap: 'var(--u)', minHeight: 'calc(7 * var(--u))', paddingInlineEnd: 'calc(2 * var(--u))', paddingInlineStart: 'calc((var(--ui-level, 1) - 1) * 4 * var(--u) + var(--u))',
      borderRadius: 'var(--radius)', textStyle: 'control-md', '&:hover': { bg: 'bg.controlHover' }, '&[aria-selected=true]': { bg: 'primary.subtle', color: 'primary.fg' },
    },
    caret: { display: 'inline-flex', width: 'var(--icon-sm)', height: 'var(--icon-sm)', flexShrink: 0, '[aria-expanded=true] > &': { rotate: '90deg' }, '& > i': { width: '100%', height: '100%' } },
    label: { minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  },
});

export { treeView as 'tree-view' };
