// Slot recipe for <ui-file-picker> and the React FilePicker: a button and the chosen file's name, in
// a drop target. A field's label, description and error sit around it, as on any field.
import { defineSlotRecipe } from '@pandacss/dev';
import { fieldParts, fieldRoot } from '../recipe-parts.ts';

export const filePicker = defineSlotRecipe({
  className: 'ui-file-picker',
  description: 'Choose files (ui-file-picker, React FilePicker).',
  slots: ['root', 'label', 'control', 'name', 'description', 'error'],
  base: {
    root: fieldRoot,
    ...fieldParts,
    control: {
      display: 'flex', alignItems: 'center', gap: 'calc(2 * var(--u))', minWidth: 0, padding: 'calc(0.5 * var(--u))', borderRadius: 'var(--radius)', bg: 'bg.muted',
      '&[data-dragging]': { outline: '2px dashed {colors.focusRing}', outlineOffset: '2px' },
    },
    name: { textStyle: 'label', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  },
});

export { filePicker as 'file-picker' };
