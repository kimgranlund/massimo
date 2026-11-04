// React <Tabs>: the anatomy, classes and data-* of <ui-tabs>, as Base UI Tabs' compound parts.
// Tabs.Root holds the active value (value / defaultValue / onValueChange(value, details), the
// first tab's value by default), orientation and the variant (segmented | underline);
// Tabs.List is the tablist (roving focus: arrow keys, Home, End; activateOnFocus); Tabs.Tab a
// native <button role=tab> in the construction pattern; Tabs.Indicator a span placed by Base UI's
// --active-tab-* variables, measured from the active tab after layout and on resize (none in server
// markup); Tabs.Panel a tabpanel, hidden while inactive. The preset <Tabs items={[…]}> is Root +
// List (a Tab per item, the Indicator) + a Panel per item.
import { Children, createContext, isValidElement, useContext, useId, useLayoutEffect, useRef, useState, type CSSProperties, type HTMLAttributes, type KeyboardEvent, type MouseEvent, type ReactNode } from 'react';
import { renderPart, stateOf, type PartBase, type PartState } from '../compound.react.tsx';
import { eventDetails, type ChangeDetails } from '../../dom/events.ts';
import { Parts, type PartProps } from '../parts.react.tsx';
import { tabs as tabsRecipe } from '../../styled-system/recipes/tabs.js';
import { activeTabVars } from './indicator.ts';

const on = (v: unknown) => (v ? '' : undefined);
const slug = (v: string) => v.replace(/[^\w-]/g, '_');
export type ActivationDirection = 'left' | 'right' | 'up' | 'down' | 'none';

export interface TabsRootProps extends Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'onChange' | 'defaultValue'>, PartBase {
  /** Controlled active tab value. */
  value?: string;
  /** Active tab at first render (uncontrolled); default: the first enabled tab's value. */
  defaultValue?: string;
  /** Called when a press or a key activates another tab, with Base UI's details ({ reason: 'none', event }). */
  onValueChange?: (value: string, details: ChangeDetails) => void;
  orientation?: 'horizontal' | 'vertical';
  /** segmented (default): a composite with a raised indicator; underline: a bar on a thin track. */
  variant?: 'segmented' | 'underline';
  /** Unit u in px; tab rows are 8u (segmented tabs 7u inside the 8u list). */
  size?: number;
  children?: ReactNode;
}

interface TabsContext {
  value: string | undefined;
  select: (value: string, event: Event, el: Element) => void;
  orientation: 'horizontal' | 'vertical';
  dir: ActivationDirection;
  c: Record<string, string>;
  ids: (kind: 'tab' | 'panel', value: string) => string;
  shared: Record<string, string>;
  state: PartState;
}
const Ctx = createContext<TabsContext | null>(null);
const ListCtx = createContext<{ activateOnFocus: boolean }>({ activateOnFocus: false });
const IndexCtx = createContext(-1);
const useTabs = (part: string) => {
  const v = useContext(Ctx);
  if (!v) throw new Error(`<${part}> must be inside Tabs.Root`);
  return v;
};

/** The first enabled Tabs.Tab's value in a tree of children (the default active tab). */
function firstTab(children: ReactNode): string | undefined {
  for (const n of Children.toArray(children)) {
    if (!isValidElement(n)) continue;
    const p = n.props as { value?: string; disabled?: boolean; children?: ReactNode };
    if (n.type === TabsTab && !p.disabled) return p.value;
    const inner = firstTab(p.children);
    if (inner !== undefined) return inner;
  }
  return undefined;
}

