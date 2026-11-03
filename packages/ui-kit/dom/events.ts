// Event details in Base UI's shape (eventDetails: { reason, event }), shared by both renderers.
// Web components put them in a CustomEvent's detail beside the new value: change and input carry
// { value, reason, event } (choices { checked, value, … }, chips { pressed, … }), ui-select's
// openchange { open, reason, event }. React renderers pass them as the second argument of
// onValueChange, onCheckedChange, onValueCommitted and onOpenChange.

/**
 * Why a value or open state changed, with Base UI's reason names:
 * - item-press: an option or swatch was pressed (pointer, or Enter / Space on the highlighted one)
 * - keyboard: arrow, Home / End, Page or typeahead keys moved the selection (listbox, palette, range)
 * - list-navigation: a navigation key opened the select popup
 * - trigger-press: the select trigger was pressed (pointer, Enter, Space)
 * - outside-press: a press outside the select closed its popup
 * - escape-key: Escape closed the popup
 * - focus-out: focus left the select (Tab commits the highlighted option and closes)
 * - track-press, drag: a press on the range track, then dragging its thumb
 * - none: no specific interaction (Base UI's reason for checkbox, switch, radio, toggle and input)
 */
export type ChangeReason =
  | 'item-press' | 'keyboard' | 'list-navigation' | 'trigger-press' | 'outside-press' | 'escape-key'
  | 'focus-out' | 'track-press' | 'drag' | 'none'
  // Floating layers (popover, tooltip, preview card, navigation menu): the pointer rested on or left
  // the trigger, the trigger took focus, a Close part was pressed, a navigation link was followed.
  | 'trigger-hover' | 'trigger-focus' | 'close-press' | 'link-press';

/** Base UI eventDetails: the reason and the DOM event that caused the change, when there is one. */
export interface ChangeDetails {
  reason: ChangeReason;
  event: Event | undefined;
}

export const eventDetails = (reason: ChangeReason, event?: Event): ChangeDetails => ({ reason, event });
