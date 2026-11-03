// Navigation menu behavior on the DOM both renderers produce (ui-navigation-menu and the React
// NavigationMenu): host › [data-part=list] › [data-part=item] › [data-part=trigger] | [data-part=link],
// and host › [data-part=positioner] › popup › viewport › [data-part=content] (a trigger's
// aria-controls names its content). One controller per menu, attached to the host with
// delegated listeners:
// - hover: resting on a trigger opens its item after `delay`; moving between triggers while open
//   switches at once; leaving the triggers and the popup closes it after `closeDelay`; an item
//   opened by a press stays until dismissed.
// - press: a trigger press toggles its item ('trigger-press'); a press on the trigger hover opened
//   keeps it open.
// - keys in the list: the arrows along the orientation (mirrored in RTL), Home and End move focus
//   between triggers and links; ArrowDown (ArrowRight, vertical) opens a trigger's item and focuses
//   its first link ('list-navigation'); Enter / Space press a non-button trigger; Tab from an open
//   trigger goes into its content. In the content: Shift+Tab from the first tabbable returns to the
//   trigger, Tab from the last goes on to the next list stop (or closes, 'focus-out').
// Escape, an outside press and focus leaving are the dismiss layer's (dom/floating.ts).
import type { ChangeReason } from './events.ts';
import { tabbables } from './floating.ts';
import { isHoverPointer } from './popup.ts';

export interface NavigationOptions {
  /** The open item's value ('' when closed). */
  value: () => string;
  /** Ask for a new value (the component fires its change and applies it unless canceled). */
  change: (value: string, reason: ChangeReason, event: Event) => void;
  /** The value of a trigger's item. */
  valueOf: (trigger: HTMLElement) => string;
  vertical: () => boolean;
  delay: () => number;
  closeDelay: () => number;
}

