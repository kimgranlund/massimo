// <ui-range>: slider (role="slider") with a 4u thumb on a 1u track. Arrow keys step,
// PageUp/Down move 10%, Home/End jump; pointer drag with capture. Form-associated.
// <ui-progress>: progress bar (role="progressbar"); no `value` means indeterminate.
// Both expose the fill ratio as --ui-ratio (0..1), a continuous value carried by a variable.
import { UIElement, UIFormElement, define, html, signal } from '../../core/index.ts';
import { applyAttrs, progressState, rangeDataAttrs, rangeKey, ratioOf, sliderAttrs, snap, valueAt } from '../../dom/index.ts';
import { applyRecipe, partOf } from '../classes.ts';
import { range, progress } from '../../styled-system/recipes/index.js';

/** Track and indicator (Base UI Slider.Indicator / Progress.Indicator) parts of a range or progress host. */
const trackPart = (host: Element) => (slot: string) => slot === 'indicator' ? partOf(partOf(host, 'track') ?? host, 'indicator') : partOf(host, slot);

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
  #dragging = signal(false);
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
    return html`<span data-part="track"><span data-part="indicator"></span></span><span data-part="thumb"></span>`;
  }

  update() {
    const s = { ...this.#state, value: snap(this.value, this.#state) };
    applyAttrs(this, { ...sliderAttrs({ ...s, disabled: this.isDisabled, label: this.label, valueText: this.valueText || undefined }), ...rangeDataAttrs({ dragging: this.#dragging.value }) });
    this.style.setProperty('--ui-ratio', String(ratioOf(s)));
    applyRecipe(this, range(), trackPart(this));
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
    // The thumb's center travels from track/2 to width − track/2 (the track is the host height).
    const rect = this.getBoundingClientRect();
    return valueAt(e.clientX, rect, rect.height, this.#state, this.#rtl());
  }

  #onPointerDown = (e: PointerEvent) => {
    if (this.isDisabled || e.button !== 0) return;
    e.preventDefault();
    this.focus();
    this.setPointerCapture?.(e.pointerId);
    this.#dragging.value = true;
    this.#set(this.#fromPointer(e), false);
    const move = (ev: PointerEvent) => this.#set(this.#fromPointer(ev), false);
    const up = () => {
      this.removeEventListener('pointermove', move);
      this.removeEventListener('pointerup', up);
      this.removeEventListener('pointercancel', up);
      this.#dragging.value = false;
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

  template() { return html`<span data-part="track"><span data-part="indicator"></span></span>`; }

  update() {
    const p = progressState(this.value, this.max);
    applyAttrs(this, {
      role: 'progressbar',
      'aria-valuemin': 0, 'aria-valuemax': this.max,
      'aria-valuenow': p.indeterminate ? undefined : p.value,
      'aria-label': this.label || undefined,
      ...p.attrs,
    });
    this.style.setProperty('--ui-ratio', String(p.ratio));
    applyRecipe(this, progress(), trackPart(this));
  }
}

define('ui-range', UIRange);
define('ui-progress', UIProgress);

declare global {
  interface HTMLElementTagNameMap { 'ui-range': UIRange; 'ui-progress': UIProgress }
}
