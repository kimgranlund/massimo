/// <reference path="../jsx.d.ts" />
// React <Autocomplete>: free text with suggestions (Base UI Autocomplete), the web component's
// anatomy on the Combobox parts (components/combobox/combobox.react.tsx) with free text: the value
// is the input's text (onValueChange on every change: reason input-change, input-clear,
// item-press, clear-press, keyboard), the items are suggestions, `mode` filters (list, both) and
// completes inline (both, inline: the rest of the first match, selected; arrows write the
// highlighted suggestion). Styled by the autocomplete recipe (the combobox's, without chips).
// Compound parts: Autocomplete.Root, Label, Control (ours), Input, Clear, Trigger, Positioner (no
// element), Popup, List, Item, ItemText, Empty, Description, Error. The preset
// <Autocomplete label leading prefix suffix placeholder showTrigger emptyText description error>
// {items}</Autocomplete> is Root + parts.
import type { ReactNode } from 'react';
import type { AutocompleteMode } from '../../dom/index.ts';
import type { PartProps } from '../parts.react.tsx';
import {
  ComboboxClear, ComboboxControl, ComboboxDescription, ComboboxEmpty, ComboboxError, ComboboxInput, ComboboxItem, ComboboxLabel,
  ComboboxList, ComboboxPopup, ComboboxPositioner, ComboboxRoot, ComboboxTrigger, type ComboboxRootProps,
} from '../combobox/combobox.react.tsx';
import { ItemText } from '../listbox/listbox.react.tsx';

export interface AutocompleteRootProps extends Omit<ComboboxRootProps, 'freeText' | 'kind' | 'multiple' | 'value' | 'defaultValue' | 'onValueChange' | 'inputValue' | 'defaultInputValue' | 'onInputValueChange'> {
  /** The text (Base UI value). */
  value?: string;
  defaultValue?: string;
  /** The text changed (Base UI onValueChange): typing, a suggestion, the clear button or an arrow key in an inline mode. */
  onValueChange?: (value: string, details: import('../../dom/index.ts').ChangeDetails) => void;
  /** list (default) filters; both filters and completes inline; inline completes only; none neither (Base UI mode). */
  mode?: AutocompleteMode;
}

/** Autocomplete.Root: Combobox.Root with free text and the autocomplete recipe. */
export function AutocompleteRoot({ mode = 'list', ...rest }: AutocompleteRootProps) {
  return <ComboboxRoot {...rest} freeText kind="autocomplete" mode={mode} />;
}

export interface AutocompleteProps extends AutocompleteRootProps, Omit<PartProps, 'trailing'> {
  label?: string;
  description?: string;
  placeholder?: string;
  /** Show the trigger (caret) that opens every suggestion. */
  showTrigger?: boolean;
  /** What the popup says when nothing matches; empty (the default) hides the popup instead. */
  emptyText?: string;
  /** Autocomplete.Item children (the suggestions). */
  children?: ReactNode;
}

/** Preset: Root with a Label, the Control (input, clear, the trigger with showTrigger, adornments), Positioner › Popup › List › suggestions, Empty, Description and Error. */
export function Autocomplete({ label, description, error, leading, prefix, suffix, placeholder, showTrigger, emptyText = '', children, ...rest }: AutocompleteProps) {
  return (
    <AutocompleteRoot error={error} {...rest}>
      {label && <ComboboxLabel>{label}</ComboboxLabel>}
      <ComboboxControl {...{ leading, prefix, suffix }}>
        <ComboboxInput placeholder={placeholder} /><ComboboxClear />{showTrigger && <ComboboxTrigger />}
      </ComboboxControl>
      <ComboboxPositioner><ComboboxPopup><ComboboxList>{children}</ComboboxList><ComboboxEmpty>{emptyText}</ComboboxEmpty></ComboboxPopup></ComboboxPositioner>
      {description && <ComboboxDescription>{description}</ComboboxDescription>}
      {error && <ComboboxError>{error}</ComboboxError>}
    </AutocompleteRoot>
  );
}
Autocomplete.Root = AutocompleteRoot;
Autocomplete.Label = ComboboxLabel;
Autocomplete.Control = ComboboxControl;
Autocomplete.Input = ComboboxInput;
Autocomplete.Clear = ComboboxClear;
Autocomplete.Trigger = ComboboxTrigger;
Autocomplete.Positioner = ComboboxPositioner;
Autocomplete.Popup = ComboboxPopup;
Autocomplete.List = ComboboxList;
Autocomplete.Item = ComboboxItem;
Autocomplete.ItemText = ItemText;
Autocomplete.Empty = ComboboxEmpty;
Autocomplete.Description = ComboboxDescription;
Autocomplete.Error = ComboboxError;
