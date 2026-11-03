// React <Popover>: the anatomy, classes and data-* of <ui-popover>, as Base UI Popover's compound
// parts (Root, Trigger, Positioner, Popup, Arrow, Title, Description, Close). The Root holds the
// open state (open / defaultOpen / onOpenChange(open, details)) and renders the host (display:
// contents) that scopes the trigger's anchor name; the Trigger is the kit Button; the Positioner
// is the floating layer (the top layer, the anchored positioner of dom/popup.ts, the dismiss layer
// and focus scope of dom/floating.ts, as the web component's popup-base.ts uses them); the Popup the surface. Popover.Arrow goes inside the Positioner,
// after the Popup (Base UI puts it in the Popup; beside it, the popup can scroll without clipping
// it). The preset <Popover label …>content</Popover> is Root + Trigger + Positioner + Popup.
// The same machinery serves Tooltip and PreviewCard (usePopupRoot and the Popup* parts), each with its own recipe.
import {
  createContext, useContext, useEffect, useId, useLayoutEffect, useRef, useState,
  type HTMLAttributes, type MouseEvent, type PointerEvent as ReactPointerEvent, type ReactNode, type RefObject,
} from 'react';
import { renderPart, stateOf, type PartBase, type PartState } from '../compound.react.tsx';
import { Button, type ButtonProps } from '../button/button.react.tsx';
import {
  createAnchoredPositioner, createDismissLayer, createFocusScope, createHoverIntent, eventDetails, hideTopLayer, isHoverPointer, popupDataAttrs, showTopLayer,
  type Align, type ChangeDetails, type ChangeReason, type Side,
} from '../../dom/index.ts';
import { popover } from '../../styled-system/recipes/popover.js';

const on = (v: unknown) => (v ? '' : undefined);
// React's useLayoutEffect warns on the server; layout work only runs in the browser.
const useClientLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/** How one kind of anchored popup behaves (the web components' popup-base.ts PopupConfig). */
export interface PopupKind {
  ui: string;
  recipe: () => Record<string, string>;
  side: Side; align: Align; delay: number; closeDelay: number;
  press: boolean; focus: boolean; moveFocus: boolean; pressCloses: boolean;
  role?: 'dialog' | 'tooltip';
  /** The trigger element when no render is given (a component or a tag). */
  trigger: any;
  warm?: () => boolean;
  onClosed?: () => void;
}

export interface PopupRootProps extends Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'onChange' | 'prefix'>, PartBase {
  /** Controlled open state. */
  open?: boolean;
  /** Open at first render (uncontrolled). */
  defaultOpen?: boolean;
  /** Called when an interaction opens or closes it, with Base UI's details ({ reason, event }). */
  onOpenChange?: (open: boolean, details: ChangeDetails) => void;
  /** Never opens. */
  disabled?: boolean;
  /** Hover: open after the pointer rests this long on the trigger, ms. */
  delay?: number;
  /** Hover: close this long after the pointer leaves trigger and popup, ms. */
  closeDelay?: number;
  /** Unit u in px. */
  size?: number;
  children?: ReactNode;
}

export interface PopupContext {
  kind: PopupKind;
  c: Record<string, string>;
  open: boolean;
  disabled: boolean;
  hover: boolean;
  modal: boolean;
  ids: { popup: string; title: string; description: string };
  triggerRef: RefObject<HTMLElement | null>;
  reason: RefObject<ChangeReason>;
  instant: boolean;
  setOpen: (open: boolean, reason: ChangeReason, event?: Event) => void;
  hoverIntent: ReturnType<typeof createHoverIntent>;
  state: PartState;
  /** Which of Title and Description are rendered (the popup's aria-labelledby / aria-describedby). */
  named: { title: boolean; description: boolean };
  mark: (part: 'title' | 'description', present: boolean) => void;
}
export const PopupCtx = createContext<PopupContext | null>(null);
const usePopup = (part: string) => {
  const v = useContext(PopupCtx);
  if (!v) throw new Error(`<${part}> must be inside its Root`);
  return v;
};

interface PositionerContext { side: Side; align: Align; surfaceRef: RefObject<HTMLDivElement | null>; arrowRef: RefObject<HTMLDivElement | null> }
const PositionerCtx = createContext<PositionerContext | null>(null);

