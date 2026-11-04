// React <Menu>: the anatomy, classes and data-* of <ui-menu>, as Base UI Menu's compound parts.
// Menu.Root holds the open state (open / defaultOpen / onOpenChange(open, details)) and renders the
// host (data-ui="menu"); Menu.Trigger is a native <button> (aria-haspopup=menu); Menu.Portal and
// Menu.Positioner render no element (the Positioner's side and align place the popup); Menu.Popup is
// the role=menu floating layer (components/floating.react.ts: top layer, anchor or script
// placement, outside press / Escape / focus-out); Menu.Item, CheckboxItem (+ CheckboxItemIndicator),
// RadioGroup, RadioItem (+ RadioItemIndicator), Group, GroupLabel, Separator; Menu.SubmenuRoot and
// Menu.SubmenuTrigger nest a menu beside an item. Keys, focus and typeahead are the web component's
// (dom/menu.ts). The preset <Menu label="Edit">items</Menu> is Root + Trigger + Positioner + Popup.
import {
  createContext, useContext, useEffect, useId, useLayoutEffect, useRef, useState,
  type FocusEvent, type HTMLAttributes, type KeyboardEvent, type MouseEvent, type PointerEvent, type ReactNode, type RefObject,
} from 'react';
import { renderPart, stateOf, type PartBase, type PartState } from '../compound.react.tsx';
import { createSubmenuAim, menuGroupAttrs, menuIndicatorAttrs, menuItemAttrs, menuItemDisabled, menuItems, menuNavigate, menuOptionItems, menuPopupAttrs, menuSeparatorAttrs, menuTriggerAttrs, submenuKeys, isRtl, type MenuItemKind } from '../../dom/menu.ts';
import { createTypeahead, isPrintableKey } from '../../dom/listbox.ts';
import { eventDetails, type ChangeDetails, type ChangeReason } from '../../dom/events.ts';
import { toReactProps } from '../../dom/attrs.ts';
import { type Align, type Side } from '../../dom/floating.ts';
import { useFloatingLayer } from '../floating.react.ts';
import { Parts, type PartProps } from '../parts.react.tsx';
import { menu as menuRecipe } from '../../styled-system/recipes/menu.js';

export type MenuFocus = 'first' | 'last' | 'popup' | 'none';
export type MenuPlacement = 'anchor' | 'submenu' | 'point';
const props = (a: Record<string, unknown>) => toReactProps(a as any) as Record<string, any>;

export interface MenuContext {
  open: boolean;
  setOpen: (open: boolean, reason: ChangeReason, event?: Event, focus?: MenuFocus) => boolean;
  closeTree: (reason: ChangeReason, event?: Event) => void;
  c: Record<string, string>;
  placement: MenuPlacement;
  disabled: boolean;
  openOnHover: boolean;
  delay: number;
  ids: { trigger: string; popup: string };
  anchorRef: RefObject<HTMLElement | null>;
  popupRef: RefObject<HTMLElement | null>;
  popupProps: Record<string, string | undefined>;
  side: Side;
  align: Align;
  setPosition: (p: { side?: Side; align?: Align }) => void;
  highlighted: HTMLElement | null;
  highlight: (el: HTMLElement | null) => void;
  parent: MenuContext | null;
  /** The menubar this menu's trigger belongs to, if any (components/menubar). */
  bar: MenubarLink | null;
  /** Open submenus of this menu's popup, by id: their trigger and how to close them. */
  subs: Map<string, { trigger: RefObject<HTMLElement | null>; popup: RefObject<HTMLElement | null>; close: (e: Event) => void }>;
}
/** What a menubar shares with its menus (set by Menubar; null elsewhere). */
export interface MenubarLink {
  /** This menu's place in the bar. */
  index: number;
  /** The place whose trigger holds the bar's tab stop. */
  stop: number;
  /** Whether a menu of the bar is open (then hovering another trigger opens it). */
  anyOpen: boolean;
  orientation: 'horizontal' | 'vertical';
  /** Report a menu's open state to the bar (an opening closes the others: sibling-open). */
  report: (index: number, open: boolean) => void;
  /** A trigger took focus: it holds the tab stop. */
  focused: (index: number) => void;
  /** Keep the bar's handle on a menu (its trigger, popup and setOpen), for its keys. */
  register: (index: number, entry: MenubarEntry) => void;
}
export interface MenubarEntry {
  trigger: RefObject<HTMLElement | null>;
  popup: RefObject<HTMLElement | null>;
  open: boolean;
  disabled: boolean;
  setOpen: MenuContext['setOpen'];
}
export const MenubarCtx = createContext<MenubarLink | null>(null);
export const MenuCtx = createContext<MenuContext | null>(null);
/** The enclosing menu's context (for parts built on Menu: ContextMenu.Trigger, Menubar); throws outside one. */
export const useMenuContext = (part: string) => useMenu(part);
const useMenu = (part: string) => {
  const v = useContext(MenuCtx);
  if (!v) throw new Error(`<${part}> must be inside Menu.Root`);
  return v;
};
/** The checked state of the enclosing checkbox or radio item (for its indicator). */
const ItemCtx = createContext<{ checked: boolean; disabled: boolean } | null>(null);
const RadioCtx = createContext<{ value: string | undefined; select: (v: string, e: Event) => boolean } | null>(null);
const GroupCtx = createContext<string | undefined>(undefined);

