// Slot recipe for <ui-alert-dialog> and the React AlertDialog (Base UI Alert Dialog): the dialog's
// look and geometry (components/dialog/dialog.recipe.ts: a card-xl container popup over the
// bg.backdrop role, reveal intent), under its own class names.
import { defineSlotRecipe } from '@pandacss/dev';
import { dialogBase, dialogSlots } from '../dialog/dialog.recipe.ts';

export const alertDialog = defineSlotRecipe({
  className: 'ui-alert-dialog',
  description: 'A modal dialog that asks for a decision (ui-alert-dialog, React AlertDialog): the dialog popup with role=alertdialog.',
  slots: [...dialogSlots],
  base: dialogBase,
});

// The recipe test looks a component's recipe up by its name.
export { alertDialog as 'alert-dialog' };
