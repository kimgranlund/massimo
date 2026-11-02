// React context a choice group shares with its choices (RadioGroup → Radio, CheckboxGroup →
// Checkbox): the group owns the value, and each choice reads its checked state, name, disabled and
// read-only from it and reports a press back. choice.react.tsx consumes it; the group renderers
// (radio-group.react.tsx, checkbox-group.react.tsx) provide it.
import { createContext } from 'react';

export interface RadioGroupContext {
  /** The native radios' shared name (the group's name, or a generated one). */
  name: string;
  value: string;
  disabled: boolean;
  readOnly: boolean;
  required: boolean;
  /** A radio was picked by the user. */
  select(value: string, event: Event): void;
}
export const RadioGroupCtx = createContext<RadioGroupContext | null>(null);

export interface CheckboxGroupContext {
  name?: string;
  value: string[];
  /** Every member value (allValues, or the members that registered): what the parent checkbox sets. */
  allValues: string[];
  disabled: boolean;
  /** A member was toggled by the user. */
  toggle(value: string, checked: boolean, event: Event): void;
  /** The parent checkbox was toggled: every value, or none. */
  setAll(checked: boolean, event: Event): void;
  /** Members register their value so a parent checkbox knows the set without allValues. */
  register(value: string): () => void;
}
export const CheckboxGroupCtx = createContext<CheckboxGroupContext | null>(null);
