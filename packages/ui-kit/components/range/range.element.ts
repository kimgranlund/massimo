// <ui-range>: slider (role="slider") with a 4u thumb on a 1u track. Arrow keys step,
// PageUp/Down move 10%, Home/End jump; pointer drag with capture. Form-associated.
// A pair value (value="20,80", or an array; Base UI Slider with value [start, end]) renders two
// thumbs: the host becomes a group and each thumb is a slider and a tab stop; thumbs stop at each
// other (they may meet, never cross); a press moves the nearer thumb; the indicator runs between
// them. The form gets one entry per thumb under the name.
// <ui-progress>: progress bar (role="progressbar"); no `value` means indeterminate.
// Both expose the fill ratio as --ui-ratio (0..1), a continuous value carried by a variable; a pair
// also sets --ui-ratio-start on the host (the indicator's start) and --ui-ratio on each thumb.
// Composition (optional): track › indicator and thumb may be authored as [data-part] children; each
// is adopted onto the generated part (attributes, classes; the thumb's content), absent ones generated.
import { UIElement, define } from '../../core/element.ts';
import { UIFormElement, settleDefault } from '../../core/form-element.ts';
import { html } from '../../core/template.ts';
import { signal } from '../../core/signals.ts';
import { applyAttrs } from '../../dom/attrs.ts';
import { eventDetails, type ChangeReason } from '../../dom/events.ts';
import { nearestThumb, pairGroupAttrs, pairKey, pairRatios, pairThumbAttrs, parsePair, progressState, rangeDataAttrs, rangeKey, setPairValue, snapPair, type RangePair, ratioOf, sliderAttrs, snap, thumbValueText, valueAt } from '../../dom/range.ts';
import { applyRecipe, partOf, setClasses } from '../classes.ts';
import { adoptPart, authoredParts } from '../slots.ts';
import { range } from '../../styled-system/recipes/range.js';
import { progress } from '../../styled-system/recipes/progress.js';

/** Track and indicator (Base UI Slider.Indicator / Progress.Indicator) parts of a range or progress host. */
const trackPart = (host: Element) => (slot: string) => slot === 'indicator' ? partOf(partOf(host, 'track') ?? host, 'indicator') : partOf(host, slot);
/** The parts an author may write (composition), by path. */
const AUTHORED = ['track', 'track > indicator', 'thumb'];
/** The thumb parts of a range host, in order. */
const thumbsOf = (host: Element) => [...host.children].filter((c) => c.getAttribute('data-part') === 'thumb') as HTMLElement[];
/** Adopt authored parts (collected at connect) onto the generated ones, once per render of the template. */
function adoptTrack(host: Element, authored: Map<string, Element>, thumbs: Element[] = []) {
  if (!authored.size) return;
  const find = trackPart(host);
  adoptPart(authored.get('track'), find('track'));
  adoptPart(authored.get('track > indicator'), find('indicator'));
  const made = thumbsOf(host);
  if (thumbs.length) thumbs.forEach((t, i) => adoptPart(t, made[i], 'replace'));
  else adoptPart(authored.get('thumb'), find('thumb'), 'replace');
  authored.clear();
}

export class UIRange extends UIFormElement {
  static properties = {
    ...UIFormElement.properties,
    /** A number, or a pair [start, end] (attribute "20,80") for two thumbs. */
    value: { type: Number, default: 50 },
    /** The value at first render and on form reset; without it, the value attribute, else the value at connect (Base UI defaultValue). */
    defaultValue: { type: Number, default: null },
    min: { type: Number, default: 0 },
    max: { type: Number, default: 100 },
    step: { type: Number, default: 1 },
    label: { type: String, default: '' },
    valueText: { type: String, default: '', attribute: 'value-text' },
  };
  declare value: number | number[];
  declare defaultValue: number | number[] | null;
  declare min: number;
  declare max: number;
  declare step: number;
  declare label: string;
  declare valueText: string;

