// <ui-input>: single-line text field with zero native form elements.
// The control is a contenteditable role="textbox"; the label is a span wired by
// aria-labelledby; the host is form-associated through UIFormElement.
// The control follows the construction pattern (components/slots.ts):
//   [leading] [prefix] [contents = editor] [suffix] [trailing]
// Author adornments as children with slot="leading" | "prefix" | "suffix" | "trailing".
// Composition (optional): the parts may be authored as [data-part] children (label, control ›
// leading · prefix · contents · suffix · trailing, description, error); each is adopted onto the
// generated part (slots.ts adoptPart), absent ones are generated.
import { UIFormElement, define, html, settleDefault, submitOwner, type Problem } from '../../core/index.ts';
import { adoptAdornments, adoptPart, authoredParts, partText, ADORNMENT_PARTS } from '../slots.ts';
import { applyRecipe, partOf } from '../classes.ts';
import { input } from '../../styled-system/recipes/input.js';
import { applyAttrs, eventDetails, fieldAttrs, onTextBeforeInput, textEntryAttrs, toSingleLine, uid, withExternalRefs, type TextType } from '../../dom/index.ts';

/** The parts an author may write (composition), by path. */
const AUTHORED = ['label', 'control', ...ADORNMENT_PARTS.map((p) => `control > ${p}`), 'control > contents', 'description', 'error'];

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export class UIInput extends UIFormElement {
  static properties = {
    ...UIFormElement.properties,
    label: { type: String, default: '' },
    value: { type: String, default: '' },
    /** The value at first render and on form reset; without it, the value attribute, like a native input's (Base UI defaultValue). */
    defaultValue: { type: String, default: null },
    type: { type: String, default: 'text' },
    placeholder: { type: String, default: '' },
    description: { type: String, default: '' },
    /** Author-supplied error. Shown immediately; built-in validation waits for interaction. */
    error: { type: String, default: '' },
    readonly: { type: Boolean, default: false, reflect: true },
    minlength: { type: Number, default: null },
    pattern: { type: String, default: '' },
    /** Ids that name the editor when it has no label (ui-field sets it). */
    labelledby: { type: String, default: '' },
    /** Ids that describe the editor, after its own description and error (ui-field sets it). */
    describedby: { type: String, default: '' },
  };
  declare label: string;
  declare value: string;
  declare defaultValue: string | null;
  declare type: TextType;
  declare placeholder: string;
  declare description: string;
  declare error: string;
  declare readonly: boolean;
  declare minlength: number | null;
  declare pattern: string;
  declare labelledby: string;
  declare describedby: string;

  #id = '';
  #adornments: Element[] = [];
  /** Authored parts waiting to be adopted by the next render; seeded marks the first connect. */
  #authored = new Map<string, Element>();
  #seeded = false;
  /** The value when the editor gained focus: change fires on blur when it differs, like a native input. */
  #focusValue = '';

  connected() {
    this.#id = this.id ? `${this.id}-field` : uid('input');
    // Like a native input, the `value` attribute is the default value used on form reset.
    settleDefault(this, '');
    // Authored adornments (or ones already placed on a previous connect) join the control.
    this.#adornments = [...this.querySelectorAll(ADORNMENT_PARTS.map((p) => `:scope > [slot=${p}], :scope > [data-part=control] > [slot=${p}], :scope > [data-part=control] > [data-part=${p}] > [slot]`).join(', '))];
    this.#authored = authoredParts(this, AUTHORED);
    // Authored text seeds the properties it stands for, once (a reconnect finds the generated parts).
    if (!this.#seeded) {
      this.#seeded = true;
      const text = (p: string) => partText(this.#authored.get(p));
      if (!this.label && text('label')) this.label = text('label');
      if (!this.description && text('description')) this.description = text('description');
      if (!this.error && text('error')) this.error = text('error');
    }
  }

  template() {
    const message = this.#message();
    return html`
      <span data-part="label" ?hidden=${!this.label} @click=${this.#focusEditor}>${this.label}</span>
      <div data-part="control" @click=${this.#onControlClick}>
        <span data-part="leading" hidden></span><span data-part="prefix" hidden></span>
        <div data-part="contents" @beforeinput=${this.#onBeforeInput} @input=${this.#onInput}
          @focus=${this.#onFocus} @blur=${this.#onBlur} @copy=${this.#guardSecret} @cut=${this.#guardSecret}></div>
        <span data-part="suffix" hidden></span><span data-part="trailing" hidden></span>
      </div>
      <span data-part="description" ?hidden=${!this.description}>${this.description}</span>
      <span data-part="error" ?hidden=${!message}>${message}</span>`;
  }

  update() {
    const [label, control, description, error] = this.children as unknown as HTMLElement[];
    if (this.#authored.size) {
      const a = this.#authored;
      adoptPart(a.get('label'), label);
      adoptPart(a.get('control'), control);
      for (const p of ADORNMENT_PARTS) adoptPart(a.get(`control > ${p}`), partOf(control, p), 'append');
      adoptPart(a.get('control > contents'), partOf(control, 'contents'));
      adoptPart(a.get('description'), description);
      adoptPart(a.get('error'), error);
      adoptAdornments(control, []);
      a.clear();
    }
    if (this.#adornments.length) { adoptAdornments(control, this.#adornments); this.#adornments = []; }
    const editor = this.editor!;
    const a = fieldAttrs({
      id: this.#id, hasLabel: !!this.label, hasDescription: !!this.description, error: this.#message() || undefined,
      required: this.required, disabled: this.isDisabled, readonly: this.readonly,
    });
    applyAttrs(label, a.label);
    applyAttrs(description, a.description);
    applyAttrs(error, a.error);
    applyAttrs(editor, { ...withExternalRefs(a.control, this), ...textEntryAttrs({ type: this.type, placeholder: this.placeholder, editable: !this.isDisabled && !this.readonly }) });
    // Only write text when it differs, so typing never moves the caret.
    if (editor.textContent !== this.value) editor.textContent = this.value;
    applyRecipe(this, input(), (slot) => partOf(this, slot) ?? partOf(control, slot));
  }

  // ── UIFormElement hooks ──
  formValue() { return this.value; }
  authorError() { return this.error; }
  isReadonly() { return this.readonly; }
  validationAnchor() { return this.editor ?? undefined; }
  resetValue() { this.value = this.defaultValue ?? ''; }
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
    if (onTextBeforeInput(e) === 'submit' && !this.isDisabled) submitOwner(this)?.requestSubmit();
  };

  #onInput = (e: Event) => {
    const ed = e.currentTarget as HTMLElement;
    const text = toSingleLine(ed.textContent ?? '');
    if (!text) ed.replaceChildren(); // keep :empty so the placeholder shows
    this.value = text;
    // The editor's native input event stops here; the host fires one with Base UI's details
    // (onValueChange: reason 'none'; the native event is detail.event).
    e.stopPropagation();
    this.dispatchEvent(new CustomEvent('input', { bubbles: true, detail: { value: text, ...eventDetails('none', e) } }));
  };

  #onFocus = () => { this.#focusValue = this.value; };

  #onBlur = (e: Event) => {
    this.markTouched();
    if (this.value !== this.#focusValue) this.dispatchEvent(new CustomEvent('change', { bubbles: true, detail: { value: this.value, ...eventDetails('none', e) } }));
  };

  // Never let a password leave through the clipboard.
  #guardSecret = (e: ClipboardEvent) => { if (this.type === 'password') e.preventDefault(); };
}

define('ui-input', UIInput);

declare global {
  interface HTMLElementTagNameMap { 'ui-input': UIInput }
}
