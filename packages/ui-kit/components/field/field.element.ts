// <ui-field>: a visible label (with an optional unit suffix), one control, an optional readout and
// an optional description. The authored control stays where the author (or React) put it; the field
// adds its parts as siblings and the recipe places every child by part:
//   [label: contents · suffix (unit)] [control] [readout]
//   [description]
// The label names the control: aria-labelledby on the control's role host, or, for a control whose
// role sits inside it (ui-input's editor, ui-select's trigger), its `labelledby` property, which
// forwards the ids to that element. No hide-label, no native <label>.
// <ui-field-grid>: shared columns label | control | readout; each ui-field in it is a subgrid row, so
// labels line up at the widest one. Other children (headings) span every column.
import { UIElement, define } from '../../core/index.ts';
import { uid } from '../../dom/index.ts';
import { applyRecipe, partOf, setClasses } from '../classes.ts';
import { field } from '../../styled-system/recipes/field.js';
import { fieldGrid } from '../../styled-system/recipes/field-grid.js';

export type FieldLayout = 'stacked' | 'inline';

/** The field's own parts; every other element child is the control. */
const PARTS = new Set(['label', 'readout', 'description']);
/** Roles a label press activates (like a native <label> on a checkbox); other controls get focus. */
const TOGGLES = new Set(['checkbox', 'switch', 'radio']);

const span = (part: string) => { const el = document.createElement('span'); el.setAttribute('data-part', part); return el; };
const tokens = (v: string | null) => (v ?? '').split(/\s+/).filter(Boolean);
/** The control the field wired, the attributes it used and the ids it put there. */
type Wired = { el: Element; attr: string; ids: string[]; dattr: string; dids: string[] };

export class UIField extends UIElement {
  static properties = {
    label: { type: String, default: '' },
    /** Unit shown at the label's end ("px"); part of the control's accessible name. */
    unit: { type: String, default: '' },
    /** Readout text in the readout column (a slot="readout" child replaces it). */
    readout: { type: String, default: '' },
    description: { type: String, default: '' },
    layout: { type: String, default: 'stacked' },
  };
  declare label: string;
  declare unit: string;
  declare readout: string;
  declare description: string;
  declare layout: FieldLayout;

  #id = '';
  #observer?: MutationObserver;
  /** The element that carries our ids, and the ids it carries, so a rewire can take them back. */
  #wired?: Wired;

  /** Ids of the label text and the unit: what the control's aria-labelledby lists. */
  get labelIds() { return [`${this.#id}-label`, ...(this.unit ? [`${this.#id}-unit`] : [])]; }
  /** The labelled control: the first element child that is not one of the field's parts. */
  get control() { return [...this.children].find((c) => !PARTS.has(c.getAttribute('data-part') ?? '') && c.getAttribute('slot') !== 'readout') ?? null; }

