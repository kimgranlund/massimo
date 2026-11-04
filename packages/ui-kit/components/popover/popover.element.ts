// <ui-popover>: a popup anchored to a trigger, holding interactive content (Base UI Popover: Root,
// Trigger, Positioner, Popup, Arrow, Title, Description, Close). Preset:
//   <ui-popover label="Notifications"><p data-part="title">…</p>…content…</ui-popover>
// (the label becomes a ui-button trigger, the children the popup), or parts as [data-part]
// children: [data-part=trigger] (any element; a plain one becomes role=button) and
// [data-part=popup] holding [data-part=title], [data-part=description], [data-part=close] and an
// optional [data-part=arrow]. A press on the trigger opens it and moves focus in (role=dialog,
// labelled by its title, described by its description); an outside press, Escape, focus leaving
// (non-modal) or a Close part close it and focus returns to the trigger. `modal` traps focus.
// `open-on-hover` also opens it from the pointer resting on the trigger (Base UI openOnHover).
// Shared machinery: popup-base.ts.
import { define } from '../../core/element.ts';
import { applyAttrs, uid } from '../../dom/attrs.ts';
import { type ChangeReason } from '../../dom/events.ts';
import { popover } from '../../styled-system/recipes/popover.js';
import { POPUP_PROPERTIES, UIPopupBase, type PopupConfig } from './popup-base.ts';
import '../button/button.element.ts';

export class UIPopover extends UIPopupBase {
  static properties = {
    ...POPUP_PROPERTIES,
    /** Trap focus inside the popup while open (Base UI modal). */
    modal: { type: Boolean, default: false },
    /** Also open when the pointer rests on the trigger (Base UI Trigger openOnHover). */
    openOnHover: { type: Boolean, default: false, attribute: 'open-on-hover' },
    /** Text of a generated trigger (a ui-button), in the preset form. */
    label: { type: String, default: '' },
  };
  declare modal: boolean;
  declare openOnHover: boolean;
  declare label: string;

  protected config(): PopupConfig {
    return {
      recipe: () => popover(), side: 'bottom', align: 'center', delay: 300, closeDelay: 0,
      press: true, hover: this.openOnHover, focus: false, focusOut: !this.modal,
      moveFocus: true, trap: this.modal, pressCloses: false, role: 'dialog',
    };
  }

  protected emitOpenChange(detail: { open: boolean; reason: ChangeReason; event: Event | undefined }) {
    return this.dispatchEvent(new CustomEvent('openchange', { bubbles: true, cancelable: true, detail }));
  }

  protected makeTrigger() {
    const b = document.createElement('ui-button');
    b.textContent = this.label;
    return b;
  }

  protected fillPopup(popup: HTMLElement, rest: Node[]) { popup.append(...rest); }

  protected wire(_t: HTMLElement, p: HTMLElement) {
    for (const part of ['title', 'description']) {
      const el = p.querySelector(`[data-part=${part}]`);
      if (el) el.id ||= uid(`popover-${part}`);
    }
  }

  protected decorate(_t: HTMLElement, p: HTMLElement, _open: boolean) {
    applyAttrs(p, {
      'aria-modal': this.modal ? 'true' : undefined,
      'aria-labelledby': p.querySelector('[data-part=title]')?.id || undefined,
      'aria-describedby': p.querySelector('[data-part=description]')?.id || undefined,
      tabindex: -1,
    });
  }

  update() {
    // Read here so the effect re-runs when they change (config() reads them).
    void this.modal; void this.openOnHover;
    super.update();
  }
}

define('ui-popover', UIPopover);

declare global {
  interface HTMLElementTagNameMap { 'ui-popover': UIPopover }
}
