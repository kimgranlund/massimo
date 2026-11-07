// Headless OKLCH drafts for the color picker: parse and format, kept to a precision that survives a
// round trip through CSS.
export type Oklch = { l: number; c: number; h: number };
const NUM = '(-?\\d*\\.?\\d+)';
const PATTERN = new RegExp(`^oklch\\(\\s*${NUM}\\s+${NUM}\\s+${NUM}\\s*\\)$`, 'i');

export function parseOklch(text: string): Oklch | null {
  const m = PATTERN.exec(text.trim());
  if (!m) return null;
  const [l, c, h] = m.slice(1).map(Number);
  return { l: Math.min(1, Math.max(0, l)), c: Math.max(0, c), h: ((h % 360) + 360) % 360 };
}
const round = (n: number, p: number) => Number(n.toFixed(p));
export const formatOklch = ({ l, c, h }: Oklch) => `oklch(${round(l, 3)} ${round(c, 3)} ${round(h, 1)})`;
export const COLOR_RANGES = { l: { min: 0, max: 1, step: 0.01 }, c: { min: 0, max: 0.37, step: 0.005 }, h: { min: 0, max: 360, step: 1 } } as const;
