// <ui-input>: renders label, native <input>, description and error. Form-associated.
import { UIElement, define, html } from '../../core/index.ts';
import { fieldAttrs, uid } from '../../dom/index.ts';
import { input, type InputVariantProps } from '../../styled-system/recipes/index.js';

export class UIInput extends UIElement {
  static formAssociated = true;
  static properties = {
    label: { type: String, default: '' },
    value: { type: String, default: '' },
    name: { type: String, default: '' },
    type: { type: String, default: 'text' },
    placeholder: { type: String, default: '' },
    description: { type: String, default: '' },
    error: { type: String, default: '' },
    size: { type: String, default: 'md', reflect: true },
    required: { type: Boolean, default: false },
    disabled: { type: Boolean, default: false, reflect: true },
  };
  declare label: string;
  declare value: string;
  declare name: string;
  declare type: string;
  declare placeholder: string;
  declare description: string;
  declare error: string;
  declare size: NonNullable<InputVariantProps['size']>;
  declare required: boolean;
  declare disabled: boolean;

  #internals = this.attachInternals?.();
  #id = this.id ? `${this.id}-field` : uid('input');

  template() {
    const cls = input({ size: this.size });
    const a = fieldAttrs({ id: this.#id, hasDescription: !!this.description, error: this.error, required: this.required, disabled: this.disabled });
    this.classList.add(...cls.root.split(" "));
    return html`
      <label class=${cls.label} id=${a.label.id} for=${a.label.for} ?hidden=${!this.label}>${this.label}</label>
      <input class=${cls.control} id=${a.control.id} type=${this.type} name=${this.name || null}
        placeholder=${this.placeholder || null} aria-describedby=${a.control['aria-describedby']} aria-invalid=${a.control['aria-invalid']}
        ?required=${this.required} ?disabled=${this.disabled} .value=${this.value} @input=${this.#onInput}>
      <p class=${cls.description} id=${a.description.id} ?hidden=${!this.description}>${this.description}</p>
      <p class=${cls.error} id=${a.error.id} role="alert" ?hidden=${!this.error}>${this.error}</p>`;
  }

  update() {
    this.#internals?.setFormValue?.(this.value);
  }

  /** The inner native input, for focus() and selection APIs. */
  get control() { return this.querySelector('input'); }
  focus(options?: FocusOptions) { this.control?.focus(options); }

  #onInput = (e: Event) => { this.value = (e.target as HTMLInputElement).value; };
}

define('ui-input', UIInput);

declare global {
  interface HTMLElementTagNameMap { 'ui-input': UIInput }
}
