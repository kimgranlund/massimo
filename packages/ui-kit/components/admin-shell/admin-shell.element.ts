// <ui-admin-shell>: navigation and detail panes around content. Author [data-part] children: start,
// toolbar, content, footer and end. Fit comes from the host's own width (dom/shell.ts).
import { UIElement, define } from '../../core/element.ts';
import { attachPanes, type Side } from '../../dom/shell.ts';
import { applyRecipe } from '../classes.ts';
import { adminShell } from '../../styled-system/recipes/admin-shell.js';

export class UIAdminShell extends UIElement {
  static properties = {
    startClosed: { type: Boolean, default: false },
    endClosed: { type: Boolean, default: false },
  };
  declare startClosed: boolean;
  declare endClosed: boolean;
  #panes?: ReturnType<typeof attachPanes>;

  connected() {
    if (!this.querySelector(':scope > [data-part=scrim]')) { const s = document.createElement('div'); s.setAttribute('data-part', 'scrim'); s.setAttribute('aria-hidden', 'true'); this.append(s); }
    this.#panes = attachPanes(this, {
      prefs: () => ({ start: !this.startClosed, end: !this.endClosed }),
      onChange: (detail) => this.dispatchEvent(new CustomEvent('panechange', { bubbles: true, detail })),
    });
  }
  disconnected() { this.#panes?.stop(); this.#panes = undefined; }
  update() { applyRecipe(this, adminShell(), () => null); this.#panes?.sync(); }

  /** Change the inline preference, or request a drawer when the pane no longer fits. */
  toggle(side: Side, opener?: HTMLElement | null) { this.#panes?.toggle(side, opener); }
  /** Dismiss a drawer, and focus an accepted destination or its opener. */
  close(destination?: HTMLElement | null) { this.#panes?.close(destination); }
}

define('ui-admin-shell', UIAdminShell);

declare global {
  interface HTMLElementTagNameMap { 'ui-admin-shell': UIAdminShell }
}
