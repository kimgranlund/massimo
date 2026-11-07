// React FloatingPanel: the same parts and placement as <ui-floating-panel>, on dom/drag.ts. Control it
// with open and collapsed, or the ref's snap.
import { useEffect, useImperativeHandle, useRef, useState, type HTMLAttributes, type ReactNode, type Ref } from 'react';
import { attachPanel, type Anchor } from '../../dom/drag.ts';
import { resolveFloatingPanel } from '../../tokens/geometry/resolve.ts';
import { Button } from '../button/button.react.tsx';
import { floatingPanel } from '../../styled-system/recipes/floating-panel.js';

export interface FloatingPanelHandle { snap(anchor: Anchor): void }
export interface FloatingPanelProps extends Omit<HTMLAttributes<HTMLDivElement>, 'title'> {
  label: string;
  title?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  ref?: Ref<FloatingPanelHandle>;
}
const unitOf = (el: HTMLElement) => parseFloat(getComputedStyle(el).scrollPaddingTop) || 4;

export function FloatingPanel({ label, title, open = false, onOpenChange, defaultCollapsed = false, onCollapsedChange, className, children, ref, ...rest }: FloatingPanelProps) {
  const host = useRef<HTMLDivElement>(null), panel = useRef<ReturnType<typeof attachPanel> | null>(null), [collapsed, setCollapsed] = useState(defaultCollapsed), c = floatingPanel();
  useEffect(() => {
    const el = host.current!;
    panel.current = attachPanel(el, () => { const g = resolveFloatingPanel({ unit: unitOf(el) }); return { margin: g.margin, step: g.step, min: g.min }; });
    return () => panel.current?.stop();
  }, []);
  useEffect(() => {
    const el = host.current as (HTMLDivElement & { showPopover?(): void; hidePopover?(): void }) | null;
    try { if (open) el?.showPopover?.(); else el?.hidePopover?.(); } catch { /* already there */ }
  }, [open]);
  useImperativeHandle(ref, () => ({ snap: (a) => panel.current?.snap(a) }), []);
  const flip = () => { setCollapsed(!collapsed); onCollapsedChange?.(!collapsed); };
  return (
    <div {...rest} ref={host} role="region" aria-label={label} popover="manual" data-ui="floating-panel" data-open={open ? '' : undefined} data-collapsed={collapsed ? '' : undefined} className={[c.root, className].filter(Boolean).join(' ')}>
      <div data-part="header" tabIndex={0} className={c.header}>
        {title ?? label}
        <span data-part="controls" className={c.controls}>
          <Button variant="ghost" aria-label={collapsed ? 'Expand' : 'Collapse'} aria-expanded={!collapsed} onClick={flip} leading={<i name="caret-up" />} />
          <Button variant="ghost" aria-label="Close" onClick={() => onOpenChange?.(false)} leading={<i name="x" />} />
        </span>
      </div>
      <div data-part="body" hidden={collapsed} className={c.body}>{children}</div>
      <span data-part="grip" aria-hidden="true" className={c.grip} />
    </div>
  );
}
