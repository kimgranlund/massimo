// <ui-otp-field>: a one-time code entered in N single-character cells over one value (Base UI
// OTPField), with zero native form elements. The host is role=group and form-associated
// (UIFormElement); each cell is a contenteditable role=textbox ("Character i of n") holding one
// character; separators are role=separator. The value is contiguous: typing overwrites the focused
// cell and moves to the next, a paste distributes from the focused cell, Backspace clears the
// focused cell or the one before, arrows (mirrored in RTL), Home and End move; focus never lands
// past the first empty cell, and only one cell is a tab stop. validation-type filters characters
// (rejected ones fire valueinvalid); a complete value fires complete (and submits the form with
// auto-submit). input and change fire on every change with { value, reason, event }.
// SMS autofill: with autocomplete one-time-code (the default) the element asks the WebOTP API for
// the code once connected (Chromium on Android; iOS autofill needs a native input, which only the
// React renderer has) and fills it as typed (reason input-change; complete, auto-submit).
// Composition (optional): author [data-part=input] and [data-part=separator] children in any order
// (for a 3 + 3 code); the cells are then the authored ones and length is their count.
import { UIFormElement, define, settleDefault, type Problem } from '../../core/index.ts';
import { setClasses } from '../classes.ts';
import { otpField } from '../../styled-system/recipes/otp-field.js';
import { applyAttrs, eventDetails, otpCellAttrs, requestOtpCode, otpDelete, otpFocusable, otpInputMode, otpInsert, otpKey, type ChangeReason, type OtpValidation } from '../../dom/index.ts';

export class UIOtpField extends UIFormElement {
  static properties = {
    ...UIFormElement.properties,
    /** The code (Base UI value): at most length characters. */
    value: { type: String, default: '' },
    /** The value at first render and on form reset; without it, the value attribute (Base UI defaultValue). */
    defaultValue: { type: String, default: null },
    /** Number of cells (Base UI length; authored cells set it). */
    length: { type: Number, default: 6 },
    /** Accepted characters (Base UI validationType). */
    validationType: { type: String, default: 'numeric' },
    /** Hide the characters (Base UI mask). */
    mask: { type: Boolean, default: false },
    /** Submit the owning form once the code is complete (Base UI autoSubmit). */
    autoSubmit: { type: Boolean, default: false },
    /** The autocomplete hint on the first cell (Base UI autoComplete). */
    autocomplete: { type: String, default: 'one-time-code' },
    /** The virtual keyboard (Base UI inputMode); default from validation-type. */
    inputmode: { type: String, default: '' },
    /** The group's accessible name when no ui-field or aria-labelledby names it. */
    label: { type: String, default: '' },
    readonly: { type: Boolean, default: false, reflect: true },
  };
  declare value: string;
  declare defaultValue: string | null;
  declare length: number;
  declare validationType: OtpValidation;
  declare mask: boolean;
  declare autoSubmit: boolean;
  declare autocomplete: string;
  declare inputmode: string;
  declare label: string;
  declare readonly: boolean;
  /** Maps accepted text before it is applied (Base UI normalizeValue), e.g. to upper case. A property only. */
  declare normalizeValue?: (value: string) => string;

  /** Authored cells keep the markup's structure; otherwise the host generates length cells. */
  #authored = false;
  #focus = 0;

