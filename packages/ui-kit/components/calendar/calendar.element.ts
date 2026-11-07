// <ui-calendar>: a keyboard-navigable month grid choosing one Gregorian date, or a range with
// mode="range". Names come from Intl, and days are ISO strings. Arrow keys move a day or a week, Home
// and End the week, PageUp and PageDown a month, and with Shift a year.
import { UIFormElement, settleDefault } from '../../core/form-element.ts';
import { define } from '../../core/element.ts';
import { html } from '../../core/template.ts';
import { signal } from '../../core/signals.ts';
import '../button/button.element.ts';
import { addMonths, calendarCells, calendarKey, inBounds, monthLabel, orderRange, parseIso, todayIso, weekdays, weekStart } from '../../dom/calendar.ts';
import { eventDetails } from '../../dom/events.ts';
import { applyRecipe, partOf, setClasses } from '../classes.ts';
import { calendar } from '../../styled-system/recipes/calendar.js';

export class UICalendar extends UIFormElement {
  static properties = {
    ...UIFormElement.properties,
    /** An ISO date, or start/end with mode="range". */
    value: { type: String, default: '' },
    min: { type: String, default: '' },
    max: { type: String, default: '' },
    locale: { type: String, default: '' },
    mode: { type: String, default: 'single' },
    label: { type: String, default: 'Choose a date' },
  };
  declare value: string;
  declare min: string;
  declare max: string;
  declare locale: string;
  declare mode: 'single' | 'range';
  declare label: string;

  #focus = signal('');
  #anchor = '';
  /** A key moved the focus day: the rebuilt grid takes focus back. */
  #refocus = false;
  get #range() { const [a = '', b = ''] = this.mode === 'range' ? this.value.split('/') : []; return [a, b]; }
  get focusDate() { return this.#focus.value || this.#range[0] || (parseIso(this.value) ? this.value : '') || todayIso(); }

  connected() { settleDefault(this, ''); }
  template() {
    return html`<div data-part="header">
      <ui-button variant="ghost" aria-label="Previous month" @click=${() => this.#month(-1)}><i slot="leading" name="caret-left"></i></ui-button>
      <span data-part="title" aria-live="polite"></span>
      <ui-button variant="ghost" aria-label="Next month" @click=${() => this.#month(1)}><i slot="leading" name="caret-right"></i></ui-button>
    </div><div data-part="grid" role="grid" @keydown=${this.#onKey} @click=${this.#onClick}></div>`;
  }

  update() {
    const c = calendar(), loc = this.locale || undefined, start = weekStart(loc), focus = this.focusDate, [a, b] = this.#range;
    applyRecipe(this, c, (slot) => partOf(this, slot) ?? (partOf(this, 'header') && partOf(partOf(this, 'header')!, slot)));
    const title = this.querySelector('[data-part=title]');
    if (title) title.textContent = monthLabel(focus, loc);
    const grid = partOf(this, 'grid') as HTMLElement | null;
    if (!grid) return;
    grid.setAttribute('aria-label', this.label);
    const had = this.#refocus || grid.contains(document.activeElement);
    this.#refocus = false;
    const row = (children: HTMLElement[]) => { const r = document.createElement('div'); r.setAttribute('role', 'row'); r.setAttribute('data-part', 'row'); setClasses(r, c.row); r.append(...children); return r; };
    const head = row(weekdays(start, loc).map((d) => { const s = document.createElement('span'); s.setAttribute('role', 'columnheader'); s.setAttribute('aria-label', d.long); s.setAttribute('data-part', 'weekday'); setClasses(s, c.weekday); s.textContent = d.short; return s; }));
    const weeks = calendarCells({ focus, start, value: this.mode === 'single' ? this.value : undefined, rangeStart: a, rangeEnd: b, min: this.min, max: this.max, today: todayIso(), locale: loc }).map((w) => row(w.map((cell) => {
      const s = document.createElement('span');
      s.setAttribute('role', 'gridcell'); s.setAttribute('data-part', 'cell'); s.setAttribute('data-date', cell.iso);
      s.setAttribute('aria-label', cell.label); s.setAttribute('aria-selected', String(cell.selected)); s.tabIndex = cell.focused ? 0 : -1;
      for (const [k, on] of [['data-outside', cell.outside], ['data-today', cell.today], ['data-in-range', cell.inRange && !cell.selected]] as const) if (on) s.setAttribute(k, '');
      if (cell.disabled) s.setAttribute('aria-disabled', 'true');
      setClasses(s, c.cell); s.textContent = String(cell.day);
      return s;
    })));
    grid.replaceChildren(head, ...weeks);
    if (had) (grid.querySelector('[tabindex="0"]') as HTMLElement | null)?.focus();
  }

  formValue() { return this.value || null; }
  resetValue() { this.value = this.getAttribute('value') ?? ''; this.#anchor = ''; }

  #month(n: number) { this.#focus.value = addMonths(this.focusDate, n); }
  #pick(iso: string, e: Event) {
    if (this.isDisabled || !inBounds(iso, this.min, this.max)) return;
    this.#focus.value = iso;
    if (this.mode === 'range') {
      if (this.#anchor) { const [s, t] = orderRange(this.#anchor, iso); this.value = `${s}/${t}`; this.#anchor = ''; } else { this.#anchor = iso; this.value = `${iso}/`; return; }
    } else this.value = iso;
    this.dispatchEvent(new CustomEvent('change', { bubbles: true, detail: { value: this.value, ...eventDetails('none', e) } }));
  }
  #onClick = (e: Event) => { const iso = (e.target as HTMLElement).closest?.('[data-date]')?.getAttribute('data-date'); if (iso) this.#pick(iso, e); };
  #onKey = (e: KeyboardEvent) => {
    const rtl = getComputedStyle(this).direction === 'rtl';
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.#pick(this.focusDate, e); return; }
    const next = calendarKey(e.key, this.focusDate, weekStart(this.locale || undefined), e.shiftKey, rtl);
    if (!next) return;
    e.preventDefault();
    this.#refocus = true;
    this.#focus.value = next;
  };
}

define('ui-calendar', UICalendar);

declare global {
  interface HTMLElementTagNameMap { 'ui-calendar': UICalendar }
}
