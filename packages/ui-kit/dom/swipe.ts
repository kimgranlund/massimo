// Swipe to dismiss (Base UI Drawer): a press on a drawer's popup dragged toward its edge moves the
// popup with the pointer and, released far or fast enough, dismisses it with Base UI's reason
// 'swipe'. Shared by both renderers (ui-drawer, React Drawer). Docs: docs/specs/components.md,
// "Modal layers".
export type SwipeDirection = 'up' | 'down' | 'left' | 'right';
/** A drawer side and the direction that swipes it away (Base UI swipeDirection). */
export const SWIPE_OF = { bottom: 'down', top: 'up', left: 'left', right: 'right' } as const satisfies Record<string, SwipeDirection>;

export interface SwipeOptions {
  el: () => HTMLElement | null | undefined;
  direction: () => SwipeDirection;
  /** Called when a swipe passes the threshold (Base UI reason 'swipe'). */
  onSwipe: (event: Event) => void;
  /** Whether the swipe is on (open, not disabled). */
  enabled?: () => boolean;
  /** Fraction of the popup's size past which a release dismisses. Default 0.4. */
  threshold?: number;
  /** Release speed (px/ms) that dismisses whatever the distance. Default 0.5. */
  velocity?: number;
}

/** Movement (px) before a press becomes a swipe, so presses and clicks inside stay clicks. */
const SLOP = 6;
const IGNORE = '[data-swipe-ignore], [contenteditable=""], [contenteditable=true], input, textarea, select, [role=slider], [role=textbox]';

/**
 * Swipe to dismiss: a press on the popup dragged toward its edge moves it with the pointer, through
 * Base UI's --drawer-swipe-movement-x / -y (px, set on the popup) and data-swiping; a release past
 * the threshold (or a flick) calls onSwipe, otherwise the popup springs back. Dragging the other way
 * does not move it. Elements marked [data-swipe-ignore] (and text entry, sliders) never start one.
 */
export function createSwipeDismiss(o: SwipeOptions) {
  let start: { x: number; y: number; t: number; id: number } | null = null;
  let swiping = false, delta = 0, last = { d: 0, t: 0 }, speed = 0;
  const axis = () => (o.direction() === 'left' || o.direction() === 'right' ? 'x' : 'y');
  const sign = () => (o.direction() === 'down' || o.direction() === 'right' ? 1 : -1);
  const set = (el: HTMLElement, d: number) => {
    el.style.setProperty('--drawer-swipe-movement-x', axis() === 'x' ? `${d * sign()}px` : '0px');
    el.style.setProperty('--drawer-swipe-movement-y', axis() === 'y' ? `${d * sign()}px` : '0px');
  };
  const reset = (el: HTMLElement) => {
    el.removeAttribute('data-swiping');
    el.style.removeProperty('--drawer-swipe-movement-x');
    el.style.removeProperty('--drawer-swipe-movement-y');
  };
  const down = (e: PointerEvent) => {
    const el = o.el();
    if (!el || e.button !== 0 || o.enabled?.() === false || (e.target as Element)?.closest?.(IGNORE)) return;
    start = { x: e.clientX, y: e.clientY, t: e.timeStamp, id: e.pointerId };
    swiping = false; delta = 0; last = { d: 0, t: e.timeStamp }; speed = 0;
  };
  const move = (e: PointerEvent) => {
    const el = o.el();
    if (!start || !el || e.pointerId !== start.id) return;
    const d = ((axis() === 'x' ? e.clientX - start.x : e.clientY - start.y) * sign());
    if (!swiping) {
      const cross = axis() === 'x' ? Math.abs(e.clientY - start.y) : Math.abs(e.clientX - start.x);
      if (d < SLOP || cross > d) { if (cross > SLOP) start = null; return; }
      swiping = true;
      el.setAttribute('data-swiping', '');
      try { el.setPointerCapture?.(e.pointerId); } catch { /* synthetic pointer */ }
    }
    delta = Math.max(0, d);
    const dt = e.timeStamp - last.t;
    // Speed over the latest move (moves closer than 4ms apart are coalesced).
    if (dt < 4) return set(el, delta);
    speed = (delta - last.d) / dt;
    last = { d: delta, t: e.timeStamp };
    set(el, delta);
  };
  const up = (e: PointerEvent) => {
    const el = o.el();
    if (!start || !el) return;
    const was = swiping;
    start = null; swiping = false;
    if (!was) return;
    const size = axis() === 'x' ? el.offsetWidth : el.offsetHeight;
    if (delta > (o.threshold ?? 0.4) * size || speed > (o.velocity ?? 0.5)) {
      // The popup leaves from where it was dragged to: data-swipe-dismiss keeps the movement for the exit.
      el.removeAttribute('data-swiping');
      el.setAttribute('data-swipe-dismiss', '');
      o.onSwipe(e);
    } else reset(el);
  };
  const cancel = () => { const el = o.el(); start = null; swiping = false; if (el) reset(el); };
  let bound: HTMLElement | null = null;
  return {
    attach() {
      const el = o.el();
      if (!el || bound === el) return;
      this.detach();
      bound = el;
      el.addEventListener('pointerdown', down);
      el.addEventListener('pointermove', move);
      el.addEventListener('pointerup', up);
      el.addEventListener('pointercancel', cancel);
    },
    detach() {
      if (!bound) return;
      bound.removeEventListener('pointerdown', down);
      bound.removeEventListener('pointermove', move);
      bound.removeEventListener('pointerup', up);
      bound.removeEventListener('pointercancel', cancel);
      bound = null;
    },
    /** Clear the swipe state (after the popup reopens). */
    reset() { const el = o.el(); if (el) { reset(el); el.removeAttribute('data-swipe-dismiss'); } },
    get swiping() { return swiping; },
  };
}
