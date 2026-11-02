// Slot recipe for <ui-accordion> and the React Accordion (Base UI Accordion: Root, Item, Header,
// Trigger, Panel). The items are collapsibles (collapsible.recipe.ts styles their trigger and
// panel); this recipe stacks them and separates them with a thin (1px token) divider in the
// border role, which costs no padding: an item is its 8u trigger row plus the divider while closed
// (resolveDisclosure). The header only wraps the trigger. Horizontal accordions put the dividers
// on the inline end.
import { defineSlotRecipe } from '@pandacss/dev';

const HORIZONTAL = ':is([data-orientation=horizontal]) > &';

export const accordion = defineSlotRecipe({
  className: 'ui-accordion',
  description: 'Stacked collapsibles, one or several open (ui-accordion, React Accordion).',
  slots: ['root', 'item', 'header'],
  base: {
    root: {
      display: 'flex', flexDirection: 'column',
      '&[data-orientation=horizontal]': { flexDirection: 'row', alignItems: 'flex-start' },
    },
    item: {
      borderBlockEndWidth: 'thin', borderColor: 'border',
      [HORIZONTAL]: { borderBlockEndWidth: 0, borderInlineEndWidth: 'thin', flex: '1', minWidth: 0 },
    },
    header: { display: 'block', margin: 0 },
  },
});
