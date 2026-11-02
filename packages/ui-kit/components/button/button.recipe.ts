import { defineRecipe } from '@pandacss/dev';

export const buttonRecipe = defineRecipe({
  className: 'ui-button',
  jsx: ['Button', 'ui-button'],
  base: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '2',
    fontWeight: 'medium', borderRadius: 'md', borderWidth: 'thin', borderColor: 'transparent',
    cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap',
    transitionProperty: 'background-color, border-color, color, opacity',
    transitionDuration: 'fast', transitionTimingFunction: 'standard',
    _disabled: { opacity: 0.5, cursor: 'not-allowed' },
    '&[data-disabled], &[data-loading]': { opacity: 0.5, cursor: 'not-allowed' },
  },
  variants: {
    variant: {
      solid: { bg: 'accent.solid', color: 'fg.onSolid', _hover: { bg: 'accent.solidHover' } },
      outline: { borderColor: 'border.strong', color: 'fg', _hover: { bg: 'bg.muted' } },
      ghost: { color: 'fg', _hover: { bg: 'bg.muted' } },
      danger: { bg: 'danger.solid', color: 'fg.onSolid', _hover: { bg: 'danger.solidHover' } },
    },
    size: {
      sm: { height: 'control.sm', paddingInline: '3', fontSize: 'sm' },
      md: { height: 'control.md', paddingInline: '4', fontSize: 'sm' },
      lg: { height: 'control.lg', paddingInline: '5', fontSize: 'md' },
    },
  },
  defaultVariants: { variant: 'solid', size: 'md' },
});
