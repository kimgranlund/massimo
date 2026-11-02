// Global tokens in Panda's format. Single source of truth for every component and app.
import { defineTokens, defineSemanticTokens } from '@pandacss/dev';
import { colors, semanticColors, semanticShadows } from './colors/index.ts';
import { fonts, fontSizes, fontWeights, lineHeights, letterSpacings } from './typography/index.ts';
import { spacing, sizes, radii, borderWidths } from './geometry/index.ts';
import { durations, easings, semanticDurations, semanticEasings } from './motion/index.ts';

export const tokens = defineTokens({
  colors, fonts, fontSizes, fontWeights, lineHeights, letterSpacings,
  spacing, sizes, radii, borderWidths, durations, easings,
});

export const semanticTokens = defineSemanticTokens({ colors: semanticColors, shadows: semanticShadows, durations: semanticDurations, easings: semanticEasings });

export * from './themes/index.ts';
export * from './geometry/resolve.ts';
export * from './typography/resolve.ts';
export { unitTokenVars, unitTokenCss } from './geometry/index.ts';
export { motionTokenVars, motionTokenCss, INTENTS, SPRINGS, RESOLVED_SPRINGS, type IntentName, type SpringName } from './motion/index.ts';
