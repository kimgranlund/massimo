// <ui-spinner>: pending work of unknown length (role="status"). `label` is the visible text and the
// accessible name; with no label the ring stands alone and the name is "Loading". hide-label keeps the
// name and drops the text. Mount it while work is pending and remove it when the work ends.
import { UIElement, define } from '../../core/element.ts';
import { html } from '../../core/template.ts';
import { applyAttrs } from '../../dom/attrs.ts';
import { spinnerAttrs } from '../../dom/display.ts';
import { applyRecipe, partOf } from '../classes.ts';
import { spinner } from '../../styled-system/recipes/spinner.js';

export class UISpinner extends UIElement {
  static properties = {
    label: { type: String, default: '' },
    hideLabel: { type: Boolean, default: false, attribute: 'hide-label' },
  };
  declare label: string;
  declare hideLabel: boolean;

  template() {
    return html`<span data-part="ring" aria-hidden="true"></span><span data-part="label"></span>`;
  }

  update() {
    applyAttrs(this, spinnerAttrs(this.label));
    applyRecipe(this, spinner());
    const label = partOf(this, 'label');
    if (label) { label.textContent = this.label; (label as HTMLElement).hidden = !this.label || this.hideLabel; }
  }
}

define('ui-spinner', UISpinner);

declare global {
  interface HTMLElementTagNameMap { 'ui-spinner': UISpinner }
}
