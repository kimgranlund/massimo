// Slot recipe for <ui-chip-select> and the React ChipSelect: ui-select drawn at chip size. The select
// keeps its popup, keyboard and form value. This only changes the trigger's box.
import { defineSlotRecipe } from '@pandacss/dev';

export const chipSelect = defineSlotRecipe({
  className: 'ui-chip-select',
  description: 'A contextual choice at chip size (ui-chip-select, React ChipSelect).',
  slots: ['root'],
  base: {
    root: {
      display: 'inline-flex', width: 'fit-content',
      '& > select': { blockSize: 'calc(6 * var(--u))', width: 'fit-content' },
      '& > [data-part=trigger], & > select > [data-part=trigger]': { height: 'calc(6 * var(--u))', width: 'fit-content', borderRadius: 'min(calc(3 * var(--u) * var(--ui-radius-scale)), calc(3 * var(--u)))' },
    },
  },
});

export { chipSelect as 'chip-select' };
