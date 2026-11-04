// <ui-number-field>: a number input with steppers, a scrub area and locale formatting (Base UI
// NumberField), with zero native form elements. The input is a contenteditable role="textbox"
// (aria-roledescription "Number field"), the steppers are role=button spans outside the tab order,
// the label sits in the scrub area; the host is form-associated through UIFormElement.
// Anatomy (Base UI part names; the construction pattern's places around the input):
//   [scrub-area › label] [group › decrement · prefix · input · suffix · increment] [description] [error]
// Values are numbers (null when empty); the text shows formatNumber of the value (format, locale)
// and is parsed back in the locale (dom/number.ts). Typing changes the value as soon as the text
// parses; blur (or Enter) commits: clamps to min / max (unless allow-out-of-range), snaps with
// snap-on-step and reformats. Arrow Up / Down step (Shift: large-step, Alt: small-step), Home / End
// go to min / max, the steppers step on press and repeat while held, the scrub area steps per
// pixel-sensitivity px dragged, the wheel steps with allow-wheel-scrub while focused.
// Events: `input` on every value change and `change` on every commit, both with Base UI's details
// { value, reason, event } (onValueChange / onValueCommitted).
// Composition (optional): the parts may be authored as [data-part] children; each is adopted onto
// the generated part (slots.ts adoptPart), the label, description and error text seed properties.
import { UIFormElement, settleDefault, type Problem } from '../../core/form-element.ts';
import { define } from '../../core/element.ts';
import { html } from '../../core/template.ts';
import { adoptAdornments, adoptPart, authoredParts, partText } from '../slots.ts';
import { applyRecipe, partOf } from '../classes.ts';
import { numberField } from '../../styled-system/recipes/number-field.js';
import type { FormatNumberOptions } from '../../tokens/typography/format.ts';
import { applyAttrs, uid } from '../../dom/attrs.ts';
import { clampNumber, formatNumberValue, holdStepper, isNumberChar, numberInputMode, numberKey, parseNumber, sanitizeNumberText, snapNumber, startScrub, stepAmount, stepNumber, stepperAttrs, stepperDisabled } from '../../dom/number.ts';
import { eventDetails, type ChangeReason } from '../../dom/events.ts';
import { fieldAttrs, withExternalRefs } from '../../dom/field.ts';
import { hideTopLayer, showTopLayer } from '../../dom/floating.ts';

const ADORN = ['prefix', 'suffix'] as const;
const AUTHORED = ['scrub-area', 'scrub-area > label', 'scrub-area > scrub-area-cursor', 'group', 'group > decrement', 'group > prefix', 'group > input', 'group > suffix', 'group > increment', 'description', 'error'];

export class UINumberField extends UIFormElement {
  static properties = {
    ...UIFormElement.properties,
    label: { type: String, default: '' },
    /** The number, or null when the field is empty (Base UI value). */
    value: { type: Number, default: null },
    /** The value at first render and on form reset; without it, the value attribute (Base UI defaultValue). */
    defaultValue: { type: Number, default: null },
    min: { type: Number, default: null },
    max: { type: Number, default: null },
    step: { type: Number, default: 1 },
    smallStep: { type: Number, default: 0.1 },
    largeStep: { type: Number, default: 10 },
    snapOnStep: { type: Boolean, default: false },
    allowOutOfRange: { type: Boolean, default: false },
    allowWheelScrub: { type: Boolean, default: false },
    /** The scrub area's axis (Base UI ScrubArea direction). */
    scrubDirection: { type: String, default: 'horizontal' },
    /** Pixels dragged per step on the scrub area (Base UI pixelSensitivity). */
    pixelSensitivity: { type: Number, default: 2 },
    /** Intl.NumberFormat options for the text: an object, or JSON in the attribute (Base UI format). */
    format: { default: null },
    locale: { type: String, default: '' },
    placeholder: { type: String, default: '' },
    description: { type: String, default: '' },
    /** Author-supplied error. Shown immediately; built-in validation waits for interaction. */
    error: { type: String, default: '' },
    readonly: { type: Boolean, default: false, reflect: true },
    /** Ids that name the input when it has no label (ui-field sets it). */
    labelledby: { type: String, default: '' },
    /** Ids that describe the input, after its own description and error (ui-field sets it). */
    describedby: { type: String, default: '' },
  };
  declare label: string;
  declare value: number | null;
  declare defaultValue: number | null;
  declare min: number | null;
  declare max: number | null;
  declare step: number;
  declare smallStep: number;
  declare largeStep: number;
  declare snapOnStep: boolean;
  declare allowOutOfRange: boolean;
  declare allowWheelScrub: boolean;
  declare scrubDirection: 'horizontal' | 'vertical';
  declare pixelSensitivity: number;
  declare format: FormatNumberOptions | string | null;
  declare locale: string;
  declare placeholder: string;
  declare description: string;
  declare error: string;
  declare readonly: boolean;
  declare labelledby: string;
  declare describedby: string;

