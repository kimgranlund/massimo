// Slot recipe for <ui-toggle-group> and the React ToggleGroup (Base UI ToggleGroup): a composite on
// the control fill, like ui-segmented (recipe-parts `composite`: padding D − B, the composite gap,
// radius concentric with its 7u items and capped at half the 8u row when horizontal). Its toggles
// are composite options: the toggle recipe's in-group rules (toggle.recipe.ts) give them the option
// height, inset and radius and the raised selected fill while pressed. Vertical stacks them.
import { defineSlotRecipe } from '@pandacss/dev';
import { FORCED, FORCED_EDGE, UI_FONT, composite, mergeStyles } from '../recipe-parts.ts';

const ROW_RADIUS = 'min(calc((3 + var(--ui-pad-composite)) * var(--u) * var(--ui-radius-scale)), calc((var(--ch) + 2 * var(--d)) / 2))';

export const toggleGroup = defineSlotRecipe({
  className: 'ui-toggle-group',
  description: 'A row of toggles with one or several pressed (ui-toggle-group, React ToggleGroup, Base UI ToggleGroup).',
  slots: ['root'],
  base: {
    root: mergeStyles(composite, {
      display: 'inline-flex', alignItems: 'stretch', maxWidth: '100%', fontFamily: UI_FONT, bg: 'bg.control', borderColor: 'transparent',
      // One row: the radius is capped at half the height (8u), like ui-segmented.
      '--cr': ROW_RADIUS,
      '&[data-orientation=vertical]': { flexDirection: 'column', '--cr': 'calc((3 + var(--ui-pad-composite)) * var(--u) * var(--ui-radius-scale))' },
      [FORCED]: FORCED_EDGE,
    }),
  },
});

// The registry names the recipe after the component id.
export { toggleGroup as 'toggle-group' };
