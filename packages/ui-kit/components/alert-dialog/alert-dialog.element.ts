// <ui-alert-dialog>: a dialog that interrupts to ask for a decision (Base UI Alert Dialog: the
// Dialog parts with role=alertdialog). It is the ui-dialog element (components/dialog) with three
// differences: the popup's role is alertdialog, it is always modal, and an outside press never
// closes it (Escape and the close parts do). Focus starts on the least destructive action: an
// [autofocus] element, else the first close part (Cancel), else the first tabbable.
import { define } from '../../core/index.ts';
import { UIDialog } from '../dialog/dialog.element.ts';
import { alertDialog } from '../../styled-system/recipes/alert-dialog.js';

export class UIAlertDialog extends UIDialog {
  // No modal or disable-pointer-dismissal: an alert dialog is always modal and ignores outside presses.
  static properties = (({ modal: _m, disablePointerDismissal: _d, ...rest }) => rest)(UIDialog.properties) as unknown as typeof UIDialog.properties;
  static popupRole = 'alertdialog';
  protected get pointerDismissal() { return false; }
  protected get modalMode() { return true as const; }
  protected initialFocus() { return super.initialFocus() ?? this.ownParts('close')[0]; }
  protected classes() { return alertDialog(); }
}

define('ui-alert-dialog', UIAlertDialog);

declare global {
  interface HTMLElementTagNameMap { 'ui-alert-dialog': UIAlertDialog }
}
