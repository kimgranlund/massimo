// React <Collapsible>: the anatomy, classes and data-* of <ui-collapsible>, as Base UI Collapsible's
// compound parts. Collapsible.Root holds the open state (open / defaultOpen / onOpenChange(open,
// details)); Collapsible.Trigger is a native <button> in the construction pattern with a trailing
// caret (pass `trailing={null}` for none); Collapsible.Panel stays mounted and is `hidden` while
// closed, so the recipe animates its height in CSS. The preset <Collapsible label …>content</…> is
// Root + Trigger (the label) + Panel (the children).
import { createContext, useContext, useId, useState, type HTMLAttributes, type MouseEvent, type ReactNode } from 'react';
import { renderPart, stateOf, type PartBase, type PartState } from '../compound.react.tsx';
import { buttonAttrs } from '../../dom/button.ts';
import { eventDetails, type ChangeDetails } from '../../dom/events.ts';
import { toReactProps } from '../../dom/attrs.ts';
import { Parts, type PartProps } from '../parts.react.tsx';
import { collapsible } from '../../styled-system/recipes/collapsible.js';

const on = (v: unknown) => (v ? '' : undefined);

export interface CollapsibleRootProps extends Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'onChange' | 'prefix'>, PartBase {
  /** Controlled open state. */
  open?: boolean;
  /** Open at first render (uncontrolled). */
  defaultOpen?: boolean;
  /** Called when the trigger is pressed, with Base UI's details ({ reason: 'trigger-press', event }). */
  onOpenChange?: (open: boolean, details: ChangeDetails) => void;
  /** Ignores presses on the trigger. */
  disabled?: boolean;
  /** Unit u in px; the trigger row is 8u. */
  size?: number;
  children?: ReactNode;
}

export interface CollapsibleContext {
  c: Record<string, string>;
  open: boolean;
  disabled: boolean;
  state: PartState;
  ids: { trigger: string; panel: string };
  toggle: (event: Event) => void;
  /** Extra attributes for each part (an accordion item adds data-index, the panel's role, …). */
  extra?: { trigger?: Record<string, unknown>; panel?: Record<string, unknown> };
}
export const CollapsibleCtx = createContext<CollapsibleContext | null>(null);
const useCollapsible = (part: string) => {
  const v = useContext(CollapsibleCtx);
  if (!v) throw new Error(`<${part}> must be inside Collapsible.Root`);
  return v;
};

/** The open state of a collapsible: controlled by `open`, else its own (from defaultOpen). */
export function useOpenState(open: boolean | undefined, defaultOpen = false, onOpenChange?: (open: boolean, details: ChangeDetails) => void, disabled = false) {
  const [own, setOwn] = useState(defaultOpen);
  const value = open ?? own;
  const toggle = (event: Event) => {
    if (disabled) return;
    onOpenChange?.(!value, eventDetails('trigger-press', event));
    if (open === undefined) setOwn(!value);
  };
  return [value, toggle] as const;
}

/** The host attributes of a collapsible (Base UI Collapsible.Root: data-open / data-closed, data-disabled). */
export const rootAttrs = (open: boolean, disabled: boolean) => ({ 'data-open': on(open), 'data-closed': on(!open), 'data-disabled': on(disabled) });

/** Collapsible.Root: the host; shares the open state with its Trigger and Panel. */
export function CollapsibleRoot({ open, defaultOpen, onOpenChange, disabled = false, size, children, className, render, ...rest }: CollapsibleRootProps) {
  const id = useId();
  const [value, toggle] = useOpenState(open, defaultOpen, onOpenChange, disabled);
  const c = collapsible();
  const attrs = rootAttrs(value, disabled);
  const state = stateOf(attrs);
  return (
    <CollapsibleCtx.Provider value={{ c, open: value, disabled, state, ids: { trigger: `${id}trigger`, panel: `${id}panel` }, toggle }}>
      {renderPart('div', c.root, { 'data-ui': 'collapsible', 'data-size': size, ...attrs, className, ...rest, render, children }, state)}
    </CollapsibleCtx.Provider>
  );
}

export interface CollapsibleTriggerProps extends Omit<HTMLAttributes<HTMLButtonElement>, 'className' | 'prefix'>, PartBase, PartProps {
  children?: ReactNode;
}

/** Collapsible.Trigger: a native <button> (aria-expanded, aria-controls), the construction pattern, a caret in trailing. */
export function CollapsibleTrigger({ leading, prefix, suffix, trailing = <i name="caret-down" />, children, onClick, className, render, ...rest }: CollapsibleTriggerProps) {
  const f = useCollapsible('Collapsible.Trigger');
  return renderPart('button', f.c.trigger, {
    type: 'button', 'data-part': 'trigger', id: f.ids.trigger, className,
    ...toReactProps(buttonAttrs({ native: true, disabled: f.disabled })),
    'aria-expanded': f.open, 'aria-controls': f.ids.panel, 'data-panel-open': on(f.open), ...f.extra?.trigger, ...rest,
    onClick: (e: MouseEvent<HTMLButtonElement>) => { onClick?.(e); if (!e.defaultPrevented) f.toggle(e.nativeEvent); },
    children: <Parts classes={f.c} {...{ leading, prefix, suffix, trailing }}>{children}</Parts>,
    render,
  }, { ...f.state, panelOpen: f.open });
}

export interface CollapsiblePanelProps extends Omit<HTMLAttributes<HTMLDivElement>, 'className'>, PartBase {
  children?: ReactNode;
}

/** Collapsible.Panel: always mounted; hidden while closed (data-open / data-closed). */
export function CollapsiblePanel({ className, render, ...rest }: CollapsiblePanelProps) {
  const f = useCollapsible('Collapsible.Panel');
  return renderPart('div', f.c.panel, {
    'data-part': 'panel', id: f.ids.panel, hidden: !f.open, 'data-open': on(f.open), 'data-closed': on(!f.open), ...f.extra?.panel, className, ...rest, render,
  }, f.state);
}

export interface CollapsibleProps extends CollapsibleRootProps, PartProps {
  /** The trigger's label. */
  label?: ReactNode;
}

/** Preset: Collapsible.Root with a Trigger (the label and its adornments) and a Panel (the children). */
export function Collapsible({ label, leading, prefix, suffix, trailing, children, ...rest }: CollapsibleProps) {
  return (
    <CollapsibleRoot {...rest}>
      <CollapsibleTrigger {...{ leading, prefix, suffix }} {...(trailing !== undefined ? { trailing } : {})}>{label}</CollapsibleTrigger>
      <CollapsiblePanel>{children}</CollapsiblePanel>
    </CollapsibleRoot>
  );
}
Collapsible.Root = CollapsibleRoot;
Collapsible.Trigger = CollapsibleTrigger;
Collapsible.Panel = CollapsiblePanel;
