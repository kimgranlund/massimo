// <ui-separator>: a rule between groups of content (role="separator", Base UI Separator). Not
// focusable; orientation sets aria-orientation and data-orientation. Thickness max(1px, B)
// (resolveSeparator), the border color role: separator.recipe.ts.
import { UIElement, define } from '../../core/element.ts';
import { applyAttrs } from '../../dom/attrs.ts';
import { separatorAttrs } from '../../dom/display.ts';
import { type Orientation } from '../../dom/listbox.ts';
import { applyRecipe } from '../classes.ts';
import { separator } from '../../styled-system/recipes/separator.js';

export class UISeparator extends UIElement {
  static properties = {
    orientation: { type: String, default: 'horizontal', reflect: true },
  };
  declare orientation: Orientation;

  update() {
    applyAttrs(this, separatorAttrs(this.orientation));
    applyRecipe(this, separator());
  }
}

define('ui-separator', UISeparator);

declare global {
  interface HTMLElementTagNameMap { 'ui-separator': UISeparator }
}
