// React <Toast>: the anatomy, classes and data-* of <ui-toast-viewport>, as Base UI Toast's parts.
// Toast.Provider owns a toast manager (components/toast/manager.ts; `toastManager` to share one
// made with createToastManager) with its limit and timeout; useToastManager() returns { toasts, add,
// update, close, promise }. Toast.Viewport is the region landmark (the recipe root, in the top layer
// unless placement is inline) that stacks, expands on hover or focus, pauses the timers, takes F6 and
// draws a Toast.Root per toast when it has no children. Toast.Root (data-part=toast) holds
// Toast.Content with Toast.Title (h2), Toast.Description (p), Toast.Action and Toast.Close (native
// buttons). Toast.Portal renders into document.body after mount. The preset <Toast> is a Provider
// whose children are followed by a Viewport.
import { createContext, useContext, useEffect, useId, useLayoutEffect, useRef, useState, useSyncExternalStore, type HTMLAttributes, type KeyboardEvent, type MouseEvent, type ReactNode, type CSSProperties, type Context } from 'react';
import { createPortal } from 'react-dom';
import { renderPart, stateOf, type PartBase } from '../compound.react.tsx';
import { hideTopLayer, showTopLayer } from '../../dom/index.ts';
import { toast as toastRecipe } from '../../styled-system/recipes/toast.js';
import { createToastManager, stackIndex, type SwipeDirection, type ToastCloseReason, type ToastManager, type ToastObject, type ToastOptions } from './manager.ts';
import { afterTransitions, attachSwipe, measureStack, nextPaint, swipeDirections } from './stack.ts';

export { createToastManager };
export type { ToastManager, ToastObject, ToastOptions };

const on = (v: unknown) => (v ? '' : undefined);
type Placement = 'bottom-end' | 'bottom-center' | 'top-end' | 'top-center' | 'inline';
/** Base UI-style details of an open change: the toast, why, and the DOM event. */
export interface ToastOpenDetails { id: string; toast: ToastObject; reason: ToastCloseReason; event: Event | undefined }

const ProviderCtx = createContext<{ manager: ToastManager; limit: number } | null>(null);
interface ViewportContext { expanded: boolean; c: Record<string, string>; swipe: SwipeDirection[]; dismiss: (id: string, reason: ToastCloseReason, event: Event) => boolean }
const ViewportCtx = createContext<ViewportContext | null>(null);
interface RootContext { toast: ToastObject; ids: { title: string; description: string }; type: string | undefined; index: number }
const RootCtx = createContext<RootContext | null>(null);
const use = <T,>(ctx: Context<T | null>, part: string, owner: string) => {
  const v = useContext(ctx);
  if (!v) throw new Error(`<${part}> must be inside ${owner}`);
  return v;
};

export interface ToastProviderProps {
  /** Toasts beyond this count stay mounted, data-limited and inert (default 3). */
  limit?: number;
  /** Auto-dismiss delay in ms for toasts that set none (default 5000; 0 keeps them). */
  timeout?: number;
  /** A manager made with createToastManager, to add toasts from outside React. */
  toastManager?: ToastManager;
  children?: ReactNode;
}

/** Toast.Provider: owns the toast manager its viewport and useToastManager share. */
export function ToastProvider({ limit = 3, timeout = 5000, toastManager, children }: ToastProviderProps) {
  const [own] = useState(() => createToastManager({ timeout }));
  const manager = toastManager ?? own;
  manager.setDefaults({ timeout });
  return <ProviderCtx.Provider value={{ manager, limit }}>{children}</ProviderCtx.Provider>;
}

/** Base UI useToastManager: the toasts (newest first) and add / update / close / promise. */
export function useToastManager() {
  const { manager } = use(ProviderCtx, 'useToastManager', 'Toast.Provider');
  const toasts = useSyncExternalStore(manager.subscribe, manager.getSnapshot, manager.getSnapshot);
  return { toasts, add: manager.add, update: manager.update, close: manager.close, promise: manager.promise };
}

