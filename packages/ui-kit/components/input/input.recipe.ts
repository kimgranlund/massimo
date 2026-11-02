// Slot recipe for <ui-input> and the React Input: label, control (laid out as a button, with the
// construction-pattern parts), description and error. The web component's text part is a
// contenteditable; the React one a native <input>.
import { defineSlotRecipe } from '@pandacss/dev';
import { fieldControl, fieldParts, fieldRoot, mergeStyles } from '../recipe-parts.ts';

// A state on the control or on its text part (aria-* on the editor, or the native input).
const has = (attr: string) => `:is(${attr}, :has(> ${attr}))`;

export const input = defineSlotRecipe({
  className: 'ui-input',
  description: 'Text field (ui-input, React Input).',
  slots: ['root', 'label', 'control', 'leading', 'prefix', 'contents', 'suffix', 'trailing', 'description', 'error'],
  base: {
    root: fieldRoot,
    ...fieldParts,
    control: mergeStyles(fieldControl({
        invalid: has('[aria-invalid=true]'),
        disabled: `:is(${has('[aria-disabled=true]')}, :has(> :disabled))`,
        readonly: has('[aria-readonly=true]'),
      }), {
      // Text fields always show focus, also after a pointer click (the caret target must be
      // visible). The ring sits on the control (the shape), not the text part inside it.
      ':root[data-modality] &:focus-within': { outline: '2px solid {colors.focusRing}', outlineOffset: '2px' },
      '& > [data-part=contents]:focus-visible': { outline: 'none' },
      // Adornment icons are secondary.
      '& > :is([data-part=leading], [data-part=trailing])': { color: 'fg.muted' },
    }),
    contents: {
      // The web component's contenteditable editor.
      '&[contenteditable]': { whiteSpace: 'pre', overflowX: 'auto', scrollbarWidth: 'none', cursor: 'text', minWidth: 0 },
      '&[contenteditable]:empty::before': { content: 'attr(data-placeholder)', color: 'fg.subtle', pointerEvents: 'none' },
      '&[data-secret]': { WebkitTextSecurity: 'disc' },
      // A native text input keeps a minimum line box; pin it to the slot like the editor.
      '&:is(input)': { height: 'var(--slot)' },
    },
  },
});
