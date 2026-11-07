// <ui-search-trigger>: a button that looks like a search field and opens a command bar. `for` names the
// bar's id. It runs no search and listens for no shortcut: the hint only shows the key.
import { UIElement, define } from '../../core/element.ts';
import { html } from '../../core/template.ts';
import '../button/button.element.ts';
import '../kbd/kbd.element.ts';
import { applyRecipe } from '../classes.ts';
import { searchTrigger } from '../../styled-system/recipes/search-trigger.js';

export class UISearchTrigger extends UIElement {
  static properties = {
    label: { type: String, default: 'Search' },
    shortcut: { type: String, default: 'mod+k' },
    for: { type: String, default: '' },
  };
  declare label: string;
  declare shortcut: string;
  declare for: string;

  template() {
    return html`<ui-button @click=${this.#open}><i slot="leading" name="magnifying-glass"></i>${this.label}<span slot="trailing" ?hidden=${!this.shortcut}><ui-kbd .keys=${this.shortcut}></ui-kbd></span></ui-button>`;
  }
  update() { applyRecipe(this, searchTrigger()); }
  #open = () => { const bar = this.for ? document.getElementById(this.for) as (HTMLElement & { open: boolean }) | null : null; if (bar) bar.open = true; };
}

define('ui-search-trigger', UISearchTrigger);

declare global {
  interface HTMLElementTagNameMap { 'ui-search-trigger': UISearchTrigger }
}
