// React AdminShell: the same panes and fit as <ui-admin-shell>, on dom/shell.ts. toggle and close are
// on the ref.
import { useEffect, useImperativeHandle, useRef, type HTMLAttributes, type Ref } from 'react';
import { attachPanes, type PaneMode, type Side } from '../../dom/shell.ts';
import { adminShell } from '../../styled-system/recipes/admin-shell.js';

export interface AdminShellHandle { toggle(side: Side, opener?: HTMLElement | null): void; close(destination?: HTMLElement | null): void }
export interface AdminShellProps extends HTMLAttributes<HTMLDivElement> {
  startClosed?: boolean;
  endClosed?: boolean;
  onPaneChange?: (detail: { start: PaneMode; end: PaneMode }) => void;
  ref?: Ref<AdminShellHandle>;
}
type Div = HTMLAttributes<HTMLElement>;
export const AdminStart = (props: Div) => <aside {...props} data-part="start" />;
export const AdminEnd = (props: Div) => <aside {...props} data-part="end" />;
export const AdminToolbar = (props: Div) => <div {...props} data-part="toolbar" />;
export const AdminContent = (props: Div) => <main {...props} data-part="content" />;
export const AdminFooter = (props: Div) => <footer {...props} data-part="footer" />;

export function AdminShell({ startClosed = false, endClosed = false, onPaneChange, className, children, ref, ...rest }: AdminShellProps) {
  const host = useRef<HTMLDivElement>(null), panes = useRef<ReturnType<typeof attachPanes> | null>(null);
  const live = useRef({ startClosed, endClosed, onPaneChange });
  live.current = { startClosed, endClosed, onPaneChange };
  useEffect(() => {
    panes.current = attachPanes(host.current!, { prefs: () => ({ start: !live.current.startClosed, end: !live.current.endClosed }), onChange: (d) => live.current.onPaneChange?.(d) });
    return () => panes.current?.stop();
  }, []);
  useEffect(() => { panes.current?.sync(); }, [startClosed, endClosed]);
  useImperativeHandle(ref, () => ({ toggle: (s, o) => panes.current?.toggle(s, o), close: (d) => panes.current?.close(d) }), []);
  return (
    <div {...rest} ref={host} data-ui="admin-shell" className={[adminShell().root, className].filter(Boolean).join(' ')}>
      {children}
      <div data-part="scrim" aria-hidden="true" />
    </div>
  );
}