export interface ToastPortalProps {
  /** Where to render (default document.body). */
  container?: Element | null;
  children?: ReactNode;
}

/** Toast.Portal: renders its children into document.body (or container) once mounted. */
export function ToastPortal({ container, children }: ToastPortalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? createPortal(children, container ?? document.body) : null;
}

export interface ToastViewportProps extends Omit<HTMLAttributes<HTMLDivElement>, 'className'>, PartBase {
  /** bottom-end (default), bottom-center, top-end, top-center: fixed in the top layer; inline: in flow. */
  placement?: Placement;
  /** Accessible name of the region (default "Notifications"). */
  label?: string;
  /** Default swipe directions of its toasts (default down and right). */
  swipeDirection?: SwipeDirection | SwipeDirection[];
  /** A toast was added (open true) or closed (open false), with { id, toast, reason, event }. */
  onOpenChange?: (open: boolean, details: ToastOpenDetails) => void;
  /** Unit u in px. */
  size?: number;
  children?: ReactNode;
}

/** Toast.Viewport: the region that stacks the toasts (expands on hover or focus, pauses timers, F6). */
export function ToastViewport({ placement = 'bottom-end', label = 'Notifications', swipeDirection, onOpenChange, size, children, className, render, onPointerEnter, onPointerLeave, onFocus, onBlur, onKeyDown, ...rest }: ToastViewportProps) {
  const { manager } = use(ProviderCtx, 'Toast.Viewport', 'Toast.Provider');
  const { toasts } = useToastManager();
  const key = useId();
  const ref = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState(false);
  const [focus, setFocus] = useState(false);
  const expanded = hover || focus;
  const c = toastRecipe({ placement });
  const pause = (k: string, p: boolean) => (p ? manager.pause(`${key}:${k}`) : manager.resume(`${key}:${k}`));
  const reported = useRef(new Set<string>());
  const seen = useRef(new Map<string, ToastObject>());
  const handler = useRef(onOpenChange);
  handler.current = onOpenChange;
  const dismiss = (id: string, reason: ToastCloseReason, event: Event) => {
    const t = manager.toasts.find((x) => x.id === id);
    if (!t || t.transitionStatus === 'ending') return false;
    reported.current.add(id);
    handler.current?.(false, { id, toast: t, reason, event });
    manager.close(id, { reason });
    return true;
  };
  // Opens and closes not made here (an add, a timeout, a script close) are reported after the fact.
  useEffect(() => {
    const before = seen.current;
    seen.current = new Map(toasts.map((t) => [t.id, t]));
    for (const t of toasts) {
      const was = before.get(t.id);
      if (!was && t.transitionStatus !== 'ending') handler.current?.(true, { id: t.id, toast: t, reason: 'none', event: undefined });
      if (t.transitionStatus === 'ending' && was?.transitionStatus !== 'ending' && !reported.current.delete(t.id)) handler.current?.(false, { id: t.id, toast: t, reason: t.closeReason ?? 'none', event: undefined });
    }
  }, [toasts]);
  useEffect(() => {
    const vis = () => pause('hidden', document.visibilityState === 'hidden');
    vis();
    document.addEventListener('visibilitychange', vis);
    return () => { document.removeEventListener('visibilitychange', vis); for (const k of ['hover', 'focus', 'hidden']) manager.resume(`${key}:${k}`); };
  }, [manager]);
  // F6 moves focus into the viewport and back.
  useEffect(() => {
    let back: Element | null = null;
    const f6 = (e: globalThis.KeyboardEvent) => {
      const el = ref.current;
      if (e.key !== 'F6' || e.defaultPrevented || !el || placement === 'inline') return;
      if (el.contains(document.activeElement)) { e.preventDefault(); const b = back as HTMLElement | null; back = null; if (b?.isConnected) b.focus(); else (document.activeElement as HTMLElement | null)?.blur?.(); return; }
      if (!manager.toasts.some((t) => t.transitionStatus !== 'ending')) return;
      e.preventDefault(); back = document.activeElement; el.focus();
    };
    document.addEventListener('keydown', f6);
    return () => document.removeEventListener('keydown', f6);
  }, [manager, placement]);
  // Stack variables from layout, after every render and on resize.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => {
      const live = manager.toasts.filter((t) => t.transitionStatus !== 'ending').map((t) => el.querySelector<HTMLElement>(`:scope > [data-part=toast][data-id="${CSS.escape(t.id)}"]`)).filter(Boolean) as HTMLElement[];
      measureStack(el, live);
    };
    measure();
    if (typeof ResizeObserver !== 'function') return;
    const ro = new ResizeObserver(measure);
    for (const t of el.children) ro.observe(t);
    return () => ro.disconnect();
  });
  // The top layer (raised again when a toast arrives), unless inline.
  const count = useRef(0);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    let open = false;
    try { open = el.matches(':popover-open'); } catch { /* no popover support */ }
    if (placement === 'inline') { if (el.hasAttribute('popover')) { hideTopLayer(el); el.removeAttribute('popover'); } }
    else if (!open || (toasts.length > count.current && !el.contains(document.activeElement))) { hideTopLayer(el); showTopLayer(el); }
    count.current = toasts.length;
  });
  const keys = (e: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e);
    const t = (e.target as Element).closest('[data-part=toast]') as HTMLElement | null;
    if (e.key === 'Escape' && t && t.parentElement === e.currentTarget && dismiss(t.dataset.id!, 'escape-key', e.nativeEvent)) e.preventDefault();
  };
  const attrs = { 'data-expanded': on(expanded) };
  const content = children ?? toasts.map((t) => <ToastRoot key={t.id} toast={t} />);
  return (
    <ViewportCtx.Provider value={{ expanded, c, swipe: swipeDirections(swipeDirection), dismiss }}>
      {renderPart('div', c.root, {
        'data-ui': 'toast', 'data-size': size, role: 'region', 'aria-label': label, 'aria-live': 'polite', 'aria-atomic': 'false', 'aria-relevant': 'additions text', tabIndex: -1,
        ...attrs, className, ...rest, ref,
        onPointerEnter: (e: any) => { onPointerEnter?.(e); setHover(true); pause('hover', true); },
        onPointerLeave: (e: any) => { onPointerLeave?.(e); setHover(false); pause('hover', false); },
        onFocus: (e: any) => { onFocus?.(e); setFocus(true); pause('focus', true); },
        onBlur: (e: any) => { onBlur?.(e); if (e.relatedTarget instanceof Node && e.currentTarget.contains(e.relatedTarget)) return; setFocus(false); pause('focus', false); },
        onKeyDown: keys, render, children: content,
      }, stateOf(attrs))}
    </ViewportCtx.Provider>
  );
}

