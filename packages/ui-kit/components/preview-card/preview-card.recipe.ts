// Slot recipe for <ui-preview-card> and the React PreviewCard (Base UI Preview Card: Root, Trigger,
// Positioner, Popup, Arrow). The popup is a medium card (resolvePopup('preview-card')): padding
// 4u − B and radius ≤ 4u from the card-md level, the collection gap (2u) between its children, at
// most 80u wide; the shared popup pieces (components/popover/popup-parts.ts) place it 1u below the
// link and run the reveal motion.
import { defineSlotRecipe } from '@pandacss/dev';
import { ANCHORED } from '../recipe-parts.ts';
import { cardPopup, popupArrow, popupPositioner, popupRoot } from '../popover/popup-parts.ts';

export const previewCard = defineSlotRecipe({
  className: 'ui-preview-card',
  description: 'A preview of a link\'s destination, shown while the pointer rests on the link or it has keyboard focus (ui-preview-card, React PreviewCard).',
  slots: ['root', 'trigger', 'positioner', 'popup', 'arrow'],
  base: {
    root: popupRoot,
    // An inline-block box: WebKit anchors an inline link to its line box, not its client rect, so the
    // card sat up to 1px off the offset; one box gives anchor() and the measured rect the same edges.
    trigger: { display: 'inline-block', [ANCHORED]: { anchorName: 'var(--ui-anchor)' } },
    positioner: popupPositioner(80),
    popup: cardPopup('card-md', 'collection'),
    arrow: popupArrow('bg.overlay', 'border'),
  },
});
export { previewCard as 'preview-card' };
