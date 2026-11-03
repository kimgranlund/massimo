// <ui-navigation-menu>: site navigation whose items open panels of links (Base UI Navigation Menu:
// Root, List, Item, Trigger, Icon, Content, Link, Positioner, Popup, Viewport). Authored as
//   <ui-navigation-menu label="Main">
//     <div data-part="item" label="Docs"><a data-part="link" href="/docs/intro">Intro</a>…</div>
//     <div data-part="item"><a data-part="link" href="/blog">Blog</a></div>
//   </ui-navigation-menu>
// (an item with `label` gets a generated trigger and its children become its content; an item
// holding only a link is a plain link), or with every part: [data-part=list] › [data-part=item] ›
// [data-part=trigger] · [data-part=content] (ul / li work as list and items). One popup serves
// every item: the open item's content shows in the viewport of a positioner in the top layer,
// 1u below its trigger (dom/popup.ts createAnchoredPositioner); switching items animates the
// popup's size (--popup-width / --popup-height, reveal intent) and slides the new content in from
// the side it came from (data-activation-direction). Hover opens an item after `delay` (50 ms;
// moving between triggers switches at once) and closes it `close-delay` (50 ms) after the pointer
// leaves; a press toggles it; arrow keys, Home and End move between the list's triggers and links;
// ArrowDown (ArrowRight when vertical) on a trigger opens it and focuses its first link; Tab moves
// from an open trigger into its content and out to the next item; Escape, an outside press or
// focus leaving close it. A change fires a cancelable `change` ({ value, reason, event }; '' when
// closed). The behavior is dom/navigation.ts (shared with React); the popup pieces are
// popover/popup-parts.ts, dom/popup.ts and dom/floating.ts.
import { UIElement, define, signal } from '../../core/index.ts';
import {
  activationDirection, applyAttrs, buttonAttrs, createAnchoredPositioner, createDismissLayer, createNavigationController, eventDetails, hideTopLayer,
  popupDataAttrs, showTopLayer, uid, type ChangeReason, type Side,
} from '../../dom/index.ts';
import { applyRecipe, partOf, setClasses } from '../classes.ts';
import { arrangeSlots, claimSlots } from '../slots.ts';
import { navigationMenu } from '../../styled-system/recipes/navigation-menu.js';
import '../../icons/index.ts';

const on = (v: unknown) => (v ? '' : undefined);
interface Entry { item: HTMLElement; value: string; trigger?: HTMLElement; content?: HTMLElement; link?: HTMLElement }

export class UINavigationMenu extends UIElement {
  static properties = {
    /** The open item's value, '' when closed (Base UI value). Setting it fires no change. */
    value: { type: String, default: '', reflect: true },
    /** The item open at first connect (Base UI defaultValue). */
    defaultValue: { type: String, default: '', attribute: 'default-value' },
    /** horizontal (default) or vertical: the list direction, the arrow keys, the popup's side. */
    orientation: { type: String, default: 'horizontal' },
    /** The navigation landmark's name (aria-label). */
    label: { type: String, default: '' },
    /** Hover: open an item after the pointer rests this long on its trigger, ms (Base UI delay). */
    delay: { type: Number, default: 50 },
    /** Hover: close this long after the pointer leaves the triggers and the popup, ms (Base UI closeDelay). */
    closeDelay: { type: Number, default: 50, attribute: 'close-delay' },
  };
  declare value: string;
  declare defaultValue: string;
  declare orientation: string;
  declare label: string;
  declare delay: number;
  declare closeDelay: number;

