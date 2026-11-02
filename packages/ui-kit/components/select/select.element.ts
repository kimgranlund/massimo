// <ui-select>: select-only combobox. Focus stays on the trigger (role="combobox");
// the popup is a [popover] listbox holding the authored <ui-option> children.
// The trigger follows the construction pattern (components/slots.ts):
//   [leading] [prefix] [contents = value] [suffix] [trailing = chevron]
// Author adornments as children with slot="leading" | "prefix" | "suffix".
import { UIFormElement, define, html, signal, type Problem } from '../../core/index.ts';
import {
  applyAttrs, comboboxAttrs, createTypeahead, fieldAttrs, firstEnabled, isPrintableKey, lastEnabled,
  listboxAttrs, navigate, optionAttrs, placePopup, selectKeyIntent, uid,
} from '../../dom/index.ts';
import '../listbox/option.element.ts';
import '../../icons/index.ts';
import { ensureId, optionList } from '../listbox/options.ts';
import { adoptAdornments } from '../slots.ts';

const TRIGGER_ADORNMENTS = ['leading', 'prefix', 'suffix'] as const;

export class UISelect extends UIFormElement {
  static properties = {
    ...UIFormElement.properties,
    value: { type: String, default: '' },
    label: { type: String, default: '' },
    placeholder: { type: String, default: 'Select…' },
    description: { type: String, default: '' },
    error: { type: String, default: '' },
  };
  declare value: string;
  declare label: string;
  declare placeholder: string;
  declare description: string;
  declare error: string;

  #id = '';
  #default = '';
  #open = signal(false);
  #active = signal(-1);
  #typeahead = createTypeahead();
  #pending: Element[] = [];
  #adornments: Element[] = [];
  #list = optionList(() => this.popup);
  #hostObserver?: MutationObserver;

