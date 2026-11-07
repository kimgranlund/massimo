// React <Sidebar>: the same landmark, sections and rail as <ui-sidebar>.
import { useState, type HTMLAttributes, type ReactNode } from 'react';
import { Button } from '../button/button.react.tsx';
import { sidebar } from '../../styled-system/recipes/sidebar.js';

export interface SidebarProps extends HTMLAttributes<HTMLElement> {
  label?: string;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  children?: ReactNode;
}

export function Sidebar({ label = 'Main', defaultCollapsed = false, onCollapsedChange, className, children, ...rest }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed), c = sidebar();
  return (
    <nav {...rest} aria-label={label} data-ui="sidebar" data-collapsed={collapsed ? '' : undefined} className={[c.root, className].filter(Boolean).join(' ')}>
      <span data-part="toggle" className={c.toggle}>
        <Button variant="ghost" aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-expanded={!collapsed} leading={<i {...{ name: 'sidebar-simple' }} />} onClick={() => { setCollapsed(!collapsed); onCollapsedChange?.(!collapsed); }} />
      </span>
      {children}
    </nav>
  );
}
