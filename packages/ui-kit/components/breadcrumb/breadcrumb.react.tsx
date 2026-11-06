// React <Breadcrumb>: the web component's trail, as a <nav> with an ordered list. Children are the
// crumbs, root first. The last is the current page, and maxItems folds the middle behind an ellipsis.
import { Children, cloneElement, isValidElement, useEffect, useRef, useState, type HTMLAttributes, type KeyboardEvent, type ReactElement, type ReactNode } from 'react';
import { pressKey, visibleCrumbs } from '../../dom/breadcrumb.ts';
import { breadcrumb } from '../../styled-system/recipes/breadcrumb.js';

export interface BreadcrumbProps extends HTMLAttributes<HTMLElement> {
  /** The accessible name of the navigation. Default "Breadcrumb". */
  label?: string;
  /** Show at most this many crumbs: the root, the ellipsis's folded middle and the last ones. */
  maxItems?: number;
  /** Unit u in px for this element. */
  size?: number;
  children?: ReactNode;
}

export function Breadcrumb({ label = 'Breadcrumb', maxItems = 0, size, className, children, ...rest }: BreadcrumbProps) {
  const crumbs = Children.toArray(children).filter(isValidElement) as ReactElement<Record<string, unknown>>[];
  const [expanded, setExpanded] = useState(false);
  const list = useRef<HTMLOListElement>(null);
  const c = breadcrumb();
  const { shown, folded } = visibleCrumbs(crumbs.length, maxItems, expanded);
  const expand = () => setExpanded(true);
  useEffect(() => { if (expanded) (list.current?.querySelectorAll('[data-part=link]')[1] as HTMLElement | undefined)?.focus(); }, [expanded]);
  const separator = <span data-part="separator" aria-hidden="true" className={c.separator}><i {...{ name: 'caret-right' }} /></span>;
  return (
    <nav {...rest} aria-label={label} data-ui="breadcrumb" data-size={size} className={[c.root, className].filter(Boolean).join(' ')}>
      <ol ref={list} data-part="list" className={c.list}>
        {shown.map((i, at) => {
          const crumb = crumbs[i], own = crumb.props.className as string | undefined;
          return [
            <li key={i} data-part="item" className={c.item}>
              {at > 0 && separator}
              {cloneElement(crumb, { 'data-part': 'link', className: [c.link, own].filter(Boolean).join(' '), 'aria-current': i === crumbs.length - 1 ? 'page' : undefined })}
            </li>,
            folded && at === 0 && (
              <li key="ellipsis" data-part="item" className={c.item}>
                {separator}
                <span data-part="ellipsis" role="button" tabIndex={0} aria-label="Show all crumbs" className={c.ellipsis} onClick={expand}
                  onKeyDown={(e: KeyboardEvent) => { if (pressKey(e.key)) { e.preventDefault(); expand(); } }}>…</span>
              </li>
            ),
          ];
        })}
      </ol>
    </nav>
  );
}
