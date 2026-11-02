import { defineSlotRecipe } from '@pandacss/dev';

export const inputRecipe = defineSlotRecipe({
  className: 'ui-input',
  jsx: ['Input', 'ui-input'],
  slots: ['root', 'label', 'control', 'description', 'error'],
  base: {
    root: { display: 'flex', flexDirection: 'column', gap: '1.5' },
    label: { textStyle: 'label', color: 'fg' },
    control: {
      width: '100%', borderWidth: 'thin', borderColor: 'input.border', borderRadius: 'input', bg: 'input.bg', color: 'input.fg',
      transitionProperty: 'border-color, box-shadow', transitionDuration: 'fast', transitionTimingFunction: 'standard',
      _placeholder: { color: 'input.placeholder' },
      _focusVisible: { outline: 'none', borderColor: 'input.borderFocus', boxShadow: '0 0 0 1px {colors.input.borderFocus}' },
      _invalid: { borderColor: 'input.borderInvalid' },
      _disabled: { opacity: 0.5, cursor: 'not-allowed', bg: 'bg.subtle' },
    },
    description: { textStyle: 'caption', color: 'fg.muted' },
    error: { textStyle: 'caption', color: 'danger.fg' },
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
