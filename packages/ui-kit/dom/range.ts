// Headless range: value stepping and pointer mapping for sliders.
export interface RangeState { value: number; min: number; max: number; step: number }

/** Snap to the step grid (anchored at min) and clamp. */
export function snap(v: number, s: RangeState) {
  const stepped = s.step > 0 ? s.min + Math.round((v - s.min) / s.step) * s.step : v;
  const decimals = (String(s.step).split('.')[1] ?? '').length;
  return Math.min(s.max, Math.max(s.min, Number(stepped.toFixed(decimals))));
}

export const ratioOf = (s: RangeState) => (s.max === s.min ? 0 : (s.value - s.min) / (s.max - s.min));

/** Value after a key, or undefined when the key is not a range key. PageUp/Down move 10%. */
export function rangeKey(key: string, s: RangeState, rtl = false): number | undefined {
  const big = Math.max(s.step, (s.max - s.min) / 10);
  const inc = rtl ? 'ArrowLeft' : 'ArrowRight', dec = rtl ? 'ArrowRight' : 'ArrowLeft';
  switch (key) {
    case inc: case 'ArrowUp': return snap(s.value + s.step, s);
    case dec: case 'ArrowDown': return snap(s.value - s.step, s);
    case 'PageUp': return snap(s.value + big, s);
    case 'PageDown': return snap(s.value - big, s);
    case 'Home': return s.min;
    case 'End': return s.max;
  }
  return undefined;
}

/**
 * Value under a pointer x within a track rect. The thumb's centre travels from `edge / 2` to
 * `width − edge / 2`; pass the track height (the thumb plus its two insets).
 */
export function valueAt(x: number, rect: { left: number; width: number }, edge: number, s: RangeState, rtl = false) {
  const usable = Math.max(1, rect.width - edge);
  let r = (x - rect.left - edge / 2) / usable;
  if (rtl) r = 1 - r;
  return snap(s.min + Math.min(1, Math.max(0, r)) * (s.max - s.min), s);
}

export function sliderAttrs(s: RangeState & { disabled?: boolean; label?: string; valueText?: string }) {
  return {
    role: 'slider',
    tabindex: s.disabled ? -1 : 0,
    'aria-valuemin': s.min, 'aria-valuemax': s.max, 'aria-valuenow': s.value,
    'aria-valuetext': s.valueText,
    'aria-label': s.label || undefined,
    'aria-disabled': s.disabled ? 'true' : undefined,
    'aria-orientation': 'horizontal',
  };
}

/** Slider state (Base UI Slider): data-orientation, data-dragging while a pointer drags the thumb. */
export function rangeDataAttrs(s: { dragging?: boolean; orientation?: 'horizontal' | 'vertical' }) {
  return { 'data-orientation': s.orientation ?? 'horizontal', 'data-dragging': s.dragging ? '' : undefined };
}

/**
 * Progress state (Base UI Progress): data-indeterminate without a value, data-complete at the max,
 * data-progressing in between. Returns the clamped value too.
 */
export function progressState(value: number | null | undefined, max: number) {
  const indeterminate = value == null || Number.isNaN(value);
  const v = indeterminate ? 0 : Math.min(max, Math.max(0, value));
  const complete = !indeterminate && v >= max;
  return {
    indeterminate, value: v, ratio: max ? v / max : 0,
    attrs: { 'data-indeterminate': indeterminate ? '' : undefined, 'data-complete': complete ? '' : undefined, 'data-progressing': !indeterminate && !complete ? '' : undefined },
  };
}
