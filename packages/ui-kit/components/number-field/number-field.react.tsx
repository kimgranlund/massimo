// React <NumberField>: the same anatomy, ids, data-* and recipe classes as <ui-number-field>, on native
// elements: the input is an <input type="text"> (aria-roledescription "Number field"), the steppers
// are <button type="button" tabIndex={-1}>, the label a <label htmlFor>, and a hidden input carries
// the form value (the number, not the formatted text), as in Base UI. Parsing, formatting, stepping
// and the gestures are the web component's (dom/number.ts).
// Compound parts (Base UI NumberField): NumberField.Root, NumberField.ScrubArea, NumberField.Group,
// NumberField.Decrement, NumberField.Input, NumberField.Increment, plus the field parts
// NumberField.Label, NumberField.Description, NumberField.Error (ours, Base UI's Field parts on this
// recipe). The preset <NumberField label description error prefix suffix …> is Root + ScrubArea ›
// Label + Group › Decrement, Input, Increment + Description + Error.
import {
  Children, createContext, isValidElement, useCallback, useContext, useEffect, useId, useMemo, useRef, useState,
  type ChangeEvent, type FocusEvent, type HTMLAttributes, type InputHTMLAttributes, type KeyboardEvent, type MouseEvent,
  type PointerEvent as ReactPointerEvent, type ReactNode, type ButtonHTMLAttributes, type RefObject,
} from 'react';
import {
  clampNumber, eventDetails, fieldAttrs, formatNumberValue, hideTopLayer, holdStepper, numberInputMode, numberKey, parseNumber, sanitizeNumberText,
  showTopLayer, snapNumber, startScrub, stepAmount, stepNumber, stepperAttrs, stepperDisabled, toReactProps, type ChangeDetails, type ChangeReason,
} from '../../dom/index.ts';
import type { FormatNumberOptions } from '../../tokens/typography/format.ts';
import { useFieldState } from '../state.react.ts';
import { findPart, renderPart, stateOf, type PartBase, type PartState } from '../compound.react.tsx';
import { numberField } from '../../styled-system/recipes/number-field.js';

export interface NumberFieldRootProps extends Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'children' | 'defaultValue' | 'onChange' | 'prefix'>, PartBase {
  /** Controlled value; null is empty (Base UI value). */
  value?: number | null;
  /** Uncontrolled initial value (Base UI defaultValue). */
  defaultValue?: number | null;
  /** Every change (Base UI onValueChange): reason input-change, input-clear, input-blur, input-paste, keyboard, increment-press, decrement-press, wheel or scrub. */
  onValueChange?: (value: number | null, details: ChangeDetails) => void;
  /** A commit (Base UI onValueCommitted): blur after typing, a key step, a stepper or scrub release, a wheel step. */
  onValueCommitted?: (value: number | null, details: ChangeDetails) => void;
  min?: number;
  max?: number;
  /** Arrow keys and the steppers (default 1). */
  step?: number;
  /** With Alt (default 0.1). */
  smallStep?: number;
  /** With Shift (default 10). */
  largeStep?: number;
  /** Snap to multiples of step from min (or 0). */
  snapOnStep?: boolean;
  /** Keep a typed value outside min / max on blur (it is then invalid). */
  allowOutOfRange?: boolean;
  /** The wheel steps while the input is focused and hovered. */
  allowWheelScrub?: boolean;
  /** Intl.NumberFormat options for the text (Base UI format), through formatNumber. */
  format?: FormatNumberOptions;
  /** BCP 47 locale for formatting and parsing. */
  locale?: string;
  name?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  /** Author error: data-invalid at once. */
  error?: string;
  /** Keep the label as the accessible name but do not draw it. */
  hideLabel?: boolean;
  /** Unit u in px for this element. */
  size?: number;
  /** NumberField.Root: the parts. Ignored by the preset. */
  children?: ReactNode;
}