  #id = '';
  #adornments: Element[] = [];
  #authored = new Map<string, Element>();
  #seeded = false;
  /** The text is the user's (typing): renders leave it alone until the commit. */
  #typing = false;
  /** The next input event came from a paste. */
  #pasting = false;
  /** The value when the input gained focus, or a press or scrub began: change fires when the commit differs. */
  #committed: number | null = null;
  #hovered = false;

  connected() {
    this.#id = this.id ? `${this.id}-input` : uid('number-field');
    settleDefault(this, null);
    this.#adornments = [...this.querySelectorAll(ADORN.map((p) => `:scope > [slot=${p}], :scope > [data-part=group] > [slot=${p}], :scope > [data-part=group] > [data-part=${p}] > [slot]`).join(', '))];
    this.#authored = authoredParts(this, AUTHORED);
    if (!this.#seeded) {
      this.#seeded = true;
      const text = (p: string) => partText(this.#authored.get(p));
      if (!this.label && text('scrub-area > label')) this.label = text('scrub-area > label');
      if (!this.description && text('description')) this.description = text('description');
      if (!this.error && text('error')) this.error = text('error');
    }
  }

  template() {
    const message = this.#message();
    return html`
      <span data-part="scrub-area" ?hidden=${!this.label} @pointerdown=${this.#onScrubDown}><span data-part="label" @click=${this.#focusInput}>${this.label}</span><span data-part="scrub-area-cursor" popover="manual" aria-hidden="true"><i name="arrows-horizontal"></i></span></span>
      <div data-part="group" @click=${this.#onGroupClick} @wheel=${this.#onWheel} @pointerenter=${this.#onEnter} @pointerleave=${this.#onLeave}>
        <span data-part="decrement" role="button" @pointerdown=${this.#onDecrementDown} @click=${this.#onDecrementClick}><i name="minus"></i></span>
        <span data-part="prefix" hidden></span>
        <div data-part="input" data-numeric @beforeinput=${this.#onBeforeInput} @input=${this.#onInput} @keydown=${this.#onKeydown}
          @focus=${this.#onFocus} @blur=${this.#onBlur}></div>
        <span data-part="suffix" hidden></span>
        <span data-part="increment" role="button" @pointerdown=${this.#onIncrementDown} @click=${this.#onIncrementClick}><i name="plus"></i></span>
      </div>
      <span data-part="description" ?hidden=${!this.description}>${this.description}</span>
      <span data-part="error" ?hidden=${!message}>${message}</span>`;
  }

  update() {
    const [scrub, group, description, error] = this.children as unknown as HTMLElement[];
    const label = scrub.firstElementChild as HTMLElement;
    const g = (p: string) => partOf(group, p) as HTMLElement;
    if (this.#authored.size) {
      const a = this.#authored;
      adoptPart(a.get('scrub-area'), scrub);
      adoptPart(a.get('scrub-area > label'), label);
      if (a.has('scrub-area > scrub-area-cursor')) { this.#ownCursor = true; adoptPart(a.get('scrub-area > scrub-area-cursor'), partOf(scrub, 'scrub-area-cursor'), 'replace'); }
      adoptPart(a.get('group'), group);
      for (const p of ['decrement', 'increment'] as const) adoptPart(a.get(`group > ${p}`), g(p), 'replace');
      for (const p of ADORN) adoptPart(a.get(`group > ${p}`), g(p), 'append');
      adoptPart(a.get('group > input'), g('input'));
      adoptPart(a.get('description'), description);
      adoptPart(a.get('error'), error);
      adoptAdornments(group, [], ADORN);
      a.clear();
    }
    if (this.#adornments.length) { adoptAdornments(group, this.#adornments, ADORN); this.#adornments = []; }
    const input = g('input');
    const disabled = this.isDisabled, readonly = this.readonly;
    const a = fieldAttrs({ id: this.#id, hasLabel: !!this.label, hasDescription: !!this.description, error: this.#message() || undefined, required: this.required, disabled, readonly });
    applyAttrs(label, a.label);
    applyAttrs(description, a.description);
    applyAttrs(error, a.error);
    const editable = !disabled && !readonly;
    applyAttrs(input, {
      ...withExternalRefs(a.control, this),
      'aria-roledescription': 'Number field',
      contenteditable: editable ? 'plaintext-only' : 'false',
      'aria-multiline': 'false',
      'aria-placeholder': this.placeholder || undefined,
      'data-placeholder': this.placeholder || undefined,
      inputmode: numberInputMode(this.min, this.step),
      spellcheck: 'false', autocapitalize: 'off', autocorrect: 'off',
    });
    const value = this.value;
    const s = { disabled, readonly, value, min: this.min, max: this.max };
    for (const [p, dir] of [['decrement', -1], ['increment', 1]] as const) {
      const off = stepperDisabled(dir, s);
      applyAttrs(g(p), { ...stepperAttrs(dir, this.#id, off), 'aria-disabled': off ? 'true' : undefined });
    }
    applyAttrs(scrub, { 'data-direction': this.scrubDirection === 'vertical' ? 'vertical' : undefined });
    const cursorIcon = partOf(scrub, 'scrub-area-cursor')?.querySelector(':scope > i');
    if (!this.#ownCursor && cursorIcon) cursorIcon.setAttribute('name', this.scrubDirection === 'vertical' ? 'arrows-vertical' : 'arrows-horizontal');
    // Only write text when it is not the user's, so typing never moves the caret.
    const text = this.#display(value);
    if (!this.#typing && input.textContent !== text) input.textContent = text;
    applyRecipe(this, numberField(), (slot) => partOf(this, slot) ?? partOf(group, slot) ?? partOf(scrub, slot));
  }

  // ── UIFormElement hooks ──
  formValue() { return this.value == null || !Number.isFinite(this.value) ? '' : String(this.value); }
  authorError() { return this.error; }
  isReadonly() { return this.readonly; }
  isFilled() { return this.value != null && Number.isFinite(this.value); }
  validationAnchor() { return this.input ?? undefined; }
  resetValue() { this.#typing = false; this.value = this.defaultValue ?? null; }
  restoreValue(state: unknown) { if (typeof state === 'string') this.value = state === '' ? null : +state; }
  validate(): Problem | null {
    const v = this.value;
    if (v == null || !Number.isFinite(v)) return this.required ? { flags: { valueMissing: true }, message: 'Fill in this field.' } : null;
    if (this.min != null && v < this.min) return { flags: { rangeUnderflow: true }, message: `Use a value of at least ${this.#display(this.min)}.` };
    if (this.max != null && v > this.max) return { flags: { rangeOverflow: true }, message: `Use a value of at most ${this.#display(this.max)}.` };
    return null;
  }

  /** The editable element, for selection APIs. */
  get input() { return (this.querySelector(':scope > [data-part=group] > [data-part=input]') ?? undefined) as HTMLElement | undefined; }
  focus(options?: FocusOptions) { this.input?.focus(options); }

  /** Step the value as a press on a stepper does (Base UI increment / decrement): amount defaults to step. */
  stepBy(dir: 1 | -1, amount = this.step) { this.#step(dir, amount, dir > 0 ? 'increment-press' : 'decrement-press', undefined, true); }

  #options() {
    const f = this.format;
    let format: FormatNumberOptions | null = null;
    if (f && typeof f === 'string') { try { format = JSON.parse(f); } catch { format = null; } } else if (f) format = f as FormatNumberOptions;
    return { locale: this.locale || undefined, format, step: this.step };
  }
  #display(v: number | null) { return formatNumberValue(v, this.#options()); }
  #message() { return this.error || (this.userInvalid ? this.problem!.message : ''); }
  get #inactive() { return this.isDisabled || this.readonly; }

  /** Set the value and fire input (onValueChange); commit fires change (onValueCommitted) when it differs from the last commit. */
  #set(next: number | null, reason: ChangeReason, event: Event | undefined, commit: boolean) {
    if (!Object.is(next, this.value)) {
      this.value = next;
      this.dispatchEvent(new CustomEvent('input', { bubbles: true, detail: { value: next, ...eventDetails(reason, event) } }));
    }
    if (commit) this.#commit(reason, event);
  }
  #commit(reason: ChangeReason, event: Event | undefined) {
    if (Object.is(this.value, this.#committed)) return;
    this.#committed = this.value;
    this.dispatchEvent(new CustomEvent('change', { bubbles: true, detail: { value: this.value, ...eventDetails(reason, event) } }));
  }

  /** The value the text stands for now (typing may be ahead of a render). */
  #current() {
    if (!this.#typing) return this.value;
    const p = parseNumber(this.input?.textContent ?? '', this.#options());
    return p == null || Number.isNaN(p) ? this.value : p;
  }
  #step(dir: 1 | -1, amount: number, reason: ChangeReason, event: Event | undefined, commit: boolean) {
    if (this.#inactive) return false;
    const from = this.#current();
    const next = stepNumber(from, dir, amount, { min: this.min, max: this.max, snapOnStep: this.snapOnStep });
    this.#typing = false;
    this.#set(next, reason, event, commit);
    const input = this.input, text = this.#display(next);
    if (input && input.textContent !== text) input.textContent = text;
    return !Object.is(next, from);
  }

  #focusInput = () => { if (!this.isDisabled) this.focus(); };
  #onGroupClick = (e: Event) => {
    const t = e.target as Element;
    if (t.closest('[data-part=decrement], [data-part=increment]') || this.input?.contains(t)) return;
    this.#focusInput();
  };

  // ── Steppers: a press steps, holding repeats; the commit is on release ──
  #press(dir: 1 | -1, e: PointerEvent) {
    if (e.button !== 0 || this.#inactive) return;
    e.preventDefault(); // keep focus where it is (the input, when it had it)
    const reason: ChangeReason = dir > 0 ? 'increment-press' : 'decrement-press';
    this.#committed = this.value;
    this.#pressed = true;
    holdStepper(() => this.#step(dir, stepAmount(e, this), reason, e, false), (ev) => { this.#commit(reason, ev); });
  }
  #pressed = false;
  #click(dir: 1 | -1, e: MouseEvent) {
    // A click with no pointer press before it (assistive technology, element.click()) steps once.
    if (this.#pressed) { this.#pressed = false; return; }
    this.#committed = this.value;
    this.#step(dir, stepAmount(e, this), dir > 0 ? 'increment-press' : 'decrement-press', e, true);
  }
  #onDecrementDown = (e: PointerEvent) => this.#press(-1, e);
  #onIncrementDown = (e: PointerEvent) => this.#press(1, e);
  #onDecrementClick = (e: MouseEvent) => this.#click(-1, e);
  #onIncrementClick = (e: MouseEvent) => this.#click(1, e);

  /** An authored ScrubAreaCursor keeps its own content. */
  #ownCursor = false;

  // ── Scrub area: drag the label ──
  #onScrubDown = (e: PointerEvent) => {
    if (e.button !== 0 || this.#inactive) return;
    e.preventDefault(); // no text selection while dragging
    this.#committed = this.value;
    const scrub = this.querySelector<HTMLElement>(':scope > [data-part=scrub-area]')!, cursor = partOf(scrub, 'scrub-area-cursor') as HTMLElement | null;
    startScrub(e, {
      direction: this.scrubDirection, pixelSensitivity: this.pixelSensitivity, lock: scrub,
      // Pointer lock hides the real cursor: the cursor part stands in for it in the top layer.
      onCursor: (pt) => {
        if (!cursor) return;
        if (!pt) { hideTopLayer(cursor); return; }
        cursor.style.setProperty('--ui-scrub-x', `${pt.x}px`);
        cursor.style.setProperty('--ui-scrub-y', `${pt.y}px`);
        showTopLayer(cursor);
      },
      onStart: () => { this.toggleAttribute('data-scrubbing', true); (this.querySelector(':scope > [data-part=scrub-area]') as HTMLElement)?.toggleAttribute('data-scrubbing', true); },
      onStep: (dir, ev) => { this.#step(dir, stepAmount(ev, this), 'scrub', ev, false); },
      onEnd: (scrubbed, ev) => {
        this.removeAttribute('data-scrubbing');
        this.querySelector(':scope > [data-part=scrub-area]')?.removeAttribute('data-scrubbing');
        if (scrubbed) this.#commit('scrub', ev);
      },
    });
  };

  // ── Wheel: with allow-wheel-scrub, while focused and hovered ──
  #onEnter = () => { this.#hovered = true; };
  #onLeave = () => { this.#hovered = false; };
  #onWheel = (e: WheelEvent) => {
    if (!this.allowWheelScrub || !this.#hovered || document.activeElement !== this.input || this.#inactive || !e.deltaY) return;
    e.preventDefault();
    this.#committed = this.value;
    this.#step(e.deltaY < 0 ? 1 : -1, stepAmount(e, this), 'wheel', e, true);
  };

  // ── Typing ──
  #onBeforeInput = (e: InputEvent) => {
    if (e.inputType === 'insertParagraph' || e.inputType === 'insertLineBreak') {
      e.preventDefault();
      this.#commitText(e);
      if (!this.isDisabled) this.form?.requestSubmit();
      return;
    }
    const o = this.#options();
    if (e.inputType === 'insertFromPaste' || e.inputType === 'insertFromDrop') {
      this.#pasting = true;
      const text = e.dataTransfer?.getData('text/plain') ?? e.data ?? '';
      const clean = sanitizeNumberText(text, o);
      if (clean !== text) { e.preventDefault(); if (clean) document.execCommand('insertText', false, clean); else this.#pasting = false; }
      return;
    }
    if (e.inputType.startsWith('insert') && e.data && ![...e.data].every((c) => isNumberChar(c, o))) e.preventDefault();
  };

  #onInput = (e: Event) => {
    e.stopPropagation(); // the host fires its own input event with Base UI's details
    const ed = e.currentTarget as HTMLElement;
    const text = (ed.textContent ?? '').replace(/[\r\n]+/g, '');
    if (!text) ed.replaceChildren(); // keep :empty so the placeholder shows
    const paste = this.#pasting;
    this.#pasting = false;
    this.#typing = true;
    const parsed = parseNumber(text, this.#options());
    if (parsed == null) this.#set(null, 'input-clear', e, false);
    else if (!Number.isNaN(parsed)) this.#set(parsed, paste ? 'input-paste' : 'input-change', e, false);
  };

  #onKeydown = (e: KeyboardEvent) => {
    const k = numberKey(e.key);
    if (!k || e.ctrlKey || e.metaKey || this.#inactive) return;
    e.preventDefault();
    if ('dir' in k) { this.#committed = this.#current(); this.#step(k.dir, stepAmount(e, this), 'keyboard', e, true); return; }
    const to = k.to === 'min' ? this.min : this.max;
    if (to == null) return;
    this.#committed = this.#current();
    this.#typing = false;
    this.#set(to, 'keyboard', e, true);
    const input = this.input;
    if (input) input.textContent = this.#display(to);
  };

  #onFocus = () => { this.#committed = this.value; };
  #onBlur = (e: FocusEvent) => { this.#commitText(e); };

  /** Blur or Enter: parse the text, clamp (unless allow-out-of-range), snap (snap-on-step), reformat, fire change when it differs. */
  #commitText(e: Event) {
    const input = this.input;
    if (!input) return;
    const parsed = parseNumber(input.textContent ?? '', this.#options());
    let next = parsed == null ? null : Number.isNaN(parsed) ? this.value : parsed;
    if (next != null) {
      if (this.snapOnStep) next = snapNumber(next, this.step, this.min);
      if (!this.allowOutOfRange) next = clampNumber(next, { min: this.min, max: this.max });
    }
    this.#typing = false;
    this.#set(next, parsed == null ? 'input-clear' : 'input-blur', e, true);
    const text = this.#display(next);
    if (input.textContent !== text) input.textContent = text;
    if (!text) input.replaceChildren();
  }
}

define('ui-number-field', UINumberField);

declare global {
  interface HTMLElementTagNameMap { 'ui-number-field': UINumberField }
}
