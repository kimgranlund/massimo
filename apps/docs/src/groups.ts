// The sidebar's component groups. A page belongs to exactly one: the coverage check fails otherwise,
// so a new component can't go missing from the navigation.
export const GROUPS: [string, string[]][] = [
  ['Actions', ['button', 'button-link', 'toggle', 'toggle-group']],
  ['Labels', ['badge', 'tag', 'chip', 'kbd']],
  ['Fields', ['input', 'textarea', 'number-field', 'otp-field', 'select', 'combobox', 'autocomplete', 'field', 'field-grid', 'fieldset', 'form']],
  ['Selection', ['listbox', 'option', 'segmented', 'checkbox', 'checkbox-group', 'radio', 'radio-group', 'switch']],
  ['Progress', ['range', 'progress', 'meter', 'spinner']],
  ['Layout', ['container', 'section', 'row', 'column', 'list', 'grid', 'separator', 'scroll-area']],
  ['Media', ['image', 'swiper', 'avatar', 'swatch', 'palette']],
  ['Disclosure', ['collapsible', 'accordion', 'tabs']],
  ['Overlays', ['dialog', 'alert-dialog', 'drawer', 'popover', 'tooltip', 'preview-card', 'toast']],
  ['Navigation', ['breadcrumb', 'menu', 'context-menu', 'menubar', 'navigation-menu']],
];

/** Slugs with no group, or in more than one. */
export function groupProblems(slugs: string[]) {
  const seen = GROUPS.flatMap(([, s]) => s);
  return [...slugs.filter((s) => seen.filter((x) => x === s).length !== 1), ...seen.filter((s) => !slugs.includes(s))];
}
