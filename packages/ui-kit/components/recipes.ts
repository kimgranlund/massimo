// The recipe registry: every component slot recipe, registered in the preset (theme.slotRecipes).
// One <name>.recipe.ts per component folder; the key is the generated function's name in
// styled-system/recipes (badge → styled-system/recipes/badge.js).
import { badge, tag, chip } from './btg/btg.recipe.ts';
import { button } from './button/button.recipe.ts';
import { checkbox, radio, switchRecipe } from './choice/choice.recipe.ts';
import { range, progress } from './range/range.recipe.ts';
import { swatch, palette } from './color/color.recipe.ts';

export const slotRecipes = { badge, tag, chip, button, checkbox, radio, switchRecipe, range, progress, swatch, palette };

