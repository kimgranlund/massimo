// Anchored popups (popover, tooltip, preview card, navigation menu): the pieces they share on top of
// the floating layer (dom/floating.ts), usable by both renderers.
// - hover intent: open after a delay while the pointer rests on the trigger, close after a delay
//   once it has left both the trigger and the popup (Base UI delay / closeDelay).
// - warm group: a tooltip opened soon after another closed opens at once (Base UI
//   Tooltip.Provider timeout), with data-instant so it skips the reveal motion.
// - arrow: the arrow's offset along the popup edge, centered on the anchor (Base UI Arrow,
//   data-uncentered when the popup edge cannot reach the anchor's center).
// - anchored positioner: keeps the preferred side unless the popup's natural size does not fit
//   there and the opposite side has more room (Base UI's flip), then places it: through CSS
//   anchor positioning where it runs (data-placement keys the rule; no CSS fallbacks, so the
//   choice holds in every engine), else from script (placeFloating). Follows scroll, resize and
//   the popup's own size changes, and places the arrow.
// Docs: docs/specs/components.md, "Floating layers".
import { anchorPositioning, applyPlacement, placeFloating, unitOf, type Align, type Side } from './floating.ts';

export interface HoverIntentOptions {
  /** Open after the pointer rests this long on the trigger (ms). */
  delay: () => number;
  /** Close this long after the pointer left trigger and popup (ms). */
  closeDelay: () => number;
  onOpen: (event: Event) => void;
  onClose: (event: Event) => void;
}

/**
 * Hover intent for one trigger and its popup: call enter() on pointerenter of either, leave() on
 * pointerleave of either; cancel() drops a pending open or close. Leaving the trigger for the popup
 * (across the 1u gap) keeps the popup open when the pointer arrives before the close delay ends.
 */
export function createHoverIntent(o: HoverIntentOptions) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const clear = () => { if (timer !== undefined) clearTimeout(timer); timer = undefined; };
  return {
    enter(event: Event, opening = true) {
      clear();
      if (!opening) return;
      const d = o.delay();
      if (d <= 0) o.onOpen(event); else timer = setTimeout(() => { timer = undefined; o.onOpen(event); }, d);
    },
    leave(event: Event) {
      clear();
      // A floor of one frame lets the pointer cross the gap from trigger to popup.
      timer = setTimeout(() => { timer = undefined; o.onClose(event); }, Math.max(o.closeDelay(), 50));
    },
    cancel: clear,
    get pending() { return timer !== undefined; },
  };
}

/** A pointer event from a mouse or pen (touch has no hover; it presses instead). */
export const isHoverPointer = (e: Event) => !('pointerType' in e) || (e as PointerEvent).pointerType !== 'touch';

// ── Warm group (Base UI Tooltip.Provider) ──

let lastClosed = -Infinity;
/** Default window in which the next tooltip opens without its delay (Base UI timeout). */
export const WARM_TIMEOUT = 400;
/** A tooltip closed: the group stays warm for the timeout. */
export const markClosed = () => { lastClosed = Date.now(); };
/** Whether a tooltip closed within `timeout` ms (the next one skips its delay and motion). */
export const isWarm = (timeout = WARM_TIMEOUT) => Date.now() - lastClosed < timeout;

// ── Arrow ──

export interface ArrowPlacement {
  /** Offset of the arrow's center from the popup's start edge along the side (px). */
  offset: number;
  /** The anchor's center could not be reached (Base UI data-uncentered). */
  uncentered: boolean;
}

/**
 * Where the arrow sits along the popup's edge: at the anchor's center, kept `inset` px inside the
 * popup's ends (the corner radius plus half the arrow). Pure: pass the two boxes.
 */
export function arrowOffset(popup: DOMRectReadOnly | { left: number; top: number; width: number; height: number },
  anchor: { left: number; top: number; width: number; height: number }, side: Side, inset: number): ArrowPlacement {
  const block = side === 'top' || side === 'bottom';
  const start = block ? popup.left : popup.top, size = block ? popup.width : popup.height;
  const center = (block ? anchor.left + anchor.width / 2 : anchor.top + anchor.height / 2) - start;
  const lo = Math.min(inset, size / 2), hi = Math.max(size - inset, size / 2);
  const offset = Math.max(lo, Math.min(center, hi));
  return { offset, uncentered: Math.abs(offset - center) > 0.01 };
}

