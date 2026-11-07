// React <TreeView>: the same rows and keys as <ui-tree-view>.
import { useEffect, useRef, useState, type CSSProperties, type HTMLAttributes, type KeyboardEvent, type MouseEvent } from 'react';
import { treeKey, visibleRows, type TreeItem } from '../../dom/tree.ts';
import { treeView } from '../../styled-system/recipes/tree-view.js';

export interface TreeViewProps extends Omit<HTMLAttributes<HTMLDivElement>, 'onChange' | 'defaultValue'> {
  label: string;
  items: TreeItem[];
  defaultValue?: string;
  onValueChange?: (id: string) => void;
}

export function TreeView({ label, items, defaultValue = '', onValueChange, className, ...rest }: TreeViewProps) {
  const [value, setValue] = useState(defaultValue), [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set()), [focused, setFocused] = useState('');
  const host = useRef<HTMLDivElement>(null), moved = useRef(false), c = treeView();
  const rows = visibleRows(items, expanded), focus = focused || value || rows[0]?.item.id;
  useEffect(() => { if (moved.current) { (host.current?.querySelector('[tabindex="0"]') as HTMLElement | null)?.focus(); moved.current = false; } });
  const toggle = (id: string, open: boolean) => { const next = new Set(expanded); if (open) next.add(id); else next.delete(id); setExpanded(next); };
  const select = (id: string) => { setValue(id); onValueChange?.(id); };
  const onKey = (e: KeyboardEvent, id: string) => {
    const a = treeKey(e.key, rows, id, getComputedStyle(e.currentTarget).direction === 'rtl');
    if (!a) return;
    e.preventDefault();
    if ('focus' in a) { moved.current = true; setFocused(a.focus); } else if ('expand' in a) toggle(a.expand, true); else if ('collapse' in a) toggle(a.collapse, false); else select(a.select);
  };
  return (
    <div {...rest} ref={host} role="tree" aria-label={label} data-ui="tree-view" className={[c.root, className].filter(Boolean).join(' ')}>
      {rows.map((r) => (
        <div key={r.item.id} role="treeitem" data-part="row" data-id={r.item.id} aria-level={r.level} aria-posinset={r.posinset} aria-setsize={r.setsize} aria-selected={r.item.id === value} aria-expanded={r.branch ? r.expanded : undefined}
          tabIndex={r.item.id === focus ? 0 : -1} style={{ '--ui-level': r.level } as CSSProperties} className={c.row} onKeyDown={(e) => onKey(e, r.item.id)}
          onClick={(e: MouseEvent) => { setFocused(r.item.id); if ((e.target as HTMLElement).closest('[data-part=caret]') && r.branch) toggle(r.item.id, !r.expanded); else select(r.item.id); }}>
          <span data-part="caret" aria-hidden="true" className={c.caret}>{r.branch && <i {...{ name: 'caret-right' }} />}</span>
          <span data-part="label" className={c.label}>{r.item.label}</span>
        </div>
      ))}
    </div>
  );
}
