// Slot recipe for <ui-tooltip> and the React Tooltip (Base UI Tooltip: Root, Trigger, Positioner,
// Popup, Arrow). The popup is a 7u text row on the inverse fill (resolvePopup('tooltip')): the
// control font at line height 1.2 in a 6u text slot inside a 0.5u edge, 2u at the bare ends, the
// control radius min(3u·s, 3.5u), at most 60u wide; not as wide as its trigger. The shared popup
// pieces (components/popover/popup-parts.ts) place it 1u from the trigger (above it by default) and
// run the reveal motion; data-instant (the warm group) skips it.
import { defineSlotRecipe } from '@pandacss/dev';
import { ANCHORED, UI_FONT, mergeStyles } from '../recipe-parts.ts';
import { popupArrow, popupPositioner, popupRoot, popupSurface } from '../popover/popup-parts.ts';

export const tooltip = defineSlotRecipe({
  className: 'ui-tooltip',
  description: 'A short text label for a control, shown on hover and keyboard focus (ui-tooltip, React Tooltip).',
  slots: ['root', 'trigger', 'positioner', 'popup', 'arrow'],
  base: {
    root: popupRoot,
    trigger: { [ANCHORED]: { anchorName: 'var(--ui-anchor)' } },
    // A tooltip hugs its text: no minimum of the trigger's width.
    positioner: mergeStyles(popupPositioner(60), { minWidth: 0 }),
    popup: mergeStyles(popupSurface, {
      bg: 'bg.inverse', color: 'fg.inverse', borderColor: 'bg.inverse', boxShadow: 'sm',
      fontFamily: UI_FONT, fontSize: 'var(--font)', lineHeight: 'var(--line)', fontWeight: 'normal', overflowWrap: 'anywhere',
      padding: 'calc(0.5 * var(--u) - var(--b) + var(--line-pad)) calc(2 * var(--u) - var(--b))',
      borderRadius: 'min(calc(3 * var(--u) * var(--ui-radius-scale)), calc(3.5 * var(--u)))',
      // One line is the 7u row exactly (the line box can round below it); the text stays centered.
      minHeight: 'calc(7 * var(--u))', justifyContent: 'center',
    }),
    arrow: popupArrow('bg.inverse', 'bg.inverse'),
  },
});
