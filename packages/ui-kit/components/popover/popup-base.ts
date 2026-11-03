// The anchored-popup element base shared by <ui-popover>, <ui-tooltip> and <ui-preview-card>
// (Base UI Popover, Tooltip, PreviewCard: Root › Trigger, Positioner › Popup, Arrow). One host
// holds the trigger and a positioner in the top layer; the positioner holds the popup and, when
// authored, the arrow:
//   host (display: contents) › [data-part=trigger], [data-part=positioner][popover] › [data-part=popup] · [data-part=arrow]
// The anchored positioner (dom/popup.ts) places the positioner 1u from the trigger on the preferred
// side unless it does not fit (CSS anchor positioning where available, script elsewhere) and
// centers the arrow; the floating layer's dismiss layer (dom/floating.ts) closes it on an outside press,
// Escape or focus leaving, and a focus scope moves focus in (popover) or not (tooltip, preview
// card). Hover intent (dom/popup.ts) opens after `delay` and closes after `close-delay`.
// Each subclass dispatches its own openchange (scripts/manifests.ts reads the dispatch site).
import { UIElement, signal } from '../../core/index.ts';
import {
  applyAttrs, buttonAttrs, createAnchoredPositioner, createDismissLayer, createFocusScope, createHoverIntent, eventDetails, hideTopLayer,
  isHoverPointer, onButtonKeydown, popupDataAttrs, showTopLayer, uid,
  type Align, type ChangeReason, type Side,
} from '../../dom/index.ts';
import { applyRecipe } from '../classes.ts';

const on = (v: unknown) => (v ? '' : undefined);
const SIDES = ['top', 'bottom', 'left', 'right'];
const ALIGNS = ['start', 'center', 'end'];

/** The properties every anchored popup has (spread into each subclass's static properties). */
export const POPUP_PROPERTIES = {
  /** Whether the popup is shown (Base UI open). Setting it fires no openchange. */
  open: { type: Boolean, default: false, reflect: true },
  /** Open at first connect when no open attribute is present (Base UI defaultOpen). */
  defaultOpen: { type: Boolean, default: false, attribute: 'default-open' },
  /** Never opens. */
  disabled: { type: Boolean, default: false, reflect: true },
  /** Preferred side of the trigger (Base UI Positioner side); flips when there is no room. */
  side: { type: String, default: '' },
  /** Alignment along that side (Base UI Positioner align). */
  align: { type: String, default: '' },
  /** Hover: open after the pointer rests this long on the trigger, ms (Base UI delay). */
  delay: { type: Number, default: null },
  /** Hover: close this long after the pointer leaves trigger and popup, ms (Base UI closeDelay). */
  closeDelay: { type: Number, default: null, attribute: 'close-delay' },
} as const;

export interface PopupConfig {
  /** Recipe classes by slot (styled-system/recipes/<name>.js). */
  recipe: () => Record<string, string>;
  /** Defaults: side, align, delay and closeDelay (ms). */
  side: Side; align: Align; delay: number; closeDelay: number;
  /** Open on a trigger press; on hover; on keyboard focus of the trigger. */
  press: boolean; hover: boolean; focus: boolean;
  /** Close when focus leaves trigger and popup (dismiss layer focus-out). */
  focusOut: boolean;
  /** Move focus into the popup when a press opens it; trap it there (modal). */
  moveFocus: boolean; trap: boolean;
  /** Close when the trigger is pressed while open from hover (tooltip closeOnClick). */
  pressCloses: boolean;
  /** The popup's role and the trigger's link to it. */
  role?: 'dialog' | 'tooltip';
  /** Skip the delay and motion right after another popup of the group closed (tooltip). */
  warm?: () => boolean;
  onClosed?: () => void;
}

export abstract class UIPopupBase extends UIElement {
  declare open: boolean;
  declare defaultOpen: boolean;
  declare disabled: boolean;
  declare side: string;
  declare align: string;
  declare delay: number | null;
  declare closeDelay: number | null;

  /** How this popup opens, closes and moves focus. */
  protected abstract config(): PopupConfig;
  /** Dispatch openchange (cancelable) with the detail; false when canceled. */
  protected abstract emitOpenChange(detail: { open: boolean; reason: ChangeReason; event: Event | undefined }): boolean;
  /** Build the generated trigger when the author wrote none. */
  protected abstract makeTrigger(): HTMLElement | undefined;
  /** Fill a generated popup from the host's remaining children (and properties). */
  protected abstract fillPopup(popup: HTMLElement, rest: Node[]): void;

  #trigger?: HTMLElement;
  #positioner?: HTMLElement;
  #popup?: HTMLElement;
  #arrow?: HTMLElement;
  #settled = false;
  #shown = false;
  #anchor = '';
  #side = signal<Side>('bottom');
  #instant = signal(false);
  /** Why the last open happened (focus moves in only when a press opened it). */
  #reason: ChangeReason = 'none';