export function createNavigationController(o: NavigationOptions) {
  let host: HTMLElement | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  /** Why the open item opened: a pressed one ignores the pointer leaving. */
  let reason: ChangeReason = 'none';
  const clear = () => { if (timer !== undefined) clearTimeout(timer); timer = undefined; };
  const list = () => host?.querySelector<HTMLElement>(':scope > [data-part=list]') ?? null;
  const positioner = () => host?.querySelector<HTMLElement>(':scope > [data-part=positioner]') ?? null;
  const stops = () => [...(list()?.querySelectorAll<HTMLElement>(':scope > [data-part=item] > :is([data-part=trigger], [data-part=link])') ?? [])];
  const triggerOf = (n: EventTarget | null) => {
    const t = n instanceof Element ? n.closest<HTMLElement>('[data-part=trigger]') : null;
    return t && list()?.contains(t) ? t : null;
  };
  const inPopup = (n: EventTarget | null) => n instanceof Node && !!positioner()?.contains(n);
  const contentOf = (t: HTMLElement) => { const id = t.getAttribute('aria-controls'); return id ? (t.ownerDocument.getElementById(id) as HTMLElement | null) : null; };
  const activeTrigger = () => stops().find((s) => s.getAttribute('data-part') === 'trigger' && o.valueOf(s) === o.value());
  const set = (value: string, why: ChangeReason, e: Event) => {
    if (value === o.value()) return;
    reason = why;
    o.change(value, why, e);
  };

  const press = (t: HTMLElement, e: Event) => {
    clear();
    const v = o.valueOf(t);
    if (o.value() === v && reason === 'trigger-hover') { reason = 'trigger-press'; return; }
    set(o.value() === v ? '' : v, 'trigger-press', e);
  };
  const enter = (t: HTMLElement, e: Event) => {
    clear();
    const v = o.valueOf(t);
    if (o.value() === v || t.hasAttribute('data-disabled')) return;
    if (o.value()) { set(v, 'trigger-hover', e); return; }
    timer = setTimeout(() => { timer = undefined; set(v, 'trigger-hover', e); }, o.delay());
  };
  const leave = (e: Event) => {
    clear();
    if (!o.value() || reason === 'trigger-press') return;
    timer = setTimeout(() => { timer = undefined; set('', 'trigger-hover', e); }, Math.max(o.closeDelay(), 0));
  };

  const onOver = (e: PointerEvent) => {
    if (!isHoverPointer(e)) return;
    const t = triggerOf(e.target);
    if (t && triggerOf(e.relatedTarget) !== t) enter(t, e);
    else if (inPopup(e.target)) clear();
  };
  const onOut = (e: PointerEvent) => {
    if (!isHoverPointer(e)) return;
    const from = triggerOf(e.target) || inPopup(e.target), to = triggerOf(e.relatedTarget) || inPopup(e.relatedTarget);
    if (from && !to) leave(e);
  };
  const onClick = (e: MouseEvent) => {
    const t = triggerOf(e.target);
    if (t && !t.hasAttribute('data-disabled')) { press(t, e); return; }
    const link = (e.target as Element).closest?.('[data-part=link][close-on-click]');
    if (link && host?.contains(link)) set('', 'link-press', e);
  };
  const onKey = (e: KeyboardEvent) => {
    if (list()?.contains(e.target as Node)) listKey(e);
    else if (inPopup(e.target)) contentKey(e);
  };

  const listKey = (e: KeyboardEvent) => {
    const s = stops();
    const at = s.findIndex((x) => x === e.target || x.contains(e.target as Node));
    if (at < 0) return;
    const v = o.vertical(), rtl = !!host && getComputedStyle(host).direction === 'rtl';
    const next = v ? 'ArrowDown' : rtl ? 'ArrowLeft' : 'ArrowRight', prev = v ? 'ArrowUp' : rtl ? 'ArrowRight' : 'ArrowLeft';
    const into = v ? (rtl ? 'ArrowLeft' : 'ArrowRight') : 'ArrowDown';
    const t = s[at].getAttribute('data-part') === 'trigger' ? s[at] : null;
    let to = -1;
    if (e.key === next) to = (at + 1) % s.length;
    else if (e.key === prev) to = (at - 1 + s.length) % s.length;
    else if (e.key === 'Home') to = 0;
    else if (e.key === 'End') to = s.length - 1;
    else if (t && e.key === into) {
      e.preventDefault();
      set(o.valueOf(t), 'list-navigation', e);
      // The content renders on the next update (React: the next commit); focus its first link then.
      queueMicrotask(() => requestFrame(() => { const c = contentOf(t); if (c) tabbables(c)[0]?.focus(); }));
      return;
    } else if (t && e.key === 'Tab' && !e.shiftKey && o.value() === o.valueOf(t)) {
      const c = contentOf(t), first = c ? tabbables(c)[0] : undefined;
      if (first) { e.preventDefault(); first.focus(); }
      return;
    } else if (t && (e.key === 'Enter' || e.key === ' ') && !t.matches('button, ui-button')) {
      e.preventDefault();
      t.click();
      return;
    }
    if (to >= 0) { e.preventDefault(); s[to].focus(); }
  };
  const contentKey = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;
    const t = activeTrigger(), c = t ? contentOf(t) : null;
    if (!t || !c) return;
    const tab = tabbables(c), s = stops(), at = s.indexOf(t), focused = t.ownerDocument.activeElement;
    if (e.shiftKey && focused === tab[0]) { e.preventDefault(); t.focus(); }
    else if (!e.shiftKey && focused === tab[tab.length - 1]) {
      const after = s[at + 1];
      if (after) { e.preventDefault(); after.focus(); } else set('', 'focus-out', e);
    }
  };

  return {
    attach(el: HTMLElement) {
      if (host === el) return;
      this.detach();
      host = el;
      el.addEventListener('pointerover', onOver);
      el.addEventListener('pointerout', onOut);
      el.addEventListener('click', onClick);
      el.addEventListener('keydown', onKey);
    },
    detach() {
      clear();
      if (!host) return;
      host.removeEventListener('pointerover', onOver);
      host.removeEventListener('pointerout', onOut);
      host.removeEventListener('click', onClick);
      host.removeEventListener('keydown', onKey);
      host = null;
    },
    /** The open trigger (the popup's anchor). */
    activeTrigger,
    /** Forget why the item opened (after it closed). */
    reset() { reason = 'none'; clear(); },
    get reason() { return reason; },
  };
}

const requestFrame = (f: () => void) => (typeof window !== 'undefined' && window.requestAnimationFrame ? window.requestAnimationFrame(f) : setTimeout(f, 0));

/** The direction the open item moved in: right / left (down / up when vertical), '' when it opened or closed. */
export function activationDirection(from: number, to: number, vertical: boolean) {
  if (from < 0 || to < 0 || from === to) return '';
  return to > from ? (vertical ? 'down' : 'right') : (vertical ? 'up' : 'left');
}
