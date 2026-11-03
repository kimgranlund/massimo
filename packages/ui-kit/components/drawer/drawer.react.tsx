// React <Drawer>: the anatomy, classes and data-* of <ui-drawer>, as Base UI Drawer's compound
// parts. They are the Dialog parts (components/dialog/dialog.react.tsx) over Drawer.Root, which
// anchors the popup to `side` (bottom by default; data-swipe-direction) and, while open, lets a
// swipe toward that edge close it (dom/swipe.ts, reason 'swipe').
import {
  DialogActions, DialogBackdrop, DialogClose, DialogDescription, DialogPopup, DialogPortal, DialogRootImpl, DialogTitle, DialogTrigger,
  presetParts, type DialogKind, type DialogProps, type DialogRootProps,
} from '../dialog/dialog.react.tsx';
import { SWIPE_OF, createSwipeDismiss } from '../../dom/index.ts';
import type { DrawerSide } from '../../tokens/geometry/resolve.ts';
import { drawer } from '../../styled-system/recipes/drawer.js';

const kinds = new Map<DrawerSide, DialogKind>();
/** The dialog kind for a drawer side (one per side, so the root's options stay stable). */
const kindOf = (side: DrawerSide): DialogKind => {
  let k = kinds.get(side);
  if (!k) {
    k = {
      ui: 'drawer', classes: () => drawer({ side }), role: 'dialog', popupAttrs: { 'data-swipe-direction': SWIPE_OF[side] },
      whileOpen: (popup, request) => {
        const swipe = createSwipeDismiss({ el: () => popup, direction: () => SWIPE_OF[side], onSwipe: (event) => request(false, 'swipe', event) });
        swipe.reset();
        swipe.attach();
        return () => swipe.detach();
      },
    };
    kinds.set(side, k);
  }
  return k;
};

export interface DrawerRootProps extends DialogRootProps {
  /** The edge the sheet is anchored to and swipes away toward (Base UI swipeDirection: bottom = down). Default bottom. */
  side?: DrawerSide;
}

/** Drawer.Root: the host (display: contents); the dialog root on an edge sheet with swipe to dismiss. */
export function DrawerRoot({ side = 'bottom', ...props }: DrawerRootProps) { return DialogRootImpl(props, kindOf(side)); }

export interface DrawerProps extends DrawerRootProps, Pick<DialogProps, 'label' | 'description' | 'trigger'> {}

/** Preset: Drawer.Root with a Trigger, a Backdrop and a Popup holding the Title, Description and the children. */
export function Drawer({ label, description, trigger, children, ...rest }: DrawerProps) {
  return <DrawerRoot {...rest}>{presetParts({ label, description, trigger, children })}</DrawerRoot>;
}
Drawer.Root = DrawerRoot;
Drawer.Trigger = DialogTrigger;
Drawer.Portal = DialogPortal;
Drawer.Backdrop = DialogBackdrop;
Drawer.Popup = DialogPopup;
Drawer.Title = DialogTitle;
Drawer.Description = DialogDescription;
Drawer.Actions = DialogActions;
Drawer.Close = DialogClose;
