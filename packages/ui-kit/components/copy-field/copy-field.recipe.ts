// Slot recipe for <ui-copy-field> and the React CopyField: a read-only field with a copy action. The
// field and its action are the kit's own input and button; this adds the value's face and a status.
import { defineSlotRecipe } from '@pandacss/dev';

export const copyField = defineSlotRecipe({
  className: 'ui-copy-field',
  description: 'A value with a copy action (ui-copy-field, React CopyField).',
  slots: ['root', 'status'],
  base: {
    root: { display: 'block', position: 'relative', minWidth: 0, '& [data-part=contents]': { fontFamily: 'mono' } },
    status: { position: 'absolute', width: '1px', height: '1px', margin: '-1px', padding: 0, overflow: 'hidden', clipPath: 'inset(50%)', whiteSpace: 'nowrap', border: 0 },
  },
});

export { copyField as 'copy-field' };
