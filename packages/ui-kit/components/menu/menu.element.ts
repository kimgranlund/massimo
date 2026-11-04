// <ui-menu>: a menu of actions and options opened from a trigger (Base UI Menu; WAI-ARIA APG menu
// button). Authored with its parts as [data-part] children:
//   <ui-menu><div data-part="trigger">Edit</div>
//     <div data-part="popup">
//       <div data-part="item">Cut<span slot="suffix">⌘X</span></div>
//       <div data-part="separator"></div>
//       <div data-part="checkbox-item" checked>Show grid</div>
//       <div data-part="group"><div data-part="group-label">Sort</div>
//         <div data-part="radio-group" value="name"><div data-part="radio-item" value="name">Name</div>…</div></div>
//       <ui-menu><div data-part="submenu-trigger">Share</div><div data-part="popup">…</div></ui-menu>
//     </div></ui-menu>
// or as a preset: `<ui-menu label="Edit">` with the items as children (trigger and popup generated).
// A ui-menu inside a popup is a submenu (Base UI SubmenuRoot): its trigger is an item of the parent
// (submenu-trigger), it opens beside it on ArrowRight (ArrowLeft in RTL), Enter, Space, a press or a
// rest of the pointer, and ArrowLeft or Escape close it.
// The popup is a floating layer (dom/floating.ts): top layer, CSS anchor positioning (script
// elsewhere), outside press / Escape / focus-out dismissal, a focus scope that returns focus to the
// trigger. Focus moves to the highlighted item (data-highlighted): arrow keys, Home, End (wrapping),
// typeahead, hover. A press on an item fires its click and closes the menu (close-on-click="false"
// keeps it open; checkbox and radio items keep it open by default). Events: openchange { open,
// reason, event } (cancelable) on the host; change { checked, reason, event } on a checkbox item and
// { value, reason, event } on a radio group (cancelable).
import { UIElement, define } from '../../core/element.ts';
import { signal } from '../../core/signals.ts';
import { applyAttrs, uid, type Attrs } from '../../dom/attrs.ts';
import { createDismissLayer, createFocusScope, createPositioner, hideTopLayer, showTopLayer, unitOf, type Side } from '../../dom/floating.ts';
import { createSubmenuAim, MENU_ITEM_SELECTOR, menuGroupAttrs, menuItemLabel, menuIndicatorAttrs, menuItemAttrs, menuItemDisabled, menuItems, menuNavigate, menuOptionItems, menuPopupAttrs, menuSeparatorAttrs, menuTriggerAttrs, isRtl, submenuKeys, type MenuItemKind } from '../../dom/menu.ts';
import { createTypeahead, isPrintableKey } from '../../dom/listbox.ts';
import { eventDetails, type ChangeReason } from '../../dom/events.ts';
import { partOf, setClasses } from '../classes.ts';
import { arrangeSlots, claimSlots, SLOT_PARTS } from '../slots.ts';
import { menu as menuRecipe } from '../../styled-system/recipes/menu.js';
import '../../icons/index.ts';

export type MenuFocus = 'first' | 'last' | 'popup' | 'none';
export type MenuPlacement = 'anchor' | 'submenu' | 'point';
const CHECKABLE = new Set(['checkbox-item', 'radio-item']);

/** Whether a press on an item closes the menu: close-on-click ("false" keeps it open); checkable items default to false. */
export const closesOnClick = (item: Element) => {
  const v = item.getAttribute('close-on-click');
  return v === null ? !CHECKABLE.has(item.getAttribute('data-part') ?? '') : v !== 'false';
};

export class UIMenu extends UIElement {
  static properties = {
    /** Whether the popup is open (Base UI open). Setting it opens or closes without an openchange event. */
    open: { type: Boolean, default: false, reflect: true },
    /** Open at connect (Base UI defaultOpen). */
    defaultOpen: { type: Boolean, default: false, attribute: 'default-open' },
    /** Preset: the trigger's text when no trigger part is authored. */
    label: { type: String, default: '' },
    disabled: { type: Boolean, default: false },
    /** Preferred side of the trigger (Base UI Positioner side): bottom (default), top; submenus open at the inline end. */
    side: { type: String, default: 'bottom' },
    /** Alignment along that side (Base UI Positioner align): start (default), center, end. */
    align: { type: String, default: 'start' },
    /** Open when the pointer rests on the trigger (Base UI openOnHover); submenus always do. */
    openOnHover: { type: Boolean, default: false, attribute: 'open-on-hover' },
    /** The rest before a hover opens, in ms (Base UI delay). */
    delay: { type: Number, default: 100 },
  };
  declare open: boolean;
  declare defaultOpen: boolean;
  declare label: string;
  declare disabled: boolean;
  declare side: 'top' | 'bottom' | 'left' | 'right';
  declare align: 'start' | 'center' | 'end';
  declare openOnHover: boolean;
  declare delay: number;

