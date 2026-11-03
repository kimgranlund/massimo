// The toast manager (Base UI Toast.createToastManager / useToastManager): a framework-free store of
// toasts with add / update / close / promise, the auto-dismiss timers and their pause, shared by
// <ui-toast-viewport> and the React Toast.Provider. Renderers subscribe, draw `toasts` (newest
// first) and call `remove(id)` once a closing toast's exit transition has run.
//
// - add(options) → id. Reusing an id updates that toast in place and restarts its timer (upsert).
// - update(id, options | (prev) => options): merges (data is replaced as a whole); updateKey + 1.
// - close(id?): marks the toast (every toast without an id) as ending (transitionStatus 'ending'),
//   calls onClose; remove(id) drops it and calls onRemove.
// - promise(p, { loading, success, error }): a loading toast (no timeout) updated to success or
//   error (each a string, options, or a function of the result) when p settles; returns p.
// - Timers: `timeout` ms (provider default 5000; 0 keeps the toast). pause(key) / resume(key) stop
//   and restart every timer while any key holds a pause (hover, focus, a hidden document), keeping
//   the time left.

export type ToastPriority = 'low' | 'high';
/** Why a toast closed (Base UI's reason names; timeout and script closes are 'none'). */
export type ToastCloseReason = 'close-press' | 'swipe' | 'escape-key' | 'none';
export type SwipeDirection = 'up' | 'down' | 'left' | 'right';

export interface ToastOptions<Data = unknown> {
  /** Reuse an id to update that toast in place. */
  id?: string;
  /** The heading (text for the web component; any node in React). */
  title?: any;
  /** The message (the default text when there is no title). */
  description?: any;
  /** Free-form kind, shown as data-type (success, error, warning, info, loading color the toast). */
  type?: string;
  /** Auto-dismiss delay in ms; 0 keeps the toast until it is closed. Default: the provider's (5000). */
  timeout?: number;
  /** high announces assertively (aria-live assertive, role alertdialog); default low (polite). */
  priority?: ToastPriority;
  onClose?: () => void;
  onRemove?: () => void;
  /** Props for the action part: children (its label) and onClick, plus any attributes. */
  actionProps?: { children?: any; onClick?: (event: any) => void; [k: string]: any };
  /**
   * Anchor the toast to an element (Base UI positionerProps): it shows beside the anchor, with an
   * arrow, instead of in the stack (feedback such as "Copied" next to the button that copied).
   * side (default top) and align (center) place it; sideOffset is the gap in px (default 1u).
   */
  positionerProps?: { anchor?: Element | null; side?: 'top' | 'bottom' | 'left' | 'right'; align?: 'start' | 'center' | 'end'; sideOffset?: number };
  data?: Data;
}

export interface ToastObject<Data = unknown> extends ToastOptions<Data> {
  id: string;
  timeout: number;
  priority: ToastPriority;
  /** 'starting' just after add, 'ending' after close until remove. */
  transitionStatus?: 'starting' | 'ending';
  /** Increments on every update or upsert. */
  updateKey: number;
  /** Why it closed (set by close). */
  closeReason?: ToastCloseReason;
}

export type ToastUpdate<Data = unknown> = ToastOptions<Data> | ((prev: ToastObject<Data>) => ToastOptions<Data>);
type PromiseState<T> = string | ToastOptions | ((value: T) => string | ToastOptions);

export interface ToastManager {
  /** The toasts, newest first (a new array on every change). */
  readonly toasts: ToastObject[];
  getSnapshot(): ToastObject[];
  subscribe(fn: () => void): () => void;
  add(options: ToastOptions): string;
  update(id: string, options: ToastUpdate): void;
  close(id?: string, details?: { reason?: ToastCloseReason }): void;
  /** Drop a closed toast (renderers call it after the exit transition). */
  remove(id: string): void;
  promise<T>(p: Promise<T>, states: { loading: string | ToastOptions; success: PromiseState<T>; error: PromiseState<unknown> }): Promise<T>;
  pause(key: string): void;
  resume(key: string): void;
  readonly paused: boolean;
  /** Provider defaults: timeout (ms). */
  setDefaults(d: { timeout?: number }): void;
}

let seq = 0;
const asOptions = (s: string | ToastOptions): ToastOptions => (typeof s === 'string' ? { description: s } : s);

