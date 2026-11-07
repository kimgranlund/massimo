// Slot recipe for <ui-selection-control> and the React SelectionControl: a control with its context, a
// label on one side and its live value on the other. The control keeps its own behavior.
import { defineSlotRecipe } from '@pandacss/dev';

export const selectionControl = defineSlotRecipe({
  className: 'ui-selection-control',
  description: 'A control beside its label and live value (ui-selection-control, React SelectionControl).',
  slots: ['root', 'label', 'value'],
  base: {
    root: { display: 'flex', alignItems: 'center', gap: 'calc(3 * var(--u))', minWidth: 0, '& > :is(ui-range, [data-ui=range])': { flex: '1', minWidth: 0 } },
    label: { textStyle: 'label', flexShrink: 0 },
    value: { textStyle: 'control-sm', fontVariantNumeric: 'tabular-nums', flexShrink: 0, minWidth: 'calc(8 * var(--u))', textAlign: 'end', color: 'fg.muted' },
  },
});

export { selectionControl as 'selection-control' };
