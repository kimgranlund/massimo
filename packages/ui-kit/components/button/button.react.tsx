// React <Button>: a native <button> sharing the headless state and default styles with <ui-button>.
import type { ButtonHTMLAttributes } from 'react';
import { buttonAttrs, isInactive, toReactProps } from '../../dom/index.ts';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
}

export function Button({ loading, disabled, onClick, type = 'button', ...rest }: ButtonProps) {
  const state = { disabled, loading, native: true };
  return (
    <button
      type={type}
      data-ui="button"
      {...toReactProps(buttonAttrs(state))}
      {...rest}
      onClick={(e) => {
        // aria-disabled instead of `disabled` keeps it focusable, so block activation here.
        if (isInactive(state)) { e.preventDefault(); return; }
        onClick?.(e);
      }}
    />
  );
}
