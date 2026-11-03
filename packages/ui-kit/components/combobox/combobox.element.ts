// <ui-combobox>: an editable combobox (Base UI Combobox). Focus stays in the input (a contenteditable
// role="combobox", zero native form elements); typing filters the authored <ui-option> children in
// a [popover] listbox, aria-activedescendant points at the highlighted one (dom/listbox.ts,
// dom/combobox.ts). Single selection shows the chosen label in the input; `multiple` shows chips.
// The input row follows the construction pattern (components/slots.ts), as the select trigger:
//   [leading] [prefix] [chips] [input] [suffix] [clear] [trigger = caret]
// (Base UI anatomy: Input, Chips › Chip › ChipRemove, Clear, Trigger; Positioner › Popup › List ›
// Item, Empty. The popup is its own positioner, as the select's.) Author adornments as children
// with slot="leading" | "prefix" | "suffix"; or the parts as [data-part] children (composition):
// label, control › leading · prefix · input · suffix · clear · trigger, popup › list · empty,
// description, error.
// <ui-autocomplete> (components/autocomplete) extends this class: free text with suggestions.
import { UIFormElement, define, html, settleDefault, signal, type Problem } from '../../core/index.ts';
import {
  applyAttrs, comboboxButtonAttrs, comboboxInputAttrs, comboboxKeyIntent, comboboxTriggerAttrs, createDismissLayer, createPositioner,
  eventDetails, fieldAttrs, firstEnabled, hideTopLayer, lastEnabled, listboxAttrs, matchesQuery, navigate, onTextBeforeInput,
  optionAttrs, popupDataAttrs, showTopLayer, splitValues, textEntryAttrs, toSingleLine, uid, unitOf, visibleItems, withExternalRefs,
  type AutocompleteMode, type ChangeReason, type OptionItem, type Side,
} from '../../dom/index.ts';
import '../listbox/option.element.ts';
import '../../icons/index.ts';
import { ensureId, optionList } from '../listbox/options.ts';
import { adoptAdornments, adoptPart, authoredParts, partText } from '../slots.ts';
import { applyRecipe, partOf, setClasses } from '../classes.ts';
import { combobox } from '../../styled-system/recipes/combobox.js';

const ADORNMENTS = ['leading', 'prefix', 'suffix'] as const;
/** The parts an author may write (composition), by path. */
const AUTHORED = ['label', 'control', 'control > leading', 'control > prefix', 'control > input', 'control > suffix', 'control > clear', 'control > trigger', 'popup', 'popup > list', 'popup > empty', 'description', 'error'] as const;

export class UICombobox extends UIFormElement {
  static properties = {
    ...UIFormElement.properties,
    /** The selected value (Base UI value); with multiple, the selected values comma-separated. */
    value: { type: String, default: '' },
    /** The value at first render and on form reset; without it, the value attribute (Base UI defaultValue). */
    defaultValue: { type: String, default: null },
    /** The input's text (Base UI inputValue). Single selection shows the selected label; typing filters. */
    inputValue: { type: String, default: '' },
    /** Whether the popup is open (Base UI open). Setting it opens or closes without an openchange event. */
    open: { type: Boolean, default: false },
    /** Open the popup at connect (Base UI defaultOpen). */
    defaultOpen: { type: Boolean, default: false },
    /** Select several values, shown as chips before the input (Base UI multiple). */
    multiple: { type: Boolean, default: false },
    label: { type: String, default: '' },
    placeholder: { type: String, default: '' },
    description: { type: String, default: '' },
    error: { type: String, default: '' },
    readonly: { type: Boolean, default: false, reflect: true },
    /** What the popup says when no option matches (Base UI Combobox.Empty); empty: nothing. */
    emptyText: { type: String, default: 'No results.' },
    /** Highlight the first match while typing, so Enter takes it (Base UI autoHighlight). */
    autoHighlight: { type: Boolean, default: false },
    /** Ids that name the input when the combobox has no label (ui-field sets it). */
    labelledby: { type: String, default: '' },
    /** Ids that describe the input, after its own description and error (ui-field sets it). */
    describedby: { type: String, default: '' },
  };
  declare value: string;
  declare defaultValue: string | null;
  declare inputValue: string;
  declare open: boolean;
  declare defaultOpen: boolean;
  declare multiple: boolean;
  declare label: string;
  declare placeholder: string;
  declare description: string;
  declare error: string;
  declare readonly: boolean;
  declare emptyText: string;
  declare autoHighlight: boolean;
  declare labelledby: string;
  declare describedby: string;

