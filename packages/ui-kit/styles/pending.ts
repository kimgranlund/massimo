// FOUC guard for custom elements. Until an element is defined it is hidden but keeps
// its final size (tag rules in defaults.ts already apply). If the script never arrives,
// the reveal animation shows the raw content after 1.5s instead of hiding it forever.
import { defineGlobalStyles, defineKeyframes } from '@pandacss/dev';

export const pendingKeyframes = defineKeyframes({
  'ui-reveal': { to: { visibility: 'visible' } },
  // Indeterminate progress sweep.
  'ui-spin': { to: { rotate: '1turn' } },
  'ui-indeterminate': { from: { translate: '-100% 0' }, to: { translate: '340% 0' } },
});

// Control height plus an approximate label line.
const FIELD_HEIGHT = 'calc(var(--h) + 1.75rem)';

export const pending = defineGlobalStyles({
  ':is(ui-button, ui-input, ui-select, ui-listbox, ui-segmented, ui-badge, ui-tag, ui-chip, ui-checkbox, ui-radio, ui-switch, ui-range, ui-progress, ui-palette, ui-swiper, ui-field, ui-field-grid, ui-meter, ui-toggle, ui-collapsible, ui-accordion, ui-tabs, ui-combobox, ui-autocomplete):not(:defined)': { visibility: 'hidden', animation: 'ui-reveal 0s 1.5s forwards' },
  ':is(ui-input, ui-select, ui-combobox, ui-autocomplete):not(:defined)': { display: 'block', minHeight: FIELD_HEIGHT },
  ':is(ui-button, ui-input, ui-select, ui-listbox, ui-segmented, ui-badge, ui-tag, ui-chip, ui-checkbox, ui-radio, ui-switch, ui-range, ui-progress, ui-palette, ui-swiper, ui-field, ui-field-grid, ui-meter, ui-toggle, ui-collapsible, ui-accordion, ui-tabs, ui-menu, ui-context-menu, ui-menubar):not(:defined)': { visibility: 'hidden', animation: 'ui-reveal 0s 1.5s forwards' },
  ':is(ui-button, ui-input, ui-select, ui-listbox, ui-segmented, ui-badge, ui-tag, ui-chip, ui-checkbox, ui-radio, ui-switch, ui-range, ui-progress, ui-palette, ui-swiper, ui-field, ui-field-grid, ui-meter, ui-toggle, ui-collapsible, ui-accordion, ui-tabs, ui-popover, ui-tooltip, ui-preview-card, ui-navigation-menu):not(:defined)': { visibility: 'hidden', animation: 'ui-reveal 0s 1.5s forwards' },
  ':is(ui-input, ui-select):not(:defined)': { display: 'block', minHeight: FIELD_HEIGHT },
  'ui-segmented:not(:defined)': { minHeight: 'var(--h)' },
  ':is(ui-badge, ui-tag, ui-chip):not(:defined)': { display: 'inline-flex' },
  ':is(ui-checkbox, ui-radio, ui-switch):not(:defined)': { display: 'inline-flex', minHeight: 'var(--slot)' },
  // Fields keep the block flow their controls reserve space in.
  ':is(ui-field, ui-field-grid):not(:defined)': { display: 'block' },
  // A collapsible reserves its trigger row.
  ':is(ui-collapsible, ui-accordion):not(:defined)': { display: 'block', minHeight: 'var(--h)' },
  // Tabs reserve the list row and the 2u gap above the panel.
  // Anchored popups: the host has no box; only the trigger shows before the element runs.
  'ui-popover:not(:defined)': { display: 'contents' },
  'ui-popover:not(:defined) > :not([data-part=trigger])': { display: 'none' },
  'ui-tooltip:not(:defined)': { display: 'contents' },
  'ui-tooltip:not(:defined) > [data-part=popup]': { display: 'none' },
  'ui-preview-card:not(:defined)': { display: 'contents' },
  'ui-preview-card:not(:defined) > :not(:first-child)': { display: 'none' },
  // A navigation menu reserves its list row; item contents wait for the element.
  'ui-navigation-menu:not(:defined)': { display: 'block', minHeight: 'var(--h)' },
  'ui-navigation-menu:not(:defined) [data-part=content]': { display: 'none' },
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
  // A toast viewport has no size of its own until toasts arrive; it stays out of sight until defined.
  'ui-toast-viewport:not(:defined)': { display: 'none' },
  // A separator reserves its rule (thickness max(1px, B)) until its classes arrive.
  'ui-textarea:not(:defined)': { display: 'block', minHeight: 'calc(var(--h) + 2 * var(--line))' },
  'ui-breadcrumb:not(:defined)': { display: 'block', minHeight: 'var(--line)' },
  'ui-kbd:not(:defined)': { display: 'inline-block', minWidth: 'calc(5 * var(--u))', minHeight: 'calc(5 * var(--u))' },
  'ui-spinner:not(:defined)': { display: 'inline-block', minWidth: 'calc(4 * var(--u))', minHeight: 'calc(4 * var(--u))' },
  'ui-separator:not(:defined)': { display: 'block', flexShrink: 0, alignSelf: 'stretch', height: 'var(--separator)' },
  'ui-separator[orientation=vertical]:not(:defined)': { height: 'auto', width: 'var(--separator)' },
  // An avatar keeps its square; its initials stay hidden until the fallback is set up.
  'ui-avatar:not(:defined)': { display: 'inline-block', flexShrink: 0, width: 'var(--avatar)', height: 'var(--avatar)', visibility: 'hidden', animation: 'ui-reveal 0s 1.5s forwards' },
  // Choice groups: hidden until defined, in the block flow their choices reserve.
  ':is(ui-radio-group, ui-checkbox-group, ui-fieldset):not(:defined)': { display: 'block', visibility: 'hidden', animation: 'ui-reveal 0s 1.5s forwards' },
  // A form keeps the block flow of its fields (they reserve their own space).
  'ui-form:not(:defined)': { display: 'block' },
  // A scroll area keeps the block its author sized and scrolls natively until its viewport wraps the content.
  'ui-scroll-area:not(:defined)': { display: 'block', overflow: 'auto' },
  // A number field reserves its label line and control row, like an input.
  'ui-number-field:not(:defined)': { display: 'block', minHeight: FIELD_HEIGHT, visibility: 'hidden', animation: 'ui-reveal 0s 1.5s forwards' },
  // An OTP field reserves its row of 8u cells.
  'ui-otp-field:not(:defined)': { display: 'inline-flex', minHeight: 'var(--h)', visibility: 'hidden', animation: 'ui-reveal 0s 1.5s forwards' },
  // A toggle group reserves its row (it holds 7u toggles inside its composite edge).
  'ui-toggle-group:not(:defined)': { visibility: 'hidden', animation: 'ui-reveal 0s 1.5s forwards', display: 'inline-flex', minHeight: 'var(--h)' },
  // A modal layer draws nothing in the page but its trigger: its popup content never shows inline.
  ':is(ui-dialog, ui-alert-dialog, ui-drawer):not(:defined)': { display: 'contents' },
  ':is(ui-dialog, ui-alert-dialog, ui-drawer):not(:defined) > :not([data-part=trigger])': { display: 'none' },
});
