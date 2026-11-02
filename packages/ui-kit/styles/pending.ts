// FOUC guard for custom elements. Until an element is defined it is hidden but keeps
// its final size (tag rules in defaults.ts already apply). If the script never arrives,
// the reveal animation shows the raw content after 1.5s instead of hiding it forever.
import { defineGlobalStyles, defineKeyframes } from '@pandacss/dev';

export const pendingKeyframes = defineKeyframes({
  'ui-reveal': { to: { visibility: 'visible' } },
  // Indeterminate progress sweep.
  'ui-indeterminate': { from: { translate: '-100% 0' }, to: { translate: '340% 0' } },
});

// Control height plus an approximate label line.
const FIELD_HEIGHT = 'calc(var(--h) + 1.75rem)';

export const pending = defineGlobalStyles({
  ':is(ui-button, ui-input, ui-select, ui-listbox, ui-segmented, ui-badge, ui-tag, ui-chip, ui-checkbox, ui-radio, ui-switch, ui-range, ui-progress, ui-palette, ui-swiper, ui-field, ui-field-grid):not(:defined)': { visibility: 'hidden', animation: 'ui-reveal 0s 1.5s forwards' },
  ':is(ui-input, ui-select):not(:defined)': { display: 'block', minHeight: FIELD_HEIGHT },
  'ui-segmented:not(:defined)': { minHeight: 'var(--h)' },
  ':is(ui-badge, ui-tag, ui-chip):not(:defined)': { display: 'inline-flex' },
  ':is(ui-checkbox, ui-radio, ui-switch):not(:defined)': { display: 'inline-flex', minHeight: 'var(--slot)' },
  // Fields keep the block flow their controls reserve space in.
  ':is(ui-field, ui-field-grid):not(:defined)': { display: 'block' },
  ':is(ui-range, ui-progress):not(:defined)': { display: 'block', height: 'calc(4 * var(--u))' },
  // Choice groups: hidden until defined, in the block flow their choices reserve.
  'ui-radio-group:not(:defined)': { display: 'block', visibility: 'hidden', animation: 'ui-reveal 0s 1.5s forwards' },
});
