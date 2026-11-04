// React <Input>: same structure, ids, data hooks and default styles as <ui-input>. The host carries
// the field state as data-* (state.react.ts), like the web component's host: an author error shows
// at once, a built-in problem (required, type, pattern) after blur or a blocked submit.
// Compound parts: Input.Root, Input.Label, Input.Control (the control row: leading, prefix, the
// native <input> as its contents, suffix, trailing), Input.Description, Input.Error (Base UI Field.Label,
// Field.Control, Field.Description, Field.Error on the input's own recipe). The native <input> is
// inside Input.Control, not a part of its own: its props come from Input.Root (value, name, events),
// which reads the Label, Description and Error among its direct children to wire it. The preset
// <Input label description error leading …> is Root + those parts.
import { createContext, useContext, useId, type ChangeEvent, type FormEvent, type HTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react';
import { eventDetails, type ChangeDetails } from '../../dom/events.ts';
import { fieldAttrs } from '../../dom/field.ts';
import { toReactProps } from '../../dom/attrs.ts';
import { useFieldState, useFormError } from '../state.react.ts';
import { findPart, renderPart, stateOf, type PartBase, type PartState } from '../compound.react.tsx';
import type { PartProps } from '../parts.react.tsx';
import { input } from '../../styled-system/recipes/input.js';

// The control follows the construction pattern: leading / prefix / contents / suffix / trailing.
export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix' | 'className' | 'children'>, PartBase {
  label?: string;
  /** Keep the label as the accessible name but do not draw it. */
  hideLabel?: boolean;
  leading?: ReactNode;
  prefix?: ReactNode;
  suffix?: ReactNode;
  trailing?: ReactNode;
  description?: string;
  error?: string;
  /** The text changed (Base UI onValueChange; reason 'none'). The native onChange still fires. */
  onValueChange?: (value: string, details: ChangeDetails) => void;
  /** Input.Root: the parts (Input.Label, Input.Control, Input.Description, Input.Error). Ignored by the preset. */
  children?: ReactNode;
}

/** Input.Root's props: the preset's without the content its parts carry (label, description, adornments). */
export type InputRootProps = Omit<InputProps, 'label' | 'description' | 'leading' | 'prefix' | 'suffix' | 'trailing'>;

type Wiring = ReturnType<typeof fieldAttrs>;
interface InputContext { c: Record<string, string>; state: PartState; a: Wiring; native: Record<string, any> }
const Ctx = createContext<InputContext | null>(null);
const useInput = (part: string) => {
  const v = useContext(Ctx);
  if (!v) throw new Error(`<${part}> must be inside Input.Root`);
  return v;
};

/** Input.Root: the host; its native input props go to the <input> in Input.Control. */
export function InputRoot({ hideLabel, error: rootError, className, render, id, required, disabled, readOnly, onInvalid, onChange, onValueChange, children, ...rest }: InputRootProps) {
  const auto = useId();
  const err = findPart<InputTextPartProps>(children, [InputError]);
  const formError = useFormError(rest.name);
  const error = rootError ?? (err ? String(err.props.children ?? '') || undefined : undefined) ?? (formError || undefined);
  const a = fieldAttrs({ id: id ?? auto, hasDescription: !!findPart(children, [InputDescription]), error, required, disabled, readonly: readOnly, native: true });
  const f = useFieldState<HTMLDivElement>({
    disabled, readOnly, required, error: !!error,
    filled: rest.value !== undefined ? String(rest.value) !== '' : undefined, defaultFilled: String(rest.value ?? rest.defaultValue ?? '') !== '',
  });
  const c = input();
  const state = stateOf(f.attrs);
  const native = {
    'data-part': 'contents', className: c.contents, ...toReactProps(a.control), ...rest,
    onChange: (e: ChangeEvent<HTMLInputElement>) => { onValueChange?.(e.target.value, eventDetails('none', e.nativeEvent)); onChange?.(e); },
    onInvalid: (e: FormEvent<HTMLInputElement>) => { f.controlProps.onInvalid(); onInvalid?.(e); },
  };
  return (
    <Ctx.Provider value={{ c, state, a, native }}>
      {renderPart('div', c.root, { ref: f.ref, 'data-ui': 'input', 'data-hide-label': hideLabel || undefined, ...f.attrs, ...f.handlers, className, render, children }, state)}
    </Ctx.Provider>
  );
}

export interface InputTextPartProps extends Omit<HTMLAttributes<HTMLElement>, 'className'>, PartBase {
  children?: ReactNode;
}

/** Input.Label: the visible label, wired to the input (htmlFor). */
export function InputLabel({ className, render, ...rest }: InputTextPartProps) {
  const t = useInput('Input.Label');
  return renderPart('label', t.c.label, { 'data-part': 'label', className, ...toReactProps(t.a.label), ...rest, render }, t.state);
}

export interface InputControlProps extends PartProps, Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'prefix' | 'children'>, PartBase {}

/** Input.Control: the control row, [leading] [prefix] [native input] [suffix] [trailing]. */
export function InputControl({ leading, prefix, suffix, trailing, className, render, ...rest }: InputControlProps) {
  const t = useInput('Input.Control');
  const { c } = t;
  return renderPart('div', c.control, {
    'data-part': 'control', className, ...rest, render,
    children: <>
      {leading != null && <span data-part="leading" className={c.leading}>{leading}</span>}
      {prefix != null && <span data-part="prefix" className={c.prefix}>{prefix}</span>}
      <input {...t.native} />
      {suffix != null && <span data-part="suffix" className={c.suffix}>{suffix}</span>}
      {trailing != null && <span data-part="trailing" className={c.trailing}>{trailing}</span>}
    </>,
  }, t.state);
}

/** Input.Description: help text, wired with aria-describedby. */
export function InputDescription({ className, render, ...rest }: InputTextPartProps) {
  const t = useInput('Input.Description');
  return renderPart('p', t.c.description, { 'data-part': 'description', className, ...toReactProps(t.a.description), ...rest, render }, t.state);
}

/** Input.Error: the author error, shown at once (data-invalid on the host); wired with aria-describedby. */
export function InputError({ className, render, ...rest }: InputTextPartProps) {
  const t = useInput('Input.Error');
  return renderPart('p', t.c.error, { 'data-part': 'error', className, ...toReactProps(t.a.error), ...rest, render }, t.state);
}

/** Preset: Input.Root with a Label, the Control (and its adornments), a Description and an Error. */
export function Input({ label, description, error: own, leading, prefix, suffix, trailing, children: _parts, ...rest }: InputProps) {
  // Inside a Form, its error for this name (Base UI Form errors) shows when there is no author error.
  const formError = useFormError(rest.name);
  const error = own ?? (formError || undefined);
  return (
    <InputRoot error={error} {...rest}>
      {label && <InputLabel>{label}</InputLabel>}
      <InputControl {...{ leading, prefix, suffix, trailing }} />
      {description && <InputDescription>{description}</InputDescription>}
      {error && <InputError>{error}</InputError>}
    </InputRoot>
  );
}
Input.Root = InputRoot;
Input.Label = InputLabel;
Input.Control = InputControl;
Input.Description = InputDescription;
Input.Error = InputError;
