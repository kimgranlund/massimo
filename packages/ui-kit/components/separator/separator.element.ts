// <ui-separator>: a rule between groups of content (role="separator", Base UI Separator). Not
// focusable; orientation sets aria-orientation and data-orientation. Thickness max(1px, B)
// (resolveSeparator), the border color role: separator.recipe.ts.
import { UIElement, define } from '../../core/index.ts';
import { applyAttrs, separatorAttrs, type Orientation } from '../../dom/index.ts';
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
