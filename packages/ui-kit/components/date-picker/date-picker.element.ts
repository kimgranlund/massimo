// <ui-date-picker>: choose a date through a calendar popup and submit one ISO date. Choosing a day
// closes the popup. It's built on ui-popover and ui-calendar.
import { UIFormElement } from '../../core/form-element.ts';
import { define } from '../../core/element.ts';
import { html } from '../../core/template.ts';
import { signal } from '../../core/signals.ts';
import '../popover/popover.element.ts';
import '../calendar/calendar.element.ts';
import '../button/button.element.ts';
import { parseIso, shortDate } from '../../dom/calendar.ts';
import { applyRecipe } from '../classes.ts';
import { datePicker } from '../../styled-system/recipes/date-picker.js';

export class UIDatePicker extends UIFormElement {
  static properties = {
    ...UIFormElement.properties,
    label: { type: String, default: 'Choose a date' },
    value: { type: String, default: '' },
    min: { type: String, default: '' },
    max: { type: String, default: '' },
    locale: { type: String, default: '' },
  };
  declare label: string;
  declare value: string;
  declare min: string;
  declare max: string;
  declare locale: string;
  #open = signal(false);

  template() {
    const shown = parseIso(this.value) ? shortDate(this.value, this.locale || undefined) : this.label;
    return html`<ui-popover .open=${this.#open.value} label=${this.label} @openchange=${(e: Event) => { this.#open.value = !!(e as CustomEvent).detail?.open; }}>
      <ui-button data-part="trigger"><i slot="leading" name="calendar-blank"></i>${shown}</ui-button>
      <div data-part="popup"><ui-calendar .value=${this.value} .min=${this.min} .max=${this.max} .locale=${this.locale} .label=${this.label} @change=${this.#pick}></ui-calendar></div>
    </ui-popover>`;
  }
  update() { applyRecipe(this, datePicker()); }
  formValue() { return this.value || null; }
  resetValue() { this.value = this.getAttribute('value') ?? ''; }

  #pick = (e: Event) => {
    e.stopPropagation();
    this.value = (e.currentTarget as HTMLElement & { value: string }).value;
    this.#open.value = false;
    this.dispatchEvent(new CustomEvent('change', { bubbles: true, detail: { value: this.value } }));
  };
}

define('ui-date-picker', UIDatePicker);

declare global {
  interface HTMLElementTagNameMap { 'ui-date-picker': UIDatePicker }
}
