// The ui-kit Panda preset: tokens + global styles + component recipes.
// Apps add it to their own panda.config `presets` to style with the same system.
import { definePreset } from '@pandacss/dev';
import { tokens, semanticTokens } from './tokens/index.ts';
import { reset, textStyles, page, prose } from './styles/index.ts';
import { buttonRecipe, inputRecipe } from './components/index.ts';

export const uiKitPreset = definePreset({
  name: 'ui-kit',
  globalCss: reset,
  theme: {
    tokens,
    semanticTokens,
    textStyles,
    recipes: { button: buttonRecipe },
    slotRecipes: { input: inputRecipe },
  },
  patterns: { page, prose },
});

export default uiKitPreset;
