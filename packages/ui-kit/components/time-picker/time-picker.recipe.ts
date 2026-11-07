// Slot recipe for <ui-time-picker> and the React TimePicker: a text field with time suggestions, on
// the kit's autocomplete.
import { defineSlotRecipe } from '@pandacss/dev';

export const timePicker = defineSlotRecipe({
  className: 'ui-time-picker',
  description: 'Enter a wall-clock time (ui-time-picker, React TimePicker).',
  slots: ['root'],
  base: { root: { display: 'block', minWidth: 0 } },
});

export { timePicker as 'time-picker' };
