// Headless scroll area (Base UI ScrollArea), shared by <ui-scroll-area> and the React ScrollArea:
// the viewport scrolls natively (its own scrollbars hidden by the recipe); this measures it and
// returns what both renderers put on the parts: Base UI's data-* (data-has-overflow-x/y,
// data-overflow-{x,y}-{start,end}, data-scrolling, data-hovering, data-orientation) and its CSS
// variables (root --scroll-area-corner-width/height, viewport --scroll-area-overflow-*, scrollbar
// --scroll-area-thumb-width/height), plus ours: --scroll-area-thumb-offset (the thumb's place along
// its track, signed: negative in RTL for the horizontal thumb, which starts at the right). The
// thumb's minimum length and the track inset come from the geometry (resolveScrollArea).
import type { Attrs } from './attrs.ts';
import { resolveScrollArea } from '../tokens/geometry/resolve.ts';

export type ScrollOrientation = 'vertical' | 'horizontal';
export type EdgeThreshold = number | Partial<{ xStart: number; xEnd: number; yStart: number; yEnd: number }>;

export interface ScrollMetrics {
  hasX: boolean; hasY: boolean;
  /** Distances (px) from each edge: scrolled away from the start, content left before the end. */
  xStart: number; xEnd: number; yStart: number; yEnd: number;
  /** Thumb lengths and offsets along each track (px). */
  thumbX: number; thumbY: number; offsetX: number; offsetY: number;
  /** Corner size: the other scrollbar's thickness when both show, else 0. */
  cornerW: number; cornerH: number;
  rtl: boolean;
}

const on = (v: boolean) => (v ? '' : undefined);
const thresholds = (t: EdgeThreshold = 0) => typeof t === 'number' ? { xStart: t, xEnd: t, yStart: t, yEnd: t } : { xStart: 0, xEnd: 0, yStart: 0, yEnd: 0, ...t };
const px = (v: string) => parseFloat(v) || 0;
/** The content length of a track (the scrollbar minus its inset padding). */
const trackLength = (bar: HTMLElement | null | undefined, o: ScrollOrientation) => {
  if (!bar) return 0;
  // The fractional box (clientHeight rounds), so the thumb fills the track exactly at any u.
  const cs = getComputedStyle(bar), r = bar.getBoundingClientRect();
  return o === 'vertical' ? (r.height || bar.clientHeight) - px(cs.paddingTop) - px(cs.paddingBottom) : (r.width || bar.clientWidth) - px(cs.paddingLeft) - px(cs.paddingRight);
};

/**
 * The unit u of a scroll area, read from a scrollbar's thickness (2u, a computed length even while
 * the bar is hidden); 4 without one. (A custom property such as --u reads back unresolved.)
 */
export function scrollUnit(bars: { x?: HTMLElement | null; y?: HTMLElement | null }) {
  const t = bars.y ? px(getComputedStyle(bars.y).width) : bars.x ? px(getComputedStyle(bars.x).height) : 0;
  return t > 0 ? t / 2 : 4;
}

/** Measure the viewport and the tracks (pass the scrollbars when they are rendered); u from their thickness unless given. */
export function measureScrollArea(viewport: HTMLElement, bars: { x?: HTMLElement | null; y?: HTMLElement | null } = {}, unit = scrollUnit(bars)): ScrollMetrics {
  const { scrollWidth: sw, scrollHeight: sh, clientWidth: cw, clientHeight: ch } = viewport;
  const rtl = getComputedStyle(viewport).direction === 'rtl';
  const left = Math.abs(viewport.scrollLeft), top = viewport.scrollTop;
  const hasX = sw > cw + 0.5, hasY = sh > ch + 0.5;
  const g = resolveScrollArea({ unit });
  const thumb = (track: number, client: number, total: number, pos: number) => {
    if (!track || total <= client) return [0, 0];
    const len = Math.min(track, Math.max(g.thumbMin, track * client / total));
    return [len, (pos / (total - client)) * (track - len)];
  };
  const [thumbX, offX] = thumb(trackLength(bars.x, 'horizontal'), cw, sw, left);
  const [thumbY, offY] = thumb(trackLength(bars.y, 'vertical'), ch, sh, top);
  return {
    hasX, hasY,
    xStart: left, xEnd: Math.max(0, sw - cw - left), yStart: top, yEnd: Math.max(0, sh - ch - top),
    thumbX, thumbY, offsetX: rtl ? -offX : offX, offsetY: offY,
    cornerW: hasX && hasY ? g.thickness : 0, cornerH: hasX && hasY ? g.thickness : 0,
    rtl,
  };
}

/** Base UI's overflow and scrolling data-* (root, viewport, content and scrollbars carry the same). */
export function scrollAreaDataAttrs(m: Pick<ScrollMetrics, 'hasX' | 'hasY' | 'xStart' | 'xEnd' | 'yStart' | 'yEnd'> | null, scrolling = false, threshold?: EdgeThreshold): Attrs {
  const t = thresholds(threshold);
  return {
    'data-has-overflow-x': on(!!m?.hasX), 'data-has-overflow-y': on(!!m?.hasY),
    'data-overflow-x-start': on(!!m?.hasX && m.xStart > t.xStart), 'data-overflow-x-end': on(!!m?.hasX && m.xEnd > t.xEnd),
    'data-overflow-y-start': on(!!m?.hasY && m.yStart > t.yStart), 'data-overflow-y-end': on(!!m?.hasY && m.yEnd > t.yEnd),
    'data-scrolling': on(scrolling),
  };
}

