// Slot recipe for <ui-toggle-group> and the React ToggleGroup (Base UI ToggleGroup): a composite on
// the control fill, like ui-segmented (recipe-parts `composite`: padding D − B, the composite gap,
// the control radius, its 7u items R − D inside it). Its toggles
// are composite options: the toggle recipe's in-group rules (toggle.recipe.ts) give them the option
// height, inset and radius and the raised selected fill while pressed. Vertical stacks them.
import { defineSlotRecipe } from '@pandacss/dev';
import { FORCED, FORCED_EDGE, UI_FONT, composite, mergeStyles } from '../recipe-parts.ts';

export const toggleGroup = defineSlotRecipe({
  className: 'ui-toggle-group',
  description: 'A row of toggles with one or several pressed (ui-toggle-group, React ToggleGroup, Base UI ToggleGroup).',
  slots: ['root'],
  base: {
    root: mergeStyles(composite, {
      display: 'inline-flex', alignItems: 'stretch', maxWidth: '100%', fontFamily: UI_FONT, bg: 'bg.control', borderColor: 'transparent',
      '&[data-orientation=vertical]': { flexDirection: 'column' },
      [FORCED]: FORCED_EDGE,
    }),
  },
});

// The registry names the recipe after the component id.
export { toggleGroup as 'toggle-group' };
