// Floating layers: the shared machinery behind every popup the kit draws (Select's popup today;
// Tooltip, Popover, Menu, Dialog, Toast and Combobox build on it). Four independent pieces, each
// usable by both renderers (web components call them directly, React through
// components/floating.react.ts):
// - positioner: CSS anchor positioning where the browser has it (components/recipe-parts.ts
//   anchoredPopup), else script placement (placeFloating) written inline; Base UI's positioner
//   variables (--anchor-width, --anchor-height, --available-width, --available-height,
//   --transform-origin) and data-side / data-align either way; a 1u offset; flip to the other
//   side when the preferred one has no room.
// - dismiss layer: outside press, Escape and focus-out close the layer, with Base UI's reason
//   strings ('outside-press', 'escape-key', 'focus-out'); layers stack, so Escape reaches the
//   topmost only and a press inside a nested (later) layer is not outside its parents.
// - focus scope: move focus in on open, trap Tab inside (modal layers), return focus on close.
// - top layer: the popover API (popover="manual"), so the layer paints above everything without
//   z-index and escapes overflow clipping.
// Docs: docs/specs/components.md, "Floating layers".
import type { ChangeReason } from './events.ts';

export type Side = 'top' | 'bottom' | 'left' | 'right';
export type Align = 'start' | 'center' | 'end';

/** An anchor's box (a DOMRect fits); right and height are derived when absent. */
export interface AnchorRect { top: number; bottom: number; left: number; width: number; right?: number; height?: number }
export interface Viewport { width: number; height: number }

export interface PlaceOptions {
  /** The preferred side (Base UI side). Default bottom. */
  side?: Side;
  /** Alignment along the side (Base UI align). Default start. */
  align?: Align;
  /** Distance from the anchor (Base UI sideOffset), px. The kit passes 1u. Default 4. */
  offset?: number;
  /** Distance kept from the viewport edges (Base UI collisionPadding), px. Default 8. */
  margin?: number;
  /** Flip when the preferred side has less room than this and the opposite side more. Default 160. */
  flipBelow?: number;
  /** The popup's size, when known (center and end alignment, inline sides). Default: the anchor's. */
  popup?: { width: number; height: number };
}

/** Where a popup goes: fixed-position insets (px; an absent inset is auto) and the positioner values. */
export interface Placement {
  side: Side;
  align: Align;
  top?: number; bottom?: number; left?: number; right?: number;
  minWidth: number; maxHeight: number;
  anchorWidth: number; anchorHeight: number;
  availableWidth: number; availableHeight: number;
  transformOrigin: string;
}

const OPPOSITE: Record<Side, Side> = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' };
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(v, hi));

/**
 * Place a popup beside its anchor within the viewport (the positioner's script fallback). Pure:
 * pass rects and the viewport size; apply the result as fixed-position insets (applyPlacement)
 * and, through positionerVars, as Base UI's positioner variables.
 */
export function placeFloating(anchor: AnchorRect, viewport: Viewport, o: PlaceOptions = {}): Placement {
  const { align = 'start', offset = 4, margin = 8, flipBelow = 160 } = o;
  const right = anchor.right ?? anchor.left + anchor.width;
  const anchorHeight = anchor.height ?? anchor.bottom - anchor.top;
  const space: Record<Side, number> = {
    bottom: viewport.height - anchor.bottom - offset - margin,
    top: anchor.top - offset - margin,
    right: viewport.width - right - offset - margin,
    left: anchor.left - offset - margin,
  };
  const want = o.side ?? 'bottom';
  const side = space[want] < flipBelow && space[OPPOSITE[want]] > space[want] ? OPPOSITE[want] : want;
  const shared = { side, align, minWidth: anchor.width, anchorWidth: anchor.width, anchorHeight, transformOrigin: `${OPPOSITE[side]} center` };
  if (side === 'top' || side === 'bottom') {
    // Cross axis: aligned to the anchor's start, center or end, kept inside the viewport.
    const w = Math.max(o.popup?.width ?? anchor.width, anchor.width);
    const want = align === 'start' ? anchor.left : align === 'end' ? right - w : anchor.left + (anchor.width - w) / 2;
    const left = clamp(want, margin, viewport.width - margin - w);
    const main = side === 'bottom' ? { top: anchor.bottom + offset, bottom: undefined } : { bottom: viewport.height - anchor.top + offset, top: undefined };
    return { ...shared, left, ...main, maxHeight: space[side], availableWidth: viewport.width - left - margin, availableHeight: space[side] };
  }
  const h = o.popup?.height ?? anchorHeight;
  const want2 = align === 'start' ? anchor.top : align === 'end' ? anchor.bottom - h : anchor.top + (anchorHeight - h) / 2;
  const top = clamp(want2, margin, viewport.height - margin - h);
  const main = side === 'right' ? { left: right + offset, right: undefined } : { right: viewport.width - anchor.left + offset, left: undefined };
  const availableHeight = viewport.height - top - margin;
  return { ...shared, top, ...main, maxHeight: availableHeight, availableWidth: space[side], availableHeight };
}

