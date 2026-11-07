// Slot recipe for <ui-sidebar> and the React Sidebar: named sections of navigation that collapse to an
// icon rail. Links are the author's own, so the browser owns navigation.
import { defineSlotRecipe } from '@pandacss/dev';

export const sidebar = defineSlotRecipe({
  className: 'ui-sidebar',
  description: 'Navigation sections that collapse to a rail (ui-sidebar, React Sidebar).',
  slots: ['root', 'toggle'],
  base: {
    root: {
      display: 'flex', flexDirection: 'column', gap: 'calc(4 * var(--u))', width: 'calc(60 * var(--u))', padding: 'calc(2 * var(--u))', minHeight: 0, overflowY: 'auto', bg: 'bg.subtle',
      '&[data-collapsed]': { width: 'calc(12 * var(--u))' },
      '& [data-part=section]': { display: 'flex', flexDirection: 'column', gap: 'calc(0.5 * var(--u))' },
      '& [data-part=heading]': { textStyle: 'group-kicker', paddingInline: 'calc(2 * var(--u))' },
      '& a': { display: 'flex', alignItems: 'center', gap: 'calc(2 * var(--u))', minHeight: 'calc(8 * var(--u))', paddingInline: 'calc(2 * var(--u))', borderRadius: 'var(--radius)', textStyle: 'label', textDecoration: 'none', '&:hover': { bg: 'bg.controlHover' }, '&[aria-current]': { bg: 'bg.muted', color: 'fg.strong' } },
      '&[data-collapsed] [data-part=heading]': { display: 'none' },
      '&[data-collapsed] a > span': { position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clipPath: 'inset(50%)', whiteSpace: 'nowrap' },
      '&[data-collapsed] a': { justifyContent: 'center', paddingInline: 0, position: 'relative' },
    },
    toggle: { alignSelf: 'flex-end' },
  },
});