const own = (popup: HTMLElement | null, el: Element | null) => !!el && el.parentElement?.closest('[data-part=popup]') === popup;

export interface MenuRootProps extends Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'onChange'>, PartBase {
  /** Controlled open state. */
  open?: boolean;
  /** Open at first render (uncontrolled). */
  defaultOpen?: boolean;
  /** Called when an interaction opens or closes the menu, with Base UI's details ({ reason, event }). */
  onOpenChange?: (open: boolean, details: ChangeDetails) => void;
  /** Ignores presses and keys on the trigger. */
  disabled?: boolean;
  /** Open when the pointer rests on the trigger (Base UI openOnHover). */
  openOnHover?: boolean;
  /** The rest before a hover opens, in ms. Default 100. */
  delay?: number;
  /** Unit u in px; the trigger row is 8u, items 7u. */
  size?: number;
  /** Internal: where the popup goes (ContextMenu passes point; SubmenuRoot submenu). */
  placement?: MenuPlacement;
  /** Internal: the host's data-ui (ContextMenu's: context-menu). */
  ui?: string;
  /** Internal: the host's recipe class in place of the menu root's (ContextMenu's). */
  hostClass?: string;
  children?: ReactNode;
}

/** Menu.Root: the host (data-ui="menu"); shares the open state, the floating layer and the highlight with its parts. */
export function MenuRoot({ open, defaultOpen = false, onOpenChange, disabled = false, openOnHover = false, delay = 100, size, placement: forced, ui = 'menu', hostClass, children, className, render, ...rest }: MenuRootProps) {
  const parent = useContext(MenuCtx);
  const barCtx = useContext(MenubarCtx);
  // Only a top-level menu is the bar's (its submenus see the same context and leave it).
  const bar = parent ? null : barCtx;
  const placement: MenuPlacement = forced ?? (parent || bar?.orientation === 'vertical' ? 'submenu' : 'anchor');
  const id = useId();
  const [own, setOwn] = useState(defaultOpen);
  const value = open ?? own;
  const [position, setPosition] = useState<{ side?: Side; align?: Align }>({});
  const [rtl, setRtl] = useState(false);
  const [highlighted, setHighlighted] = useState<HTMLElement | null>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const focus = useRef<MenuFocus>('none');
  const latest = useRef(value);
  latest.current = value;
  const side: Side = placement === 'submenu' ? (rtl ? 'left' : 'right') : position.side ?? 'bottom';
  const align: Align = position.align ?? 'start';
  const ref = useRef<MenuContext>(null as unknown as MenuContext);
  const setOpen = (next: boolean, reason: ChangeReason, event?: Event, how: MenuFocus = 'popup') => {
    focus.current = how;
    if (next === latest.current) { if (next) focusIn(); return false; }
    if (next && disabled) return false;
    if (!next) {
      const at = document.activeElement;
      if (reason !== 'focus-out' && reason !== 'outside-press' && at && layer.popupRef.current?.contains(at)) (layer.anchorRef.current as HTMLElement | null)?.focus({ preventScroll: true });
      else if (reason === 'escape-key' && (!at || at === document.body)) (layer.anchorRef.current as HTMLElement | null)?.focus({ preventScroll: true });
      setHighlighted(null);
    }
    latest.current = next;
    onOpenChange?.(next, eventDetails(reason, event));
    if (open === undefined) setOwn(next);
    return true;
  };
  // Script placement is physical: in RTL a start-aligned popup lines up with the anchor's right edge.
  const physical: Align = rtl && placement === 'anchor' ? ({ start: 'end', end: 'start', center: 'center' } as const)[align] : align;
  const layer = useFloatingLayer<HTMLElement, HTMLElement>({
    open: value, side, align: physical, focusOut: placement !== 'submenu', script: placement === 'point',
    inside: () => [hostRef.current], onOpenChange: (o, d) => { setOpen(o, d.reason, d.event); },
  });
  const focusIn = () => {
    const popup = layer.popupRef.current;
    if (!popup) return;
    const items = menuItems(popup), how = focus.current;
    if (how === 'first' || how === 'last') {
      const i = menuNavigate(menuOptionItems(items), -1, how === 'first' ? 'Home' : 'End');
      if (i !== undefined) { items[i].focus({ preventScroll: true }); return; }
    }
    if (how !== 'none') popup.focus({ preventScroll: true });
  };
  // After the floating layer has shown the popup (its effect runs first): move focus in.
  useEffect(() => { if (value) focusIn(); }, [value]);
  useLayoutEffect(() => { if (hostRef.current) setRtl(isRtl(hostRef.current)); }, []);
  useEffect(() => { bar?.report(bar.index, value); }, [value]);
  useEffect(() => { bar?.register(bar.index, { trigger: layer.anchorRef, popup: layer.popupRef, open: value, disabled, setOpen }); });
  const subs = useRef(new Map<string, { trigger: RefObject<HTMLElement | null>; popup: RefObject<HTMLElement | null>; close: (e: Event) => void }>()).current;
  // A submenu: listed with its parent while open; closes (silently) with it.
  useEffect(() => {
    if (!parent) return;
    if (value) parent.subs.set(id, { trigger: layer.anchorRef, popup: layer.popupRef, close: (e) => setOpen(false, 'trigger-hover', e) });
    else parent.subs.delete(id);
    return () => { parent.subs.delete(id); };
  }, [value]);
  useEffect(() => { if (parent && !parent.open && value) { latest.current = false; setHighlighted(null); if (open === undefined) setOwn(false); } }, [parent?.open]);
  const ctx: MenuContext = {
    open: value, setOpen, c: menuRecipe({ placement }), placement, disabled, openOnHover, delay,
    closeTree: (reason, event) => { let m: MenuContext = ref.current; while (m.parent) m = m.parent; m.setOpen(false, reason, event); },
    ids: { trigger: `${id}trigger`, popup: `${id}popup` },
    anchorRef: layer.anchorRef, popupRef: layer.popupRef, popupProps: layer.popupProps, side: layer.side, align,
    setPosition: (p) => setPosition((q) => (q.side === p.side && q.align === p.align ? q : p)),
    highlighted, highlight: (el) => { setHighlighted(el); if (el && document.activeElement !== el) el.focus({ preventScroll: true }); },
    parent, bar, subs,
  };
  ref.current = ctx;
  return (
    <MenuCtx.Provider value={ctx}>
      {renderPart('div', hostClass ?? ctx.c.root, { 'data-ui': ui, 'data-size': size, className, ...rest, ref: hostRef, render, children }, {})}
    </MenuCtx.Provider>
  );
}

