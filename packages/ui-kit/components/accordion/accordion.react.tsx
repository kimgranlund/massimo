// React <Accordion>: the anatomy, classes and data-* of <ui-accordion>, as Base UI Accordion's
// compound parts over the Collapsible ones. Accordion.Root holds the open values (value /
// defaultValue / onValueChange(value[], details), multiple, disabled, orientation) and moves focus
// between the triggers with the arrow keys, Home and End. Accordion.Item is a collapsible host
// (data-ui=collapsible, the collapsible and accordion item classes); Accordion.Header a heading
// (role=heading, aria-level 3, like the web component's header part); Accordion.Trigger and
// Accordion.Panel are Collapsible.Trigger and Collapsible.Panel with the item's attributes (the
// panel is a region labelled by its trigger). An Item with a `label` is a preset item: Header,
// Trigger (the label) and Panel (its children). `Accordion` is Accordion.Root.
import { Children, createContext, isValidElement, useContext, useId, useState, type HTMLAttributes, type KeyboardEvent, type ReactNode } from 'react';
import { renderPart, stateOf, type PartBase } from '../compound.react.tsx';
import { cx } from '../../styled-system/css/cx.js';
import { eventDetails, type ChangeDetails } from '../../dom/index.ts';
import type { PartProps } from '../parts.react.tsx';
import { accordion } from '../../styled-system/recipes/accordion.js';
import { collapsible } from '../../styled-system/recipes/collapsible.js';
import { CollapsibleCtx, CollapsiblePanel, CollapsibleTrigger, rootAttrs, type CollapsiblePanelProps, type CollapsibleTriggerProps } from '../collapsible/collapsible.react.tsx';

const on = (v: unknown) => (v ? '' : undefined);

export interface AccordionRootProps extends Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'onChange' | 'defaultValue'>, PartBase {
  /** Controlled open item values. */
  value?: string[];
  /** Open item values at first render (uncontrolled). */
  defaultValue?: string[];
  /** Called when a trigger press changes the open items, with Base UI's details ({ reason: 'trigger-press', event }). */
  onValueChange?: (value: string[], details: ChangeDetails) => void;
  /** Several items may be open at once (default: opening one closes the others). */
  multiple?: boolean;
  /** Every item ignores presses. */
  disabled?: boolean;
  /** vertical (default): Up / Down move focus; horizontal: Left / Right. */
  orientation?: 'vertical' | 'horizontal';
  /** Unit u in px; each trigger row is 8u. */
  size?: number;
  children?: ReactNode;
}

interface AccordionContext {
  values: string[];
  toggle: (value: string, open: boolean, event: Event) => boolean;
  disabled: boolean;
  orientation: 'vertical' | 'horizontal';
  c: Record<string, string>;
}
const Ctx = createContext<AccordionContext | null>(null);
const IndexCtx = createContext(-1);
const useAccordion = (part: string) => {
  const v = useContext(Ctx);
  if (!v) throw new Error(`<${part}> must be inside Accordion.Root`);
  return v;
};

/** Accordion.Root: the host; shares the open values with its items. */
export function AccordionRoot({ value, defaultValue = [], onValueChange, multiple = false, disabled = false, orientation = 'vertical', size, children, onKeyDown, className, render, ...rest }: AccordionRootProps) {
  const [own, setOwn] = useState<string[]>(() => (multiple ? defaultValue : defaultValue.slice(0, 1)));
  const values = value ?? own;
  const toggle = (v: string, open: boolean, event: Event) => {
    const cur = values.filter((x) => x !== v);
    const next = open ? (multiple ? [...cur, v] : [v]) : cur;
    onValueChange?.(next, eventDetails('trigger-press', event));
    if (value === undefined) setOwn(next);
    return true;
  };
  const c = accordion();
  const attrs = { 'data-orientation': orientation, 'data-disabled': on(disabled) };
  // Items learn their index (data-index; the default value) from their place among the Root's children.
  let i = 0;
  const items = Children.map(children, (child) => isValidElement(child) && child.type === AccordionItem ? <IndexCtx.Provider value={i++}>{child}</IndexCtx.Provider> : child);
  const keys = (e: KeyboardEvent<HTMLDivElement>) => {
    onKeyDown?.(e);
    const root = e.currentTarget, t = (e.target as Element).closest('[data-part=trigger]');
    if (!t || t.closest('[data-ui=accordion]') !== root) return;
    const triggers = [...root.querySelectorAll<HTMLElement>(':scope > [data-part=item] > [data-part=header] > [data-part=trigger]')].filter((b) => !b.hasAttribute('data-disabled'));
    const horizontal = orientation === 'horizontal', rtl = horizontal && getComputedStyle(root).direction === 'rtl';
    const step = ({ ArrowDown: horizontal ? 0 : 1, ArrowUp: horizontal ? 0 : -1, ArrowRight: horizontal ? (rtl ? -1 : 1) : 0, ArrowLeft: horizontal ? (rtl ? 1 : -1) : 0 } as Record<string, number>)[e.key];
    const at = triggers.indexOf(t as HTMLElement);
    const to = step ? (at + step + triggers.length) % triggers.length : e.key === 'Home' ? 0 : e.key === 'End' ? triggers.length - 1 : -1;
    if (to < 0 || !triggers.length) return;
    e.preventDefault();
    triggers[to].focus();
  };
  return (
    <Ctx.Provider value={{ values, toggle, disabled, orientation, c }}>
      {renderPart('div', c.root, { 'data-ui': 'accordion', 'data-size': size, ...attrs, className, ...rest, onKeyDown: keys, render, children: items }, stateOf(attrs))}
    </Ctx.Provider>
  );
}

