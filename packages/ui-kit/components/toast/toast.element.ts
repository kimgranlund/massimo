// <ui-toast-viewport>: the toast region (Base UI Toast.Viewport) that draws the toasts of a toast
// manager (components/toast/manager.ts; the page's `toastManager` unless `manager` is set). Toasts
// are added from script through the manager, Base UI style (every viewport bound to it draws them):
//   import { toastManager } from '@massimo/ui-kit/components/toast/element';
//   const id = toastManager.add({ title: 'Saved', description: 'Draft stored.', type: 'success' });
//   toastManager.update(id, { … }); toastManager.close(id); toastManager.promise(p, { loading, success, error });
//
// Each toast is a [data-part=toast] (Base UI Toast.Root; role=dialog, alertdialog for priority high,
// named by its title, described by its description) holding a [data-part=content] with a
// [data-part=title] (h2), a [data-part=description] (p), a [data-part=action] (role=button, from
// actionProps) and a [data-part=close] (role=button, an x). The viewport is a region landmark with a
// polite live region (high-priority toasts are assertive); F6 moves focus into it and back (not
// into an inline one, which is in the page's tab order).
// Hovering or focusing the stack expands it (data-expanded) and pauses every timer; a hidden
// document pauses them too. Swipe (swipe-direction, default down and right), the close, or Escape
// on a focused toast dismiss it and fire a cancelable openchange { open: false, id, toast, reason,
// event } (reasons swipe, close-press, escape-key; a timeout or a script close fires it with
// reason none after the fact); an added toast fires openchange { open: true, …, reason: 'none' }.
// Toasts beyond `limit` are data-limited and inert. Zero native form elements.
import { UIElement, define } from '../../core/element.ts';
import { signal } from '../../core/signals.ts';
import { applyAttrs, uid } from '../../dom/attrs.ts';
import { createAnchoredPositioner } from '../../dom/popup.ts';
import { hideTopLayer, showTopLayer } from '../../dom/floating.ts';
import { setClasses } from '../classes.ts';
import { toast as toastRecipe } from '../../styled-system/recipes/toast.js';
import { createToastManager, stackIndex, toastManager, type ToastCloseReason, type ToastManager, type ToastObject, type ToastOptions } from './manager.ts';
import { afterTransitions, attachSwipe, measureStack, nextPaint, swipeDirections } from './stack.ts';
import '../../icons/index.ts';

export { createToastManager, toastManager };
export type { ToastManager, ToastObject, ToastOptions };

const on = (v: unknown) => (v ? '' : undefined);
const popoverOpen = (el: Element) => { try { return el.matches(':popover-open'); } catch { return false; } };
const PLACEMENTS = ['bottom-end', 'bottom-center', 'top-end', 'top-center', 'inline'] as const;
export type ToastPlacement = (typeof PLACEMENTS)[number];

interface Drawn {
  el: HTMLElement; content: HTMLElement; key: number; detach: () => void; ids: { title: string; description: string }; leaving?: boolean;
  /** An anchored toast (positionerProps.anchor): its positioner (top layer) and arrow, placed beside the anchor. */
  anchored?: { positioner: HTMLElement; arrow: HTMLElement; stop: () => void };
}
/** The element a drawn toast puts in the viewport: its positioner when anchored. */
const outer = (d: Drawn) => d.anchored?.positioner ?? d.el;
const isAnchored = (t: ToastObject) => !!t.positionerProps?.anchor;

export class UIToastViewport extends UIElement {
  static properties = {
    limit: { type: Number, default: 3 },
    timeout: { type: Number, default: 5000 },
    placement: { type: String, default: 'bottom-end' },
    swipeDirection: { type: String, default: 'down right', attribute: 'swipe-direction' },
    label: { type: String, default: 'Notifications' },
  };
  declare limit: number;
  declare timeout: number;
  declare placement: ToastPlacement;
  declare swipeDirection: string;
  declare label: string;

  #manager = signal<ToastManager>(toastManager);
  #toasts = signal<ToastObject[]>([]);
  #hover = signal(false);
  #focus = signal(false);
  #drawn = new Map<string, Drawn>();
  #seen = new Map<string, ToastObject>();
  #reported = new Set<string>();
  #key = uid('toast-viewport');
  #unsub?: () => void;
  #ro?: ResizeObserver;
  #returnFocus: Element | null = null;
  #count = 0;