export interface MenuTriggerProps extends Omit<HTMLAttributes<HTMLButtonElement>, 'className' | 'prefix'>, PartBase, PartProps {
  children?: ReactNode;
}

/** Menu.Trigger: a native <button> (aria-haspopup=menu, aria-expanded; data-popup-open, data-pressed while open). */
export function MenuTrigger({ leading, prefix, suffix, trailing, children, onClick, onKeyDown, onPointerEnter, onPointerLeave, className, render, ...rest }: MenuTriggerProps) {
  const m = useMenu('Menu.Trigger');
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const inBar = !!m.bar;
  const attrs = props({
    ...menuTriggerAttrs({ open: m.open, popupId: m.ids.popup, disabled: m.disabled, role: inBar ? 'menuitem' : undefined }),
    tabindex: inBar ? (m.bar!.stop === m.bar!.index ? 0 : -1) : undefined,
  });
  const keys = (e: KeyboardEvent<HTMLButtonElement>) => {
    onKeyDown?.(e);
    if (m.disabled || e.defaultPrevented) return;
    const ev = e.nativeEvent;
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); m.open ? m.setOpen(false, 'trigger-press', ev) : m.setOpen(true, 'trigger-press', ev, 'first'); }
    else if (e.key === 'ArrowDown' && !(inBar && m.bar!.orientation === 'vertical')) { e.preventDefault(); m.setOpen(true, 'list-navigation', ev, 'first'); }
    else if (e.key === 'ArrowUp' && !inBar) { e.preventDefault(); m.setOpen(true, 'list-navigation', ev, 'last'); }
  };
  return renderPart('button', m.c.trigger, {
    type: 'button', 'data-part': 'trigger', id: m.ids.trigger, ...attrs, className, ...rest, ref: m.anchorRef,
    onClick: (e: MouseEvent<HTMLButtonElement>) => {
      onClick?.(e);
      if (m.disabled || e.defaultPrevented) return;
      m.open ? m.setOpen(false, 'trigger-press', e.nativeEvent) : m.setOpen(true, 'trigger-press', e.nativeEvent, 'popup');
    },
    onKeyDown: keys,
    onFocus: (e: FocusEvent<HTMLButtonElement>) => { rest.onFocus?.(e); if (inBar) m.bar!.focused(m.bar!.index); },
    onPointerEnter: (e: PointerEvent<HTMLButtonElement>) => {
      onPointerEnter?.(e);
      const hover = m.openOnHover || (inBar && m.bar!.anyOpen);
      if (m.disabled || m.open || !hover) return;
      const ev = e.nativeEvent;
      clearTimeout(timer.current);
      const switching = inBar && m.bar!.anyOpen, el = e.currentTarget;
      // In a menubar with a menu open, hovering another trigger switches to it at once (and focuses it).
      timer.current = setTimeout(() => { m.setOpen(true, 'trigger-hover', ev, 'none'); if (switching) el.focus({ preventScroll: true }); }, switching ? 0 : m.delay);
    },
    onPointerLeave: (e: PointerEvent<HTMLButtonElement>) => { onPointerLeave?.(e); clearTimeout(timer.current); },
    children: <Parts classes={m.c} {...{ leading, prefix, suffix, trailing }}>{children}</Parts>,
    render,
  }, stateOf(attrs));
}

