// Slot recipe for <ui-popover> and the React Popover (Base UI Popover: Root, Trigger, Positioner,
// Popup, Arrow, Title, Description, Close). The popup is a small card (resolvePopup('popover')):
// padding 3u − B and radius ≤ 3u from the card-sm level, the group gap (1u) between title,
// description and content, at most 80u wide; the shared popup pieces (popup-parts.ts) place it 1u
// from the trigger and run the reveal motion.
import { defineSlotRecipe } from '@pandacss/dev';
import { ANCHORED } from '../recipe-parts.ts';
import { cardPopup, popupArrow, popupDescription, popupPositioner, popupRoot, popupTitle } from './popup-parts.ts';

export const popover = defineSlotRecipe({
  className: 'ui-popover',
  description: 'A popup anchored to a trigger, holding interactive content (ui-popover, React Popover).',
  slots: ['root', 'trigger', 'positioner', 'popup', 'arrow', 'title', 'description', 'close'],
  base: {
    root: popupRoot,
    trigger: { [ANCHORED]: { anchorName: 'var(--ui-anchor)' } },
    positioner: popupPositioner(80),
    popup: cardPopup('card-sm', 'group'),
    arrow: popupArrow('elevation.overlay', 'border'),
    title: popupTitle,
    description: popupDescription,
    close: { alignSelf: 'end' },
  },
});
