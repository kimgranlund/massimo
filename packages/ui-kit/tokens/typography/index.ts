import { FACES, FONT_FAMILIES } from './resolve.ts';

// Faces (font stacks, from massimo-ui; display starts as the sans stack, controls is system-ui).
// Voices and roles live in resolve.ts and styles/typography.ts.
export const fonts = Object.fromEntries(FACES.map((f) => [f, { value: FONT_FAMILIES[f] }]));
// Font sizes are steps of the type scale, the same formula as the roles: (10px + u) × ratio^step,
// computed where used from --ui-unit and --ui-type-ratio (md = step 0 = body). Prefer a textStyle
// role; these are for text that has no role (chart ticks, captions inside a figure).
export const FONT_SIZE_STEPS = { xs: -2, sm: -1, md: 0, lg: 1, xl: 2, '2xl': 3, '3xl': 4, '4xl': 5, '5xl': 6 } as const;
export const fontSizes = Object.fromEntries(Object.entries(FONT_SIZE_STEPS).map(([k, step]) => [k, {
  value: `calc((10px + var(--ui-unit) * 1px) * pow(var(--ui-type-ratio), ${step}))`,
}]));
// Unitless ratios and em tracking: relative to the font, so they need no unit.
export const fontWeights = { regular: { value: '400' }, medium: { value: '500' }, semibold: { value: '600' }, bold: { value: '700' } };
export const lineHeights = { tight: { value: '1.2' }, snug: { value: '1.35' }, normal: { value: '1.5' } };
export const letterSpacings = { tight: { value: '-0.01em' }, normal: { value: '0' }, wide: { value: '0.02em' } };
