import { defineSlotRecipe } from '@pandacss/dev';

export const inputRecipe = defineSlotRecipe({
  className: 'ui-input',
  jsx: ['Input', 'ui-input'],
  slots: ['root', 'label', 'control', 'description', 'error'],
  base: {
    root: { display: 'flex', flexDirection: 'column', gap: '1.5' },
    label: { textStyle: 'label', color: 'fg', cursor: 'default', alignSelf: 'start' },
    control: {
      width: '100%', borderWidth: 'thin', borderColor: 'input.border', borderRadius: 'input', bg: 'input.bg', color: 'input.fg',
      transitionProperty: 'border-color, box-shadow', transitionDuration: 'fast', transitionTimingFunction: 'standard',
      '&::placeholder': { color: 'input.placeholder' },
      _focusVisible: { outline: 'none', borderColor: 'input.borderFocus', boxShadow: '0 0 0 1px {colors.input.borderFocus}' },
      // aria-invalid only: native :invalid would flag untouched required fields on load.
      '&[aria-invalid=true]': { borderColor: 'input.borderInvalid' },
      '&:disabled, &[aria-disabled=true]': { opacity: 0.5, cursor: 'not-allowed', bg: 'bg.subtle' },
      // Contenteditable control (web component): behave like a one-line input.
      '&[contenteditable]': {
        display: 'flex', alignItems: 'center', whiteSpace: 'pre', overflowX: 'auto', overflowY: 'hidden',
        scrollbarWidth: 'none', cursor: 'text', minWidth: 0,
      },
      '&[contenteditable]:empty::before': { content: 'attr(data-placeholder)', color: 'input.placeholder', pointerEvents: 'none' },
      '&[data-secret]': { WebkitTextSecurity: 'disc' },
    },
    description: { textStyle: 'caption', color: 'fg.muted', _hidden: { display: 'none' } },
    error: { textStyle: 'caption', color: 'danger.fg', _hidden: { display: 'none' } },
  },
  variants: {
    size: {
      sm: { control: { height: 'control.sm', paddingInline: '2.5', fontSize: 'sm' } },
      md: { control: { height: 'control.md', paddingInline: '3', fontSize: 'sm' } },
      lg: { control: { height: 'control.lg', paddingInline: '4', fontSize: 'md' } },
    },
  },
  defaultVariants: { size: 'md' },
});

// Before the element is defined: invisible, but holding its final size so nothing jumps.
export const inputPending = {
  'ui-input:not(:defined)': { display: 'block', minHeight: 'calc({sizes.control.md} + 1.75rem)' },
};
