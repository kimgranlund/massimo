// <ui-checkbox>, <ui-radio>, <ui-switch>: form choices with zero native form elements.
// The host is the control (role checkbox / radio / switch); children are the label. The
// indicator (Base UI Checkbox.Indicator / Radio.Indicator; the switch's holds its Switch.Thumb) sits
// in the leading slot. Radios group by `name` within their form (or document):
// arrow keys move and select within the group, and only the checked radio is a tab stop.
import { UIFormElement, define, settleDefault, type Problem } from '../../core/index.ts';
import { applyAttrs, checkedDataAttrs, eventDetails } from '../../dom/index.ts';
import { observeSlots } from '../slots.ts';
import { applyRecipe, partOf } from '../classes.ts';
import { checkbox } from '../../styled-system/recipes/checkbox.js';
import { radio } from '../../styled-system/recipes/radio.js';
import { switchRecipe } from '../../styled-system/recipes/switch-recipe.js';
import '../../icons/index.ts';

abstract class UIChoice extends UIFormElement {
  static properties = {
    ...UIFormElement.properties,
    checked: { type: Boolean, default: false },
    /** Checked at first render and on form reset; without it, the checked attribute (Base UI defaultChecked). */
    defaultChecked: { type: Boolean, default: null },
    value: { type: String, default: 'on' },
  };
  declare checked: boolean;
  declare defaultChecked: boolean | null;
  declare value: string;

  #unslot?: () => void;
  protected abstract choiceRole: 'checkbox' | 'radio' | 'switch';
  protected abstract indicator(): HTMLElement;
  /** The slot recipe's classes (choice.recipe.ts). */
  protected abstract recipe(): Record<string, string>;

  connected() {
    settleDefault(this, false, false, 'checked');
    if (!this.querySelector(':scope > [data-part=leading] > [data-part=indicator], :scope > [slot=leading][data-part=indicator]')) {
      const indicator = this.indicator();
      indicator.setAttribute('slot', 'leading');
      indicator.setAttribute('data-part', 'indicator');
      indicator.setAttribute('aria-hidden', 'true');
      this.prepend(indicator);
    }
    this.#unslot = observeSlots(this);
    this.addEventListener('click', this.#onClick);
    this.addEventListener('keydown', this.onKeydown);
  }

  disconnected() {
    this.#unslot?.();
    this.removeEventListener('click', this.#onClick);
    this.removeEventListener('keydown', this.onKeydown);
  }

  update() {
    applyAttrs(this, {
      role: this.choiceRole,
      'aria-checked': this.checkedState(),
      'aria-disabled': this.isDisabled ? 'true' : undefined,
      'aria-required': this.required ? 'true' : undefined,
      'aria-invalid': this.userInvalid ? 'true' : undefined,
      tabindex: this.tabStop() ? 0 : -1,
      ...checkedDataAttrs(this.checked, this.isIndeterminate()),
    });
    const indicator = () => partOf(partOf(this, 'leading') ?? this, 'indicator');
    applyRecipe(this, this.recipe(), (slot) => slot === 'indicator' ? indicator() : slot === 'thumb' ? partOf(indicator() ?? this, 'thumb') : partOf(this, slot));
  }

  protected checkedState(): string { return String(this.checked); }
  protected isIndeterminate() { return false; }
  protected tabStop() { return !this.isDisabled; }

  formValue() { return this.checked ? this.value : null; }
  resetValue() { this.checked = !!this.defaultChecked; }
  restoreValue(state: unknown) { this.checked = state != null; }
  validate(): Problem | null {
    return this.required && !this.checked ? { flags: { valueMissing: true }, message: 'Check this to continue.' } : null;
  }

  /** User activation: toggle (radio overrides to select). */
  protected activate(event?: Event) {
    this.checked = !this.checked;
    this.markTouched();
    this.emit(event);
  }

  /** input and change with Base UI's onCheckedChange details (reason 'none', as Base UI). */
  protected emit(event?: Event) {
    const detail = { checked: this.checked, value: this.value, ...eventDetails('none', event) };
    this.dispatchEvent(new CustomEvent('input', { bubbles: true, detail }));
    this.dispatchEvent(new CustomEvent('change', { bubbles: true, detail }));
  }

  #onClick = (e: Event) => {
    if (this.isDisabled) { e.preventDefault(); return; }
    this.activate(e);
  };

  protected onKeydown = (e: KeyboardEvent) => {
    if (e.key === ' ') { e.preventDefault(); if (!this.isDisabled) this.activate(e); }
  };
}

export class UICheckbox extends UIChoice {
  static properties = { ...UIChoice.properties, indeterminate: { type: Boolean, default: false, reflect: true } };
  declare indeterminate: boolean;
  protected choiceRole = 'checkbox' as const;
  protected recipe() { return checkbox(); }
  protected indicator() {
    const indicator = document.createElement('span');
    indicator.innerHTML = '<i name="check-bold" data-mark="checked"></i><i name="minus-bold" data-mark="mixed"></i>';
    return indicator;
  }
  protected checkedState() { return this.indeterminate ? 'mixed' : String(this.checked); }
  protected isIndeterminate() { return this.indeterminate; }
  protected activate(event?: Event) { this.indeterminate = false; super.activate(event); }
}

export class UISwitch extends UIChoice {
  protected choiceRole = 'switch' as const;
  protected recipe() { return switchRecipe(); }
  protected indicator() {
    const indicator = document.createElement('span');
    indicator.innerHTML = '<span data-part="thumb"></span>';
    return indicator;
  }
  // Switches also toggle on Enter.
  protected onKeydown = (e: KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (!this.isDisabled) this.activate(e); }
  };
}