export interface ToastRootProps extends Omit<HTMLAttributes<HTMLDivElement>, 'className'>, PartBase {
  /** The toast object from useToastManager().toasts. */
  toast: ToastObject;
  /** Directions a swipe dismisses toward (default: the viewport's, down and right). */
  swipeDirection?: SwipeDirection | SwipeDirection[];
  children?: ReactNode;
}

/** Toast.Root: one toast (data-part=toast; dialog, alertdialog when priority is high); swipe to dismiss. */
export function ToastRoot({ toast, swipeDirection, children, className, style, render, ...rest }: ToastRootProps) {
  const { manager, limit } = use(ProviderCtx, 'Toast.Root', 'Toast.Provider');
  const v = use(ViewportCtx, 'Toast.Root', 'Toast.Viewport');
  const { toasts } = useToastManager();
  const id = useId();
  const ref = useRef<HTMLDivElement>(null);
  const [starting, setStarting] = useState(true);
  const [swiping, setSwiping] = useState(false);
  const [swipeDir, setSwipeDir] = useState<SwipeDirection | undefined>();
  const last = useRef(0);
  const i = stackIndex(toasts)(toast);
  if (i >= 0) last.current = i;
  const ending = toast.transitionStatus === 'ending';
  const limited = i >= limit && !ending;
  const dirs = useRef<SwipeDirection[]>(v.swipe);
  dirs.current = swipeDirection ? swipeDirections(swipeDirection) : v.swipe;
  const dismissRef = useRef(v.dismiss);
  dismissRef.current = v.dismiss;
  useEffect(() => { nextPaint(() => setStarting(false)); }, []);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    return attachSwipe(el, {
      directions: () => dirs.current,
      unit: () => parseFloat(getComputedStyle(el).getPropertyValue('--u')) || 4,
      onSwiping: setSwiping,
      onDismiss: (dir, e) => {
        setSwipeDir(dir);
        if (!dismissRef.current(toast.id, 'swipe', e)) { setSwipeDir(undefined); el.style.setProperty('--toast-swipe-movement-x', '0px'); el.style.setProperty('--toast-swipe-movement-y', '0px'); }
      },
    });
  }, [toast.id]);
  useEffect(() => {
    if (!ending) return;
    const el = ref.current;
    nextPaint(() => { (el ? afterTransitions(el) : Promise.resolve()).then(() => manager.remove(toast.id)); });
  }, [ending]);
  const type = toast.type || undefined;
  const ids = { title: `${id}title`, description: `${id}description` };
  const high = toast.priority === 'high';
  const attrs = {
    'data-type': type, 'data-expanded': on(v.expanded), 'data-limited': on(limited), 'data-swiping': on(swiping), 'data-swipe-direction': swipeDir,
    'data-starting-style': on(starting && !ending), 'data-ending-style': on(ending),
  };
  const body = children ?? (
    <ToastContent>
      <ToastTitle />
      <ToastDescription />
      {toast.actionProps ? <ToastAction /> : null}
      <ToastClose />
    </ToastContent>
  );
  return (
    <RootCtx.Provider value={{ toast, ids, type, index: last.current }}>
      {renderPart('div', v.c.toast, {
        'data-part': 'toast', 'data-id': toast.id, role: high ? 'alertdialog' : 'dialog', 'aria-modal': false,
        'aria-labelledby': toast.title != null && toast.title !== '' ? ids.title : undefined,
        'aria-describedby': toast.description != null && toast.description !== '' ? ids.description : undefined,
        'aria-live': high ? 'assertive' : undefined, 'aria-atomic': high ? true : undefined,
        ...attrs, inert: limited || undefined, className, ...rest, ref,
        style: { '--toast-index': last.current, ...style } as CSSProperties, render, children: body,
      }, stateOf(attrs))}
    </RootCtx.Provider>
  );
}

