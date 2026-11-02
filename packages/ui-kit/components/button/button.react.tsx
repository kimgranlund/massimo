// React <Button>: a native <button> sharing the headless state and the recipe with <ui-button>.
import type { ButtonHTMLAttributes } from 'react';
import { buttonAttrs, isInactive, toReactProps } from '../../dom/index.ts';
import { button, type ButtonVariantProps } from '../../styled-system/recipes/index.js';
import { cx } from '../../styled-system/css/index.js';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement>, ButtonVariantProps {
  loading?: boolean;
}

export function Button({ variant, size, loading, disabled, className, onClick, type = 'button', ...rest }: ButtonProps) {
  const state = { disabled, loading, native: true };
  return (
    <button
      type={type}
      {...toReactProps(buttonAttrs(state))}
      {...rest}
      className={cx(button({ variant, size }), className)}
      onClick={(e) => {
        // aria-disabled instead of `disabled` keeps it focusable, so block activation here.
        if (isInactive(state)) { e.preventDefault(); return; }
        onClick?.(e);
      }}
    />
  );
}