/** Menu.Portal: renders its children in place (the popup reaches the top layer through the popover API). */
export function MenuPortal({ children }: { children?: ReactNode; container?: unknown; keepMounted?: boolean }) {
  return <>{children}</>;
}

export interface MenuPositionerProps {
  /** The preferred side of the trigger (Base UI side): bottom (default) or top. Submenus open at the inline end. */
  side?: Side;
  /** Alignment along that side (Base UI align): start (default), center, end. */
  align?: Align;
  children?: ReactNode;
}

/** Menu.Positioner: renders no element; its side and align place the popup (which carries data-side / data-align). */
export function MenuPositioner({ side, align, children }: MenuPositionerProps) {
  const m = useMenu('Menu.Positioner');
  useLayoutEffect(() => { m.setPosition({ side, align }); }, [side, align]);
  return <>{children}</>;
}

export interface MenuPopupProps extends Omit<HTMLAttributes<HTMLDivElement>, 'className'>, PartBase {
  children?: ReactNode;
}

/** Menu.Popup: role=menu in the top layer; arrow keys, Home, End (wrapping), typeahead, Enter / Space, hover highlight. */
export function MenuPopup({ children, onKeyDown, onPointerMove, onFocus, className, render, ...rest }: MenuPopupProps) {
  const m = useMenu('Menu.Popup');
  const typeahead = useRef(createTypeahead()).current;
  const attrs = props(menuPopupAttrs({ id: m.ids.popup, open: m.open, side: m.side, align: m.align, labelledBy: m.placement === 'point' ? undefined : m.ids.trigger }));
  const popup = () => m.popupRef.current;
  const keys = (e: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e);
    if (e.defaultPrevented || (e.target as Element).closest('[data-part=popup]') !== popup()) return;
    const items = menuItems(popup()), opts = menuOptionItems(items);
    const current = own(popup(), m.highlighted) ? m.highlighted : null, at = current ? items.indexOf(current) : -1;
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) {
      e.preventDefault();
      const i = menuNavigate(opts, at, at < 0 && e.key === 'ArrowUp' ? 'End' : at < 0 && e.key === 'ArrowDown' ? 'Home' : e.key);
      if (i !== undefined) m.highlight(items[i]);
      return;
    }
    const rtl = isRtl(popup()!);
    if (m.parent && e.key === submenuKeys(rtl).close) {
      e.preventDefault();
      const trigger = m.anchorRef.current;
      if (m.setOpen(false, 'list-navigation', e.nativeEvent)) m.parent.highlight(trigger);
      return;
    }
    if ((e.key === 'Enter' || (e.key === ' ' && !typeahead.busy())) && current && current.getAttribute('data-part') !== 'submenu-trigger') {
      e.preventDefault();
      current.click();
      return;
    }
    if (isPrintableKey(e)) {
      const i = typeahead(opts, at, e.key);
      if (i !== undefined) { e.preventDefault(); m.highlight(items[i]); }
    }
  };
  const aim = useRef(createSubmenuAim()).current;
  /** The pointer is on an item: highlight it; a sibling of an open submenu's trigger closes it. */
  const pointAt = (item: HTMLElement, ev: Event) => {
    if (item === m.highlighted) return;
    if (!menuItemDisabled(item)) m.highlight(item);
    for (const sub of [...m.subs.values()]) if (sub.trigger.current !== item) sub.close(ev);
  };
  const pointer = (e: PointerEvent<HTMLDivElement>) => {
    onPointerMove?.(e);
    const subs = [...m.subs.values()];
    // The pointer reached an open submenu.
    if (subs.some((sub) => sub.popup.current?.contains(e.target as Node))) { aim.cancel(); return; }
    const found = (e.target as Element).closest?.('[data-part=item], [data-part=checkbox-item], [data-part=radio-item], [data-part=submenu-trigger]') as HTMLElement | null;
    const item = found && own(popup(), found) ? found : null;
    const ev = e.nativeEvent;
    // Heading for an open submenu across its siblings (the safe triangle): leave everything as it is until the pointer rests.
    const open = subs.find((sub) => sub.trigger.current !== item);
    if (aim.hold(ev, open?.popup.current?.getBoundingClientRect(), () => { if (item) pointAt(item, ev); })) return;
    if (item) pointAt(item, ev);
  };
  const focusin = (e: FocusEvent<HTMLDivElement>) => {
    onFocus?.(e);
    if (e.target === popup()) { m.highlight(null); return; }
    const item = (e.target as Element).closest('[data-part=item], [data-part=checkbox-item], [data-part=radio-item], [data-part=submenu-trigger]') as HTMLElement | null;
    if (item && own(popup(), item)) m.highlight(item);
  };
  return renderPart('div', m.c.popup, {
    'data-part': 'popup', popover: 'manual', ...attrs, className, ...rest, ref: m.popupRef,
    onKeyDown: keys, onPointerMove: pointer, onFocus: focusin, render, children,
  }, stateOf(attrs));
}

