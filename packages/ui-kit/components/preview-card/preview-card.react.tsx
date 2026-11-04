// React <PreviewCard>: the anatomy, classes and data-* of <ui-preview-card>, as Base UI Preview
// Card's compound parts (Root, Trigger, Positioner, Popup, Arrow) on the popover's shared parts
// (popover.react.tsx: usePopupRoot, PopupTrigger, PopupPositioner, PopupPopup, PopupArrow) with the
// preview-card recipe and behavior: hover intent (delay 600 ms, closeDelay 300 ms) and keyboard
// focus open it; leaving, focus leaving both, an outside press or Escape close it; a press follows
// the link. PreviewCard.Trigger renders an <a> (pass href). The preset
// <PreviewCard trigger={<a href="…">Ada</a>}>card</PreviewCard> renders its trigger element as the Trigger.
import { isValidElement, type ReactElement, type ReactNode } from 'react';
import type { Align, Side } from '../../dom/floating.ts';
import { PopupArrow, PopupPopup, PopupPositioner, PopupRootElement, PopupTrigger, usePopupRoot, type PopupKind, type PopupRootProps } from '../popover/popover.react.tsx';
import { previewCard } from '../../styled-system/recipes/preview-card.js';

const KIND: PopupKind = {
  ui: 'preview-card', recipe: () => previewCard(), side: 'bottom', align: 'center', delay: 600, closeDelay: 300,
  press: false, focus: true, moveFocus: false, pressCloses: false, trigger: 'a',
};

/** PreviewCard.Root: the host; shares the open state with its parts. */
export function PreviewCardRoot(props: PopupRootProps) {
  const r = usePopupRoot(KIND, { ...props, hover: true });
  return <PopupRootElement {...r} {...props} />;
}

export interface PreviewCardProps extends PopupRootProps {
  /** The link: an element (rendered as PreviewCard.Trigger), or text for an <a> with `href`. */
  trigger?: ReactNode;
  /** The link's destination when `trigger` is text. */
  href?: string;
  /** Preferred side and alignment (PreviewCard.Positioner); default bottom, center. */
  side?: Side;
  align?: Align;
  /** The card's content. */
  children?: ReactNode;
}

/** Preset: PreviewCard.Root with the trigger link and a Positioner › Popup holding the children. */
export function PreviewCard({ trigger, href, side, align, children, ...rest }: PreviewCardProps) {
  const el = isValidElement(trigger) ? trigger as ReactElement : undefined;
  return (
    <PreviewCardRoot {...rest}>
      {el ? <PopupTrigger render={el} /> : <PopupTrigger href={href}>{trigger}</PopupTrigger>}
      <PopupPositioner side={side} align={align}><PopupPopup>{children}</PopupPopup></PopupPositioner>
    </PreviewCardRoot>
  );
}
PreviewCard.Root = PreviewCardRoot;
PreviewCard.Trigger = PopupTrigger;
PreviewCard.Positioner = PopupPositioner;
PreviewCard.Popup = PopupPopup;
PreviewCard.Arrow = PopupArrow;
