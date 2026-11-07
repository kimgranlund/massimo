// Slot recipe for <ui-date-range-picker> and the React DateRangePicker: a calendar in range mode with
// Cancel and Apply, so only a finished range is accepted.
import { defineSlotRecipe } from '@pandacss/dev';

export const dateRangePicker = defineSlotRecipe({
  className: 'ui-date-range-picker',
  description: 'Edit and apply one inclusive date range (ui-date-range-picker, React DateRangePicker).',
  slots: ['root', 'body', 'actions'],
  base: {
    root: { display: 'inline-flex' },
    body: { display: 'flex', flexDirection: 'column', gap: 'calc(2 * var(--u))' },
    actions: { display: 'flex', justifyContent: 'flex-end', gap: 'calc(2 * var(--u))' },
  },
});

export { dateRangePicker as 'date-range-picker' };