  /** The toast manager this viewport draws (default: the page's toastManager). */
  get manager() { return this.#manager.value; }
  set manager(m: ToastManager) {
    if (m === this.#manager.peek()) return;
    if (this.isConnected) this.#unbind();
    this.#manager.value = m;
    if (this.isConnected) this.#bind();
  }
  /** The toasts drawn, newest first. */
  get toasts() { return this.#toasts.value; }
  /** Base UI data-expanded: the stack is hovered or holds focus. */
  get expanded() { return this.#hover.value || this.#focus.value; }

  connected() {
    this.tabIndex = -1;
    this.#ro = typeof ResizeObserver === 'function' ? new ResizeObserver(() => this.#measure()) : undefined;
    this.#bind();
    this.addEventListener('pointerenter', this.#enter);
    this.addEventListener('pointerleave', this.#leave);
    this.addEventListener('focusin', this.#focusIn);
    this.addEventListener('focusout', this.#focusOut);
    this.addEventListener('keydown', this.#onKeydown);
    this.addEventListener('click', this.#onClick);
    document.addEventListener('keydown', this.#onF6);
    document.addEventListener('visibilitychange', this.#onVisibility);
  }

  disconnected() {
    this.#unbind();
    this.#ro?.disconnect();
    this.removeEventListener('pointerenter', this.#enter);
    this.removeEventListener('pointerleave', this.#leave);
    this.removeEventListener('focusin', this.#focusIn);
    this.removeEventListener('focusout', this.#focusOut);
    this.removeEventListener('keydown', this.#onKeydown);
    this.removeEventListener('click', this.#onClick);
    document.removeEventListener('keydown', this.#onF6);
    document.removeEventListener('visibilitychange', this.#onVisibility);
  }

  #bind() {
    const m = this.#manager.peek();
    m.setDefaults({ timeout: this.timeout });
    this.#unsub = m.subscribe(this.#sync);
    this.#sync();
    this.#onVisibility();
  }
  #unbind() {
    const m = this.#manager.peek();
    this.#unsub?.();
    for (const k of ['hover', 'focus', 'hidden']) m.resume(`${this.#key}:${k}`);
  }

  /** Mirror the manager's list and report opens and closes as openchange. */
  #sync = () => {
    const list = this.#manager.peek().toasts;
    const before = this.#seen;
    this.#seen = new Map(list.map((t) => [t.id, t]));
    this.#toasts.value = list;
    for (const t of list) {
      const was = before.get(t.id);
      if (!was && t.transitionStatus !== 'ending') this.#emit(true, t, 'none');
      if (t.transitionStatus === 'ending' && was?.transitionStatus !== 'ending') {
        if (this.#reported.delete(t.id)) continue;
        this.#emit(false, t, t.closeReason ?? 'none');
      }
    }
  };

  #emit(open: boolean, toast: ToastObject, reason: ToastCloseReason, event?: Event) {
    return this.dispatchEvent(new CustomEvent('openchange', { bubbles: true, cancelable: true, detail: { open, id: toast.id, toast, reason, event } }));
  }

  /** A user dismissal: a cancelable openchange, then the manager closes the toast. */
  #dismiss(id: string, reason: ToastCloseReason, event: Event) {
    const t = this.#seen.get(id);
    if (!t || t.transitionStatus === 'ending') return false;
    if (!this.#emit(false, t, reason, event)) return false;
    this.#reported.add(id);
    this.#manager.peek().close(id, { reason });
    return true;
  }

  #pause(k: string, on: boolean) { const m = this.#manager.peek(); if (on) m.pause(`${this.#key}:${k}`); else m.resume(`${this.#key}:${k}`); }
  #enter = () => { this.#hover.value = true; this.#pause('hover', true); };
  #leave = () => { this.#hover.value = false; this.#pause('hover', false); };
  #focusIn = () => { this.#focus.value = true; this.#pause('focus', true); };
  #focusOut = (e: FocusEvent) => {
    if (e.relatedTarget instanceof Node && this.contains(e.relatedTarget)) return;
    this.#focus.value = false;
    this.#pause('focus', false);
  };
  #onVisibility = () => this.#pause('hidden', typeof document !== 'undefined' && document.visibilityState === 'hidden');

  /** F6: into the viewport (when it has toasts), and back to where focus was. */
  #onF6 = (e: KeyboardEvent) => {
    // Inline viewports sit in the page's tab order; only a placed (top-layer) stack is an F6 landmark.
    if (e.key !== 'F6' || e.defaultPrevented || this.placement === 'inline') return;
    if (this.contains(document.activeElement)) {
      e.preventDefault();
      const back = this.#returnFocus as HTMLElement | null;
      this.#returnFocus = null;
      if (back?.isConnected && back.focus) back.focus(); else (document.activeElement as HTMLElement | null)?.blur?.();
      return;
    }
    if (!this.#toasts.peek().some((t) => t.transitionStatus !== 'ending')) return;
    e.preventDefault();
    this.#returnFocus = document.activeElement;
    this.focus();
  };

  #onKeydown = (e: KeyboardEvent) => {
    const t = (e.target as Element).closest?.('[data-part=toast]') as HTMLElement | null;
    if (!t || t.closest('ui-toast-viewport') !== this) return;
    const button = (e.target as Element).closest('[data-part=action], [data-part=close]') as HTMLElement | null;
    if (button && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); button.click(); return; }
    if (e.key === 'Escape' && this.#dismiss(t.dataset.id!, 'escape-key', e)) e.preventDefault();
  };

  #onClick = (e: MouseEvent) => {
    const part = (e.target as Element).closest?.('[data-part=action], [data-part=close]') as HTMLElement | null;
    const t = part?.closest('[data-part=toast]') as HTMLElement | null;
    if (!part || !t || t.closest('ui-toast-viewport') !== this) return;
    const id = t.dataset.id!;
    if (part.getAttribute('data-part') === 'close') { this.#dismiss(id, 'close-press', e); return; }
    this.#seen.get(id)?.actionProps?.onClick?.(e);
  };

  /** Build or refill one toast's parts. */
  #draw(t: ToastObject): Drawn {
    let d = this.#drawn.get(t.id);
    if (!d) {
      const el = document.createElement('div');
      el.setAttribute('data-part', 'toast');
      el.dataset.id = t.id;
      const content = document.createElement('div');
      content.setAttribute('data-part', 'content');
      el.append(content);
      // An anchored toast is not in the stack: no swipe, a positioner and arrow instead.
      const anchored = isAnchored(t) ? this.#anchor(t, el) : undefined;
      const detach = anchored ? () => {} : attachSwipe(el, {
        directions: () => swipeDirections(this.swipeDirection),
        unit: () => parseFloat(getComputedStyle(this).getPropertyValue('--u')) || 4,
        onSwiping: (s) => el.toggleAttribute('data-swiping', s),
        onDismiss: (dir, ev) => {
          el.setAttribute('data-swipe-direction', dir);
          if (!this.#dismiss(t.id, 'swipe', ev)) {
            el.removeAttribute('data-swipe-direction');
            el.style.setProperty('--toast-swipe-movement-x', '0px');
            el.style.setProperty('--toast-swipe-movement-y', '0px');
          }
        },
      });
      d = { el, content, key: -1, detach, anchored, ids: { title: uid('toast-title'), description: uid('toast-description') } };
      this.#drawn.set(t.id, d);
      el.setAttribute('data-starting-style', '');
      nextPaint(() => el.removeAttribute('data-starting-style'));
      if (!anchored) this.#ro?.observe(el);
    }
    if (d.key !== t.updateKey) {
      d.key = t.updateKey;
      const parts: HTMLElement[] = [];
      if (t.title != null && t.title !== '') {
        const h = document.createElement('h2');
        h.setAttribute('data-part', 'title'); h.id = d.ids.title; h.textContent = String(t.title);
        parts.push(h);
      }
      if (t.description != null && t.description !== '') {
        const p = document.createElement('p');
        p.setAttribute('data-part', 'description'); p.id = d.ids.description; p.textContent = String(t.description);
        parts.push(p);
      }
      if (t.actionProps) {
        const { children, onClick, ...attrs } = t.actionProps;
        const a = document.createElement('div');
        for (const [k, v] of Object.entries(attrs)) if (typeof v === 'string' || typeof v === 'number') a.setAttribute(k, String(v));
        a.setAttribute('data-part', 'action'); a.setAttribute('role', 'button'); a.tabIndex = 0;
        a.textContent = children == null ? '' : String(children);
        parts.push(a);
      }
      const x = document.createElement('div');
      x.setAttribute('data-part', 'close'); x.setAttribute('role', 'button'); x.setAttribute('aria-label', 'Close'); x.tabIndex = 0;
      const icon = document.createElement('i'); icon.setAttribute('name', 'x'); icon.setAttribute('aria-hidden', 'true');
      x.append(icon);
      parts.push(x);
      d.content.replaceChildren(...parts);
    }
    return d;
  }

  /** Wrap an anchored toast in its positioner and arrow, show it in the top layer, and place it beside the anchor. */
  #anchor(t: ToastObject, el: HTMLElement): NonNullable<Drawn['anchored']> {
    const positioner = document.createElement('div');
    positioner.setAttribute('data-part', 'positioner');
    const arrow = document.createElement('div');
    arrow.setAttribute('data-part', 'arrow');
    arrow.setAttribute('aria-hidden', 'true');
    positioner.append(el, arrow);
    const p = () => this.#seen.get(t.id)?.positionerProps ?? t.positionerProps ?? {};
    const api = createAnchoredPositioner({
      anchor: () => p().anchor, positioner: () => positioner, surface: () => el, arrow: () => arrow,
      side: () => p().side ?? 'top', align: () => p().align ?? 'center', script: true, offset: () => p().sideOffset,
      onPlace: (side) => { for (const x of [positioner, el, arrow]) x.setAttribute('data-side', side); },
    });
    queueMicrotask(() => { if (!positioner.isConnected) return; showTopLayer(positioner); api.start(); });
    return { positioner, arrow, stop: () => { api.stop(); hideTopLayer(positioner); } };
  }

  #measure() {
    const live = this.#toasts.peek().filter((t) => t.transitionStatus !== 'ending' && !isAnchored(t)).map((t) => this.#drawn.get(t.id)?.el).filter(Boolean) as HTMLElement[];
    measureStack(this, live);
  }

  update() {
    const list = this.#toasts.value;
    const expanded = this.#hover.value || this.#focus.value;
    const limit = this.limit, placement = (PLACEMENTS as readonly string[]).includes(this.placement) ? this.placement : 'bottom-end';
    const index = stackIndex(list);
    const c = toastRecipe({ placement });
    this.#manager.value.setDefaults({ timeout: this.timeout });
    applyAttrs(this, {
      role: 'region', 'aria-label': this.label || 'Notifications', 'aria-live': 'polite', 'aria-atomic': 'false', 'aria-relevant': 'additions text',
      'data-expanded': on(expanded),
    });
    setClasses(this, c.root);
    // Draw in list order (newest first), keeping elements in place when they already are.
    let at: ChildNode | null = this.firstChild;
    for (const t of list) {
      const d = this.#draw(t), node = outer(d);
      if (node !== at) this.insertBefore(node, at); else at = at.nextSibling;
      const i = index(t), behind = i > 0, limited = i >= limit, type = t.type || undefined;
      const title = d.content.querySelector(':scope > [data-part=title]'), description = d.content.querySelector(':scope > [data-part=description]');
      applyAttrs(d.el, {
        role: t.priority === 'high' ? 'alertdialog' : 'dialog', 'aria-modal': 'false',
        'aria-labelledby': title ? d.ids.title : undefined, 'aria-describedby': description ? d.ids.description : undefined,
        'aria-live': t.priority === 'high' ? 'assertive' : undefined, 'aria-atomic': t.priority === 'high' ? 'true' : undefined,
        'data-type': type, 'data-expanded': on(expanded), 'data-limited': on(limited && t.transitionStatus !== 'ending'),
        'data-ending-style': on(t.transitionStatus === 'ending'), inert: on(limited && t.transitionStatus !== 'ending'),
      });
      if (i >= 0) d.el.style.setProperty('--toast-index', String(i));
      applyAttrs(d.content, { 'data-behind': on(behind), 'data-expanded': on(expanded) });
      for (const p of d.content.children) applyAttrs(p, { 'data-type': type });
      setClasses(d.el, c.toast);
      if (d.anchored) { setClasses(d.anchored.positioner, c.positioner); setClasses(d.anchored.arrow, c.arrow); applyAttrs(d.el, { 'data-anchored': '' }); }
      setClasses(d.content, c.content);
      for (const p of d.content.children) setClasses(p, c[p.getAttribute('data-part') as 'title']);
      if (t.transitionStatus === 'ending' && !d.leaving) {
        d.leaving = true;
        nextPaint(() => afterTransitions(d.el).then(() => this.#manager.peek().remove(t.id)));
      }
    }
    for (const [id, d] of this.#drawn) {
      if (list.some((t) => t.id === id)) continue;
      d.detach(); d.anchored?.stop(); this.#ro?.unobserve(d.el); outer(d).remove(); this.#drawn.delete(id);
    }
    this.#measure();
    // A removed toast that held focus fires no focusout everywhere: let the timers run again.
    if (this.#focus.peek() && !this.contains(document.activeElement)) queueMicrotask(() => { if (!this.contains(document.activeElement)) { this.#focus.value = false; this.#pause('focus', false); } });
    // In the top layer (above dialogs opened earlier) unless inline; raised again when a toast arrives.
    const count = list.length;
    if (placement === 'inline') { if (this.hasAttribute('popover')) { hideTopLayer(this); this.removeAttribute('popover'); } }
    else if (!popoverOpen(this) || (count > this.#count && !this.contains(document.activeElement))) { hideTopLayer(this); showTopLayer(this); }
    this.#count = count;
  }
}

define('ui-toast-viewport', UIToastViewport);

declare global {
  interface HTMLElementTagNameMap { 'ui-toast-viewport': UIToastViewport }
}
