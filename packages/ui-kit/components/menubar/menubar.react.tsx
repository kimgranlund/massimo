// React <Menubar>: the anatomy, classes and data-* of <ui-menubar> (Base UI Menubar). Its children
// are Menu.Root (or Menu preset) elements; their triggers become the bar's items (role=menuitem) with
// a roving tab stop; ArrowRight / ArrowLeft (mirrored in RTL; ArrowDown / ArrowUp when vertical),
// Home and End move between them; ArrowDown (ArrowRight when vertical) opens a menu on its first
// item, ArrowUp on its last; inside an open menu ArrowRight / ArrowLeft switch menus, and hovering
// another trigger opens it. One menu is open at a time (the others close with reason sibling-open).
import { Children, isValidElement, useRef, useState, type HTMLAttributes, type KeyboardEvent, type ReactNode } from 'react';
import { renderPart, stateOf, type PartBase } from '../compound.react.tsx';
import { isRtl } from '../../dom/menu.ts';
import { menubarAttrs, menubarKeyIntent, menubarStep } from '../../dom/menubar.ts';
import { toReactProps } from '../../dom/attrs.ts';
import { Menu, MenuRoot, MenubarCtx, type MenubarEntry } from '../menu/menu.react.tsx';
import { menubar } from '../../styled-system/recipes/menubar.js';

export interface MenubarProps extends Omit<HTMLAttributes<HTMLDivElement>, 'className'>, PartBase {
  /** horizontal (default) or vertical: the bar's direction, its keys and where its menus open. */
  orientation?: 'horizontal' | 'vertical';
  /** Accessible name of the bar. */
  label?: string;
  /** Unit u in px; the bar is 8u, its triggers 7u. */
  size?: number;
  children?: ReactNode;
}

const isMenu = (n: ReactNode) => isValidElement(n) && (n.type === MenuRoot || n.type === Menu);

/** Menubar: a div[role=menubar] (data-ui="menubar") whose Menu children share one tab stop and switch on arrows and hover. */
export function Menubar({ orientation = 'horizontal', label, size, children, onKeyDown, className, render, ...rest }: MenubarProps) {
  const kids = Children.toArray(children);
  const menus = kids.filter(isMenu) as { props: { disabled?: boolean } }[];
  const [stop, setStop] = useState(() => Math.max(0, menus.findIndex((m) => !m.props.disabled)));
  const [open, setOpen] = useState<number[]>([]);
  const entries = useRef(new Map<number, MenubarEntry>()).current;
  const report = (i: number, isOpen: boolean) => {
    setOpen((o) => (isOpen ? (o.includes(i) ? o : [...o, i]) : o.filter((k) => k !== i)));
    if (isOpen) for (const [j, e] of entries) if (j !== i && e.open) e.setOpen(false, 'sibling-open');
  };
  const keys = (e: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e);
    if (e.defaultPrevented) return;
    const target = e.target as Element, list = [...entries.entries()].sort(([a], [b]) => a - b).map(([, v]) => v);
    let i = list.findIndex((m) => m.trigger.current === target), inPopup = false;
    if (i < 0) { i = list.findIndex((m) => !!m.popup.current?.contains(target)); inPopup = true; }
    if (i < 0) return;
    const intent = menubarKeyIntent(e.key, { orientation, rtl: isRtl(e.currentTarget), inPopup });
    if (!intent) return;
    e.preventDefault();
    const ev = e.nativeEvent;
    if (intent === 'open-first' || intent === 'open-last') {
      if (!list[i].disabled) list[i].setOpen(true, 'list-navigation', ev, intent === 'open-first' ? 'first' : 'last');
      return;
    }
    const j = menubarStep(list.map((m) => m.disabled), i, intent);
    if (j < 0) return;
    const wasOpen = list.some((m) => m.open);
    if (wasOpen && j !== i) list[i].setOpen(false, 'sibling-open', ev);
    setStop(j);
    list[j].trigger.current?.focus({ preventScroll: true });
    if (wasOpen && j !== i) list[j].setOpen(true, 'list-navigation', ev, 'first');
  };
  const anyOpen = open.length > 0;
  const attrs = toReactProps(menubarAttrs({ orientation, open: anyOpen, label })) as Record<string, any>;
  let index = 0;
  const wrapped = kids.map((child) => {
    if (!isMenu(child)) return child;
    const i = index++;
    return (
      <MenubarCtx.Provider key={(child as any).key ?? i} value={{ index: i, stop, anyOpen, orientation, report, focused: setStop, register: (k, e) => { entries.set(k, e); } }}>
        {child}
      </MenubarCtx.Provider>
    );
  });
  return renderPart('div', menubar({ orientation }).root, {
    'data-ui': 'menubar', 'data-size': size, ...attrs, className, ...rest, onKeyDown: keys, render, children: wrapped,
  }, stateOf(attrs));
}