export interface AccordionItemProps extends Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'prefix'>, PartBase, PartProps {
  /** The item's value in the Root's value list; defaults to its index. */
  value?: string;
  /** Ignores presses on this item's trigger. */
  disabled?: boolean;
  /** Called when this item's trigger is pressed. */
  onOpenChange?: (open: boolean, details: ChangeDetails) => void;
  /** Preset item: the trigger's label (the children become the panel). */
  label?: ReactNode;
  children?: ReactNode;
}

/** Accordion.Item: a collapsible whose open state is the Root's. */
export function AccordionItem({ value, disabled, onOpenChange, label, leading, prefix, suffix, trailing, children, className, render, ...rest }: AccordionItemProps) {
  const a = useAccordion('Accordion.Item');
  const index = useContext(IndexCtx);
  const id = useId();
  const v = value ?? String(index);
  const open = a.values.includes(v), off = !!(disabled || a.disabled);
  const c = collapsible();
  const attrs = { ...rootAttrs(open, off), 'data-index': index >= 0 ? index : undefined };
  const state = stateOf(rootAttrs(open, off));
  const toggle = (event: Event) => {
    if (off) return;
    onOpenChange?.(!open, eventDetails('trigger-press', event));
    a.toggle(v, !open, event);
  };
  const ids = { trigger: `${id}trigger`, panel: `${id}panel` };
  const item = { 'data-index': attrs['data-index'] };
  const extra = {
    trigger: item,
    panel: { role: 'region', 'aria-labelledby': ids.trigger, 'data-orientation': a.orientation, 'data-disabled': on(off), ...item },
  };
  const body = label !== undefined
    ? <><AccordionHeader><AccordionTrigger {...{ leading, prefix, suffix }} {...(trailing !== undefined ? { trailing } : {})}>{label}</AccordionTrigger></AccordionHeader><AccordionPanel>{children}</AccordionPanel></>
    : children;
  return (
    <CollapsibleCtx.Provider value={{ c, open, disabled: off, state, ids, toggle, extra }}>
      {renderPart('div', cx(c.root, a.c.item), { 'data-ui': 'collapsible', 'data-part': 'item', ...attrs, className, ...rest, render, children: body }, state)}
    </CollapsibleCtx.Provider>
  );
}

export interface AccordionHeaderProps extends Omit<HTMLAttributes<HTMLDivElement>, 'className'>, PartBase {
  children?: ReactNode;
}

/** Accordion.Header: the heading around the trigger (role=heading, aria-level 3). */
export function AccordionHeader({ className, render, ...rest }: AccordionHeaderProps) {
  const a = useAccordion('Accordion.Header');
  const f = useContext(CollapsibleCtx)!;
  const index = useContext(IndexCtx);
  return renderPart('div', a.c.header, {
    'data-part': 'header', role: 'heading', 'aria-level': 3, 'data-open': on(f.open), 'data-disabled': on(f.disabled), 'data-index': index >= 0 ? index : undefined, className, ...rest, render,
  }, f.state);
}

/** Accordion.Trigger: Collapsible.Trigger inside an item's header. */
export function AccordionTrigger(props: CollapsibleTriggerProps) {
  useAccordion('Accordion.Trigger');
  return <CollapsibleTrigger {...props} />;
}

/** Accordion.Panel: Collapsible.Panel, a region labelled by its trigger. */
export function AccordionPanel(props: CollapsiblePanelProps) {
  useAccordion('Accordion.Panel');
  return <CollapsiblePanel {...props} />;
}

/** The accordion: Accordion.Root (items are its children; an Item with a label is a preset item). */
export function Accordion(props: AccordionRootProps) {
  return <AccordionRoot {...props} />;
}
Accordion.Root = AccordionRoot;
Accordion.Item = AccordionItem;
Accordion.Header = AccordionHeader;
Accordion.Trigger = AccordionTrigger;
Accordion.Panel = AccordionPanel;
