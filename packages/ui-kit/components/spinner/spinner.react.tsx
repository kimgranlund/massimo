// React <Spinner>: the web component's status role, ring and label with the same slot recipe.
import type { HTMLAttributes } from 'react';
import { spinnerAttrs } from '../../dom/display.ts';
import { toReactProps } from '../../dom/attrs.ts';
import { spinner } from '../../styled-system/recipes/spinner.js';

export interface SpinnerProps extends HTMLAttributes<HTMLSpanElement> {
  /** The visible text and accessible name. With none, the ring stands alone, named "Loading". */
  label?: string;
  /** Keep the label as the accessible name without showing it. */
  hideLabel?: boolean;
  /** Unit u in px for this element. */
  size?: number;
}

export function Spinner({ label = '', hideLabel = false, size, className, ...rest }: SpinnerProps) {
  const c = spinner();
  return (
    <span {...toReactProps(spinnerAttrs(label))} {...rest} data-ui="spinner" data-size={size} className={[c.root, className].filter(Boolean).join(' ')}>
      <span data-part="ring" aria-hidden="true" className={c.ring} />
      <span data-part="label" className={c.label} hidden={!label || hideLabel}>{label}</span>
    </span>
  );
}
