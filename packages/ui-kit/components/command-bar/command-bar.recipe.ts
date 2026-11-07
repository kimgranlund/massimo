// Slot recipe for <ui-command-bar> and the React CommandBar: a search field over grouped results, in
// the kit's dialog.
import { defineSlotRecipe } from '@pandacss/dev';

export const commandBar = defineSlotRecipe({
  className: 'ui-command-bar',
  description: 'Search and run commands (ui-command-bar, React CommandBar).',
  slots: ['root', 'list', 'group', 'item', 'empty'],
  base: {
    root: { display: 'contents' },
    list: { display: 'flex', flexDirection: 'column', gap: 'var(--u)', maxHeight: 'calc(80 * var(--u))', overflowY: 'auto' },
    group: { textStyle: 'group-kicker', paddingInline: 'calc(2 * var(--u))', paddingBlockStart: 'var(--u)' },
    item: {
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'calc(2 * var(--u))', minHeight: 'calc(7 * var(--u))', paddingInline: 'calc(2 * var(--u))', borderRadius: 'var(--radius)', textStyle: 'control-md',
      '&[aria-selected=true]': { bg: 'bg.controlHover' },
    },
    empty: { textStyle: 'body-sm', padding: 'calc(2 * var(--u))' },
  },
});

export { commandBar as 'command-bar' };
