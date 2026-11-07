// Moving and resizing a retained panel (ui-floating-panel, React FloatingPanel): pure placement plus a
// pointer and keyboard controller. Script sets only custom properties; the recipe reads them.
export type Anchor = 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end' | 'center';
export interface Box { x: number; y: number; width: number; height: number }
export interface Bounds { width: number; height: number; margin: number }

/** Keep a box inside the bounds. A box too big for them sticks to the top start, so its header stays reachable. */
export function clampBox(b: Box, v: Bounds): Box {
  const x = Math.max(v.margin, Math.min(b.x, v.width - b.width - v.margin));
  const y = Math.max(v.margin, Math.min(b.y, v.height - b.height - v.margin));
  return { ...b, x, y };
}
export function snapBox(anchor: Anchor, b: Box, v: Bounds): Box {
  const end = v.width - b.width - v.margin, bottom = v.height - b.height - v.margin;
  const at: Record<Anchor, [number, number]> = { 'top-start': [v.margin, v.margin], 'top-end': [end, v.margin], 'bottom-start': [v.margin, bottom], 'bottom-end': [end, bottom], center: [(v.width - b.width) / 2, (v.height - b.height) / 2] };
  return clampBox({ ...b, x: at[anchor][0], y: at[anchor][1] }, v);
}
/** The arrow key's move in px, or null. Shift moves four times as far. */
export function moveKey(key: string, step: number, shift = false): [number, number] | null {
  const n = shift ? step * 4 : step;
  return ({ ArrowLeft: [-n, 0], ArrowRight: [n, 0], ArrowUp: [0, -n], ArrowDown: [0, n] } as Record<string, [number, number]>)[key] ?? null;
}
export const sizeBox = (b: Box, dw: number, dh: number, min: number, v: Bounds): Box => ({
  ...b, width: Math.min(Math.max(min, b.width + dw), v.width - b.x - v.margin), height: Math.min(Math.max(min, b.height + dh), v.height - b.y - v.margin),
});

export interface PanelGeometry { margin: number; step: number; min: number }
/** Drag by the header, resize by the grip, arrow keys on the header. Returns snap and stop. */
export function attachPanel(host: HTMLElement, geometry: () => PanelGeometry) {
  const bounds = (): Bounds => ({ width: innerWidth, height: innerHeight, margin: geometry().margin });
  const box = (): Box => { const r = host.getBoundingClientRect(); return { x: r.left, y: r.top, width: r.width, height: r.height }; };
  const place = (b: Box) => { host.setAttribute('data-placed', ''); host.style.setProperty('--panel-x', `${b.x}px`); host.style.setProperty('--panel-y', `${b.y}px`); };
  const resize = (b: Box) => { host.style.setProperty('--panel-w', `${b.width}px`); host.style.setProperty('--panel-h', `${b.height}px`); };
  const part = (e: Event) => (e.target as Element).closest?.('[data-part]')?.getAttribute('data-part');
  const onDown = (e: PointerEvent) => {
    const name = part(e);
    if (name !== 'header' && name !== 'grip') return;
    if (name === 'header' && (e.target as Element).closest?.('ui-button, button, a, [data-part=controls]')) return;
    e.preventDefault();
    const from = box(), x0 = e.clientX, y0 = e.clientY;
    host.setAttribute('data-dragging', '');
    const move = (m: PointerEvent) => {
      const dx = m.clientX - x0, dy = m.clientY - y0;
      if (name === 'grip') resize(sizeBox(from, dx, dy, geometry().min, bounds()));
      else place(clampBox({ ...from, x: from.x + dx, y: from.y + dy }, bounds()));
    };
    const up = () => { host.removeAttribute('data-dragging'); removeEventListener('pointermove', move); removeEventListener('pointerup', up); };
    addEventListener('pointermove', move); addEventListener('pointerup', up);
  };
  const onKey = (e: KeyboardEvent) => {
    if (part(e) !== 'header' || (e.target as Element).closest?.('[data-part=controls]')) return;
    const m = moveKey(e.key, geometry().step, e.shiftKey);
    if (!m) return;
    e.preventDefault();
    const b = box();
    place(clampBox({ ...b, x: b.x + m[0], y: b.y + m[1] }, bounds()));
  };
  host.addEventListener('pointerdown', onDown); host.addEventListener('keydown', onKey);
  return { snap(anchor: Anchor) { place(snapBox(anchor, box(), bounds())); }, stop() { host.removeEventListener('pointerdown', onDown); host.removeEventListener('keydown', onKey); } };
}
