// Pane: <ui-pane> and the React Pane, a CSS-only tag. A scrolling body between optional persistent
// bars (resolveScrollRegion). The shell owns its size; the pane fills it and never reorders children.
import { defineSlotRecipe } from '@pandacss/dev';
import { tagRules } from '../recipe-parts.ts';
import { SCROLL_REGION } from '../../tokens/geometry/resolve.ts';

const BAR = { flex: 'none', display: 'flex', alignItems: 'center', gap: `calc(${SCROLL_REGION.gap} * var(--u))`, minHeight: `calc(${SCROLL_REGION.bar} * var(--u))`, paddingInline: `calc(${SCROLL_REGION.inset} * var(--u))`, minWidth: 0 };

export const pane = defineSlotRecipe({
  className: 'ui-pane',
  description: 'A scrolling body with optional persistent bars (ui-pane, React Pane).',
  slots: ['root'],
  base: {
    root: {
      display: 'flex', flexDirection: 'column', width: '100%', minWidth: 0, minHeight: 0, height: '100%',
      '& > [data-part=header]': { ...BAR, borderBlockEndWidth: 'var(--separator)', borderBlockEndStyle: 'solid', borderColor: 'border' },
      '& > [data-part=footer]': { ...BAR, borderBlockStartWidth: 'var(--separator)', borderBlockStartStyle: 'solid', borderColor: 'border' },
      '& > [data-part=body]': { flex: '1 1 0', minHeight: 0, minWidth: 0, overflowY: 'auto', overscrollBehavior: 'contain', padding: `calc(${SCROLL_REGION.inset} * var(--u))` },
    },
  },
});

export const paneTags = tagRules(':is(ui-pane, [data-ui=pane])', pane);
