// <ui-kbd>: keys and shortcuts as caps. `keys="mod+shift+p"` draws one cap per key for the viewer's
// platform, and text content is the same input for a single key. The caps are hidden from assistive
// technology and a hidden label speaks the key names. It's notation only: it registers no shortcut.
import { UIElement, define } from '../../core/element.ts';
import { html } from '../../core/template.ts';
import { detectPlatform, parseKeys, type KbdPlatform } from '../../dom/kbd.ts';
import { applyRecipe, partOf } from '../classes.ts';
import { kbd } from '../../styled-system/recipes/kbd.js';

export class UIKbd extends UIElement {
  static properties = {
    keys: { type: String, default: '' },
    platform: { type: String, default: 'auto' },
  };
  declare keys: string;
  declare platform: 'auto' | KbdPlatform;

  connected() {
    const text = this.textContent?.trim();
    if (text && !this.keys) this.keys = text;
  }

  template() {
    return html`<span data-part="keys" aria-hidden="true"></span><span data-part="label"></span>`;
  }

  update() {
    const c = kbd();
    applyRecipe(this, c);
    const caps = parseKeys(this.keys, this.platform === 'auto' ? detectPlatform() : this.platform);
    partOf(this, 'keys')?.replaceChildren(...caps.map(({ glyph }) => {
      const cap = document.createElement('span');
      cap.setAttribute('data-part', 'cap');
      cap.className = c.cap;
      cap.textContent = glyph;
      return cap;
    }));
    const label = partOf(this, 'label');
    if (label) label.textContent = caps.map((k) => k.spoken).join(' ');
  }
}

define('ui-kbd', UIKbd);

declare global {
  interface HTMLElementTagNameMap { 'ui-kbd': UIKbd }
}
