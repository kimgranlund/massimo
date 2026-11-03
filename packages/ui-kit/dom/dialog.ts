// Modal layers: the behavior behind Dialog, Alert Dialog and Drawer (Base UI Dialog), shared by
// both renderers. Built on the floating layer pieces (dom/floating.ts): the popup and its backdrop
// go to the top layer (showTopLayer), a dismiss layer closes on Escape and outside presses with
// Base UI's reasons, and a focus scope moves focus in, traps it and returns it. A modal layer
// (modal: true, Base UI's default) also locks page scroll and makes everything outside the popup
// inert, as Base UI does; 'trap-focus' traps focus only; false leaves the page interactive and
// closes on focus-out. Layers nest by DOM containment: a dialog whose host sits inside another's
// popup is nested (no backdrop of its own; data-nested), and each open layer learns how many open
// layers it contains (data-nested-dialog-open, --nested-dialogs).
// Docs: docs/specs/components.md, "Floating layers" and "Modal layers".
import { createDismissLayer, createFocusScope, hideTopLayer, showTopLayer, tabbables, type DismissReason } from './floating.ts';

/** Base UI's modal prop: true (trap, scroll lock, inert outside), 'trap-focus' (trap only), false. */
export type ModalMode = boolean | 'trap-focus';

/** The modal attribute's text form ('true' | 'false' | 'trap-focus') as Base UI's value. */
export const parseModal = (v: string | boolean | null | undefined): ModalMode =>
  v === false || v === 'false' ? false : v === 'trap-focus' ? 'trap-focus' : true;

export interface ModalLayerOptions {
  popup: () => HTMLElement | null | undefined;
  /** The backdrop, shown in the top layer under the popup (not for a nested layer). */
  backdrop?: () => HTMLElement | null | undefined;
  /** The trigger: a press on it is not outside (a non-modal layer it toggles). */
  trigger?: () => HTMLElement | null | undefined;
  modal?: () => ModalMode;
  /** Close on an outside press (and, non-modal, on focus-out). Base UI disablePointerDismissal inverts it. Default true. */
  pointerDismissal?: () => boolean;
  /** Called when the layer asks to close, with Base UI's reason. */
  onDismiss: (reason: DismissReason, event: Event) => void;
  /** Where focus goes on open; default the first tabbable, else the popup. */
  initialFocus?: () => HTMLElement | null | undefined;
  /** Where focus goes on close; default the element focused before (the trigger). */
  finalFocus?: () => HTMLElement | null | undefined;
  /** Called with the number of open layers inside this one, whenever it changes while open. */
  onNested?: (count: number) => void;
}

interface Open { popup: HTMLElement; o: ModalLayerOptions; count: number }
const open: Open[] = [];

/** Report to every open layer how many open layers it contains. */
function renest() {
  for (const l of open) {
    const n = open.filter((x) => x !== l && l.popup.contains(x.popup)).length;
    if (n !== l.count) { l.count = n; l.o.onNested?.(n); }
  }
}

/** Whether an element lies inside the popup of an open modal layer (it is a nested layer). */
export const insideOpenLayer = (el: Element | null | undefined) => !!el && open.some((l) => l.popup !== el && l.popup.contains(el));

// ── Scroll lock ──
let locks = 0;
/**
 * Lock page scroll while a modal layer is open: html[data-scroll-locked] (styles/defaults.ts:
 * overflow hidden), "gutter" when the page was scrolling, so the scrollbar's space stays
 * (scrollbar-gutter: stable) and nothing shifts. Counted, so nested layers unlock once.
 */
export function lockScroll() {
  const html = document.documentElement;
  if (locks++ === 0) html.setAttribute('data-scroll-locked', html.scrollHeight > html.clientHeight ? 'gutter' : '');
  return () => { if (--locks === 0) html.removeAttribute('data-scroll-locked'); };
}