/** The CSS variables each part takes, in px (set as custom properties by script). */
export function scrollAreaVars(m: ScrollMetrics) {
  const css = (n: number) => `${Math.round(n * 100) / 100}px`;
  return {
    root: { '--scroll-area-corner-width': css(m.cornerW), '--scroll-area-corner-height': css(m.cornerH) },
    viewport: {
      '--scroll-area-overflow-x-start': css(m.xStart), '--scroll-area-overflow-x-end': css(m.xEnd),
      '--scroll-area-overflow-y-start': css(m.yStart), '--scroll-area-overflow-y-end': css(m.yEnd),
    },
    x: { '--scroll-area-thumb-width': css(m.thumbX), '--scroll-area-thumb-offset': css(m.offsetX) },
    y: { '--scroll-area-thumb-height': css(m.thumbY), '--scroll-area-thumb-offset': css(m.offsetY) },
  };
}

/** Set custom properties on an element (only those that changed). */
export function setVars(el: HTMLElement | null | undefined, vars: Record<string, string>) {
  if (!el) return;
  for (const [k, v] of Object.entries(vars)) if (el.style.getPropertyValue(k) !== v) el.style.setProperty(k, v);
}

/** The scroll position that puts the thumb's center at `at` px along the track (a track press), or moves it by `delta` px (a drag from `start`). */
export function scrollForTrack(viewport: HTMLElement, o: ScrollOrientation, track: number, thumb: number, at: number) {
  const total = o === 'vertical' ? viewport.scrollHeight - viewport.clientHeight : viewport.scrollWidth - viewport.clientWidth;
  const free = track - thumb;
  return free > 0 ? Math.max(0, Math.min(total, ((at - thumb / 2) / free) * total)) : 0;
}

/** Scroll by a thumb drag of `delta` px along the track from the scroll position `start`. */
export function scrollForDrag(viewport: HTMLElement, o: ScrollOrientation, track: number, thumb: number, start: number, delta: number) {
  const total = o === 'vertical' ? viewport.scrollHeight - viewport.clientHeight : viewport.scrollWidth - viewport.clientWidth;
  const free = track - thumb;
  return free > 0 ? Math.max(0, Math.min(total, start + (delta / free) * total)) : start;
}

/** Apply a scroll position along an axis (RTL horizontal positions are negative). */
export function scrollAlong(viewport: HTMLElement, o: ScrollOrientation, pos: number, rtl = false) {
  if (o === 'vertical') viewport.scrollTop = pos;
  else viewport.scrollLeft = rtl ? -pos : pos;
}

/**
 * Thumb drag and track press on one scrollbar (both renderers): pointerdown on the thumb drags it
 * (pointer capture), elsewhere on the track jumps so the thumb centers under the pointer. Returns
 * a cleanup.
 */
export function bindScrollbar(bar: HTMLElement, viewport: () => HTMLElement | null, o: ScrollOrientation) {
  const thumbOf = () => bar.querySelector<HTMLElement>('[data-part=thumb]');
  const axis = (e: PointerEvent) => (o === 'vertical' ? e.clientY : e.clientX);
  let drag: { start: number; from: number; pointer: number } | null = null;
  const down = (e: PointerEvent) => {
    const vp = viewport(), thumb = thumbOf();
    if (!vp || e.button !== 0) return;
    const m = measureScrollArea(vp, o === 'vertical' ? { y: bar } : { x: bar });
    const track = trackLength(bar, o), len = o === 'vertical' ? m.thumbY : m.thumbX;
    const rect = bar.getBoundingClientRect(), cs = getComputedStyle(bar);
    const pos = o === 'vertical' ? m.yStart : m.xStart;
    e.preventDefault();
    if (thumb && thumb.contains(e.target as Node)) {
      drag = { start: pos, from: axis(e), pointer: e.pointerId };
      bar.setPointerCapture?.(e.pointerId);
      return;
    }
    // Along the track from its inline / block start (the right edge in RTL for the horizontal bar).
    const at = o === 'vertical' ? e.clientY - rect.top - px(cs.paddingTop)
      : m.rtl ? rect.right - e.clientX - px(cs.paddingRight) : e.clientX - rect.left - px(cs.paddingLeft);
    scrollAlong(vp, o, scrollForTrack(vp, o, track, len, at), m.rtl);
  };
  const move = (e: PointerEvent) => {
    const vp = viewport();
    if (!drag || !vp || e.pointerId !== drag.pointer) return;
    const m = measureScrollArea(vp, o === 'vertical' ? { y: bar } : { x: bar });
    const len = o === 'vertical' ? m.thumbY : m.thumbX;
    const delta = (axis(e) - drag.from) * (o === 'horizontal' && m.rtl ? -1 : 1);
    scrollAlong(vp, o, scrollForDrag(vp, o, trackLength(bar, o), len, drag.start, delta), m.rtl);
  };
  const up = (e: PointerEvent) => { if (drag && e.pointerId === drag.pointer) { drag = null; bar.releasePointerCapture?.(e.pointerId); } };
  bar.addEventListener('pointerdown', down);
  bar.addEventListener('pointermove', move);
  bar.addEventListener('pointerup', up);
  bar.addEventListener('pointercancel', up);
  return () => {
    bar.removeEventListener('pointerdown', down);
    bar.removeEventListener('pointermove', move);
    bar.removeEventListener('pointerup', up);
    bar.removeEventListener('pointercancel', up);
  };
}