  /** aria-autocomplete, and whether typing filters (Autocomplete overrides it). */
  protected mode(): AutocompleteMode { return 'list'; }
  /** Whether the row has the trigger (Autocomplete: only with the trigger attribute). */
  protected hasTrigger() { return true; }

  #id = '';
  #side = signal<Side>('bottom');
  #popupShown = false;
  #positioner = createPositioner({
    anchor: () => this.control, popup: () => this.popup, side: 'bottom', align: 'start',
    offset: () => unitOf(this), onSide: (s) => { this.#side.value = s; },
  });
  #dismiss = createDismissLayer({
    inside: () => [this], escapeKey: false,
    onDismiss: (reason, e) => this.close(reason, e),
  });
  /** The highlighted option (index into options), -1 for none. */
  protected active = signal(-1);
  /** The text typed since the popup last opened filters the list; null shows every option. */
  protected query = signal<string | null>(null);
  /** The value whose label the input shows (single selection), so a new value rewrites the text once. */
  #shownFor: string | null = null;
  #pending: Element[] = [];
  #adornments: Element[] = [];
  #authored = new Map<string, Element>();
  #seeded = false;
  #list = optionList(() => this.list);
  #hostObserver?: MutationObserver;
  #chipKey = '';

  get options() { return this.#list.options; }
  get control() { return this.querySelector<HTMLElement>(':scope > [data-part=control]'); }
  /** The editable element (Base UI Combobox.Input), for selection APIs. */
  get editor() { return this.querySelector<HTMLElement>(':scope > [data-part=control] > [data-part=input]') ?? undefined; }
  get popup() { return this.querySelector<HTMLElement>(':scope > [data-part=popup]') ?? undefined; }
  /** The popup's list: the <ui-option> children's parent (Base UI Combobox.List). */
  get list() { return this.popup?.querySelector<HTMLElement>(':scope > [data-part=list]') ?? undefined; }
  /** The selected values (multiple), or the one value. */
  get values(): string[] { return this.multiple ? splitValues(this.value) : this.value ? [this.value] : []; }

  connected() {
    this.#id = this.id ? `${this.id}-field` : uid('combobox');
    settleDefault(this, '');
    if (this.defaultOpen) this.open = true;
    this.#pending = [...this.querySelectorAll(':scope > ui-option, :scope > [data-part=popup] > [data-part=list] > ui-option, :scope > [data-part=popup] > ui-option')];
    this.#adornments = [...this.querySelectorAll(ADORNMENTS.map((p) => `:scope > [slot=${p}], :scope > [data-part=control] > [slot=${p}], :scope > [data-part=control] > [data-part=${p}] > [slot]`).join(', '))];
    this.#authored = authoredParts(this, AUTHORED);
    if (!this.#seeded) {
      this.#seeded = true;
      const text = (p: string) => partText(this.#authored.get(p));
      if (!this.label && text('label')) this.label = text('label');
      if (!this.description && text('description')) this.description = text('description');
      if (!this.error && text('error')) this.error = text('error');
      if (!this.hasAttribute('empty-text') && this.#authored.has('popup > empty')) this.emptyText = text('popup > empty');
    }
    this.#hostObserver = new MutationObserver(() => this.#adopt([...this.children].filter((c) => c.localName === 'ui-option')));
    this.#hostObserver.observe(this, { childList: true });
  }

  disconnected() {
    this.open = false;
    this.#hidePopup();
    this.#hostObserver?.disconnect();
    this.#list.disconnect();
  }

  template() {
    const message = this.#message();
    return html`
      <span data-part="label" ?hidden=${!this.label} @click=${this.#focusInput}>${this.label}</span>
      <div data-part="control" @pointerdown=${this.#onControlDown} @mousedown=${this.#onControlDown} @click=${this.#onControlClick}>
        <span data-part="leading" hidden></span><span data-part="prefix" hidden></span>
        <span data-part="chips" hidden></span>
        <div data-part="input" @beforeinput=${this.#onBeforeInput} @input=${this.#onInput} @keydown=${this.#onKeydown} @blur=${this.#onBlur}></div>
        <span data-part="suffix" hidden></span>
        <span data-part="clear" hidden><i name="x"></i></span>
        <span data-part="trigger"><i name="caret-down"></i></span>
      </div>
      <div data-part="popup" popover="manual" @pointerdown=${this.#keepFocus} @mousedown=${this.#keepFocus} @click=${this.#onOptionClick} @pointermove=${this.#onOptionHover}>
        <div data-part="list"></div><div data-part="empty"></div>
      </div>
      <span data-part="description" ?hidden=${!this.description}>${this.description}</span>
      <span data-part="error" ?hidden=${!message}>${message}</span>`;
  }

  update() {
    const [label, control, popup, description, error] = this.children as unknown as HTMLElement[];
    if (this.#pending.length) { this.#adopt(this.#pending); this.#pending = []; this.#list.observe(this.list!); }
    if (this.#authored.size) { this.#adoptParts(label, control, popup, description, error); this.#authored.clear(); }
    if (this.#adornments.length) { adoptAdornments(control, this.#adornments, ADORNMENTS); this.#adornments = []; }
    const opts = this.options;
    const values = this.values;
    const query = this.query.value;
    const filters = this.mode() === 'list' || this.mode() === 'both';
    const shown = opts.map((o) => !filters || query === null || matchesQuery(o.label, query));
    const empty = !shown.some(Boolean);
    const open = this.open;
    const active = open && shown[this.active.value] ? this.active.value : -1;
    const popupId = `${this.#id}-popup`;
    const editable = !this.isDisabled && !this.readonly;
    const editor = partOf(control, 'input') as HTMLElement;
    const a = fieldAttrs({ id: this.#id, hasLabel: !!this.label, hasDescription: !!this.description, error: this.#message() || undefined });
    const refs = withExternalRefs({ 'aria-labelledby': this.label ? a.label.id : undefined, 'aria-describedby': a.control['aria-describedby'] }, this);
    applyAttrs(label, a.label);
    applyAttrs(description, a.description);
    applyAttrs(error, a.error);
    // Single selection: the input shows the selected option's label until the user types.
    this.syncText(opts);
    applyAttrs(editor, {
      id: this.#id, tabindex: this.isDisabled ? -1 : 0,
      ...textEntryAttrs({ type: 'text', placeholder: values.length && this.multiple ? '' : this.placeholder, editable }),
      ...comboboxInputAttrs({
        open, popupId, activeId: opts[active]?.id, labelledBy: refs['aria-labelledby'] as string | undefined,
        describedBy: refs['aria-describedby'] as string | undefined, disabled: this.isDisabled, readonly: this.readonly,
        required: this.required, invalid: !!a.control['aria-invalid'], autocomplete: this.mode(), empty,
      }),
    });
    if (editor.textContent !== this.inputValue) editor.textContent = this.inputValue;
    const c = combobox();
    this.#renderChips(partOf(control, 'chips') as HTMLElement, opts, values, editable, c);
    const clear = partOf(control, 'clear') as HTMLElement, trigger = partOf(control, 'trigger') as HTMLElement;
    applyAttrs(clear, comboboxButtonAttrs({ label: 'Clear', disabled: this.isDisabled }));
    clear.hidden = !editable || (!values.length && !this.inputValue);
    applyAttrs(trigger, comboboxTriggerAttrs({ open, popupId, disabled: this.isDisabled }));
    trigger.hidden = !this.hasTrigger();
    applyAttrs(popup, {
      id: popupId, ...listboxAttrs({ focusable: false, label: this.label || undefined }), 'aria-multiselectable': this.multiple ? 'true' : undefined,
      'aria-labelledby': this.label ? undefined : this.labelledby || undefined,
      ...popupDataAttrs({ open, side: this.#side.value, align: 'start' }), 'data-empty': empty ? '' : undefined,
    });
    applyAttrs(this.list!, { 'data-empty': empty ? '' : undefined });
    const emptyPart = partOf(popup, 'empty') as HTMLElement;
    if (emptyPart.textContent !== this.emptyText) emptyPart.textContent = this.emptyText;
    emptyPart.hidden = !empty || !this.emptyText;
    applyAttrs(emptyPart, { role: empty && this.emptyText ? 'status' : undefined });
    opts.forEach((o, i) => {
      applyAttrs(o, optionAttrs({ id: ensureId(o), selected: values.includes(o.optionValue), disabled: o.disabled, active: i === active }));
      if (o.hidden !== !shown[i]) o.hidden = !shown[i];
    });
    if (open && (!empty || this.emptyText)) { this.#showPopup(); opts[active]?.scrollIntoView?.({ block: 'nearest' }); }
    else this.#hidePopup();
    applyRecipe(this, c, (slot) => partOf(this, slot) ?? partOf(control, slot) ?? partOf(popup, slot));
  }

  formValue(): string | FormData | null {
    if (!this.multiple) return this.value || null;
    if (!this.name || !this.values.length) return null;
    const data = new FormData();
    for (const v of this.values) data.append(this.name, v);
    return data;
  }
  isFilled() { return this.values.length > 0; }
  authorError() { return this.error; }
  isReadonly() { return this.readonly; }
  validationAnchor() { return this.editor ?? undefined; }
  resetValue() { this.value = this.defaultValue ?? ''; this.query.value = null; this.#shownFor = null; if (this.multiple) this.inputValue = ''; }
  restoreValue(state: unknown) { if (typeof state === 'string') this.value = state; }
  validate(): Problem | null {
    return this.required && !this.values.length ? { flags: { valueMissing: true }, message: 'Select an option.' } : null;
  }

  focus(options?: FocusOptions) { this.editor?.focus(options); }

  // ── behavior the autocomplete changes ──

  /** Single selection: write the selected label into the input when the value changed (not while typing). */
  protected syncText(opts = this.options) {
    if (this.multiple || this.query.value !== null || this.#shownFor === this.value) return;
    const o = opts.find((x) => x.optionValue === this.value);
    if (this.value && !o) return; // its option is not here yet
    this.#shownFor = this.value;
    this.inputValue = o?.label ?? '';
  }

  /** The user typed: the text filters (and opens) the list; emptying a single combobox clears its value. */
  protected textInput(text: string, e: Event) {
    this.inputValue = text;
    this.query.value = text;
    this.inputValueChange(text, text ? 'input-change' : 'input-clear', e);
    if (!this.multiple && !text && this.value) this.setValue('', 'input-clear', e);
    this.active.value = this.autoHighlight ? this.#firstShown(text) : -1;
    if (!this.open) this.setOpen(true, 'input-change', e);
  }

  /** An option was chosen: single takes it and closes; multiple toggles it and keeps the popup open. */
  protected commit(i: number, reason: ChangeReason, e: Event) {
    const o = this.options[i];
    if (!o || o.disabled) return;
    if (this.multiple) {
      const vs = this.values, v = o.optionValue;
      this.setValue((vs.includes(v) ? vs.filter((x) => x !== v) : [...vs, v]).join(','), reason, e);
      if (this.inputValue) { this.inputValue = ''; this.inputValueChange('', reason, e); }
      this.query.value = null;
      return;
    }
    this.query.value = null;
    if (o.optionValue !== this.value) this.setValue(o.optionValue, reason, e);
    if (this.inputValue !== o.label) { this.inputValue = o.label; this.inputValueChange(o.label, reason, e); }
    this.#shownFor = this.value;
    this.close(reason, e);
  }

  /** The clear button: no value, no text (Base UI Combobox.Clear, reason clear-press). */
  protected clear(e: Event) {
    if (this.values.length) this.setValue('', 'clear-press', e);
    if (this.inputValue) { this.inputValue = ''; this.inputValueChange('', 'clear-press', e); }
    this.query.value = this.open ? '' : null;
    this.#shownFor = this.value;
    this.active.value = -1;
  }

  /** Arrow navigation moved the highlight (Autocomplete inline mode shows its label). */
  protected highlight(i: number, _e: Event) { this.active.value = i; }

  /** The popup closed: the text returns to the selected label (single), the filter resets. */
  protected closed(_reason: ChangeReason, _e: Event) {
    this.active.value = -1;
    this.query.value = null;
    this.#shownFor = null;
  }

  protected setValue(value: string, reason: ChangeReason, e: Event) {
    this.value = value;
    const detail = { value: this.multiple ? this.values : value, ...eventDetails(reason, e) };
    this.dispatchEvent(new CustomEvent('input', { bubbles: true, detail }));
    this.dispatchEvent(new CustomEvent('change', { bubbles: true, detail }));
  }

  /** The text changed (Base UI onInputValueChange: { value, reason, event }). */
  protected inputValueChange(value: string, reason: ChangeReason, e: Event) {
    this.dispatchEvent(new CustomEvent('inputvaluechange', { bubbles: true, detail: { value, ...eventDetails(reason, e) } }));
  }

  /**
   * Open or close from an interaction: openchange (Base UI onOpenChange: { open, reason, event }),
   * cancelable; unless prevented, the open property follows. False when nothing changed.
   */
  protected setOpen(open: boolean, reason: ChangeReason, event: Event) {
    if (open === this.open || (open && (this.isDisabled || this.readonly))) return false;
    if (!this.dispatchEvent(new CustomEvent('openchange', { bubbles: true, cancelable: true, detail: { open, ...eventDetails(reason, event) } }))) return false;
    this.open = open;
    if (!open) this.closed(reason, event);
    return true;
  }

  protected close(reason: ChangeReason, event: Event) { this.setOpen(false, reason, event); }

  /** The visible options for navigation (filtered-out ones count as disabled). */
  protected navItems(): OptionItem[] {
    const q = this.query.value, filters = this.mode() === 'list' || this.mode() === 'both';
    return visibleItems(this.options.map((o) => o.item), this.options.map((o) => !filters || q === null || matchesQuery(o.label, q)));
  }

  // ── internals ──

  #message() { return this.error || (this.userInvalid ? this.problem!.message : ''); }

  #firstShown(_q: string) { return firstEnabled(this.navItems()) ?? -1; }

  #adoptParts(label: Element, control: Element, popup: Element, description: Element, error: Element) {
    const a = this.#authored;
    adoptPart(a.get('label'), label);
    adoptPart(a.get('control'), control);
    for (const p of ADORNMENTS) adoptPart(a.get(`control > ${p}`), partOf(control, p), 'append');
    adoptPart(a.get('control > input'), partOf(control, 'input'));
    adoptPart(a.get('control > clear'), partOf(control, 'clear'), 'replace');
    adoptPart(a.get('control > trigger'), partOf(control, 'trigger'), 'replace');
    adoptPart(a.get('popup'), popup);
    adoptPart(a.get('popup > list'), this.list);
    adoptPart(a.get('popup > empty'), partOf(popup, 'empty'));
    adoptPart(a.get('description'), description);
    adoptPart(a.get('error'), error);
    adoptAdornments(control, [], ADORNMENTS);
  }

  #adopt(options: Element[]) {
    const list = this.list;
    if (list) for (const o of options) list.append(o);
  }

  /** Base UI Combobox.Chip per selected value (multiple): its label and a ChipRemove press button. */
  #renderChips(chips: HTMLElement, opts: this['options'], values: string[], editable: boolean, c: Record<string, string>) {
    chips.hidden = !this.multiple;
    const items = this.multiple ? values.map((v) => ({ v, label: opts.find((o) => o.optionValue === v)?.label ?? v })) : [];
    const key = JSON.stringify([items, editable]);
    if (key !== this.#chipKey) {
      this.#chipKey = key;
      chips.replaceChildren(...items.map(({ v, label }) => {
        const chip = document.createElement('span');
        chip.setAttribute('data-part', 'chip');
        chip.setAttribute('data-value', v);
        const text = document.createElement('span');
        text.setAttribute('data-part', 'contents');
        text.textContent = label;
        chip.append(text);
        if (editable) {
          const remove = document.createElement('span');
          remove.setAttribute('data-part', 'chip-remove');
          applyAttrs(remove, comboboxButtonAttrs({ label: `Remove ${label}` }));
          remove.innerHTML = '<i name="x"></i>';
          chip.append(remove);
        }
        return chip;
      }));
    }
    for (const chip of chips.children) {
      setClasses(chip, c.chip);
      setClasses(chip.querySelector(':scope > [data-part=chip-remove]'), c['chip-remove']);
      applyAttrs(chip, { 'data-disabled': this.isDisabled ? '' : undefined });
    }
  }

  #current() {
    if (this.active.value >= 0) return this.active.value;
    const items = this.navItems();
    const sel = this.options.findIndex((o) => o.optionValue === this.value);
    return sel >= 0 && !items[sel].disabled ? sel : -1;
  }

  #showPopup() {
    const popup = this.popup!;
    if (!this.#popupShown) {
      this.#popupShown = true;
      showTopLayer(popup);
      this.#dismiss.activate();
    }
    this.#positioner.start();
  }

  #hidePopup() {
    const popup = this.popup;
    if (!popup || !this.#popupShown) return;
    this.#popupShown = false;
    hideTopLayer(popup);
    this.#dismiss.deactivate();
    this.#positioner.stop();
  }

  #focusInput = () => { if (!this.isDisabled) this.focus(); };

  // Presses on the row's buttons and padding keep focus in the input.
  #onControlDown = (e: Event) => { if (e.target !== this.editor && !this.editor?.contains(e.target as Node)) e.preventDefault(); };

  #onControlClick = (e: Event) => {
    if (this.isDisabled) return;
    const t = e.target as Element;
    const remove = t.closest?.('[data-part=chip-remove]');
    if (remove && !this.readonly) {
      const v = remove.parentElement?.getAttribute('data-value') ?? '';
      this.setValue(this.values.filter((x) => x !== v).join(','), 'chip-remove-press', e);
      this.focus();
      return;
    }
    if (t.closest?.('[data-part=clear]') && !this.readonly) { this.clear(e); this.focus(); return; }
    if (t.closest?.('[data-part=trigger]')) {
      if (this.open) this.close('trigger-press', e);
      else { this.query.value = null; this.active.value = this.#current(); this.setOpen(true, 'trigger-press', e); }
      this.focus();
      return;
    }
    if (e.target !== this.editor && !this.editor?.contains(t)) this.focus();
  };

  #onBeforeInput = (e: InputEvent) => {
    if (onTextBeforeInput(e) === 'submit' && !this.isDisabled && !this.open) this.form?.requestSubmit();
  };

  #onInput = (e: Event) => {
    const ed = e.currentTarget as HTMLElement;
    const text = toSingleLine(ed.textContent ?? '');
    if (!text) ed.replaceChildren(); // keep :empty so the placeholder shows
    // The editor's native input event stops here; the host fires its own (inputvaluechange, input, change).
    e.stopPropagation();
    this.textInput(text, e);
  };

  #onKeydown = (e: KeyboardEvent) => {
    if (this.isDisabled) return;
    const intent = comboboxKeyIntent(this.open, e, { empty: !this.inputValue, multiple: this.multiple });
    const items = this.navItems();
    switch (intent) {
      case 'open': {
        if (this.readonly) return;
        e.preventDefault();
        const i = e.altKey ? -1 : e.key === 'ArrowUp' ? lastEnabled(items) ?? -1 : this.#current() >= 0 ? this.#current() : firstEnabled(items) ?? -1;
        this.active.value = i;
        this.setOpen(true, 'list-navigation', e);
        return;
      }
      case 'move': {
        e.preventDefault();
        const key = e.key === 'PageDown' ? 'End' : e.key === 'PageUp' ? 'Home' : e.key;
        const i = navigate(items, this.active.value, key);
        if (i !== undefined) this.highlight(i, e);
        return;
      }
      case 'commit':
        e.preventDefault();
        if (this.active.value >= 0 && !items[this.active.value]?.disabled) this.commit(this.active.value, 'item-press', e);
        return;
      case 'close': e.preventDefault(); this.close('escape-key', e); return;
      case 'close-tab': this.close('focus-out', e); return;
      case 'remove-last': {
        if (this.readonly || !this.values.length) return;
        e.preventDefault();
        this.setValue(this.values.slice(0, -1).join(','), 'keyboard', e);
        return;
      }
    }
  };

  #onOptionClick = (e: Event) => {
    const o = (e.target as Element).closest?.('ui-option');
    if (!o) return;
    const i = this.options.indexOf(o as any);
    if (i < 0 || this.options[i].disabled) return;
    this.commit(i, 'item-press', e);
    this.focus();
  };

  // The pointer highlights the option under it (Base UI: hover moves the highlight).
  #onOptionHover = (e: Event) => {
    const o = (e.target as Element).closest?.('ui-option');
    const i = o ? this.options.indexOf(o as any) : -1;
    if (i >= 0 && !this.options[i].disabled && i !== this.active.value) this.active.value = i;
  };

  // Keep focus in the input while interacting with the popup.
  #keepFocus = (e: Event) => e.preventDefault();

  #onBlur = (e: Event) => { this.close('focus-out', e); this.markTouched(); };
}

define('ui-combobox', UICombobox);

declare global {
  interface HTMLElementTagNameMap { 'ui-combobox': UICombobox }
}