export interface ToastContentProps extends Omit<HTMLAttributes<HTMLDivElement>, 'className'>, PartBase {
  children?: ReactNode;
}

/** Toast.Content: the toast's parts (data-behind while another toast is in front). */
export function ToastContent({ className, render, ...rest }: ToastContentProps) {
  const v = use(ViewportCtx, 'Toast.Content', 'Toast.Viewport');
  const r = use(RootCtx, 'Toast.Content', 'Toast.Root');
  const attrs = { 'data-behind': on(r.index > 0), 'data-expanded': on(v.expanded) };
  return renderPart('div', v.c.content, { 'data-part': 'content', ...attrs, className, ...rest, render }, stateOf(attrs));
}

export interface ToastTextProps extends Omit<HTMLAttributes<HTMLElement>, 'className'>, PartBase {
  children?: ReactNode;
}

/** Toast.Title: an h2 with the toast's title (or its children); nothing when there is neither. */
export function ToastTitle({ children, className, render, ...rest }: ToastTextProps) {
  const v = use(ViewportCtx, 'Toast.Title', 'Toast.Viewport');
  const r = use(RootCtx, 'Toast.Title', 'Toast.Root');
  const text = children ?? r.toast.title;
  if (text == null || text === '') return null;
  const attrs = { 'data-type': r.type };
  return renderPart('h2', v.c.title, { 'data-part': 'title', id: r.ids.title, ...attrs, className, ...rest, render, children: text }, stateOf(attrs));
}

