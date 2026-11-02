// Headless form field: wires a control to its label, description, and error message.
// `native: true` targets a real <input> (React); otherwise a custom element whose
// control is a role="textbox" element, so state goes through ARIA instead.
import type { Attrs } from './attrs.ts';

export interface FieldState {
  id: string;
  hasLabel?: boolean;
  hasDescription?: boolean;
  /** Error message to show; its presence marks the control invalid. */
  error?: string;
  required?: boolean;
  disabled?: boolean;
  readonly?: boolean;
  native?: boolean;
}

export const fieldIds = (id: string) => ({ control: id, label: `${id}-label`, description: `${id}-desc`, error: `${id}-error` });

export function fieldAttrs(s: FieldState) {
  const ids = fieldIds(s.id);
  const describedBy = [s.hasDescription && ids.description, s.error && ids.error].filter(Boolean).join(' ');
  const shared: Attrs = {
    id: ids.control,
    'aria-describedby': describedBy || undefined,
    'aria-invalid': s.error ? 'true' : undefined,
  };
  const control: Attrs = s.native
    ? { ...shared, required: s.required || undefined, disabled: s.disabled || undefined, readonly: s.readonly || undefined }
    : {
        ...shared,
        role: 'textbox',
        'aria-labelledby': s.hasLabel === false ? undefined : ids.label,
        'aria-required': s.required ? 'true' : undefined,
        'aria-disabled': s.disabled ? 'true' : undefined,
        'aria-readonly': s.readonly ? 'true' : undefined,
        tabindex: s.disabled ? -1 : 0,
      };
  return {
    label: (s.native ? { id: ids.label, for: ids.control } : { id: ids.label }) satisfies Attrs,
    control,
    description: { id: ids.description } satisfies Attrs,
    // role=alert announces a new error without moving focus.
    error: { id: ids.error, role: 'alert' } satisfies Attrs,
  };
}