  #positionerApi = createAnchoredPositioner({
    anchor: () => this.#trigger, positioner: () => this.#positioner, surface: () => this.#popup, arrow: () => this.#arrow,
    side: () => this.placement.side, align: () => this.placement.align,
    onPlace: (s) => { this.#side.value = s; },
  });
  #dismiss = createDismissLayer({
    inside: () => [this.#trigger, this.#positioner],
    onDismiss: (reason, e) => this.setOpen(false, reason, e),
    focusOut: false,
  });
  #focus = createFocusScope(() => this.#popup, { returnFocus: () => this.#trigger });
  #hover = createHoverIntent({
    delay: () => (this.config().warm?.() ? 0 : this.delay ?? this.config().delay),
    closeDelay: () => this.closeDelay ?? this.config().closeDelay,
    onOpen: (e) => this.setOpen(true, 'trigger-hover', e),
    onClose: (e) => this.setOpen(false, 'trigger-hover', e),
  });

  /** The trigger part. */
  get trigger() { return this.#trigger; }
  /** The positioner part (in the top layer while open). */
  get positioner() { return this.#positioner; }
  /** The popup part. */
  get popup() { return this.#popup; }
  /** The arrow part, when authored. */
  get arrow() { return this.#arrow; }
  /** The preferred side and alignment: the attributes, else the component's defaults. */
  get placement(): { side: Side; align: Align } {
    const c = this.config();
    return { side: (SIDES.includes(this.side) ? this.side : c.side) as Side, align: (ALIGNS.includes(this.align) ? this.align : c.align) as Align };
  }

  connected() {
    if (!this.#trigger) this.#build();
    if (!this.#settled) {
      this.#settled = true;
      if (!this.hasAttribute('open') && this.defaultOpen) this.open = true;
    }
  }

  disconnected() {
    this.#hover.cancel();
    this.#hide();
  }

  #build() {
    const own = (sel: string) => this.querySelector<HTMLElement>(`:scope > ${sel}`) ?? undefined;
    let positioner = own('[data-part=positioner]');
    let popup = positioner?.querySelector<HTMLElement>(':scope > [data-part=popup]') ?? own('[data-part=popup]');
    let arrow = (positioner ?? popup)?.querySelector<HTMLElement>(':scope > [data-part=arrow]') ?? popup?.querySelector<HTMLElement>(':scope > [data-part=arrow]') ?? undefined;
    const trigger = own('[data-part=trigger]') ?? this.makeTrigger();
    if (!popup) {
      popup = document.createElement('div');
      this.fillPopup(popup, [...this.childNodes].filter((n) => n !== trigger && n !== positioner));
    }
    // A preset arrow (a direct [data-part=arrow] child) went into the generated popup.
    arrow ??= popup.querySelector<HTMLElement>(':scope > [data-part=arrow]') ?? undefined;
    positioner ??= document.createElement('div');
    if (!trigger) throw new Error(`<${this.localName}> needs a trigger: a [data-part=trigger] child`);
    trigger.setAttribute('data-part', 'trigger');
    positioner.setAttribute('data-part', 'positioner');
    popup.setAttribute('data-part', 'popup');
    positioner.setAttribute('popover', 'manual');
    // The arrow sits beside the popup in the positioner, so the popup can scroll without clipping it.
    positioner.replaceChildren(popup, ...(arrow ? [arrow] : []));
    this.replaceChildren(trigger, positioner);
    this.#trigger = trigger;
    this.#positioner = positioner;
    this.#popup = popup;
    this.#arrow = arrow;
    popup.id ||= uid(`${this.localName.slice(3)}-popup`);
    // A per-instance anchor name (a custom property, so one recipe rule serves every instance).
    this.#anchor = `--${uid('anchor')}`;
    this.style.setProperty('--ui-anchor', this.#anchor);
    // A trigger that is not focusable on its own (a plain element) becomes a button.
    const focusable = trigger.matches('ui-button, ui-toggle, a[href], [tabindex], [role=button], [contenteditable]');
    if (!focusable) {
      applyAttrs(trigger, buttonAttrs({}));
      trigger.addEventListener('keydown', (e) => onButtonKeydown(e, { disabled: this.disabled }, () => trigger.click()));
    }
    trigger.addEventListener('click', this.#onTriggerClick);
    trigger.addEventListener('pointerenter', this.#onEnter);
    trigger.addEventListener('pointerleave', this.#onLeave);
    trigger.addEventListener('focusin', this.#onFocus);
    trigger.addEventListener('focusout', this.#onBlur);
    positioner.addEventListener('pointerenter', this.#onEnter);
    positioner.addEventListener('pointerleave', this.#onLeave);
    positioner.addEventListener('click', this.#onPopupClick);
    this.wire(trigger, popup);
  }

  /** After the parts exist: subclasses link them (title and description ids, …). */
  protected wire(_trigger: HTMLElement, _popup: HTMLElement) {}

  /**
   * Open or close from an interaction: openchange (cancelable) with Base UI's details; unless
   * prevented, the open property follows. False when nothing changed.
   */
  setOpen(open: boolean, reason: ChangeReason, event?: Event) {
    if (open === this.open || (open && this.disabled)) return false;
    if (!this.emitOpenChange({ open, ...eventDetails(reason, event) })) return false;
    this.#reason = reason;
    this.open = open;
    return true;
  }

  #onTriggerClick = (e: Event) => {
    const c = this.config();
    if (this.disabled) return;
    if (c.press) { this.#hover.cancel(); this.setOpen(!this.open, 'trigger-press', e); }
    else if (c.pressCloses && this.open) { this.#hover.cancel(); this.setOpen(false, 'trigger-press', e); }
  };

  #onEnter = (e: Event) => {
    if (!this.config().hover || this.disabled || !isHoverPointer(e)) return;
    // Entering the popup (hoverable) only cancels a pending close.
    this.#hover.enter(e, e.currentTarget === this.#trigger && !this.open);
  };

  #onLeave = (e: Event) => {
    if (!this.config().hover || !isHoverPointer(e)) return;
    // A popup opened by a press stays until it is dismissed.
    if (this.open && this.#reason === 'trigger-press') return;
    this.#hover.leave(e);
  };

  #onFocus = (e: FocusEvent) => {
    if (!this.config().focus || this.disabled || this.open) return;
    let visible = true;
    try { visible = (e.target as Element).matches(':focus-visible'); } catch { /* engines without :focus-visible */ }
    if (visible) this.setOpen(true, 'trigger-focus', e);
  };

  #onBlur = (e: FocusEvent) => {
    if (!this.config().focus || !this.open || this.#reason === 'trigger-press') return;
    const to = e.relatedTarget as Node | null;
    if (to && (this.#positioner?.contains(to) || this.#trigger?.contains(to))) return;
    this.#hover.cancel();
    this.setOpen(false, 'focus-out', e);
  };

  // A Close part (Base UI Close) closes the popup.
  #onPopupClick = (e: Event) => {
    const close = (e.target as Element).closest?.('[data-part=close]');
    if (close && this.#positioner?.contains(close)) this.setOpen(false, 'close-press', e);
  };

  update() {
    const t = this.#trigger, pos = this.#positioner, p = this.#popup;
    if (!t || !pos || !p) return;
    const c = this.config();
    const open = this.open, disabled = this.disabled;
    const { side: want, align } = this.placement;
    const side = open ? this.#side.value : want;
    const instant = open && this.#instant.value;
    const state = popupDataAttrs({ open, side, align });
    applyAttrs(this, { 'data-open': on(open), 'data-closed': on(!open), 'data-disabled': on(disabled) });
    applyAttrs(t, {
      'data-popup-open': on(open),
      ...(c.role === 'dialog' ? { 'aria-haspopup': 'dialog', 'aria-expanded': String(open), 'aria-controls': p.id } : {}),
    });
    if (c.role === 'tooltip') {
      // aria-describedby names the tooltip beside any description the trigger already has.
      const ids = (t.getAttribute('aria-describedby') ?? '').split(/\s+/).filter((i) => i && i !== p.id);
      applyAttrs(t, { 'aria-describedby': [...ids, p.id].join(' ') });
    }
    applyAttrs(pos, { ...state, 'data-placement': `${side}-${align}`, 'data-instant': instant ? 'delay' : undefined });
    applyAttrs(p, { role: c.role, ...state, 'data-instant': instant ? 'delay' : undefined });
    if (this.#arrow) applyAttrs(this.#arrow, { 'aria-hidden': 'true', ...state });
    this.decorate(t, p, open);
    if (open) this.#show(); else this.#hide();
    applyRecipe(this, c.recipe(), (slot) => slot === 'trigger' ? t : slot === 'positioner' ? pos : slot === 'popup' ? p : slot === 'arrow' ? this.#arrow : p.querySelector(`[data-part=${slot}]`), this.localName);
  }

  /** Per-update attributes a subclass adds (aria-modal, aria-labelledby, …). */
  protected decorate(_trigger: HTMLElement, _popup: HTMLElement, _open: boolean) {}

  #show() {
    const pos = this.#positioner!;
    const c = this.config();
    if (!this.#shown) {
      this.#shown = true;
      this.#instant.value = !!c.warm?.();
      // Each opening starts from the preferred side.
      this.#side.value = this.placement.side;
      showTopLayer(pos);
      this.#dismiss = createDismissLayer({
        inside: () => [this.#trigger, this.#positioner],
        onDismiss: (reason, e) => this.setOpen(false, reason, e),
        focusOut: c.focusOut,
      });
      this.#dismiss.activate();
      this.#positionerApi.start();
      if (c.moveFocus && (this.#reason === 'trigger-press')) {
        this.#focus = createFocusScope(() => this.#popup, { trap: c.trap, returnFocus: () => this.#trigger });
        this.#focus.activate();
      }
    } else this.#positionerApi.update();
  }

  #hide() {
    if (!this.#shown) return;
    this.#shown = false;
    this.#focus.deactivate();
    this.#dismiss.deactivate();
    this.#positionerApi.stop();
    if (this.#positioner) hideTopLayer(this.#positioner);
    this.#reason = 'none';
    this.config().onClosed?.();
  }
}