/** The Root of an anchored popup: open state, hover intent, ids; renders the display: contents host. */
export function usePopupRoot(kind: PopupKind, { open, defaultOpen = false, onOpenChange, disabled = false, delay, closeDelay, hover, modal = false }: PopupRootProps & { hover: boolean; modal?: boolean }) {
  const id = useId();
  const [own, setOwn] = useState(defaultOpen);
  const value = open ?? own;
  const reason = useRef<ChangeReason>('none');
  const [instant, setInstant] = useState(false);
  const [named, setNamed] = useState({ title: false, description: false });
  const mark = (part: 'title' | 'description', present: boolean) => setNamed((n) => (n[part] === present ? n : { ...n, [part]: present }));
  const live = useRef({ value, onOpenChange, open, disabled, delay, closeDelay });
  live.current = { value, onOpenChange, open, disabled, delay, closeDelay };
  const setOpen = (next: boolean, why: ChangeReason, event?: Event) => {
    const l = live.current;
    if (next === l.value || (next && l.disabled)) return;
    reason.current = why;
    if (next) setInstant(!!kind.warm?.());
    l.onOpenChange?.(next, eventDetails(why, event));
    if (l.open === undefined) setOwn(next);
  };
  const intent = useRef<ReturnType<typeof createHoverIntent>>(null);
  intent.current ??= createHoverIntent({
    delay: () => (kind.warm?.() ? 0 : live.current.delay ?? kind.delay),
    closeDelay: () => live.current.closeDelay ?? kind.closeDelay,
    onOpen: (e) => setOpenRef.current(true, 'trigger-hover', e),
    onClose: (e) => setOpenRef.current(false, 'trigger-hover', e),
  });
  const setOpenRef = useRef(setOpen);
  setOpenRef.current = setOpen;
  useEffect(() => () => intent.current?.cancel(), []);
  // A closed popup: the tooltip group stays warm for a moment.
  const was = useRef(value);
  useEffect(() => { if (was.current && !value) { kind.onClosed?.(); reason.current = 'none'; setInstant(false); } was.current = value; }, [value]);
  const c = kind.recipe();
  const attrs = { 'data-open': on(value), 'data-closed': on(!value), 'data-disabled': on(disabled) };
  const ctx: PopupContext = {
    kind, c, open: value, disabled, hover, modal, instant: value && instant,
    ids: { popup: `${id}popup`, title: `${id}title`, description: `${id}description` },
    triggerRef: useRef<HTMLElement>(null), reason, setOpen, hoverIntent: intent.current, state: stateOf(attrs), named, mark,
  };
  return { ctx, attrs, anchor: `--${id.replace(/[^\w-]/g, '')}` };
}

/** The Root element: the host the web component has (display: contents), scoping the anchor name. */
export function PopupRootElement({ ctx, attrs, anchor, size, children, className, render, style, ...rest }: { ctx: PopupContext; attrs: Record<string, unknown>; anchor: string } & PopupRootProps) {
  const { open: _o, defaultOpen: _d, onOpenChange: _c, disabled: _x, delay: _y, closeDelay: _z, ...dom } = rest as any;
  return (
    <PopupCtx.Provider value={ctx}>
      {renderPart('div', ctx.c.root, {
        'data-ui': ctx.kind.ui, 'data-size': size, ...attrs, className, style: { ...style, '--ui-anchor': anchor } as any, ...dom, render, children,
      }, ctx.state)}
    </PopupCtx.Provider>
  );
}

export type PopupTriggerProps = Omit<ButtonProps, 'render' | 'className'> & PartBase & { children?: ReactNode; href?: string };

/** Trigger: the kit Button (Tooltip, Popover) or a link (PreviewCard); data-popup-open while open. */
export function PopupTrigger({ onClick, onPointerEnter, onPointerLeave, onFocus, onBlur, className, render, ...rest }: PopupTriggerProps) {
  const f = usePopup('Trigger');
  const k = f.kind;
  const aria = k.role === 'dialog'
    ? { 'aria-haspopup': 'dialog' as const, 'aria-expanded': f.open, 'aria-controls': f.ids.popup }
    : k.role === 'tooltip' ? { 'aria-describedby': [(rest as any)['aria-describedby'], f.ids.popup].filter(Boolean).join(' ') } : {};
  return renderPart(k.trigger as string, f.c.trigger, {
    'data-part': 'trigger', className, ...rest, ...aria, 'data-popup-open': on(f.open), ref: f.triggerRef,
    onClick: (e: MouseEvent<HTMLElement>) => {
      onClick?.(e as any);
      if (e.defaultPrevented || f.disabled) return;
      if (k.press) { f.hoverIntent.cancel(); f.setOpen(!f.open, 'trigger-press', e.nativeEvent); }
      else if (k.pressCloses && f.open) { f.hoverIntent.cancel(); f.setOpen(false, 'trigger-press', e.nativeEvent); }
    },
    onPointerEnter: (e: ReactPointerEvent<HTMLElement>) => {
      onPointerEnter?.(e as any);
      if (f.hover && !f.disabled && isHoverPointer(e.nativeEvent)) f.hoverIntent.enter(e.nativeEvent, !f.open);
    },
    onPointerLeave: (e: ReactPointerEvent<HTMLElement>) => {
      onPointerLeave?.(e as any);
      if (f.hover && isHoverPointer(e.nativeEvent) && !(f.open && f.reason.current === 'trigger-press')) f.hoverIntent.leave(e.nativeEvent);
    },
    onFocus: (e: any) => {
      onFocus?.(e);
      if (!k.focus || f.disabled || f.open) return;
      let visible = true;
      try { visible = (e.target as Element).matches(':focus-visible'); } catch { /* no :focus-visible */ }
      if (visible) f.setOpen(true, 'trigger-focus', e.nativeEvent);
    },
    onBlur: (e: any) => {
      onBlur?.(e);
      if (!k.focus || !f.open || f.reason.current === 'trigger-press') return;
      const to = e.relatedTarget as Node | null;
      if (to && (e.currentTarget as Element).parentElement?.contains(to)) return;
      f.hoverIntent.cancel();
      f.setOpen(false, 'focus-out', e.nativeEvent);
    },
    render,
  }, { ...f.state, popupOpen: f.open });
}