/** Toast.Description: a p with the toast's description (or its children). */
export function ToastDescription({ children, className, render, ...rest }: ToastTextProps) {
  const v = use(ViewportCtx, 'Toast.Description', 'Toast.Viewport');
  const r = use(RootCtx, 'Toast.Description', 'Toast.Root');
  const text = children ?? r.toast.description;
  if (text == null || text === '') return null;
  const attrs = { 'data-type': r.type };
  return renderPart('p', v.c.description, { 'data-part': 'description', id: r.ids.description, ...attrs, className, ...rest, render, children: text }, stateOf(attrs));
}

export interface ToastButtonProps extends Omit<HTMLAttributes<HTMLButtonElement>, 'className'>, PartBase {
  children?: ReactNode;
}

/** Toast.Action: a native button from the toast's actionProps (its children are the label). */
export function ToastAction({ children, onClick, className, render, ...rest }: ToastButtonProps) {
  const v = use(ViewportCtx, 'Toast.Action', 'Toast.Viewport');
  const r = use(RootCtx, 'Toast.Action', 'Toast.Root');
  const { children: label, onClick: act, ...props } = r.toast.actionProps ?? {};
  const attrs = { 'data-type': r.type };
  return renderPart('button', v.c.action, {
    type: 'button', 'data-part': 'action', ...props, ...attrs, className, ...rest,
    onClick: (e: MouseEvent<HTMLButtonElement>) => { act?.(e); onClick?.(e); }, render, children: children ?? label,
  }, stateOf(attrs));
}

/** Toast.Close: a native button that closes its toast (reason close-press). */
export function ToastClose({ children, onClick, className, render, ...rest }: ToastButtonProps) {
  const v = use(ViewportCtx, 'Toast.Close', 'Toast.Viewport');
  const r = use(RootCtx, 'Toast.Close', 'Toast.Root');
  const attrs = { 'data-type': r.type };
  return renderPart('button', v.c.close, {
    type: 'button', 'data-part': 'close', 'aria-label': 'Close', ...attrs, className, ...rest,
    onClick: (e: MouseEvent<HTMLButtonElement>) => { onClick?.(e); if (!e.defaultPrevented) v.dismiss(r.toast.id, 'close-press', e.nativeEvent); },
    render, children: children ?? <i {...{ name: 'x' }} aria-hidden="true" />,
  }, stateOf(attrs));
}

export interface ToastProps extends ToastProviderProps {
  /** The viewport's placement (default bottom-end). */
  placement?: Placement;
  /** The viewport's accessible name. */
  label?: string;
  swipeDirection?: SwipeDirection | SwipeDirection[];
  onOpenChange?: (open: boolean, details: ToastOpenDetails) => void;
}

/** Preset: a Toast.Provider whose children are followed by its Toast.Viewport. */
export function Toast({ placement, label, swipeDirection, onOpenChange, children, ...provider }: ToastProps) {
  return (
    <ToastProvider {...provider}>
      {children}
      <ToastViewport {...{ placement, label, swipeDirection, onOpenChange }} />
    </ToastProvider>
  );
}
Toast.Provider = ToastProvider;
Toast.Portal = ToastPortal;
Toast.Viewport = ToastViewport;
Toast.Root = ToastRoot;
Toast.Content = ToastContent;
Toast.Title = ToastTitle;
Toast.Description = ToastDescription;
Toast.Action = ToastAction;
Toast.Close = ToastClose;
// Base UI's Toast.useToastManager and Toast.createToastManager (also named exports).
Object.assign(Toast, { useToastManager, createToastManager });