export class UIRadio extends UIChoice {
  protected choiceRole = 'radio' as const;
  protected recipe() { return radio(); }
  protected indicator() { return document.createElement('span'); }

  /** Radios sharing this one's name in the same form (or document when outside a form). */
  get group(): UIRadio[] {
    if (!this.name) return [this];
    const scope: ParentNode = this.form ?? this.getRootNode() as ParentNode;
    return [...scope.querySelectorAll<UIRadio>(`ui-radio[name="${CSS.escape(this.name)}"]`)].filter((r) => (r.form ?? null) === (this.form ?? null));
  }

  // Roving tab stop: the checked radio, or the first enabled one when none is checked.
  protected tabStop() {
    if (this.isDisabled) return false;
    const group = this.group.filter((r) => !r.isDisabled);
    const checked = group.find((r) => r.checked);
    return (checked ?? group[0]) === this;
  }

  protected activate(event?: Event) { this.select(false, event); }

  /** Check this radio and uncheck the rest of its group. */
  select(focus = false, event?: Event) {
    if (this.isDisabled) return;
    const changed = !this.checked;
    for (const r of this.group) if (r !== this && r.checked) r.checked = false;
    this.checked = true;
    for (const r of this.group) r.markTouched();
    if (focus) this.focus();
    if (changed) this.emit(event);
  }

  // A required group is satisfied when any member is checked.
  validate(): Problem | null {
    const required = this.group.some((r) => r.required);
    return required && !this.group.some((r) => r.checked) ? { flags: { valueMissing: true }, message: 'Select one of these options.' } : null;
  }

  protected onKeydown = (e: KeyboardEvent) => {
    const keys: Record<string, number> = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
    if (e.key === ' ') { e.preventDefault(); this.select(false, e); return; }
    const dir = keys[e.key];
    if (!dir) return;
    e.preventDefault();
    const group = this.group.filter((r) => !r.isDisabled);
    const i = group.indexOf(this);
    group[(i + dir + group.length) % group.length]?.select(true, e);
  };
}

define('ui-checkbox', UICheckbox);
define('ui-radio', UIRadio);
define('ui-switch', UISwitch);

declare global {
  interface HTMLElementTagNameMap { 'ui-checkbox': UICheckbox; 'ui-radio': UIRadio; 'ui-switch': UISwitch }
}
