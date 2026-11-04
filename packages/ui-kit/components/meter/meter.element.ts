// <ui-meter>: a measurement within a known range (role="meter", Base UI Meter): a label and the
// formatted value over the progress track. The value text is formatNumber of the value with
// `format` (Intl.NumberFormat options as JSON, Base UI format) or, by default, the ratio as a
// percentage; it is also aria-valuetext unless value-text overrides it. The fill ratio reaches CSS
// as --ui-ratio (a continuous value carried by a variable).
// Composition (optional): label, value, track and track › indicator may be authored as [data-part]
// children; each is adopted onto the generated part (attributes, classes), label text seeds `label`.
import { UIElement, define } from '../../core/element.ts';
import { html } from '../../core/template.ts';
import { applyAttrs, uid } from '../../dom/attrs.ts';
import { meterState } from '../../dom/display.ts';
import type { FormatNumberOptions } from '../../tokens/typography/format.ts';
import { applyRecipe, partOf } from '../classes.ts';
import { adoptPart, authoredParts, partText } from '../slots.ts';
import { meter } from '../../styled-system/recipes/meter.js';

const AUTHORED = ['label', 'value', 'track', 'track > indicator'];
const find = (host: Element) => (slot: string) => slot === 'indicator' ? partOf(partOf(host, 'track') ?? host, 'indicator') : partOf(host, slot);

export class UIMeter extends UIElement {
  static properties = {
    value: { type: Number, default: 0 },
    min: { type: Number, default: 0 },
    max: { type: Number, default: 100 },
    label: { type: String, default: '' },
    /** Intl.NumberFormat options for the value text: an object, or JSON in the attribute. */
    format: { default: null },
    locale: { type: String, default: '' },
    valueText: { type: String, default: '', attribute: 'value-text' },
  };
  declare value: number;
  declare min: number;
  declare max: number;
  declare label: string;
  declare format: FormatNumberOptions | string | null;
  declare locale: string;
  declare valueText: string;

  #authored = new Map<string, Element>();
  #labelId = uid('meter-label');

  connected() {
    this.#authored = authoredParts(this, AUTHORED);
    const text = partText(this.#authored.get('label'));
    if (text && !this.label) this.label = text;
  }

  template() {
    return html`<span data-part="label"></span><span data-part="value"></span><span data-part="track"><span data-part="indicator"></span></span>`;
  }

  #options(): FormatNumberOptions | null {
    const f = this.format;
    if (!f) return null;
    if (typeof f !== 'string') return f;
    try { return JSON.parse(f); } catch { return null; }
  }

  update() {
    const m = meterState({ value: this.value, min: this.min, max: this.max, format: this.#options(), locale: this.locale || undefined, valueText: this.valueText });
    const parts = find(this);
    const label = parts('label') as HTMLElement, value = parts('value') as HTMLElement;
    if (this.#authored.size) {
      for (const p of AUTHORED) adoptPart(this.#authored.get(p), parts(p.includes('>') ? 'indicator' : p));
      this.#authored.clear();
    }
    if (!label.id) label.id = this.#labelId;
    label.textContent = this.label;
    label.hidden = !this.label;
    value.textContent = m.formatted;
    applyAttrs(this, { ...m.attrs, 'aria-labelledby': this.label ? label.id : undefined });
    applyAttrs(value, { 'aria-hidden': 'true' });
    this.style.setProperty('--ui-ratio', String(m.ratio));
    applyRecipe(this, meter(), parts);
  }
}

define('ui-meter', UIMeter);

declare global {
  interface HTMLElementTagNameMap { 'ui-meter': UIMeter }
}
