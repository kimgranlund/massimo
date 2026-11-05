// A line of text and actions: <ui-row> and the React Row. A CSS-only tag, like ui-container: the recipe
// object is also emitted as global rules on :is(ui-row, [data-ui=row]). A row is layout only: its inset
// comes from the ui-section that holds it. `header` gives it the height of a divided row, for a title
// above a list.
import { defineSlotRecipe } from '@pandacss/dev';
import { ROW_BLOCK, tagRules } from '../recipe-parts.ts';

export const row = defineSlotRecipe({
  className: 'ui-row',
  description: 'A line of text and actions (ui-row, React Row).',
  slots: ['root'],
  base: {
    root: {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'calc(2 * var(--ui-unit) * 1px)', minWidth: 0,
      '&[header]': { paddingBlock: ROW_BLOCK },
    },
  },
});

export const rowTags = tagRules(':is(ui-row, [data-ui=row])', row);
