// <ui-date-range-picker>: edit one inclusive date range and apply it. The value and the form change
// only on Apply. The value is start/end, in ISO dates.
import { UIFormElement } from '../../core/form-element.ts';
import { define } from '../../core/element.ts';
import { html } from '../../core/template.ts';
import { signal } from '../../core/signals.ts';
import '../popover/popover.element.ts';
import '../calendar/calendar.element.ts';
import '../button/button.element.ts';
import { rangeComplete, rangeText } from '../../dom/calendar.ts';
import { applyRecipe } from '../classes.ts';
import { dateRangePicker } from '../../styled-system/recipes/date-range-picker.js';

export class UIDateRangePicker extends UIFormElement {
  static properties = {
    ...UIFormElement.properties,
    label: { type: String, default: 'Choose dates' },
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
  #draft = signal<string | null>(null);

  template() {
    const draft = this.#draft.value ?? this.value;
    return html`<ui-popover .open=${this.#open.value} label=${this.label} @openchange=${this.#onOpen}>
      <ui-button data-part="trigger"><i slot="leading" name="calendar-blank"></i>${rangeText(this.value, this.label, this.locale || undefined)}</ui-button>
      <div data-part="popup"><div data-part="body">
        <ui-calendar mode="range" .value=${draft} .min=${this.min} .max=${this.max} .locale=${this.locale} .label=${this.label} @change=${this.#edit} @click=${this.#read}></ui-calendar>
        <div data-part="actions"><ui-button @click=${this.#cancel}>Cancel</ui-button><ui-button variant="primary" ?disabled=${!rangeComplete(draft)} @click=${this.#apply}>Apply</ui-button></div>
      </div></div>
    </ui-popover>`;
  }
  update() { applyRecipe(this, dateRangePicker(), (slot) => this.querySelector(`[data-part=${slot}]`)); }
  formValue() { return this.value || null; }
  resetValue() { this.value = this.getAttribute('value') ?? ''; this.#draft.value = null; }

  #onOpen = (e: Event) => { this.#open.value = !!(e as CustomEvent).detail?.open; if (!this.#open.value) this.#draft.value = null; };
  #edit = (e: Event) => { e.stopPropagation(); this.#draft.value = (e.currentTarget as HTMLElement & { value: string }).value; };
  #read = (e: Event) => { this.#draft.value = (e.currentTarget as HTMLElement & { value: string }).value; };
  #cancel = () => { this.#draft.value = null; this.#open.value = false; };
  #apply = () => {
    const draft = this.#draft.value;
    if (draft && rangeComplete(draft)) {
      this.value = draft;
      this.dispatchEvent(new CustomEvent('change', { bubbles: true, detail: { value: draft } }));
    }
    this.#cancel();
  };
}

define('ui-date-range-picker', UIDateRangePicker);

declare global {
  interface HTMLElementTagNameMap { 'ui-date-range-picker': UIDateRangePicker }
}