/** Base UI's positioner variables for a placement, in px. */
export function positionerVars(p: Placement): Record<string, string> {
  return {
    '--anchor-width': `${p.anchorWidth}px`, '--anchor-height': `${p.anchorHeight}px`,
    '--available-width': `${p.availableWidth}px`, '--available-height': `${p.availableHeight}px`,
    '--transform-origin': p.transformOrigin,
  };
}

/** Write a placement onto a fixed-position popup: its insets and the positioner variables. */
export function applyPlacement(popup: HTMLElement, p: Placement) {
  const px = (v: number | undefined) => (v == null ? 'auto' : `${v}px`);
  Object.assign(popup.style, { left: px(p.left), top: px(p.top), bottom: px(p.bottom), ...(p.right != null || p.side === 'right' ? { right: px(p.right) } : {}) });
  for (const [k, v] of Object.entries(positionerVars(p))) popup.style.setProperty(k, v);
}

/**
 * Whether CSS anchor positioning places popups (position-area and anchor-scope). Where it does,
 * the recipe positions and sizes the popup (recipe-parts.ts anchoredPopup) and script only reads
 * back the side; elsewhere script placement is the fallback.
 */
export const anchorPositioning = () =>
  typeof CSS !== 'undefined' && !!CSS.supports?.('position-area', 'block-end') && !!CSS.supports?.('anchor-scope', 'all');

/** The side a shown popup sits on, measured from the two boxes (CSS anchor positioning may flip it). */
export function measureSide(popup: Element, anchor: Element, preferred: Side = 'bottom'): Side | undefined {
  const p = popup.getBoundingClientRect(), a = anchor.getBoundingClientRect();
  if (!p.height && !p.width) return undefined;
  if (preferred === 'top' || preferred === 'bottom') {
    // position-try-order: most-block-size is parsed but not acted on by some engines (Safari 27), which
    // keep a squeezed first fit: when the popup scrolls on the side CSS chose, take the side with more
    // room; data-side="top" then places it above in CSS (anchoredPopup), so the choice holds.
    const squeezed = (popup as HTMLElement).scrollHeight > (popup as HTMLElement).clientHeight + 1;
    if (squeezed) return a.top > window.innerHeight - a.bottom ? 'top' : 'bottom';
    return p.top < a.top ? 'top' : 'bottom';
  }
  return p.left < a.left ? 'left' : 'right';
}

export interface PositionerOptions {
  anchor: () => Element | null | undefined;
  popup: () => HTMLElement | null | undefined;
  side?: Side;
  align?: Align;
  /** The offset in px; default 1u, read from --u on the popup (styles/geometry.ts). */
  offset?: () => number;
  /** Called with the side after each placement (data-side). */
  onSide?: (side: Side) => void;
  /** Force script placement even where CSS anchor positioning runs (tests, special cases). */
  script?: boolean;
}

/** One u in px from --u on an element (styles/geometry.ts), else 4. */
export const unitOf = (el: Element) => parseFloat(window.getComputedStyle(el).getPropertyValue('--u')) || 4;