interface ItemBaseProps extends Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'prefix'>, PartBase, PartProps {
  /** Ignores presses; skipped by the arrow keys. */
  disabled?: boolean;
  /** Close the menu on a press (Base UI closeOnClick): items default true, checkbox and radio items false. */
  closeOnClick?: boolean;
  children?: ReactNode;
}

/** One item element: role, tabindex -1, classes (item + its kind), data-*, the construction pattern. */
function useItem(kind: MenuItemKind, part: string, { disabled = false, closeOnClick, leading, prefix, suffix, trailing, children, onClick, className, render, ...rest }: ItemBaseProps, extra: { checked?: boolean; press?: (e: Event) => boolean | void } = {}) {
  const m = useMenu(part);
  const ref = useRef<HTMLDivElement>(null);
  const highlighted = !!ref.current && m.highlighted === ref.current;
  const attrs = props(menuItemAttrs(kind, { highlighted, disabled, checked: extra.checked }));
  const closes = closeOnClick ?? (kind === 'item');
  return renderPart('div', `${m.c.item} ${m.c[kind]}`, {
    'data-part': kind, ...attrs, className, ...rest, ref,
    onClick: (e: MouseEvent<HTMLDivElement>) => {
      if (disabled) { e.preventDefault(); return; }
      onClick?.(e);
      if (e.defaultPrevented) return;
      extra.press?.(e.nativeEvent);
      if (closes) m.closeTree('item-press', e.nativeEvent);
    },
    children: <Parts classes={m.c} {...{ leading, prefix, suffix, trailing }}>{children}</Parts>,
    render,
  }, stateOf(attrs));
}

