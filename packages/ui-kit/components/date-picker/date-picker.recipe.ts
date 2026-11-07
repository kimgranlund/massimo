// Slot recipe for <ui-date-picker> and the React DatePicker: a trigger and a calendar in a popover.
import { defineSlotRecipe } from '@pandacss/dev';

export const datePicker = defineSlotRecipe({
  className: 'ui-date-picker',
  description: 'Choose a date from a popup calendar (ui-date-picker, React DatePicker).',
  slots: ['root'],
  base: { root: { display: 'inline-flex' } },
});

export { datePicker as 'date-picker' };
