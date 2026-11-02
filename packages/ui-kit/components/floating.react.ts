// React binding of the floating layer foundation (dom/floating.ts): one hook wires a popup the kit
// renders to the shared positioner, dismiss layer, focus scope and top layer, the same pieces the
// web components call directly, so both renderers place, dismiss and move focus alike. A context
// hands the layer's state to its parts (Positioner, Popup, Arrow, Close in the components built on
// it). docs/specs/components.md, "Floating layers".
import { createContext, useContext, useEffect, useRef, useState, type RefObject } from 'react';
import {
  createDismissLayer, createFocusScope, createPositioner, eventDetails, hideTopLayer, popupDataAttrs, showTopLayer, toReactProps,
  type Align, type ChangeDetails, type DismissReason, type FocusScopeOptions, type Side,
} from '../dom/index.ts';

export interface FloatingLayerOptions {
  /** Whether the layer is open (controlled by the component). */
  open: boolean;
  /** Called when the layer asks to close (Base UI onOpenChange(false, { reason, event })). */
  onOpenChange?: (open: boolean, details: ChangeDetails) => void;
  /** The preferred side and alignment (Base UI side, align). Defaults bottom, start. */
  side?: Side;
  align?: Align;
  /** Offset from the anchor in px; default 1u from --u. */
  offset?: () => number;
  /** Dismissal: outside press and Escape on by default, focus-out off. */
  outsidePress?: boolean;
  escapeKey?: boolean;
  focusOut?: boolean;
  /** A focus scope over the popup (trap and return); none when omitted. */
  focus?: FocusScopeOptions;
  /** Show the popup in the top layer (popover API). Default true. */
  topLayer?: boolean;
  /** Elements beyond anchor and popup that count as inside (presses there do not dismiss). */
  inside?: () => (Node | null | undefined)[];
}

export interface FloatingLayer<A extends HTMLElement, P extends HTMLElement> {
  anchorRef: RefObject<A | null>;
  popupRef: RefObject<P | null>;
  /** The side the popup sits on (measured; the preferred side until shown). */
  side: Side;
  align: Align;
  /** data-open / data-closed / data-side / data-align for the positioner and popup elements. */
  popupProps: Record<string, string | undefined>;
}

/** The floating layer of a component's popup: position, dismiss, focus and top layer while open. */
export function useFloatingLayer<A extends HTMLElement = HTMLElement, P extends HTMLElement = HTMLElement>(o: FloatingLayerOptions): FloatingLayer<A, P> {
  const anchorRef = useRef<A>(null);
  const popupRef = useRef<P>(null);
  const opts = useRef(o);
  opts.current = o;
  const want = o.side ?? 'bottom', align = o.align ?? 'start';
  const [side, setSide] = useState<Side>(want);
  useEffect(() => {
    if (!o.open) return;
    const popup = popupRef.current;
    if (!popup) return;
    const positioner = createPositioner({ anchor: () => anchorRef.current, popup: () => popupRef.current, side: want, align, offset: opts.current.offset, onSide: setSide });
    const dismiss = createDismissLayer({
      inside: () => [anchorRef.current, popupRef.current, ...(opts.current.inside?.() ?? [])],
      outsidePress: o.outsidePress, escapeKey: o.escapeKey, focusOut: o.focusOut,
      onDismiss: (reason: DismissReason, event: Event) => opts.current.onOpenChange?.(false, eventDetails(reason, event)),
    });
    const scope = o.focus ? createFocusScope(() => popupRef.current, o.focus) : undefined;
    if (o.topLayer !== false) showTopLayer(popup);
    positioner.start();
    dismiss.activate();
    scope?.activate();
    // Content changes resize the popup: the script positioner places it again.
    const follow = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => positioner.update()) : undefined;
    follow?.observe(popup);
    return () => {
      follow?.disconnect();
      scope?.deactivate();
      dismiss.deactivate();
      positioner.stop();
      if (o.topLayer !== false) hideTopLayer(popup);
    };
  }, [o.open, want, align]);
  return { anchorRef, popupRef, side, align, popupProps: toReactProps(popupDataAttrs({ open: o.open, side, align })) as Record<string, string | undefined> };
}

/** A floating layer's state for its parts. */
export interface FloatingContextValue { open: boolean; side: Side; align: Align }
export const FloatingContext = createContext<FloatingContextValue | null>(null);

/** The enclosing floating layer's state (open, side, align); throws outside one. */
export function useFloatingContext(part: string): FloatingContextValue {
  const v = useContext(FloatingContext);
  if (!v) throw new Error(`<${part}> must be inside a floating layer`);
  return v;
}
