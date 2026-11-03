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

/** Human text for a value (aria-valuetext): a template where {value} is the thumb's value ("{value} °C"), or a function of the value and the thumb index (Base UI getAriaValueText). */
export type ValueText = string | ((value: number, index: number) => string);
/** The aria-valuetext of one thumb; plain text without {value} is used as written. */
export function thumbValueText(text: ValueText | undefined, value: number, index = 0): string | undefined {
  if (text === undefined || text === '') return undefined;
  return typeof text === 'function' ? text(value, index) : text.replaceAll('{value}', String(value));
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

// ── Range pair (Base UI Slider with value [start, end]): two thumbs that cannot cross ──

/** A two-thumb value: [start, end], start ≤ end. */
export type RangePair = [number, number];
type Bounds = Omit<RangeState, 'value'>;

/** A pair from an attribute ("20,80") or a list; undefined when it is not two numbers. */
export function parsePair(v: unknown): RangePair | undefined {
  const list = Array.isArray(v) ? v : typeof v === 'string' && v.includes(',') ? v.split(',') : undefined;
  if (!list || list.length !== 2) return undefined;
  const [a, b] = list.map(Number);
  return Number.isNaN(a) || Number.isNaN(b) ? undefined : [a, b];
}

/** Snap both values to the step grid, clamp them to [min, max] and order them. */
export function snapPair(v: readonly number[], s: Bounds): RangePair {
  const a = snap(v[0] ?? s.min, { ...s, value: 0 }), b = snap(v[1] ?? s.max, { ...s, value: 0 });
  return a <= b ? [a, b] : [b, a];
}

/** Move one thumb to `v`, stopped at the other thumb (thumbs never cross; they may meet). */
export function setPairValue(pair: readonly number[], index: number, v: number): RangePair {
  return index === 0 ? [Math.min(v, pair[1]), pair[1]] : [pair[0], Math.max(v, pair[0])];
}

/** The thumb a press at `v` moves: the nearer one; when the thumbs meet, the one on the side of the press. */
export function nearestThumb(pair: readonly number[], v: number): 0 | 1 {
  if (pair[0] === pair[1]) return v < pair[0] ? 0 : 1;
  return Math.abs(v - pair[0]) <= Math.abs(v - pair[1]) ? 0 : 1;
}

/** The value after a key on one thumb (the whole range's steps, stopped at the other thumb), or undefined. */
export function pairKey(key: string, pair: readonly number[], index: number, s: Bounds, rtl = false): RangePair | undefined {
  const v = rangeKey(key, { ...s, value: pair[index] }, rtl);
  return v === undefined ? undefined : setPairValue(pair, index, v);
}

/** Thumb ratios (0..1) of a pair: the indicator runs from the first to the second. */
export const pairRatios = (pair: readonly number[], s: Bounds): RangePair =>
  [ratioOf({ ...s, value: pair[0] }), ratioOf({ ...s, value: pair[1] })];

/** Accessible names of the two thumbs: the slider's label, then which end. */
export const pairLabels = (label?: string): [string, string] => label ? [`${label}, minimum`, `${label}, maximum`] : ['Minimum', 'Maximum'];

/** The host of a pair: a group named by the label; each thumb is the slider. */
export function pairGroupAttrs(s: { disabled?: boolean; label?: string }) {
  return {
    role: 'group', tabindex: undefined, 'aria-label': s.label || undefined, 'aria-disabled': s.disabled ? 'true' : undefined,
    'aria-valuemin': undefined, 'aria-valuemax': undefined, 'aria-valuenow': undefined, 'aria-valuetext': undefined, 'aria-orientation': undefined,
  };
}

/** One thumb of a pair (role=slider, a tab stop): its value within the whole range, data-index and data-dragging. */
export function pairThumbAttrs(pair: readonly number[], index: number, s: Bounds & { disabled?: boolean; label?: string; dragging?: boolean; valueText?: ValueText }) {
  return {
    ...sliderAttrs({ ...s, value: pair[index], label: pairLabels(s.label)[index], valueText: thumbValueText(s.valueText, pair[index], index) }),
    'data-index': index,
    'data-dragging': s.dragging ? '' : undefined,
  };
}