  connected() {
    this.#id = this.id ? `${this.id}-field` : uid('field');
    // Controls come and go (React remounts a keyed child, adds a readout): sort and wire again.
    this.#observer = new MutationObserver(() => this.update());
    this.#observer.observe(this, { childList: true });
    this.addEventListener('click', this.#onLabelClick);
  }

  disconnected() {
    this.#observer?.disconnect();
    this.removeEventListener('click', this.#onLabelClick);
  }

  update() {
    const label = this.#part('label', 'prepend');
    let text = partOf(label, 'contents') as HTMLElement | null, unit = partOf(label, 'suffix') as HTMLElement | null;
    if (!text) { text = span('contents'); unit = span('suffix'); label.append(text, unit); }
    text.id = `${this.#id}-label`;
    text.textContent = this.label;
    unit!.id = `${this.#id}-unit`;
    unit!.textContent = this.unit;
    unit!.hidden = !this.unit;
    label.hidden = !this.label;

    // A slot="readout" child is the readout; otherwise the readout attribute fills a span.
    const slotted = [...this.children].find((c) => c.getAttribute('slot') === 'readout');
    const own = [...this.children].find((c) => c.getAttribute('data-part') === 'readout' && c.getAttribute('slot') !== 'readout') as HTMLElement | undefined;
    if (slotted) { slotted.setAttribute('data-part', 'readout'); own?.remove(); }
    else {
      const r = own ?? this.#part('readout', 'append');
      r.textContent = this.readout;
      r.hidden = !this.readout;
    }

    const description = this.#part('description', 'append');
    description.id = `${this.#id}-desc`;
    description.textContent = this.description;
    description.hidden = !this.description;

    this.#wire();
    applyRecipe(this, field({ layout: this.layout === 'inline' ? 'inline' : 'stacked' }), (slot) =>
      slot === 'contents' || slot === 'suffix' ? partOf(label, slot) : [...this.children].find((c) => c.getAttribute('data-part') === slot));
  }

  focus(options?: FocusOptions) { (this.control as HTMLElement | null)?.focus(options); }

  /** The field's own part, created once (label first; readout and description last). */
  #part(name: string, at: 'prepend' | 'append') {
    let el = [...this.children].find((c) => c.getAttribute('data-part') === name && c.getAttribute('slot') !== 'readout') as HTMLElement | undefined;
    if (!el) { el = span(name); this[at](el); }
    return el;
  }

  /**
   * Point the control at the label (and description). A control that forwards names to an inner
   * role element declares a `labelledby` attribute; any other ui-* control or element with a role
   * takes aria-labelledby on its host. A plain wrapper (a div of several controls) is left alone:
   * its controls name themselves (they can list this field's label id in their own labelledby).
   */
  #wire() {
    const el = this.control;
    const name = this.label ? this.labelIds : [];
    const desc = this.description ? [`${this.#id}-desc`] : [];
    const prev = this.#wired;
    if (prev && (prev.el !== el)) { this.#unwire(prev); this.#wired = undefined; }
    if (!el) return;
    const tag = el.localName;
    const ctor = customElements.get(tag) as (CustomElementConstructor & { observedAttributes?: string[] }) | undefined;
    if (!ctor && tag.includes('-')) { customElements.whenDefined(tag).then(() => this.isConnected && this.#wire()); return; }
    const forwards = !!ctor?.observedAttributes?.includes('labelledby');
    if (!forwards && !tag.startsWith('ui-') && !el.hasAttribute('role')) return;
    const attr = forwards ? 'labelledby' : 'aria-labelledby', dattr = forwards ? 'describedby' : 'aria-describedby';
    const cur = this.#wired;
    const set = (a: string, old: string[], ids: string[]) => {
      const keep = tokens(el.getAttribute(a)).filter((t) => !old.includes(t));
      const next = [...ids, ...keep.filter((t) => !ids.includes(t))].join(' ');
      if (next) { if (el.getAttribute(a) !== next) el.setAttribute(a, next); } else el.removeAttribute(a);
    };
    set(attr, cur?.ids ?? [], name);
    set(dattr, cur?.dids ?? [], desc);
    this.#wired = { el, attr, ids: name, dattr, dids: desc };
  }

  #unwire(w: Wired) {
    for (const [a, ids] of [[w.attr, w.ids], [w.dattr, w.dids]] as const) {
      const rest = tokens(w.el.getAttribute(a)).filter((t) => !ids.includes(t));
      if (rest.length) w.el.setAttribute(a, rest.join(' ')); else w.el.removeAttribute(a);
    }
  }

  // A press on the label acts like a native <label>: toggles a choice, otherwise focuses the control.
  #onLabelClick = (e: Event) => {
    const label = partOf(this, 'label');
    if (!label || !label.contains(e.target as Node)) return;
    const el = this.control as HTMLElement | null;
    if (!el || el.getAttribute('aria-disabled') === 'true' || el.hasAttribute('disabled')) return;
    if (TOGGLES.has(el.getAttribute('role') ?? '')) el.click();
    else el.focus();
  };
}

export class UIFieldGrid extends UIElement {
  update() { setClasses(this, fieldGrid().root); }
}

define('ui-field', UIField);
define('ui-field-grid', UIFieldGrid);

declare global {
  interface HTMLElementTagNameMap { 'ui-field': UIField; 'ui-field-grid': UIFieldGrid }
}
