// The ui-kit Panda preset: tokens, reset, component geometry, component defaults and the FOUC guard.
// Apps add it to their own panda.config `presets` to style with the same system.
import { definePreset } from '@pandacss/dev';
import { tokens, semanticTokens, themeCss } from './tokens/index.ts';
import { breakpoints } from './tokens/geometry/index.ts';
import { reset, textStyles, page, prose, geometry, defaults, pending, pendingKeyframes } from './styles/index.ts';

export const uiKitPreset = definePreset({
  name: 'ui-kit',
  globalCss: { ...themeCss(), ...reset, '.dark': { colorScheme: 'dark' }, ...geometry, ...defaults, ...pending },
  theme: {
    breakpoints,
    tokens,
    semanticTokens,
    textStyles,
    keyframes: pendingKeyframes,
  },
  patterns: { page, prose },
});

export default uiKitPreset;