/** Tabs.Root: the host; shares the active value with the list, tabs, indicator and panels. */
export function TabsRoot({ value, defaultValue, onValueChange, orientation = 'horizontal', variant = 'segmented', size, children, className, render, ...rest }: TabsRootProps) {
  const id = useId();
  const [own, setOwn] = useState(() => defaultValue ?? firstTab(children));
  const [dir, setDir] = useState<ActivationDirection>('none');
  const active = value ?? own;
  const c = tabsRecipe({ variant });
  const ids = (kind: 'tab' | 'panel', v: string) => `${id}${kind}-${slug(v)}`;
  const select = (v: string, event: Event, el: Element) => {
    if (v === active) return;
    const tabs = [...(el.closest('[role=tablist]')?.querySelectorAll('[role=tab]') ?? [])];
    const from = tabs.findIndex((t) => t.id === (active !== undefined ? ids('tab', active) : '')), to = tabs.indexOf(el);
    const vertical = orientation === 'vertical';
    setDir(from < 0 ? 'none' : to > from ? (vertical ? 'down' : 'right') : (vertical ? 'up' : 'left'));
    onValueChange?.(v, eventDetails('none', event));
    if (value === undefined) setOwn(v);
  };
  const shared = { 'data-orientation': orientation, 'data-activation-direction': dir };
  const state = stateOf(shared);
  // Panels learn their index (data-index) from their place among the Root's children.
  let i = 0;
  const kids = Children.map(children, (child) => isValidElement(child) && child.type === TabsPanel ? <IndexCtx.Provider value={i++}>{child}</IndexCtx.Provider> : child);
  return (
    <Ctx.Provider value={{ value: active, select, orientation, dir, c, ids, shared, state }}>
      {renderPart('div', c.root, { 'data-ui': 'tabs', 'data-size': size, ...shared, className, ...rest, render, children: kids }, state)}
    </Ctx.Provider>
  );
}

export interface TabsListProps extends Omit<HTMLAttributes<HTMLDivElement>, 'className'>, PartBase {
  /** Focusing a tab with the arrow keys also activates it (automatic activation). */
  activateOnFocus?: boolean;
  /** Arrow keys wrap from the last tab to the first (default true). */
  loopFocus?: boolean;
  /** Accessible name of the tablist. */
  label?: string;
  children?: ReactNode;
}

/** Tabs.List: the tablist; arrow keys (mirrored in RTL), Home and End move focus between enabled tabs. */
export function TabsList({ activateOnFocus = false, loopFocus = true, label, onKeyDown, className, render, ...rest }: TabsListProps) {
  const f = useTabs('Tabs.List');
  const keys = (e: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e);
    const list = e.currentTarget, t = (e.target as Element).closest('[role=tab]') as HTMLElement | null;
    if (!t || t.parentElement !== list) return;
    const vertical = f.orientation === 'vertical', rtl = !vertical && getComputedStyle(list).direction === 'rtl';
    const step = ({ ArrowRight: vertical ? 0 : rtl ? -1 : 1, ArrowLeft: vertical ? 0 : rtl ? 1 : -1, ArrowDown: vertical ? 1 : 0, ArrowUp: vertical ? -1 : 0 } as Record<string, number>)[e.key];
    const enabled = [...list.querySelectorAll<HTMLElement>(':scope > [role=tab]')].filter((b) => !b.hasAttribute('data-disabled'));
    const at = enabled.indexOf(t), n = enabled.length;
    let to = step ? at + step : e.key === 'Home' ? 0 : e.key === 'End' ? n - 1 : -1;
    if (step) to = loopFocus ? (to + n) % n : Math.max(0, Math.min(n - 1, to));
    if (to < 0 || !n) return;
    e.preventDefault();
    enabled[to].focus();
    if (activateOnFocus) enabled[to].click();
  };
  return (
    <ListCtx.Provider value={{ activateOnFocus }}>
      {renderPart('div', f.c.list, { 'data-part': 'list', role: 'tablist', 'aria-orientation': f.orientation, 'aria-label': label, ...f.shared, className, ...rest, onKeyDown: keys, render }, f.state)}
    </ListCtx.Provider>
  );
}

export interface TabsTabProps extends Omit<HTMLAttributes<HTMLButtonElement>, 'className' | 'prefix'>, PartBase, PartProps {
  /** The tab's value (its panel has the same value). */
  value: string;
  disabled?: boolean;
  children?: ReactNode;
}

