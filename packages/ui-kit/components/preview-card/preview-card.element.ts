// <ui-preview-card>: a preview of a link's destination, shown while the pointer rests on the link
// or it has keyboard focus (Base UI Preview Card: Root, Trigger, Positioner, Popup, Arrow). Preset:
//   <ui-preview-card><a href="/people/ada">Ada Lovelace</a><p>Mathematician…</p></ui-preview-card>
// (the first child element is the trigger link, the other children the card), or parts as
// [data-part] children: [data-part=trigger] and [data-part=popup] (an optional [data-part=arrow]).
// Hover intent opens it after `delay` (600 ms) and closes it `close-delay` (300 ms) after the
// pointer leaves link and card, so the pointer can move onto the card; keyboard focus opens it at
// once and Tab moves into its links (the card follows the link in the DOM); focus leaving both,
// an outside press or Escape close it. A press follows the link: the card never toggles on press.
// Shared machinery: popover/popup-base.ts.
import { define } from '../../core/index.ts';
import type { ChangeReason } from '../../dom/index.ts';
import { previewCard } from '../../styled-system/recipes/preview-card.js';
import { POPUP_PROPERTIES, UIPopupBase, type PopupConfig } from '../popover/popup-base.ts';

export class UIPreviewCard extends UIPopupBase {
  static properties = { ...POPUP_PROPERTIES };

  protected config(): PopupConfig {
    return {
      recipe: () => previewCard(), side: 'bottom', align: 'center', delay: 600, closeDelay: 300,
      press: false, hover: true, focus: true, focusOut: true,
      moveFocus: false, trap: false, pressCloses: false,
    };
  }

  protected emitOpenChange(detail: { open: boolean; reason: ChangeReason; event: Event | undefined }) {
    return this.dispatchEvent(new CustomEvent('openchange', { bubbles: true, cancelable: true, detail }));
  }

  /** The preset's trigger: the first child element (a link). */
  protected makeTrigger() {
    return [...this.children].find((c) => !c.hasAttribute('data-part')) as HTMLElement | undefined;
  }

  protected fillPopup(popup: HTMLElement, rest: Node[]) { popup.append(...rest); }
}

define('ui-preview-card', UIPreviewCard);

declare global {
  interface HTMLElementTagNameMap { 'ui-preview-card': UIPreviewCard }
}