export interface MenuItemProps extends ItemBaseProps {}
/** Menu.Item: role=menuitem; a press (or Enter / Space while highlighted) fires onClick and closes the menu. */
export function MenuItem(p: MenuItemProps) { return useItem('item', 'Menu.Item', p); }

export interface MenuCheckboxItemProps extends ItemBaseProps {
  /** Controlled checked state. */
  checked?: boolean;
  /** Checked at first render (uncontrolled). */
  defaultChecked?: boolean;
  /** Called when a press toggles it, with Base UI's details ({ reason: 'item-press', event }). */
  onCheckedChange?: (checked: boolean, details: ChangeDetails) => void;
}
/** Menu.CheckboxItem: role=menuitemcheckbox, a check indicator in its leading slot (unless `leading` is given); stays open on a press. */
export function MenuCheckboxItem({ checked, defaultChecked = false, onCheckedChange, leading, disabled = false, ...rest }: MenuCheckboxItemProps) {
  const [ownChecked, setOwn] = useState(defaultChecked);
  const value = checked ?? ownChecked;
  const el = useItem('checkbox-item', 'Menu.CheckboxItem', { ...rest, disabled, leading: leading ?? <MenuCheckboxItemIndicator /> }, {
    checked: value,
    press: (e) => { onCheckedChange?.(!value, eventDetails('item-press', e)); if (checked === undefined) setOwn(!value); },
  });
  return <ItemCtx.Provider value={{ checked: value, disabled }}>{el}</ItemCtx.Provider>;
}

export interface MenuIndicatorProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'className'>, PartBase { children?: ReactNode }
function Indicator(part: string, fallback: ReactNode, { children, className, render, ...rest }: MenuIndicatorProps) {
  const m = useMenu(part);
  const item = useContext(ItemCtx);
  if (!item) throw new Error(`<${part}> must be inside its item`);
  const attrs = props(menuIndicatorAttrs(item.checked, item.disabled));
  return renderPart('span', m.c.indicator, { 'data-part': 'indicator', ...attrs, className, ...rest, render, children: children ?? fallback }, stateOf(attrs));
}
/** Menu.CheckboxItemIndicator: the check (kept in place while unchecked, hidden). */
export function MenuCheckboxItemIndicator(p: MenuIndicatorProps) { return Indicator('Menu.CheckboxItemIndicator', <i {...{ name: 'check' }} />, p); }
/** Menu.RadioItemIndicator: the radio dot (drawn by the recipe). */
export function MenuRadioItemIndicator(p: MenuIndicatorProps) { return Indicator('Menu.RadioItemIndicator', undefined, p); }

