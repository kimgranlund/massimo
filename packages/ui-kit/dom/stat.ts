// Headless stat-card trend: a line through the values, and a sentence that says what it shows.
const round = (n: number) => Math.round(n * 100) / 100;

/** Parse "4, 6, 9" into numbers, dropping anything that isn't one. */
export const parseTrend = (text: string) => text.split(',').map((v) => Number(v.trim())).filter((v, i, all) => all.length > 1 && text.split(',')[i].trim() !== '' && Number.isFinite(v));

/** SVG polyline points for the values in a w × h box, inset by the stroke so the line isn't clipped. */
export function trendPoints(values: number[], w: number, h: number, inset = 1) {
  if (values.length < 2) return '';
  const lo = Math.min(...values), hi = Math.max(...values), span = hi - lo || 1;
  return values.map((v, i) => `${round((i / (values.length - 1)) * w)},${round(h - inset - ((v - lo) / span) * (h - 2 * inset))}`).join(' ');
}

/** The trend in words, for assistive technology. */
export function trendLabel(values: number[]) {
  if (values.length < 2) return '';
  const first = values[0], last = values[values.length - 1];
  return `Trend ${last > first ? 'rising' : last < first ? 'falling' : 'flat'}, from ${first} to ${last}`;
}
