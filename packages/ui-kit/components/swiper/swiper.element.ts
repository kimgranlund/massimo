// <ui-swiper>: CSS-native carousel. Slides scroll in a scroll-snap viewport (native momentum,
// touch, trackpad and arrow-key scrolling); script only adds the paddles and dots and tracks
// the active slide. Attributes: `no-paddles`, `no-dots`, `hover-controls` (controls appear on
// hover or focus). Fires `slidechange` with detail { index }.
import { UIElement, define, signal } from '../../core/index.ts';
import { applyAttrs } from '../../dom/index.ts';
import { applyRecipe, partOf, setClasses } from '../classes.ts';
import { swiper } from '../../styled-system/recipes/swiper.js';
import '../button/button.element.ts';
import '../../icons/index.ts';

export class UISwiper extends UIElement {
  static properties = {
    label: { type: String, default: '' },
  };
  declare label: string;

  #index = signal(0);
  #count = signal(0);
  #io?: IntersectionObserver;
  #mo?: MutationObserver;
  #viewport?: HTMLElement;
  #dots?: HTMLElement;
  #prev?: HTMLElement;
  #next?: HTMLElement;

  get slides(): HTMLElement[] { return this.#viewport ? [...this.#viewport.children] as HTMLElement[] : []; }
  get index() { return this.#index.value; }

  connected() {
    if (!this.#viewport) this.#build();
    this.#observe();
  }

  disconnected() { this.#io?.disconnect(); this.#mo?.disconnect(); }

  #build() {
    const viewport = document.createElement('div');
    viewport.setAttribute('data-part', 'viewport');
    viewport.tabIndex = 0;
    viewport.append(...this.childNodes);
    const paddle = (dir: 'prev' | 'next') => {
      const b = document.createElement('ui-button');
      b.setAttribute('data-part', 'paddle');
      b.setAttribute('data-dir', dir);
      b.setAttribute('icon-size', 'lg');
      b.setAttribute('aria-label', dir === 'prev' ? 'Previous slide' : 'Next slide');
      b.innerHTML = `<i slot="leading" name="caret-${dir === 'prev' ? 'left' : 'right'}"></i>`;
      b.addEventListener('click', () => this.go(this.#index.value + (dir === 'prev' ? -1 : 1)));
      return b;
    };
    this.#prev = paddle('prev');
    this.#next = paddle('next');
    const dots = document.createElement('div');
    dots.setAttribute('data-part', 'dots');
    dots.addEventListener('click', (e) => {
      const dot = (e.target as Element).closest('[data-part=dot]') as HTMLElement | null;
      if (dot) this.go(Number(dot.dataset.index));
    });
    dots.addEventListener('keydown', (e) => {
      const dot = (e.target as Element).closest('[data-part=dot]') as HTMLElement | null;
      if (dot && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); this.go(Number(dot.dataset.index)); }
    });
    this.#dots = dots;
    this.#viewport = viewport;
    this.replaceChildren(viewport, this.#prev, this.#next, dots);
  }

  #observe() {
    const viewport = this.#viewport!;
    this.#io?.disconnect();
    this.#io = new IntersectionObserver((entries) => {
      for (const en of entries) if (en.isIntersecting && en.intersectionRatio >= 0.6) {
        const i = this.slides.indexOf(en.target as HTMLElement);
        if (i >= 0 && i !== this.#index.value) {
          this.#index.value = i;
          this.dispatchEvent(new CustomEvent('slidechange', { bubbles: true, detail: { index: i } }));
        }
      }
    }, { root: viewport, threshold: [0.6] });
    const refresh = () => { this.#count.value = this.slides.length; this.slides.forEach((s) => this.#io!.observe(s)); };
    refresh();
    this.#mo?.disconnect();
    this.#mo = new MutationObserver(refresh);
    this.#mo.observe(viewport, { childList: true });
  }

  /** Scroll to slide i (clamped). */
  go(i: number) {
    const slides = this.slides;
    const target = slides[Math.max(0, Math.min(slides.length - 1, i))];
    if (!target || !this.#viewport) return;
    const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.#viewport.scrollTo?.({ left: target.offsetLeft - this.#viewport.offsetLeft, behavior: reduce ? 'auto' : 'smooth' });
    this.#index.value = slides.indexOf(target);
  }

  update() {
    const n = this.#count.value, i = this.#index.value;
    applyAttrs(this, { role: 'region', 'aria-roledescription': 'carousel', 'aria-label': this.label || undefined });
    this.slides.forEach((s, k) => applyAttrs(s, { role: 'group', 'aria-roledescription': 'slide', 'aria-label': `${k + 1} of ${n}` }));
    if (this.#prev) (this.#prev as any).disabled = i <= 0;
    if (this.#next) (this.#next as any).disabled = i >= n - 1;
    if (this.#dots && this.#dots.children.length !== n) {
      this.#dots.replaceChildren(...Array.from({ length: n }, (_, k) => {
        const d = document.createElement('span');
        d.setAttribute('data-part', 'dot');
        d.setAttribute('role', 'button');
        d.dataset.index = String(k);
        d.tabIndex = 0;
        d.setAttribute('aria-label', `Go to slide ${k + 1}`);
        return d;
      }));
    }
    // The current slide's dot: aria-current (semantics) and data-selected (styling).
    this.#dots?.querySelectorAll<HTMLElement>('[data-part=dot]').forEach((d, k) => applyAttrs(d, { 'aria-current': String(k === i), 'data-selected': k === i ? '' : undefined }));
    this.toggleAttribute('data-single', n <= 1);
    const c = swiper();
    applyRecipe(this, c, (slot) => slot === 'paddle' || slot === 'dot' ? null : partOf(this, slot));
    for (const p of [this.#prev, this.#next]) setClasses(p, c.paddle, 'swiper');
    this.#dots?.querySelectorAll('[data-part=dot]').forEach((d) => setClasses(d, c.dot));
  }
}

define('ui-swiper', UISwiper);

declare global {
  interface HTMLElementTagNameMap { 'ui-swiper': UISwiper }
}
