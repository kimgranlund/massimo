// <ui-chip-select>: a compact choice beside the content it affects, such as a sort order. It's ui-select
// at chip size, so it keeps the popup, keyboard and form value.
import { define } from '../../core/element.ts';
import { UISelect } from '../select/select.element.ts';
import { setClasses } from '../classes.ts';
import { chipSelect } from '../../styled-system/recipes/chip-select.js';

export class UIChipSelect extends UISelect {
  update() {
    super.update();
    setClasses(this, chipSelect().root, 'chip');
  }
}

define('ui-chip-select', UIChipSelect);

declare global {
  interface HTMLElementTagNameMap { 'ui-chip-select': UIChipSelect }
}