export interface NumberFieldProps extends NumberFieldRootProps {
  label?: string;
  description?: string;
  placeholder?: string;
  /** Short text adornment before the number ("$"). */
  prefix?: ReactNode;
  /** Short text adornment after the number ("kg"). */
  suffix?: ReactNode;
}

interface Controller {
  value: number | null;
  text: string;
  scrubbing: boolean;
  inactive: boolean;
  min?: number;
  max?: number;
  step: number;
  inputRef: RefObject<HTMLInputElement | null>;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onPaste: () => void;
  onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
  onFocus: () => void;
  onBlur: (e: FocusEvent<HTMLInputElement>) => void;
  press: (dir: 1 | -1, e: ReactPointerEvent<HTMLElement>) => void;
  click: (dir: 1 | -1, e: MouseEvent<HTMLElement>) => void;
  scrub: (e: ReactPointerEvent<HTMLElement>, direction: 'horizontal' | 'vertical', pixelSensitivity: number, cursor: () => HTMLElement | null) => void;
  wheel: (e: WheelEvent) => void;
}
interface Ctx { c: Record<string, string>; state: PartState; a: ReturnType<typeof fieldAttrs>; k: Controller; native: Record<string, unknown>; disabled: boolean; readOnly: boolean }
const NFCtx = createContext<Ctx | null>(null);
const useNF = (part: string) => {
  const v = useContext(NFCtx);
  if (!v) throw new Error(`<${part}> must be inside NumberField.Root`);
  return v;
};

