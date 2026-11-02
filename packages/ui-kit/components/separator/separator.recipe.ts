// Slot recipe for <ui-separator> and the React Separator (resolveSeparator): a rule as thick as the
// theme border, never thinner than a hairline (--separator, styles/geometry.ts), in the border role.
// Horizontal spans the inline axis; vertical stretches across its flex or grid line.
import { defineSlotRecipe } from '@pandacss/dev';
import { FORCED } from '../recipe-parts.ts';

export const separator = defineSlotRecipe({
  className: 'ui-separator',
  description: 'Separator (ui-separator, React Separator, Base UI Separator): a horizontal or vertical rule.',
  slots: ['root'],
  base: {
    root: {
      display: 'block', flexShrink: 0, alignSelf: 'stretch', margin: 0, borderWidth: 0, bg: 'border',
      height: 'var(--separator)',
      '&[data-orientation=vertical]': { height: 'auto', width: 'var(--separator)' },
      [FORCED]: { forcedColorAdjust: 'none', bg: 'CanvasText' },
    },
  },
});
