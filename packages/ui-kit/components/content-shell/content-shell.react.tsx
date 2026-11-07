// React ContentShell: the ui-content-shell element as <div data-ui="content-shell"> with the same rules.
import type { HTMLAttributes } from 'react';
import type { PageWidth } from '../../tokens/geometry/resolve.ts';

type Div = HTMLAttributes<HTMLElement>;
export interface ContentShellProps extends HTMLAttributes<HTMLDivElement> {
  /** The body's limit: readable 160u, wide 320u, full 335u. Default wide. */
  width?: PageWidth;
}
export const ContentSidebar = (props: Div) => <nav {...props} data-part="sidebar" />;
export const ContentMain = (props: Div) => <main tabIndex={-1} {...props} data-part="main" />;
export const ContentHeader = (props: Div) => <header {...props} data-part="header" />;
export const ContentBody = (props: Div) => <div {...props} data-part="body" />;
export const ContentFooter = (props: Div) => <footer {...props} data-part="footer" />;
/** React ContentShell (ui-content-shell): ContentSidebar and ContentMain, with header, body and footer in the main. */
export function ContentShell({ width, ...rest }: ContentShellProps) {
  return <div {...rest} data-ui="content-shell" {...(width ? { width } : {})} />;
}
