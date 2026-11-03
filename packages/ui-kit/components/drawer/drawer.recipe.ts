// Slot recipe for <ui-drawer> and the React Drawer (Base UI Drawer: the Dialog parts on an
// edge-anchored sheet). The popup is the dialog surface (components/dialog/dialog.recipe.ts) as an
// area at the panel level (resolveDrawer): padding p·u − B (p = pad-panel, 6u), square, its parts 2u
// apart. `side` (a variant) anchors it: left and right sheets are the viewport's height and 80u wide
// (at most the viewport less 8u); top and bottom sheets are the full width, at most the viewport
// height less 8u. It slides in from its edge and back out on the reveal intent (translate, with
// `display` / `overlay` discrete). While swiped (data-swiping) it follows the pointer through Base
// UI's --drawer-swipe-movement-x / -y with no transition; released, it springs back or leaves from
// where it was. Physical sides: a swipe direction is physical, so the sheet does not mirror in RTL.
import { defineSlotRecipe } from '@pandacss/dev';
import { dialogBase, dialogSlots, dialogSurface } from '../dialog/dialog.recipe.ts';
import { mergeStyles, t } from '../recipe-parts.ts';

const FADE = `display {durations.reveal} allow-discrete, overlay {durations.reveal} allow-discrete`;
/** Where the sheet sits while closed (off its edge), per side. */
const AWAY = { bottom: '0 100%', top: '0 -100%', right: '100% 0', left: '-100% 0' } as const;
const RESERVE = 'calc(8 * var(--u))';

const sheet = (side: keyof typeof AWAY) => {
  const inline = side === 'left' || side === 'right';
  const place = inline
    ? { top: 0, bottom: 0, [side]: 0, [side === 'left' ? 'right' : 'left']: 'auto', width: `min(calc(80 * var(--u)), calc(100% - ${RESERVE}))`, height: '100%', maxHeight: 'none' }
    : { left: 0, right: 0, [side]: 0, [side === 'top' ? 'bottom' : 'top']: 'auto', width: '100%', height: 'auto', maxHeight: `calc(100% - ${RESERVE})` };
  return {
    popup: {
      ...place,
      '&[data-closed]': { translate: AWAY[side] },
      '&[data-open]': { '@starting-style': { translate: AWAY[side] } },
    },
  };
};

export const drawerPopup = mergeStyles(dialogSurface, {
  '--dp': 'calc(var(--ui-pad-panel) * (0.5 + 0.5 * var(--ui-density)))',
  margin: 0, maxWidth: 'none', borderRadius: 0,
  // The snap offset (a sheet resting at a snap point, set by script) plus the swipe movement.
  translate: 'calc(var(--drawer-snap-x, 0px) + var(--drawer-swipe-movement-x, 0px)) calc(var(--drawer-snap-y, 0px) + var(--drawer-swipe-movement-y, 0px))',
  transition: `${t('reveal', 'translate')}, ${FADE}`,
  touchAction: 'none',
  // Following the pointer: no transition until the release.
  '&[data-swiping]': { transitionDuration: '0s', userSelect: 'none' },
});

export const drawer = defineSlotRecipe({
  className: 'ui-drawer',
  description: 'An edge-anchored sheet over the page (ui-drawer, React Drawer): backdrop and a square panel-level popup that slides in from its side and swipes away.',
  slots: [...dialogSlots],
  base: { ...dialogBase, popup: drawerPopup },
  variants: {
    side: { bottom: sheet('bottom'), top: sheet('top'), right: sheet('right'), left: sheet('left') },
  },
  defaultVariants: { side: 'bottom' },
});
