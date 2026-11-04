// <ui-radio-group>: one value chosen from its <ui-radio> children (Base UI RadioGroup), with zero
// native form elements. The host is the radiogroup; it owns the value and the form participation
// (name, value, required, reset), sets each radio's checked state from its value, and fires change
// and input with { value, reason, event } when the user picks a radio (the radios then fire none).
// Its radios keep their keyboard model: arrows move and select within the group, and only the
// checked (or first enabled) radio is a tab stop. disabled and readonly reach every radio inside.
// Name it with a ui-field (its label names the group), a ui-fieldset legend, or label / aria-label.
import { UIFormElement, registerDisabler, settleDefault, syncDisabled, type Problem } from '../../core/form-element.ts';
import { define } from '../../core/element.ts';
import { signal } from '../../core/signals.ts';
import { applyAttrs } from '../../dom/attrs.ts';
import { eventDetails } from '../../dom/events.ts';
import { type Orientation } from '../../dom/listbox.ts';
import { applyRecipe } from '../classes.ts';
import { UIRadio, type UIChoice } from '../choice/choice.element.ts';
import { radioGroup } from '../../styled-system/recipes/radio-group.js';

export class UIRadioGroup extends UIFormElement {
  static properties = {
    ...UIFormElement.properties,
    /** The checked radio's value ('' when none). */
    value: { type: String, default: '' },
    /** The value at first render and on form reset; without it, the value attribute, else the radio authored checked (Base UI defaultValue). */
    defaultValue: { type: String, default: null },
    /** Radios can be focused but not changed (aria-readonly, data-readonly). */
    readonly: { type: Boolean, default: false, reflect: true },
    /** vertical: one radio per row; horizontal: a wrapping row. */
    orientation: { type: String, default: 'vertical', reflect: true },
    /** list: choice rows; card: each choice is a card surface holding any content (plan pickers, rich choices). */
    variant: { type: String, default: 'list', reflect: true },
    /** Accessible name when no ui-field label or ui-fieldset legend names the group (aria-label). */
    label: { type: String, default: '' },
  };
  declare value: string;
  declare defaultValue: string | null;
  declare readonly: boolean;
  declare orientation: Orientation;
  declare variant: 'list' | 'card';
  declare label: string;

  /** Bumped when radios are added, removed or upgraded, so update() reads the new set. */
  #rev = signal(0);
  #observer?: MutationObserver;
  /** Radios already set once by this group (later changes are the user's: dirty). */
  #adopted = new WeakSet<UIRadio>();

  /** The radios this group owns: ui-radio descendants whose nearest group is this one. */
  get radios(): UIRadio[] { return this.#members().filter((r): r is UIRadio => r instanceof UIRadio); }

  /** Every ui-radio this group owns, upgraded or not. */
  #members() {
    this.#rev.value;
    return [...this.querySelectorAll<HTMLElement>('ui-radio')].filter((r) => r.parentElement?.closest('ui-radio-group') === this);
  }

  connected() {
    // A radio authored checked is the default when neither value nor default-value is given.
    if (this.defaultValue == null && !this.hasAttribute('value')) {
      const checked = [...this.querySelectorAll('ui-radio[checked]')].find((r) => r.parentElement?.closest('ui-radio-group') === this);
      if (checked) this.defaultValue = checked.getAttribute('value') ?? 'on';
    }
    settleDefault(this, '');
    this.#observer = new MutationObserver(() => { this.#rev.value++; });
    this.#observer.observe(this, { childList: true, subtree: true });
    // Radios upgrade after their group: read them (and give them this group as their container) then.
    queueMicrotask(() => { syncDisabled(this); this.#rev.value++; });
  }

  disconnected() { this.#observer?.disconnect(); }

  update() {
    // Set before a radio upgrades too (it adopts the property), so its first render is already in step.
    for (const r of this.#members()) {
      const v = r instanceof UIRadio ? r.value : r.getAttribute('value') ?? 'on';
      const want = v === this.value && this.value !== '';
      if ((r as UIRadio).checked !== want) {
        // A radio the group adopts is in step from the start: not dirty for the group's value.
        if (r instanceof UIRadio && !this.#adopted.has(r)) r.markClean();
        (r as UIRadio).checked = want;
      }
      if (r instanceof UIRadio) this.#adopted.add(r);
    }
    applyAttrs(this, {
      role: 'radiogroup',
      'aria-label': this.label || undefined,
      'aria-orientation': this.orientation === 'horizontal' ? 'horizontal' : undefined,
      'aria-disabled': this.isDisabled ? 'true' : undefined,
      'aria-required': this.required ? 'true' : undefined,
      'aria-readonly': this.readonly ? 'true' : undefined,
      'aria-invalid': this.userInvalid ? 'true' : undefined,
      'data-orientation': this.orientation === 'horizontal' ? 'horizontal' : 'vertical',
      'data-variant': this.variant === 'card' ? 'card' : undefined,
    });
    applyRecipe(this, radioGroup({ orientation: this.orientation === 'horizontal' ? 'horizontal' : 'vertical', variant: this.variant === 'card' ? 'card' : 'list' }));
  }

  /** Focus the radio that is the tab stop (the checked one, else the first enabled one). */
  focus(options?: FocusOptions) {
    const group = this.radios.filter((r) => !r.isDisabled);
    (group.find((r) => r.checked) ?? group[0])?.focus(options);
  }

  formValue() { return this.value || null; }
  resetValue() { this.value = this.defaultValue ?? ''; }
  restoreValue(state: unknown) { if (typeof state === 'string') this.value = state; }
  isReadonly() { return this.readonly; }
  validate(): Problem | null {
    return this.required && !this.value ? { flags: { valueMissing: true }, message: 'Select one of these options.' } : null;
  }
  validationAnchor() { return this.radios[0]; }

  /** A radio was picked: it becomes the value; input and change carry { value, reason: 'none', event } (Base UI). */
  choiceChanged(choice: UIChoice, event?: Event) {
    if (this.isDisabled || this.readonly || this.value === choice.value) return;
    this.value = choice.value;
    this.markTouched();
    const detail = { value: this.value, ...eventDetails('none', event) };
    this.dispatchEvent(new CustomEvent('input', { bubbles: true, detail }));
    this.dispatchEvent(new CustomEvent('change', { bubbles: true, detail }));
  }
}

registerDisabler('ui-radio-group');
define('ui-radio-group', UIRadioGroup);

declare global {
  interface HTMLElementTagNameMap { 'ui-radio-group': UIRadioGroup }
}