// ── Inert outside ──
const inerted = new Map<Element, number>();
const SKIP = new Set(['script', 'style', 'link', 'template', 'head']);
/**
 * Make everything outside `el` inert (Base UI marks the rest of the page so it cannot be reached
 * by pointer, keyboard or assistive technology): every sibling of `el` and of each of its
 * ancestors up to <body>, except `keep` and live regions (toasts keep announcing). Counted per
 * element, and an author's own inert stays. Returns the undo.
 */
export function inertOutside(el: Element, keep: (Element | null | undefined)[] = []) {
  const marked: Element[] = [];
  for (let n: Element = el; n.parentElement && n !== document.body; n = n.parentElement) {
    for (const s of n.parentElement.children) {
      if (s === n || keep.includes(s) || SKIP.has(s.localName) || s.hasAttribute('aria-live')) continue;
      const c = inerted.get(s) ?? (s.hasAttribute('inert') ? -1 : 0);
      if (c === -1) continue; // the author's
      if (c === 0) s.setAttribute('inert', '');
      inerted.set(s, c + 1);
      marked.push(s);
    }
  }
  return () => {
    for (const s of marked) {
      const c = (inerted.get(s) ?? 1) - 1;
      if (c <= 0) { inerted.delete(s); s.removeAttribute('inert'); } else inerted.set(s, c);
    }
  };
}

/**
 * A modal layer over a popup: open() shows it (top layer, scroll lock, inert outside, dismiss and
 * focus), close() undoes it in reverse and returns focus. `nested` says whether it opened inside
 * another open layer's popup.
 */
export function createModalLayer(o: ModalLayerOptions) {
  let undo: (() => void)[] = [];
  let entry: Open | null = null;
  let nested = false;
  const modal = () => o.modal?.() ?? true;
  const pointer = () => o.pointerDismissal?.() ?? true;
  return {
    open() {
      const popup = o.popup();
      if (entry || !popup) return;
      nested = insideOpenLayer(popup);
      const m = modal();
      const backdrop = nested ? null : o.backdrop?.();
      const dismiss = createDismissLayer({
        inside: () => [o.popup(), o.trigger?.()],
        outsidePress: pointer(), escapeKey: true, focusOut: m === false && pointer(),
        // An outside press closes the topmost layer only (one press, one layer: a nested dialog or a
        // select popup inside the dialog closes, its parent stays).
        onDismiss: (reason, event) => { if (reason === 'outside-press' && !dismiss.topmost) return; o.onDismiss(reason, event); },
      });
      const scope = createFocusScope(() => o.popup(), {
        trap: m !== false,
        // A host that is not focusable itself (a ui-input marked autofocus) hands focus to its first tabbable.
        initialFocus: () => { const el = o.initialFocus?.(); return el && el.tabIndex < 0 ? tabbables(el)[0] ?? el : el ?? undefined; },
        returnFocus: o.finalFocus ? () => o.finalFocus!() : true,
      });
      if (backdrop) showTopLayer(backdrop);
      showTopLayer(popup);
      dismiss.activate();
      // Focus moves in once the popup is shown, before the page turns inert (the scope remembers the
      // trigger as the element to return to).
      scope.activate();
      const steps: (() => void)[] = [];
      if (m === true) { steps.push(lockScroll()); steps.push(inertOutside(popup, [backdrop])); }
      undo = [
        () => dismiss.deactivate(),
        ...steps.reverse(),
        // Inert is lifted before focus returns: an inert trigger cannot take focus.
        () => scope.deactivate(),
        () => { hideTopLayer(popup); if (backdrop) hideTopLayer(backdrop); },
      ];
      entry = { popup, o, count: 0 };
      open.push(entry);
      renest();
    },
    close() {
      if (!entry) return;
      open.splice(open.indexOf(entry), 1);
      entry = null;
      for (const f of undo) f();
      undo = [];
      renest();
    },
    get active() { return !!entry; },
    /** Whether the layer opened inside another open layer (Base UI data-nested). */
    get nested() { return nested; },
  };
}
