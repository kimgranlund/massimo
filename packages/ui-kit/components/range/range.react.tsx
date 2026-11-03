// React <Slider> (alias <Range>) and <Progress>: native <input type="range"> and <progress> inside a
// data-ui host with the web components' anatomy (Base UI Slider and Progress anatomy: track > indicator, thumb). The native element owns value, keys, pointer,
// form value and semantics; the painted parts follow it through --ui-ratio (a continuous value set as
// a custom property). The native range thumb is as wide as the track, so its travel equals the
// painted thumb's (range.recipe.ts). The host carries the data-* state contract like the web
// components' hosts: field state (state.react.ts), data-orientation and data-dragging; Progress
// data-indeterminate, data-progressing or data-complete.
// A pair value ([start, end], Base UI Slider with an array value) renders two thumbs, each with its
// own native input (keys, accessible name, one form entry each, data-index); the inputs ignore the
// pointer and the root maps it (dom/range.ts: the nearer thumb moves, thumbs stop at each other).
// The host is a group; the field's id and label wiring go to it.
// Compound parts (Base UI): Slider.Root, Slider.Track, Slider.Indicator, Slider.Thumb; Progress.Root,
// Progress.Track, Progress.Indicator. Slider.Thumb renders the painted thumb and the native range
// input after it (Base UI's Thumb also holds the input): the input cannot be its own part, because
// it is the element that takes keys, pointer and the form value. A pair takes one Slider.Thumb per
// value (index 0 and 1). Progress.Root renders the native <progress> after its children. The presets
// <Slider> / <Range> and <Progress> are Root + Track (with its Indicator) + Thumb (two for a pair).
import { createContext, useContext, useEffect, useRef, useState, type ChangeEvent, type CSSProperties, type FormEvent, type KeyboardEvent, type PointerEvent, type HTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react';
import { eventDetails, nearestThumb, pairLabels, pairRatios, progressState, rangeDataAttrs, ratioOf, setPairValue, snapPair, thumbValueText, toReactProps, valueAt, type ChangeDetails, type ValueText, type ChangeReason, type RangePair } from '../../dom/index.ts';
import { useFieldState } from '../state.react.ts';
import { renderPart, stateOf, type PartBase, type PartState } from '../compound.react.tsx';
import { range, progress } from '../../styled-system/recipes/index.js';

/** One thumb of a pair: its native input's props and ratio. */
interface PairThumb { input: Record<string, any>; ratio: number; dragging: boolean }
/** What a Root shares with its track parts (Slider and Progress alike) and the slider thumb(s). */
interface TrackContext { c: Record<string, string>; state: PartState; input?: Record<string, any>; thumbs?: PairThumb[] }
const Ctx = createContext<TrackContext | null>(null);
const useTrack = (part: string) => {
  const v = useContext(Ctx);
  if (!v) throw new Error(`<${part}> must be inside Slider.Root or Progress.Root`);
  return v;
};

/** A slider value: one number, or a pair [start, end] for two thumbs. */
export type SliderValue = number | readonly number[];
/** Change details of a slider: a pair names the thumb that moved (Base UI activeThumbIndex). */
export interface SliderChangeDetails extends ChangeDetails { activeThumbIndex?: number }

type Native = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size' | 'value' | 'defaultValue' | 'min' | 'max' | 'step' | 'className' | 'children'>;
export interface RangeProps<V extends SliderValue = number> extends Native, PartBase {
  /** One number, or [start, end] for two thumbs that cannot cross. */
  value?: V;
  defaultValue?: V;
  min?: number;
  max?: number;
  step?: number;
  /** Accessible name (aria-label) when there is no visible label; a pair names its thumbs "<label>, minimum" and "<label>, maximum". */
  label?: string;
  /** Human text for each thumb's value (aria-valuetext): a template, "{value} °C" ("40%" without {value} is used as written), or (value, index) => text (Base UI getAriaValueText). */
  valueText?: ValueText;
  /** Unit u in px for this control. */
  size?: number;
  /** Every value change (Base UI onValueChange): reason 'track-press', 'drag' or 'keyboard'; a pair adds activeThumbIndex. The native onChange still fires. */
  onValueChange?: (value: V, details: SliderChangeDetails) => void;
  /** The value at the end of an interaction, when it changed (Base UI onValueCommitted; the native change event). */
  onValueCommitted?: (value: V, details: ChangeDetails) => void;
  /** Slider.Root: the parts (Slider.Track with Slider.Indicator, Slider.Thumb). Ignored by the preset. */
  children?: ReactNode;
}

const isPair = (v: unknown): v is readonly number[] => Array.isArray(v);

/** Slider.Root: the host; its props other than the value, range, label and callbacks go to the native input (in Slider.Thumb), or to each input of a pair. */
export function SliderRoot<V extends SliderValue = number>({ defaultValue = 50 as V, min = 0, max = 100, step = 1, ...props }: RangeProps<V>) {
  const all = { ...props, defaultValue, min, max, step } as RangeProps<any>;
  return isPair(props.value ?? defaultValue) ? <PairRoot {...all} defaultValue={isPair(defaultValue) ? defaultValue : undefined} /> : <SingleRoot {...all} />;
}

function SingleRoot({ value, defaultValue = 50, min = 0, max = 100, step = 1, label, valueText, size, className, render, style, children, onChange, onValueChange, onValueCommitted, onPointerDown, onKeyDown, onInvalid, ...input }: RangeProps<number>) {
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
  const attrs = { ...f.attrs, ...toReactProps(rangeDataAttrs({ dragging })) };
  const state = stateOf(attrs);
  const nativeProps = {
    type: 'range', min, max, step, 'aria-label': label, 'aria-valuetext': thumbValueText(valueText, current),
    ref: native,
    ...(value === undefined ? { defaultValue } : { value }),
    onChange: (e: ChangeEvent<HTMLInputElement>) => {
      const v = Number(e.target.value);
      if (value === undefined) setInner(v);
      onValueChange?.(v, eventDetails(reason(), e.nativeEvent));
      if (gesture.current === 'press') gesture.current = 'drag';
      onChange?.(e);
    },
    onPointerDown: (e: PointerEvent<HTMLInputElement>) => { if (!input.disabled && e.button === 0) { setDragging(true); gesture.current = 'press'; } onPointerDown?.(e); },
    onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => { gesture.current = 'keys'; onKeyDown?.(e); },
    onInvalid: (e: FormEvent<HTMLInputElement>) => { f.controlProps.onInvalid(); onInvalid?.(e); },
    ...input,
  };
  return (
    <Ctx.Provider value={{ c, state, input: nativeProps }}>
      {renderPart('div', c.root, { ref: f.ref, 'data-ui': 'range', 'data-size': size, ...attrs, ...f.handlers, className, style: { ...style, '--ui-ratio': String(ratio) } as CSSProperties, render, children }, state)}
    </Ctx.Provider>
  );
}

/** Two thumbs: native inputs for keys, names and the form; the root maps the pointer to the nearer thumb. */
function PairRoot({ value, defaultValue, min = 0, max = 100, step = 1, label, valueText, size, className, render, style, children, onChange, onValueChange, onValueCommitted, onPointerDown, onKeyDown, onInvalid, id, 'aria-labelledby': labelledBy, 'aria-describedby': describedBy, ...input }: RangeProps<readonly number[]>) {
  const bounds = { min, max, step };
  const [inner, setInner] = useState<RangePair>(() => snapPair(defaultValue ?? [min, max], bounds));
  const current = value ? snapPair(value, bounds) : inner;
  const latest = useRef(current);
  latest.current = current;
  const [active, setActive] = useState(-1);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const cb = useRef({ onValueChange, onValueCommitted });
  cb.current = { onValueChange, onValueCommitted };
  const f = useFieldState<HTMLDivElement>({ disabled: input.disabled, required: input.required, defaultFilled: true, value: current.join(',') });

  /** Set the pair from an interaction (Base UI onValueChange); false when it did not change. */
  const set = (next: RangePair, reason: ChangeReason, event: Event, thumb: number) => {
    const cur = latest.current;
    if (next[0] === cur[0] && next[1] === cur[1]) return false;
    latest.current = next;
    if (value === undefined) setInner(next);
    cb.current.onValueChange?.(next, { ...eventDetails(reason, event), activeThumbIndex: thumb });
    return true;
  };
  const commit = (reason: ChangeReason, event: Event) => cb.current.onValueCommitted?.(latest.current, eventDetails(reason, event));

  // A key on a thumb's input ends with the native change event: the commit.
  useEffect(() => {
    const els = inputs.current.filter(Boolean) as HTMLInputElement[];
    const on = (e: Event) => commit('keyboard', e);
    els.forEach((el) => el.addEventListener('change', on));
    return () => els.forEach((el) => el.removeEventListener('change', on));
  }, []);

  const rootPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    onPointerDown?.(e as unknown as PointerEvent<HTMLInputElement>);
    if (input.disabled || e.button !== 0) return;
    e.preventDefault();
    const root = e.currentTarget;
    const rtl = getComputedStyle(root).direction === 'rtl';
    const at = (ev: { clientX: number }) => { const r = root.getBoundingClientRect(); return valueAt(ev.clientX, r, r.height, { ...bounds, value: min }, rtl); };
    const onThumb = (e.target as Element).closest?.('[data-part=thumb][data-index]');
    const thumb = onThumb ? Number(onThumb.getAttribute('data-index')) : nearestThumb(latest.current, at(e));
    inputs.current[thumb]?.focus();
    root.setPointerCapture?.(e.pointerId);
    setActive(thumb);
    const start = latest.current.join(',');
    let dragged = false;
    if (!onThumb) set(setPairValue(latest.current, thumb, at(e)), 'track-press', e.nativeEvent, thumb);
    const move = (ev: globalThis.PointerEvent) => { if (set(setPairValue(latest.current, thumb, at(ev)), 'drag', ev, thumb)) dragged = true; };
    const up = (ev: globalThis.PointerEvent) => {
      root.removeEventListener('pointermove', move);
      root.removeEventListener('pointerup', up);
      root.removeEventListener('pointercancel', up);
      setActive(-1);
      if (latest.current.join(',') !== start) commit(dragged ? 'drag' : 'track-press', ev);
    };
    root.addEventListener('pointermove', move);
    root.addEventListener('pointerup', up);
    root.addEventListener('pointercancel', up);
  };

  const c = range();
  const attrs = { ...f.attrs, ...toReactProps(rangeDataAttrs({ dragging: active >= 0 })) };
  const state = stateOf(attrs);
  const ratios = pairRatios(current, bounds);
  const names = pairLabels(label);
  const thumbs: PairThumb[] = [0, 1].map((i) => ({
    ratio: ratios[i], dragging: active === i,
    input: {
      type: 'range', min, max, step, 'aria-label': names[i], 'aria-valuetext': thumbValueText(valueText, current[i], i), 'data-index': i, value: current[i],
      ref: (el: HTMLInputElement | null) => { inputs.current[i] = el; },
      onChange: (e: ChangeEvent<HTMLInputElement>) => {
        // The input's own min and max are the whole range: stop at the other thumb here.
        set(setPairValue(latest.current, i, Number(e.target.value)), 'keyboard', e.nativeEvent, i);
        onChange?.(e);
      },
      onKeyDown,
      onInvalid: (e: FormEvent<HTMLInputElement>) => { f.controlProps.onInvalid(); onInvalid?.(e); },
      ...input,
    },
  }));
  return (
    <Ctx.Provider value={{ c, state, thumbs }}>
      {renderPart('div', c.root, {
        ref: f.ref, id, role: 'group', 'aria-label': label, 'aria-labelledby': labelledBy, 'aria-describedby': describedBy,
        'data-ui': 'range', 'data-size': size, ...attrs, ...f.handlers, onPointerDown: rootPointerDown, className,
        style: { ...style, '--ui-ratio-start': String(ratios[0]), '--ui-ratio': String(ratios[1]) } as CSSProperties, render, children,
      }, state)}
    </Ctx.Provider>
  );
}

