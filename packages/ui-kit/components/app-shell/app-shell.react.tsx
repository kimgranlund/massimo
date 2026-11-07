// React AppShell: the ui-app-shell element as <div data-ui="app-shell"> with the same rules.
import type { HTMLAttributes } from 'react';

type Div = HTMLAttributes<HTMLElement>;
export interface AppShellProps extends HTMLAttributes<HTMLDivElement> {
  /** editor lays the body out as start, main and end panes. */
  variant?: 'default' | 'editor';
}
export const AppHeader = (props: Div) => <header {...props} data-part="header" />;
export const AppBody = (props: Div) => <div {...props} data-part="body" />;
export const AppFooter = (props: Div) => <footer {...props} data-part="footer" />;
export const AppStart = (props: Div) => <aside {...props} data-part="start" />;
export const AppMain = (props: Div) => <main {...props} data-part="main" />;
export const AppEnd = (props: Div) => <aside {...props} data-part="end" />;
/** React AppShell (ui-app-shell): AppHeader, AppBody and AppFooter. */
export function AppShell({ variant, ...rest }: AppShellProps) {
  return <div {...rest} data-ui="app-shell" {...(variant ? { variant } : {})} />;
}
