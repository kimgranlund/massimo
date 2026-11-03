// <ui-drawer>: an edge-anchored sheet over the page (Base UI Drawer: the Dialog parts). It is the
// ui-dialog element (components/dialog: top layer, modal by default, Escape / outside press / close
// parts, focus trap and return, nesting) on a square panel-level popup anchored to `side` (bottom by
// default, Base UI's swipeDirection down), which slides in from that edge. A press dragged toward the
// edge moves the sheet with the pointer (dom/swipe.ts: --drawer-swipe-movement-x / -y,
// data-swiping); released far or fast enough it closes with reason 'swipe'.
import { define } from '../../core/index.ts';
import { SWIPE_OF, createSwipeDismiss } from '../../dom/index.ts';
import type { DrawerSide } from '../../tokens/geometry/resolve.ts';
import { UIDialog } from '../dialog/dialog.element.ts';
import { drawer } from '../../styled-system/recipes/drawer.js';

const SIDES = new Set(['top', 'right', 'bottom', 'left']);

export class UIDrawer extends UIDialog {
  static properties = {
    ...UIDialog.properties,
    side: { type: String, default: 'bottom' },
  };
  declare side: string;

  #swipe = createSwipeDismiss({
    el: () => this.popup,
    direction: () => SWIPE_OF[this.edge],
    onSwipe: (event) => this.request(false, 'swipe', event),
  });

  /** The side the sheet is anchored to (an unknown value is bottom). */
  get edge(): DrawerSide { return (SIDES.has(this.side) ? this.side : 'bottom') as DrawerSide; }
  protected classes() { return drawer({ side: this.edge }); }
  protected popupAttrs() { return { 'data-swipe-direction': SWIPE_OF[this.edge] }; }
  protected layerChanged(open: boolean) {
    if (open) { this.#swipe.reset(); this.#swipe.attach(); } else this.#swipe.detach();
  }
}

define('ui-drawer', UIDrawer);

declare global {
  interface HTMLElementTagNameMap { 'ui-drawer': UIDrawer }
}
