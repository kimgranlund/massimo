// <ui-color-picker>: edit a color's OKLCH channels in a popover, then accept or cancel. The value and
// the form change only on Apply. It's built on ui-popover, ui-range and ui-button.
import { UIFormElement } from '../../core/form-element.ts';
import { define } from '../../core/element.ts';
import { html } from '../../core/template.ts';
import { signal } from '../../core/signals.ts';
import '../popover/popover.element.ts';
import '../range/range.element.ts';
import '../button/button.element.ts';
import '../color/color.element.ts';
import { COLOR_RANGES, formatOklch, parseOklch, type Oklch } from '../../dom/color.ts';
import { applyRecipe } from '../classes.ts';
import { colorPicker } from '../../styled-system/recipes/color-picker.js';

const FALLBACK: Oklch = { l: 0.6, c: 0.15, h: 250 };

export class UIColorPicker extends UIFormElement {
  static properties = {
    ...UIFormElement.properties,
    label: { type: String, default: 'Color' },
    value: { type: String, default: 'oklch(0.6 0.15 250)' },
  };
  declare label: string;
  declare value: string;

  #draft = signal<Oklch | null>(null);
  #open = signal(false);
  get #accepted() { return parseOklch(this.value) ?? FALLBACK; }

  template() {
    const draft = this.#draft.value ?? this.#accepted, css = formatOklch(draft);
    const channel = (key: keyof Oklch, name: string) => html`<ui-range label=${name} .min=${COLOR_RANGES[key].min} .max=${COLOR_RANGES[key].max} .step=${COLOR_RANGES[key].step} .value=${draft[key]} @input=${(e: Event) => this.#set(key, (e.currentTarget as HTMLElement & { value: number }).value)}></ui-range>`;
    return html`<ui-popover .open=${this.#open.value} label=${this.label} @openchange=${this.#onOpen}>
      <ui-button data-part="trigger"><ui-swatch slot="leading" .color=${this.value} .label=${this.value}></ui-swatch>${this.label}</ui-button>
      <div data-part="popup"><div data-part="channels">
        <span data-part="preview" style=${`background: ${css}`} role="img" aria-label=${`Draft color ${css}`}></span>
        ${channel('l', 'Lightness')}${channel('c', 'Chroma')}${channel('h', 'Hue')}
        <div data-part="actions"><ui-button @click=${this.#cancel}>Cancel</ui-button><ui-button variant="primary" @click=${this.#apply}>Apply</ui-button></div>
      </div></div>
    </ui-popover>`;
  }

  update() { applyRecipe(this, colorPicker(), (slot) => this.querySelector(`[data-part=${slot}]`)); }

  formValue() { return this.value; }
  resetValue() { this.value = this.getAttribute('value') ?? ''; this.#draft.value = null; }

  #set(key: keyof Oklch, v: number) { this.#draft.value = { ...(this.#draft.value ?? this.#accepted), [key]: v }; }
  #onOpen = (e: Event) => { this.#open.value = !!(e as CustomEvent).detail?.open; if (!this.#open.value) this.#draft.value = null; };
  #cancel = () => { this.#draft.value = null; this.#open.value = false; };
  #apply = () => {
    if (this.#draft.value) {
      this.value = formatOklch(this.#draft.value);
      this.dispatchEvent(new CustomEvent('change', { bubbles: true, detail: { value: this.value } }));
    }
    this.#draft.value = null;
    this.#open.value = false;
  };
}

define('ui-color-picker', UIColorPicker);

declare global {
  interface HTMLElementTagNameMap { 'ui-color-picker': UIColorPicker }
}