/**
 * The positioner for one popup: start() when shown, update() after each render while shown,
 * stop() when hidden. With CSS anchor positioning it only measures the side; otherwise it places
 * the popup from script and follows window resize and scroll.
 */
export function createPositioner(o: PositionerOptions) {
  let running = false;
  const script = () => o.script || !anchorPositioning();
  const place = () => {
    const popup = o.popup(), anchor = o.anchor();
    if (!popup || !anchor) return;
    if (!script()) { const s = measureSide(popup, anchor, o.side); if (s) o.onSide?.(s); return; }
    const p = placeFloating(anchor.getBoundingClientRect(), { width: window.innerWidth, height: window.innerHeight }, {
      side: o.side, align: o.align, offset: o.offset?.() ?? unitOf(popup),
      popup: o.align && o.align !== 'start' || o.side === 'left' || o.side === 'right' ? { width: popup.offsetWidth, height: popup.offsetHeight } : undefined,
    });
    o.onSide?.(p.side);
    applyPlacement(popup, p);
  };
  return {
    start() {
      if (!running) {
        running = true;
        if (script()) { window.addEventListener('resize', place); window.addEventListener('scroll', place, true); }
        else {
          // Each opening starts on the preferred side, so CSS (and measureSide) picks the side afresh.
          const popup = o.popup(), side = o.side ?? 'bottom';
          if (popup) { popup.setAttribute('data-side', side); o.onSide?.(side); }
        }
      }
      place();
    },
    update: () => { if (running) place(); },
    stop() {
      if (!running) return;
      running = false;
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    },
    get running() { return running; },
  };
}

// ── Dismiss layer ──

export type DismissReason = Extract<ChangeReason, 'outside-press' | 'escape-key' | 'focus-out'>;

export interface DismissOptions {
  /** The layer's own elements (anchor, popup, host): presses and focus inside them are not outside. */
  inside: () => (Node | null | undefined)[];
  onDismiss: (reason: DismissReason, event: Event) => void;
  /** Close on a pointerdown outside (Base UI 'outside-press'). Default true. */
  outsidePress?: boolean;
  /** Close on Escape while this is the topmost layer (Base UI 'escape-key'). Default true. */
  escapeKey?: boolean;
  /** Close when focus moves outside (Base UI 'focus-out'). Default false. */
  focusOut?: boolean;
}

/** Whether a node lies outside every one of the given elements. */
export const isOutside = (target: EventTarget | null, inside: (Node | null | undefined)[]) =>
  !(target instanceof Node) || !inside.some((n) => n && n.contains(target));

interface Layer { o: DismissOptions }
const stack: Layer[] = [];

/** Layers above (opened after) a layer: their elements count as inside it (nesting). */
const insideOf = (layer: Layer) => stack.slice(stack.indexOf(layer)).flatMap((l) => l.o.inside());

/**
 * A dismiss layer: activate() when the layer opens, deactivate() when it closes. Escape goes to
 * the topmost layer only, and not when the key was already handled (defaultPrevented); a press
 * inside a nested layer is not outside its parents.
 */
export function createDismissLayer(o: DismissOptions) {
  const layer: Layer = { o };
  const onPointer = (e: Event) => {
    if (o.outsidePress !== false && isOutside(e.target, insideOf(layer))) o.onDismiss('outside-press', e);
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key !== 'Escape' || e.defaultPrevented || stack[stack.length - 1] !== layer || o.escapeKey === false) return;
    e.preventDefault();
    o.onDismiss('escape-key', e);
  };
  const onFocusOut = (e: FocusEvent) => {
    if (!o.focusOut || isOutside(e.target, insideOf(layer))) return;
    if (isOutside(e.relatedTarget, insideOf(layer))) o.onDismiss('focus-out', e);
  };
  let active = false;
  return {
    activate() {
      if (active) return;
      active = true;
      stack.push(layer);
      if (o.outsidePress !== false) document.addEventListener('pointerdown', onPointer, true);
      if (o.escapeKey !== false) document.addEventListener('keydown', onKey);
      if (o.focusOut) document.addEventListener('focusout', onFocusOut, true);
    },
    deactivate() {
      if (!active) return;
      active = false;
      const i = stack.indexOf(layer);
      if (i >= 0) stack.splice(i, 1);
      document.removeEventListener('pointerdown', onPointer, true);
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('focusout', onFocusOut, true);
    },
    get active() { return active; },
    /** Whether this layer is the topmost open one. */
    get topmost() { return stack[stack.length - 1] === layer; },
  };
}

