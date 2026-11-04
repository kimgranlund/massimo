// <ui-drawer>: an edge-anchored sheet over the page (Base UI Drawer: the Dialog parts). It is the
// ui-dialog element (components/dialog: top layer, modal by default, Escape / outside press / close
// parts, focus trap and return, nesting) on a square panel-level popup anchored to `side` (bottom by
// default, Base UI's swipeDirection down), which slides in from that edge. A press dragged toward the
// edge moves the sheet with the pointer (dom/swipe.ts: --drawer-swipe-movement-x / -y,
// data-swiping); released far or fast enough it closes with reason 'swipe'. Snap points (Base UI
// snapPoints: snap-points="0.4, 1", fractions of the viewport or lengths) rest the sheet partly
// open: it keeps its full size and sits --drawer-snap-x / -y toward its edge; a drag moves it both
// ways and a release settles on the nearest point (snappointchange { value, reason: 'swipe', event })
// or, below half the smallest, closes it.
import { define } from '../../core/element.ts';
import { SWIPE_OF, applySnapOffset, createSwipeDismiss, parseSnapPoints, snapExtent, type SnapPoint } from '../../dom/swipe.ts';
import type { DrawerSide } from '../../tokens/geometry/resolve.ts';
import { UIDialog } from '../dialog/dialog.element.ts';
import { drawer } from '../../styled-system/recipes/drawer.js';

const SIDES = new Set(['top', 'right', 'bottom', 'left']);

export class UIDrawer extends UIDialog {
  static properties = {
    ...UIDialog.properties,
    side: { type: String, default: 'bottom' },
    /** Base UI snapPoints: where the sheet can rest, "0.4, 1" (viewport fractions) or lengths ("148px, 30rem"). */
    snapPoints: { type: String, default: '', attribute: 'snap-points' },
    /** The snap point it rests at (one of snap-points; Base UI snapPoint); default the first. */
    snapPoint: { type: String, default: '', attribute: 'snap-point', reflect: true },
  };
  declare side: string;
  declare snapPoints: string;
  declare snapPoint: string;

  #swipe = createSwipeDismiss({
    el: () => this.popup,
    direction: () => SWIPE_OF[this.edge],
    onSwipe: (event) => this.request(false, 'swipe', event),
    snap: undefined,
  });
  #snap = {
    extents: () => this.#extents(),
    index: () => this.#index(),
    onSnap: (i: number, event: Event) => {
      const value = this.points[i];
      this.snapPoint = String(value);
      this.dispatchEvent(new CustomEvent('snappointchange', { bubbles: true, detail: { value, reason: 'swipe', event } }));
    },
  };

  /** The snap points (Base UI snapPoints), parsed. */
  get points(): SnapPoint[] { return parseSnapPoints(this.snapPoints); }
  #index() {
    const pts = this.points, i = pts.findIndex((p) => String(p) === this.snapPoint);
    return i >= 0 ? i : 0;
  }
  /** Each point's visible extent (px) for the sheet as it is laid out now. */
  #extents() {
    const el = this.popup, x = this.edge === 'left' || this.edge === 'right';
    if (!el) return [];
    const size = x ? el.offsetWidth : el.offsetHeight, vp = x ? window.innerWidth : window.innerHeight;
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    return this.points.map((p) => snapExtent(p, vp, size, rem)).map((e) => (Number.isNaN(e) ? size : e));
  }
  #onResize = () => this.#place();
  /** Rest the sheet at its snap point: offset toward its edge by its size less the point's extent. */
  #place() {
    const el = this.popup;
    if (!el) return;
    if (!this.points.length) { el.style.removeProperty('--drawer-snap-x'); el.style.removeProperty('--drawer-snap-y'); return; }
    const x = this.edge === 'left' || this.edge === 'right', size = x ? el.offsetWidth : el.offsetHeight;
    applySnapOffset(el, SWIPE_OF[this.edge], Math.max(0, size - (this.#extents()[this.#index()] ?? size)));
  }

  /** The side the sheet is anchored to (an unknown value is bottom). */
  get edge(): DrawerSide { return (SIDES.has(this.side) ? this.side : 'bottom') as DrawerSide; }
  protected classes() { return drawer({ side: this.edge }); }
  protected popupAttrs() { return { 'data-swipe-direction': SWIPE_OF[this.edge] }; }
  protected layerChanged(open: boolean) {
    if (open) { this.#swipe.reset(); this.#swipe.attach(); window.addEventListener('resize', this.#onResize); }
    else { this.#swipe.detach(); window.removeEventListener('resize', this.#onResize); }
  }

  update() {
    super.update();
    this.#swipe.snap = this.points.length ? this.#snap : undefined;
    if (this.open) this.#place();
  }
}

define('ui-drawer', UIDrawer);

declare global {
  interface HTMLElementTagNameMap { 'ui-drawer': UIDrawer }
}
