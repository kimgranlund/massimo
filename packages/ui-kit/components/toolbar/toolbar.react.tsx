// React <Toolbar>: a named command strip with roving focus, like <ui-toolbar>. Children that don't fit
// hide, and a Menu runs them.
import { Children, cloneElement, isValidElement, useEffect, useRef, useState, type HTMLAttributes, type ReactElement, type ReactNode } from 'react';
import { attachRoving, fitCount } from '../../dom/toolbar.ts';
import { Menu } from '../menu/menu.react.tsx';
import { toolbar } from '../../styled-system/recipes/toolbar.js';

export interface ToolbarProps extends HTMLAttributes<HTMLDivElement> {
  label: string;
  orientation?: 'horizontal' | 'vertical';
  children?: ReactNode;
}

export function Toolbar({ label, orientation = 'horizontal', className, children, ...rest }: ToolbarProps) {
  const host = useRef<HTMLDivElement>(null), moreWidth = useRef(40), [count, setCount] = useState(Infinity), [fits, setFits] = useState(0);
  const items = Children.toArray(children).filter(isValidElement) as ReactElement<Record<string, unknown>>[];
  useEffect(() => {
    const el = host.current!, roving = attachRoving(el, () => orientation === 'vertical');
    roving.sync();
    const fit = () => {
      if (orientation === 'vertical') return;
      const kids = ([...el.children] as HTMLElement[]).filter((c) => !c.hasAttribute('data-part'));
      kids.forEach((k) => { k.hidden = false; });
      const cs = getComputedStyle(el);
      setCount(fitCount(kids.map((k) => k.getBoundingClientRect().width), el.clientWidth - 2 * (parseFloat(cs.paddingInlineStart) || 0), parseFloat(cs.columnGap) || 0, moreWidth.current));
    };
    const size = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(() => requestAnimationFrame(fit)) : undefined;
    size?.observe(el);
    return () => { roving.stop(); size?.disconnect(); };
  }, [orientation, fits]);
  // The More menu's width is only known once it's drawn: fit again if the guess was short.
  useEffect(() => {
    const w = host.current?.querySelector('[data-part=more]')?.getBoundingClientRect().width ?? 0;
    if (w > moreWidth.current + 0.5) { moreWidth.current = w; setFits(fits + 1); }
  }, [count]);
  const hidden = items.slice(count);
  return (
    <div {...rest} ref={host} role="toolbar" aria-label={label} aria-orientation={orientation} data-orientation={orientation} data-ui="toolbar" className={[toolbar().root, className].filter(Boolean).join(' ')}>
      {items.map((item, i) => cloneElement(item, { key: i, hidden: i >= count || undefined }))}
      {hidden.length > 0 && <span data-part="more"><Menu label="More">{hidden.map((item, i) => <Menu.Item key={i} onClick={item.props.onClick as never}>{(item.props['aria-label'] as ReactNode) ?? (item.props.children as ReactNode)}</Menu.Item>)}</Menu></span>}
    </div>
  );
}
