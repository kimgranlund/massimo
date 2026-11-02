import { defineSlotRecipe } from '@pandacss/dev';

export const inputRecipe = defineSlotRecipe({
  className: 'ui-input',
  jsx: ['Input', 'ui-input'],
  slots: ['root', 'label', 'control', 'description', 'error'],
  base: {
    root: { display: 'flex', flexDirection: 'column', gap: '1.5' },
    label: { textStyle: 'label', color: 'fg' },
    control: {
      width: '100%', borderWidth: 'thin', borderColor: 'border.strong', borderRadius: 'md', bg: 'bg', color: 'fg',
      transitionProperty: 'border-color, box-shadow', transitionDuration: 'fast', transitionTimingFunction: 'standard',
      _placeholder: { color: 'fg.muted' },
      _focusVisible: { outline: 'none', borderColor: 'focusRing', boxShadow: '0 0 0 1px {colors.focusRing}' },
      _invalid: { borderColor: 'danger.solid' },
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
