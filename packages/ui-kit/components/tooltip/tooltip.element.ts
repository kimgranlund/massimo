// <ui-tooltip>: a short text label for a control, shown while the pointer rests on it or it has
// keyboard focus (Base UI Tooltip: Root, Trigger, Positioner, Popup, Arrow). Preset:
//   <ui-tooltip content="Bold (⌘B)"><ui-button aria-label="Bold">…</ui-button></ui-tooltip>
// (the first child element is the trigger, `content` the popup's text), or parts as [data-part]
// children: [data-part=trigger] and [data-part=popup] (with an optional [data-part=arrow]). It
// opens after `delay` (600 ms) on hover, at once on keyboard focus (:focus-visible), and at once
// with no motion while the tooltip group is warm (another tooltip closed under 400 ms ago:
// data-instant="delay"); it closes when the pointer leaves trigger and popup (`close-delay`), on
// blur, a press on the trigger, an outside press or Escape. The popup is role=tooltip and the
// trigger's aria-describedby names it; focus never moves. Shared machinery: popover/popup-base.ts.
import { define } from '../../core/index.ts';
import { isWarm, markClosed, type ChangeReason } from '../../dom/index.ts';
import { tooltip } from '../../styled-system/recipes/tooltip.js';
import { POPUP_PROPERTIES, UIPopupBase, type PopupConfig } from '../popover/popup-base.ts';

export class UITooltip extends UIPopupBase {
  static properties = {
    ...POPUP_PROPERTIES,
    /** The popup's text, in the preset form. Ignored when a [data-part=popup] is authored. */
    content: { type: String, default: '' },
  };
  declare content: string;
  #generated?: HTMLElement;

  protected config(): PopupConfig {
    return {
      recipe: () => tooltip(), side: 'top', align: 'center', delay: 600, closeDelay: 0,
      press: false, hover: true, focus: true, focusOut: false,
      moveFocus: false, trap: false, pressCloses: true, role: 'tooltip',
      warm: () => isWarm(), onClosed: markClosed,
    };
  }

  protected emitOpenChange(detail: { open: boolean; reason: ChangeReason; event: Event | undefined }) {
    return this.dispatchEvent(new CustomEvent('openchange', { bubbles: true, cancelable: true, detail }));
  }

  /** The preset's trigger: the first child element. */
  protected makeTrigger() {
    return [...this.children].find((c) => !c.hasAttribute('data-part')) as HTMLElement | undefined;
  }

  protected fillPopup(popup: HTMLElement, rest: Node[]) {
    // Loose nodes besides the trigger (text, an arrow) join the content.
    popup.append(...rest);
    this.#generated = popup;
  }

  protected decorate(_t: HTMLElement, p: HTMLElement) {
    // The content property is the generated popup's text (an arrow, when authored, stays).
    if (p !== this.#generated || !this.content) return;
    const text = [...p.childNodes].find((n) => n.nodeType === 3) as Text | undefined;
    if (text) { if (text.data !== this.content) text.data = this.content; }
    else p.prepend(this.content);
  }

  update() {
    void this.content;
    super.update();
  }
}

define('ui-tooltip', UITooltip);

declare global {
  interface HTMLElementTagNameMap { 'ui-tooltip': UITooltip }
}
