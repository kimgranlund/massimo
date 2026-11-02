// React <Slider> (alias <Range>) and <Progress>: native <input type="range"> and <progress> inside a
// data-ui host with the web components' anatomy (Base UI Slider and Progress anatomy: track > indicator, thumb). The native element owns value, keys, pointer,
// form value and semantics; the painted parts follow it through --ui-ratio (a continuous value set as
// a custom property). The native range thumb is as wide as the track, so its travel equals the
// painted thumb's (range.recipe.ts). The host carries the data-* state contract like the web
// components' hosts: field state (state.react.ts), data-orientation and data-dragging; Progress
// data-indeterminate, data-progressing or data-complete.
// Compound parts (Base UI): Slider.Root, Slider.Track, Slider.Indicator, Slider.Thumb; Progress.Root,
// Progress.Track, Progress.Indicator. Slider.Thumb renders the painted thumb and the native range
// input after it (Base UI's Thumb also holds the input): the input cannot be its own part, because
// it is the element that takes keys, pointer and the form value. Progress.Root renders the native
// <progress> after its children. The presets <Slider> / <Range> and <Progress> are Root + Track
// (with its Indicator) + Thumb.
import { createContext, useContext, useEffect, useRef, useState, type ChangeEvent, type CSSProperties, type FormEvent, type KeyboardEvent, type PointerEvent, type HTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react';
import { eventDetails, progressState, rangeDataAttrs, ratioOf, toReactProps, type ChangeDetails, type ChangeReason } from '../../dom/index.ts';
import { useFieldState } from '../state.react.ts';
import { renderPart, stateOf, type PartBase, type PartState } from '../compound.react.tsx';
import { range, progress } from '../../styled-system/recipes/index.js';

/** What a Root shares with its track parts (Slider and Progress alike) and the slider thumb. */
interface TrackContext { c: Record<string, string>; state: PartState; input?: Record<string, any> }
const Ctx = createContext<TrackContext | null>(null);
const useTrack = (part: string) => {
  const v = useContext(Ctx);
  if (!v) throw new Error(`<${part}> must be inside Slider.Root or Progress.Root`);
  return v;
};

type Native = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size' | 'value' | 'defaultValue' | 'min' | 'max' | 'step' | 'className' | 'children'>;
export interface RangeProps extends Native, PartBase {
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
  /** Slider.Root: the parts (Slider.Track with Slider.Indicator, Slider.Thumb). Ignored by the preset. */
  children?: ReactNode;
}

/** Slider.Root: the host; its props other than the value, range, label and callbacks go to the native input (in Slider.Thumb). */
export function SliderRoot({ value, defaultValue = 50, min = 0, max = 100, step = 1, label, valueText, size, className, render, style, children, onChange, onValueChange, onValueCommitted, onPointerDown, onKeyDown, onInvalid, ...input }: RangeProps) {
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
    type: 'range', min, max, step, 'aria-label': label, 'aria-valuetext': valueText,
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

function part(name: string, slot: 'track' | 'indicator' | 'thumb', { render, className, ...rest }: TrackPartProps) {
  const t = useTrack(name);
  return renderPart('span', t.c[slot], { ...rest, 'data-part': slot, className, render }, t.state);
}

/** Slider.Track: the painted track; holds Slider.Indicator. */
export function SliderTrack(props: TrackPartProps) { return part('Slider.Track', 'track', props); }
/** Slider.Indicator: the filled part of the track (to --ui-ratio). */
export function SliderIndicator(props: TrackPartProps) { return part('Slider.Indicator', 'indicator', props); }
/** Slider.Thumb: the painted thumb, then the native range input that takes keys, pointer and the form value. */
export function SliderThumb(props: TrackPartProps) {
  const t = useTrack('Slider.Thumb');
  return <>{part('Slider.Thumb', 'thumb', props)}<input {...t.input} /></>;
}
/** Progress.Track: the painted track; holds Progress.Indicator. */
export function ProgressTrack(props: TrackPartProps) { return part('Progress.Track', 'track', props); }
/** Progress.Indicator: the filled part (to --ui-ratio; a sweep while indeterminate). */
export function ProgressIndicator(props: TrackPartProps) { return part('Progress.Indicator', 'indicator', props); }

/** Preset: Slider.Root with its Track, Indicator and Thumb. */
export function Slider({ children: _parts, defaultValue = 50, min = 0, max = 100, step = 1, ...props }: RangeProps) {
  return <SliderRoot {...{ defaultValue, min, max, step }} {...props}><SliderTrack><SliderIndicator /></SliderTrack><SliderThumb /></SliderRoot>;
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
