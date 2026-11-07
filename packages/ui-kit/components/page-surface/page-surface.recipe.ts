// Page surface: <ui-page-surface> and the React PageSurface, a CSS-only tag. A normal-flow document surface: a fixed 6u inset
// around content at one of three widths (resolvePage). The containing shell owns scrolling.
import { defineSlotRecipe } from '@pandacss/dev';
import { tagRules } from '../recipe-parts.ts';
import { PAGE, PAGE_WIDTHS } from '../../tokens/geometry/resolve.ts';

const max = (w: number) => ({ root: { maxWidth: `calc(${w + 2 * PAGE.inset} * var(--u))` } });

export const pageSurface = defineSlotRecipe({
  className: 'ui-page-surface',
  description: 'A normal-flow document surface (ui-page-surface, React PageSurface).',
  slots: ['root'],
  base: { root: { display: 'flex', flexDirection: 'column', gap: `calc(var(--ui-gap, ${PAGE.gap}) * var(--u))`, width: '100%', minWidth: 0, marginInline: 'auto', padding: `calc(${PAGE.inset} * var(--u))` } },
  variants: { width: Object.fromEntries(Object.entries(PAGE_WIDTHS).map(([k, w]) => [k, max(w)])) },
  defaultVariants: { width: 'readable' },
});

export const pageSurfaceTags = tagRules(':is(ui-page-surface, [data-ui=page-surface])', pageSurface);
export { pageSurface as 'page-surface' };
