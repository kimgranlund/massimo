// <ui-checkbox>, <ui-radio>, <ui-switch>: form choices with zero native form elements.
// The host is the control (role checkbox / radio / switch); children are the label. The
// indicator sits in the leading slot. Radios group by `name` within their form (or document):
// arrow keys move and select within the group, and only the checked radio is a tab stop.
import { UIFormElement, define, type Problem } from '../../core/index.ts';
import { applyAttrs } from '../../dom/index.ts';
import { observeSlots } from '../slots.ts';
import '../../icons/index.ts';

abstract class UIChoice extends UIFormElement {
  static properties = {
    ...UIFormElement.properties,
    checked: { type: Boolean, default: false },
    value: { type: String, default: 'on' },
  };
  declare checked: boolean;
  declare value: string;

  #unslot?: () => void;
  #default = false;
  protected abstract choiceRole: 'checkbox' | 'radio' | 'switch';
  protected abstract indicator(): HTMLElement;

  connected() {
    this.#default = this.hasAttribute('checked');
    if (!this.querySelector(':scope > [data-part=leading] > [data-part=box], :scope > [slot=leading][data-part=box]')) {
      const box = this.indicator();
      box.setAttribute('slot', 'leading');
      box.setAttribute('data-part', 'box');
      box.setAttribute('aria-hidden', 'true');
      this.prepend(box);
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
    });
  }

  protected checkedState(): string { return String(this.checked); }
  protected tabStop() { return !this.isDisabled; }

  formValue() { return this.checked ? this.value : null; }
  resetValue() { this.checked = this.#default; }
  restoreValue(state: unknown) { this.checked = state != null; }
  validate(): Problem | null {
    return this.required && !this.checked ? { flags: { valueMissing: true }, message: 'Check this to continue.' } : null;
  }

  /** User activation: toggle (radio overrides to select). */
  protected activate() {
    this.checked = !this.checked;
    this.markTouched();
    this.emit();
  }

  protected emit() {
    this.dispatchEvent(new Event('input', { bubbles: true }));
    this.dispatchEvent(new Event('change', { bubbles: true }));
  }

  #onClick = (e: Event) => {
    if (this.isDisabled) { e.preventDefault(); return; }
    this.activate();
  };

  protected onKeydown = (e: KeyboardEvent) => {
    if (e.key === ' ') { e.preventDefault(); if (!this.isDisabled) this.activate(); }
  };
}

export class UICheckbox extends UIChoice {
  static properties = { ...UIChoice.properties, indeterminate: { type: Boolean, default: false, reflect: true } };
  declare indeterminate: boolean;
  protected choiceRole = 'checkbox' as const;
  protected indicator() {
    const box = document.createElement('span');
    box.innerHTML = '<i name="check-bold" data-mark="checked"></i><i name="minus-bold" data-mark="mixed"></i>';
    return box;
  }
  protected checkedState() { return this.indeterminate ? 'mixed' : String(this.checked); }
  protected activate() { this.indeterminate = false; super.activate(); }
}

export class UISwitch extends UIChoice {
  protected choiceRole = 'switch' as const;
  protected indicator() { return document.createElement('span'); }
  // Switches also toggle on Enter.
  protected onKeydown = (e: KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); if (!this.isDisabled) this.activate(); }
  };
}

export class UIRadio extends UIChoice {
  protected choiceRole = 'radio' as const;
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

  protected activate() { this.select(); }

  /** Check this radio and uncheck the rest of its group. */
  select(focus = false) {
    if (this.isDisabled) return;
    const changed = !this.checked;
    for (const r of this.group) if (r !== this && r.checked) r.checked = false;
    this.checked = true;
    for (const r of this.group) r.markTouched();
    if (focus) this.focus();
    if (changed) this.emit();
  }

  // A required group is satisfied when any member is checked.
  validate(): Problem | null {
    const required = this.group.some((r) => r.required);
    return required && !this.group.some((r) => r.checked) ? { flags: { valueMissing: true }, message: 'Select one of these options.' } : null;
  }

  protected onKeydown = (e: KeyboardEvent) => {
    const keys: Record<string, number> = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 };
    if (e.key === ' ') { e.preventDefault(); this.select(); return; }
    const dir = keys[e.key];
    if (!dir) return;
    e.preventDefault();
    const group = this.group.filter((r) => !r.isDisabled);
    const i = group.indexOf(this);
    group[(i + dir + group.length) % group.length]?.select(true);
  };
}

define('ui-checkbox', UICheckbox);
define('ui-radio', UIRadio);
define('ui-switch', UISwitch);

declare global {
  interface HTMLElementTagNameMap { 'ui-checkbox': UICheckbox; 'ui-radio': UIRadio; 'ui-switch': UISwitch }
}