  connected() {
    settleDefault(this, '');
    this.#authored = !!this.querySelector(':scope > [data-part=input]');
    if (this.#authored) this.length = this.cells.length;
    this.addEventListener('beforeinput', this.#onBeforeInput as EventListener);
    this.addEventListener('input', this.#onInput, true);
    this.addEventListener('keydown', this.#onKeydown);
    this.addEventListener('focusin', this.#onFocusIn);
    this.#webOtp();
  }

  /** SMS autofill without a native input (WebOTP): fill the code it returns, as typed. */
  #otpAbort?: AbortController;
  #webOtp() {
    if (!/\bone-time-code\b/.test(this.autocomplete) || this.#otpAbort) return;
    const abort = (this.#otpAbort = new AbortController());
    void requestOtpCode(abort.signal).then((code) => {
      if (abort.signal.aborted || this.#otpAbort !== abort) return;
      this.#otpAbort = undefined;
      // From the first cell, so the code replaces whatever was there.
      if (code && this.#editable) this.#insert(0, code, 'input-change', undefined);
    });
  }

  disconnected() {
    this.#otpAbort?.abort();
    this.#otpAbort = undefined;
    this.removeEventListener('beforeinput', this.#onBeforeInput as EventListener);
    this.removeEventListener('input', this.#onInput, true);
    this.removeEventListener('keydown', this.#onKeydown);
    this.removeEventListener('focusin', this.#onFocusIn);
  }

  /** The cells, in order. */
  get cells() { return [...this.querySelectorAll<HTMLElement>(':scope > [data-part=input]')]; }

  update() {
    const n = Math.max(1, Math.floor(this.length) || 1);
    if (!this.#authored) {
      // Generated mode: exactly n cells (no separators).
      const have = this.cells;
      for (let i = have.length; i < n; i++) { const c = document.createElement('div'); c.setAttribute('data-part', 'input'); this.append(c); }
      for (const c of have.slice(n)) c.remove();
    }
    const cells = this.cells, value = [...this.value].slice(0, cells.length).join('');
    const disabled = this.isDisabled, readonly = this.readonly, editable = !disabled && !readonly;
    const focused = this.focused;
    // The tab stop is the first empty cell (the last when complete).
    const focusIndex = otpFocusable(value, cells.length, cells.length);
    const invalid = this.invalidShown;
    applyAttrs(this, {
      role: 'group',
      'aria-label': this.label || undefined,
      'aria-disabled': disabled ? 'true' : undefined,
      'data-complete': [...value].length >= cells.length || undefined,
    });
    cells.forEach((cell, i) => {
      applyAttrs(cell, {
        ...otpCellAttrs({ index: i, length: cells.length, value, focusIndex, disabled, readonly, focused }),
        role: 'textbox',
        contenteditable: editable ? 'plaintext-only' : 'false',
        'aria-multiline': 'false',
        'aria-invalid': invalid ? 'true' : undefined,
        'aria-required': this.required && i === 0 ? 'true' : undefined,
        inputmode: this.inputmode || otpInputMode(this.validationType),
        autocomplete: i === 0 ? this.autocomplete || undefined : 'off',
        autocapitalize: 'off', autocorrect: 'off', spellcheck: 'false',
        'data-secret': this.mask || undefined,
      });
      const ch = [...value][i] ?? '';
      if (cell.textContent !== ch) cell.textContent = ch;
    });
    for (const s of this.querySelectorAll<HTMLElement>(':scope > [data-part=separator]')) applyAttrs(s, { role: 'separator', 'aria-orientation': 'horizontal', 'data-orientation': 'horizontal' });
    const cls = otpField();
    setClasses(this, cls.root);
    for (const c of cells) setClasses(c, cls.input);
    for (const s of this.querySelectorAll(':scope > [data-part=separator]')) setClasses(s, cls.separator);
  }

  // ── UIFormElement hooks ──
  formValue() { return this.value; }
  isReadonly() { return this.readonly; }
  validationAnchor() { return this.cells[0]; }
  resetValue() { this.value = this.defaultValue ?? ''; this.#focus = 0; }
  restoreValue(state: unknown) { if (typeof state === 'string') this.value = state; }
  validate(): Problem | null {
    const len = [...this.value].length;
    if (!len) return this.required ? { flags: { valueMissing: true }, message: 'Enter the code.' } : null;
    if (len < this.length) return { flags: { tooShort: true }, message: `Enter all ${this.length} characters.` };
    return null;
  }
  focus(options?: FocusOptions) { this.cells[otpFocusable(this.value, this.#focus, this.cells.length)]?.focus(options); }

  #index(t: EventTarget | null) { return this.cells.indexOf(t as HTMLElement); }
  #moveTo(i: number) {
    this.#focus = i;
    const cell = this.cells[otpFocusable(this.value, i, this.cells.length)];
    if (cell && document.activeElement !== cell) cell.focus();
  }

  #set(next: string, reason: ChangeReason, event: Event | undefined, opts: { attempted?: string; invalid?: boolean; paste?: boolean } = {}) {
    if (opts.invalid) this.dispatchEvent(new CustomEvent('valueinvalid', { bubbles: true, detail: { value: opts.attempted ?? '', ...eventDetails(reason, event) } }));
    const changed = next !== this.value;
    if (changed) {
      this.value = next;
      const detail = () => ({ value: next, ...eventDetails(reason, event) });
      this.dispatchEvent(new CustomEvent('input', { bubbles: true, detail: detail() }));
      this.dispatchEvent(new CustomEvent('change', { bubbles: true, detail: detail() }));
    }
    const complete = [...next].length >= this.cells.length;
    if (complete && (changed || opts.paste) && (reason === 'input-change' || reason === 'input-paste')) {
      this.dispatchEvent(new CustomEvent('complete', { bubbles: true, detail: { value: next, ...eventDetails(reason, event) } }));
      if (this.autoSubmit && !this.isDisabled) this.form?.requestSubmit();
    }
  }

  #insert(i: number, text: string, reason: ChangeReason, event: Event | undefined) {
    const r = otpInsert(this.value, i, text, this.cells.length, this.validationType, this.normalizeValue);
    this.#set(r.value, reason, event, { attempted: text, invalid: r.invalid, paste: reason === 'input-paste' });
    this.#moveTo(r.accepted ? r.focus : i);
  }

  get #editable() { return !this.isDisabled && !this.readonly; }

  #onBeforeInput = (e: InputEvent) => {
    const i = this.#index(e.target);
    if (i < 0) return;
    if (e.inputType === 'insertParagraph' || e.inputType === 'insertLineBreak') { e.preventDefault(); if (!this.isDisabled) this.form?.requestSubmit(); return; }
    if (!this.#editable) { e.preventDefault(); return; }
    if (e.inputType === 'insertCompositionText') return; // IME: settled in the input event
    e.preventDefault();
    if (e.inputType.startsWith('insert')) {
      const paste = e.inputType === 'insertFromPaste' || e.inputType === 'insertFromDrop';
      const text = e.dataTransfer?.getData('text/plain') ?? e.data ?? '';
      if (text) this.#insert(i, text, paste ? 'input-paste' : 'input-change', e);
    } else if (e.inputType.startsWith('delete')) {
      const r = otpDelete(this.value, i, !e.inputType.includes('Forward'));
      this.#set(r.value, 'input-clear', e);
      this.#moveTo(r.focus);
    }
  };

  // An edit beforeinput did not cancel (IME composition, autofill): read the cell back.
  #onInput = (e: Event) => {
    const i = this.#index(e.target);
    if (i < 0) return;
    e.stopPropagation();
    const cell = this.cells[i], text = cell.textContent ?? '', prev = [...this.value][i] ?? '';
    cell.textContent = prev; // the value owns the text
    if (!text) { const r = otpDelete(this.value, i, false); this.#set(r.value, 'input-clear', e); return; }
    const added = prev && text.startsWith(prev) ? text.slice(prev.length) : prev && text.endsWith(prev) ? text.slice(0, -prev.length) : text;
    if (added) this.#insert(i, added, 'input-change', e);
  };

  #onKeydown = (e: KeyboardEvent) => {
    const i = this.#index(e.target);
    if (i < 0 || e.ctrlKey || e.metaKey || e.altKey) return;
    const k = otpKey(e.key, getComputedStyle(this).direction === 'rtl');
    if (!k) return;
    if ('delete' in k) {
      if (!this.#editable) return;
      e.preventDefault();
      const r = otpDelete(this.value, i, k.delete === 'backward');
      this.#set(r.value, k.delete === 'backward' ? 'input-clear' : 'keyboard', e);
      this.#moveTo(r.focus);
      return;
    }
    e.preventDefault();
    const last = this.cells.length - 1;
    this.#moveTo('move' in k ? Math.max(0, Math.min(last, i + k.move)) : k.to === 'first' ? 0 : last);
  };

  #onFocusIn = (e: FocusEvent) => {
    const i = this.#index(e.target);
    if (i < 0) return;
    const allowed = otpFocusable(this.value, i, this.cells.length);
    this.#focus = allowed;
    if (allowed !== i) { this.cells[allowed]?.focus(); return; }
    // The caret after the character, so typing replaces it.
    const sel = window.getSelection?.();
    if (sel && this.cells[i].firstChild) { sel.selectAllChildren(this.cells[i]); }
  };
}

define('ui-otp-field', UIOtpField);

declare global {
  interface HTMLElementTagNameMap { 'ui-otp-field': UIOtpField }
}
