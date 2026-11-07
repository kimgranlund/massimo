// Charts (ui-chart, React Chart): a pure model that turns data into one SVG string, so both renderers
// draw the same marks. Color is never here: each mark carries data-series and the recipe maps that to
// the data roles (docs/specs/charts.md). Text in the markup is escaped.
export type ChartKind = 'column' | 'bar' | 'line' | 'area' | 'donut';
export interface ChartSeries { name: string; values: (number | null)[] }
export interface ChartData { categories: string[]; series: ChartSeries[] }
export interface ChartOptions { kind: ChartKind; data: ChartData; width: number; height: number; stacked?: boolean; locale?: string; label?: string }

/** The data roles available, in fixed order. */
export const SERIES_LIMIT = 6;
const esc = (s: unknown) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const r2 = (n: number) => Math.round(n * 100) / 100;

/** Beyond six series, the last become "Other": a seventh hue is never generated. */
export function foldSeries(series: ChartSeries[], limit = SERIES_LIMIT): ChartSeries[] {
  if (series.length <= limit) return series;
  const keep = series.slice(0, limit - 1), rest = series.slice(limit - 1);
  const length = Math.max(...rest.map((s) => s.values.length));
  return [...keep, { name: 'Other', values: Array.from({ length }, (_, i) => rest.reduce((sum, s) => sum + (s.values[i] ?? 0), 0)) }];
}