function useController(p: NumberFieldRootProps, inactive: boolean, hidden: RefObject<HTMLInputElement | null>) {
  const { min, max, step = 1, smallStep = 0.1, largeStep = 10, snapOnStep, allowOutOfRange, allowWheelScrub, format, locale, onValueChange, onValueCommitted } = p;
  const controlled = p.value !== undefined;
  const [inner, setInner] = useState<number | null>(p.defaultValue ?? null);
  const value = controlled ? p.value ?? null : inner;
  const fmtKey = JSON.stringify(format ?? null);
  const opts = useMemo(() => ({ locale, format, step }), [locale, fmtKey, step]); // eslint-disable-line react-hooks/exhaustive-deps
  const [text, setText] = useState(() => formatNumberValue(value, opts));
  const [scrubbing, setScrubbing] = useState(false);
  const typing = useRef(false), pasting = useRef(false), pressed = useRef(false), hovered = useRef(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const valueRef = useRef(value), committed = useRef(value);
  valueRef.current = value;
  const live = useRef({ p, opts, inactive });
  live.current = { p, opts, inactive };
  // A value from outside (controlled, reset) shows formatted unless the user is typing.
  useEffect(() => { if (!typing.current) setText(formatNumberValue(value, opts)); }, [value, opts]);

  const steps = { step, smallStep, largeStep };
  const set = (next: number | null, reason: ChangeReason, event: Event | undefined, commit: boolean) => {
    if (!Object.is(next, valueRef.current)) {
      valueRef.current = next;
      if (!controlled) setInner(next);
      if (hidden.current) hidden.current.value = next == null ? '' : String(next);
      onValueChange?.(next, eventDetails(reason, event));
    }
    if (commit) doCommit(reason, event);
  };
  const doCommit = (reason: ChangeReason, event: Event | undefined) => {
    if (Object.is(valueRef.current, committed.current)) return;
    committed.current = valueRef.current;
    onValueCommitted?.(valueRef.current, eventDetails(reason, event));
  };
  const current = () => {
    if (!typing.current) return valueRef.current;
    const v = parseNumber(inputRef.current?.value ?? '', opts);
    return v == null || Number.isNaN(v) ? valueRef.current : v;
  };
  const stepBy = (dir: 1 | -1, amount: number, reason: ChangeReason, event: Event | undefined, commit: boolean) => {
    if (live.current.inactive) return false;
    const from = current();
    const next = stepNumber(from, dir, amount, { min, max, snapOnStep });
    typing.current = false;
    set(next, reason, event, commit);
    setText(formatNumberValue(next, opts));
    return !Object.is(next, from);
  };
  const commitText = (e: Event) => {
    const parsed = parseNumber(inputRef.current?.value ?? text, opts);
    let next = parsed == null ? null : Number.isNaN(parsed) ? valueRef.current : parsed;
    if (next != null) {
      if (snapOnStep) next = snapNumber(next, step, min);
      if (!allowOutOfRange) next = clampNumber(next, { min, max });
    }
    typing.current = false;
    set(next, parsed == null ? 'input-clear' : 'input-blur', e, true);
    setText(formatNumberValue(next, opts));
  };

  const k: Controller = {
    value, text, scrubbing, inactive, min, max, step, inputRef,
    onChange: (e) => {
      const clean = sanitizeNumberText(e.target.value, opts);
      const paste = pasting.current;
      pasting.current = false;
      typing.current = true;
      setText(clean);
      const parsed = parseNumber(clean, opts);
      if (parsed == null) set(null, 'input-clear', e.nativeEvent, false);
      else if (!Number.isNaN(parsed)) set(parsed, paste ? 'input-paste' : 'input-change', e.nativeEvent, false);
    },
    onPaste: () => { pasting.current = true; },
    onKeyDown: (e) => {
      if (e.key === 'Enter') { commitText(e.nativeEvent); return; } // the form then submits natively
      const key = numberKey(e.key);
      if (!key || e.ctrlKey || e.metaKey || inactive) return;
      e.preventDefault();
      committed.current = current();
      if ('dir' in key) { stepBy(key.dir, stepAmount(e, steps), 'keyboard', e.nativeEvent, true); return; }
      const to = key.to === 'min' ? min : max;
      if (to == null) return;
      typing.current = false;
      set(to, 'keyboard', e.nativeEvent, true);
      setText(formatNumberValue(to, opts));
    },
    onFocus: () => { committed.current = valueRef.current; },
    onBlur: (e) => commitText(e.nativeEvent),
    press: (dir, e) => {
      if (e.button !== 0 || inactive) return;
      e.preventDefault();
      const reason: ChangeReason = dir > 0 ? 'increment-press' : 'decrement-press';
      committed.current = valueRef.current;
      pressed.current = true;
      const native = e.nativeEvent;
      holdStepper(() => stepBy(dir, stepAmount(native, steps), reason, native, false), (ev) => doCommit(reason, ev));
    },
    click: (dir, e) => {
      if (pressed.current) { pressed.current = false; return; }
      committed.current = valueRef.current;
      stepBy(dir, stepAmount(e, steps), dir > 0 ? 'increment-press' : 'decrement-press', e.nativeEvent, true);
    },
    scrub: (e, direction, pixelSensitivity, cursor) => {
      if (e.button !== 0 || inactive) return;
      e.preventDefault();
      committed.current = valueRef.current;
      startScrub(e.nativeEvent, {
        direction, pixelSensitivity, lock: e.currentTarget,
        // Pointer lock hides the real cursor: ScrubAreaCursor stands in for it (set by script, no re-render per move).
        onCursor: (pt) => {
          const el = cursor();
          if (!el) return;
          if (!pt) { hideTopLayer(el); return; }
          el.style.setProperty('--ui-scrub-x', `${pt.x}px`);
          el.style.setProperty('--ui-scrub-y', `${pt.y}px`);
          showTopLayer(el);
        },
        onStart: () => setScrubbing(true),
        onStep: (dir, ev) => { stepBy(dir, stepAmount(ev, steps), 'scrub', ev, false); },
        onEnd: (scrubbed, ev) => { setScrubbing(false); if (scrubbed) doCommit('scrub', ev); },
      });
    },
    wheel: (e) => {
      if (!allowWheelScrub || !hovered.current || document.activeElement !== inputRef.current || inactive || !e.deltaY) return;
      e.preventDefault();
      committed.current = valueRef.current;
      stepBy(e.deltaY < 0 ? 1 : -1, stepAmount(e, steps), 'wheel', e, true);
    },
  };
  // The group's hover (the wheel needs it) is tracked on the group element.
  (k as Controller & { hovered: typeof hovered }).hovered = hovered;
  return k;
}

/** NumberField.Root: the host; owns the value, the text and the gestures, and the hidden form input. */
export function NumberFieldRoot(props: NumberFieldRootProps) {
  const {
    value: _v, defaultValue: _dv, onValueChange: _ovc, onValueCommitted: _ovm, min, max, step = 1, smallStep: _ss, largeStep: _ls, snapOnStep: _snap,
    allowOutOfRange: _aor, allowWheelScrub: _aws, format: _f, locale: _l, name, required, disabled, readOnly, error: rootError, hideLabel, size,
    id, className, render, children, ...rest
  } = props;
  const auto = useId();
  const hidden = useRef<HTMLInputElement>(null);
  const err = findPart<{ children?: ReactNode }>(children, [NumberFieldError]);
  const error = rootError ?? (err ? String(err.props.children ?? '') || undefined : undefined);
  const k = useController(props, !!disabled || !!readOnly, hidden);
  const outOfRange = k.value != null && ((min != null && k.value < min) || (max != null && k.value > max));
  const f = useFieldState<HTMLDivElement>({ disabled, readOnly, required, error: !!error, value: k.value == null ? '' : String(k.value), missing: (!!required && k.value == null) || outOfRange });
  const a = fieldAttrs({ id: id ?? auto, hasDescription: !!findPart(children, [NumberFieldDescription]), error, required, disabled, readonly: readOnly, native: true });
  // Out of range (allow-out-of-range) blocks a submit through the native input's validity.
  useEffect(() => { k.inputRef.current?.setCustomValidity(outOfRange ? `Use a value between ${min ?? '−∞'} and ${max ?? '∞'}.` : ''); }, [outOfRange, min, max, k.inputRef]);
  const c = numberField();
  const attrs = { ...f.attrs, 'data-scrubbing': k.scrubbing ? '' : undefined };
  const state = stateOf(attrs);
  const native = {
    ...toReactProps(a.control), type: 'text', inputMode: numberInputMode(min, step), 'aria-roledescription': 'Number field', autoComplete: 'off', autoCorrect: 'off', spellCheck: false,
    value: k.text, onChange: k.onChange, onPaste: k.onPaste, onKeyDown: k.onKeyDown, onFocus: k.onFocus, onBlur: k.onBlur,
    onInvalid: () => f.controlProps.onInvalid(),
  };
  return (
    <NFCtx.Provider value={{ c, state, a, k, native, disabled: !!disabled, readOnly: !!readOnly }}>
      {renderPart('div', c.root, {
        ref: f.ref, 'data-ui': 'number-field', 'data-size': size, 'data-hide-label': hideLabel || undefined, ...attrs, ...f.handlers, ...rest, className, render,
        children: <>{children}<input ref={hidden} type="hidden" name={name} value={k.value == null ? '' : String(k.value)} disabled={disabled} /></>,
      }, state)}
    </NFCtx.Provider>
  );
}

export interface NumberFieldPartProps extends Omit<HTMLAttributes<HTMLElement>, 'className' | 'prefix'>, PartBase { children?: ReactNode }

export interface NumberFieldScrubAreaProps extends NumberFieldPartProps {
  /** The pointer axis that changes the value (Base UI direction). */
  direction?: 'horizontal' | 'vertical';
  /** Pixels dragged per step (Base UI pixelSensitivity). */
  pixelSensitivity?: number;
}

/** NumberField.ScrubArea: drag it to step the value (Base UI ScrubArea); holds the label. */
const ScrubCtx = createContext<{ direction: 'horizontal' | 'vertical'; cursorRef: RefObject<HTMLElement | null> } | null>(null);

export function NumberFieldScrubArea({ direction = 'horizontal', pixelSensitivity = 2, className, render, onPointerDown, children, ...rest }: NumberFieldScrubAreaProps) {
  const t = useNF('NumberField.ScrubArea');
  const cursorRef = useRef<HTMLElement | null>(null);
  return (
    <ScrubCtx.Provider value={{ direction, cursorRef }}>
      {renderPart('span', t.c['scrub-area'], {
        'data-part': 'scrub-area', 'data-direction': direction === 'vertical' ? 'vertical' : undefined, 'data-scrubbing': t.k.scrubbing ? '' : undefined, className, ...rest, render, children,
        onPointerDown: (e: ReactPointerEvent<HTMLElement>) => { onPointerDown?.(e as never); t.k.scrub(e, direction, pixelSensitivity, () => cursorRef.current); },
      }, t.state)}
    </ScrubCtx.Provider>
  );
}

/** NumberField.ScrubAreaCursor (Base UI): while the pointer is locked to the scrub area, an icon at the virtual pointer, in the top layer; children replace the arrows. */
export function NumberFieldScrubAreaCursor({ className, render, children, ...rest }: NumberFieldPartProps) {
  const t = useNF('NumberField.ScrubAreaCursor');
  const sc = useContext(ScrubCtx);
  if (!sc) throw new Error('<NumberField.ScrubAreaCursor> must be inside NumberField.ScrubArea');
  return renderPart('span', t.c['scrub-area-cursor'], {
    'data-part': 'scrub-area-cursor', popover: 'manual', 'aria-hidden': 'true', ref: sc.cursorRef, className, ...rest, render,
    children: children ?? <i {...{ name: sc.direction === 'vertical' ? 'arrows-vertical' : 'arrows-horizontal' }} />,
  }, t.state);
}

/** NumberField.Label: the visible label, wired to the input (htmlFor). */
export function NumberFieldLabel({ className, render, ...rest }: NumberFieldPartProps) {
  const t = useNF('NumberField.Label');
  return renderPart('label', t.c.label, { 'data-part': 'label', className, ...toReactProps(t.a.label), ...rest, render }, t.state);
}

export interface NumberFieldGroupProps extends NumberFieldPartProps {
  /** Text adornment before the input. */
  prefix?: ReactNode;
  /** Text adornment after the input. */
  suffix?: ReactNode;
}

/** NumberField.Group: the field control around Decrement, Input and Increment; the prefix and suffix go beside the Input. */
export function NumberFieldGroup({ prefix, suffix, className, render, children, ...rest }: NumberFieldGroupProps) {
  const t = useNF('NumberField.Group');
  const ref = useRef<HTMLDivElement>(null);
  const k = t.k as Controller & { hovered: { current: boolean } };
  const wheel = useRef(k.wheel);
  wheel.current = k.wheel;
  // React's wheel listener is passive; the wheel step needs preventDefault.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const on = (e: WheelEvent) => wheel.current(e);
    el.addEventListener('wheel', on, { passive: false });
    return () => el.removeEventListener('wheel', on);
  }, []);
  const parts = Children.toArray(children).flatMap((n): ReactNode[] => isValidElement(n) && n.type === NumberFieldInput
    ? [prefix != null && <span key="prefix" data-part="prefix" className={t.c.prefix}>{prefix}</span>, n, suffix != null && <span key="suffix" data-part="suffix" className={t.c.suffix}>{suffix}</span>].filter(Boolean)
    : [n]);
  const focus = useCallback((e: MouseEvent<HTMLElement>) => {
    const target = e.target as Element;
    if (target.closest('[data-part=decrement], [data-part=increment]') || target === k.inputRef.current || t.disabled) return;
    k.inputRef.current?.focus();
  }, [k.inputRef, t.disabled]);
  return renderPart('div', t.c.group, {
    ref, 'data-part': 'group', className, ...rest, render, children: parts as ReactNode[],
    onClick: focus, onPointerEnter: () => { k.hovered.current = true; }, onPointerLeave: () => { k.hovered.current = false; },
  }, t.state);
}

