// Headless tree: the visible rows of a hierarchy, and what each key does. Focus, selection and
// expansion are separate: moving focus never selects.
export interface TreeItem { id: string; label: string; children?: TreeItem[] }
export interface TreeRow { item: TreeItem; level: number; parent?: string; branch: boolean; expanded: boolean; posinset: number; setsize: number }

export function visibleRows(items: TreeItem[], expanded: ReadonlySet<string>, level = 1, parent?: string): TreeRow[] {
  return items.flatMap((item, i) => {
    const branch = !!item.children?.length, open = branch && expanded.has(item.id);
    const row: TreeRow = { item, level, parent, branch, expanded: open, posinset: i + 1, setsize: items.length };
    return [row, ...(open ? visibleRows(item.children!, expanded, level + 1, item.id) : [])];
  });
}

export type TreeAction = { focus: string } | { expand: string } | { collapse: string } | { select: string } | null;

export function treeKey(key: string, rows: TreeRow[], id: string, rtl = false): TreeAction {
  const i = rows.findIndex((r) => r.item.id === id), row = rows[i];
  if (!row) return null;
  const inward = rtl ? 'ArrowLeft' : 'ArrowRight', outward = rtl ? 'ArrowRight' : 'ArrowLeft';
  switch (key) {
    case 'ArrowDown': return rows[i + 1] ? { focus: rows[i + 1].item.id } : null;
    case 'ArrowUp': return rows[i - 1] ? { focus: rows[i - 1].item.id } : null;
    case 'Home': return { focus: rows[0].item.id };
    case 'End': return { focus: rows[rows.length - 1].item.id };
    case 'Enter': case ' ': return { select: id };
    case inward: return row.branch ? (row.expanded ? { focus: rows[i + 1].item.id } : { expand: id }) : null;
    case outward: return row.expanded ? { collapse: id } : row.parent ? { focus: row.parent } : null;
    default: return null;
  }
}
