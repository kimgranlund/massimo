// <ui-input>: single-line text field with zero native form elements.
// The control is a contenteditable role="textbox"; the label is a span wired by
// aria-labelledby; the host is form-associated through UIFormElement.
// The control follows the construction pattern (components/slots.ts):
//   [leading] [prefix] [contents = editor] [suffix] [trailing]
// Author adornments as children with slot="leading" | "prefix" | "suffix" | "trailing".
import { UIFormElement, define, html, type Problem } from '../../core/index.ts';
import { adoptAdornments, ADORNMENT_PARTS } from '../slots.ts';
import { applyAttrs, fieldAttrs, onTextBeforeInput, textEntryAttrs, toSingleLine, uid, type TextType } from '../../dom/index.ts';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class UIInput extends UIFormElement {
  static properties = {
    ...UIFormElement.properties,
    label: { type: String, default: '' },
    value: { type: String, default: '' },
    type: { type: String, default: 'text' },
    placeholder: { type: String, default: '' },
    description: { type: String, default: '' },
    /** Author-supplied error. Shown immediately; built-in validation waits for interaction. */
    error: { type: String, default: '' },
    readonly: { type: Boolean, default: false, reflect: true },
    minlength: { type: Number, default: null },
    pattern: { type: String, default: '' },
  };
  declare label: string;
  declare value: string;
  declare type: TextType;
  declare placeholder: string;
  declare description: string;
  declare error: string;
  declare readonly: boolean;
  declare minlength: number | null;
  declare pattern: string;

  #id = '';
  #default = '';
  #adornments: Element[] = [];

  connected() {
    this.#id = this.id ? `${this.id}-field` : uid('input');
    // Like a native input, the `value` attribute is the default value used on form reset.
    this.#default = this.getAttribute('value') ?? '';
    // Authored adornments (or ones already placed on a previous connect) join the control.
    this.#adornments = [...this.querySelectorAll(ADORNMENT_PARTS.map((p) => `:scope > [slot=${p}], :scope > [data-part=control] > [data-part=${p}] > [slot]`).join(', '))];
  }

  template() {
    const message = this.#message();
    return html`
      <span data-part="label" ?hidden=${!this.label} @click=${this.#focusEditor}>${this.label}</span>
      <div data-part="control" @click=${this.#onControlClick}>
        <span data-part="leading" hidden></span><span data-part="prefix" hidden></span>
        <div data-part="contents" @beforeinput=${this.#onBeforeInput} @input=${this.#onInput}
          @blur=${this.#onBlur} @copy=${this.#guardSecret} @cut=${this.#guardSecret}></div>
        <span data-part="suffix" hidden></span><span data-part="trailing" hidden></span>
      </div>
      <span data-part="description" ?hidden=${!this.description}>${this.description}</span>
      <span data-part="error" ?hidden=${!message}>${message}</span>`;
  }

  update() {
    const [label, control, description, error] = this.children as unknown as HTMLElement[];
    if (this.#adornments.length) { adoptAdornments(control, this.#adornments); this.#adornments = []; }
    const editor = this.editor!;
    const a = fieldAttrs({
      id: this.#id, hasLabel: !!this.label, hasDescription: !!this.description, error: this.#message() || undefined,
      required: this.required, disabled: this.isDisabled, readonly: this.readonly,
    });
    applyAttrs(label, a.label);
    applyAttrs(description, a.description);
    applyAttrs(error, a.error);
    applyAttrs(editor, { ...a.control, ...textEntryAttrs({ type: this.type, placeholder: this.placeholder, editable: !this.isDisabled && !this.readonly }) });
    // Only write text when it differs, so typing never moves the caret.
    if (editor.textContent !== this.value) editor.textContent = this.value;
  }

  // ── UIFormElement hooks ──
  formValue() { return this.value; }
  validationAnchor() { return this.editor ?? undefined; }
  resetValue() { this.value = this.#default; }
  restoreValue(state: unknown) { if (typeof state === 'string') this.value = state; }
  validate(): Problem | null {
    const v = this.value;
    if (this.required && !v) return { flags: { valueMissing: true }, message: 'Fill in this field.' };
    if (!v) return null;
    if (this.type === 'email' && !EMAIL.test(v)) return { flags: { typeMismatch: true }, message: 'Enter an email address.' };
    if (this.minlength != null && v.length < this.minlength) return { flags: { tooShort: true }, message: `Use at least ${this.minlength} characters.` };
    if (this.pattern && !new RegExp(`^(?:${this.pattern})$`, 'v').test(v)) return { flags: { patternMismatch: true }, message: 'Match the requested format.' };
    return null;
  }

  /** The editable element, for selection APIs. */
  get editor() { return (this.querySelector(':scope > [data-part=control] > [data-part=contents]') ?? undefined) as HTMLElement | undefined; }
  focus(options?: FocusOptions) { this.editor?.focus(options); }

  #message() { return this.error || (this.userInvalid ? this.problem!.message : ''); }

  #focusEditor = () => { if (!this.isDisabled) this.focus(); };
  // The control's padding and adornments belong to the field: a press there focuses the text.
  #onControlClick = (e: Event) => { if (e.target !== this.editor && !this.editor?.contains(e.target as Node)) this.#focusEditor(); };

  #onBeforeInput = (e: InputEvent) => {
    if (onTextBeforeInput(e) === 'submit' && !this.isDisabled) this.form?.requestSubmit();
  };

  #onInput = (e: Event) => {
    const ed = e.currentTarget as HTMLElement;
    const text = toSingleLine(ed.textContent ?? '');
    if (!text) ed.replaceChildren(); // keep :empty so the placeholder shows
    this.value = text;
  };

  #onBlur = () => this.markTouched();

  // Never let a password leave through the clipboard.
  #guardSecret = (e: ClipboardEvent) => { if (this.type === 'password') e.preventDefault(); };
}

define('ui-input', UIInput);

declare global {
  interface HTMLElementTagNameMap { 'ui-input': UIInput }
}
