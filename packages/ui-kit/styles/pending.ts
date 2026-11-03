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
  ':is(ui-button, ui-input, ui-select, ui-listbox, ui-segmented, ui-badge, ui-tag, ui-chip, ui-checkbox, ui-radio, ui-switch, ui-range, ui-progress, ui-palette, ui-swiper, ui-field, ui-field-grid, ui-meter, ui-toggle, ui-collapsible, ui-accordion, ui-tabs, ui-menu, ui-context-menu, ui-menubar):not(:defined)': { visibility: 'hidden', animation: 'ui-reveal 0s 1.5s forwards' },
  ':is(ui-input, ui-select):not(:defined)': { display: 'block', minHeight: FIELD_HEIGHT },
  'ui-segmented:not(:defined)': { minHeight: 'var(--h)' },
  ':is(ui-badge, ui-tag, ui-chip):not(:defined)': { display: 'inline-flex' },
  ':is(ui-checkbox, ui-radio, ui-switch):not(:defined)': { display: 'inline-flex', minHeight: 'var(--slot)' },
  // Fields keep the block flow their controls reserve space in.
  ':is(ui-field, ui-field-grid):not(:defined)': { display: 'block' },
  // A collapsible reserves its trigger row.
  ':is(ui-collapsible, ui-accordion):not(:defined)': { display: 'block', minHeight: 'var(--h)' },
  // Tabs reserve the list row and the 2u gap above the panel.
  'ui-tabs:not(:defined)': { display: 'block', minHeight: 'calc(var(--h) + 2 * var(--u))' },
  // A menu reserves its trigger row.
  'ui-menu:not(:defined)': { display: 'inline-flex', minHeight: 'var(--h)' },
  // Until a menu has built its popup (popover), its items stay out of the flow: also while defined but
  // not yet connected, when another element forces a style pass (else the popup would fade out from block).
  'ui-menu > :not([data-part=trigger], [data-part=submenu-trigger], [popover])': { display: 'none' },
  // A context menu's area shows at once; its items wait for the popup.
  'ui-context-menu:not(:defined)': { display: 'block' },
  // A menubar reserves its row.
  'ui-menubar:not(:defined)': { display: 'inline-flex', minHeight: 'var(--h)' },
  'ui-context-menu > :not([data-part=trigger], [popover])': { display: 'none' },
  ':is(ui-range, ui-progress):not(:defined)': { display: 'block', height: 'calc(4 * var(--u))' },
  // A toggle reserves the control height like a button.
  'ui-toggle:not(:defined)': { display: 'inline-flex', minHeight: 'var(--h)' },
  // A meter reserves its text row (one control line), the 1.5u gap and the 4u track.
  'ui-meter:not(:defined)': { display: 'block', minHeight: 'calc(var(--line) + 5.5 * var(--u))' },
  // A separator reserves its rule (thickness max(1px, B)) until its classes arrive.
  'ui-separator:not(:defined)': { display: 'block', flexShrink: 0, alignSelf: 'stretch', height: 'var(--separator)' },
  'ui-separator[orientation=vertical]:not(:defined)': { height: 'auto', width: 'var(--separator)' },
  // An avatar keeps its square; its initials stay hidden until the fallback is set up.
  'ui-avatar:not(:defined)': { display: 'inline-block', flexShrink: 0, width: 'var(--avatar)', height: 'var(--avatar)', visibility: 'hidden', animation: 'ui-reveal 0s 1.5s forwards' },
  // Choice groups: hidden until defined, in the block flow their choices reserve.
  ':is(ui-radio-group, ui-checkbox-group, ui-fieldset):not(:defined)': { display: 'block', visibility: 'hidden', animation: 'ui-reveal 0s 1.5s forwards' },
});