  #dragging = signal(false);
  /** The thumb being dragged in a pair (-1: none). */
  #active = signal(-1);
  #authored = new Map<string, Element>();
  #authoredThumbs: Element[] = [];
  get #bounds() { return { min: this.min, max: this.max, step: this.step }; }
  get #state() { return { value: this.value as number, ...this.#bounds }; }
  /** The pair, snapped and ordered, when the value is a pair. */
  get #pair(): RangePair | undefined { const p = parsePair(this.value); return p && snapPair(p, this.#bounds); }

  /** A pair attribute ("20,80") parses to a list; anything else as a number. */
  attributeChangedCallback(name: string, old: string | null, v: string | null) {
    const pair = name === 'value' || name === 'default-value' ? parsePair(v) : undefined;
    if (pair) (this as any)[name === 'value' ? 'value' : 'defaultValue'] = pair;
    else super.attributeChangedCallback(name, old, v);
  }

  connected() {
    this.#authored = authoredParts(this, AUTHORED);
    this.#authoredThumbs = thumbsOf(this).length > 1 ? thumbsOf(this) : [];
    settleDefault(this, 50, this.value);
    this.addEventListener('keydown', this.#onKeydown);
    this.addEventListener('pointerdown', this.#onPointerDown);
    this.addEventListener('focusout', this.#onBlur);
  }

  disconnected() {
    this.removeEventListener('keydown', this.#onKeydown);
    this.removeEventListener('pointerdown', this.#onPointerDown);
    this.removeEventListener('focusout', this.#onBlur);
  }

  template() {
    return this.#pair
      ? html`<span data-part="track"><span data-part="indicator"></span></span><span data-part="thumb"></span><span data-part="thumb"></span>`
      : html`<span data-part="track"><span data-part="indicator"></span></span><span data-part="thumb"></span>`;
  }

  update() {
    const pair = this.#pair;
    const data = rangeDataAttrs({ dragging: this.#dragging.value });
    if (pair) {
      applyAttrs(this, { ...pairGroupAttrs({ disabled: this.isDisabled, label: this.label }), ...data });
      const [r0, r1] = pairRatios(pair, this.#bounds);
      this.style.setProperty('--ui-ratio-start', String(r0));
      this.style.setProperty('--ui-ratio', String(r1));
      adoptTrack(this, this.#authored, this.#authoredThumbs);
      applyRecipe(this, range(), trackPart(this));
      thumbsOf(this).forEach((t, i) => {
        applyAttrs(t, pairThumbAttrs(pair, i, { ...this.#bounds, disabled: this.isDisabled, label: this.label, dragging: this.#active.value === i, valueText: this.valueText }));
        t.style.setProperty('--ui-ratio', String(i ? r1 : r0));
        setClasses(t, range().thumb, 'recipe');
      });
      return;
    }
    const s = { ...this.#state, value: snap(this.value as number, this.#state) };
    applyAttrs(this, { ...sliderAttrs({ ...s, disabled: this.isDisabled, label: this.label, valueText: thumbValueText(this.valueText, s.value) }), ...data });
    this.style.removeProperty('--ui-ratio-start');
    this.style.setProperty('--ui-ratio', String(ratioOf(s)));
    adoptTrack(this, this.#authored);
    applyRecipe(this, range(), trackPart(this));
  }

  formValue(): string | FormData {
    const pair = this.#pair;
    if (!pair) return String(this.value);
    if (!this.name) return pair.join(',');
    const data = new FormData();
    for (const v of pair) data.append(this.name, String(v));
    return data;
  }
  valueKey(value: string | File | FormData | null) { return value instanceof FormData ? [...value.values()].join(',') : super.valueKey(value); }
  resetValue() { const d = this.defaultValue ?? 50; this.value = Array.isArray(d) ? [...d] : d; }
  restoreValue(state: unknown) {
    if (state == null) return;
    const pair = state instanceof FormData ? parsePair([...state.values()]) : parsePair(state);
    this.value = pair ?? Number(state);
  }

  #rtl() { return getComputedStyle(this).direction === 'rtl'; }

  /** Set the value from an interaction: input on every change (Base UI onValueChange); a pair names the moved thumb (activeThumbIndex). */
  #set(v: number | RangePair, reason: ChangeReason, event: Event, thumb?: number) {
    const cur = this.#pair;
    if (Array.isArray(v) ? cur && v[0] === cur[0] && v[1] === cur[1] : v === this.value) return false;
    this.value = v;
    this.dispatchEvent(new CustomEvent('input', { bubbles: true, detail: { value: Array.isArray(v) ? [...v] : v, ...(thumb === undefined ? {} : { activeThumbIndex: thumb }), ...eventDetails(reason, event) } }));
    return true;
  }

  /** change once the interaction ends with a new value (Base UI onValueCommitted). */
  #commit(reason: ChangeReason, event: Event) {
    const v = this.#pair ?? this.value;
    this.dispatchEvent(new CustomEvent('change', { bubbles: true, detail: { value: Array.isArray(v) ? [...v] : v, ...eventDetails(reason, event) } }));
  }

  #onKeydown = (e: KeyboardEvent) => {
    if (this.isDisabled) return;
    const pair = this.#pair;
    if (pair) {
      const thumb = thumbsOf(this).indexOf((e.target as Element).closest?.('[data-part=thumb]') as HTMLElement);
      if (thumb < 0) return;
      const next = pairKey(e.key, pair, thumb, this.#bounds, this.#rtl());
      if (!next) return;
      e.preventDefault();
      if (this.#set(next, 'keyboard', e, thumb)) this.#commit('keyboard', e);
      return;
    }
    const v = rangeKey(e.key, this.#state, this.#rtl());
    if (v === undefined) return;
    e.preventDefault();
    if (this.#set(v, 'keyboard', e)) this.#commit('keyboard', e);
  };

  #fromPointer(e: PointerEvent) {
    // The thumb's center travels from track/2 to width − track/2 (the track is the host height).
    const rect = this.getBoundingClientRect();
    return valueAt(e.clientX, rect, rect.height, this.#state, this.#rtl());
  }

  #onPointerDown = (e: PointerEvent) => {
    if (this.isDisabled || e.button !== 0) return;
    e.preventDefault();
    const pair = this.#pair;
    // A pair moves the pressed thumb, else the one nearer the press, and focuses it.
    const pressed = thumbsOf(this).indexOf((e.target as Element).closest?.('[data-part=thumb]') as HTMLElement);
    const thumb = pair ? (pressed >= 0 ? pressed : nearestThumb(pair, this.#fromPointer(e))) : -1;
    const to = (ev: PointerEvent) => pair ? setPairValue(this.#pair!, thumb, this.#fromPointer(ev)) : this.#fromPointer(ev);
    (pair ? thumbsOf(this)[thumb] : this).focus();
    this.setPointerCapture?.(e.pointerId);
    this.#dragging.value = true;
    this.#active.value = thumb;
    const start = String(this.#pair ?? this.value);
    let dragged = false;
    if (!pair || pressed < 0) this.#set(to(e), 'track-press', e, pair ? thumb : undefined);
    const move = (ev: PointerEvent) => { if (this.#set(to(ev), 'drag', ev, pair ? thumb : undefined)) dragged = true; };
    const up = (ev: PointerEvent) => {
      this.removeEventListener('pointermove', move);
      this.removeEventListener('pointerup', up);
      this.removeEventListener('pointercancel', up);
      this.#dragging.value = false;
      this.#active.value = -1;
      if (String(this.#pair ?? this.value) !== start) this.#commit(dragged ? 'drag' : 'track-press', ev);
    };
    this.addEventListener('pointermove', move);
    this.addEventListener('pointerup', up);
    this.addEventListener('pointercancel', up);
  };

  #onBlur = (e: FocusEvent) => { if (!this.contains(e.relatedTarget as Node | null)) this.markTouched(); };
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
  #authored = new Map<string, Element>();

  connected() { this.#authored = authoredParts(this, AUTHORED); }

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
    adoptTrack(this, this.#authored);
    applyRecipe(this, progress(), trackPart(this));
  }
}

define('ui-range', UIRange);
define('ui-progress', UIProgress);

declare global {
  interface HTMLElementTagNameMap { 'ui-range': UIRange; 'ui-progress': UIProgress }
}
