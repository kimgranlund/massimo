// Slot recipe for <ui-toggle> and the React Toggle: the button recipe (control geometry, the
// construction pattern, hover / press / focus / disabled, forced colors) plus the pressed state
// (data-pressed, Base UI Toggle): the primary solid with contrast text, like a selected chip.
// Inside a toggle group (ui-toggle-group, React ToggleGroup) a toggle is a composite option, like a
// segmented option: the option height, inset and radius (recipe-parts `compositeOption`), no fill
// and muted text until hovered, the raised selected fill (bg.selected) while pressed, and an inset
// focus ring that stays within the group's contour.
import { defineSlotRecipe } from '@pandacss/dev';
import { FORCED, FORCED_ON, compositeOption, mergeStyles } from '../recipe-parts.ts';
import { button } from '../button/button.recipe.ts';

const base = button.base as Record<string, any>;
const IN_GROUP = ':is(ui-toggle-group, [data-ui=toggle-group]) > &';
const ENABLED = ':not([data-disabled], [data-busy])';

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
      [IN_GROUP]: mergeStyles(compositeOption, {
        height: 'auto', bg: 'transparent', color: 'fg.muted', fontWeight: 'medium',
        '&:focus-visible': { outlineOffset: 'calc(-1 * {borderWidths.thick})' },
      }),
      // A vertical group starts its labels on the inline start, like vertical tabs.
      [':is(ui-toggle-group, [data-ui=toggle-group])[data-orientation=vertical] > &']: { justifyContent: 'flex-start' },
      [`${IN_GROUP}${ENABLED}:hover`]: { bg: 'bg.control', color: 'fg' },
      [`${IN_GROUP}${ENABLED}:active`]: { bg: 'bg.controlHover' },
      [`${IN_GROUP}[data-pressed]`]: { bg: 'bg.selected', color: 'fg.selected', borderColor: 'transparent', boxShadow: 'sm', [FORCED]: FORCED_ON },
      [`${IN_GROUP}[data-pressed]${ENABLED}:is(:hover, :active)`]: { bg: 'bg.selected', borderColor: 'transparent' },
    }),
  },
});
