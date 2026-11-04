// <ui-dialog>: a window over the page (Base UI Dialog: Root, Trigger, Backdrop, Popup, Title,
// Description, Close). Authored as a preset (`<ui-dialog label="Title" description="…">content
// </ui-dialog>`: the label becomes the title, the children the popup) or with its parts as
// [data-part] children: a trigger (any element, usually a ui-button) outside the popup, an optional
// backdrop, and a popup holding a title, a description, content, an actions row and close parts
// (any element, usually ui-buttons). The host draws nothing itself (display: contents).
// Opening puts the backdrop and popup in the top layer and, while modal (Base UI's default), locks
// page scroll, makes the rest of the page inert and traps focus in the popup (dom/dialog.ts on
// dom/floating.ts). Escape, an outside press (the backdrop) and the close parts close it, with
// Base UI's reasons; focus returns to the element focused before (the trigger). A dialog inside
// another's popup is nested. AlertDialog and Drawer extend this class.
import { UIElement, define } from '../../core/index.ts';
import { applyAttrs, createModalLayer, eventDetails, insideOpenLayer, parseModal, uid, type ChangeReason } from '../../dom/index.ts';
import { applyRecipe } from '../classes.ts';
import { dialog } from '../../styled-system/recipes/dialog.js';

const on = (v: unknown) => (v ? '' : undefined);
/** The CSS-only layout containers: a part inside one still belongs to the dialog. */
const CONTAINERS = new Set(['ui-container']);

export class UIDialog extends UIElement {
  static properties = {
    open: { type: Boolean, default: false, reflect: true },
    defaultOpen: { type: Boolean, default: false, attribute: 'default-open' },
    modal: { type: String, default: 'true' },
    disablePointerDismissal: { type: Boolean, default: false, attribute: 'disable-pointer-dismissal' },
    label: { type: String, default: '' },
    description: { type: String, default: '' },
  };
  declare open: boolean;
  declare defaultOpen: boolean;
  declare modal: string;
  declare disablePointerDismissal: boolean;
  declare label: string;
  declare description: string;

  /** The popup's role: dialog, or alertdialog (AlertDialog). */
  static popupRole = 'dialog';

  #trigger?: HTMLElement;
  #backdrop?: HTMLElement;
  #popup?: HTMLElement;
  #title?: HTMLElement;
  #desc?: HTMLElement;
  #ownTitle = false;
  #ownDesc = false;
  #settled = false;
  #nested = false;
  #layer = createModalLayer({
    popup: () => this.#popup,
    backdrop: () => this.#backdrop,
    trigger: () => this.#trigger,
    modal: () => this.modalMode,
    pointerDismissal: () => this.pointerDismissal,
    initialFocus: () => this.initialFocus(),
    onDismiss: (reason, event) => this.request(false, reason, event),
    onNested: (n) => {
      if (!this.#popup) return;
      applyAttrs(this.#popup, { 'data-nested-dialog-open': on(n > 0) });
      if (n > 0) this.#popup.style.setProperty('--nested-dialogs', String(n)); else this.#popup.style.removeProperty('--nested-dialogs');
    },
  });

