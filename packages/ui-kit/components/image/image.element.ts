// <ui-image>: an image with a cover format and fit.
//   src / srcset / sizes / alt: a single image (lazy, async decode).
//   Children: author <img> or <picture> (with <source type="image/avif"> etc.) for any format.
//   ratio: square | landscape (4/3) | portrait (3/4) | wide (16/9) | ultrawide (21/9) |
//          story (9/16) | golden (1.618/1) | any "w/h". fit: cover (default) | contain | fill |
//          none | scale-down. position: object-position (e.g. "top", "30% 70%").
//   A failed image gets data-error (the frame shows its empty fill).
//   slideshow: several child images become an inline swiper; dots and paddles show on hover.
import { UIElement, define } from '../../core/element.ts';
import '../swiper/swiper.element.ts';
import { customRatio, fitVariant, ratioVariant } from './ratios.ts';
import { setClasses } from '../classes.ts';
import { image } from '../../styled-system/recipes/image.js';

export { RATIOS } from './ratios.ts';
const POSITION = /^[a-z0-9.%\s-]{1,40}$/i;

export class UIImage extends UIElement {
  static properties = {
    src: { type: String, default: '' },
    srcset: { type: String, default: '' },
    sizes: { type: String, default: '' },
    alt: { type: String, default: '' },
    ratio: { type: String, default: '', reflect: true },
    fit: { type: String, default: 'cover', reflect: true },
    position: { type: String, default: '' },
    slideshow: { type: Boolean, default: false, reflect: true },
  };
  declare src: string;
  declare srcset: string;
  declare sizes: string;
  declare alt: string;
  declare ratio: string;
  declare fit: string;
  declare position: string;
  declare slideshow: boolean;

  #swiper?: HTMLElement;

  connected() {
    // error/load do not bubble; capture them to mark a failed image (styled as an empty frame).
    this.addEventListener('error', this.#onLoad, true);
    this.addEventListener('load', this.#onLoad, true);
    if (this.slideshow && !this.#swiper) {
      const swiper = document.createElement('ui-swiper');
      swiper.setAttribute('hover-controls', '');
      swiper.setAttribute('label', this.alt || 'Images');
      for (const node of [...this.children]) {
        const slide = document.createElement('div');
        slide.setAttribute('data-part', 'slide');
        slide.append(node);
        swiper.append(slide);
      }
      this.#swiper = swiper;
      this.replaceChildren(swiper);
    }
  }

  disconnected() {
    this.removeEventListener('error', this.#onLoad, true);
    this.removeEventListener('load', this.#onLoad, true);
  }

  #onLoad = (e: Event) => {
    const t = e.target as HTMLElement;
    if (t.localName === 'img') t.toggleAttribute('data-error', e.type === 'error');
  };

  update() {
    // Ratio: presets are recipe variants; a validated custom "w/h" reaches CSS as
    // --ui-image-ratio; anything else is ignored.
    const custom = customRatio(this.ratio);
    if (custom) this.style.setProperty('--ui-image-ratio', custom); else this.style.removeProperty('--ui-image-ratio');
    if (POSITION.test(this.position)) this.style.setProperty('--ui-image-position', this.position);
    else this.style.removeProperty('--ui-image-position');
    const c = image({ ratio: ratioVariant(this.ratio) as any, fit: fitVariant(this.fit), slideshow: this.slideshow });
    setClasses(this, c.root);
    this.#swiper?.querySelectorAll('[data-part=slide]').forEach((s) => setClasses(s, c.slide));
    if (this.slideshow) return;
    // Single image from attributes, unless the author supplied <img>/<picture>.
    const authored = this.querySelector(':scope > img:not([data-generated]), :scope > picture');
    let img = this.querySelector<HTMLImageElement>(':scope > img[data-generated]');
    if (this.src && !authored) {
      if (!img) {
        img = document.createElement('img');
        img.setAttribute('data-generated', '');
        img.loading = 'lazy';
        img.decoding = 'async';
        this.append(img);
      }
      if (img.getAttribute('src') !== this.src) img.src = this.src;
      if (this.srcset) img.srcset = this.srcset; else img.removeAttribute('srcset');
      if (this.sizes) img.sizes = this.sizes; else img.removeAttribute('sizes');
      img.alt = this.alt;
    } else img?.remove();
  }
}

define('ui-image', UIImage);

declare global {
  interface HTMLElementTagNameMap { 'ui-image': UIImage }
}
