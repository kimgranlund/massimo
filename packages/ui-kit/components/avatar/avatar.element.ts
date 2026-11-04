// <ui-avatar>: a person or entity as a round image with a fallback (Base UI Avatar: Root, Image,
// Fallback). The image part (an <img>) shows once it has loaded; until then, and after an error, the
// fallback part shows (after `delay` ms): its authored content, else the initials of `name`, else a
// user icon. The image part carries Base UI's data-loading / data-error. Sizes: avatar-size sm | md
// | lg | xl (6u | 8u | 12u | 16u, resolveAvatar).
// Composition (optional): [data-part=image] (an <img>) and [data-part=fallback] may be authored;
// loose children become the fallback's content.
import { UIElement, define } from '../../core/element.ts';
import { signal } from '../../core/signals.ts';
import { applyAttrs } from '../../dom/attrs.ts';
import { avatarAttrs, avatarImageAttrs, initialImageStatus, initialsOf, type ImageStatus } from '../../dom/display.ts';
import type { AvatarSize } from '../../tokens/geometry/resolve.ts';
import { applyRecipe } from '../classes.ts';
import { avatar } from '../../styled-system/recipes/avatar.js';
import '../../icons/index.ts';

export class UIAvatar extends UIElement {
  static properties = {
    src: { type: String, default: '' },
    alt: { type: String, default: '' },
    name: { type: String, default: '' },
    avatarSize: { type: String, default: 'md', attribute: 'avatar-size', reflect: true },
    delay: { type: Number, default: 0 },
  };
  declare src: string;
  declare alt: string;
  declare name: string;
  declare avatarSize: AvatarSize;
  declare delay: number;

  #status = signal<ImageStatus>('idle');
  #delayed = signal(false);
  #timer?: ReturnType<typeof setTimeout>;
  #img!: HTMLImageElement;
  #fallback!: HTMLElement;
  #generated = false;
  #loadedSrc = '';

  /** The image loading status (Base UI onLoadingStatusChange's value). */
  get status(): ImageStatus { return this.#status.value; }

  connected() {
    const authoredImg = this.querySelector<HTMLImageElement>(':scope > img[data-part=image], :scope > img');
    const authoredFallback = this.querySelector<HTMLElement>(':scope > [data-part=fallback]');
    this.#img = authoredImg ?? document.createElement('img');
    this.#img.setAttribute('data-part', 'image');
    if (authoredImg && !this.src) this.src = authoredImg.getAttribute('src') ?? '';
    if (authoredImg && !this.alt) this.alt = authoredImg.getAttribute('alt') ?? '';
    this.#fallback = authoredFallback ?? document.createElement('span');
    this.#fallback.setAttribute('data-part', 'fallback');
    for (const n of [...this.childNodes]) if (n !== this.#img && n !== this.#fallback) this.#fallback.append(n);
    this.replaceChildren(this.#img, this.#fallback);
    this.#img.addEventListener('load', this.#onLoad);
    this.#img.addEventListener('error', this.#onError);
    this.#startDelay();
  }

  disconnected() {
    this.#img.removeEventListener('load', this.#onLoad);
    this.#img.removeEventListener('error', this.#onError);
    clearTimeout(this.#timer);
  }

  update() {
    const src = this.src;
    if (src !== this.#loadedSrc) {
      this.#loadedSrc = src;
      if (src) this.#img.setAttribute('src', src); else this.#img.removeAttribute('src');
      // A cached image may have loaded before the listeners ran.
      this.#setStatus(src && this.#img.complete && this.#img.naturalWidth > 0 ? 'loaded' : initialImageStatus(src));
    }
    const status = this.#status.value;
    const labelled = !!(this.alt || this.name);
    applyAttrs(this, avatarAttrs({ alt: this.alt, name: this.name }));
    applyAttrs(this.#img, { ...avatarImageAttrs(status), alt: labelled ? '' : this.alt, hidden: status !== 'loaded' });
    this.#fill();
    applyAttrs(this.#fallback, { hidden: status === 'loaded' || this.#delayed.value, 'aria-hidden': labelled ? 'true' : undefined });
    applyRecipe(this, avatar(), (slot) => (slot === 'image' ? this.#img : slot === 'fallback' ? this.#fallback : null));
  }

  /** Generated fallback content: the initials of name, else a user icon (authored content wins). */
  #fill() {
    if (this.#fallback.childNodes.length && !this.#generated) return;
    const initials = initialsOf(this.name);
    const want = initials || 'icon';
    if (this.#generated && this.#fallback.dataset.generated === want) return;
    this.#generated = true;
    this.#fallback.dataset.generated = want;
    if (initials) this.#fallback.textContent = initials;
    else {
      const i = document.createElement('i');
      i.setAttribute('name', 'user');
      this.#fallback.replaceChildren(i);
    }
  }

  #startDelay() {
    clearTimeout(this.#timer);
    this.#delayed.value = this.delay > 0;
    if (this.delay > 0) this.#timer = setTimeout(() => { this.#delayed.value = false; }, this.delay);
  }

  #setStatus(s: ImageStatus) {
    if (this.#status.peek() === s) return;
    this.#status.value = s;
    // Base UI Avatar.Image onLoadingStatusChange.
    this.dispatchEvent(new CustomEvent('loadingstatuschange', { bubbles: true, detail: { status: s } }));
  }

  #onLoad = () => this.#setStatus('loaded');
  #onError = () => this.#setStatus('error');
}

define('ui-avatar', UIAvatar);

declare global {
  interface HTMLElementTagNameMap { 'ui-avatar': UIAvatar }
}
