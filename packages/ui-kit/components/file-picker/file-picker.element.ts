// <ui-file-picker>: choose local files for a form, with a button or by dropping them. It's form-
// associated through UIFormElement. The platform's picker opens from an input that's made for the
// moment and never joins the page, so the component holds no native form element.
import { UIFormElement } from '../../core/form-element.ts';
import { define } from '../../core/element.ts';
import { html } from '../../core/template.ts';
import '../button/button.element.ts';
import { signal } from '../../core/signals.ts';
import { fileSummary, matchesAccept } from '../../dom/file.ts';
import { applyRecipe, partOf } from '../classes.ts';
import { filePicker } from '../../styled-system/recipes/file-picker.js';

export class UIFilePicker extends UIFormElement {
  static properties = {
    ...UIFormElement.properties,
    label: { type: String, default: '' },
    description: { type: String, default: '' },
    accept: { type: String, default: '' },
    multiple: { type: Boolean, default: false },
  };
  declare label: string;
  declare description: string;
  declare accept: string;
  declare multiple: boolean;

  #files = signal<File[]>([]);
  #dragging = signal(false);
  get files() { return this.#files.value; }

  template() {
    const names = this.#files.value.map((f) => f.name);
    return html`<span data-part="label" ?hidden=${!this.label}>${this.label}</span>
      <div data-part="control" ?data-dragging=${this.#dragging.value} @dragover=${this.#over} @dragleave=${this.#leave} @drop=${this.#drop}>
        <ui-button ?disabled=${this.isDisabled} @click=${this.#open}>Choose ${this.multiple ? 'files' : 'file'}</ui-button>
        <span data-part="name">${fileSummary(names)}</span>
      </div>
      <span data-part="description" ?hidden=${!this.description}>${this.description}</span>`;
  }

  update() {
    const control = partOf(this, 'control');
    applyRecipe(this, filePicker(), (slot) => partOf(this, slot) ?? (control && partOf(control, slot)));
  }

  formValue() {
    const files = this.#files.value;
    if (!files.length) return null;
    const data = new FormData();
    for (const f of files) data.append(this.getAttribute('name') ?? 'file', f);
    return data;
  }
  isFilled() { return this.#files.value.length > 0; }
  resetValue() { this.#files.value = []; }

  /** Set the chosen files, as a pick or a drop does. Files the accept list rules out are dropped. */
  choose(files: File[]) {
    const fit = files.filter((f) => matchesAccept(f, this.accept));
    this.#files.value = this.multiple ? fit : fit.slice(0, 1);
    this.dispatchEvent(new CustomEvent('change', { bubbles: true, detail: { files: this.#files.value } }));
  }

  #open = () => {
    if (this.isDisabled) return;
    const picker = document.createElement('input');
    picker.type = 'file'; picker.accept = this.accept; picker.multiple = this.multiple;
    picker.addEventListener('change', () => this.choose([...(picker.files ?? [])]));
    picker.click();
  };
  #over = (e: DragEvent) => { e.preventDefault(); this.#dragging.value = true; };
  #leave = () => { this.#dragging.value = false; };
  #drop = (e: DragEvent) => {
    e.preventDefault();
    this.#dragging.value = false;
    if (!this.isDisabled) this.choose([...(e.dataTransfer?.files ?? [])]);
  };
}

define('ui-file-picker', UIFilePicker);

declare global {
  interface HTMLElementTagNameMap { 'ui-file-picker': UIFilePicker }
}
