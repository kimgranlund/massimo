// <ui-stat-card>: a metric on a card, with an optional delta, comparison and trend. Empty parts are
// left out. tone says whether the delta is good news, since a sign can't: positive, negative or neutral.
// trend is a comma-separated list of numbers, drawn as a line and described in words.
import { UIElement, define } from '../../core/element.ts';
import { html } from '../../core/template.ts';
import { parseTrend, trendLabel, trendPoints } from '../../dom/stat.ts';
import { applyRecipe, setClasses } from '../classes.ts';
import { statCard } from '../../styled-system/recipes/stat-card.js';

const SVG = 'http://www.w3.org/2000/svg';
const VIEW = { w: 100, h: 32 };

export class UIStatCard extends UIElement {
  static properties = {
    label: { type: String, default: '' },
    value: { type: String, default: '' },
    delta: { type: String, default: '' },
    tone: { type: String, default: 'neutral' },
    comparison: { type: String, default: '' },
    trend: { type: String, default: '' },
  };
  declare label: string;
  declare value: string;
  declare delta: string;
  declare tone: 'positive' | 'negative' | 'neutral';
  declare comparison: string;
  declare trend: string;

  template() {
    return html`<ui-container preset="card" padding="md"><ui-section>
      <span data-part="label">${this.label}</span>
      <span data-part="value">${this.value}<span data-part="delta" data-tone=${this.tone} ?hidden=${!this.delta}>${this.delta}</span></span>
      <span data-part="comparison" ?hidden=${!this.comparison}>${this.comparison}</span>
      <span data-part="trend-slot"></span>
    </ui-section></ui-container>`;
  }

  update() {
    const part = (name: string) => this.querySelector(`[data-part=${name}]`);
    applyRecipe(this, statCard(), part);
    const slot = part('trend-slot'), values = parseTrend(this.trend);
    if (!slot) return;
    slot.replaceChildren();
    if (values.length < 2) return;
    const svg = document.createElementNS(SVG, 'svg'), line = document.createElementNS(SVG, 'polyline');
    svg.setAttribute('data-part', 'trend');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', trendLabel(values));
    svg.setAttribute('viewBox', `0 0 ${VIEW.w} ${VIEW.h}`);
    svg.setAttribute('preserveAspectRatio', 'none');
    line.setAttribute('points', trendPoints(values, VIEW.w, VIEW.h));
    svg.append(line);
    setClasses(svg, statCard().trend);
    slot.append(svg);
  }
}

define('ui-stat-card', UIStatCard);

declare global {
  interface HTMLElementTagNameMap { 'ui-stat-card': UIStatCard }
}