/** Round ticks that span min…max: 1, 2 or 5 × 10ⁿ. */
export function niceTicks(min: number, max: number, count = 6): number[] {
  if (min === max) { if (min === 0) return [0, 1]; if (min > 0) min = 0; else max = 0; }
  const rough = (max - min) / Math.max(1, count - 1), power = 10 ** Math.floor(Math.log10(rough)), n = rough / power;
  const step = (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * power, first = Math.floor(min / step), last = Math.ceil(max / step);
  return Array.from({ length: last - first + 1 }, (_, i) => r2((first + i) * step));
}
export const formatValue = (v: number, locale?: string) => new Intl.NumberFormat(locale, { notation: Math.abs(v) >= 10000 ? 'compact' : 'standard', maximumFractionDigits: 2 }).format(v);

/** A bar rounded at its data end, anchored square at the baseline. */
export function barPath(x: number, y: number, w: number, h: number, r: number, end: 'top' | 'bottom' | 'left' | 'right' | 'none'): string {
  const c = Math.min(r, w / 2, h / 2), X = x + w, Y = y + h, [a, b, d, e] = [x, y, X, Y].map(r2), k = r2(c);
  if (w <= 0 || h <= 0) return '';
  if (end === 'top') return `M${a} ${e}V${r2(y + c)}Q${a} ${b} ${r2(x + c)} ${b}H${r2(X - c)}Q${d} ${b} ${d} ${r2(y + c)}V${e}Z`;
  if (end === 'bottom') return `M${a} ${b}V${r2(Y - c)}Q${a} ${e} ${r2(x + c)} ${e}H${r2(X - c)}Q${d} ${e} ${d} ${r2(Y - c)}V${b}Z`;
  if (end === 'right') return `M${a} ${b}H${r2(X - c)}Q${d} ${b} ${d} ${r2(y + c)}V${r2(Y - c)}Q${d} ${e} ${r2(X - c)} ${e}H${a}Z`;
  if (end === 'left') return `M${d} ${b}H${r2(x + c)}Q${a} ${b} ${a} ${r2(y + c)}V${r2(Y - c)}Q${a} ${e} ${r2(x + c)} ${e}H${d}Z`;
  return k >= 0 ? `M${a} ${b}H${d}V${e}H${a}Z` : '';
}
/** One donut slice from angle a to b (radians, clockwise from the top). */
export function arcPath(cx: number, cy: number, outer: number, inner: number, a: number, b: number): string {
  const end = Math.min(b, a + Math.PI * 2 - 1e-4), large = end - a > Math.PI ? 1 : 0, at = (r: number, t: number) => `${r2(cx + r * Math.sin(t))} ${r2(cy - r * Math.cos(t))}`;
  return `M${at(outer, a)}A${outer} ${outer} 0 ${large} 1 ${at(outer, end)}L${at(inner, end)}A${inner} ${inner} 0 ${large} 0 ${at(inner, a)}Z`;
}

const tick = (x: number, y: number, text: string, anchor = 'middle') => `<text data-part="tick" x="${r2(x)}" y="${r2(y)}" text-anchor="${anchor}">${esc(text)}</text>`;
const band = (i: number, x: number, y: number, w: number, h: number, cross: string) => `<g data-i="${i}">${cross}<rect data-part="hit" x="${r2(x)}" y="${r2(y)}" width="${r2(w)}" height="${r2(h)}"></rect></g>`;

/** Totals per category across series, split into positive and negative stacks. */
const stackExtent = (s: ChartSeries[], n: number) => {
  let hi = 0, lo = 0;
  for (let i = 0; i < n; i++) { let p = 0, q = 0; for (const x of s) { const v = x.values[i] ?? 0; if (v > 0) p += v; else q += v; } hi = Math.max(hi, p); lo = Math.min(lo, q); }
  return [lo, hi];
};

function cartesian(o: ChartOptions, series: ChartSeries[]): string {
  const { kind, width: W, height: H, data: { categories }, stacked, locale } = o, n = categories.length, horizontal = kind === 'bar', bars = kind === 'column' || kind === 'bar';
  const all = series.flatMap((s) => s.values.filter((v): v is number => v !== null));
  const [lo, hi] = stacked && bars ? stackExtent(series, n) : [Math.min(...all, bars ? 0 : Infinity), Math.max(...all, bars ? 0 : -Infinity)];
  const ticks = niceTicks(all.length ? lo : 0, all.length ? hi : 1), t0 = ticks[0], t1 = ticks[ticks.length - 1];
  const CH = 7, labelW = Math.max(...ticks.map((t) => formatValue(t, locale).length)) * CH + 8, catW = Math.max(0, ...categories.map((c) => c.length)) * CH + 8;
  const L = horizontal ? Math.min(catW, W * 0.35) : labelW, T = 8, R = 8, B = 24, pw = Math.max(1, W - L - R), ph = Math.max(1, H - T - B), parts: string[] = [];
  const val = (v: number) => (v - t0) / (t1 - t0 || 1);
  const yOf = (v: number) => T + ph * (1 - val(v)), xOf = (v: number) => L + pw * val(v);
  for (const t of ticks) {
    if (horizontal) parts.push(`<line data-part="grid" x1="${r2(xOf(t))}" x2="${r2(xOf(t))}" y1="${T}" y2="${T + ph}"></line>`, tick(xOf(t), H - 8, formatValue(t, locale)));
    else parts.push(`<line data-part="grid" x1="${L}" x2="${W - R}" y1="${r2(yOf(t))}" y2="${r2(yOf(t))}"></line>`, tick(L - 8, yOf(t) + 4, formatValue(t, locale), 'end'));
  }
  const pitch = (horizontal ? ph : pw) / Math.max(1, bars ? n : n - 1);
  const every = Math.max(1, Math.ceil((CH * Math.max(1, ...categories.map((c) => c.length)) + 8) / pitch));
  categories.forEach((c, i) => {
    if (horizontal) parts.push(tick(L - 8, T + pitch * (i + 0.5) + 4, c.length * CH + 8 > L ? `${c.slice(0, Math.max(1, Math.floor(L / CH) - 2))}…` : c, 'end'));
    else if (i % every === 0) parts.push(tick(L + pitch * (bars ? i + 0.5 : i), H - 8, c, !bars && i === 0 ? 'start' : !bars && i === n - 1 ? 'end' : 'middle'));
  });
  if (bars) {
    const groups = stacked ? 1 : Math.max(1, series.length), inner = pitch * 0.6, slot = inner / groups, thick = Math.max(1, slot - (groups > 1 ? 2 : 0));
    for (let i = 0; i < n; i++) {
      const start = (horizontal ? T : L) + pitch * i + (pitch - inner) / 2;
      let up = 0, down = 0;
      const stacks = series.map((s, j) => ({ s, j })), lastUp = stacked ? stacks.filter((e) => (e.s.values[i] ?? 0) > 0).pop()?.j : -1, lastDown = stacked ? stacks.filter((e) => (e.s.values[i] ?? 0) < 0).pop()?.j : -1;
      series.forEach((s, j) => {
        const v = s.values[i];
        if (v === null || v === undefined || v === 0) return;
        const pos = stacked ? 0 : j, from = stacked ? (v > 0 ? up : down) : 0, to = from + v;
        if (stacked) { if (v > 0) up = to; else down = to; }
        const a = start + slot * pos, rounded = !stacked || j === (v > 0 ? lastUp : lastDown), gap = stacked ? 1 : 0;
        const d = horizontal
          ? barPath(Math.min(xOf(from), xOf(to)) + gap, a, Math.max(0, Math.abs(xOf(to) - xOf(from)) - gap * 2), thick, 4, rounded ? (v > 0 ? 'right' : 'left') : 'none')
          : barPath(a, Math.min(yOf(from), yOf(to)) + gap, thick, Math.max(0, Math.abs(yOf(to) - yOf(from)) - gap * 2), 4, rounded ? (v > 0 ? 'top' : 'bottom') : 'none');
        if (d) parts.push(`<path data-mark="fill" data-series="${j + 1}" d="${d}"></path>`);
      });
    }
    for (let i = 0; i < n; i++) parts.push(horizontal ? band(i, L, T + pitch * i, pw, pitch, '') : band(i, L + pitch * i, T, pitch, ph, ''));
  } else {
    const x = (i: number) => L + (n > 1 ? pw * i / (n - 1) : pw / 2);
    series.forEach((s, j) => {
      // A missing sample stays a gap: the line breaks there.
      const runs: [number, number][][] = [[]];
      s.values.forEach((v, i) => { if (v === null || v === undefined) { if (runs[runs.length - 1].length) runs.push([]); } else runs[runs.length - 1].push([x(i), yOf(v)]); });
      for (const run of runs.filter((r) => r.length)) {
        const line = run.map(([a, b], i) => `${i ? 'L' : 'M'}${r2(a)} ${r2(b)}`).join('');
        if (kind === 'area') { const base = yOf(Math.max(t0, Math.min(0, t1))); parts.push(`<path data-mark="area" data-series="${j + 1}" d="${line}L${r2(run[run.length - 1][0])} ${r2(base)}L${r2(run[0][0])} ${r2(base)}Z"></path>`); }
        parts.push(`<path data-mark="line" data-series="${j + 1}" d="${line}"></path>`);
      }
      const end = [...s.values.keys()].reverse().find((i) => s.values[i] !== null && s.values[i] !== undefined);
      if (end !== undefined) parts.push(`<circle data-mark="dot" data-series="${j + 1}" cx="${r2(x(end))}" cy="${r2(yOf(s.values[end] as number))}" r="4"></circle>`);
    });
    const half = n > 1 ? pw / (n - 1) / 2 : pw / 2;
    for (let i = 0; i < n; i++) parts.push(band(i, x(i) - half, T, half * 2, ph, `<line data-part="cross" x1="${r2(x(i))}" x2="${r2(x(i))}" y1="${T}" y2="${T + ph}"></line>`));
  }
  return parts.join('');
}

function donut(o: ChartOptions): string {
  const { width: W, height: H, data, locale } = o, cx = W / 2, cy = H / 2, outer = Math.max(8, Math.min(W, H) / 2 - 4), inner = outer * 0.68;
  const vals = donutSlices(data).map((s) => Math.max(0, s.value)), total = vals.reduce((a, b) => a + b, 0);
  let a = 0;
  const arcs = vals.map((v, i) => { const b = a + (total ? v / total : 0) * Math.PI * 2, d = v > 0 ? arcPath(cx, cy, outer, inner, a, b) : ''; a = b; return d ? `<g data-i="${i}"><path data-mark="slice" data-series="${i + 1}" d="${d}"></path></g>` : ''; });
  return `${arcs.join('')}<text data-part="total" x="${r2(cx)}" y="${r2(cy + 6)}" text-anchor="middle">${esc(formatValue(total, locale))}</text>`;
}

/** A donut's slices: the first series across categories, folded to six like series are. */
export function donutSlices(data: ChartData): { name: string; value: number }[] {
  const values = data.series[0]?.values ?? [], cats = data.categories.map((name, i) => ({ name, value: values[i] ?? 0 }));
  if (cats.length <= SERIES_LIMIT) return cats;
  const keep = cats.slice(0, SERIES_LIMIT - 1);
  return [...keep, { name: 'Other', value: cats.slice(SERIES_LIMIT - 1).reduce((s, c) => s + c.value, 0) }];
}

/** The legend's entries, in series order. One series needs none: the title names it. */
export function legendEntries(o: Pick<ChartOptions, 'kind' | 'data'>): string[] {
  if (o.kind === 'donut') return donutSlices(o.data).map((s) => s.name);
  const s = foldSeries(o.data.series);
  return s.length > 1 ? s.map((x) => x.name) : [];
}

/** What a hover names at index i: the title and one row per series. */
export function tooltipRows(o: Pick<ChartOptions, 'kind' | 'data' | 'locale'>, i: number): { title: string; rows: { series: number; name: string; value: string }[] } {
  if (o.kind === 'donut') { const s = donutSlices(o.data)[i]; return { title: s?.name ?? '', rows: s ? [{ series: i + 1, name: s.name, value: formatValue(s.value, o.locale) }] : [] }; }
  const rows = foldSeries(o.data.series).flatMap((s, j) => { const v = s.values[i]; return v === null || v === undefined ? [] : [{ series: j + 1, name: s.name, value: formatValue(v, o.locale) }]; });
  return { title: o.data.categories[i] ?? '', rows };
}

/** The whole figure: the SVG, the legend, an accessible table and an empty tooltip. */
export function chartMarkup(o: ChartOptions): string {
  const series = foldSeries(o.data.series);
  const marks = o.kind === 'donut' ? donut(o) : cartesian(o, series);
  const legend = legendEntries(o);
  const head = `<tr><th scope="col"></th>${series.map((s) => `<th scope="col">${esc(s.name)}</th>`).join('')}</tr>`;
  const body = o.data.categories.map((c, i) => `<tr><th scope="row">${esc(c)}</th>${series.map((s) => `<td>${s.values[i] === null || s.values[i] === undefined ? '' : esc(formatValue(s.values[i] as number, o.locale))}</td>`).join('')}</tr>`).join('');
  return `<svg data-part="plot" width="${o.width}" height="${o.height}" viewBox="0 0 ${o.width} ${o.height}" aria-hidden="true">${marks}</svg>`
    + (legend.length ? `<div data-part="legend">${legend.map((name, i) => `<span data-part="legend-item" data-series="${i + 1}"><span data-part="key"></span>${esc(name)}</span>`).join('')}</div>` : '')
    + `<table data-part="data"><caption>${esc(o.label ?? '')}</caption><thead>${head}</thead><tbody>${body}</tbody></table><div data-part="tooltip" hidden></div>`;
}

/** Hover: a tooltip per band or slice. Hit targets are larger than the marks. */
export function attachChartHover(host: HTMLElement, options: () => Pick<ChartOptions, 'kind' | 'data' | 'locale'>) {
  const onMove = (e: PointerEvent) => {
    const tip = host.querySelector<HTMLElement>(':scope > [data-part=tooltip]'), at = (e.target as Element).closest?.('[data-i]');
    if (!tip) return;
    if (!at) { tip.hidden = true; return; }
    const { title, rows } = tooltipRows(options(), Number(at.getAttribute('data-i'))), r = host.getBoundingClientRect();
    tip.innerHTML = `<strong>${esc(title)}</strong>${rows.map((w) => `<span data-part="tip-row" data-series="${w.series}"><span data-part="key"></span><span>${esc(w.name)}</span><span>${esc(w.value)}</span></span>`).join('')}`;
    tip.hidden = false;
    tip.style.setProperty('--tip-x', `${Math.min(e.clientX - r.left + 12, r.width - tip.offsetWidth)}px`);
    tip.style.setProperty('--tip-y', `${Math.max(0, e.clientY - r.top - tip.offsetHeight - 12)}px`);
  };
  const onLeave = () => { const tip = host.querySelector<HTMLElement>(':scope > [data-part=tooltip]'); if (tip) tip.hidden = true; };
  host.addEventListener('pointermove', onMove); host.addEventListener('pointerleave', onLeave);
  return () => { host.removeEventListener('pointermove', onMove); host.removeEventListener('pointerleave', onLeave); };
}
