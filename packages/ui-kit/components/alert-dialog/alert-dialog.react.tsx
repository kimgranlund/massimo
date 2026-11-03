// React <AlertDialog>: the anatomy, classes and data-* of <ui-alert-dialog>, as Base UI Alert
// Dialog's compound parts. They are the Dialog parts (components/dialog/dialog.react.tsx) over
// AlertDialog.Root, which makes the popup role=alertdialog, is always modal, never closes on an
// outside press, and starts focus on the least destructive action (an [autofocus] element, else
// the first Close, else the first tabbable).
import {
  DialogActions, DialogBackdrop, DialogClose, DialogDescription, DialogPopup, DialogPortal, DialogRootImpl, DialogTitle, DialogTrigger,
  presetParts, type DialogKind, type DialogProps, type DialogRootProps,
} from '../dialog/dialog.react.tsx';
import { alertDialog } from '../../styled-system/recipes/alert-dialog.js';

const ALERT_KIND: DialogKind = {
  ui: 'alert-dialog', classes: () => alertDialog(), role: 'alertdialog', noPointerDismissal: true,
  initialFocus: (popup) => popup.querySelector<HTMLElement>('[autofocus]') ?? popup.querySelector<HTMLElement>('[data-part=close]'),
};

export interface AlertDialogRootProps extends Omit<DialogRootProps, 'modal' | 'disablePointerDismissal'> {}

/** AlertDialog.Root: the host (display: contents); always modal, no outside-press dismissal. */
export function AlertDialogRoot(props: AlertDialogRootProps) { return DialogRootImpl(props, ALERT_KIND); }

export interface AlertDialogProps extends AlertDialogRootProps, Pick<DialogProps, 'label' | 'description' | 'trigger'> {}

/** Preset: AlertDialog.Root with a Trigger, a Backdrop and a Popup holding the Title, Description and the children. */
export function AlertDialog({ label, description, trigger, children, ...rest }: AlertDialogProps) {
  return <AlertDialogRoot {...rest}>{presetParts({ label, description, trigger, children })}</AlertDialogRoot>;
}
AlertDialog.Root = AlertDialogRoot;
AlertDialog.Trigger = DialogTrigger;
AlertDialog.Portal = DialogPortal;
AlertDialog.Backdrop = DialogBackdrop;
AlertDialog.Popup = DialogPopup;
AlertDialog.Title = DialogTitle;
AlertDialog.Description = DialogDescription;
AlertDialog.Actions = DialogActions;
AlertDialog.Close = DialogClose;
