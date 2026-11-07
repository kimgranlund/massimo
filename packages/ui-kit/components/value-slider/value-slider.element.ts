// <ui-value-slider>: a compact range with its label and value inside the track, for a panel of tunable
// numbers. It wraps ui-range, which keeps the keyboard, pointer, form and ARIA behavior.
import { UIElement, define } from '../../core/element.ts';
import { html } from '../../core/template.ts';
import '../range/range.element.ts';
import { applyRecipe } from '../classes.ts';
import { valueSlider } from '../../styled-system/recipes/value-slider.js';

export class UIValueSlider extends UIElement {
  static properties = {
    label: { type: String, default: '' },
    name: { type: String, default: '' },
    value: { type: Number, default: 50 },
    min: { type: Number, default: 0 },
    max: { type: Number, default: 100 },
    step: { type: Number, default: 1 },
    unit: { type: String, default: '' },
  };
  declare label: string;
  declare name: string;
  declare value: number;
  declare min: number;
  declare max: number;
  declare step: number;
  declare unit: string;

  template() {
    return html`<ui-range .label=${this.label} .name=${this.name} .min=${this.min} .max=${this.max} .step=${this.step} .value=${this.value} @input=${this.#sync}></ui-range>
      <span data-part="label" aria-hidden="true">${this.label}</span><span data-part="value" aria-hidden="true">${String(this.value)}${this.unit}</span>`;
  }

  update() { applyRecipe(this, valueSlider(), (slot) => this.querySelector(`:scope > [data-part=${slot}]`)); }

  #sync = (e: Event) => { const v = (e.currentTarget as HTMLElement & { value: number }).value; if (typeof v === 'number') this.value = v; };
}

define('ui-value-slider', UIValueSlider);

declare global {
  interface HTMLElementTagNameMap { 'ui-value-slider': UIValueSlider }
}
