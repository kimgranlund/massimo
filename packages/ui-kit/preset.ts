// The ui-kit Panda preset: tokens + global styles + component recipes.
// Apps add it to their own panda.config `presets` to style with the same system.
import { definePreset } from '@pandacss/dev';
import { tokens, semanticTokens, themeCss } from './tokens/index.ts';
import { breakpoints } from './tokens/geometry/index.ts';
import { reset, textStyles, page, prose, pending, pendingKeyframes } from './styles/index.ts';
import { buttonRecipe, inputRecipe, buttonPending, inputPending } from './components/index.ts';

export const uiKitPreset = definePreset({
  name: 'ui-kit',
  globalCss: { ...themeCss(), ...reset, '.dark': { colorScheme: 'dark' }, ...pending, ...buttonPending, ...inputPending },
  theme: {
    breakpoints,
    tokens,
    semanticTokens,
    textStyles,
    keyframes: pendingKeyframes,
    recipes: { button: buttonRecipe },
    slotRecipes: { input: inputRecipe },
  },
  patterns: { page, prose },
});

export default uiKitPreset;
