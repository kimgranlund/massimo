// React <Dialog>: the anatomy, classes and data-* of <ui-dialog>, as Base UI Dialog's compound parts.
// Dialog.Root holds the open state (open / defaultOpen / onOpenChange(open, details)) and runs the
// modal layer (dom/dialog.ts: top layer, scroll lock, inert outside, focus trap and return,
// Escape and outside press) while open; Dialog.Trigger and Dialog.Close are kit Buttons;
// Dialog.Portal renders its children in place (the top layer already lifts the popup above the
// page and out of overflow clipping); Dialog.Backdrop, Dialog.Popup, Dialog.Title (h2),
// Dialog.Description (p) and Dialog.Actions (ours) render their elements. The preset
// <Dialog label description trigger …>content</Dialog> is composed from them. AlertDialog and
// Drawer are the same parts over their own Root (DialogRootImpl with a kind).
import { createContext, useContext, useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type HTMLAttributes, type ReactNode, type RefObject } from 'react';
import { cx } from '../../styled-system/css/cx.js';
import { renderPart, stateOf, type PartBase, type PartState } from '../compound.react.tsx';
import { Button, type ButtonProps } from '../button/button.react.tsx';
import { createModalLayer, eventDetails, type ChangeDetails, type ChangeReason, type ModalMode } from '../../dom/index.ts';
import { dialog } from '../../styled-system/recipes/dialog.js';

const on = (v: unknown) => (v ? '' : undefined);
const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export interface DialogRootProps extends Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'onChange'>, PartBase {
  /** Controlled open state. */
  open?: boolean;
  /** Open at first render (uncontrolled). */
  defaultOpen?: boolean;
  /** Called when the dialog asks to open or close, with Base UI's details ({ reason, event }). */
  onOpenChange?: (open: boolean, details: ChangeDetails) => void;
  /** Base UI modal: true (focus trap, scroll lock, the page inert), 'trap-focus' (trap only), false (page stays interactive). */
  modal?: ModalMode;
  /** Outside presses do not close it (Base UI disablePointerDismissal). */
  disablePointerDismissal?: boolean;
  /** Unit u in px; the popup's padding and radius scale with it. */
  size?: number;
  children?: ReactNode;
}

/** What differs between Dialog, AlertDialog and Drawer roots. */
export interface DialogKind {
  ui: string;
  classes: () => Record<string, string>;
  role: 'dialog' | 'alertdialog';
  /** Never close on an outside press (AlertDialog). */
  noPointerDismissal?: boolean;
  /** Where focus goes on open, given the popup (default: an [autofocus] element, else the first tabbable). */
  initialFocus?: (popup: HTMLElement) => HTMLElement | null | undefined;
  /** Extra popup attributes (Drawer: data-swipe-direction). */
  popupAttrs?: Record<string, string | undefined>;
  /** Called with the popup while open, returning a cleanup (Drawer: swipe to dismiss). */
  whileOpen?: (popup: HTMLElement, request: DialogContext['request']) => () => void;
}

export interface DialogContext {
  c: Record<string, string>;
  kind: DialogKind;
  open: boolean;
  modal: ModalMode;
  nested: boolean;
  nestedCount: number;
  state: PartState;
  ids: { popup: string; title: string; description: string };
  has: { title: boolean; description: boolean };
  register: (part: 'title' | 'description', present: boolean) => void;
  request: (open: boolean, reason: ChangeReason, event?: Event) => void;
  refs: { trigger: RefObject<HTMLElement | null>; backdrop: RefObject<HTMLElement | null>; popup: RefObject<HTMLElement | null> };
}
export const DialogCtx = createContext<DialogContext | null>(null);
export const useDialog = (part: string) => {
  const v = useContext(DialogCtx);
  if (!v) throw new Error(`<${part}> must be inside Dialog.Root`);
  return v;
};

export const DIALOG_KIND: DialogKind = { ui: 'dialog', classes: () => dialog(), role: 'dialog' };