export interface NumberFieldInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className' | 'value' | 'defaultValue' | 'type' | 'prefix'>, PartBase {}

/** NumberField.Input: the native text input (aria-roledescription "Number field"); its value is the formatted text. */
export function NumberFieldInput({ className, render, ...rest }: NumberFieldInputProps) {
  const t = useNF('NumberField.Input');
  return renderPart('input', t.c.input, { 'data-part': 'input', 'data-numeric': '', ref: t.k.inputRef, className, ...t.native, ...rest, render }, t.state);
}

export interface NumberFieldStepperProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'className' | 'type'>, PartBase { children?: ReactNode }

function Stepper({ sign: dir, part, className, render, children, ...rest }: NumberFieldStepperProps & { sign: 1 | -1; part: 'decrement' | 'increment' }) {
  const t = useNF(dir > 0 ? 'NumberField.Increment' : 'NumberField.Decrement');
  const off = stepperDisabled(dir, { disabled: t.disabled, readonly: t.readOnly, value: t.k.value, min: t.k.min, max: t.k.max });
  return renderPart('button', t.c[part], {
    'data-part': part, type: 'button', ...toReactProps(stepperAttrs(dir, t.a.control.id as string, off)), 'aria-disabled': off ? 'true' : undefined,
    className, ...rest, render,
    onPointerDown: (e: ReactPointerEvent<HTMLElement>) => t.k.press(dir, e),
    onClick: (e: MouseEvent<HTMLElement>) => t.k.click(dir, e),
    children: children ?? <i {...{ name: dir > 0 ? 'plus' : 'minus' }} />,
  }, t.state);
}

