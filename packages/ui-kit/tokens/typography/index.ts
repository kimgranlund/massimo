import { FONT_FAMILIES } from './resolve.ts';

// Font stacks from massimo-ui. Type roles (sizes, line heights) live in resolve.ts and styles/typography.ts.
export const fonts = {
  sans: { value: FONT_FAMILIES.sans },
  serif: { value: FONT_FAMILIES.serif },
  mono: { value: FONT_FAMILIES.mono },
};
// Major-second scale from a 1rem base.
export const fontSizes = {
  xs: { value: '0.75rem' }, sm: { value: '0.875rem' }, md: { value: '1rem' }, lg: { value: '1.125rem' },
  xl: { value: '1.25rem' }, '2xl': { value: '1.5rem' }, '3xl': { value: '1.875rem' }, '4xl': { value: '2.25rem' },
};
export const fontWeights = { regular: { value: '400' }, medium: { value: '500' }, semibold: { value: '600' }, bold: { value: '700' } };
export const lineHeights = { tight: { value: '1.2' }, snug: { value: '1.35' }, normal: { value: '1.5' } };
export const letterSpacings = { tight: { value: '-0.01em' }, normal: { value: '0' }, wide: { value: '0.02em' } };
