// <ui-button-link>: a real link with the look and geometry of ui-button. It renders an <a> that wears
// the button's recipe, so the browser owns navigation, history and open-in-new-tab. A disabled link has
// no href. Children are sorted into the button's slots.
import { UIElement, define } from '../../core/element.ts';
import { applyAttrs } from '../../dom/attrs.ts';
import { linkAttrs } from '../../dom/button-link.ts';
import { observeSlots } from '../slots.ts';
import { applyRecipe, setClasses } from '../classes.ts';
import { button } from '../../styled-system/recipes/button.js';
import { buttonLink } from '../../styled-system/recipes/button-link.js';

export class UIButtonLink extends UIElement {
  static properties = {
    href: { type: String, default: '' },
    target: { type: String, default: '' },
    rel: { type: String, default: '' },
    variant: { type: String, default: 'neutral' },
    disabled: { type: Boolean, default: false, reflect: true },
  };
  declare href: string;
  declare target: string;
  declare rel: string;
  declare variant: 'neutral' | 'primary' | 'ghost';
  declare disabled: boolean;

  #unslot?: () => void;
  #link?: HTMLAnchorElement;

  connected() {
    if (!this.#link) {
      this.#link = document.createElement('a');
      this.#link.setAttribute('data-part', 'link');
      this.#link.setAttribute('data-ui', 'button');
      this.#link.append(...this.childNodes);
      this.append(this.#link);
    }
    this.#unslot = observeSlots(this.#link);
  }

  disconnected() { this.#unslot?.(); }

  update() {
    const link = this.#link;
    if (!link) return;
    const c = buttonLink();
    setClasses(this, c.root);
    applyAttrs(link, linkAttrs({ href: this.href, target: this.target, rel: this.rel, disabled: this.disabled }));
    applyRecipe(link, button({ variant: this.variant === 'primary' || this.variant === 'ghost' ? this.variant : 'neutral' }) as unknown as Record<string, string>);
    setClasses(link, c.link, 'link');
  }

  focus(options?: FocusOptions) { this.#link?.focus(options); }
}

define('ui-button-link', UIButtonLink);

declare global {
  interface HTMLElementTagNameMap { 'ui-button-link': UIButtonLink }
}