/** Tabs.Tab: a native <button role=tab> (aria-selected, aria-controls; the active tab is the tab stop). */
export function TabsTab({ value, disabled, leading, prefix, suffix, trailing, children, onClick, className, render, ...rest }: TabsTabProps) {
  const f = useTabs('Tabs.Tab');
  const active = f.value === value;
  const attrs = { 'data-active': on(active), 'data-disabled': on(disabled), ...f.shared };
  return renderPart('button', f.c.tab, {
    type: 'button', role: 'tab', id: f.ids('tab', value), 'aria-selected': active, 'aria-controls': f.ids('panel', value),
    tabIndex: active ? 0 : -1, 'aria-disabled': disabled ? true : undefined, ...attrs, className, ...rest,
    onClick: (e: MouseEvent<HTMLButtonElement>) => { onClick?.(e); if (!disabled && !e.defaultPrevented) f.select(value, e.nativeEvent, e.currentTarget); },
    children: <Parts classes={f.c} {...{ leading, prefix, suffix, trailing }}>{children}</Parts>,
    render,
  }, stateOf(attrs));
}

export interface TabsIndicatorProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'className'>, PartBase {}

/** Tabs.Indicator: a span placed by --active-tab-left / -top / -right / -bottom / -width / -height (px, from the active tab). */
export function TabsIndicator({ style, className, render, ...rest }: TabsIndicatorProps) {
  const f = useTabs('Tabs.Indicator');
  const ref = useRef<HTMLSpanElement>(null);
  const [box, setBox] = useState<Record<string, string>>({});
  useLayoutEffect(() => {
    const el = ref.current, list = el?.parentElement;
    if (!el || !list) return;
    const place = () => {
      setBox(activeTabVars(list, list.querySelector(':scope > [role=tab][aria-selected=true]')) ?? {});
    };
    place();
    if (typeof ResizeObserver !== 'function') return;
    const ro = new ResizeObserver(place);
    ro.observe(list);
    return () => ro.disconnect();
  }, [f.value, f.orientation]);
  return renderPart('span', f.c.indicator, {
    'data-part': 'indicator', 'aria-hidden': true, ...f.shared, className, ...rest, ref, style: { ...box, ...style } as CSSProperties, render,
  }, f.state);
}

export interface TabsPanelProps extends Omit<HTMLAttributes<HTMLDivElement>, 'className'>, PartBase {
  /** The value of the tab that shows this panel. */
  value: string;
  children?: ReactNode;
}

/** Tabs.Panel: a tabpanel (tabindex 0), hidden while its tab is not active (data-hidden). */
export function TabsPanel({ value, className, render, ...rest }: TabsPanelProps) {
  const f = useTabs('Tabs.Panel');
  const index = useContext(IndexCtx);
  const hidden = f.value !== value;
  const attrs = { 'data-hidden': on(hidden), ...f.shared };
  return renderPart('div', f.c.panel, {
    role: 'tabpanel', id: f.ids('panel', value), 'aria-labelledby': f.ids('tab', value), tabIndex: 0, hidden,
    'data-part': 'panel', ...attrs, 'data-index': index >= 0 ? index : undefined, className, ...rest, render,
  }, stateOf(attrs));
}

export interface TabsItem extends PartProps {
  value: string;
  label: ReactNode;
  disabled?: boolean;
  /** The panel's content. */
  content?: ReactNode;
}

export interface TabsProps extends TabsRootProps {
  /** Preset: a tab and a panel per item. */
  items?: TabsItem[];
  /** The tablist's accessible name. */
  label?: string;
  activateOnFocus?: boolean;
}

/** Preset: Tabs.Root with a List (a Tab per item and the Indicator) and a Panel per item; or Root with its parts as children. */
export function Tabs({ items, label, activateOnFocus, children, ...rest }: TabsProps) {
  if (!items) return <TabsRoot {...rest}>{children}</TabsRoot>;
  return (
    <TabsRoot {...rest}>
      <TabsList label={label} activateOnFocus={activateOnFocus}>
        {items.map(({ value, label: text, disabled, leading, prefix, suffix, trailing }) => <TabsTab key={value} {...{ value, disabled, leading, prefix, suffix, trailing }}>{text}</TabsTab>)}
        <TabsIndicator />
      </TabsList>
      {items.map((it) => <TabsPanel key={it.value} value={it.value}>{it.content}</TabsPanel>)}
    </TabsRoot>
  );
}
Tabs.Root = TabsRoot;
Tabs.List = TabsList;
Tabs.Tab = TabsTab;
Tabs.Indicator = TabsIndicator;
Tabs.Panel = TabsPanel;

