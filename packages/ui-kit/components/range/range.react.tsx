// React <Range> and <Progress>: native <input type="range"> and <progress> inside a data-ui host with
// the web components' anatomy (Base UI Slider and Progress anatomy: track > indicator, thumb). The native element owns value, keys, pointer,
// form value and semantics; the painted parts follow it through --ui-ratio (a continuous value set as
// a custom property). The native range thumb is as wide as the track, so its travel equals the
// painted thumb's (range.recipe.ts). The host carries the data-* state contract like the web
// components' hosts: field state (state.react.ts), data-orientation and data-dragging; Progress
// data-indeterminate, data-progressing or data-complete.
import { useEffect, useRef, useState, type ChangeEvent, type CSSProperties, type HTMLAttributes, type InputHTMLAttributes } from 'react';
import { eventDetails, progressState, rangeDataAttrs, ratioOf, toReactProps, type ChangeDetails, type ChangeReason } from '../../dom/index.ts';
import { useFieldState } from '../state.react.ts';
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
  /** Every value change (Base UI onValueChange): reason 'track-press', 'drag' or 'keyboard'. The native onChange still fires. */
  onValueChange?: (value: number, details: ChangeDetails) => void;
  /** The value at the end of an interaction, when it changed (Base UI onValueCommitted; the native change event). */
  onValueCommitted?: (value: number, details: ChangeDetails) => void;
}

export function Range({ value, defaultValue = 50, min = 0, max = 100, step = 1, label, valueText, size, className, style, onChange, onValueChange, onValueCommitted, onPointerDown, onKeyDown, onInvalid, ...input }: RangeProps) {
  const [inner, setInner] = useState(defaultValue);
  const [dragging, setDragging] = useState(false);
  // The gesture behind a change: a pointer press on the track, then a drag; otherwise keys.
  const gesture = useRef<'keys' | 'press' | 'drag'>('keys');
  const reason = (): ChangeReason => gesture.current === 'press' ? 'track-press' : gesture.current === 'drag' ? 'drag' : 'keyboard';
  const native = useRef<HTMLInputElement>(null);
  const committed = useRef(onValueCommitted);
  committed.current = onValueCommitted;
  // The native change event (React's onChange is the input event) is the commit.
  useEffect(() => {
    const el = native.current;
    if (!el) return;
    const on = (e: Event) => { committed.current?.(Number(el.value), eventDetails(reason(), e)); gesture.current = 'keys'; };
    el.addEventListener('change', on);
    return () => el.removeEventListener('change', on);
  }, []);
  const current = value ?? inner;
  const ratio = ratioOf({ value: current, min, max, step });
  const f = useFieldState<HTMLDivElement>({ disabled: input.disabled, required: input.required, defaultFilled: true });
  // Dragging ends wherever the pointer is released.
  useEffect(() => {
    if (!dragging) return;
    const end = () => setDragging(false);
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);
    return () => { window.removeEventListener('pointerup', end); window.removeEventListener('pointercancel', end); };
  }, [dragging]);
  const c = range();
  return (
    <div ref={f.ref} data-ui="range" data-size={size} {...f.attrs} {...toReactProps(rangeDataAttrs({ dragging }))} {...f.handlers} className={cx(c.root, className)} style={{ ...style, '--ui-ratio': String(ratio) } as CSSProperties}>
      <span data-part="track" className={c.track}><span data-part="indicator" className={c.indicator} /></span>
      <span data-part="thumb" className={c.thumb} />
      <input
        type="range" min={min} max={max} step={step} aria-label={label} aria-valuetext={valueText}
        ref={native}
        {...(value === undefined ? { defaultValue } : { value })}
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          const v = Number(e.target.value);
          if (value === undefined) setInner(v);
          onValueChange?.(v, eventDetails(reason(), e.nativeEvent));
          if (gesture.current === 'press') gesture.current = 'drag';
          onChange?.(e);
        }}
        onPointerDown={(e) => { if (!input.disabled && e.button === 0) { setDragging(true); gesture.current = 'press'; } onPointerDown?.(e); }}
        onKeyDown={(e) => { gesture.current = 'keys'; onKeyDown?.(e); }}
        onInvalid={(e) => { f.controlProps.onInvalid(); onInvalid?.(e); }}
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
  const p = progressState(value, max);
  const c = progress();
  return (
    <div {...rest} data-ui="progress" data-size={size} {...toReactProps(p.attrs)} className={cx(c.root, className)} style={{ ...style, '--ui-ratio': String(p.ratio) } as CSSProperties}>
      <span data-part="track" className={c.track}><span data-part="indicator" className={c.indicator} /></span>
      <progress max={max} aria-label={label} {...(p.indeterminate ? {} : { value: p.value })} />
    </div>
  );
}