export interface ProgressProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'className'>, PartBase {
  /** Current value; omit for indeterminate. */
  value?: number | null;
  max?: number;
  label?: string;
  size?: number;
  /** Progress.Root: the parts (Progress.Track with Progress.Indicator). Ignored by the preset. */
  children?: ReactNode;
}

/** Progress.Root: the host and, after its parts, the native <progress>. */
export function ProgressRoot({ value, max = 100, label, size, className, render, style, children, ...rest }: ProgressProps) {
  const p = progressState(value, max);
  const c = progress();
  const attrs = toReactProps(p.attrs);
  const state = stateOf(attrs);
  return (
    <Ctx.Provider value={{ c, state }}>
      {renderPart('div', c.root, {
        ...rest, 'data-ui': 'progress', 'data-size': size, ...attrs, className, style: { ...style, '--ui-ratio': String(p.ratio) } as CSSProperties, render,
        children: <>{children}<progress max={max} aria-label={label} {...(p.indeterminate ? {} : { value: p.value })} /></>,
      }, state)}
    </Ctx.Provider>
  );
}

/** Props of a track part (Track, Indicator, Thumb). */
export interface TrackPartProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'className'>, PartBase {
  children?: ReactNode;
}
/** Props of Slider.Thumb. */
export interface ThumbProps extends TrackPartProps {
  /** A pair's thumb: 0 for the start, 1 for the end (Base UI Thumb index). One thumb ignores it. */
  index?: number;
}