  #list?: HTMLElement;
  #positioner?: HTMLElement;
  #popup?: HTMLElement;
  #viewport?: HTMLElement;
  #entries: Entry[] = [];
  #settled = false;
  #shown = false;
  #side = signal<Side>('bottom');
  #direction = '';
  #previous = '';
  #nav = createNavigationController({
    value: () => this.value, change: (v, reason, e) => this.#change(v, reason, e),
    valueOf: (t) => this.#entries.find((e) => e.trigger === t)?.value ?? '',
    vertical: () => this.#vertical, delay: () => this.delay, closeDelay: () => this.closeDelay,
  });

  #positionerApi = createAnchoredPositioner({
    anchor: () => this.#active()?.trigger, positioner: () => this.#positioner, surface: () => this.#popup,
    side: () => (this.#vertical ? 'right' : 'bottom'), align: () => 'start',
    onPlace: (s) => { this.#side.value = s; },
  });
  #dismiss = createDismissLayer({
    inside: () => [this.#list, this.#positioner],
    onDismiss: (reason, e) => this.#change('', reason, e, reason === 'escape-key'),
    focusOut: true,
  });

  get list() { return this.#list; }
  get positioner() { return this.#positioner; }
  get popup() { return this.#popup; }
  get viewport() { return this.#viewport; }
  /** The items, in order: their element, value, trigger, content and (plain items) link. */
  get items(): readonly Entry[] { return this.#entries; }
  get #vertical() { return this.orientation === 'vertical'; }
  #active() { return this.#entries.find((e) => e.value === this.value && e.content); }

  connected() {
    if (!this.#list) this.#build();
    this.#nav.attach(this);
    if (!this.#settled) {
      this.#settled = true;
      if (!this.hasAttribute('value') && this.defaultValue) this.value = this.defaultValue;
    }
  }

  disconnected() {
    this.#nav.detach();
    this.#hide();
  }

  #build() {
    const authoredList = this.querySelector<HTMLElement>(':scope > [data-part=list]');
    const list = authoredList ?? document.createElement('div');
    if (!authoredList) list.append(...[...this.children].filter((c) => c.getAttribute('data-part') === 'item' || c.localName === 'li'));
    list.setAttribute('data-part', 'list');
    const positioner = document.createElement('div'), popup = document.createElement('div'), viewport = document.createElement('div');
    positioner.setAttribute('data-part', 'positioner');
    positioner.setAttribute('popover', 'manual');
    popup.setAttribute('data-part', 'popup');
    viewport.setAttribute('data-part', 'viewport');
    popup.append(viewport);
    positioner.append(popup);
    this.#entries = [...list.children].filter((c) => c.getAttribute('data-part') === 'item' || c.localName === 'li').map((el, i) => {
      const item = el as HTMLElement;
      item.setAttribute('data-part', 'item');
      const value = item.getAttribute('value') || String(i);
      let trigger = item.querySelector<HTMLElement>(':scope > [data-part=trigger]') ?? undefined;
      let content = item.querySelector<HTMLElement>(':scope > [data-part=content]') ?? undefined;
      const link = !trigger && !content && !item.hasAttribute('label') ? item.querySelector<HTMLElement>(':scope > [data-part=link], :scope > a') ?? undefined : undefined;
      if (link) { link.setAttribute('data-part', 'link'); return { item, value, link }; }
      if (!content) {
        content = document.createElement('div');
        content.append(...[...item.childNodes].filter((n) => n !== trigger));
      }
      if (!trigger) {
        trigger = document.createElement('div');
        trigger.append(item.getAttribute('label') ?? '');
      }
      trigger.setAttribute('data-part', 'trigger');
      content.setAttribute('data-part', 'content');
      // The trigger: the construction pattern with a caret (Base UI Icon) unless the author put one there.
      claimSlots(trigger);
      if (!trigger.querySelector(':scope > [slot=trailing], :scope > [data-part=trailing] > *')) {
        const caret = document.createElement('i');
        caret.setAttribute('slot', 'trailing');
        caret.setAttribute('name', 'caret-down');
        trigger.append(caret);
      }
      arrangeSlots(trigger);
      trigger.id ||= uid('navigation-trigger');
      content.id ||= uid('navigation-content');
      item.replaceChildren(trigger);
      viewport.append(content);
      for (const a of content.querySelectorAll<HTMLElement>('a')) if (!a.hasAttribute('data-part')) a.setAttribute('data-part', 'link');
      return { item, value, trigger, content };
    });
    this.replaceChildren(list, positioner);
    this.#list = list;
    this.#positioner = positioner;
    this.#popup = popup;
    this.#viewport = viewport;
    this.style.setProperty('--ui-anchor', `--${uid('anchor')}`);
    for (const e of this.#entries) if (e.trigger && !e.trigger.matches('ui-button, [tabindex], a[href]')) applyAttrs(e.trigger, buttonAttrs({}));
    // Links take the construction pattern too ([leading] [prefix] [contents] [suffix] [trailing]).
    for (const a of this.querySelectorAll<HTMLElement>('[data-part=link]')) { claimSlots(a); arrangeSlots(a); }
  }

  /** Change the open item from an interaction: a cancelable change; unless prevented, value follows. */
  #change(value: string, reason: ChangeReason, event?: Event, refocus = false) {
    if (value === this.value) return false;
    const trigger = this.#active()?.trigger;
    if (!this.dispatchEvent(new CustomEvent('change', { bubbles: true, cancelable: true, detail: { value, ...eventDetails(reason, event) } }))) return false;
    this.value = value;
    // Closing from the content (Escape) returns focus to the trigger it belongs to.
    if (refocus && !value && trigger && this.#positioner?.contains(document.activeElement)) trigger.focus();
    else if (refocus && !value && trigger && document.activeElement === document.body) trigger.focus();
    return true;
  }

  update() {
    const list = this.#list, pos = this.#positioner, popup = this.#popup, viewport = this.#viewport;
    if (!list || !pos || !popup || !viewport) return;
    const value = this.value, vertical = this.#vertical, orientation = vertical ? 'vertical' : 'horizontal';
    const active = this.#active();
    const open = !!active;
    if (value !== this.#previous) {
      this.#direction = activationDirection(this.#entries.findIndex((e) => e.value === this.#previous), this.#entries.findIndex((e) => e.value === value), vertical);
      this.#previous = value;
    }
    const placed = open ? this.#side.value : (vertical ? 'right' : 'bottom');
    applyAttrs(this, { role: 'navigation', 'aria-label': this.label || undefined, 'data-orientation': orientation });
    applyAttrs(list, { role: list.localName === 'ul' || list.localName === 'ol' ? undefined : 'list', 'aria-orientation': undefined, 'data-orientation': orientation });
    for (const e of this.#entries) {
      const isOpen = open && e === active;
      applyAttrs(e.item, { role: e.item.localName === 'li' ? undefined : 'listitem', 'data-value': e.value });
      if (e.trigger) applyAttrs(e.trigger, { 'aria-expanded': String(isOpen), 'aria-controls': e.content!.id, 'data-popup-open': on(isOpen) });
      if (e.content) {
        e.content.hidden = !isOpen;
        applyAttrs(e.content, { 'data-open': on(isOpen), 'data-closed': on(!isOpen), 'data-activation-direction': isOpen && this.#direction ? this.#direction : undefined });
      }
    }
    for (const a of this.querySelectorAll<HTMLElement>('[data-part=link]')) applyAttrs(a, { 'data-active': on(a.hasAttribute('active')), 'aria-current': a.hasAttribute('active') ? 'page' : undefined });
    const state = popupDataAttrs({ open, side: placed, align: 'start' });
    applyAttrs(pos, { ...state, 'data-placement': `${placed}-start` });
    applyAttrs(popup, state);
    if (open) this.#show(); else this.#hide();
    applyRecipe(this, navigationMenu(), (slot) => slot === 'list' ? list : slot === 'positioner' ? pos : slot === 'popup' ? popup : slot === 'viewport' ? viewport : null, this.localName);
    const c = navigationMenu();
    for (const e of this.#entries) {
      setClasses(e.item, c.item, this.localName);
      if (e.trigger) {
        setClasses(e.trigger, c.trigger, this.localName);
        for (const s of ['leading', 'prefix', 'contents', 'suffix', 'trailing'] as const) setClasses(partOf(e.trigger, s), c[s], this.localName);
      }
      if (e.content) setClasses(e.content, c.content, this.localName);
    }
    for (const a of this.querySelectorAll('[data-part=link]')) {
      setClasses(a, c.link, this.localName);
      for (const s of ['leading', 'prefix', 'contents', 'suffix', 'trailing'] as const) setClasses(partOf(a, s), c[s], this.localName);
    }
  }

  #show() {
    const pos = this.#positioner!, popup = this.#popup!;
    if (!this.#shown) {
      this.#shown = true;
      this.#side.value = this.#vertical ? 'right' : 'bottom';
      // Opening starts at the content's size (no animation from the last one).
      popup.style.removeProperty('--popup-width');
      popup.style.removeProperty('--popup-height');
      showTopLayer(pos);
      this.#dismiss.activate();
      this.#positionerApi.start();
    } else this.#positionerApi.update();
    this.#size();
  }

  /** Size the popup to the open content (--popup-width / --popup-height, Base UI's names). */
  #size() {
    const popup = this.#popup!, content = this.#active()?.content;
    if (!content) return;
    const r = content.getBoundingClientRect();
    if (!r.width && !r.height) return;
    const cs = getComputedStyle(popup);
    const frame = (a: string, b: string) => (parseFloat(cs.getPropertyValue(`padding-${a}`)) || 0) + (parseFloat(cs.getPropertyValue(`padding-${b}`)) || 0)
      + (parseFloat(cs.getPropertyValue(`border-${a}-width`)) || 0) + (parseFloat(cs.getPropertyValue(`border-${b}-width`)) || 0);
    popup.style.setProperty('--popup-width', `${r.width + frame('left', 'right')}px`);
    popup.style.setProperty('--popup-height', `${r.height + frame('top', 'bottom')}px`);
    this.#positionerApi.update();
  }

  #hide() {
    if (!this.#shown) return;
    this.#shown = false;
    this.#dismiss.deactivate();
    this.#positionerApi.stop();
    if (this.#positioner) hideTopLayer(this.#positioner);
    this.#nav.reset();
  }
}

define('ui-navigation-menu', UINavigationMenu);

declare global {
  interface HTMLElementTagNameMap { 'ui-navigation-menu': UINavigationMenu }
}
