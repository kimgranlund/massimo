// React <Form>: the classes and data-* of <ui-form> on a native <form data-ui="form" noValidate>
// (React renderers are native HTML), as Base UI Form: one part. On submit it validates every native
// control (constraint validation: each invalid control fires `invalid`, so the kit hosts show their
// errors) and focuses the first invalid one; when all pass it calls onFormSubmit(values, { reason:
// 'none', event }) with the FormData as an object (preventDefault, as Base UI does). `errors` (by
// name) reach the kit hosts through FormCtx: Input and Select show theirs, a Field with `name` shows
// it in Field.Error; a change to a control clears its name's error. `validationMode` (onSubmit,
// onBlur, onChange) decides when the hosts' own errors show; `actionsRef.current.validate(name?)`.
import { useCallback, useImperativeHandle, useMemo, useRef, useState, type ChangeEvent, type FormEvent, type FormHTMLAttributes, type InputEvent, type SubmitEvent, type ReactNode, type RefObject } from 'react';
import { FormCtx, type FormContextValue } from '../state.react.ts';
import { renderPart, type PartBase, type PartState } from '../compound.react.tsx';
import { eventDetails, type ChangeDetails } from '../../dom/index.ts';
import { form } from '../../styled-system/recipes/index.js';

export type FormErrors = Record<string, string | string[] | undefined | null>;
export type FormValues = Record<string, FormDataEntryValue | FormDataEntryValue[]>;
export type ValidationMode = FormContextValue['validationMode'];
export interface FormActions { validate: (fieldName?: string) => void }

export interface FormProps extends Omit<FormHTMLAttributes<HTMLFormElement>, 'className'>, PartBase {
  /** Errors by control name (Base UI Form errors), e.g. from a server; shown at once, cleared when that control changes. */
  errors?: FormErrors;
  /** When the controls' own errors show (Base UI validationMode): onSubmit (after a submit attempt, then on change), onBlur, onChange. */
  validationMode?: ValidationMode;
  /** Called on a submit that passes validation, with the values by name and Base UI's details ({ reason: 'none', event }); the native submit is prevented. */
  onFormSubmit?: (values: FormValues, details: ChangeDetails) => void;
  /** Imperative actions (Base UI actionsRef): validate() every control, validate(name) one. */
  actionsRef?: RefObject<FormActions | null>;
  /** Unit u in px for the form and its fields. */
  size?: number;
  /** Gap between the fields in u (default: the collection gap). */
  gap?: number;
  children?: ReactNode;
}

const message = (v: FormErrors[string]) => (Array.isArray(v) ? v.filter(Boolean).join(' ') : v ?? '');
const controls = (f: HTMLFormElement | null, name?: string) =>
  [...(f?.elements ?? [])].filter((el): el is HTMLInputElement => 'checkValidity' in el && (el as HTMLInputElement).type !== 'hidden' && (name === undefined || (el as HTMLInputElement).name === name)) as HTMLInputElement[];

/** FormData as Base UI's values object: a repeated name holds an array. */
function valuesOf(f: HTMLFormElement): FormValues {
  const out: FormValues = {};
  for (const [k, v] of new FormData(f)) {
    const cur = out[k];
    out[k] = cur === undefined ? v : [...(Array.isArray(cur) ? cur : [cur]), v];
  }
  return out;
}

/** Form: the native form; the form owner of its native controls, with the kit's validation timing and error mapping. */
export function Form({ errors, validationMode = 'onSubmit', onFormSubmit, actionsRef, size, gap, className, render, style, onSubmit, onReset, onChange, onInput, children, ...rest }: FormProps) {
  const ref = useRef<HTMLFormElement>(null);
  const [submitted, setSubmitted] = useState(false);
  // Names whose error a change (or a new submit) has answered; a new errors object starts over.
  const [cleared, setCleared] = useState<{ of: FormErrors | undefined; names: Set<string> }>({ of: errors, names: new Set() });
  const gone = cleared.of === errors ? cleared.names : new Set<string>();
  const clear = useCallback((names: string[]) => setCleared((p) => ({ of: errors, names: new Set([...(p.of === errors ? p.names : []), ...names]) })), [errors]);
  const errorFor = useCallback((name: string | undefined) => (name && !gone.has(name) ? message(errors?.[name]) : ''), [errors, gone]);
  // onSubmit waits for a submit attempt, then re-validates on change (as the web component).
  const mode: ValidationMode = validationMode === 'onSubmit' && submitted ? 'onChange' : validationMode;
  const changed = useCallback((name: string | undefined) => { if (name && errors?.[name] && !gone.has(name)) clear([name]); }, [errors, gone, clear]);
  const ctx = useMemo<FormContextValue>(() => ({ validationMode: mode, errorFor, changed }), [mode, errorFor, changed]);

  /** checkValidity on each control fires `invalid` on the failing ones: their hosts show the error. */
  const validate = useCallback((name?: string) => controls(ref.current, name).reduce((ok, el) => el.checkValidity() && ok, true), []);
  useImperativeHandle(actionsRef, () => ({ validate: (name?: string) => { validate(name); } }), [validate]);

  const handleSubmit = (e: SubmitEvent<HTMLFormElement>) => {
    const f = e.currentTarget;
    setSubmitted(true);
    if (errors) clear(Object.keys(errors));
    if (!validate()) {
      e.preventDefault();
      controls(f).find((el) => !el.validity.valid)?.focus();
      return;
    }
    onSubmit?.(e);
    if (onFormSubmit) { e.preventDefault(); onFormSubmit(valuesOf(f), eventDetails('none', e.nativeEvent)); }
  };
  const handleValue = (e: ChangeEvent<HTMLFormElement>) => changed((e.target as unknown as HTMLInputElement).name);
  const state: PartState = submitted ? { submitted: true } : {};
  return (
    <FormCtx.Provider value={ctx}>
      {renderPart('form', form().root, {
        ref, 'data-ui': 'form', 'data-size': size, noValidate: true, 'data-submitted': submitted ? '' : undefined,
        style: gap === undefined ? style : { ...style, '--ui-gap': String(gap) }, className, ...rest,
        onSubmit: handleSubmit,
        onReset: (e: FormEvent<HTMLFormElement>) => { setSubmitted(false); if (errors) clear(Object.keys(errors)); onReset?.(e); },
        onChange: (e: ChangeEvent<HTMLFormElement>) => { handleValue(e); onChange?.(e); },
        onInput: (e: ChangeEvent<HTMLFormElement>) => { handleValue(e); onInput?.(e as unknown as InputEvent<HTMLFormElement>); },
        render, children,
      }, state)}
    </FormCtx.Provider>
  );
}
