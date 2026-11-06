// Slot recipe for <ui-breadcrumb> and the React Breadcrumb (resolveBreadcrumb): crumbs on a line that
// wraps, 1u from their carets. Ancestors are muted links, and the current page takes the strong role.
// The caret mirrors in RTL. Lengths come from the unit; color from roles.
import { defineSlotRecipe } from '@pandacss/dev';
import { BREADCRUMB } from '../../tokens/geometry/resolve.ts';

const gap = `calc(${BREADCRUMB.gap} * var(--u))`;

export const breadcrumb = defineSlotRecipe({
  className: 'ui-breadcrumb',
  description: 'Ancestor trail (ui-breadcrumb, React Breadcrumb).',
  slots: ['root', 'list', 'item', 'link', 'separator', 'ellipsis'],
  base: {
    root: { display: 'block', minWidth: 0, textStyle: 'label' },
    list: { display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap, margin: 0, padding: 0, listStyleType: 'none' },
    item: { display: 'inline-flex', alignItems: 'center', gap, minWidth: 0 },
    link: {
      color: 'fg.muted', textDecoration: 'none', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: `calc(${BREADCRUMB.maxLabel} * var(--u))`,
      '&[href]:hover': { color: 'fg', textDecoration: 'underline' },
      '&[aria-current]': { color: 'fg.strong' },
    },
    separator: {
      display: 'inline-flex', flexShrink: 0, color: 'fg.subtle', width: 'var(--icon-sm)', height: 'var(--icon-sm)',
      '& > i': { width: '100%', height: '100%' },
      '&:dir(rtl)': { scale: '-1 1' },
    },
    ellipsis: {
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: `calc(${BREADCRUMB.ellipsis} * var(--u))`, height: `calc(${BREADCRUMB.ellipsis} * var(--u))`,
      borderRadius: 'min(calc(var(--u) * var(--ui-radius-scale)), 50%)', color: 'fg.muted', '&:hover': { bg: 'bg.mutedHover', color: 'fg' },
    },
  },
});
