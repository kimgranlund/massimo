// <ui-range>: slider (role="slider") with a 4u thumb on a 1u track. Arrow keys step,
// PageUp/Down move 10%, Home/End jump; pointer drag with capture. Form-associated.
// <ui-progress>: progress bar (role="progressbar"); no `value` means indeterminate.
// Both expose the fill ratio as --ui-ratio (0..1), a continuous value carried by a variable.
import { UIElement, UIFormElement, define, html } from '../../core/index.ts';
import { applyAttrs, rangeKey, ratioOf, sliderAttrs, snap, valueAt } from '../../dom/index.ts';

export class UIRange extends UIFormElement {
  static properties = {
    ...UIFormElement.properties,
    value: { type: Number, default: 50 },
    min: { type: Number, default: 0 },
    max: { type: Number, default: 100 },
    step: { type: Number, default: 1 },
    label: { type: String, default: '' },
    valueText: { type: String, default: '', attribute: 'value-text' },
  };
  declare value: number;
  declare min: number;
  declare max: number;
  declare step: number;
  declare label: string;
  declare valueText: string;

  #default = 50;
  get #state() { return { value: this.value, min: this.min, max: this.max, step: this.step }; }

  connected() {
    this.#default = this.hasAttribute('value') ? Number(this.getAttribute('value')) : this.value;
    this.addEventListener('keydown', this.#onKeydown);
    this.addEventListener('pointerdown', this.#onPointerDown);
    this.addEventListener('blur', this.#onBlur);
  }

  disconnected() {
    this.removeEventListener('keydown', this.#onKeydown);
    this.removeEventListener('pointerdown', this.#onPointerDown);
    this.removeEventListener('blur', this.#onBlur);
  }

  template() {
    return html`<span data-part="track"><span data-part="fill"></span></span><span data-part="thumb"></span>`;
  }

  update() {
    const s = { ...this.#state, value: snap(this.value, this.#state) };
    applyAttrs(this, sliderAttrs({ ...s, disabled: this.isDisabled, label: this.label, valueText: this.valueText || undefined }));
    this.style.setProperty('--ui-ratio', String(ratioOf(s)));
  }

  formValue() { return String(this.value); }
  resetValue() { this.value = this.#default; }
  restoreValue(state: unknown) { if (state != null) this.value = Number(state); }

  #rtl() { return getComputedStyle(this).direction === 'rtl'; }

  #set(v: number, commit: boolean) {
    if (v !== this.value) { this.value = v; this.dispatchEvent(new Event('input', { bubbles: true })); }
    if (commit) this.dispatchEvent(new Event('change', { bubbles: true }));
  }

  #onKeydown = (e: KeyboardEvent) => {
    if (this.isDisabled) return;
    const v = rangeKey(e.key, this.#state, this.#rtl());
    if (v === undefined) return;
    e.preventDefault();
    this.#set(v, true);
  };

  #fromPointer(e: PointerEvent) {
    const thumb = (this.querySelector('[data-part=thumb]') as HTMLElement)?.offsetWidth ?? 0;
    return valueAt(e.clientX, this.getBoundingClientRect(), thumb, this.#state, this.#rtl());
  }

  #onPointerDown = (e: PointerEvent) => {
    if (this.isDisabled || e.button !== 0) return;
    e.preventDefault();
    this.focus();
    this.setPointerCapture?.(e.pointerId);
    this.#set(this.#fromPointer(e), false);
    const move = (ev: PointerEvent) => this.#set(this.#fromPointer(ev), false);
    const up = () => {
      this.removeEventListener('pointermove', move);
      this.removeEventListener('pointerup', up);
      this.removeEventListener('pointercancel', up);
      this.dispatchEvent(new Event('change', { bubbles: true }));
    };
    this.addEventListener('pointermove', move);
    this.addEventListener('pointerup', up);
    this.addEventListener('pointercancel', up);
  };

  #onBlur = () => this.markTouched();
}

export class UIProgress extends UIElement {
  static properties = {
    value: { type: Number, default: null },
    max: { type: Number, default: 100 },
    label: { type: String, default: '' },
  };
  declare value: number | null;
  declare max: number;
  declare label: string;

  template() { return html`<span data-part="track"><span data-part="fill"></span></span>`; }

  update() {
    const indeterminate = this.value == null || Number.isNaN(this.value);
    const v = indeterminate ? 0 : Math.min(this.max, Math.max(0, this.value!));
    applyAttrs(this, {
      role: 'progressbar',
      'aria-valuemin': 0, 'aria-valuemax': this.max,
      'aria-valuenow': indeterminate ? undefined : v,
      'aria-label': this.label || undefined,
      'data-indeterminate': indeterminate || undefined,
    });
    this.style.setProperty('--ui-ratio', String(this.max ? v / this.max : 0));
  }
}

define('ui-range', UIRange);
define('ui-progress', UIProgress);

declare global {
  interface HTMLElementTagNameMap { 'ui-range': UIRange; 'ui-progress': UIProgress }
}