  #trigger?: HTMLElement;
  #popup?: HTMLElement;
  #parts = signal(0);
  #highlight = signal<HTMLElement | null>(null);
  #side = signal<Side>('bottom');
  #shown = false;
  #focus: MenuFocus = 'popup';
  #hover?: ReturnType<typeof setTimeout>;
  #typeahead = createTypeahead();
  #mo?: MutationObserver;
  #layer?: { positioner: ReturnType<typeof createPositioner>; dismiss: ReturnType<typeof createDismissLayer>; scope: ReturnType<typeof createFocusScope> };
  #popupId = '';

  /** The trigger part (submenu-trigger in a submenu). */
  get trigger() { return this.#trigger; }
  get popup() { return this.#popup; }
  /** The popup's own items (item, checkbox-item, radio-item, submenu-trigger), in order. */
  get items() { return menuItems(this.#popup); }
  /** The menu whose popup holds this one (a submenu), else null. */
  get parentMenu(): UIMenu | null { return (this.parentElement?.closest('[data-part=popup]')?.closest('ui-menu, ui-context-menu') as UIMenu | null) ?? null; }
  get nested() { return !!this.parentMenu; }
  /** The highlighted (focused) item. */
  get highlighted() { return this.#highlight.peek(); }

  /** Where the popup is placed: below the trigger, beside a submenu trigger, or at a point (context menu). */
  protected placement(): MenuPlacement { return this.nested || this.barOrientation() === 'vertical' ? 'submenu' : 'anchor'; }
  /** The element the popup is placed against. */
  protected anchorElement(): Element | null | undefined { return this.#trigger; }
  /** Whether the trigger is a menubar item (the menubar owns its tab stop). */
  protected inMenubar() { return this.parentElement?.localName === 'ui-menubar'; }
  /** The orientation of the menubar this menu belongs to (a vertical bar opens its menus beside it). */
  protected barOrientation() { return this.inMenubar() ? (this.parentElement!.getAttribute('orientation') === 'vertical' ? 'vertical' : 'horizontal') : null; }
  /** Whether the trigger takes the construction pattern (an area trigger, the context menu's, does not). */
  protected slottedTrigger() { return true; }
  /** The caret a generated (preset) trigger ends with, or null for none. */
  protected generatedCaret(): string | null { return this.inMenubar() ? null : 'caret-down'; }
  /** The trigger's recipe classes (the context menu's trigger is an area with its own recipe). */
  protected triggerClass(c: Record<string, string>) { return this.nested ? `${c.item} ${c['submenu-trigger']}` : c.trigger; }
  /** The host's recipe classes. */
  protected rootClass(c: Record<string, string>) { return c.root; }
  /** Place the open popup again (after its anchor moved: a context menu reopened at another point). */
  protected place() { this.#layer?.positioner.update(); }

  connected() {
    if (!this.#popup) this.#build();
    // Moved into a popup after it was built (its parent built later): it is a submenu now.
    else if (this.nested && this.#trigger?.getAttribute('data-part') === 'trigger') this.#asSubmenuTrigger(this.#trigger);
    // Opened by markup (open, default-open): focus stays where it is.
    this.#focus = 'none';
    if (this.defaultOpen) this.open = true;
    this.#mo = new MutationObserver(() => { this.#prepare(); this.#parts.value++; });
    this.#mo.observe(this.#popup!, { childList: true, subtree: true, attributes: true, attributeFilter: ['checked', 'value', 'disabled', 'close-on-click'] });
  }

  disconnected() {
    this.#mo?.disconnect();
    clearTimeout(this.#hover);
    this.#hide();
  }

  #build() {
    const nested = this.nested;
    let trigger = [...this.children].find((c) => c.matches('[data-part=trigger], [data-part=submenu-trigger]')) as HTMLElement | undefined;
    const generated = !trigger;
    if (!trigger) {
      trigger = document.createElement('div');
      if (this.label) trigger.textContent = this.label;
      this.prepend(trigger);
    }
    const caret = this.generatedCaret();
    if (generated && !nested && caret) this.#caret(trigger, caret);
    if (nested || trigger.getAttribute('data-part') === 'submenu-trigger') this.#asSubmenuTrigger(trigger);
    else trigger.setAttribute('data-part', 'trigger');
    if (this.slottedTrigger()) { claimSlots(trigger); arrangeSlots(trigger); }
    let popup = [...this.children].find((c) => c.getAttribute('data-part') === 'popup') as HTMLElement | undefined;
    if (!popup) {
      popup = document.createElement('div');
      popup.setAttribute('data-part', 'popup');
      for (const n of [...this.childNodes]) if (n !== trigger) popup.append(n);
      this.append(popup);
    }
    popup.setAttribute('popover', 'manual');
    this.#popupId = popup.id || uid('menu-popup');
    this.#trigger = trigger;
    this.#popup = popup;
    this.#prepare();
    this.bindTrigger(trigger);
    popup.addEventListener('keydown', this.#onKeydown);
    popup.addEventListener('click', this.#onClick);
    popup.addEventListener('pointermove', this.#onPointer);
    popup.addEventListener('focusin', this.#onFocusIn);
  }

  #caret(trigger: HTMLElement, name: string) {
    if (trigger.querySelector('[slot=trailing], [data-part=trailing] > *')) return;
    const caret = document.createElement('i');
    caret.setAttribute('slot', 'trailing');
    caret.setAttribute('name', name);
    trigger.append(caret);
  }

  /** A submenu's trigger is an item of its parent popup, with a trailing caret. */
  #asSubmenuTrigger(trigger: HTMLElement) {
    trigger.setAttribute('data-part', 'submenu-trigger');
    this.#caret(trigger, 'caret-right');
    claimSlots(trigger);
    arrangeSlots(trigger);
  }

  /** Construction pattern and indicators on the popup's items (once each; idempotent). */
  #prepare() {
    for (const item of this.items) {
      const kind = item.getAttribute('data-part');
      if (kind === 'submenu-trigger') continue; // its own menu arranges it
      if (CHECKABLE.has(kind!)) {
        let ind = item.querySelector<HTMLElement>('[data-part=indicator]');
        if (!ind) {
          ind = document.createElement('span');
          ind.setAttribute('data-part', 'indicator');
          if (kind === 'checkbox-item') { const i = document.createElement('i'); i.setAttribute('name', 'check'); ind.append(i); }
          item.prepend(ind);
        }
        if (!ind.hasAttribute('slot')) ind.setAttribute('slot', 'leading');
      }
      claimSlots(item);
      arrangeSlots(item);
    }
  }

  /** Trigger behavior: press, keys and (open-on-hover, submenus) a rest of the pointer. */
  protected bindTrigger(trigger: HTMLElement) {
    trigger.addEventListener('click', (e) => {
      if (this.disabled) return;
      if (this.nested) { if (!this.open) this.openMenu('trigger-press', e, 'none'); return; }
      this.open ? this.setOpen(false, 'trigger-press', e) : this.openMenu('trigger-press', e, 'popup');
    });
    trigger.addEventListener('keydown', (e) => {
      if (this.disabled) return;
      const rtl = isRtl(this);
      if (this.nested) {
        if (e.key === 'Enter' || e.key === ' ' || e.key === submenuKeys(rtl).open) {
          e.preventDefault();
          this.openMenu(e.key.startsWith('Arrow') ? 'list-navigation' : 'trigger-press', e, 'first');
        }
        return;
      }
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.open ? this.setOpen(false, 'trigger-press', e) : this.openMenu('trigger-press', e, 'first'); }
      else if (e.key === 'ArrowDown' && !this.inMenubar()) { e.preventDefault(); this.openMenu('list-navigation', e, 'first'); }
      else if (e.key === 'ArrowUp' && !this.inMenubar()) { e.preventDefault(); this.openMenu('list-navigation', e, 'last'); }
    });
    trigger.addEventListener('pointerenter', (e) => {
      // In a menubar with a menu open, hovering another trigger switches to it at once.
      const switching = this.inMenubar() && !!this.parentElement!.querySelector(':scope > ui-menu[open]');
      if (this.disabled || this.open || !(this.nested || this.openOnHover || switching)) return;
      clearTimeout(this.#hover);
      this.#hover = setTimeout(() => this.openMenu('trigger-hover', e, 'none'), switching ? 0 : this.delay);
    });
    trigger.addEventListener('pointerleave', () => clearTimeout(this.#hover));
  }

  /**
   * Open or close from an interaction: openchange (Base UI onOpenChange: { open, reason, event }),
   * cancelable; unless prevented, the open property follows. False when nothing changed.
   */
  setOpen(open: boolean, reason: ChangeReason, event?: Event) {
    if (open === this.open || (open && this.disabled)) return false;
    if (!this.dispatchEvent(new CustomEvent('openchange', { bubbles: true, cancelable: true, detail: { open, ...eventDetails(reason, event) } }))) return false;
    this.open = open;
    return true;
  }

  /** Open from an interaction, then move focus: the first or last item, the popup, or nowhere (hover). */
  openMenu(reason: ChangeReason, event?: Event, focus: MenuFocus = 'popup') {
    this.#focus = focus;
    if (this.open) { this.#focusIn(); return true; }
    return this.setOpen(true, reason, event);
  }

  /** Close this menu and every menu it is a submenu of (an item press). */
  closeTree(reason: ChangeReason, event?: Event) {
    let root: UIMenu = this;
    while (root.parentMenu) root = root.parentMenu;
    root.setOpen(false, reason, event);
  }

  /** Move focus to an item (highlighting it). */
  highlight(item: HTMLElement | null | undefined) {
    if (!item) return;
    this.#highlight.value = item;
    if (document.activeElement !== item) item.focus({ preventScroll: true });
    item.scrollIntoView?.({ block: 'nearest' });
  }

  #focusIn() {
    const items = this.items, opts = menuOptionItems(items);
    const f = this.#focus;
    if (f === 'first' || f === 'last') {
      const i = menuNavigate(opts, -1, f === 'first' ? 'Home' : 'End');
      if (i !== undefined) { this.highlight(items[i]); return; }
    }
    if (f !== 'none') this.#popup?.focus({ preventScroll: true });
  }

  #show() {
    const popup = this.#popup!;
    this.#shown = true;
    const placement = this.placement();
    const rtl = isRtl(this);
    const side: Side = placement === 'submenu' ? (rtl ? 'left' : 'right') : this.side === 'top' ? 'top' : 'bottom';
    const align = this.align === 'center' || this.align === 'end' ? this.align : 'start';
    // Script placement is physical: in RTL a start-aligned popup lines up with the anchor's right edge.
    const physical = rtl && placement === 'anchor' ? ({ start: 'end', end: 'start', center: 'center' } as const)[align] : align;
    const positioner = createPositioner({
      anchor: () => this.anchorElement(), popup: () => this.#popup, side, align: physical,
      offset: () => unitOf(this), onSide: (s) => { this.#side.value = s; }, script: placement === 'point',
    });
    const dismiss = createDismissLayer({
      inside: () => [this], focusOut: placement !== 'submenu',
      onDismiss: (reason, e) => { if (this.setOpen(false, reason, e) && reason === 'escape-key') this.#returnFocus(); },
    });
    const scope = createFocusScope(() => this.#popup, { initialFocus: false, returnFocus: false });
    this.#layer = { positioner, dismiss, scope };
    showTopLayer(popup);
    positioner.start();
    dismiss.activate();
    scope.activate();
    queueMicrotask(() => { if (this.#shown) { positioner.update(); this.#focusIn(); } });
  }

  /** After a keyboard close: focus back on the trigger when it was inside the popup (never stolen from elsewhere). */
  #returnFocus() {
    const at = document.activeElement;
    if (!at || at === document.body || this.#popup?.contains(at)) (this.#trigger as HTMLElement | undefined)?.focus({ preventScroll: true });
  }

  #hide() {
    if (!this.#shown) return;
    this.#shown = false;
    clearTimeout(this.#hover);
    // Submenus close with their menu (no event: their parent's openchange covers it).
    for (const sub of this.#popup?.querySelectorAll<UIMenu>('ui-menu[open]') ?? []) sub.open = false;
    const focusWasInside = this.#popup?.contains(document.activeElement);
    const { positioner, dismiss, scope } = this.#layer!;
    scope.deactivate();
    dismiss.deactivate();
    positioner.stop();
    hideTopLayer(this.#popup!);
    this.#highlight.value = null;
    if (focusWasInside) this.#trigger?.focus({ preventScroll: true });
  }

  #own(target: EventTarget | null) {
    const el = (target as Element | null)?.closest?.(MENU_ITEM_SELECTOR) as HTMLElement | null;
    return el && el.parentElement?.closest('[data-part=popup]') === this.#popup ? el : null;
  }

  #onFocusIn = (e: FocusEvent) => {
    if (e.target === this.#popup) { this.#highlight.value = null; return; }
    const item = this.#own(e.target);
    if (item) this.#highlight.value = item;
  };

  #aim = createSubmenuAim();
  #onPointer = (e: PointerEvent) => {
    const subs = [...this.#popup!.querySelectorAll<UIMenu>('ui-menu[open]')].filter((sub) => sub.parentMenu === this);
    // The pointer reached an open submenu.
    if (subs.some((sub) => sub.popup?.contains(e.target as Node))) { this.#aim.cancel(); return; }
    const item = this.#own(e.target);
    // Heading for an open submenu across its siblings (the safe triangle): leave everything as it is until the pointer rests.
    const open = subs.find((sub) => sub.trigger !== item);
    if (this.#aim.hold(e, open?.popup?.getBoundingClientRect(), () => { if (item) this.#pointAt(item, e, subs); })) return;
    if (item) this.#pointAt(item, e, subs);
  };

  /** The pointer is on an item: highlight it; a sibling of an open submenu's trigger closes it. */
  #pointAt(item: HTMLElement, e: PointerEvent, subs: UIMenu[]) {
    if (item === this.#highlight.peek()) return;
    if (!menuItemDisabled(item)) this.highlight(item);
    for (const sub of subs) if (sub.open && sub.trigger !== item) sub.setOpen(false, 'trigger-hover', e);
  }

  #onKeydown = (e: KeyboardEvent) => {
    if (e.defaultPrevented || (e.target as Element).closest('[data-part=popup]') !== this.#popup) return;
    const items = this.items, opts = menuOptionItems(items);
    const current = this.#highlight.peek(), at = current ? items.indexOf(current) : -1;
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) {
      e.preventDefault();
      const i = menuNavigate(opts, at, at < 0 && e.key === 'ArrowUp' ? 'End' : at < 0 && e.key === 'ArrowDown' ? 'Home' : e.key);
      if (i !== undefined) this.highlight(items[i]);
      return;
    }
    const rtl = isRtl(this);
    if (this.nested && e.key === submenuKeys(rtl).close) {
      e.preventDefault();
      if (this.setOpen(false, 'list-navigation', e)) this.parentMenu?.highlight(this.#trigger);
      return;
    }
    if ((e.key === 'Enter' || (e.key === ' ' && !this.#typeahead.busy())) && current && current.getAttribute('data-part') !== 'submenu-trigger') {
      e.preventDefault();
      current.click();
      return;
    }
    if (isPrintableKey(e)) {
      const i = this.#typeahead(opts, at, e.key);
      if (i !== undefined) { e.preventDefault(); this.highlight(items[i]); }
    }
  };

  #onClick = (e: MouseEvent) => {
    const item = this.#own(e.target);
    if (!item) return;
    const kind = item.getAttribute('data-part') as MenuItemKind;
    if (kind === 'submenu-trigger') return;
    if (menuItemDisabled(item)) { e.preventDefault(); return; }
    if (kind === 'checkbox-item') {
      const checked = !item.hasAttribute('checked');
      if (item.dispatchEvent(new CustomEvent('change', { bubbles: true, cancelable: true, detail: { checked, ...eventDetails('item-press', e) } }))) item.toggleAttribute('checked', checked);
    } else if (kind === 'radio-item') {
      const group = item.closest('[data-part=radio-group]'), value = item.getAttribute('value') ?? menuItemLabel(item);
      if (group && group.getAttribute('value') !== value
        && group.dispatchEvent(new CustomEvent('change', { bubbles: true, cancelable: true, detail: { value, ...eventDetails('item-press', e) } }))) group.setAttribute('value', value);
    }
    if (closesOnClick(item)) this.closeTree('item-press', e);
  };

  /** The trigger's attributes (overridden by the context menu, whose trigger is an area). */
  protected triggerAttrs(open: boolean): Attrs {
    if (this.nested) {
      const a = menuItemAttrs('submenu-trigger', { disabled: this.disabled, open, popupId: this.#popupId });
      delete a['data-highlighted'];
      delete a.tabindex;
      return a;
    }
    return {
      ...menuTriggerAttrs({ open, popupId: this.#popupId, disabled: this.disabled, role: this.inMenubar() ? 'menuitem' : undefined }),
      ...(this.inMenubar() ? {} : { tabindex: this.disabled ? -1 : 0 }),
    };
  }

  update() {
    this.#parts.value;
    const trigger = this.#trigger, popup = this.#popup;
    if (!trigger || !popup) return;
    const open = this.open, highlighted = this.#highlight.value;
    if (open && !this.#shown) this.#show();
    else if (!open && this.#shown) this.#hide();
    applyAttrs(trigger, this.triggerAttrs(open));
    if (!trigger.id) trigger.id = uid('menu-trigger');
    applyAttrs(popup, menuPopupAttrs({ id: this.#popupId, open, side: this.#side.value, align: this.align === 'center' || this.align === 'end' ? this.align : 'start', labelledBy: this.placement() === 'point' ? undefined : trigger.id }));
    const c = menuRecipe({ placement: this.placement() });
    setClasses(this, this.rootClass(c));
    setClasses(trigger, this.triggerClass(c));
    if (this.slottedTrigger()) for (const s of SLOT_PARTS) setClasses(partOf(trigger, s), c[s]);
    setClasses(popup, c.popup);
    const own = (el: Element) => el.parentElement?.closest('[data-part=popup]') === popup;
    for (const item of this.items) {
      const kind = item.getAttribute('data-part') as MenuItemKind;
      const disabled = item.hasAttribute('disabled');
      if (kind === 'submenu-trigger') { applyAttrs(item, { tabindex: -1, 'data-highlighted': highlighted === item ? '' : undefined }); continue; }
      const group = kind === 'radio-item' ? item.closest('[data-part=radio-group]') : null;
      const checked = kind === 'checkbox-item' ? item.hasAttribute('checked') : kind === 'radio-item' ? !!group && group.getAttribute('value') === (item.getAttribute('value') ?? menuItemLabel(item)) : false;
      applyAttrs(item, menuItemAttrs(kind, { highlighted: highlighted === item, disabled, checked }));
      setClasses(item, `${c.item} ${c[kind]}`);
      for (const s of SLOT_PARTS) setClasses(partOf(item, s), c[s]);
      const ind = item.querySelector('[data-part=indicator]');
      if (ind) { applyAttrs(ind, menuIndicatorAttrs(checked, disabled)); setClasses(ind, c.indicator); }
    }
    for (const el of popup.querySelectorAll<HTMLElement>('[data-part=separator]')) if (own(el)) { applyAttrs(el, menuSeparatorAttrs()); setClasses(el, c.separator); }
    for (const el of popup.querySelectorAll<HTMLElement>('[data-part=group], [data-part=radio-group]')) {
      if (!own(el)) continue;
      const label = [...el.children].find((x) => x.getAttribute('data-part') === 'group-label') as HTMLElement | undefined;
      if (label) { if (!label.id) label.id = uid('menu-group'); setClasses(label, c['group-label']); }
      applyAttrs(el, menuGroupAttrs(label?.id));
      setClasses(el, c[el.getAttribute('data-part') as 'group' | 'radio-group']);
    }
    if (open) this.#layer?.positioner.update();
  }
}

define('ui-menu', UIMenu);

declare global {
  interface HTMLElementTagNameMap { 'ui-menu': UIMenu }
}
