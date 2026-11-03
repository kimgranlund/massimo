// <ui-autocomplete>: free text with suggestions (Base UI Autocomplete), on ui-combobox's machinery.
// The value is the input's text; the authored <ui-option> children are suggestions in a [popover]
// listbox that typing filters. A press or Enter on a highlighted suggestion writes its label into
// the input. `mode` (Base UI): list filters (default), both filters and completes inline, inline
// completes without filtering, none does neither. Inline completion: typing at the end shows the
// first suggestion that starts with the text, its rest selected so the next key replaces it;
// arrow keys write the highlighted suggestion into the input.
// The input row: [leading] [prefix] [input] [suffix] [clear] [trigger (show-trigger only)].
// Composition: the parts as [data-part] children, as on ui-combobox (no chips).
import { define, type Problem } from '../../core/index.ts';
import { completionOf, eventDetails, inlineCompletion, matchesQuery, visibleItems, type AutocompleteMode, type ChangeReason } from '../../dom/index.ts';
import { UICombobox } from '../combobox/combobox.element.ts';
import { autocomplete } from '../../styled-system/recipes/autocomplete.js';

const MODES = ['list', 'both', 'inline', 'none'] as const;
const { multiple: _multiple, ...comboboxProperties } = UICombobox.properties;

export class UIAutocomplete extends UICombobox {
  static properties = {
    ...comboboxProperties,
    /** list (default): typing filters the suggestions; both: filters and completes inline; inline: completes only; none: neither (Base UI mode). */
    mode: { type: String, default: 'list' },
    /** Show the trigger (caret) that opens every suggestion; off by default, as an autocomplete is typed into. */
    showTrigger: { type: Boolean, default: false },
    /** What the popup says when no suggestion matches; empty by default, so the popup hides instead. */
    emptyText: { type: String, default: '' },
  } as unknown as typeof UICombobox.properties; // without multiple: one free-text value
  declare mode: AutocompleteMode;
  declare showTrigger: boolean;

  /** The value when focus arrived: change fires on blur when it differs, like a native input. */
  #focusValue = '';

  protected override modeOf(): AutocompleteMode { return (MODES as readonly string[]).includes(this.mode) ? this.mode : 'list'; }

  connected() {
    super.connected();
    this.addEventListener('focusin', this.#onFocusIn);
    this.addEventListener('focusout', this.#onFocusOut);
  }

  disconnected() {
    super.disconnected();
    this.removeEventListener('focusin', this.#onFocusIn);
    this.removeEventListener('focusout', this.#onFocusOut);
  }

  update() {
    // No chips: an autocomplete has one free-text value.
    this.querySelector(':scope > [data-part=control] > [data-part=chips]')?.remove();
    super.update();
  }

  /** No selected option: the value is the text (an option matching it is not marked selected). */
  get values(): string[] { return []; }
  formValue() { return this.value || null; }
  isFilled() { return this.value !== ''; }
  resetValue() { this.value = this.defaultValue ?? ''; this.query.value = null; }
  validate(): Problem | null {
    return this.required && !this.value ? { flags: { valueMissing: true }, message: 'Fill in this field.' } : null;
  }

  protected override recipe() { return autocomplete(); }
  protected override hasTrigger() { return this.showTrigger; }

  /** The input always shows the value. */
  protected override syncText() { if (this.inputValue !== this.value) this.inputValue = this.value; }

  /** Typing is the value; it filters (list, both) and completes inline (both, inline). */
  protected override textInput(text: string, e: Event) {
    const mode = this.modeOf();
    let shown = text, hl = -1;
    this.query.value = text;
    if ((mode === 'both' || mode === 'inline') && (e as InputEvent).inputType === 'insertText') {
      const filters = mode === 'both';
      const items = visibleItems(this.options.map((o) => o.item), this.options.map((o) => !filters || matchesQuery(o.label, text)));
      const i = inlineCompletion(items, text);
      if (i !== undefined) {
        hl = i;
        shown = completionOf(this.options[i].label, text);
        this.#writeCompletion(shown, text.length);
      }
    }
    this.inputValue = shown;
    this.setValue(shown, text ? 'input-change' : 'input-clear', e);
    if (hl < 0 && this.autoHighlight) hl = this.navItems().findIndex((it) => !it.disabled);
    this.active.value = hl;
    if (!this.open) this.setOpen(true, 'input-change', e);
  }

  /** A suggestion was chosen: its label is the text; the popup closes. */
  protected override commit(i: number, reason: ChangeReason, e: Event) {
    const o = this.options[i];
    if (!o || o.disabled) return;
    this.query.value = null;
    if (o.label !== this.value) { this.inputValue = o.label; this.setValue(o.label, reason, e); }
    this.#change(reason, e);
    this.close(reason, e);
  }

  protected override clear(e: Event) {
    if (this.value) { this.inputValue = ''; this.setValue('', 'clear-press', e); this.#change('clear-press', e); }
    this.query.value = this.open ? '' : null;
    this.active.value = -1;
  }

  /** Inline modes: arrow keys write the highlighted suggestion into the input. */
  protected override highlight(i: number, e: Event) {
    this.active.value = i;
    const m = this.modeOf();
    if ((m === 'both' || m === 'inline') && this.options[i] && this.options[i].label !== this.value) {
      this.inputValue = this.options[i].label;
      this.setValue(this.options[i].label, 'keyboard', e);
    }
  }

  protected override closed(_reason: ChangeReason, _e: Event) { this.active.value = -1; this.query.value = null; }

  /** Every text change fires input { value, reason, event } (Base UI onValueChange); change waits for a commit or blur. */
  protected override setValue(value: string, reason: ChangeReason, e: Event) {
    this.value = value;
    this.dispatchEvent(new CustomEvent('input', { bubbles: true, detail: { value, ...eventDetails(reason, e) } }));
  }

  /** The value is the text: no separate text event. */
  protected override inputValueChange() {}

  /** Enter with no highlight closes the popup; the form submits as from a text field. */
  protected override enterUnhighlighted(e: KeyboardEvent) { if (this.open) this.close('none', e); }

  // ── internals ──

  #change(reason: ChangeReason, e: Event) {
    this.#focusValue = this.value;
    this.dispatchEvent(new CustomEvent('change', { bubbles: true, detail: { value: this.value, ...eventDetails(reason, e) } }));
  }

  /** Show the completed text with its completion selected (the editor's own text, so the next render keeps it). */
  #writeCompletion(text: string, from: number) {
    const ed = this.editor;
    if (!ed) return;
    ed.textContent = text;
    const node = ed.firstChild;
    const sel = typeof window.getSelection === 'function' ? window.getSelection() : null;
    if (!node || !sel || typeof document.createRange !== 'function') return;
    const range = document.createRange();
    range.setStart(node, from);
    range.setEnd(node, text.length);
    sel.removeAllRanges();
    sel.addRange(range);
  }

  #onFocusIn = () => { this.#focusValue = this.value; };
  #onFocusOut = (e: FocusEvent) => {
    if (e.relatedTarget instanceof Node && this.contains(e.relatedTarget)) return;
    if (this.value !== this.#focusValue) this.#change('focus-out', e);
  };
}

define('ui-autocomplete', UIAutocomplete);

declare global {
  interface HTMLElementTagNameMap { 'ui-autocomplete': UIAutocomplete }
}
