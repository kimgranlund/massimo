// Component families for the Components page and its family picker; its own module so the shell
// can list them without loading the page.
/** Component families, in page order: [id, label, elements]. */
export const FAMILIES = [
  ['actions', 'Actions', 'ui-button · ui-toggle · ui-toggle-group'],
  ['labels', 'Labels', 'ui-badge · ui-tag · ui-chip'],
  ['fields', 'Fields', 'ui-input · ui-select · ui-field · ui-field-grid · ui-fieldset'],
  ['entry', 'Entry', 'ui-number-field · ui-otp-field'],
  ['selection', 'Selection', 'ui-listbox · ui-segmented · ui-select · ui-combobox · ui-autocomplete'],
  ['choices', 'Choices', 'ui-checkbox · ui-radio · ui-switch · ui-radio-group · ui-checkbox-group'],
  ['tracks', 'Tracks', 'ui-range · ui-progress · ui-meter'],
  ['color', 'Color', 'ui-swatch · ui-palette'],
  ['media', 'Media', 'ui-swiper · ui-image'],
  ['display', 'Display', 'ui-separator · ui-avatar'],
  ['disclosure', 'Disclosure', 'ui-collapsible · ui-accordion · ui-tabs'],
  ['feedback', 'Feedback', 'ui-toast-viewport'],
  ['forms', 'Forms', 'ui-form'],
  ['scrolling', 'Scrolling', 'ui-scroll-area'],
  ['overlays', 'Overlays', 'ui-dialog · ui-alert-dialog · ui-drawer'],
  ['menus', 'Menus', 'ui-menu · ui-context-menu · ui-menubar'],
  ['popups', 'Popups', 'ui-popover · ui-tooltip · ui-preview-card · ui-navigation-menu'],
] as const;
export type Family = (typeof FAMILIES)[number][0];
export const isFamily = (v: string | null): v is Family => FAMILIES.some(([f]) => f === v);
