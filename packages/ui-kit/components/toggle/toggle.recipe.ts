// Slot recipe for <ui-toggle> and the React Toggle: the button recipe (control geometry, the
// construction pattern, hover / press / focus / disabled, forced colors) plus the pressed state
// (data-pressed, Base UI Toggle): the primary solid with contrast text, like a selected chip.
import { defineSlotRecipe } from '@pandacss/dev';
import { FORCED, FORCED_ON, mergeStyles } from '../recipe-parts.ts';
import { button } from '../button/button.recipe.ts';

const base = button.base as Record<string, any>;

export const toggle = defineSlotRecipe({
  className: 'ui-toggle',
  description: 'Toggle button (ui-toggle, React Toggle, Base UI Toggle): a two-state button on the button recipe; pressed paints the primary solid.',
  slots: ['root', 'leading', 'prefix', 'contents', 'suffix', 'trailing'],
  base: {
    ...base,
    root: mergeStyles(base.root, {
      _pressed: {
        bg: 'primary.solid', color: 'fg.onSolid', borderColor: 'primary.solid',
        _enabled: { '&:is(:hover, :active)': { bg: 'primary.solidHover', borderColor: 'primary.solidHover' } },
        [FORCED]: FORCED_ON,
      },
    }),
  },
});
