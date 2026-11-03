// Layout and gestures shared by <ui-toast-viewport> and the React Toast.Viewport / Toast.Root.
// - measureStack: Base UI's continuous stack variables, px from layout (script, snapped to 1/64 px): --toast-height (each
//   toast's own height), --toast-offset-y (the heights of the toasts in front of it) and, on the
//   viewport, --toast-frontmost-height. --toast-index is set by the renderers from the toast list.
// - attachSwipe: swipe to dismiss in the allowed directions (Base UI swipeDirection, default down
//   and right): --toast-swipe-movement-x / -y follow the pointer while data-swiping; a release past
//   10u dismisses toward that direction, a shorter one springs back. Presses on the action, the
//   close, links, buttons and [data-swipe-ignore] / [data-base-ui-swipe-ignore] never swipe.
import type { SwipeDirection } from './manager.ts';

const snap = (n: number) => Math.round(n * 64) / 64;

/** A toast's natural height, even while a collapsed stack sizes it to the frontmost or scales it. */
function naturalHeight(el: HTMLElement) {
  const prev = el.style.getPropertyValue('height');
  el.style.setProperty('height', 'auto');
  // The layout height (border box; the recipe sets box-sizing), not the transformed one: toasts
  // behind the frontmost are scaled.
  const h = parseFloat(getComputedStyle(el).height) || el.getBoundingClientRect().height;
  if (prev) el.style.setProperty('height', prev); else el.style.removeProperty('height');
  return snap(h);
}

/** Set the stack variables on `toasts` (newest first, the ones still stacking) and their viewport. */
export function measureStack(viewport: HTMLElement, toasts: HTMLElement[]) {
  let offset = 0;
  const heights = toasts.map(naturalHeight);
  toasts.forEach((el, i) => {
    el.style.setProperty('--toast-height', `${heights[i]}px`);
    el.style.setProperty('--toast-offset-y', `${offset}px`);
    offset += heights[i];
  });
  if (heights.length) viewport.style.setProperty('--toast-frontmost-height', `${heights[0]}px`);
  else viewport.style.removeProperty('--toast-frontmost-height');
}

export const SWIPE_IGNORE = '[data-part=action], [data-part=close], a, button, input, select, textarea, [role=button], [contenteditable], [data-swipe-ignore], [data-base-ui-swipe-ignore]';

/** Parse a swipe-direction list ("down right", or an array); default down and right. */
export function swipeDirections(v: string | SwipeDirection | SwipeDirection[] | undefined | null): SwipeDirection[] {
  const list = Array.isArray(v) ? v : String(v ?? '').split(/[\s,]+/);
  const ok = list.filter((d): d is SwipeDirection => d === 'up' || d === 'down' || d === 'left' || d === 'right');
  return ok.length ? ok : ['down', 'right'];
}

export interface SwipeOptions {
  directions: () => SwipeDirection[];
  /** The unit u in px (the dismiss threshold is 10u). */
  unit: () => number;
  onSwiping?: (swiping: boolean) => void;
  /** A release past the threshold: dismiss toward `direction`. */
  onDismiss: (direction: SwipeDirection, event: PointerEvent) => void;
}

/** Swipe to dismiss on `el`; returns a detach function. */
export function attachSwipe(el: HTMLElement, o: SwipeOptions) {
  let start: { x: number; y: number; id: number } | null = null;
  let moved = { x: 0, y: 0 };
  let swiping = false;
  const set = (x: number, y: number) => {
    moved = { x, y };
    el.style.setProperty('--toast-swipe-movement-x', `${x}px`);
    el.style.setProperty('--toast-swipe-movement-y', `${y}px`);
  };
  const down = (e: PointerEvent) => {
    if (e.button !== 0 || (e.target as Element).closest?.(SWIPE_IGNORE)) return;
    start = { x: e.clientX, y: e.clientY, id: e.pointerId };
  };
  const move = (e: PointerEvent) => {
    if (!start || e.pointerId !== start.id) return;
    const d = o.directions();
    const dx = e.clientX - start.x, dy = e.clientY - start.y;
    // Only the allowed directions follow the pointer.
    const x = (dx > 0 && d.includes('right')) || (dx < 0 && d.includes('left')) ? dx : 0;
    const y = (dy > 0 && d.includes('down')) || (dy < 0 && d.includes('up')) ? dy : 0;
    if (!x && !y && !swiping) return;
    if (!swiping) { swiping = true; try { el.setPointerCapture?.(e.pointerId); } catch { /* not capturable */ } o.onSwiping?.(true); }
    set(x, y);
  };
  const up = (e: PointerEvent) => {
    if (!start || e.pointerId !== start.id) return;
    start = null;
    const was = swiping;
    swiping = false;
    const threshold = 10 * o.unit();
    const { x, y } = moved;
    const dir: SwipeDirection | null = Math.abs(x) >= Math.abs(y)
      ? (x >= threshold ? 'right' : x <= -threshold ? 'left' : null)
      : (y >= threshold ? 'down' : y <= -threshold ? 'up' : null);
    if (was) o.onSwiping?.(false);
    if (dir) o.onDismiss(dir, e);
    else set(0, 0);
  };
  const cancel = () => { if (!start) return; start = null; swiping = false; o.onSwiping?.(false); set(0, 0); };
  el.addEventListener('pointerdown', down);
  el.addEventListener('pointermove', move);
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', cancel);
  return () => {
    el.removeEventListener('pointerdown', down);
    el.removeEventListener('pointermove', move);
    el.removeEventListener('pointerup', up);
    el.removeEventListener('pointercancel', cancel);
  };
}

/** Resolve after `el`'s running transitions finish (at once where there are none). */
export function afterTransitions(el: Element): Promise<void> {
  const anims = typeof (el as any).getAnimations === 'function' ? (el as any).getAnimations({ subtree: true }) as Animation[] : [];
  return Promise.all(anims.map((a) => a.finished.catch(() => undefined))).then(() => undefined);
}

/** Two frames: long enough for a starting style to be painted before it is removed. */
export const nextPaint = (fn: () => void) => {
  if (typeof requestAnimationFrame !== 'function') { setTimeout(fn, 0); return; }
  requestAnimationFrame(() => requestAnimationFrame(fn));
};
