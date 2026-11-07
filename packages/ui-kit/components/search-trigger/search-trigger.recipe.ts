// Slot recipe for <ui-search-trigger> and the React SearchTrigger: a button drawn like a search field,
// with a shortcut hint at its end.
import { defineSlotRecipe } from '@pandacss/dev';

export const searchTrigger = defineSlotRecipe({
  className: 'ui-search-trigger',
  description: 'A search-like action (ui-search-trigger, React SearchTrigger).',
  slots: ['root'],
  base: { root: { display: 'inline-flex', minWidth: 'calc(50 * var(--u))', '& > :is(ui-button, [data-ui=button])': { width: '100%', justifyContent: 'flex-start', color: 'fg.muted' } } },
});

export { searchTrigger as 'search-trigger' };