export interface PopupPositionerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'className'>, PartBase {
  /** Preferred side of the trigger (Base UI side); flips when there is no room. */
  side?: Side;
  /** Alignment along the side (Base UI align). */
  align?: Align;
  children?: ReactNode;
}

/** Positioner: the floating layer, in the top layer while open (popover="manual"), 1u from the trigger. */
export function PopupPositioner({ side, align, className, render, onPointerEnter, onPointerLeave, onClick, children, ...rest }: PopupPositionerProps) {
  const f = usePopup('Positioner');
  const want = side ?? f.kind.side, al = align ?? f.kind.align;
  const surfaceRef = useRef<HTMLDivElement>(null), arrowRef = useRef<HTMLDivElement>(null), ref = useRef<HTMLDivElement>(null);
  const [placed, setPlaced] = useState<Side>(want);
  const live = useRef({ want, al, f });
  live.current = { want, al, f };
  // While open: the top layer, the anchored positioner (dom/popup.ts), the dismiss layer and, when a
  // press opened it, the focus scope; closing undoes them in reverse (the web components' popup-base.ts).
  useClientLayoutEffect(() => {
    const pos = ref.current;
    if (!f.open || !pos) return;
    const k = f.kind;
    setPlaced(want);
    const positioner = createAnchoredPositioner({
      anchor: () => f.triggerRef.current, positioner: () => ref.current, surface: () => surfaceRef.current, arrow: () => arrowRef.current,
      side: () => live.current.want, align: () => live.current.al, onPlace: setPlaced,
    });
    const dismiss = createDismissLayer({
      inside: () => [f.triggerRef.current, ref.current],
      focusOut: k.role === 'dialog' ? !f.modal : k.focus,
      onDismiss: (reason, event) => live.current.f.setOpen(false, reason, event),
    });
    const scope = k.moveFocus && f.reason.current === 'trigger-press'
      ? createFocusScope(() => surfaceRef.current, { trap: f.modal, returnFocus: () => f.triggerRef.current }) : undefined;
    showTopLayer(pos);
    positioner.start();
    dismiss.activate();
    scope?.activate();
    return () => {
      scope?.deactivate();
      dismiss.deactivate();
      positioner.stop();
      hideTopLayer(pos);
    };
  }, [f.open, want, al]);
  const shownSide = f.open ? placed : want;
  const state = popupDataAttrs({ open: f.open, side: shownSide, align: al });
  return (
    <PositionerCtx.Provider value={{ side: shownSide, align: al, surfaceRef, arrowRef }}>
      {renderPart('div', f.c.positioner, {
        'data-part': 'positioner', popover: 'manual', ...state, 'data-placement': `${shownSide}-${al}`, 'data-instant': f.instant ? 'delay' : undefined,
        className, ...rest, ref,
        onPointerEnter: (e: ReactPointerEvent<HTMLDivElement>) => { onPointerEnter?.(e); if (f.hover && isHoverPointer(e.nativeEvent)) f.hoverIntent.enter(e.nativeEvent, false); },
        onPointerLeave: (e: ReactPointerEvent<HTMLDivElement>) => { onPointerLeave?.(e); if (f.hover && isHoverPointer(e.nativeEvent) && f.reason.current !== 'trigger-press') f.hoverIntent.leave(e.nativeEvent); },
        onClick: (e: MouseEvent<HTMLDivElement>) => {
          onClick?.(e);
          const close = (e.target as Element).closest?.('[data-part=close]');
          if (close && !e.defaultPrevented) f.setOpen(false, 'close-press', e.nativeEvent);
        },
        render, children,
      }, stateOf(state))}
    </PositionerCtx.Provider>
  );
}