/** NumberField.Decrement: steps down on press, repeating while held (Base UI Decrement); not a tab stop. */
export function NumberFieldDecrement(props: NumberFieldStepperProps) { return <Stepper {...props} sign={-1} part="decrement" />; }
/** NumberField.Increment: steps up on press, repeating while held (Base UI Increment); not a tab stop. */
export function NumberFieldIncrement(props: NumberFieldStepperProps) { return <Stepper {...props} sign={1} part="increment" />; }

/** NumberField.Description: help text, wired with aria-describedby. */
export function NumberFieldDescription({ className, render, ...rest }: NumberFieldPartProps) {
  const t = useNF('NumberField.Description');
  return renderPart('p', t.c.description, { 'data-part': 'description', className, ...toReactProps(t.a.description), ...rest, render }, t.state);
}

/** NumberField.Error: the author error, shown at once (data-invalid on the host); wired with aria-describedby. */
export function NumberFieldError({ className, render, ...rest }: NumberFieldPartProps) {
  const t = useNF('NumberField.Error');
  return renderPart('p', t.c.error, { 'data-part': 'error', className, ...toReactProps(t.a.error), ...rest, render }, t.state);
}

/** Preset: Root + ScrubArea › Label + Group › Decrement, [prefix] Input [suffix], Increment + Description + Error. */
export function NumberField({ label, description, error, placeholder, prefix, suffix, children: _parts, ...rest }: NumberFieldProps) {
  return (
    <NumberFieldRoot error={error} {...rest}>
      {label && <NumberFieldScrubArea><NumberFieldLabel>{label}</NumberFieldLabel><NumberFieldScrubAreaCursor /></NumberFieldScrubArea>}
      <NumberFieldGroup prefix={prefix} suffix={suffix}>
        <NumberFieldDecrement />
        <NumberFieldInput placeholder={placeholder} />
        <NumberFieldIncrement />
      </NumberFieldGroup>
      {description && <NumberFieldDescription>{description}</NumberFieldDescription>}
      {error && <NumberFieldError>{error}</NumberFieldError>}
    </NumberFieldRoot>
  );
}
NumberField.Root = NumberFieldRoot;
NumberField.ScrubArea = NumberFieldScrubArea;
NumberField.ScrubAreaCursor = NumberFieldScrubAreaCursor;
NumberField.Label = NumberFieldLabel;
NumberField.Group = NumberFieldGroup;
NumberField.Decrement = NumberFieldDecrement;
NumberField.Input = NumberFieldInput;
NumberField.Increment = NumberFieldIncrement;
NumberField.Description = NumberFieldDescription;
NumberField.Error = NumberFieldError;
