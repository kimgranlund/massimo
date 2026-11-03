// React <ContextMenu>: the anatomy, classes and data-* of <ui-context-menu>, as Base UI ContextMenu's
// compound parts. ContextMenu.Root is Menu.Root placed at a point (data-ui="context-menu");
// ContextMenu.Trigger is the area (a div): contextmenu, a long press (touch, 500 ms), Shift+F10 or the
// ContextMenu key open the popup at the pointer (or the focused element's start corner). The popup,
// items, groups, separators and submenus are Menu's parts, re-exported here (ContextMenu.Popup,
// ContextMenu.Item, …). The preset <ContextMenu label="…">items</ContextMenu> is Root + Trigger (the
// label) + Positioner + Popup.
import { useRef, type HTMLAttributes, type KeyboardEvent, type MouseEvent, type PointerEvent, type ReactNode } from 'react';
import { renderPart, stateOf, type PartBase } from '../compound.react.tsx';
import { pointAnchor, toReactProps } from '../../dom/index.ts';
import {
  MenuRoot, MenuPortal, MenuPositioner, MenuPopup, MenuItem, MenuCheckboxItem, MenuCheckboxItemIndicator, MenuRadioGroup, MenuRadioItem,
  MenuRadioItemIndicator, MenuGroup, MenuGroupLabel, MenuSeparator, MenuSubmenuRoot, MenuSubmenuTrigger, useMenuContext, type MenuRootProps,
} from '../menu/menu.react.tsx';
import { contextMenu } from '../../styled-system/recipes/context-menu.js';

const on = (v: unknown) => (v ? '' : undefined);
/** The long press that opens the menu on touch, in ms (Base UI: 500). */
const LONG_PRESS = 500;

export interface ContextMenuRootProps extends Omit<MenuRootProps, 'placement' | 'ui' | 'hostClass' | 'openOnHover'> {}

/** ContextMenu.Root: Menu.Root with the popup placed at a point; the host is div[data-ui=context-menu]. */
export function ContextMenuRoot(p: ContextMenuRootProps) {
  return <MenuRoot {...p} placement="point" ui="context-menu" hostClass={contextMenu().root} />;
}

export interface ContextMenuTriggerProps extends Omit<HTMLAttributes<HTMLDivElement>, 'className'>, PartBase {
  children?: ReactNode;
}

/** ContextMenu.Trigger: the area that opens the menu (data-popup-open while open, data-disabled). */
export function ContextMenuTrigger({ children, onContextMenu, onPointerDown, onPointerUp, onPointerCancel, onPointerMove, onKeyDown, className, render, ...rest }: ContextMenuTriggerProps) {
  const m = useMenuContext('ContextMenu.Trigger');
  const ref = useRef<HTMLDivElement>(null);
  const press = useRef<{ timer?: ReturnType<typeof setTimeout>; x: number; y: number }>({ x: 0, y: 0 });
  const openAt = (x: number, y: number, event: Event, focus: 'first' | 'popup' = 'popup') => {
    if (m.disabled) return;
    m.anchorRef.current = pointAnchor(x, y, () => ref.current);
    // Open already: the script positioner follows window resize, so a resize places it at the new point.
    if (m.open) window.dispatchEvent(new Event('resize'));
    else m.setOpen(true, 'trigger-press', event, focus);
  };
  const cancel = () => clearTimeout(press.current.timer);
  const attrs = { 'data-popup-open': on(m.open), 'data-disabled': on(m.disabled) };
  return renderPart('div', contextMenu().trigger, {
    'data-part': 'trigger', ...toReactProps(attrs), className, ...rest, ref,
    onContextMenu: (e: MouseEvent<HTMLDivElement>) => { onContextMenu?.(e); if (m.disabled || e.defaultPrevented) return; e.preventDefault(); openAt(e.clientX, e.clientY, e.nativeEvent); },
    onPointerDown: (e: PointerEvent<HTMLDivElement>) => {
      onPointerDown?.(e);
      if (e.pointerType !== 'touch' || m.disabled) return;
      cancel();
      const ev = e.nativeEvent;
      press.current = { x: e.clientX, y: e.clientY, timer: setTimeout(() => openAt(press.current.x, press.current.y, ev), LONG_PRESS) };
    },
    onPointerUp: (e: PointerEvent<HTMLDivElement>) => { onPointerUp?.(e); cancel(); },
    onPointerCancel: (e: PointerEvent<HTMLDivElement>) => { onPointerCancel?.(e); cancel(); },
    onPointerMove: (e: PointerEvent<HTMLDivElement>) => { onPointerMove?.(e); if (Math.hypot(e.clientX - press.current.x, e.clientY - press.current.y) > 10) cancel(); },
    onKeyDown: (e: KeyboardEvent<HTMLDivElement>) => {
      onKeyDown?.(e);
      if (m.disabled || e.defaultPrevented || !((e.key === 'F10' && e.shiftKey) || e.key === 'ContextMenu')) return;
      e.preventDefault();
      const r = (e.target as Element).getBoundingClientRect();
      openAt(r.left, r.bottom, e.nativeEvent, 'first');
    },
    children, render,
  }, stateOf(attrs));
}

export interface ContextMenuProps extends ContextMenuRootProps {
  /** Preset: the area's content (text or nodes). */
  label?: ReactNode;
}

/** Preset: ContextMenu.Root with a Trigger (the label), a Positioner and a Popup holding the children; or Root with its parts as children. */
export function ContextMenu({ label, children, ...rest }: ContextMenuProps) {
  if (label === undefined) return <ContextMenuRoot {...rest}>{children}</ContextMenuRoot>;
  return (
    <ContextMenuRoot {...rest}>
      <ContextMenuTrigger>{label}</ContextMenuTrigger>
      <MenuPositioner><MenuPopup>{children}</MenuPopup></MenuPositioner>
    </ContextMenuRoot>
  );
}
ContextMenu.Root = ContextMenuRoot;
ContextMenu.Trigger = ContextMenuTrigger;
ContextMenu.Portal = MenuPortal;
ContextMenu.Positioner = MenuPositioner;
ContextMenu.Popup = MenuPopup;
ContextMenu.Item = MenuItem;
ContextMenu.CheckboxItem = MenuCheckboxItem;
ContextMenu.CheckboxItemIndicator = MenuCheckboxItemIndicator;
ContextMenu.RadioGroup = MenuRadioGroup;
ContextMenu.RadioItem = MenuRadioItem;
ContextMenu.RadioItemIndicator = MenuRadioItemIndicator;
ContextMenu.Group = MenuGroup;
ContextMenu.GroupLabel = MenuGroupLabel;
ContextMenu.Separator = MenuSeparator;
ContextMenu.SubmenuRoot = MenuSubmenuRoot;
ContextMenu.SubmenuTrigger = MenuSubmenuTrigger;
