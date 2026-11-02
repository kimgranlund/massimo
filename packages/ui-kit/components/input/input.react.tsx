// React <Input>: same structure, ids, data hooks and default styles as <ui-input>.
import { useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { fieldAttrs, toReactProps } from '../../dom/index.ts';

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

export function Input({ label, hideLabel, description, error, className, id, required, disabled, readOnly, leading, prefix, suffix, trailing, ...rest }: InputProps) {
  const auto = useId();
  const a = fieldAttrs({ id: id ?? auto, hasDescription: !!description, error, required, disabled, readonly: readOnly, native: true });
  return (
    <div data-ui="input" data-hide-label={hideLabel || undefined} className={className}>
      {label && <label data-part="label" {...toReactProps(a.label)}>{label}</label>}
      <div data-part="control">
        {leading != null && <span data-part="leading">{leading}</span>}
        {prefix != null && <span data-part="prefix">{prefix}</span>}
        <input data-part="contents" {...toReactProps(a.control)} {...rest} />
        {suffix != null && <span data-part="suffix">{suffix}</span>}
        {trailing != null && <span data-part="trailing">{trailing}</span>}
      </div>
      {description && <p data-part="description" {...toReactProps(a.description)}>{description}</p>}
      {error && <p data-part="error" {...toReactProps(a.error)}>{error}</p>}
    </div>
  );
}
