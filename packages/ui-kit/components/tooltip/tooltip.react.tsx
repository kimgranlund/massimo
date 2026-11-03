// React <Tooltip>: the anatomy, classes and data-* of <ui-tooltip>, as Base UI Tooltip's compound
// parts (Provider, Root, Trigger, Positioner, Popup, Arrow) on the popover's shared parts
// (popover.react.tsx: usePopupRoot, PopupTrigger, PopupPositioner,
// PopupPopup, PopupArrow) with the tooltip recipe and behavior: hover (delay 600 ms) and keyboard
// focus open it, a press on the trigger, blur, an outside press or Escape close it; role=tooltip,
// the trigger's aria-describedby names it, focus never moves. Tooltip.Provider sets delay,
// closeDelay and the warm-group timeout for the Roots inside it. The preset
// <Tooltip content="Bold"><Button aria-label="Bold">…</Button></Tooltip> renders its child as the trigger.
import { createContext, isValidElement, useContext, type ReactElement, type ReactNode } from 'react';
import { isWarm, markClosed, WARM_TIMEOUT, type Align, type Side } from '../../dom/index.ts';
import { Button } from '../button/button.react.tsx';
import { PopupArrow, PopupPopup, PopupPositioner, PopupRootElement, PopupTrigger, usePopupRoot, type PopupKind, type PopupRootProps } from '../popover/popover.react.tsx';
import { tooltip } from '../../styled-system/recipes/tooltip.js';

export interface TooltipProviderProps {
  /** Hover: open after the pointer rests this long on a trigger, ms (default 600). */
  delay?: number;
  /** Hover: close this long after the pointer leaves, ms (default 0). */
  closeDelay?: number;
  /** A tooltip opened within this long after another closed opens at once, ms (default 400). */
  timeout?: number;
  children?: ReactNode;
}
const ProviderCtx = createContext<Omit<TooltipProviderProps, 'children'>>({});

/** Tooltip.Provider: shared delays for the tooltips inside it (renders no element). */
export function TooltipProvider({ children, ...value }: TooltipProviderProps) {
  return <ProviderCtx.Provider value={value}>{children}</ProviderCtx.Provider>;
}

const kindOf = (timeout = WARM_TIMEOUT): PopupKind => ({
  ui: 'tooltip', recipe: () => tooltip(), side: 'top', align: 'center', delay: 600, closeDelay: 0,
  press: false, focus: true, moveFocus: false, pressCloses: true, role: 'tooltip', trigger: Button,
  warm: () => isWarm(timeout), onClosed: markClosed,
});
const KIND = kindOf();

/** Tooltip.Root: the host; shares the open state with its parts. */
export function TooltipRoot(props: PopupRootProps) {
  const p = useContext(ProviderCtx);
  const kind = p.timeout === undefined ? KIND : kindOf(p.timeout);
  const r = usePopupRoot(kind, { ...props, delay: props.delay ?? p.delay, closeDelay: props.closeDelay ?? p.closeDelay, hover: true });
  return <PopupRootElement {...r} {...props} />;
}

export interface TooltipProps extends Omit<PopupRootProps, 'content'> {
  /** The popup's text. */
  content?: ReactNode;
  /** Preferred side and alignment (Tooltip.Positioner); default top, center. */
  side?: Side;
  align?: Align;
  /** The trigger: one element (rendered as Tooltip.Trigger), or text for a kit Button. */
  children?: ReactNode;
}

/** Preset: Tooltip.Root with its child as the Trigger and a Positioner › Popup holding the content. */
export function Tooltip({ content, side, align, children, ...rest }: TooltipProps) {
  const el = isValidElement(children) ? children as ReactElement : undefined;
  return (
    <TooltipRoot {...rest}>
      {el ? <PopupTrigger render={el} /> : <PopupTrigger>{children}</PopupTrigger>}
      <PopupPositioner side={side} align={align}><PopupPopup>{content}</PopupPopup></PopupPositioner>
    </TooltipRoot>
  );
}
Tooltip.Provider = TooltipProvider;
Tooltip.Root = TooltipRoot;
Tooltip.Trigger = PopupTrigger;
Tooltip.Positioner = PopupPositioner;
Tooltip.Popup = PopupPopup;
Tooltip.Arrow = PopupArrow;
