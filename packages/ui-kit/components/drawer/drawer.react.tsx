// React <Drawer>: the anatomy, classes and data-* of <ui-drawer>, as Base UI Drawer's compound
// parts. They are the Dialog parts (components/dialog/dialog.react.tsx) over Drawer.Root, which
// anchors the popup to `side` (bottom by default; data-swipe-direction) and, while open, lets a
// swipe toward that edge close it (dom/swipe.ts, reason 'swipe').
import {
  DialogActions, DialogBackdrop, DialogClose, DialogDescription, DialogPopup, DialogPortal, DialogRootImpl, DialogTitle, DialogTrigger,
  presetParts, type DialogKind, type DialogProps, type DialogRootProps,
} from '../dialog/dialog.react.tsx';
import { useEffect, useMemo, useRef, useState } from 'react';
import { SWIPE_OF, applySnapOffset, createSwipeDismiss, snapExtent, type SnapPoint } from '../../dom/swipe.ts';
import { eventDetails, type ChangeDetails } from '../../dom/events.ts';
import type { DrawerSide } from '../../tokens/geometry/resolve.ts';
import { drawer } from '../../styled-system/recipes/drawer.js';

/** Snap point state a drawer's kind reads while open (refs: the kind stays stable across renders). */
interface SnapRefs { points: SnapPoint[]; current: SnapPoint | undefined; change: (value: SnapPoint, event: Event) => void; place?: () => void }

/** The dialog kind for one drawer: its side, swipe to dismiss and its snap points. */
const kindOf = (side: DrawerSide, snap: { current: SnapRefs }): DialogKind => ({
  ui: 'drawer', classes: () => drawer({ side }), role: 'dialog', popupAttrs: { 'data-swipe-direction': SWIPE_OF[side] },
  whileOpen: (popup, request) => {
    const x = side === 'left' || side === 'right';
    const size = () => (x ? popup.offsetWidth : popup.offsetHeight);
    const extents = () => {
      const vp = x ? window.innerWidth : window.innerHeight, rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
      return snap.current.points.map((p) => snapExtent(p, vp, size(), rem)).map((e) => (Number.isNaN(e) ? size() : e));
    };
    const index = () => { const i = snap.current.points.findIndex((p) => String(p) === String(snap.current.current)); return i >= 0 ? i : 0; };
    const place = () => {
      if (!snap.current.points.length) { popup.style.removeProperty('--drawer-snap-x'); popup.style.removeProperty('--drawer-snap-y'); return; }
      applySnapOffset(popup, SWIPE_OF[side], Math.max(0, size() - (extents()[index()] ?? size())));
    };
    const swipe = createSwipeDismiss({
      el: () => popup, direction: () => SWIPE_OF[side], onSwipe: (event) => request(false, 'swipe', event),
      snap: snap.current.points.length ? { extents, index, onSnap: (i, event) => snap.current.change(snap.current.points[i], event) } : undefined,
    });
    snap.current.place = place;
    place();
    swipe.reset();
    swipe.attach();
    window.addEventListener('resize', place);
    return () => { swipe.detach(); window.removeEventListener('resize', place); snap.current.place = undefined; };
  },
});

export interface DrawerRootProps extends DialogRootProps {
  /** The edge the sheet is anchored to and swipes away toward (Base UI swipeDirection: bottom = down). Default bottom. */
  side?: DrawerSide;
  /** Where the sheet can rest (Base UI snapPoints): viewport fractions (0..1), px numbers, or "148px" / "20rem". */
  snapPoints?: SnapPoint[];
  /** The snap point it rests at (controlled; Base UI snapPoint). */
  snapPoint?: SnapPoint | null;
  /** The first snap point (uncontrolled); default the first of snapPoints. */
  defaultSnapPoint?: SnapPoint;
  /** A swipe settled on another snap point (Base UI onSnapPointChange). */
  onSnapPointChange?: (value: SnapPoint, details: ChangeDetails) => void;
}

/** Drawer.Root: the host (display: contents); the dialog root on an edge sheet with swipe to dismiss and snap points. */
export function DrawerRoot({ side = 'bottom', snapPoints, snapPoint, defaultSnapPoint, onSnapPointChange, ...props }: DrawerRootProps) {
  const [own, setOwn] = useState<SnapPoint | undefined>(defaultSnapPoint);
  const current = snapPoint ?? own ?? snapPoints?.[0];
  const snap = useRef<SnapRefs>({ points: [], current: undefined, change: () => {} });
  snap.current.points = snapPoints ?? [];
  snap.current.current = current;
  snap.current.change = (value, event) => { if (snapPoint === undefined) setOwn(value); onSnapPointChange?.(value, eventDetails('swipe', event)); };
  const kind = useMemo(() => kindOf(side, snap), [side, (snapPoints ?? []).join(',')]);
  // A new point (controlled or after a swipe): move the open sheet there.
  useEffect(() => { snap.current.place?.(); }, [String(current)]);
  return DialogRootImpl(props, kind);
}

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
