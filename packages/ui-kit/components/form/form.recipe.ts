// Slot recipe for <ui-form> / React Form (Base UI Form): a column of fields, fieldsets and actions,
// spaced with the collection gap of the container ladder (theme gap-collection, default 2u; the gap
// attribute wins), with no box of its own (resolveForm). The React renderer is a native <form>, whose
// user-agent margin is reset.
import { defineSlotRecipe } from '@pandacss/dev';
import { UI_FONT } from '../recipe-parts.ts';

export const form = defineSlotRecipe({
  className: 'ui-form',
  description: 'Form of kit fields (ui-form, React Form): its fields, fieldsets and actions in a column.',
  slots: ['root'],
  base: {
    root: {
      display: 'flex', flexDirection: 'column', alignItems: 'stretch', minWidth: '0',
      gap: 'calc(var(--ui-gap, var(--ui-gap-collection)) * var(--ui-unit) * 1px)',
      margin: '0', padding: '0', fontFamily: UI_FONT,
      // Fields fill the column; a lone action keeps its own width (put several in a ui-group).
      '& > .ui-button__root': { alignSelf: 'flex-start' },
    },
  },
});
