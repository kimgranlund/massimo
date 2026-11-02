// Headless form field: wires a control to its label, description, and error message.
import type { Attrs } from './attrs.ts';

export interface FieldState {
  id: string;
  hasDescription?: boolean;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  readonly?: boolean;
}

export const fieldIds = (id: string) => ({ control: id, label: `${id}-label`, description: `${id}-desc`, error: `${id}-error` });

export function fieldAttrs(s: FieldState) {
  const ids = fieldIds(s.id);
  const describedBy = [s.hasDescription && ids.description, s.error && ids.error].filter(Boolean).join(' ');
  return {
    label: { id: ids.label, for: ids.control } satisfies Attrs,
    control: {
      id: ids.control,
      'aria-describedby': describedBy || undefined,
      'aria-invalid': s.error ? 'true' : undefined,
      required: s.required || undefined,
      disabled: s.disabled || undefined,
      readonly: s.readonly || undefined,
    } satisfies Attrs,
    description: { id: ids.description } satisfies Attrs,
    // role=alert announces a new error without moving focus.
    error: { id: ids.error, role: 'alert' } satisfies Attrs,
  };
}