/** A dialog root for a kind (Dialog, AlertDialog, Drawer): the open state and the modal layer while open. */
export function DialogRootImpl({ open, defaultOpen = false, onOpenChange, modal = true, disablePointerDismissal = false, size, children, className, render, ...rest }: DialogRootProps, kind: DialogKind) {
  const id = useId();
  const [own, setOwn] = useState(defaultOpen);
  const value = open ?? own;
  const [nested, setNested] = useState(false);
  const [nestedCount, setNestedCount] = useState(0);
  const [has, setHas] = useState({ title: false, description: false });
  const refs = { trigger: useRef<HTMLElement>(null), backdrop: useRef<HTMLElement>(null), popup: useRef<HTMLElement>(null) };
  const latest = useRef({ value, onOpenChange, open });
  latest.current = { value, onOpenChange, open };
  const request = (next: boolean, reason: ChangeReason, event?: Event) => {
    if (next === latest.current.value) return;
    latest.current.onOpenChange?.(next, eventDetails(reason, event));
    if (latest.current.open === undefined) setOwn(next);
  };
  const pointer = !kind.noPointerDismissal && !disablePointerDismissal;
  const opts = useRef({ modal, pointer, kind, request });
  opts.current = { modal, pointer, kind, request };
  useEffect(() => {
    if (!value) return;
    const layer = createModalLayer({
      popup: () => refs.popup.current, backdrop: () => refs.backdrop.current, trigger: () => refs.trigger.current,
      modal: () => opts.current.modal, pointerDismissal: () => opts.current.pointer,
      initialFocus: () => {
        const p = refs.popup.current;
        return p ? (opts.current.kind.initialFocus?.(p) ?? p.querySelector<HTMLElement>('[autofocus]')) : undefined;
      },
      onDismiss: (reason, event) => opts.current.request(false, reason, event),
      onNested: setNestedCount,
    });
    layer.open();
    setNested(layer.nested);
    const stop = refs.popup.current && opts.current.kind.whileOpen?.(refs.popup.current, (o, r, e) => opts.current.request(o, r, e));
    return () => { stop?.(); layer.close(); setNestedCount(0); };
  }, [value]);
  const c = kind.classes();
  const attrs = { 'data-open': on(value), 'data-closed': on(!value) };
  const state = stateOf(attrs);
  const register = (part: 'title' | 'description', present: boolean) => setHas((h) => (h[part] === present ? h : { ...h, [part]: present }));
  return (
    <DialogCtx.Provider value={{
      c, kind, open: value, modal, nested: value && nested, nestedCount, state,
      ids: { popup: `${id}popup`, title: `${id}title`, description: `${id}description` }, has, register, request, refs,
    }}>
      {renderPart('div', c.root, { 'data-ui': kind.ui, 'data-size': size, ...attrs, className, ...rest, render, children }, state)}
    </DialogCtx.Provider>
  );
}

/** Dialog.Root: the host (display: contents); shares the open state with its parts. */
export function DialogRoot(props: DialogRootProps) { return DialogRootImpl(props, DIALOG_KIND); }

export interface DialogButtonProps extends Omit<ButtonProps, 'className'>, PartBase {}

/** Dialog.Trigger: a kit Button that opens the dialog (aria-haspopup, aria-expanded, data-popup-open). */
export function DialogTrigger({ className, onClick, ...rest }: DialogButtonProps) {
  const f = useDialog('Dialog.Trigger');
  const state = { ...f.state, popupOpen: f.open };
  return (
    <Button
      data-part="trigger" aria-haspopup="dialog" aria-expanded={f.open} aria-controls={f.ids.popup} data-popup-open={on(f.open)}
      {...({ ref: f.refs.trigger } as object)} {...rest}
      className={cx(f.c.trigger, typeof className === 'function' ? className(state) : className)}
      onClick={(e) => { onClick?.(e); if (!e.defaultPrevented) f.request(!f.open, 'trigger-press', e.nativeEvent); }}
    />
  );
}

/** Dialog.Close: a kit Button inside the popup that closes it (reason close-press). */
export function DialogClose({ className, onClick, ...rest }: DialogButtonProps) {
  const f = useDialog('Dialog.Close');
  return (
    <Button
      data-part="close" {...rest}
      className={cx(f.c.close, typeof className === 'function' ? className(f.state) : className)}
      onClick={(e) => { onClick?.(e); if (!e.defaultPrevented) f.request(false, 'close-press', e.nativeEvent); }}
    />
  );
}

/** Dialog.Portal: renders its children in place; the top layer lifts the backdrop and popup above the page. */
export function DialogPortal({ children }: { children?: ReactNode }) {
  useDialog('Dialog.Portal');
  return <>{children}</>;
}

export interface DialogPartProps extends Omit<HTMLAttributes<HTMLDivElement>, 'className'>, PartBase {
  children?: ReactNode;
}