export function createToastManager(defaults: { timeout?: number } = {}): ToastManager {
  let toasts: ToastObject[] = [];
  let timeout = defaults.timeout ?? 5000;
  const subs = new Set<() => void>();
  const pauses = new Set<string>();
  // Per toast: the time left and, while running, the timer and when it started.
  const timers = new Map<string, { left: number; handle?: ReturnType<typeof setTimeout>; started?: number }>();
  const emit = () => { toasts = [...toasts]; for (const f of [...subs]) f(); };
  const find = (id: string) => toasts.find((t) => t.id === id);

  const stop = (id: string) => {
    const t = timers.get(id);
    if (t?.handle !== undefined) { clearTimeout(t.handle); t.left = Math.max(0, t.left - (Date.now() - t.started!)); t.handle = undefined; }
  };
  const run = (id: string) => {
    const t = timers.get(id);
    if (!t || t.handle !== undefined || pauses.size) return;
    t.started = Date.now();
    t.handle = setTimeout(() => { timers.delete(id); m.close(id, { reason: 'none' }); }, t.left);
  };
  const arm = (toast: ToastObject) => {
    stop(toast.id);
    timers.delete(toast.id);
    if (toast.timeout > 0 && toast.transitionStatus !== 'ending') { timers.set(toast.id, { left: toast.timeout }); run(toast.id); }
  };

  const m: ToastManager = {
    get toasts() { return toasts; },
    getSnapshot: () => toasts,
    subscribe(fn) { subs.add(fn); return () => { subs.delete(fn); }; },
    add(options) {
      const prev = options.id ? find(options.id) : undefined;
      if (prev) {
        const next: ToastObject = { ...prev, ...options, id: prev.id, timeout: options.timeout ?? prev.timeout, priority: options.priority ?? prev.priority, transitionStatus: prev.transitionStatus === 'ending' ? undefined : prev.transitionStatus, closeReason: undefined, updateKey: prev.updateKey + 1 };
        toasts = toasts.map((t) => (t === prev ? next : t));
        arm(next);
        emit();
        return next.id;
      }
      const toast: ToastObject = { ...options, id: options.id ?? `toast-${++seq}`, timeout: options.timeout ?? timeout, priority: options.priority ?? 'low', transitionStatus: 'starting', updateKey: 0 };
      toasts = [toast, ...toasts];
      arm(toast);
      emit();
      return toast.id;
    },
    update(id, options) {
      const prev = find(id);
      if (!prev) return;
      const o = typeof options === 'function' ? options(prev) : options;
      const next: ToastObject = { ...prev, ...o, id, timeout: o.timeout ?? prev.timeout, priority: o.priority ?? prev.priority, updateKey: prev.updateKey + 1 };
      toasts = toasts.map((t) => (t === prev ? next : t));
      if (o.timeout !== undefined) arm(next);
      emit();
    },
    close(id, details = {}) {
      const targets = toasts.filter((t) => (id === undefined || t.id === id) && t.transitionStatus !== 'ending');
      if (!targets.length) return;
      for (const t of targets) { stop(t.id); timers.delete(t.id); }
      toasts = toasts.map((t) => (targets.includes(t) ? { ...t, transitionStatus: 'ending', closeReason: details.reason ?? 'none' } : t));
      for (const t of targets) t.onClose?.();
      // Nothing draws the toasts: drop them now (no exit transition to wait for).
      if (!subs.size) { for (const t of targets) m.remove(t.id); return; }
      emit();
    },
    remove(id) {
      const t = find(id);
      if (!t) return;
      stop(id); timers.delete(id);
      toasts = toasts.filter((x) => x !== t);
      t.onRemove?.();
      emit();
    },
    promise(p, states) {
      const id = m.add({ ...asOptions(states.loading), type: asOptions(states.loading).type ?? 'loading', timeout: 0 });
      const settle = (state: PromiseState<any>, value: unknown, type: string) => {
        const o = asOptions(typeof state === 'function' ? state(value) : state);
        m.update(id, { type, ...o, timeout: o.timeout ?? timeout });
      };
      p.then((v) => settle(states.success, v, 'success'), (e) => settle(states.error, e, 'error'));
      return p;
    },
    pause(key) {
      const was = pauses.size;
      pauses.add(key);
      if (!was) for (const id of timers.keys()) stop(id);
    },
    resume(key) {
      if (!pauses.delete(key) || pauses.size) return;
      for (const id of timers.keys()) run(id);
    },
    get paused() { return pauses.size > 0; },
    setDefaults(d) { if (d.timeout !== undefined) timeout = d.timeout; },
  };
  return m;
}

/** The page's default manager: <ui-toast-viewport> uses it unless given another (`manager`). */
export const toastManager = createToastManager();

/** The toasts a viewport stacks (not closing), newest first, and each one's index (0 = frontmost). */
export function stackIndex(toasts: readonly ToastObject[]) {
  // Anchored toasts sit beside their anchor, not in the stack.
  const live = toasts.filter((t) => t.transitionStatus !== 'ending' && !t.positionerProps?.anchor);
  return (t: ToastObject) => live.indexOf(t);
}
