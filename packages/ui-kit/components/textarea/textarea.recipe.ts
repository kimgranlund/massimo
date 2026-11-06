// Slot recipe for <ui-textarea> and the React Textarea: the input's anatomy on a control that grows.
// One row is an input's height and each further row adds a text line, so the first line sits where an
// input's text sits. --ui-rows is set by script. The control grows with its text; it never scrolls.
import { defineSlotRecipe } from '@pandacss/dev';
import { fieldControl, fieldParts, fieldRoot, mergeStyles } from '../recipe-parts.ts';

export const textarea = defineSlotRecipe({
  className: 'ui-textarea',
  description: 'Multiline text field (ui-textarea, React Textarea).',
  slots: ['root', 'label', 'control', 'leading', 'prefix', 'contents', 'suffix', 'trailing', 'description', 'error'],
  base: {
    root: fieldRoot,
    ...fieldParts,
    control: mergeStyles(fieldControl({
        invalid: ':is([data-invalid] > *)',
        disabled: ':is([data-disabled] > *, :has(> :disabled))',
        readonly: ':is([data-readonly] > *)',
      }), {
      height: 'auto', alignItems: 'flex-start',
      // The construction pattern gives text parts one slot of height: here the text part holds the rows.
      '& > [data-part=contents][data-part]': { display: 'block', minHeight: 'calc((var(--ui-rows, 3) - 1) * var(--line) + var(--slot))' },
      ':root[data-modality] &:focus-within': { outline: '2px solid {colors.focusRing}', outlineOffset: '2px' },
      '& > [data-part=contents]:focus-visible': { outline: 'none' },
      '& > :is([data-part=leading], [data-part=trailing])': { color: 'fg.muted' },
    }),
    contents: {
      boxSizing: 'border-box', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', minWidth: 0, cursor: 'text',
      '&[contenteditable]:empty::before': { content: 'attr(data-placeholder)', color: 'fg.subtle', pointerEvents: 'none' },
      // A native textarea sizes to its text where the browser can.
      '&:is(textarea)': { width: '100%', font: 'inherit', color: 'inherit', background: 'transparent', border: 0, outline: 0, resize: 'none', fieldSizing: 'content', overflow: 'hidden' },
    },
  },
});
