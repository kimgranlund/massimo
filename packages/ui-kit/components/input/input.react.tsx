// React <Input>: same structure, ids, data hooks and default styles as <ui-input>. The host carries
// the field state as data-* (state.react.ts), like the web component's host: an author error shows
// at once, a built-in problem (required, type, pattern) after blur or a blocked submit.
import { useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { fieldAttrs, toReactProps } from '../../dom/index.ts';
import { useFieldState } from '../state.react.ts';
import { cx } from '../../styled-system/css/cx.js';
import { input } from '../../styled-system/recipes/input.js';

// The control follows the construction pattern: leading / prefix / contents / suffix / trailing.
export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string;
  /** Keep the label as the accessible name but do not draw it. */
  hideLabel?: boolean;
  leading?: ReactNode;
  prefix?: ReactNode;
  suffix?: ReactNode;
  trailing?: ReactNode;
  description?: string;
  error?: string;
}

export function Input({ label, hideLabel, description, error, className, id, required, disabled, readOnly, leading, prefix, suffix, trailing, onInvalid, ...rest }: InputProps) {
  const auto = useId();
  const a = fieldAttrs({ id: id ?? auto, hasDescription: !!description, error, required, disabled, readonly: readOnly, native: true });
  const f = useFieldState<HTMLDivElement>({
    disabled, readOnly, required, error: !!error,
    filled: rest.value !== undefined ? String(rest.value) !== '' : undefined, defaultFilled: String(rest.value ?? rest.defaultValue ?? '') !== '',
  });
  const c = input();
  return (
    <div ref={f.ref} data-ui="input" data-hide-label={hideLabel || undefined} {...f.attrs} {...f.handlers} className={cx(c.root, className)}>
      {label && <label data-part="label" className={c.label} {...toReactProps(a.label)}>{label}</label>}
      <div data-part="control" className={c.control}>
        {leading != null && <span data-part="leading" className={c.leading}>{leading}</span>}
        {prefix != null && <span data-part="prefix" className={c.prefix}>{prefix}</span>}
        <input data-part="contents" className={c.contents} {...toReactProps(a.control)} {...rest} onInvalid={(e) => { f.controlProps.onInvalid(); onInvalid?.(e); }} />
        {suffix != null && <span data-part="suffix" className={c.suffix}>{suffix}</span>}
        {trailing != null && <span data-part="trailing" className={c.trailing}>{trailing}</span>}
      </div>
      {description && <p data-part="description" className={c.description} {...toReactProps(a.description)}>{description}</p>}
      {error && <p data-part="error" className={c.error} {...toReactProps(a.error)}>{error}</p>}
    </div>
  );
}
