// Slot recipe for <ui-color-picker> and the React ColorPicker: a swatch trigger and a popover of OKLCH
// channels. Only an accepted color submits: dragging changes a draft until Apply.
import { defineSlotRecipe } from '@pandacss/dev';

export const colorPicker = defineSlotRecipe({
  className: 'ui-color-picker',
  description: 'Edit a color in OKLCH (ui-color-picker, React ColorPicker).',
  slots: ['root', 'preview', 'channels', 'actions'],
  base: {
    root: { display: 'inline-flex' },
    preview: { display: 'block', height: 'calc(10 * var(--u))', borderRadius: 'calc(var(--u) * var(--ui-radius-scale))' },
    channels: { display: 'flex', flexDirection: 'column', gap: 'calc(2 * var(--u))', width: 'calc(56 * var(--u))', maxWidth: '100%' },
    actions: { display: 'flex', justifyContent: 'flex-end', gap: 'calc(2 * var(--u))' },
  },
});

export { colorPicker as 'color-picker' };