/** Dialog.Backdrop: the bg.backdrop role over the viewport, under the popup (hidden for a nested dialog). */
export function DialogBackdrop({ className, render, ...rest }: DialogPartProps) {
  const f = useDialog('Dialog.Backdrop');
  return renderPart('div', f.c.backdrop, {
    'data-part': 'backdrop', ref: f.refs.backdrop, hidden: f.nested || undefined, 'aria-hidden': 'true', popover: 'manual',
    'data-open': on(f.open), 'data-closed': on(!f.open), className, ...rest, render,
  }, f.state);
}

/** Dialog.Popup: the window (role=dialog, aria-modal while modal), in the top layer while open. */
export function DialogPopup({ className, render, style, ...rest }: DialogPartProps) {
  const f = useDialog('Dialog.Popup');
  const nestedOpen = f.nestedCount > 0;
  const state = { ...f.state, ...(f.nested ? { nested: true } : {}), ...(nestedOpen ? { nestedDialogOpen: true } : {}) };
  return renderPart('div', f.c.popup, {
    'data-part': 'popup', id: f.ids.popup, ref: f.refs.popup,
    role: f.kind.role, 'aria-modal': f.modal === true ? 'true' : undefined, tabIndex: -1, popover: 'manual',
    'aria-labelledby': f.has.title ? f.ids.title : undefined, 'aria-describedby': f.has.description ? f.ids.description : undefined,
    'data-open': on(f.open), 'data-closed': on(!f.open), 'data-nested': on(f.nested), 'data-nested-dialog-open': on(nestedOpen),
    ...f.kind.popupAttrs,
    style: nestedOpen ? { '--nested-dialogs': f.nestedCount, ...style } as CSSProperties : style,
    className, ...rest, render,
  }, state);
}

function useRegister(f: DialogContext, part: 'title' | 'description') {
  useIsoLayoutEffect(() => { f.register(part, true); return () => f.register(part, false); }, []);
}

/** Dialog.Title: the h2 that names the popup (aria-labelledby). */
export function DialogTitle({ className, render, ...rest }: Omit<HTMLAttributes<HTMLHeadingElement>, 'className'> & PartBase) {
  const f = useDialog('Dialog.Title');
  useRegister(f, 'title');
  return renderPart('h2', f.c.title, { 'data-part': 'title', id: f.ids.title, className, ...rest, render }, f.state);
}

/** Dialog.Description: the paragraph that describes the popup (aria-describedby). */
export function DialogDescription({ className, render, ...rest }: Omit<HTMLAttributes<HTMLParagraphElement>, 'className'> & PartBase) {
  const f = useDialog('Dialog.Description');
  useRegister(f, 'description');
  return renderPart('p', f.c.description, { 'data-part': 'description', id: f.ids.description, className, ...rest, render }, f.state);
}

/** Dialog.Actions (ours): the row of actions at the popup's end, 2u apart. */
export function DialogActions({ className, render, ...rest }: DialogPartProps) {
  const f = useDialog('Dialog.Actions');
  return renderPart('div', f.c.actions, { 'data-part': 'actions', className, ...rest, render }, f.state);
}

export interface DialogProps extends DialogRootProps {
  /** The title (Dialog.Title). */
  label?: ReactNode;
  /** The description under the title (Dialog.Description). */
  description?: ReactNode;
  /** The trigger button's content (Dialog.Trigger); none when omitted. */
  trigger?: ReactNode;
}

/** Preset parts in the web component's order: trigger, backdrop, popup (title, description, children). */
export function presetParts({ label, description, trigger, children }: Pick<DialogProps, 'label' | 'description' | 'trigger' | 'children'>) {
  return (
    <>
      {trigger != null && <DialogTrigger>{trigger}</DialogTrigger>}
      <DialogBackdrop />
      <DialogPopup>
        {label != null && <DialogTitle>{label}</DialogTitle>}
        {description != null && <DialogDescription>{description}</DialogDescription>}
        {children}
      </DialogPopup>
    </>
  );
}

/** Preset: Dialog.Root with a Trigger, a Backdrop and a Popup holding the Title, Description and the children. */
export function Dialog({ label, description, trigger, children, ...rest }: DialogProps) {
  return <DialogRoot {...rest}>{presetParts({ label, description, trigger, children })}</DialogRoot>;
}
Dialog.Root = DialogRoot;
Dialog.Trigger = DialogTrigger;
Dialog.Portal = DialogPortal;
Dialog.Backdrop = DialogBackdrop;
Dialog.Popup = DialogPopup;
Dialog.Title = DialogTitle;
Dialog.Description = DialogDescription;
Dialog.Actions = DialogActions;
Dialog.Close = DialogClose;