  /** The trigger part (opens the dialog). */
  get trigger() { return this.#trigger; }
  /** The backdrop part. */
  get backdrop() { return this.#backdrop; }
  /** The popup part (role=dialog). */
  get popup() { return this.#popup; }
  /** Whether an outside press closes it (not disable-pointer-dismissal). AlertDialog: never. */
  protected get pointerDismissal() { return !this.disablePointerDismissal; }
  /** Base UI modal from the modal attribute. AlertDialog: always modal. */
  protected get modalMode() { return parseModal(this.modal); }
  /** This dialog's own parts named `part` inside its popup (not those of a nested dialog or a kit control). */
  protected ownParts(part: string): HTMLElement[] {
    const popup = this.#popup;
    return popup ? [...popup.querySelectorAll<HTMLElement>(`[data-part=${part}]`)].filter((el) => this.#mine(el)) : [];
  }
  /** Where focus goes on open: an [autofocus] element inside the popup, else the first tabbable. */
  protected initialFocus(): HTMLElement | undefined {
    return this.#popup?.querySelector<HTMLElement>('[autofocus]') ?? undefined;
  }
  /** The generated recipe classes for host and parts. */
  protected classes(): Record<string, string> { return dialog(); }
  /** Extra attributes on the popup (Drawer: data-swipe-direction). */
  protected popupAttrs(): Record<string, string | undefined> { return {}; }
  /** Called after the layer opened or closed (Drawer: swipe). */
  protected layerChanged(_open: boolean) {}

  connected() {
    if (!this.#popup) this.#build();
    if (!this.#settled) {
      this.#settled = true;
      if (!this.hasAttribute('open') && this.defaultOpen) this.open = true;
    }
  }

  disconnected() {
    // Removed while open: lift the page's inert and scroll lock (reconnecting reopens it).
    if (this.#layer.active) this.#layer.close();
  }

  #build() {
    const direct = (p: string) => [...this.children].find((c) => c.getAttribute('data-part') === p) as HTMLElement | undefined;
    const trigger = direct('trigger');
    let backdrop = direct('backdrop'), popup = direct('popup');
    if (!popup) {
      // Preset: everything but the trigger and backdrop is the popup's content.
      popup = document.createElement('div');
      popup.append(...[...this.childNodes].filter((n) => n !== trigger && n !== backdrop));
    }
    backdrop ??= document.createElement('div');
    backdrop.setAttribute('data-part', 'backdrop');
    popup.setAttribute('data-part', 'popup');
    const own = (p: string) => [...popup!.querySelectorAll<HTMLElement>(`[data-part=${p}]`)].find((el) => this.#mine(el, popup!));
    const title = own('title'), desc = own('description');
    popup.id ||= uid('dialog-popup');
    if (title) title.id ||= uid('dialog-title');
    if (desc) desc.id ||= uid('dialog-description');
    this.#trigger = trigger;
    this.#backdrop = backdrop;
    this.#popup = popup;
    this.#title = title;
    this.#desc = desc;
    this.replaceChildren(...(trigger ? [trigger] : []), backdrop, popup);
    this.addEventListener('click', (e) => this.#onClick(e));
  }

  /** The preset's title (h2) and description (p), generated once their property has text (it may arrive after connect). */
  #generateText(popup: HTMLElement) {
    if (this.label && !this.#title) {
      const t = this.#title = document.createElement('h2');
      t.setAttribute('data-part', 'title'); t.id = uid('dialog-title');
      this.#ownTitle = true;
      popup.prepend(t);
    }
    if (this.description && !this.#desc) {
      const d = this.#desc = document.createElement('p');
      d.setAttribute('data-part', 'description'); d.id = uid('dialog-description');
      this.#ownDesc = true;
      if (this.#ownTitle) this.#title!.after(d); else popup.prepend(d);
    }
    if (this.#ownTitle) { this.#title!.textContent = this.label; this.#title!.hidden = !this.label; }
    if (this.#ownDesc) { this.#desc!.textContent = this.description; this.#desc!.hidden = !this.description; }
  }

  /** Whether a part inside the popup belongs to this dialog (not to one nested in it). */
  #mine(el: Element, popup = this.#popup) {
    // Between the part and the popup there may be plain elements and the CSS-only containers, but no
    // other kit component: a ui-input's description or a nested dialog's close is theirs.
    for (let n = el.parentElement; n; n = n.parentElement) {
      if (n === popup) return true;
      if (n.localName.startsWith('ui-') && !CONTAINERS.has(n.localName)) return false;
    }
    return false;
  }

  #onClick(e: MouseEvent) {
    const target = e.target as Element;
    const trigger = target.closest?.('[data-part=trigger]');
    if (trigger && trigger === this.#trigger) {
      if (trigger.hasAttribute('data-disabled') || trigger.getAttribute('aria-disabled') === 'true') return;
      this.request(!this.open, 'trigger-press', e);
      return;
    }
    const close = target.closest?.('[data-part=close]');
    if (close && this.#mine(close) && !close.hasAttribute('data-disabled')) this.request(false, 'close-press', e);
  }

  /** Ask to open or close: a cancelable openchange { open, reason, event }; sets open unless canceled. */
  protected request(open: boolean, reason: ChangeReason, event?: Event) {
    if (open === this.open) return;
    const e = new CustomEvent('openchange', { bubbles: true, cancelable: true, detail: { open, ...eventDetails(reason, event) } });
    if (this.dispatchEvent(e)) this.open = open;
  }

  update() {
    const popup = this.#popup, backdrop = this.#backdrop, t = this.#trigger;
    if (!popup || !backdrop) return;
    const open = this.open && this.isConnected, modal = this.modalMode;
    this.#generateText(popup);
    // Nested: inside another open dialog's popup (decided when it opens).
    if (open && !this.#layer.active) this.#nested = insideOpenLayer(this);
    const state = { 'data-open': on(open), 'data-closed': on(!open) };
    applyAttrs(this, state);
    backdrop.hidden = this.#nested;
    applyAttrs(backdrop, { ...state, 'aria-hidden': 'true', popover: 'manual' });
    const ctor = this.constructor as typeof UIDialog;
    applyAttrs(popup, {
      role: ctor.popupRole, 'aria-modal': modal === true ? 'true' : undefined, tabindex: '-1', popover: 'manual',
      'aria-labelledby': this.#title && !this.#title.hidden ? this.#title.id : undefined, 'aria-describedby': this.#desc && !this.#desc.hidden ? this.#desc.id : undefined,
      ...state, 'data-nested': on(this.#nested), ...this.popupAttrs(),
    });
    if (t) applyAttrs(t, { 'aria-haspopup': 'dialog', 'aria-expanded': String(open), 'aria-controls': popup.id, 'data-popup-open': on(open) });
    applyRecipe(this, this.classes(), (slot) => slot === 'trigger' ? t
      : slot === 'backdrop' ? backdrop : slot === 'popup' ? popup
      : slot === 'title' ? this.#title : slot === 'description' ? this.#desc
      : slot === 'actions' ? [...popup.querySelectorAll('[data-part=actions]')].find((el) => this.#mine(el))
      : slot === 'close' ? undefined : undefined, 'dialog');
    for (const c of popup.querySelectorAll('[data-part=close]')) if (this.#mine(c)) applyRecipe(c, { root: this.classes().close ?? '' }, () => null, 'dialog');
    if (open && !this.#layer.active) { this.#layer.open(); this.layerChanged(true); }
    else if (!open && this.#layer.active) { this.#layer.close(); this.layerChanged(false); }
  }
}

define('ui-dialog', UIDialog);

declare global {
  interface HTMLElementTagNameMap { 'ui-dialog': UIDialog }
}