function part(name: string, slot: 'track' | 'indicator' | 'thumb', { render, className, ...rest }: TrackPartProps, extra: Record<string, unknown> = {}) {
  const t = useTrack(name);
  const state = { ...t.state, ...stateOf(extra) };
  return renderPart('span', t.c[slot], { ...rest, 'data-part': slot, ...extra, className, render }, state);
}

/** Slider.Track: the painted track; holds Slider.Indicator. */
export function SliderTrack(props: TrackPartProps) { return part('Slider.Track', 'track', props); }
/** Slider.Indicator: the filled part of the track (to --ui-ratio; a pair from --ui-ratio-start). */
export function SliderIndicator(props: TrackPartProps) { return part('Slider.Indicator', 'indicator', props); }
/** Slider.Thumb: the painted thumb, then the native range input that takes keys, pointer and the form value. */
export function SliderThumb({ index = 0, ...props }: ThumbProps) {
  const t = useTrack('Slider.Thumb');
  const pair = t.thumbs?.[index];
  if (!pair) return <>{part('Slider.Thumb', 'thumb', props)}<input {...t.input} /></>;
  const extra = { 'data-index': index, 'data-dragging': pair.dragging ? '' : undefined };
  const style = { ...props.style, '--ui-ratio': String(pair.ratio) } as CSSProperties;
  return <>{part('Slider.Thumb', 'thumb', { ...props, style }, extra)}<input {...pair.input} /></>;
}
/** Progress.Track: the painted track; holds Progress.Indicator. */
export function ProgressTrack(props: TrackPartProps) { return part('Progress.Track', 'track', props); }
/** Progress.Indicator: the filled part (to --ui-ratio; a sweep while indeterminate). */
export function ProgressIndicator(props: TrackPartProps) { return part('Progress.Indicator', 'indicator', props); }

/** Preset: Slider.Root with its Track, Indicator and Thumb (two for a pair). */
export function Slider<V extends SliderValue = number>({ children: _parts, defaultValue = 50 as V, min = 0, max = 100, step = 1, ...props }: RangeProps<V>) {
  const pair = isPair(props.value ?? defaultValue);
  return (
    <SliderRoot {...{ defaultValue, min, max, step }} {...props}>
      <SliderTrack><SliderIndicator /></SliderTrack>
      {pair ? <><SliderThumb index={0} /><SliderThumb index={1} /></> : <SliderThumb />}
    </SliderRoot>
  );
}
Slider.Root = SliderRoot;
Slider.Track = SliderTrack;
Slider.Indicator = SliderIndicator;
Slider.Thumb = SliderThumb;
/** Range: the kit's name for Slider (ui-range), the same component. */
export const Range = Slider;

/** Preset: Progress.Root with its Track and Indicator. */
export function Progress({ children: _parts, max = 100, ...props }: ProgressProps) {
  return <ProgressRoot max={max} {...props}><ProgressTrack><ProgressIndicator /></ProgressTrack></ProgressRoot>;
}
Progress.Root = ProgressRoot;
Progress.Track = ProgressTrack;
Progress.Indicator = ProgressIndicator;
