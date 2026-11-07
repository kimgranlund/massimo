// React Pane: the ui-pane element as <div data-ui="pane"> with the same global rules.
import type { HTMLAttributes } from 'react';

type Div = HTMLAttributes<HTMLDivElement>;
export const PaneHeader = (props: Div) => <div {...props} data-part="header" />;
export const PaneFooter = (props: Div) => <div {...props} data-part="footer" />;
/** The scrolling body. It's a tab stop, so a keyboard can scroll it. */
export const PaneBody = (props: Div) => <div tabIndex={0} {...props} data-part="body" />;
/** React Pane (ui-pane): one PaneBody, with an optional PaneHeader before it and PaneFooter after it. */
export function Pane(props: Div) { return <div {...props} data-ui="pane" />; }
