// Content shell: <ui-content-shell> and the React ContentShell, a CSS-only tag. A document scrollport
// beside optional, independently scrolling navigation. The main region scrolls, its header stays at
// the top of it and the footer ends the document.
import { defineSlotRecipe } from '@pandacss/dev';
import { tagRules } from '../recipe-parts.ts';
import { PAGE_WIDTHS, SCROLL_REGION, SHELL } from '../../tokens/geometry/resolve.ts';

const BAR = { flex: 'none', display: 'flex', alignItems: 'center', gap: `calc(${SCROLL_REGION.gap} * var(--u))`, minHeight: `calc(${SCROLL_REGION.bar} * var(--u))`, paddingInline: `calc(${SCROLL_REGION.inset} * var(--u))` };
const SEP = (edge: string) => ({ [`border${edge}Width`]: 'var(--separator)', [`border${edge}Style`]: 'solid', borderColor: 'border' });
const body = (w: number) => ({ root: { '& > [data-part=main] > [data-part=body]': { maxWidth: `calc(${w} * var(--u))` } } });

export const contentShell = defineSlotRecipe({
  className: 'ui-content-shell',
  description: 'A document scrollport beside navigation (ui-content-shell, React ContentShell).',
  slots: ['root'],
  base: {
    root: {
      display: 'flex', width: '100%', height: '100%', minHeight: 0, minWidth: 0,
      '& > [data-part=sidebar]': { flex: 'none', width: `calc(${SHELL.start} * var(--u))`, maxWidth: '100%', overflowY: 'auto', overscrollBehavior: 'contain', ...SEP('InlineEnd') },
      '& > [data-part=main]': { flex: '1 1 0', minWidth: 0, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column' },
      '& > [data-part=main] > [data-part=header]': { ...BAR, position: 'sticky', top: 0, zIndex: 1, bg: 'bg', ...SEP('BlockEnd') },
      '& > [data-part=main] > [data-part=body]': { flex: '1 0 auto', width: '100%', marginInline: 'auto', padding: `calc(${SCROLL_REGION.inset} * var(--u))` },
      '& > [data-part=main] > [data-part=footer]': { ...BAR, ...SEP('BlockStart') },
    },
  },
  variants: { width: Object.fromEntries(Object.entries(PAGE_WIDTHS).map(([k, w]) => [k, body(w)])) },
  defaultVariants: { width: 'wide' },
});

export const contentShellTags = tagRules(':is(ui-content-shell, [data-ui=content-shell])', contentShell);
export { contentShell as 'content-shell' };
