// FOUC guard for custom elements. Until an element is defined it is hidden but keeps
// its final size (tag rules in defaults.ts already apply). If the script never arrives,
// the reveal animation shows the raw content after 1.5s instead of hiding it forever.
import { defineGlobalStyles, defineKeyframes } from '@pandacss/dev';

export const pendingKeyframes = defineKeyframes({ 'ui-reveal': { to: { visibility: 'visible' } } });

const FIELD_HEIGHT = 'calc({sizes.control.md} + 1.75rem)';

export const pending = defineGlobalStyles({
  ':is(ui-button, ui-input, ui-select, ui-listbox, ui-segmented):not(:defined)': { visibility: 'hidden', animation: 'ui-reveal 0s 1.5s forwards' },
  ':is(ui-input, ui-select):not(:defined)': { display: 'block', minHeight: FIELD_HEIGHT },
  'ui-segmented:not(:defined)': { minHeight: 'control.md' },
});