export interface MenuRadioGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'defaultValue' | 'onChange'>, PartBase {
  value?: string;
  defaultValue?: string;
  /** Called when a press checks another radio item, with Base UI's details ({ reason: 'item-press', event }). */
  onValueChange?: (value: string, details: ChangeDetails) => void;
  children?: ReactNode;
}
/** Menu.RadioGroup: role=group of radio items; owns the checked value. */
export function MenuRadioGroup({ value, defaultValue, onValueChange, children, className, render, ...rest }: MenuRadioGroupProps) {
  const m = useMenu('Menu.RadioGroup');
  const [ownValue, setOwn] = useState(defaultValue);
  const current = value ?? ownValue;
  const label = useContext(GroupCtx);
  const select = (v: string, e: Event) => { if (v === current) return false; onValueChange?.(v, eventDetails('item-press', e)); if (value === undefined) setOwn(v); return true; };
  return (
    <RadioCtx.Provider value={{ value: current, select }}>
      {renderPart('div', m.c['radio-group'], { 'data-part': 'radio-group', ...props(menuGroupAttrs(label)), className, ...rest, render, children }, {})}
    </RadioCtx.Provider>
  );
}

export interface MenuRadioItemProps extends ItemBaseProps {
  /** The value the radio group takes when this item is pressed. */
  value: string;
}
/** Menu.RadioItem: role=menuitemradio in a RadioGroup, a dot indicator in its leading slot; stays open on a press. */
export function MenuRadioItem({ value, leading, disabled = false, ...rest }: MenuRadioItemProps) {
  const g = useContext(RadioCtx);
  if (!g) throw new Error('<Menu.RadioItem> must be inside Menu.RadioGroup');
  const checked = g.value === value;
  const el = useItem('radio-item', 'Menu.RadioItem', { ...rest, disabled, leading: leading ?? <MenuRadioItemIndicator /> }, { checked, press: (e) => g.select(value, e) });
  return <ItemCtx.Provider value={{ checked, disabled }}>{el}</ItemCtx.Provider>;
}

export interface MenuGroupProps extends Omit<HTMLAttributes<HTMLDivElement>, 'className'>, PartBase { children?: ReactNode }
/** Menu.Group: role=group, named by its GroupLabel. */
export function MenuGroup({ children, className, render, ...rest }: MenuGroupProps) {
  const m = useMenu('Menu.Group');
  const id = `${useId()}label`;
  const labelled = hasLabel(children);
  return (
    <GroupCtx.Provider value={id}>
      {renderPart('div', m.c.group, { 'data-part': 'group', ...props(menuGroupAttrs(labelled ? id : undefined)), className, ...rest, render, children }, {})}
    </GroupCtx.Provider>
  );
}
const hasLabel = (children: ReactNode): boolean => ([] as ReactNode[]).concat(children).some((c: any) => c?.type === MenuGroupLabel);

export interface MenuGroupLabelProps extends Omit<HTMLAttributes<HTMLDivElement>, 'className'>, PartBase { children?: ReactNode }
/** Menu.GroupLabel: the group's visible name (its aria-labelledby target). */
export function MenuGroupLabel({ children, className, render, ...rest }: MenuGroupLabelProps) {
  const m = useMenu('Menu.GroupLabel');
  const id = useContext(GroupCtx);
  return renderPart('div', m.c['group-label'], { 'data-part': 'group-label', id, className, ...rest, render, children }, {});
}

export interface MenuSeparatorProps extends Omit<HTMLAttributes<HTMLDivElement>, 'className'>, PartBase {}
/** Menu.Separator: a horizontal rule (role=separator). */
export function MenuSeparator({ className, render, ...rest }: MenuSeparatorProps) {
  const m = useMenu('Menu.Separator');
  const attrs = props(menuSeparatorAttrs());
  return renderPart('div', m.c.separator, { 'data-part': 'separator', ...attrs, className, ...rest, render }, stateOf(attrs));
}

/** Menu.SubmenuRoot: a menu nested in a popup; it opens beside its SubmenuTrigger. */
export function MenuSubmenuRoot(p: Omit<MenuRootProps, 'placement'>) {
  if (!useContext(MenuCtx)) throw new Error('<Menu.SubmenuRoot> must be inside Menu.Popup');
  return <MenuRoot {...p} placement="submenu" />;
}

