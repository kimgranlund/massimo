// <ui-checkbox-group>: a set of values chosen with its <ui-checkbox> children (Base UI
// CheckboxGroup), with zero native form elements. The host is a labelled group (role=group); it owns
// the value array: it sets each checkbox's checked state from it, a checkbox press adds or removes
// that checkbox's value, and the group fires change and input with { value, reason, event } (the
// checkboxes then fire none). A `parent` checkbox is checked when every value is, mixed when some
// are, and checks or clears them all. With a name the group submits name=value once per value.
// disabled reaches every checkbox inside. Name it with a ui-field label, a ui-fieldset legend or label.
import { UIFormElement, define, registerDisabler, settleDefault, signal, syncDisabled, type Problem } from '../../core/index.ts';
import { applyAttrs, eventDetails, type Orientation } from '../../dom/index.ts';
import { applyRecipe } from '../classes.ts';
import { UICheckbox, type UIChoice } from '../choice/choice.element.ts';
import { checkboxGroup } from '../../styled-system/recipes/checkbox-group.js';

/** A value list from a property: an array, or a space-separated attribute string. */
export const valueList = (v: unknown): string[] => Array.isArray(v) ? v.map(String) : typeof v === 'string' ? v.split(/\s+/).filter(Boolean) : [];
const NONE: string[] = [];
const same = (a: string[], b: string[]) => a.length === b.length && a.every((x, i) => x === b[i]);

export class UICheckboxGroup extends UIFormElement {
  static properties = {
    ...UIFormElement.properties,
    /** The checked values, in the order they were checked (attribute: space-separated). */
    value: { default: null },
    /** The value at first render and on form reset; without it, the value attribute, else the checkboxes authored checked (Base UI defaultValue). */
    defaultValue: { default: null },
    /** Every value the parent checkbox sets (attribute: space-separated); default: the member checkboxes' values (Base UI allValues). */
    allValues: { default: null },
    /** vertical: one checkbox per row; horizontal: a wrapping row. */
    orientation: { type: String, default: 'vertical', reflect: true },
    /** Accessible name when no ui-field label or ui-fieldset legend names the group (aria-label). */
    label: { type: String, default: '' },
  };
  declare value: string[];
  declare defaultValue: string[] | null;
  declare allValues: string[] | null;
  declare orientation: Orientation;
  declare label: string;

  /** A checkbox group has no read-only state (Base UI CheckboxGroup). */
  get readonly() { return false; }

  #rev = signal(0);
  #observer?: MutationObserver;
  #adopted = new WeakSet<UICheckbox>();

  /** The checked values as a list (the value property normalized). Reactive. */
  get values(): string[] { return valueList(this.value); }
  /** The checkboxes this group owns: ui-checkbox descendants whose nearest group is this one (the parent included). */
  get checkboxes(): UICheckbox[] { return this.#members().filter((c): c is UICheckbox => c instanceof UICheckbox); }
  /** What the parent checkbox sets: allValues, else every member value but the parent's. */
  get everyValue(): string[] {
    const all = valueList(this.allValues);
    return all.length ? all : this.#members().filter((c) => !isParent(c)).map(valueOf);
  }

  #members() {
    this.#rev.value;
    return [...this.querySelectorAll<HTMLElement>('ui-checkbox')].filter((c) => c.parentElement?.closest('ui-checkbox-group') === this);
  }

  connected() {
    // Checkboxes authored checked are the default when neither value nor default-value is given.
    if (this.defaultValue == null && !this.hasAttribute('value')) {
      const checked = this.#members().filter((c) => !isParent(c) && c.hasAttribute('checked')).map(valueOf);
      if (checked.length) this.defaultValue = checked;
    }
    if (this.defaultValue != null) this.defaultValue = valueList(this.defaultValue);
    settleDefault(this, null, NONE);
    this.#observer = new MutationObserver(() => { this.#rev.value++; });
    this.#observer.observe(this, { childList: true, subtree: true });
    queueMicrotask(() => { syncDisabled(this); this.#rev.value++; });
  }

  disconnected() { this.#observer?.disconnect(); }

  update() {
    // An attribute gives a string: keep the property a list.
    if (!Array.isArray(this.value)) this.value = valueList(this.value);
    const values = this.values, all = this.everyValue;
    const some = all.some((v) => values.includes(v)), every = all.length > 0 && all.every((v) => values.includes(v));
    for (const c of this.#members()) {
      const box = c as UICheckbox;
      const checked = isParent(c) ? every : values.includes(valueOf(c));
      const mixed = isParent(c) && some && !every;
      if (box.checked !== checked || !!box.indeterminate !== mixed) {
        // A checkbox the group adopts is in step from the start: not dirty for the group's value.
        if (c instanceof UICheckbox && !this.#adopted.has(c)) c.markClean();
        box.checked = checked;
        box.indeterminate = mixed;
      }
      if (c instanceof UICheckbox) this.#adopted.add(c);
    }
    applyAttrs(this, {
      role: 'group',
      'aria-label': this.label || undefined,
      'aria-disabled': this.isDisabled ? 'true' : undefined,
      'aria-invalid': this.userInvalid ? 'true' : undefined,
      'data-orientation': this.orientation === 'horizontal' ? 'horizontal' : 'vertical',
    });
    applyRecipe(this, checkboxGroup({ orientation: this.orientation === 'horizontal' ? 'horizontal' : 'vertical' }));
  }

  /** Focus the first enabled checkbox. */
  focus(options?: FocusOptions) { this.checkboxes.find((c) => !c.isDisabled)?.focus(options); }

  formValue() {
    const values = this.values;
    if (!this.name || !values.length) return null;
    const data = new FormData();
    for (const v of values) data.append(this.name, v);
    return data;
  }
  valueKey() { return this.values.join('\n'); }
  isFilled() { return this.values.length > 0; }
  resetValue() { this.value = valueList(this.defaultValue); }
  restoreValue(state: unknown) { if (state instanceof FormData) this.value = [...state.values()].map(String); }
  validate(): Problem | null {
    return this.required && !this.values.length ? { flags: { valueMissing: true }, message: 'Check at least one of these options.' } : null;
  }
  validationAnchor() { return this.checkboxes[0]; }

  /** A checkbox was toggled: add or remove its value (the parent: every value or none); fire { value, reason: 'none', event }. */
  choiceChanged(choice: UIChoice, event?: Event) {
    if (this.isDisabled) return;
    const values = this.values;
    const next = (choice as UICheckbox).parent
      ? (choice.checked ? [...this.everyValue] : [])
      : choice.checked ? (values.includes(choice.value) ? values : [...values, choice.value]) : values.filter((v) => v !== choice.value);
    this.markTouched();
    if (same(next, values)) return;
    this.value = next;
    const detail = { value: next, ...eventDetails('none', event) };
    this.dispatchEvent(new CustomEvent('input', { bubbles: true, detail }));
    this.dispatchEvent(new CustomEvent('change', { bubbles: true, detail }));
  }
}

const isParent = (c: HTMLElement) => c instanceof UICheckbox ? c.parent : c.hasAttribute('parent');
const valueOf = (c: HTMLElement) => c instanceof UICheckbox ? c.value : c.getAttribute('value') ?? 'on';

registerDisabler('ui-checkbox-group');
define('ui-checkbox-group', UICheckboxGroup);

declare global {
  interface HTMLElementTagNameMap { 'ui-checkbox-group': UICheckboxGroup }
}
