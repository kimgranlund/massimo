// React <Range> and <Progress>: native <input type="range"> and <progress> inside a data-ui host with
// the web components' anatomy (track > fill, thumb). The native element owns value, keys, pointer,
// form value and semantics; the painted parts follow it through --ui-ratio (a continuous value set as
// a custom property). The native range thumb is as wide as the track, so its travel equals the
// painted thumb's (range.recipe.ts).
import { useState, type ChangeEvent, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes } from 'react';
import { ratioOf } from '../../dom/index.ts';
import { cx } from '../../styled-system/css/cx.js';
import { range, progress } from '../../styled-system/recipes/index.js';

type Native = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size' | 'value' | 'defaultValue' | 'min' | 'max' | 'step'>;
export interface RangeProps extends Native {
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  /** Accessible name (aria-label) when there is no visible label. */
  label?: string;
  /** Human text for the value (aria-valuetext), e.g. "40%". */
  valueText?: string;
  /** Unit u in px for this control. */
  size?: number;
}

export function Range({ value, defaultValue = 50, min = 0, max = 100, step = 1, label, valueText, size, className, style, onChange, ...input }: RangeProps) {
  const [inner, setInner] = useState(defaultValue);
  const current = value ?? inner;
  const ratio = ratioOf({ value: current, min, max, step });
  const c = range();
  return (
    <div data-ui="range" data-size={size} className={cx(c.root, className)} style={{ ...style, '--ui-ratio': String(ratio) } as CSSProperties}>
      <span data-part="track" className={c.track}><span data-part="fill" className={c.fill} /></span>
      <span data-part="thumb" className={c.thumb} />
      <input
        type="range" min={min} max={max} step={step} aria-label={label} aria-valuetext={valueText}
        {...(value === undefined ? { defaultValue } : { value })}
        onChange={(e: ChangeEvent<HTMLInputElement>) => { if (value === undefined) setInner(Number(e.target.value)); onChange?.(e); }}
        {...input}
      />
    </div>
  );
}

export interface ProgressProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  /** Current value; omit for indeterminate. */
  value?: number | null;
  max?: number;
  label?: string;
  size?: number;
}

export function Progress({ value, max = 100, label, size, className, style, ...rest }: ProgressProps) {
  const indeterminate = value == null || Number.isNaN(value);
  const v = indeterminate ? 0 : Math.min(max, Math.max(0, value!));
  const c = progress();
  return (
    <div {...rest} data-ui="progress" data-size={size} data-indeterminate={indeterminate || undefined} className={cx(c.root, className)} style={{ ...style, '--ui-ratio': String(max ? v / max : 0) } as CSSProperties}>
      <span data-part="track" className={c.track}><span data-part="fill" className={c.fill} /></span>
      <progress max={max} aria-label={label} {...(indeterminate ? {} : { value: v })} />
    </div>
  );
}
