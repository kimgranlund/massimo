// <ui-textarea>: multiline plain text, with zero native form elements. It's ui-input in multiline mode:
// the same anatomy, validation and form behavior, where Enter adds a line and pastes keep theirs. `rows`
// is the height to hold before the text grows it, and reaches CSS as --ui-rows.
import { define } from '../../core/element.ts';
import { UIInput } from '../input/input.element.ts';
import { textarea } from '../../styled-system/recipes/textarea.js';
import { TEXTAREA_ROWS } from '../../tokens/geometry/resolve.ts';

export class UITextarea extends UIInput {
  static properties = {
    ...UIInput.properties,
    rows: { type: Number, default: TEXTAREA_ROWS },
  };
  declare rows: number;

  protected get multiline() { return true; }
  protected recipe() { return textarea() as unknown as Record<string, string>; }

  update() {
    super.update();
    this.style.setProperty('--ui-rows', String(this.rows));
  }
}

define('ui-textarea', UITextarea);

declare global {
  interface HTMLElementTagNameMap { 'ui-textarea': UITextarea }
}
