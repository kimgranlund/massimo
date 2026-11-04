// <ui-scroll-area>: a region that scrolls natively and draws the kit's scrollbars (Base UI
// ScrollArea: Root, Viewport, Content, Scrollbar, Thumb, Corner). As a preset its children become
// the content, inside a generated viewport, with a vertical and a horizontal scrollbar (each with
// its thumb) and the corner. With parts, the author writes the anatomy as [data-part] children:
// viewport (› content), scrollbar (data-orientation vertical | horizontal; keep-mounted) › thumb,
// corner; only what is written is used (a scrollbar without a thumb gets one).
// Script measures the viewport on scroll and resize (dom/scroll-area.ts) and puts Base UI's data-*
// on the parts and its CSS variables on them as custom properties; the recipe does the rest.
// A thumb drags (pointer capture); a press on the track scrolls so the thumb centers under it.
import { UIElement, define } from '../../core/element.ts';
import { applyAttrs } from '../../dom/attrs.ts';
import { bindScrollbar, measureScrollArea, scrollAreaDataAttrs, scrollAreaVars, setVars, type ScrollMetrics, type ScrollOrientation } from '../../dom/scroll-area.ts';
import { applyRecipe, setClasses } from '../classes.ts';
import { scrollArea } from '../../styled-system/recipes/scroll-area.js';

const div = (part: string) => { const el = document.createElement('div'); el.setAttribute('data-part', part); return el; };
const on = (v: boolean) => (v ? '' : undefined);
const orientationOf = (bar: Element): ScrollOrientation => (bar.getAttribute('data-orientation') ?? bar.getAttribute('orientation')) === 'horizontal' ? 'horizontal' : 'vertical';

export class UIScrollArea extends UIElement {
  static properties = {
    /** Distance in px from an edge before its data-overflow-*-start / -end applies (Base UI overflowEdgeThreshold). */
    overflowEdgeThreshold: { type: Number, default: 0, attribute: 'overflow-edge-threshold' },
  };
  declare overflowEdgeThreshold: number;

  #viewport?: HTMLElement;
  #content?: HTMLElement | null;
  #bars: HTMLElement[] = [];
  #corner?: HTMLElement | null;
  #ro?: ResizeObserver;
  #unbind: (() => void)[] = [];
  #scrolling = false;
  #hovering = false;
  #timer?: ReturnType<typeof setTimeout>;
  #frame = 0;
  #metrics: ScrollMetrics | null = null;

