// <ui-select>: select-only combobox. Focus stays on the trigger (role="combobox");
// the popup is a [popover] listbox holding the authored <ui-option> children.
// The trigger follows the construction pattern (components/slots.ts):
//   [leading] [prefix] [value] [suffix] [icon = chevron]
// (Base UI Select anatomy: trigger › value · icon; popup › list › item, the items being <ui-option>s.)
// Author adornments as children with slot="leading" | "prefix" | "suffix".
// Composition (optional): the parts may be authored as [data-part] children, in the anatomy above
// (label, trigger › leading · prefix · value · suffix · icon, popup › list › ui-option, description,
// error); each is adopted onto the generated part (slots.ts adoptPart), absent ones are generated.
import { UIFormElement, define, html, settleDefault, signal, type Problem } from '../../core/index.ts';
import {
  applyAttrs, comboboxAttrs, createTypeahead, eventDetails, fieldAttrs, firstEnabled, isPrintableKey, lastEnabled,
  listboxAttrs, navigate, optionAttrs, placePopup, popupDataAttrs, popupVars, selectKeyIntent, uid, withExternalRefs, type ChangeReason,
} from '../../dom/index.ts';
import '../listbox/option.element.ts';
import '../../icons/index.ts';
import { ensureId, optionList } from '../listbox/options.ts';
import { adoptAdornments, adoptPart, authoredParts, partText } from '../slots.ts';
import { applyRecipe, partOf } from '../classes.ts';
import { select } from '../../styled-system/recipes/select.js';

const TRIGGER_ADORNMENTS = ['leading', 'prefix', 'suffix'] as const;
/** The parts an author may write (composition), by path. */
const AUTHORED = ['label', 'trigger', 'trigger > leading', 'trigger > prefix', 'trigger > value', 'trigger > suffix', 'trigger > icon', 'popup', 'popup > list', 'description', 'error'] as const;
/** CSS anchor positioning places the popup (select.recipe.ts); script placement is the fallback. */
const ANCHORED = typeof CSS !== 'undefined' && !!CSS.supports?.('position-area', 'block-end') && !!CSS.supports?.('anchor-scope', 'all');

export class UISelect extends UIFormElement {
  static properties = {
    ...UIFormElement.properties,
    value: { type: String, default: '' },
    /** The value at first render and on form reset; without it, the value attribute (Base UI defaultValue). */
    defaultValue: { type: String, default: null },
    /** Whether the popup is open (Base UI open). Setting it opens or closes without an openchange event. */
    open: { type: Boolean, default: false },
    /** Open the popup at connect (Base UI defaultOpen). */
    defaultOpen: { type: Boolean, default: false },
    label: { type: String, default: '' },
    placeholder: { type: String, default: 'Select…' },
    description: { type: String, default: '' },
    error: { type: String, default: '' },
    /** Ids that name the trigger and popup when the select has no label (ui-field sets it). */
    labelledby: { type: String, default: '' },
    /** Ids that describe the trigger, after its own description and error (ui-field sets it). */
    describedby: { type: String, default: '' },
  };
  declare value: string;
  declare defaultValue: string | null;
  declare open: boolean;
  declare defaultOpen: boolean;
  declare label: string;
  declare placeholder: string;
  declare description: string;
  declare error: string;
  declare labelledby: string;
  declare describedby: string;

  #id = '';
  /** The side the open popup sits on (measured: CSS anchor positioning may flip it). */
  #side = signal<'top' | 'bottom'>('bottom');
  #popupShown = false;
  #active = signal(-1);
  #typeahead = createTypeahead();
  #pending: Element[] = [];
  #adornments: Element[] = [];
  /** Authored parts waiting to be adopted by the next render; seeded marks the first connect. */
  #authored = new Map<string, Element>();
  #seeded = false;
  #list = optionList(() => this.list);
  #hostObserver?: MutationObserver;

