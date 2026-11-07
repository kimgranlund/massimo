// Slot recipe for <ui-admin-shell> and the React AdminShell: navigation and detail panes around
// content. dom/shell.ts sets data-start and data-end from the host's own width: inline, rail, drawer
// or closed. A drawer overlays this host, not the viewport. scroll-padding carries --u for that script.
import { defineSlotRecipe } from '@pandacss/dev';
import { SCROLL_REGION, SHELL } from '../../tokens/geometry/resolve.ts';

const BAR = { display: 'flex', alignItems: 'center', gap: `calc(${SCROLL_REGION.gap} * var(--u))`, minHeight: `calc(${SCROLL_REGION.bar} * var(--u))`, paddingInline: `calc(${SCROLL_REGION.inset} * var(--u))`, minWidth: 0 };
const PANE = { minHeight: 0, minWidth: 0, overflowY: 'auto', overscrollBehavior: 'contain', bg: 'bg' };
const DRAWER = { position: 'absolute', insetBlock: 0, zIndex: 2, maxWidth: '100%', boxShadow: 'lg' };

export const adminShell = defineSlotRecipe({
  className: 'ui-admin-shell',
  description: 'Navigation and detail panes around content (ui-admin-shell, React AdminShell).',
  slots: ['root'],
  base: {
    root: {
      position: 'relative', display: 'grid', width: '100%', height: '100%', minHeight: 0, minWidth: 0, overflow: 'hidden', scrollPaddingTop: 'var(--u)',
      gridTemplateColumns: 'auto minmax(0, 1fr) auto', gridTemplateRows: 'auto minmax(0, 1fr) auto', gridTemplateAreas: '"start toolbar end" "start content end" "start footer end"',
      '& > [data-part=start]': { ...PANE, gridArea: 'start', width: `calc(${SHELL.start} * var(--u))`, borderInlineEndWidth: 'var(--separator)', borderInlineEndStyle: 'solid', borderColor: 'border' },
      '& > [data-part=end]': { ...PANE, gridArea: 'end', width: `calc(${SHELL.end} * var(--u))`, borderInlineStartWidth: 'var(--separator)', borderInlineStartStyle: 'solid', borderColor: 'border' },
      '& > [data-part=toolbar]': { ...BAR, gridArea: 'toolbar', borderBlockEndWidth: 'var(--separator)', borderBlockEndStyle: 'solid', borderColor: 'border' },
      '& > [data-part=content]': { gridArea: 'content', minHeight: 0, minWidth: 0, overflowY: 'auto', padding: `calc(${SCROLL_REGION.inset} * var(--u))` },
      '& > [data-part=footer]': { ...BAR, gridArea: 'footer', borderBlockStartWidth: 'var(--separator)', borderBlockStartStyle: 'solid', borderColor: 'border' },
      '& > [data-part=scrim]': { display: 'none', position: 'absolute', inset: 0, zIndex: 1, bg: 'bg.scrim' },
      '&[data-drawer-open] > [data-part=scrim]': { display: 'block' },
      '&[data-start=closed] > [data-part=start], &[data-end=closed] > [data-part=end]': { display: 'none' },
      '&[data-start=rail] > [data-part=start]': { width: `calc(${SHELL.rail} * var(--u))` },
      '&[data-start=drawer] > [data-part=start]': { ...DRAWER, insetInlineStart: 0 },
      '&[data-end=drawer] > [data-part=end]': { ...DRAWER, insetInlineEnd: 0 },
    },
  },
});

export { adminShell as 'admin-shell' };