  /** The viewport part (the scrolling element). */
  get viewport() { return this.#viewport; }
  /** The last measurement (overflow, distances from each edge, thumb lengths and offsets). */
  get metrics() { return this.#metrics; }

  connected() {
    if (!this.#viewport) this.#build();
    const vp = this.#viewport!;
    vp.addEventListener('scroll', this.#onScroll, { passive: true });
    this.addEventListener('pointerenter', this.#onEnter);
    this.addEventListener('pointerleave', this.#onLeave);
    this.#unbind = this.#bars.map((bar) => bindScrollbar(bar, () => this.#viewport ?? null, orientationOf(bar)));
    if (typeof ResizeObserver === 'function') {
      this.#ro = new ResizeObserver(() => this.#schedule());
      this.#ro.observe(vp);
      if (this.#content) this.#ro.observe(this.#content);
    }
    this.#schedule();
  }

  disconnected() {
    this.#viewport?.removeEventListener('scroll', this.#onScroll);
    this.removeEventListener('pointerenter', this.#onEnter);
    this.removeEventListener('pointerleave', this.#onLeave);
    for (const u of this.#unbind) u();
    this.#unbind = [];
    this.#ro?.disconnect();
    clearTimeout(this.#timer);
    if (typeof cancelAnimationFrame === 'function') cancelAnimationFrame(this.#frame);
  }

  update() {
    void this.overflowEdgeThreshold;
    applyRecipe(this, scrollArea(), (slot) => (slot === 'viewport' ? this.#viewport : slot === 'content' ? this.#content : slot === 'corner' ? this.#corner : null));
    for (const bar of this.#bars) {
      setClasses(bar, scrollArea().scrollbar);
      setClasses(bar.querySelector(':scope > [data-part=thumb]'), scrollArea().thumb);
    }
    this.sync();
  }

  /** Measure again and update the parts (called on scroll and resize; call it after changing the content's size from script). */
  sync() {
    const vp = this.#viewport;
    if (!vp) return;
    const x = this.#bars.find((b) => orientationOf(b) === 'horizontal'), y = this.#bars.find((b) => orientationOf(b) === 'vertical');
    const m = (this.#metrics = measureScrollArea(vp, { x, y }));
    const state = scrollAreaDataAttrs(m, this.#scrolling, this.overflowEdgeThreshold);
    const vars = scrollAreaVars(m);
    applyAttrs(this, state);
    setVars(this, vars.root);
    applyAttrs(vp, { ...state, tabindex: m.hasX || m.hasY ? 0 : undefined, role: 'presentation' });
    setVars(vp, vars.viewport);
    if (this.#content) applyAttrs(this.#content, { ...state, role: 'presentation' });
    for (const bar of this.#bars) {
      const o = orientationOf(bar), has = o === 'vertical' ? m.hasY : m.hasX;
      bar.hidden = !has && !bar.hasAttribute('keep-mounted');
      applyAttrs(bar, { ...state, 'data-orientation': o, 'data-hovering': on(this.#hovering) });
      setVars(bar, o === 'vertical' ? vars.y : vars.x);
      const thumb = bar.querySelector<HTMLElement>(':scope > [data-part=thumb]');
      if (thumb) applyAttrs(thumb, { 'data-orientation': o, 'data-scrolling': on(this.#scrolling) });
    }
    if (this.#corner) this.#corner.hidden = !(m.hasX && m.hasY);
  }

  #build() {
    const own = (part: string) => [...this.children].filter((c) => c.getAttribute('data-part') === part) as HTMLElement[];
    const authored = own('viewport')[0];
    if (authored) {
      this.#viewport = authored;
      this.#content = authored.querySelector<HTMLElement>(':scope > [data-part=content]');
      this.#bars = own('scrollbar');
      this.#corner = own('corner')[0] ?? null;
    } else {
      const vp = div('viewport'), content = div('content');
      content.append(...this.childNodes);
      vp.append(content);
      const bars = (['vertical', 'horizontal'] as const).map((o) => { const b = div('scrollbar'); b.setAttribute('data-orientation', o); return b; });
      const corner = div('corner');
      this.append(vp, ...bars, corner);
      this.#viewport = vp;
      this.#content = content;
      this.#bars = bars;
      this.#corner = corner;
    }
    for (const bar of this.#bars) {
      if (!bar.querySelector(':scope > [data-part=thumb]')) bar.append(div('thumb'));
      bar.setAttribute('aria-hidden', 'true'); // the viewport scrolls with the keyboard; the bars are pointer affordances
    }
  }

  /** Measure on the next frame (after layout settles); at once where there are no frames. */
  #schedule = () => {
    if (typeof requestAnimationFrame !== 'function') { queueMicrotask(() => this.sync()); return; }
    cancelAnimationFrame(this.#frame);
    this.#frame = requestAnimationFrame(() => this.sync());
  };

  #onScroll = () => {
    this.#scrolling = true;
    clearTimeout(this.#timer);
    // Base UI keeps data-scrolling a moment after the last scroll event.
    this.#timer = setTimeout(() => { this.#scrolling = false; this.sync(); }, 500);
    this.sync();
  };

  #onEnter = (e: PointerEvent) => { if (e.pointerType !== 'touch') { this.#hovering = true; this.sync(); } };
  #onLeave = () => { this.#hovering = false; this.sync(); };
}

define('ui-scroll-area', UIScrollArea);

declare global {
  interface HTMLElementTagNameMap { 'ui-scroll-area': UIScrollArea }
}