/**
 * Place an arrow element on its popup's edge facing the anchor: sets --arrow-offset (px from the
 * popup's start along the side) and data-uncentered. `inset` defaults to the popup radius + u.
 */
export function placeArrow(arrow: HTMLElement | null | undefined, popup: Element | null | undefined, anchor: Element | null | undefined, side: Side) {
  if (!arrow || !popup || !anchor) return;
  const p = popup.getBoundingClientRect();
  if (!p.width && !p.height) return;
  const cs = window.getComputedStyle(popup);
  const u = parseFloat(cs.getPropertyValue('--u')) || 4;
  const radius = parseFloat(cs.borderTopLeftRadius) || 0;
  const a = arrowOffset(p, anchor.getBoundingClientRect(), side, radius + u);
  arrow.style.setProperty('--arrow-offset', `${a.offset}px`);
  arrow.toggleAttribute('data-uncentered', a.uncentered);
}

// ── Anchored positioner ──

const OPPOSITE: Record<Side, Side> = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };
/** Distance kept from the viewport edges (px), as placeFloating's default margin. */
export const VIEWPORT_MARGIN = 8;

/**
 * The side a popup goes on: the preferred one when the popup's natural size fits beside the anchor
 * (offset and viewport margin included), else the opposite one when it has more room. Pure.
 */
export function chooseSide(anchor: { top: number; bottom: number; left: number; right: number }, popup: { width: number; height: number },
  viewport: { width: number; height: number }, side: Side, offset: number, margin = VIEWPORT_MARGIN): Side {
  const space: Record<Side, number> = {
    bottom: viewport.height - anchor.bottom - offset - margin, top: anchor.top - offset - margin,
    right: viewport.width - anchor.right - offset - margin, left: anchor.left - offset - margin,
  };
  const need = side === 'top' || side === 'bottom' ? popup.height : popup.width;
  return space[side] >= need || space[OPPOSITE[side]] <= space[side] ? side : OPPOSITE[side];
}

export interface AnchoredPositionerOptions {
  anchor: () => Element | null | undefined;
  /** The fixed element in the top layer (Base UI Positioner). */
  positioner: () => HTMLElement | null | undefined;
  /** The surface inside it (Base UI Popup): its content size decides the side. */
  surface: () => HTMLElement | null | undefined;
  arrow?: () => HTMLElement | null | undefined;
  side: () => Side;
  align: () => Align;
  /** Called with the side in use after each placement (data-side). */
  onPlace?: (side: Side) => void;
}

/** The positioner of an anchored popup: start() when shown, update() after a render, stop() when hidden. */
export function createAnchoredPositioner(o: AnchoredPositionerOptions) {
  let running = false, frame = 0;
  let follow: ResizeObserver | undefined;
  const place = () => {
    frame = 0;
    const pos = o.positioner(), anchor = o.anchor(), surface = o.surface();
    if (!running || !pos || !anchor || !surface) return;
    const u = unitOf(pos), a = anchor.getBoundingClientRect(), vp = { width: window.innerWidth, height: window.innerHeight };
    // The natural size: the surface's content (it scrolls when squeezed) plus its edge.
    const natural = { width: surface.scrollWidth + surface.offsetWidth - surface.clientWidth, height: surface.scrollHeight + surface.offsetHeight - surface.clientHeight };
    const side = chooseSide(a, natural, vp, o.side(), u), align = o.align();
    pos.setAttribute('data-placement', `${side}-${align}`);
    if (!anchorPositioning()) {
      applyPlacement(pos, placeFloating(a, vp, { side, align, offset: u, flipBelow: -Infinity, popup: { width: pos.offsetWidth, height: pos.offsetHeight } }));
    }
    o.onPlace?.(side);
    placeArrow(o.arrow?.(), surface, anchor, side);
  };
  const soon = () => { if (!frame) frame = window.requestAnimationFrame(place); };
  return {
    start() {
      if (!running) {
        running = true;
        window.addEventListener('resize', soon);
        window.addEventListener('scroll', soon, true);
        const s = o.surface();
        if (s && typeof ResizeObserver !== 'undefined') { follow = new ResizeObserver(soon); follow.observe(s); }
      }
      place();
    },
    update: () => { if (running) place(); },
    stop() {
      if (!running) return;
      running = false;
      if (frame) window.cancelAnimationFrame(frame);
      frame = 0;
      follow?.disconnect();
      follow = undefined;
      window.removeEventListener('resize', soon);
      window.removeEventListener('scroll', soon, true);
    },
    get running() { return running; },
  };
}
