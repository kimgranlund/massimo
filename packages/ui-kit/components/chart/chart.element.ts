// <ui-chart>: data as column, bar, line, area or donut marks. `data` is { categories, series: [{ name,
// values }] }. It redraws at its own width. An SVG string comes from dom/chart.ts, so the React Chart
// draws the same marks.
import { UIElement, define } from '../../core/element.ts';
import { attachChartHover, chartMarkup, type ChartData, type ChartKind } from '../../dom/chart.ts';
import { resolveChart } from '../../tokens/geometry/resolve.ts';
import { applyRecipe } from '../classes.ts';
import { chart } from '../../styled-system/recipes/chart.js';

const EMPTY: ChartData = { categories: [], series: [] };

export class UIChart extends UIElement {
  static properties = {
    label: { type: String, default: '' },
    kind: { type: String, default: 'column' },
    data: { default: null },
    stacked: { type: Boolean, default: false },
    height: { type: Number, default: 0 },
    locale: { type: String, default: '' },
  };
  declare label: string;
  declare kind: ChartKind;
  declare data: ChartData | string | null;
  declare stacked: boolean;
  declare height: number;
  declare locale: string;
  #size?: ResizeObserver;
  #stop?: () => void;
  #width = 0;
  get #data(): ChartData { const d = this.data; if (d && typeof d !== 'string') return d; try { return (JSON.parse(d || 'null') ?? EMPTY) as ChartData; } catch { return EMPTY; } }

  connected() {
    this.#stop = attachChartHover(this, () => ({ kind: this.kind, data: this.#data, locale: this.locale || undefined }));
    if (typeof ResizeObserver !== 'undefined') { this.#size = new ResizeObserver(() => requestAnimationFrame(() => { const w = Math.round(this.clientWidth); if (w && w !== this.#width) { this.#width = w; this.#draw(); } })); this.#size.observe(this); }
  }
  disconnected() { this.#stop?.(); this.#size?.disconnect(); }

  update() {
    applyRecipe(this, chart(), () => null);
    this.setAttribute('role', 'figure'); this.setAttribute('aria-label', this.label);
    this.#draw();
  }
  #draw() {
    const height = this.height || resolveChart({ unit: parseFloat(getComputedStyle(this).scrollPaddingTop) || 4 }).height;
    this.innerHTML = chartMarkup({ kind: this.kind, data: this.#data, width: this.#width || this.clientWidth || 480, height, stacked: this.stacked, locale: this.locale || undefined, label: this.label });
  }
}

define('ui-chart', UIChart);

declare global {
  interface HTMLElementTagNameMap { 'ui-chart': UIChart }
}
