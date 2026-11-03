// React <NavigationMenu>: the anatomy, classes and data-* of <ui-navigation-menu>, as Base UI
// Navigation Menu's compound parts (Root, List, Item, Trigger, Icon, Content, Link, Positioner,
// Popup, Viewport). The Root (a <nav>) holds the open item's value (value / defaultValue /
// onValueChange(value, details), '' when closed) and runs the shared behavior
// (dom/navigation.ts: hover, press, keys) on its DOM; the Positioner is the floating layer
// anchored to the open trigger (dom/popup.ts createAnchoredPositioner, the dismiss layer); the
// Popup takes the open content's size (--popup-width / --popup-height). NavigationMenu.Content is
// written inside its Item and renders into the Viewport (a portal, once the Viewport is mounted;
// in place and hidden on the server), so the DOM matches the web component's. The preset
// <NavigationMenu label="Main">{items}</NavigationMenu> adds the List and the Positioner › Popup ›
// Viewport; an Item with `label` gets a Trigger and puts its children in a Content.
import {
  createContext, useContext, useEffect, useId, useLayoutEffect, useRef, useState,
  type AnchorHTMLAttributes, type HTMLAttributes, type MouseEvent, type ReactNode, type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import { renderPart, stateOf, type PartBase } from '../compound.react.tsx';
import { Parts, type PartProps } from '../parts.react.tsx';
import {
  activationDirection, createAnchoredPositioner, createDismissLayer, createNavigationController, eventDetails, hideTopLayer, popupDataAttrs, showTopLayer,
  type ChangeDetails, type ChangeReason, type Side,
} from '../../dom/index.ts';
import { navigationMenu } from '../../styled-system/recipes/navigation-menu.js';

const on = (v: unknown) => (v ? '' : undefined);
const useClientLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

interface NavContext {
  c: Record<string, string>;
  value: string;
  vertical: boolean;
  direction: string;
  setValue: (value: string, reason: ChangeReason, event?: Event) => void;
  rootRef: RefObject<HTMLElement | null>;
  viewport: HTMLElement | null;
  setViewport: (el: HTMLElement | null) => void;
  /** Item values in render order (activation direction). */
  order: RefObject<string[]>;
  id: string;
  /** A submenu (a Root inside another's Content). */
  nested: boolean;
}
const NavCtx = createContext<NavContext | null>(null);
const useNav = (part: string) => {
  const v = useContext(NavCtx);
  if (!v) throw new Error(`<${part}> must be inside NavigationMenu.Root`);
  return v;
};
interface ItemContext { value: string; ids: { trigger: string; content: string }; open: boolean }
const ItemCtx = createContext<ItemContext | null>(null);

export interface NavigationMenuRootProps extends Omit<HTMLAttributes<HTMLElement>, 'className' | 'onChange' | 'defaultValue'>, PartBase {
  /** The open item's value, '' when closed (controlled). */
  value?: string;
  /** The item open at first render (uncontrolled). */
  defaultValue?: string;
  /** Called when an interaction opens, switches or closes an item, with Base UI's details. */
  onValueChange?: (value: string, details: ChangeDetails) => void;
  /** horizontal (default) or vertical. */
  orientation?: 'horizontal' | 'vertical';
  /** Hover: open after this long on a trigger, ms (default 50). */
  delay?: number;
  /** Hover: close this long after the pointer leaves, ms (default 50). */
  closeDelay?: number;
  /** The landmark's name (aria-label). */
  label?: string;
  /** Unit u in px. */
  size?: number;
  children?: ReactNode;
}

/** NavigationMenu.Root: the <nav>; shares the open value with its parts and runs the menu behavior. */
export function NavigationMenuRoot({ value, defaultValue = '', onValueChange, orientation: orientationProp, delay = 50, closeDelay = 50, label, size, className, render, children, style, ...rest }: NavigationMenuRootProps) {
  const id = useId();
  // Inside another menu's Content: a submenu (Base UI nested Root), vertical by default, no landmark.
  const parent = useContext(NavCtx), parentItem = useContext(ItemCtx), nested = !!parent && !!parentItem;
  const orientation = orientationProp ?? (nested ? 'vertical' : 'horizontal');
  const [own, setOwn] = useState(defaultValue);
  const current = value ?? own;
  const vertical = orientation === 'vertical';
  const rootRef = useRef<HTMLElement>(null);
  const [viewport, setViewport] = useState<HTMLElement | null>(null);
  // Item values in render order: this render's (filled by the Items) and the last committed one.
  const order = useRef<string[]>([]), committed = useRef<string[]>([]);
  order.current = [];
  const prev = useRef(current), dir = useRef('');
  if (prev.current !== current) { dir.current = activationDirection(committed.current.indexOf(prev.current), committed.current.indexOf(current), vertical); prev.current = current; }
  useEffect(() => { committed.current = [...order.current]; });
  const live = useRef({ current, onValueChange, value, vertical, delay, closeDelay });
  live.current = { current, onValueChange, value, vertical, delay, closeDelay };
  const setValue = (next: string, reason: ChangeReason, event?: Event) => {
    const l = live.current;
    if (next === l.current) return;
    l.onValueChange?.(next, eventDetails(reason, event));
    if (l.value === undefined) setOwn(next);
  };
  const nav = useRef<ReturnType<typeof createNavigationController>>(null);
  nav.current ??= createNavigationController({
    value: () => live.current.current, change: (v, reason, e) => setValueRef.current(v, reason, e),
    valueOf: (t) => t.closest('[data-part=item]')?.getAttribute('data-value') ?? '',
    vertical: () => live.current.vertical, delay: () => live.current.delay, closeDelay: () => live.current.closeDelay,
  });
  const setValueRef = useRef(setValue);
  setValueRef.current = setValue;
  useEffect(() => {
    const el = rootRef.current, n = nav.current!;
    if (el) n.attach(el);
    return () => n.detach();
  }, []);
  useEffect(() => { if (!current) nav.current?.reset(); }, [current]);
  // A submenu closes with the item that holds it.
  useEffect(() => { if (nested && !parentItem!.open && live.current.current) setValueRef.current('', 'none'); }, [nested && parentItem!.open]);
  const c = navigationMenu();
  const attrs = { 'data-orientation': orientation, 'data-nested': on(nested) };
  const ctx: NavContext = { c, value: current, vertical, direction: dir.current, setValue, rootRef, viewport, setViewport, order, id, nested };
  return (
    <NavCtx.Provider value={ctx}>
      {renderPart(nested ? 'div' : 'nav', c.root, {
        'data-ui': 'navigation-menu', 'data-size': size, 'aria-label': nested ? undefined : label, ...attrs, className,
        style: { ...style, '--ui-anchor': `--${id.replace(/[^\w-]/g, '')}` } as any, ...rest, ref: rootRef, render, children,
      }, stateOf(attrs))}
    </NavCtx.Provider>
  );
}

export interface NavigationMenuPartProps extends Omit<HTMLAttributes<HTMLElement>, 'className'>, PartBase {
  children?: ReactNode;
}

/** NavigationMenu.List: the row (or column) of items (role=list). */
export function NavigationMenuList({ className, render, ...rest }: NavigationMenuPartProps) {
  const n = useNav('NavigationMenu.List');
  const attrs = { 'data-orientation': n.vertical ? 'vertical' : 'horizontal' };
  return renderPart('div', n.c.list, { 'data-part': 'list', role: 'list', ...attrs, className, ...rest, render }, stateOf(attrs));
}

export interface NavigationMenuItemProps extends Omit<NavigationMenuPartProps, 'prefix'>, PartProps {
  /** The item's value (the Root's value names the open item). */
  value?: string;
  /** Preset: a Trigger with this label, the children in a Content. */
  label?: ReactNode;
}

/** NavigationMenu.Item: one entry (role=listitem): a Trigger and its Content, or a Link. */
export function NavigationMenuItem({ value, label, leading, prefix, suffix, trailing, className, render, children, ...rest }: NavigationMenuItemProps) {
  const n = useNav('NavigationMenu.Item');
  const auto = useId();
  const v = value ?? auto;
  n.order.current.push(v);
  const ids = { trigger: `${n.id}${v}trigger`.replace(/[^\w-]/g, ''), content: `${n.id}${v}content`.replace(/[^\w-]/g, '') };
  const body = label !== undefined
    ? <><NavigationMenuTrigger {...{ leading, prefix, suffix }} {...(trailing !== undefined ? { trailing } : {})}>{label}</NavigationMenuTrigger><NavigationMenuContent>{children}</NavigationMenuContent></>
    : children;
  return (
    <ItemCtx.Provider value={{ value: v, ids, open: n.value === v }}>
      {renderPart('div', n.c.item, { 'data-part': 'item', 'data-value': v, role: 'listitem', className, ...rest, render, children: body }, {})}
    </ItemCtx.Provider>
  );
}

export interface NavigationMenuTriggerProps extends Omit<HTMLAttributes<HTMLButtonElement>, 'className' | 'prefix'>, PartBase, PartProps {
  children?: ReactNode;
}

/** NavigationMenu.Trigger: a native <button> (aria-expanded, aria-controls) with a caret (Base UI Icon) in trailing. */
export function NavigationMenuTrigger({ leading, prefix, suffix, trailing: trailingProp, className, render, children, ...rest }: NavigationMenuTriggerProps) {
  const nav = useContext(NavCtx);
  // A submenu's caret points at the side its content opens to.
  const trailing = trailingProp === undefined ? <i {...{ name: nav?.nested ? 'caret-right' : 'caret-down' }} /> : trailingProp;
  const n = useNav('NavigationMenu.Trigger');
  const it = useContext(ItemCtx);
  if (!it) throw new Error('<NavigationMenu.Trigger> must be inside NavigationMenu.Item');
  const attrs = { 'data-popup-open': on(it.open) };
  return renderPart('button', n.c.trigger, {
    type: 'button', 'data-part': 'trigger', id: it.ids.trigger, className, 'aria-expanded': it.open, 'aria-controls': it.ids.content, ...attrs, ...rest,
    children: <Parts classes={n.c} {...{ leading, prefix, suffix, trailing }}>{children}</Parts>, render,
  }, { ...stateOf(attrs), popupOpen: it.open });
}

/** NavigationMenu.Content: the item's panel; renders into the Viewport (hidden unless its item is open). */
export function NavigationMenuContent({ className, render, ...rest }: NavigationMenuPartProps) {
  const n = useNav('NavigationMenu.Content');
  const it = useContext(ItemCtx);
  if (!it) throw new Error('<NavigationMenu.Content> must be inside NavigationMenu.Item');
  const attrs = { 'data-open': on(it.open), 'data-closed': on(!it.open), 'data-activation-direction': it.open && n.direction ? n.direction : undefined };
  const el = renderPart('div', n.c.content, { 'data-part': 'content', id: it.ids.content, hidden: !it.open, ...attrs, className, ...rest, render }, stateOf(attrs));
  return n.viewport ? createPortal(el, n.viewport) : el;
}

export interface NavigationMenuLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'className' | 'prefix'>, PartBase, PartProps {
  /** The current page (data-active, aria-current=page). */
  active?: boolean;
  /** Close the menu when pressed (reason link-press). */
  closeOnClick?: boolean;
  children?: ReactNode;
}

/** NavigationMenu.Link: an <a>; data-active on the current page. */
export function NavigationMenuLink({ active = false, closeOnClick = false, leading, prefix, suffix, trailing, onClick, className, render, children, ...rest }: NavigationMenuLinkProps) {
  const n = useNav('NavigationMenu.Link');
  const attrs = { 'data-active': on(active) };
  return renderPart('a', n.c.link, {
    'data-part': 'link', 'aria-current': active ? 'page' : undefined, ...attrs, className, ...rest,
    onClick: (e: MouseEvent<HTMLAnchorElement>) => { onClick?.(e); if (closeOnClick && !e.defaultPrevented) n.setValue('', 'link-press', e.nativeEvent); },
    children: <Parts classes={n.c} {...{ leading, prefix, suffix, trailing }}>{children}</Parts>, render,
  }, stateOf(attrs));
}

/** NavigationMenu.Positioner: the floating layer under the open trigger (popover="manual"). */
export function NavigationMenuPositioner({ className, render, children, ...rest }: NavigationMenuPartProps) {
  const n = useNav('NavigationMenu.Positioner');
  const ref = useRef<HTMLDivElement>(null);
  const want: Side = n.vertical ? 'right' : 'bottom';
  const [side, setSide] = useState<Side>(want);
  const open = !!n.value;
  const live = useRef(n);
  live.current = n;
  const trigger = () => n.rootRef.current?.querySelector<HTMLElement>(`:scope > [data-part=list] > [data-part=item] > [data-part=trigger][aria-expanded=true]`) ?? null;
  const api = useRef<ReturnType<typeof createAnchoredPositioner>>(null);
  useClientLayoutEffect(() => {
    const pos = ref.current;
    if (!open || !pos) return;
    setSide(want);
    const popup = () => pos.querySelector<HTMLElement>(':scope > [data-part=popup]');
    popup()?.style.removeProperty('--popup-width');
    popup()?.style.removeProperty('--popup-height');
    const positioner = createAnchoredPositioner({ anchor: trigger, positioner: () => ref.current, surface: popup, side: () => want, align: () => 'start', onPlace: setSide });
    const dismiss = createDismissLayer({
      inside: () => [n.rootRef.current?.querySelector(':scope > [data-part=list]'), ref.current], focusOut: true,
      onDismiss: (reason, event) => {
        const t = trigger();
        live.current.setValue('', reason, event);
        if (reason === 'escape-key' && t && (pos.contains(document.activeElement) || document.activeElement === document.body)) t.focus();
      },
    });
    api.current = positioner;
    showTopLayer(pos);
    positioner.start();
    dismiss.activate();
    return () => { dismiss.deactivate(); positioner.stop(); hideTopLayer(pos); api.current = null; };
  }, [open, want]);
  // Each open value: size the popup to its content, then place again.
  useClientLayoutEffect(() => {
    const pos = ref.current, popup = pos?.querySelector<HTMLElement>(':scope > [data-part=popup]');
    const content = pos?.querySelector<HTMLElement>('[data-part=content][data-open]');
    if (!open || !popup || !content) return;
    const r = content.getBoundingClientRect(), cs = getComputedStyle(popup);
    const f = (a: string, b: string) => ['padding', 'border'].reduce((s, k) => s + (parseFloat(cs.getPropertyValue(k === 'padding' ? `padding-${a}` : `border-${a}-width`)) || 0) + (parseFloat(cs.getPropertyValue(k === 'padding' ? `padding-${b}` : `border-${b}-width`)) || 0), 0);
    popup.style.setProperty('--popup-width', `${r.width + f('left', 'right')}px`);
    popup.style.setProperty('--popup-height', `${r.height + f('top', 'bottom')}px`);
    api.current?.update();
  }, [open, n.value, n.viewport]);
  const placed = open ? side : want;
  const state = popupDataAttrs({ open, side: placed, align: 'start' });
  return (
    <PlacedCtx.Provider value={placed}>
      {renderPart('div', n.c.positioner, { 'data-part': 'positioner', popover: 'manual', ...state, 'data-placement': `${placed}-start`, className, ...rest, ref, render, children }, stateOf(state))}
    </PlacedCtx.Provider>
  );
}
const PlacedCtx = createContext<Side>('bottom');

/** NavigationMenu.Popup: the surface holding the Viewport; sized to the open content. */
export function NavigationMenuPopup({ className, render, ...rest }: NavigationMenuPartProps) {
  const n = useNav('NavigationMenu.Popup');
  const side = useContext(PlacedCtx);
  const state = popupDataAttrs({ open: !!n.value, side, align: 'start' });
  return renderPart('div', n.c.popup, { 'data-part': 'popup', ...state, className, ...rest, render }, stateOf(state));
}

/** NavigationMenu.Viewport: where the open item's Content renders. */
export function NavigationMenuViewport({ className, render, ...rest }: NavigationMenuPartProps) {
  const n = useNav('NavigationMenu.Viewport');
  return renderPart('div', n.c.viewport, { 'data-part': 'viewport', className, ...rest, ref: n.setViewport, render }, {});
}

export interface NavigationMenuProps extends NavigationMenuRootProps {}

/** Preset: NavigationMenu.Root with a List of the children (Items) and a Positioner › Popup › Viewport. */
export function NavigationMenu({ children, ...rest }: NavigationMenuProps) {
  return (
    <NavigationMenuRoot {...rest}>
      <NavigationMenuList>{children}</NavigationMenuList>
      <NavigationMenuPositioner><NavigationMenuPopup><NavigationMenuViewport /></NavigationMenuPopup></NavigationMenuPositioner>
    </NavigationMenuRoot>
  );
}
NavigationMenu.Root = NavigationMenuRoot;
NavigationMenu.List = NavigationMenuList;
NavigationMenu.Item = NavigationMenuItem;
NavigationMenu.Trigger = NavigationMenuTrigger;
NavigationMenu.Content = NavigationMenuContent;
NavigationMenu.Link = NavigationMenuLink;
NavigationMenu.Positioner = NavigationMenuPositioner;
NavigationMenu.Popup = NavigationMenuPopup;
NavigationMenu.Viewport = NavigationMenuViewport;
