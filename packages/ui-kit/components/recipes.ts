// The recipe registry: every component slot recipe, registered in the preset (theme.slotRecipes).
// One <name>.recipe.ts per component folder; the key is the generated function's name in
// styled-system/recipes (badge → styled-system/recipes/badge.js).
import { badge, tag, chip } from './btg/btg.recipe.ts';
import { button } from './button/button.recipe.ts';
import { checkbox, radio, switchRecipe } from './choice/choice.recipe.ts';
import { range, progress } from './range/range.recipe.ts';
import { swatch, palette } from './color/color.recipe.ts';
import { listbox, segmented, option } from './listbox/listbox.recipe.ts';
import { input } from './input/input.recipe.ts';
import { select } from './select/select.recipe.ts';
import { swiper } from './swiper/swiper.recipe.ts';
import { image } from './image/image.recipe.ts';
import { group, collection, card, panel, region, page as pageRecipe } from './container/container.recipe.ts';

export const slotRecipes = { badge, tag, chip, button, checkbox, radio, switchRecipe, range, progress, swatch, palette, listbox, segmented, option, input, select, swiper, image, group, collection, card, panel, region, pageRecipe };

