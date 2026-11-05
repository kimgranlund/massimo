// The composed row: <ui-row> and the React Row. A CSS-only tag, like ui-container: the recipe object is
// also emitted as global rules on :is(ui-row, [data-ui=row]). Its inset is declared by the container
// that holds it (--ui-row-edge, --ui-row-block, container.recipe.ts) and inherited, so wrappers between
// the two change nothing. `header` gives a row the height of a divided row, for a title above a list.
import { defineSlotRecipe } from '@pandacss/dev';
import { ROW_BLOCK, tagRules } from '../recipe-parts.ts';

export const row = defineSlotRecipe({
  className: 'ui-row',
  description: 'A composed row (ui-row, React Row): text and actions on its container\'s text edge.',
  slots: ['root'],
  base: {
    root: {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'calc(2 * var(--ui-unit) * 1px)', minWidth: 0,
      paddingInline: 'var(--ui-row-edge, 0px)', paddingBlock: 'var(--ui-row-block, 0px)',
      '&[header]': { paddingBlock: ROW_BLOCK },
    },
  },
});

export const rowTags = tagRules(':is(ui-row, [data-ui=row])', row);
