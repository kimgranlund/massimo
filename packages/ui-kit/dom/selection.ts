// The value text of a control shown beside it: a number with its unit, or On and Off.
export interface Selectable { checked?: boolean; value?: unknown }
export function selectionText(control: Selectable | null | undefined, unit = '') {
  if (!control) return '';
  if (typeof control.checked === 'boolean') return control.checked ? 'On' : 'Off';
  return control.value == null || control.value === '' ? '' : `${control.value}${unit}`;
}
