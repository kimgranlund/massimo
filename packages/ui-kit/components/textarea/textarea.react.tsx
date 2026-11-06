// React <Textarea>: the same structure, ids and data hooks as <ui-textarea>, with a native <textarea>
// as its contents. The host carries the field state as data-*, like the web component's host.
import { useId, type ChangeEvent, type CSSProperties, type FormEvent, type ReactNode, type TextareaHTMLAttributes } from 'react';
import { eventDetails, type ChangeDetails } from '../../dom/events.ts';
import { fieldAttrs } from '../../dom/field.ts';
import { toReactProps } from '../../dom/attrs.ts';
import { useFieldState, useFormError } from '../state.react.ts';
import { textarea } from '../../styled-system/recipes/textarea.js';
import { TEXTAREA_ROWS } from '../../tokens/geometry/resolve.ts';

export interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'prefix' | 'className' | 'children'> {
  label?: string;
  /** Keep the label as the accessible name but do not draw it. */
  hideLabel?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
  description?: string;
  error?: string;
  /** The rows to hold before the text grows the field. Default 3. */
  rows?: number;
  /** The text changed (Base UI onValueChange; reason 'none'). The native onChange still fires. */
  onValueChange?: (value: string, details: ChangeDetails) => void;
  className?: string;
}

export function Textarea({ label, hideLabel, description, error: own, leading, trailing, rows = TEXTAREA_ROWS, className, id, required, disabled, readOnly, onInvalid, onChange, onValueChange, ...rest }: TextareaProps) {
  const auto = useId();
  const formError = useFormError(rest.name);
  const error = own ?? (formError || undefined);
  const a = fieldAttrs({ id: id ?? auto, hasLabel: !!label, hasDescription: !!description, error, required, disabled, readonly: readOnly, native: true });
  const f = useFieldState<HTMLDivElement>({
    disabled, readOnly, required, error: !!error,
    filled: rest.value !== undefined ? String(rest.value) !== '' : undefined, defaultFilled: String(rest.value ?? rest.defaultValue ?? '') !== '',
  });
  const c = textarea();
  return (
    <div ref={f.ref} data-ui="textarea" data-hide-label={hideLabel || undefined} {...f.attrs} {...f.handlers} style={{ '--ui-rows': rows } as CSSProperties} className={[c.root, className].filter(Boolean).join(' ')}>
      {label && <label data-part="label" className={c.label} {...toReactProps(a.label)}>{label}</label>}
      <div data-part="control" className={c.control}>
        {leading != null && <span data-part="leading" className={c.leading}>{leading}</span>}
        <textarea
          data-part="contents" className={c.contents} {...toReactProps(a.control)} {...rest} rows={rows}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => { onValueChange?.(e.target.value, eventDetails('none', e.nativeEvent)); onChange?.(e); }}
          onInvalid={(e: FormEvent<HTMLTextAreaElement>) => { f.controlProps.onInvalid(); onInvalid?.(e); }}
        />
        {trailing != null && <span data-part="trailing" className={c.trailing}>{trailing}</span>}
      </div>
      {description && <p data-part="description" className={c.description} {...toReactProps(a.description)}>{description}</p>}
      {error && <p data-part="error" className={c.error} {...toReactProps(a.error)}>{error}</p>}
    </div>
  );
}