  get options() { return this.#list.options; }
  get trigger() { return this.querySelector<HTMLElement>(':scope > [data-part=trigger]'); }
  get popup() { return this.querySelector<HTMLElement>(':scope > [data-part=popup]') ?? undefined; }
  /** The popup's list: the <ui-option> children's parent (Base UI Select.List). */
  get list() { return this.popup?.querySelector<HTMLElement>(':scope > [data-part=list]') ?? undefined; }

  connected() {
    this.#id = this.id ? `${this.id}-field` : uid('select');
    settleDefault(this, '');
    if (this.defaultOpen) this.open = true;
    // Authored options (or ones already in a popup from a previous connect) move into the popup.
    this.#pending = [...this.querySelectorAll(':scope > ui-option, :scope > [data-part=popup] > [data-part=list] > ui-option, :scope > [data-part=popup] > ui-option')];
    this.#adornments = [...this.querySelectorAll(TRIGGER_ADORNMENTS.map((p) => `:scope > [slot=${p}], :scope > [data-part=trigger] > [slot=${p}], :scope > [data-part=trigger] > [data-part=${p}] > [slot]`).join(', '))];
    this.#authored = authoredParts(this, AUTHORED);
    // Authored text seeds the properties it stands for, once (on a reconnect the parts are the
    // generated ones, whose text the properties already gave them).
    if (!this.#seeded) {
      this.#seeded = true;
      const text = (p: string) => partText(this.#authored.get(p));
      if (!this.label && text('label')) this.label = text('label');
      if (!this.description && text('description')) this.description = text('description');
      if (!this.error && text('error')) this.error = text('error');
      if (!this.hasAttribute('placeholder') && text('trigger > value')) this.placeholder = text('trigger > value');
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
    const selected = this.#selected();
    return html`
      <span data-part="label" ?hidden=${!this.label} @click=${this.#focusTrigger}>${this.label}</span>
      <div data-part="trigger" @keydown=${this.#onKeydown} @click=${this.#onTriggerClick} @blur=${this.#onBlur}>
        <span data-part="leading" hidden></span><span data-part="prefix" hidden></span>
        <span data-part="value" ?data-placeholder=${!selected}>${selected?.label || this.placeholder}</span>
        <span data-part="suffix" hidden></span>
        <span data-part="icon" aria-hidden="true"><i name="caret-down"></i></span>
      </div>
      <div data-part="popup" popover="manual" @pointerdown=${this.#keepFocus} @mousedown=${this.#keepFocus} @click=${this.#onOptionClick}><div data-part="list"></div></div>
      <span data-part="description" ?hidden=${!this.description}>${this.description}</span>
      <span data-part="error" ?hidden=${!message}>${message}</span>`;
  }

  update() {
    const [label, trigger, popup, description, error] = this.children as unknown as HTMLElement[];
    if (this.#pending.length) { this.#adopt(this.#pending); this.#pending = []; this.#list.observe(this.list!); }
    if (this.#authored.size) { this.#adoptParts(label, trigger, popup, description, error); this.#authored.clear(); }
    if (this.#adornments.length) { adoptAdornments(trigger, this.#adornments, TRIGGER_ADORNMENTS); this.#adornments = []; }
    const opts = this.options;
    const open = this.open;
    const active = open ? this.#current() : -1;
    const popupId = `${this.#id}-popup`;
    const a = fieldAttrs({ id: this.#id, hasLabel: !!this.label, hasDescription: !!this.description, error: this.#message() || undefined });
    const refs = withExternalRefs({ 'aria-labelledby': this.label ? a.label.id : undefined, 'aria-describedby': a.control['aria-describedby'] }, this);
    applyAttrs(label, a.label);
    applyAttrs(description, a.description);
    applyAttrs(error, a.error);
    applyAttrs(trigger, comboboxAttrs({
      open, popupId, activeId: opts[active]?.id, labelledBy: refs['aria-labelledby'] as string | undefined,
      describedBy: refs['aria-describedby'] as string | undefined, disabled: this.isDisabled,
      required: this.required, invalid: !!a.control['aria-invalid'],
    }));
    trigger.id = this.#id;
    // Base UI Select.Trigger / Value: data-placeholder while no option is selected.
    applyAttrs(trigger, { 'data-placeholder': this.#selected() ? undefined : '' });
    applyAttrs(popup, {
      id: popupId, ...listboxAttrs({ focusable: false, label: this.label || undefined }), 'aria-labelledby': this.label ? undefined : this.labelledby || undefined,
      ...popupDataAttrs({ open, side: this.#side.value, align: 'start' }),
    });
    opts.forEach((o, i) => applyAttrs(o, optionAttrs({ id: ensureId(o), selected: o.optionValue === this.value, disabled: o.disabled, active: i === active })));
    if (open) { this.#showPopup(); opts[active]?.scrollIntoView?.({ block: 'nearest' }); }
    else this.#hidePopup();
    applyRecipe(this, select(), (slot) => partOf(this, slot) ?? partOf(trigger, slot) ?? partOf(popup, slot));
  }

  formValue() { return this.value || null; }
  authorError() { return this.error; }
  validationAnchor() { return this.trigger ?? undefined; }
  resetValue() { this.value = this.defaultValue ?? ''; }
  restoreValue(state: unknown) { if (typeof state === 'string') this.value = state; }
  validate(): Problem | null {
    return this.required && !this.value ? { flags: { valueMissing: true }, message: 'Select an option.' } : null;
  }

  focus(options?: FocusOptions) { this.trigger?.focus(options); }

  // ── internals ──

  #message() { return this.error || (this.userInvalid ? this.problem!.message : ''); }
  #selected() { return this.options.find((o) => o.optionValue === this.value); }
  #items() { return this.options.map((o) => o.item); }

  /** Adopt the authored parts onto the generated ones (attributes, classes; slot and icon content). */
  #adoptParts(label: Element, trigger: Element, popup: Element, description: Element, error: Element) {
    const a = this.#authored;
    adoptPart(a.get('label'), label);
    adoptPart(a.get('trigger'), trigger);
    for (const p of TRIGGER_ADORNMENTS) adoptPart(a.get(`trigger > ${p}`), partOf(trigger, p), 'append');
    adoptPart(a.get('trigger > value'), partOf(trigger, 'value'));
    adoptPart(a.get('trigger > icon'), partOf(trigger, 'icon'), 'replace');
    adoptPart(a.get('popup'), popup);
    adoptPart(a.get('popup > list'), this.list);
    adoptPart(a.get('description'), description);
    adoptPart(a.get('error'), error);
    adoptAdornments(trigger, [], TRIGGER_ADORNMENTS);
  }

  #adopt(options: Element[]) {
    const list = this.list;
    if (list) for (const o of options) list.append(o);
  }

  /** The highlighted option: the one moved to, else the selected one, else the first enabled. */
  #current() {
    if (this.#active.value >= 0) return this.#active.value;
    const sel = this.options.findIndex((o) => o.optionValue === this.value);
    return sel >= 0 ? sel : firstEnabled(this.#items()) ?? -1;
  }

  /**
   * Open or close from an interaction: openchange (Base UI onOpenChange: { open, reason, event }),
   * cancelable; unless prevented, the open property follows. False when nothing changed.
   */
  #setOpen(open: boolean, reason: ChangeReason, event: Event) {
    if (open === this.open) return false;
    if (!this.dispatchEvent(new CustomEvent('openchange', { bubbles: true, cancelable: true, detail: { open, ...eventDetails(reason, event) } }))) return false;
    this.open = open;
    return true;
  }

  #openAt(i: number | undefined, reason: ChangeReason, event: Event) {
    if (this.isDisabled) return;
    this.#active.value = -1;
    this.#active.value = i ?? this.#current();
    this.#setOpen(true, reason, event);
  }

  #close(reason: ChangeReason, event: Event) {
    if (this.#setOpen(false, reason, event)) this.#active.value = -1;
  }

  #commit(i: number, reason: ChangeReason, event: Event) {
    const o = this.options[i];
    if (o && !o.disabled && o.optionValue !== this.value) {
      this.value = o.optionValue;
      const detail = { value: this.value, ...eventDetails(reason, event) };
      this.dispatchEvent(new CustomEvent('input', { bubbles: true, detail }));
      this.dispatchEvent(new CustomEvent('change', { bubbles: true, detail }));
    }
    this.#close(reason, event);
  }

  #showPopup() {
    const popup = this.popup!;
    if (!this.#popupShown) {
      this.#popupShown = true;
      // Each opening starts below, so CSS (or #measureSide) picks the side afresh.
      if (ANCHORED) { this.#side.value = 'bottom'; popup.setAttribute('data-side', 'bottom'); }
      try { popup.showPopover?.(); } catch { /* already open */ }
      document.addEventListener('pointerdown', this.#onOutside, true);
      if (!ANCHORED) {
        window.addEventListener('resize', this.#place);
        window.addEventListener('scroll', this.#place, true);
      }
    }
    if (!ANCHORED) this.#place();
    else this.#measureSide();
  }

  // With anchor positioning CSS picks the side (flip-block); read it back for data-side.
  #measureSide() {
    const popup = this.popup, trigger = this.trigger;
    if (!popup || !trigger) return;
    const p = popup.getBoundingClientRect(), t = trigger.getBoundingClientRect();
    if (!p.height && !p.width) return;
    // position-try-order: most-block-size, for engines that parse it but keep a squeezed first fit
    // (Safari 27): when the list does not fit on the side CSS chose, take the side with more room.
    // data-side="top" places the popup above (select.recipe.ts), so the choice holds in CSS.
    const squeezed = popup.scrollHeight > popup.clientHeight + 1;
    this.#side.value = squeezed ? (t.top > window.innerHeight - t.bottom ? 'top' : 'bottom') : p.top < t.top ? 'top' : 'bottom';
  }

  #hidePopup() {
    const popup = this.popup;
    if (!popup || !this.#popupShown) return;
    this.#popupShown = false;
    try { popup.hidePopover?.(); } catch { /* already closed */ }
    document.removeEventListener('pointerdown', this.#onOutside, true);
    window.removeEventListener('resize', this.#place);
    window.removeEventListener('scroll', this.#place, true);
  }

  // Fallback placement where CSS anchor positioning is unavailable (select.recipe.ts places it
  // otherwise): measured from the trigger and written inline.
  #place = () => {
    const popup = this.popup, trigger = this.trigger;
    if (!popup || !trigger) return;
    // Offset is 1u (styles/geometry.ts --u).
    const unit = parseFloat(window.getComputedStyle(this).getPropertyValue('--u')) || 4;
    const p = placePopup(trigger.getBoundingClientRect(), { width: window.innerWidth, height: window.innerHeight }, unit);
    this.#side.value = p.side;
    Object.assign(popup.style, {
      left: `${p.left}px`, top: p.top == null ? 'auto' : `${p.top}px`, bottom: p.bottom == null ? 'auto' : `${p.bottom}px`,
    });
    // Base UI's positioner variables; the recipe sizes the popup from them (min-width, max-height,
    // transform-origin). With anchor positioning the recipe computes them in CSS instead.
    for (const [k, v] of Object.entries(popupVars(p))) popup.style.setProperty(k, v);
  };

  #focusTrigger = () => { if (!this.isDisabled) this.focus(); };

  #onTriggerClick = (e: Event) => {
    if (this.isDisabled) return;
    this.open ? this.#close('trigger-press', e) : this.#openAt(undefined, 'trigger-press', e);
  };

  #onKeydown = (e: KeyboardEvent) => {
    if (this.isDisabled) return;
    const items = this.#items();
    const open = this.open;
    const intent = selectKeyIntent(open, e, this.#typeahead.busy());
    if (!open) {
      // Enter and Space press the trigger; arrows, Home / End and typeahead navigate the list.
      const press = e.key === 'Enter' || e.key === ' ';
      if (intent === 'open') { e.preventDefault(); this.#openAt(undefined, press ? 'trigger-press' : 'list-navigation', e); }
      else if (intent === 'open-first') { e.preventDefault(); this.#openAt(firstEnabled(items), 'list-navigation', e); }
      else if (intent === 'open-last') { e.preventDefault(); this.#openAt(lastEnabled(items), 'list-navigation', e); }
      else if (isPrintableKey(e)) {
        const i = this.#typeahead(items, this.#active.value, e.key);
        if (i !== undefined) { e.preventDefault(); this.#openAt(i, 'list-navigation', e); }
      }
      return;
    }
    switch (intent) {
      case 'close': e.preventDefault(); this.#close('escape-key', e); return;
      case 'commit': e.preventDefault(); this.#commit(this.#current(), 'item-press', e); return;
      case 'commit-tab': this.#commit(this.#current(), 'focus-out', e); return;
      case 'move': {
        e.preventDefault();
        const key = e.key === 'PageDown' ? 'End' : e.key === 'PageUp' ? 'Home' : e.key;
        const i = navigate(items, this.#current(), key);
        if (i !== undefined) this.#active.value = i;
        return;
      }
    }
    if (isPrintableKey(e)) {
      const i = this.#typeahead(items, this.#current(), e.key);
      if (i !== undefined) { e.preventDefault(); this.#active.value = i; }
    }
  };

  #onOptionClick = (e: Event) => {
    const o = (e.target as Element).closest?.('ui-option');
    if (!o) return;
    const i = this.options.indexOf(o as any);
    if (i < 0 || this.options[i].disabled) return;
    this.#commit(i, 'item-press', e);
    this.focus();
  };

  // Keep focus on the trigger while interacting with the popup.
  #keepFocus = (e: Event) => e.preventDefault();

  #onOutside = (e: Event) => { if (!this.contains(e.target as Node)) this.#close('outside-press', e); };

  #onBlur = (e: Event) => { this.#close('focus-out', e); this.markTouched(); };
}

define('ui-select', UISelect);

declare global {
  interface HTMLElementTagNameMap { 'ui-select': UISelect }
}
