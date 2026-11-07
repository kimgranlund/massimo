// Headless toolbar: roving focus along its controls, and how many fit before the rest overflow.
export const FOCUSABLE = 'ui-button, ui-toggle, ui-chip, button, a[href], [role=button]';

export function rovingNext(key: string, index: number, count: number, vertical: boolean, rtl = false) {
  const next = vertical ? 'ArrowDown' : rtl ? 'ArrowLeft' : 'ArrowRight', prev = vertical ? 'ArrowUp' : rtl ? 'ArrowRight' : 'ArrowLeft';
  if (key === next) return (index + 1) % count;
  if (key === prev) return (index - 1 + count) % count;
  if (key === 'Home') return 0;
  if (key === 'End') return count - 1;
  return null;
}

/** How many items fit in `available`, leaving room for the overflow button when any don't. */
export function fitCount(widths: number[], available: number, gap: number, more: number) {
  const total = widths.reduce((a, w) => a + w, 0) + gap * Math.max(0, widths.length - 1);
  if (total <= available) return widths.length;
  let used = more, n = 0;
  for (const w of widths) { const next = used + gap + w; if (next > available) break; used = next; n++; }
  return n;
}

/** Roving focus on any host's controls, and reports nothing else. Returns a cleanup. */
export function attachRoving(host: HTMLElement, vertical: () => boolean) {
  const items = () => [...host.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((e) => !e.hidden && !e.closest('[hidden]'));
  const sync = () => items().forEach((e, i) => { e.tabIndex = i === 0 ? 0 : -1; });
  const onKey = (e: KeyboardEvent) => {
    const list = items(), i = list.indexOf(document.activeElement as HTMLElement);
    if (i < 0) return;
    const to = rovingNext(e.key, i, list.length, vertical(), getComputedStyle(host).direction === 'rtl');
    if (to === null) return;
    e.preventDefault();
    list.forEach((x, n) => { x.tabIndex = n === to ? 0 : -1; });
    list[to].focus();
  };
  host.addEventListener('keydown', onKey);
  return { sync, stop: () => host.removeEventListener('keydown', onKey) };
}
