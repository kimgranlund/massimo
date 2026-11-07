// <ui-time-picker>: type a time or pick a suggestion. "9:30 pm", "2130" and "21:30" all mean the same
// time, and the form gets HH:MM. It wraps ui-autocomplete, which owns the field and the popup.
import { UIElement, define } from '../../core/element.ts';
import { html } from '../../core/template.ts';
import '../autocomplete/autocomplete.element.ts';
import '../listbox/listbox.element.ts';
import { parseTime, timeSlots } from '../../dom/time.ts';
import { applyRecipe } from '../classes.ts';
import { timePicker } from '../../styled-system/recipes/time-picker.js';

type Field = HTMLElement & { value: string; error: string };

export class UITimePicker extends UIElement {
  static properties = {
    label: { type: String, default: 'Time' },
    name: { type: String, default: '' },
    value: { type: String, default: '' },
    step: { type: Number, default: 30 },
    required: { type: Boolean, default: false },
  };
  declare label: string;
  declare name: string;
  declare value: string;
  declare step: number;
  declare required: boolean;

  template() {
    return html`<ui-autocomplete .label=${this.label} .name=${this.name} .value=${this.value} ?required=${this.required} @change=${this.#commit}></ui-autocomplete>`;
  }

  update() {
    applyRecipe(this, timePicker());
    const field = this.querySelector('ui-autocomplete');
    if (!field || field.querySelector('ui-option')) return;
    field.append(...timeSlots(this.step).map((t) => { const o = document.createElement('ui-option'); o.textContent = t; return o; }));
  }

  #commit = (e: Event) => {
    const field = e.currentTarget as Field, time = parseTime(field.value);
    e.stopPropagation();
    field.error = field.value && !time ? 'Enter a time, like 14:30 or 2:30 pm.' : '';
    if (!time) return;
    field.value = time;
    this.value = time;
    this.dispatchEvent(new CustomEvent('change', { bubbles: true, detail: { value: time } }));
  };
}

define('ui-time-picker', UITimePicker);

declare global {
  interface HTMLElementTagNameMap { 'ui-time-picker': UITimePicker }
}
