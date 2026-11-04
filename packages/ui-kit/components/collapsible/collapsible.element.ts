// <ui-collapsible>: a trigger that shows and hides one panel (Base UI Collapsible: Root, Trigger,
// Panel). Authored as a preset (`<ui-collapsible label="Details">content</ui-collapsible>`: the
// label becomes the trigger, the children the panel) or with its parts as [data-part] children
// (`<div data-part="trigger">…</div><div data-part="panel">…</div>`). The trigger is a role=button
// row in the construction pattern with a trailing caret (unless the author puts something there);
// the panel stays in the DOM and is `hidden` while closed, so its height animates in CSS.
// Inside a <ui-accordion> it is an accordion item: its trigger sits in a heading part and its panel
// is a labelled region (components/accordion).
import { UIElement, define } from '../../core/element.ts';
import { applyAttrs, uid } from '../../dom/attrs.ts';
import { buttonAttrs, onButtonKeydown } from '../../dom/button.ts';
import { eventDetails } from '../../dom/events.ts';
import { applyRecipe, partOf } from '../classes.ts';
import { arrangeSlots, authoredParts, claimSlots } from '../slots.ts';
import { collapsible } from '../../styled-system/recipes/collapsible.js';
import '../../icons/index.ts';

const on = (v: unknown) => (v ? '' : undefined);
const SLOT_NAMES = new Set(['leading', 'prefix', 'contents', 'suffix', 'trailing']);

export class UICollapsible extends UIElement {
  static properties = {
    open: { type: Boolean, default: false, reflect: true },
    defaultOpen: { type: Boolean, default: false, attribute: 'default-open' },
    disabled: { type: Boolean, default: false, reflect: true },
    label: { type: String, default: '' },
    value: { type: String, default: '' },
  };
  declare open: boolean;
  declare defaultOpen: boolean;
  declare disabled: boolean;
  declare label: string;
  declare value: string;

  #trigger?: HTMLElement;
  #panel?: HTMLElement;
  #header?: HTMLElement;
  #labelled = false;
  #settled = false;

  /** The trigger part (role=button). */
  get trigger() { return this.#trigger; }
  /** The panel part. */
  get panel() { return this.#panel; }
  /** An item of a ui-accordion: its trigger is in a heading and its panel a region. */
  get accordion(): (HTMLElement & { itemDisabled?: boolean; orientation?: string }) | null {
    return this.parentElement?.localName === 'ui-accordion' ? this.parentElement as any : null;
  }
  /** Disabled by its own attribute or by its accordion. */
  get isDisabled() { return this.disabled || !!(this.accordion as any)?.disabled; }

  connected() {
    if (!this.#trigger) this.#build();
    if (!this.#settled) {
      this.#settled = true;
      if (!this.hasAttribute('open') && this.defaultOpen) this.open = true;
    }
  }

  #build() {
    const authored = authoredParts(this, ['trigger', 'header > trigger', 'panel']);
    const trigger = (authored.get('trigger') ?? authored.get('header > trigger')) as HTMLElement | undefined;
    const panel = authored.get('panel') as HTMLElement | undefined;
    const header = trigger?.parentElement !== this && trigger?.parentElement?.getAttribute('data-part') === 'header' ? trigger.parentElement as HTMLElement : undefined;
    const t = trigger ?? document.createElement('div');
    const p = panel ?? document.createElement('div');
    // Preset: slotted children (slot=leading | prefix | suffix | trailing) adorn the generated trigger.
    const adorn = (n: Node) => n.nodeType === 1 && /^(leading|prefix|suffix|trailing)$/.test((n as Element).getAttribute('slot') ?? '');
    if (!trigger) t.append(...[...this.childNodes].filter((n) => n !== panel && adorn(n)));
    if (!panel) p.append(...[...this.childNodes].filter((n) => n !== header && n !== trigger && n !== t));
    t.setAttribute('data-part', 'trigger');
    p.setAttribute('data-part', 'panel');
    // The trigger's label: the label property for a generated (or empty) trigger.
    claimSlots(t);
    const hasLabel = [...t.childNodes].some((n) => (n.nodeType === 1 && !(n as Element).hasAttribute('slot') && !SLOT_NAMES.has((n as Element).getAttribute('data-part') ?? '-')) || (n.nodeType === 3 && n.textContent!.trim())
      || (n.nodeType === 1 && (n as Element).getAttribute('data-part') === 'contents' && (n.textContent ?? '').trim() !== ''));
    if (!hasLabel && this.label) { t.append(this.label); this.#labelled = true; }
    // The caret indicator, unless the author filled the trailing slot.
    if (!t.querySelector(':scope > [slot=trailing], :scope > [data-part=trailing] > *')) {
      const caret = document.createElement('i');
      caret.setAttribute('slot', 'trailing');
      caret.setAttribute('name', 'caret-down');
      t.append(caret);
    }
    arrangeSlots(t);
    t.id ||= uid('collapsible-trigger');
    p.id ||= uid('collapsible-panel');
    this.#trigger = t;
    this.#panel = p;
    this.#header = this.accordion ? header ?? document.createElement('div') : undefined;
    if (this.#header) {
      this.#header.setAttribute('data-part', 'header');
      this.#header.replaceChildren(t);
      this.replaceChildren(this.#header, p);
    } else this.replaceChildren(t, p);
    t.addEventListener('click', (e) => this.#toggle(e));
    t.addEventListener('keydown', (e) => onButtonKeydown(e, { disabled: this.isDisabled }, () => this.#toggle(e)));
  }

  #toggle(event: Event) {
    if (this.isDisabled) return;
    const open = !this.open;
    const e = new CustomEvent('openchange', { bubbles: true, cancelable: true, detail: { open, ...eventDetails('trigger-press', event) } });
    if (this.dispatchEvent(e)) this.open = open;
  }

  update() {
    const t = this.#trigger, p = this.#panel;
    if (!t || !p) return;
    const open = this.open, disabled = this.isDisabled, acc = this.accordion;
    if (this.#labelled) {
      const contents = partOf(t, 'contents') as HTMLElement | null;
      if (contents && contents.textContent !== this.label) { contents.textContent = this.label; contents.hidden = !this.label; }
    }
    const index = acc ? String([...acc.children].filter((c) => c.localName === 'ui-collapsible').indexOf(this)) : undefined;
    const item = acc ? { 'data-index': index } : {};
    applyAttrs(this, { 'data-open': on(open), 'data-closed': on(!open), 'data-disabled': on(disabled), ...item });
    applyAttrs(t, {
      ...buttonAttrs({ disabled }),
      'aria-expanded': String(open), 'aria-controls': p.id, 'data-panel-open': on(open), ...item,
    });
    if (this.#header) applyAttrs(this.#header, { role: 'heading', 'aria-level': 3, 'data-open': on(open), 'data-disabled': on(disabled), ...item });
    p.hidden = !open;
    applyAttrs(p, {
      'data-open': on(open), 'data-closed': on(!open),
      ...(acc ? { role: 'region', 'aria-labelledby': t.id, 'data-disabled': on(disabled), 'data-orientation': acc.getAttribute('orientation') === 'horizontal' ? 'horizontal' : 'vertical', ...item } : {}),
    });
    applyRecipe(this, collapsible(), (slot) => slot === 'trigger' ? t : slot === 'panel' ? p : partOf(t, slot));
  }
}

define('ui-collapsible', UICollapsible);

declare global {
  interface HTMLElementTagNameMap { 'ui-collapsible': UICollapsible }
}