// ── Focus scope ──

const TABBABLE = '[tabindex], a[href], button, input, select, textarea, [contenteditable=""], [contenteditable=true], summary, iframe, audio[controls], video[controls]';

/** The tabbable elements inside a container, in document order (tabindex ≥ 0, enabled, not hidden). */
export function tabbables(container: Element): HTMLElement[] {
  return [...container.querySelectorAll<HTMLElement>(TABBABLE)].filter((el) =>
    el.tabIndex >= 0 && !(el as HTMLButtonElement).disabled && !el.closest('[hidden], [inert], [aria-disabled=true][tabindex="-1"]'));
}

export interface FocusScopeOptions {
  /** Keep Tab and focus inside the container while active (modal layers). Default false. */
  trap?: boolean;
  /** Return focus to the element focused before activate(), on deactivate(). Default true. */
  returnFocus?: boolean | (() => HTMLElement | null | undefined);
  /** Where focus goes on activate(): an element, false to stay put; default the first tabbable, else the container. */
  initialFocus?: false | (() => HTMLElement | null | undefined);
}

/** A focus scope over a container: activate() on open (moves focus in), deactivate() on close (returns it). */
export function createFocusScope(container: () => HTMLElement | null | undefined, o: FocusScopeOptions = {}) {
  let before: Element | null = null;
  let active = false;
  const focusFirst = (last = false) => {
    const c = container();
    if (!c) return;
    const t = tabbables(c);
    ((last ? t[t.length - 1] : t[0]) ?? c).focus();
  };
  const onKey = (e: KeyboardEvent) => {
    const c = container();
    if (e.key !== 'Tab' || !c) return;
    const t = tabbables(c);
    if (!t.length) { e.preventDefault(); return; }
    const first = t[0], last = t[t.length - 1], at = document.activeElement;
    if (e.shiftKey && (at === first || !c.contains(at))) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && (at === last || !c.contains(at))) { e.preventDefault(); first.focus(); }
  };
  const onFocusIn = (e: FocusEvent) => {
    const c = container();
    if (c && !c.contains(e.target as Node)) focusFirst();
  };
  return {
    activate() {
      if (active) return;
      active = true;
      before = document.activeElement;
      const c = container();
      if (o.initialFocus !== false) {
        const el = o.initialFocus?.();
        if (el) el.focus(); else focusFirst();
      }
      if (o.trap && c) { document.addEventListener('keydown', onKey, true); document.addEventListener('focusin', onFocusIn, true); }
    },
    deactivate() {
      if (!active) return;
      active = false;
      document.removeEventListener('keydown', onKey, true);
      document.removeEventListener('focusin', onFocusIn, true);
      if (o.returnFocus === false) return;
      const back = typeof o.returnFocus === 'function' ? o.returnFocus() : before;
      const c = container();
      // Only when focus is still in the layer (or lost to the body): never steal it from elsewhere.
      const at = document.activeElement;
      if (back instanceof HTMLElement && back.isConnected && (!at || at === document.body || (c && c.contains(at)))) back.focus();
    },
    get active() { return active; },
  };
}

// ── Top layer ──

/** Whether the popover API is available (the top layer for non-modal layers). */
export const popoverSupported = () => typeof HTMLElement !== 'undefined' && 'showPopover' in HTMLElement.prototype;

/** Show an element in the top layer (popover="manual" unless it declares a popover mode). */
export function showTopLayer(el: HTMLElement) {
  if (!el.hasAttribute('popover')) el.setAttribute('popover', 'manual');
  try { el.showPopover?.(); } catch { /* already open, or disconnected */ }
}

/** Take an element out of the top layer. */
export function hideTopLayer(el: HTMLElement) {
  try { el.hidePopover?.(); } catch { /* already closed */ }
}
