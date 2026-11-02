// FOUC guard for custom elements. Until an element is defined it is hidden but keeps
// its layout (each component adds its reserved size). If the script never arrives,
// the reveal animation shows the raw content after 1.5s instead of hiding it forever.
import { defineGlobalStyles, defineKeyframes } from '@pandacss/dev';

export const pendingKeyframes = defineKeyframes({ 'ui-reveal': { to: { visibility: 'visible' } } });

export const pending = defineGlobalStyles({
  ':is(ui-button, ui-input):not(:defined)': { visibility: 'hidden', animation: 'ui-reveal 0s 1.5s forwards' },
});
