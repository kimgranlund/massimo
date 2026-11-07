// Panes around content (ui-admin-shell, React AdminShell): allocate each pane from the host's width,
// and run a drawer's focus. One controller, so both renderers behave alike. There are no viewport
// breakpoints: fit is the host's own width.
import { resolveShell } from '../tokens/geometry/resolve.ts';

export type Side = 'start' | 'end';
export type PaneMode = 'inline' | 'rail' | 'drawer' | 'closed';
export interface PaneWidths { start: number; rail: number; end: number; content: number }
export interface PanePrefs { start: boolean; end: boolean }

/** What fits. The end pane leaves first, then start falls to a rail, then to a drawer. A pane that no longer fits is closed until requested as a drawer. */
export function allocatePanes(width: number, w: PaneWidths, want: PanePrefs, drawer: Side | null): { start: PaneMode; end: PaneMode } {
  const startRoom = want.start ? w.start : 0;
  const endInline = want.end && width >= w.content + startRoom + w.end;
  let start: PaneMode = 'closed';
  if (want.start) start = width >= w.content + w.start ? 'inline' : width >= w.content + w.rail ? 'rail' : 'closed';
  const end: PaneMode = endInline ? 'inline' : 'closed';
  return { start: drawer === 'start' && start !== 'inline' ? 'drawer' : start, end: drawer === 'end' && end !== 'inline' ? 'drawer' : end };
}

/** True when toggling this side should open a drawer rather than change the inline preference. */
export const needsDrawer = (width: number, w: PaneWidths, want: PanePrefs, side: Side) => (side === 'start'
  ? width < w.content + w.rail
  : width < w.content + (want.start ? w.start : 0) + w.end);

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), ui-button:not([disabled])';
/** The host's u in px: its scroll-padding carries var(--u) (admin-shell.recipe.ts). */
const unitOf = (host: HTMLElement) => parseFloat(getComputedStyle(host).scrollPaddingTop) || 4;

export interface PaneOptions { prefs: () => PanePrefs; onChange?: (detail: { start: PaneMode; end: PaneMode }) => void }
export function attachPanes(host: HTMLElement, options: PaneOptions) {
  const pref: { start?: boolean; end?: boolean } = {};
  let drawer: Side | null = null, opener: HTMLElement | null = null, last = '';
  const part = (name: string) => host.querySelector<HTMLElement>(`:scope > [data-part=${name}]`);
  const want = (): PanePrefs => { const p = options.prefs(); return { start: pref.start ?? p.start, end: pref.end ?? p.end }; };
  const widths = () => { const g = resolveShell({ unit: unitOf(host) }); return { start: g.start, rail: g.rail, end: g.end, content: g.content }; };
  const sync = () => {
    const width = host.getBoundingClientRect().width, modes = allocatePanes(width, widths(), want(), drawer);
    host.setAttribute('data-start', modes.start); host.setAttribute('data-end', modes.end);
    const open = modes.start === 'drawer' || modes.end === 'drawer';
    host.toggleAttribute('data-drawer-open', open);
    for (const n of ['toolbar', 'content', 'footer']) { const el = part(n); if (el) el.inert = open; }
    const key = `${modes.start}|${modes.end}`;
    if (key !== last) { const first = !last; last = key; if (!first) options.onChange?.(modes); }
  };
  const close = (destination?: HTMLElement | null) => {
    if (!drawer) return;
    drawer = null; sync();
    (destination ?? opener)?.focus?.();
    opener = null;
  };
  const toggle = (side: Side, from?: HTMLElement | null) => {
    if (drawer === side) { close(); return; }
    if (needsDrawer(host.getBoundingClientRect().width, widths(), want(), side)) {
      opener = from ?? (document.activeElement as HTMLElement | null);
      drawer = side; sync();
      (part(side)?.querySelector<HTMLElement>(FOCUSABLE) ?? part(side))?.focus?.();
      return;
    }
    pref[side] = !want()[side]; sync();
  };
  const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape' && drawer) { e.stopPropagation(); close(); } };
  const onClick = (e: Event) => { if ((e.target as Element).closest?.('[data-part=scrim]')) close(); };
  host.addEventListener('keydown', onKey); host.addEventListener('click', onClick);
  const size = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => requestAnimationFrame(sync)) : undefined;
  size?.observe(host); sync();
  return { toggle, close, sync, stop() { size?.disconnect(); host.removeEventListener('keydown', onKey); host.removeEventListener('click', onClick); } };
}
