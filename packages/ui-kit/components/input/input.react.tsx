// React <Input>: same structure, ids, data hooks and default styles as <ui-input>.
import { useId, type InputHTMLAttributes } from 'react';
import { fieldAttrs, toReactProps } from '../../dom/index.ts';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  description?: string;
  error?: string;
}

export function Input({ label, description, error, className, id, required, disabled, readOnly, ...rest }: InputProps) {
  const auto = useId();
  const a = fieldAttrs({ id: id ?? auto, hasDescription: !!description, error, required, disabled, readonly: readOnly, native: true });
  return (
    <div data-ui="input" className={className}>
      {label && <label data-part="label" {...toReactProps(a.label)}>{label}</label>}
      <input data-part="control" {...toReactProps(a.control)} {...rest} />
      {description && <p data-part="description" {...toReactProps(a.description)}>{description}</p>}
      {error && <p data-part="error" {...toReactProps(a.error)}>{error}</p>}
    </div>
  );
}
