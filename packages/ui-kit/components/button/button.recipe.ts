import { defineRecipe } from '@pandacss/dev';

export const buttonRecipe = defineRecipe({
  className: 'ui-button',
  jsx: ['Button', 'ui-button'],
  base: {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '2',
    fontWeight: 'medium', borderRadius: 'button', borderWidth: 'thin', borderColor: 'transparent',
    cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap',
    transitionProperty: 'background-color, border-color, color, opacity',
    transitionDuration: 'fast', transitionTimingFunction: 'standard',
    _disabled: { opacity: 0.5, cursor: 'not-allowed' },
    '&[data-disabled], &[data-loading]': { opacity: 0.5, cursor: 'not-allowed' },
  },
  variants: {
    variant: {
      solid: { bg: 'button.solid.bg', color: 'button.solid.fg', _hover: { bg: 'button.solid.bgHover' } },
      outline: { borderColor: 'button.outline.border', color: 'button.outline.fg', _hover: { bg: 'button.outline.bgHover' } },
      ghost: { color: 'button.ghost.fg', _hover: { bg: 'button.ghost.bgHover' } },
      danger: { bg: 'button.danger.bg', color: 'button.danger.fg', _hover: { bg: 'button.danger.bgHover' } },
    },
    size: {
      sm: { height: 'control.sm', paddingInline: '3', fontSize: 'sm' },
      md: { height: 'control.md', paddingInline: '4', fontSize: 'sm' },
      lg: { height: 'control.lg', paddingInline: '5', fontSize: 'md' },
    },
  },
  defaultVariants: { variant: 'solid', size: 'md' },
});