  get options() { return this.#list.options; }
  get open() { return this.#open.value; }
  get trigger() { return this.querySelector<HTMLElement>(':scope > [data-part=trigger]'); }
  get popup() { return this.querySelector<HTMLElement>(':scope > [data-part=popup]') ?? undefined; }

  connected() {
    this.#id = this.id ? `${this.id}-field` : uid('select');
    this.#default = this.getAttribute('value') ?? '';
    // Authored options (or ones already in a popup from a previous connect) move into the popup.
    this.#pending = [...this.querySelectorAll(':scope > ui-option, :scope > [data-part=popup] > ui-option')];
    this.#adornments = [...this.querySelectorAll(TRIGGER_ADORNMENTS.map((p) => `:scope > [slot=${p}], :scope > [data-part=trigger] > [data-part=${p}] > [slot]`).join(', '))];
    this.#hostObserver = new MutationObserver(() => this.#adopt([...this.children].filter((c) => c.localName === 'ui-option')));
    this.#hostObserver.observe(this, { childList: true });
  }

  disconnected() {
    this.#close();
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
        <span data-part="contents" ?data-placeholder=${!selected}>${selected?.label || this.placeholder}</span>
        <span data-part="suffix" hidden></span>
        <span data-part="trailing" aria-hidden="true"><i name="caret-down"></i></span>
      </div>
      <div data-part="popup" popover="manual" @pointerdown=${this.#keepFocus} @mousedown=${this.#keepFocus} @click=${this.#onOptionClick}></div>
      <span data-part="description" ?hidden=${!this.description}>${this.description}</span>
      <span data-part="error" ?hidden=${!message}>${message}</span>`;
  }

  update() {
    const [label, trigger, popup, description, error] = this.children as unknown as HTMLElement[];
    if (this.#pending.length) { this.#adopt(this.#pending); this.#pending = []; this.#list.observe(popup); }
    if (this.#adornments.length) { adoptAdornments(trigger, this.#adornments, TRIGGER_ADORNMENTS); this.#adornments = []; }
    const opts = this.options;
    const open = this.#open.value;
    const active = open ? this.#active.value : -1;
    const popupId = `${this.#id}-popup`;
    const a = fieldAttrs({ id: this.#id, hasLabel: !!this.label, hasDescription: !!this.description, error: this.#message() || undefined });
    applyAttrs(label, a.label);
    applyAttrs(description, a.description);
    applyAttrs(error, a.error);
    applyAttrs(trigger, comboboxAttrs({
      open, popupId, activeId: opts[active]?.id, labelledBy: this.label ? a.label.id : undefined,
      describedBy: a.control['aria-describedby'] as string | undefined, disabled: this.isDisabled,
      required: this.required, invalid: !!a.control['aria-invalid'],
    }));
    trigger.id = this.#id;
    applyAttrs(popup, { id: popupId, ...listboxAttrs({ focusable: false, label: this.label || undefined }) });
    opts.forEach((o, i) => applyAttrs(o, optionAttrs({ id: ensureId(o), selected: o.optionValue === this.value, disabled: o.disabled, active: i === active })));
    if (open) { this.#showPopup(); opts[active]?.scrollIntoView?.({ block: 'nearest' }); }
    else this.#hidePopup();
  }

  formValue() { return this.value || null; }
  validationAnchor() { return this.trigger ?? undefined; }
  resetValue() { this.value = this.#default; }
  restoreValue(state: unknown) { if (typeof state === 'string') this.value = state; }
  validate(): Problem | null {
    return this.required && !this.value ? { flags: { valueMissing: true }, message: 'Select an option.' } : null;
  }

  focus(options?: FocusOptions) { this.trigger?.focus(options); }

  // ── internals ──

  #message() { return this.error || (this.userInvalid ? this.problem!.message : ''); }
  #selected() { return this.options.find((o) => o.optionValue === this.value); }
  #items() { return this.options.map((o) => o.item); }

  #adopt(options: Element[]) {
    const popup = this.popup;
    if (popup) for (const o of options) popup.append(o);
  }

  #openAt(i: number | undefined) {
    if (this.isDisabled) return;
    const sel = this.options.findIndex((o) => o.optionValue === this.value);
    this.#active.value = i ?? (sel >= 0 ? sel : firstEnabled(this.#items()) ?? -1);
    this.#open.value = true;
  }

  #close() { this.#open.value = false; }

  #commit(i: number) {
    const o = this.options[i];
    if (o && !o.disabled && o.optionValue !== this.value) {
      this.value = o.optionValue;
      this.dispatchEvent(new Event('input', { bubbles: true }));
      this.dispatchEvent(new Event('change', { bubbles: true }));
    }
    this.#close();
  }

  #showPopup() {
    const popup = this.popup!;
    if (!popup.hasAttribute('data-open')) {
      popup.setAttribute('data-open', '');
      try { popup.showPopover?.(); } catch { /* already open */ }
      document.addEventListener('pointerdown', this.#onOutside, true);
      window.addEventListener('resize', this.#place);
      window.addEventListener('scroll', this.#place, true);
    }
    this.#place();
  }

  #hidePopup() {
    const popup = this.popup;
    if (!popup?.hasAttribute('data-open')) return;
    popup.removeAttribute('data-open');
    try { popup.hidePopover?.(); } catch { /* already closed */ }
    document.removeEventListener('pointerdown', this.#onOutside, true);
    window.removeEventListener('resize', this.#place);
    window.removeEventListener('scroll', this.#place, true);
  }

  #place = () => {
    const popup = this.popup, trigger = this.trigger;
    if (!popup || !trigger) return;
    // Offset is 1u (styles/geometry.ts --u).
    const unit = parseFloat(window.getComputedStyle(this).getPropertyValue('--u')) || 4;
    const p = placePopup(trigger.getBoundingClientRect(), { width: window.innerWidth, height: window.innerHeight }, unit);
    Object.assign(popup.style, {
      left: `${p.left}px`, top: p.top == null ? 'auto' : `${p.top}px`, bottom: p.bottom == null ? 'auto' : `${p.bottom}px`,
      minWidth: `${p.minWidth}px`, maxHeight: `${p.maxHeight}px`,
    });
  };

  #focusTrigger = () => { if (!this.isDisabled) this.focus(); };

  #onTriggerClick = () => {
    if (this.isDisabled) return;
    this.#open.value ? this.#close() : this.#openAt(undefined);
  };

  #onKeydown = (e: KeyboardEvent) => {
    if (this.isDisabled) return;
    const items = this.#items();
    const open = this.#open.value;
    const intent = selectKeyIntent(open, e, this.#typeahead.busy());
    if (!open) {
      if (intent === 'open') { e.preventDefault(); this.#openAt(undefined); }
      else if (intent === 'open-first') { e.preventDefault(); this.#openAt(firstEnabled(items)); }
      else if (intent === 'open-last') { e.preventDefault(); this.#openAt(lastEnabled(items)); }
      else if (isPrintableKey(e)) {
        const i = this.#typeahead(items, this.#active.value, e.key);
        if (i !== undefined) { e.preventDefault(); this.#openAt(i); }
      }
      return;
    }
    switch (intent) {
      case 'close': e.preventDefault(); this.#close(); return;
      case 'commit': e.preventDefault(); this.#commit(this.#active.value); return;
      case 'commit-tab': this.#commit(this.#active.value); return;
      case 'move': {
        e.preventDefault();
        const key = e.key === 'PageDown' ? 'End' : e.key === 'PageUp' ? 'Home' : e.key;
        const i = navigate(items, this.#active.value, key);
        if (i !== undefined) this.#active.value = i;
        return;
      }
    }
    if (isPrintableKey(e)) {
      const i = this.#typeahead(items, this.#active.value, e.key);
      if (i !== undefined) { e.preventDefault(); this.#active.value = i; }
    }
  };

  #onOptionClick = (e: Event) => {
    const o = (e.target as Element).closest?.('ui-option');
    if (!o) return;
    const i = this.options.indexOf(o as any);
    if (i < 0 || this.options[i].disabled) return;
    this.#commit(i);
    this.focus();
  };

  // Keep focus on the trigger while interacting with the popup.
  #keepFocus = (e: Event) => e.preventDefault();

  #onOutside = (e: Event) => { if (!this.contains(e.target as Node)) this.#close(); };

  #onBlur = () => { this.#close(); this.markTouched(); };
}

define('ui-select', UISelect);

declare global {
  interface HTMLElementTagNameMap { 'ui-select': UISelect }
}