export interface PopupPartProps extends Omit<HTMLAttributes<HTMLElement>, 'className'>, PartBase {
  children?: ReactNode;
}

/** Popup: the surface (role=dialog for a popover, tooltip for a tooltip). */
export function PopupPopup({ className, render, ...rest }: PopupPartProps) {
  const f = usePopup('Popup');
  const p = useContext(PositionerCtx);
  const state = popupDataAttrs({ open: f.open, side: p?.side ?? f.kind.side, align: p?.align ?? f.kind.align });
  const dialog = f.kind.role === 'dialog'
    ? { 'aria-modal': f.modal ? 'true' : undefined, 'aria-labelledby': f.named.title ? f.ids.title : undefined, 'aria-describedby': f.named.description ? f.ids.description : undefined, tabIndex: -1 } : {};
  return renderPart('div', f.c.popup, {
    'data-part': 'popup', id: f.ids.popup, role: f.kind.role, ...state, 'data-instant': f.instant ? 'delay' : undefined, ...dialog,
    className, ...rest, ref: p?.surfaceRef, render,
  }, stateOf(state));
}

/** Arrow: a triangle on the popup's edge facing the trigger, centered on it (data-uncentered when it cannot be). */
export function PopupArrow({ className, render, ...rest }: PopupPartProps) {
  const f = usePopup('Arrow');
  const p = useContext(PositionerCtx);
  const state = popupDataAttrs({ open: f.open, side: p?.side ?? f.kind.side, align: p?.align ?? f.kind.align });
  return renderPart('div', f.c.arrow, { 'data-part': 'arrow', 'aria-hidden': 'true', ...state, className, ...rest, ref: p?.arrowRef, render }, stateOf(state));
}

// ── Popover ──

export const POPOVER: PopupKind = {
  ui: 'popover', recipe: () => popover(), side: 'bottom', align: 'center', delay: 300, closeDelay: 0,
  press: true, focus: false, moveFocus: true, pressCloses: false, role: 'dialog', trigger: Button,
};

export interface PopoverRootProps extends PopupRootProps {
  /** Trap focus inside the popup while open (Base UI modal). */
  modal?: boolean;
  /** Also open when the pointer rests on the trigger (Base UI Trigger openOnHover). */
  openOnHover?: boolean;
}

/** Popover.Root: the host; shares the open state with its parts. */
export function PopoverRoot({ modal = false, openOnHover = false, ...props }: PopoverRootProps) {
  const r = usePopupRoot(POPOVER, { ...props, hover: openOnHover, modal });
  return <PopupRootElement {...r} {...props} />;
}

/** Popover.Title: names the popup (aria-labelledby). */
export function PopoverTitle({ className, render, ...rest }: PopupPartProps) {
  const f = usePopup('Popover.Title');
  useClientLayoutEffect(() => { f.mark('title', true); return () => f.mark('title', false); }, []);
  return renderPart('h2', f.c.title, { 'data-part': 'title', id: f.ids.title, className, ...rest, render }, f.state);
}

/** Popover.Description: describes the popup (aria-describedby). */
export function PopoverDescription({ className, render, ...rest }: PopupPartProps) {
  const f = usePopup('Popover.Description');
  useClientLayoutEffect(() => { f.mark('description', true); return () => f.mark('description', false); }, []);
  return renderPart('p', f.c.description, { 'data-part': 'description', id: f.ids.description, className, ...rest, render }, f.state);
}

/** Popover.Close: closes the popup (reason close-press); the kit Button. */
export function PopoverClose({ className, render, ...rest }: Omit<ButtonProps, 'render' | 'className'> & PartBase) {
  const f = usePopup('Popover.Close');
  return renderPart(Button as unknown as string, f.c.close, { 'data-part': 'close', className, ...rest, render }, f.state);
}

export interface PopoverProps extends PopoverRootProps {
  /** The trigger's label. */
  label?: ReactNode;
  /** Preferred side and alignment (Popover.Positioner). */
  side?: Side;
  align?: Align;
}

/** Preset: Popover.Root with a Trigger (the label) and a Positioner › Popup holding the children. */
export function Popover({ label, side, align, children, ...rest }: PopoverProps) {
  return (
    <PopoverRoot {...rest}>
      <PopupTrigger>{label}</PopupTrigger>
      <PopupPositioner side={side} align={align}><PopupPopup>{children}</PopupPopup></PopupPositioner>
    </PopoverRoot>
  );
}
Popover.Root = PopoverRoot;
Popover.Trigger = PopupTrigger;
Popover.Positioner = PopupPositioner;
Popover.Popup = PopupPopup;
Popover.Arrow = PopupArrow;
Popover.Title = PopoverTitle;
Popover.Description = PopoverDescription;
Popover.Close = PopoverClose;
