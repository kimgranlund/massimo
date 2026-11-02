// React <Input>: same structure, ids and recipe as <ui-input>.
import { useId, type InputHTMLAttributes } from 'react';
import { fieldAttrs, toReactProps } from '../../dom/index.ts';
import { input, type InputVariantProps } from '../../styled-system/recipes/index.js';
import { cx } from '../../styled-system/css/index.js';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>, InputVariantProps {
  label?: string;
  description?: string;
  error?: string;
}

export function Input({ label, description, error, size, className, id, required, disabled, readOnly, ...rest }: InputProps) {
  const auto = useId();
  const a = fieldAttrs({ id: id ?? auto, hasDescription: !!description, error, required, disabled, readonly: readOnly, native: true });
  const cls = input({ size });
  return (
    <div className={cx(cls.root, className)}>
      {label && <label className={cls.label} {...toReactProps(a.label)}>{label}</label>}
      <input className={cls.control} {...toReactProps(a.control)} {...rest} />
      {description && <p className={cls.description} {...toReactProps(a.description)}>{description}</p>}
      {error && <p className={cls.error} {...toReactProps(a.error)}>{error}</p>}
    </div>
  );
}
