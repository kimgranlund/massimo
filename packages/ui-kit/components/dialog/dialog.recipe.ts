// Slot recipe for <ui-dialog> and the React Dialog (Base UI Dialog: Root, Trigger, Backdrop, Popup,
// Title, Description, Close; actions is ours). The popup is a container at the card-xl level
// (resolveDialog): padding p·u − B inside a B edge in the border role, radius p·u × min(1, s), its
// parts 2u apart (the collection gap; the gap attribute on the host wins), 96u wide and at most the
// viewport less 4u on each side, scrolling inside when taller. It sits in the top layer (popover),
// centered; the backdrop under it is the bg.backdrop role over the whole viewport. Both enter and
// leave on the reveal intent: the backdrop fades, the popup fades and grows from 0.97, with
// `display` and `overlay` transitioning discretely so the closing layer stays painted until it has
// faded. A dialog with an open nested dialog steps back (--nested-dialogs). The trigger and close
// parts are usually ui-buttons: they keep their own recipe and take no extra styles here.
import { defineSlotRecipe } from '@pandacss/dev';
import { FORCED, FORCED_EDGE, mergeStyles, t } from '../recipe-parts.ts';

/** Every length of a dialog popup reads these, set on the popup (resolveDialog). */
const LEVEL = {
  '--dp': 'var(--ui-pad-card-xl)',
  '--dialog-margin': 'calc(4 * var(--u))',
};
const FADE = `display {durations.reveal} allow-discrete, overlay {durations.reveal} allow-discrete`;

/** The backdrop: the bg.backdrop role over the viewport, fading on the reveal intent. */
export const dialogBackdrop = {
  position: 'fixed', inset: 0, margin: 0, padding: 0, border: 0, width: 'auto', height: 'auto', maxWidth: 'none', maxHeight: 'none',
  bg: 'bg.backdrop', opacity: 0,
  transition: `${t('reveal', 'opacity')}, ${FADE}`,
  '&[data-closed]': { display: 'none' },
  '&[data-open]': { opacity: 1, '@starting-style': { opacity: 0 } },
  [FORCED]: { bg: 'transparent' },
};

/** The popup surface shared by dialog, alert dialog and drawer: fill, edge, shadow, stack, scroll. */
export const dialogSurface = {
  ...LEVEL,
  position: 'fixed', flexDirection: 'column', overflowY: 'auto', overscrollBehavior: 'contain',
  // Elevation level 5 (modal): the overlay fill and the modal shadow, over bg.backdrop (tokens/elevation).
  color: 'fg', bg: 'elevation.overlay', boxShadow: 'modal',
  borderWidth: 'var(--b)', borderStyle: 'solid', borderColor: 'border',
  padding: 'max(0px, calc(var(--dp) * var(--u) - var(--b)))',
  // The gap attribute is on the host (--ui-gap does not inherit): the popup takes it.
  '--ui-gap': 'inherit',
  gap: 'calc(var(--ui-gap, var(--ui-gap-collection)) * var(--u))',
  outline: 'none',
  display: 'flex',
  '&[data-closed]': { display: 'none' },
  [FORCED]: FORCED_EDGE,
};

/** A centered dialog popup (container family): 96u wide, radius = padding, grows in from 0.97. */
export const dialogPopup = mergeStyles(dialogSurface, {
  inset: 0, margin: 'auto',
  width: 'min(calc(96 * var(--u)), calc(100% - 2 * var(--dialog-margin)))',
  height: 'fit-content',
  maxWidth: 'none',
  maxHeight: 'calc(100% - 2 * var(--dialog-margin))',
  borderRadius: 'calc(var(--dp) * var(--u) * min(1, var(--ui-radius-scale)))',
  opacity: 0, scale: 0.97,
  transition: `${t('reveal', 'opacity', 'scale')}, ${FADE}`,
  '&[data-open]': { opacity: 1, scale: 1, '@starting-style': { opacity: 0, scale: 0.97 } },
  // A parent of an open nested dialog steps back a little per nested level.
  '&[data-open][data-nested-dialog-open]': { scale: 'calc(1 - 0.03 * var(--nested-dialogs, 1))', opacity: 0.9 },
});

export const dialogTitle = { margin: 0, textStyle: 'heading-3', color: 'fg' };
export const dialogDescription = { margin: 0, textStyle: 'body', color: 'fg.muted' };
/** The actions row (ours): at the popup's end, its buttons 2u apart, wrapping on narrow popups. */
export const dialogActions = { display: 'flex', flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center', gap: 'calc(2 * var(--u))' };

/** The slots every dialog recipe has (root, trigger, backdrop, popup, title, description, actions, close). */
export const dialogSlots = ['root', 'trigger', 'backdrop', 'popup', 'title', 'description', 'actions', 'close'] as const;

export const dialogBase = {
  root: { display: 'contents' },
  trigger: {},
  backdrop: dialogBackdrop,
  popup: dialogPopup,
  title: dialogTitle,
  description: dialogDescription,
  actions: dialogActions,
  close: {},
};

export const dialog = defineSlotRecipe({
  className: 'ui-dialog',
  description: 'A modal window over the page (ui-dialog, React Dialog): backdrop and a centered card-xl popup in the top layer.',
  slots: [...dialogSlots],
  base: dialogBase,
});
