// Slot recipe for <ui-context-menu> and the React ContextMenu (Base UI ContextMenu: Root, Trigger; the
// popup and items are Menu's, menu.recipe.ts with placement point). The trigger is the author's area:
// no box of its own (it lays out as a block and keeps the author's size), no text selection or
// touch callout while a long press may open the menu, and the open state as data-popup-open.
import { defineSlotRecipe } from '@pandacss/dev';

export const contextMenu = defineSlotRecipe({
  className: 'ui-context-menu',
  description: 'Menu opened at the pointer over an area (ui-context-menu, React ContextMenu).',
  slots: ['root', 'trigger'],
  base: {
    root: { display: 'block' },
    trigger: {
      display: 'block', WebkitTouchCallout: 'none',
      '&[data-popup-open]': { userSelect: 'none' },
      '&[data-disabled]': { cursor: 'default' },
    },
  },
});

// The registry looks the recipe up by its component name (component:context-menu).
export { contextMenu as 'context-menu' };