export interface MenuSubmenuTriggerProps extends ItemBaseProps {}
/** Menu.SubmenuTrigger: role=menuitem (aria-haspopup=menu) with a trailing caret; ArrowRight, Enter, Space, a press or a rest of the pointer open its submenu. */
export function MenuSubmenuTrigger({ disabled: own = false, leading, prefix, suffix, trailing, children, onClick, onKeyDown, onPointerEnter, onPointerLeave, className, render, ...rest }: MenuSubmenuTriggerProps) {
  const m = useMenu('Menu.SubmenuTrigger');
  if (!m.parent) throw new Error('<Menu.SubmenuTrigger> must be inside Menu.SubmenuRoot');
  const disabled = own || m.disabled;
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const highlighted = !!m.anchorRef.current && m.parent.highlighted === m.anchorRef.current;
  const attrs = props(menuItemAttrs('submenu-trigger', { highlighted, disabled, open: m.open, popupId: m.ids.popup }));
  return renderPart('div', `${m.c.item} ${m.c['submenu-trigger']}`, {
    'data-part': 'submenu-trigger', id: m.ids.trigger, ...attrs, className, ...rest, ref: m.anchorRef,
    onClick: (e: MouseEvent<HTMLDivElement>) => { onClick?.(e); if (!disabled && !e.defaultPrevented && !m.open) m.setOpen(true, 'trigger-press', e.nativeEvent, 'none'); },
    onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(e);
      if (disabled || e.defaultPrevented) return;
      const rtl = isRtl(e.currentTarget);
      if (e.key === 'Enter' || e.key === ' ' || e.key === submenuKeys(rtl).open) {
        e.preventDefault();
        m.setOpen(true, e.key.startsWith('Arrow') ? 'list-navigation' : 'trigger-press', e.nativeEvent, 'first');
      }
    },
    onPointerEnter: (e: PointerEvent<HTMLDivElement>) => {
      onPointerEnter?.(e);
      if (disabled || m.open) return;
      const ev = e.nativeEvent;
      clearTimeout(timer.current);
      timer.current = setTimeout(() => m.setOpen(true, 'trigger-hover', ev, 'none'), m.delay);
    },
    onPointerLeave: (e: PointerEvent<HTMLDivElement>) => { onPointerLeave?.(e); clearTimeout(timer.current); },
    children: <Parts classes={m.c} {...{ leading, prefix, suffix }} trailing={trailing === undefined ? <i {...{ name: 'caret-right' }} /> : trailing}>{children}</Parts>,
    render,
  }, stateOf(attrs));
}

export interface MenuProps extends MenuRootProps {
  /** Preset: the trigger's text (with a trailing caret). */
  label?: ReactNode;
  /** Preset: the trigger's leading icon. */
  leading?: ReactNode;
  side?: Side;
  align?: Align;
}

/** Preset: Menu.Root with a Trigger (label, caret), a Positioner and a Popup holding the children; or Root with its parts as children. */
export function Menu({ label, leading, side, align, children, ...rest }: MenuProps) {
  // A menubar's triggers have no caret.
  const inBar = !!useContext(MenubarCtx) && !useContext(MenuCtx);
  if (label === undefined) return <MenuRoot {...rest}>{children}</MenuRoot>;
  return (
    <MenuRoot {...rest}>
      <MenuTrigger leading={leading} trailing={inBar ? undefined : <i {...{ name: 'caret-down' }} />}>{label}</MenuTrigger>
      <MenuPositioner side={side} align={align}><MenuPopup>{children}</MenuPopup></MenuPositioner>
    </MenuRoot>
  );
}
Menu.Root = MenuRoot;
Menu.Trigger = MenuTrigger;
Menu.Portal = MenuPortal;
Menu.Positioner = MenuPositioner;
Menu.Popup = MenuPopup;
Menu.Item = MenuItem;
Menu.CheckboxItem = MenuCheckboxItem;
Menu.CheckboxItemIndicator = MenuCheckboxItemIndicator;
Menu.RadioGroup = MenuRadioGroup;
Menu.RadioItem = MenuRadioItem;
Menu.RadioItemIndicator = MenuRadioItemIndicator;
Menu.Group = MenuGroup;
Menu.GroupLabel = MenuGroupLabel;
Menu.Separator = MenuSeparator;
Menu.SubmenuRoot = MenuSubmenuRoot;
Menu.SubmenuTrigger = MenuSubmenuTrigger;

export type { PartState };
