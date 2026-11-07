// Slot recipe for <ui-floating-panel> and the React FloatingPanel: a retained nonmodal panel in the
// browser's top layer. Script sets --panel-x, --panel-y, --panel-w and --panel-h (dom/drag.ts).
import { defineSlotRecipe } from '@pandacss/dev';
import { FLOATING_PANEL, SCROLL_REGION } from '../../tokens/geometry/resolve.ts';

export const floatingPanel = defineSlotRecipe({
  className: 'ui-floating-panel',
  description: 'A retained nonmodal panel (ui-floating-panel, React FloatingPanel).',
  slots: ['root', 'header', 'controls', 'body', 'grip'],
  base: {
    root: {
      // Physical: dom/drag.ts places it in viewport coordinates. Until then it sits at the bottom right.
      position: 'fixed', inset: 'auto', margin: 0, right: 'calc(4 * var(--u))', bottom: 'calc(4 * var(--u))', scrollPaddingTop: 'var(--u)',
      '&[data-placed]': { left: 'var(--panel-x)', top: 'var(--panel-y)', right: 'auto', bottom: 'auto' },
      flexDirection: 'column', width: `var(--panel-w, calc(${FLOATING_PANEL.width} * var(--u)))`, maxWidth: 'calc(100vw - 8 * var(--u))', height: 'var(--panel-h, auto)', maxHeight: 'calc(100vh - 8 * var(--u))',
      padding: 0, overflow: 'hidden', borderRadius: 'calc(2 * var(--u) * var(--ui-radius-scale))', bg: 'elevation.overlay', boxShadow: 'floating', borderWidth: 0, color: 'fg',
      '&:popover-open, &[data-open]': { display: 'flex' },
      '&[data-dragging]': { userSelect: 'none' },
      '&[data-collapsed]': { height: 'auto' },
      '&[data-collapsed] > [data-part=grip]': { display: 'none' },
    },
    header: {
      flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: `calc(${SCROLL_REGION.gap} * var(--u))`, minHeight: `calc(${FLOATING_PANEL.header} * var(--u))`, paddingInlineStart: `calc(${SCROLL_REGION.inset} * var(--u))`, paddingInlineEnd: 'var(--u)', textStyle: 'title', touchAction: 'none', cursor: 'move',
    },
    controls: { display: 'flex', alignItems: 'center', gap: 'calc(0.5 * var(--u))', flex: 'none' },
    body: { flex: '1 1 auto', minHeight: 0, overflowY: 'auto', overscrollBehavior: 'contain', padding: `calc(${SCROLL_REGION.inset} * var(--u))` },
    grip: { position: 'absolute', insetBlockEnd: 0, insetInlineEnd: 0, width: `calc(${FLOATING_PANEL.grip} * var(--u))`, height: `calc(${FLOATING_PANEL.grip} * var(--u))`, cursor: 'nwse-resize', touchAction: 'none' },
  },
});

export { floatingPanel as 'floating-panel' };
