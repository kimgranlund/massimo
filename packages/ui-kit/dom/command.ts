// Headless command search: filter by label and keywords, keep groups in order, and move the highlight.
import { matchesQuery } from './combobox.ts';

export interface Command { id: string; label: string; keywords?: string; group?: string; shortcut?: string }

export const filterCommands = (commands: Command[], query: string) => commands.filter((c) => matchesQuery(`${c.label} ${c.keywords ?? ''}`, query) || matchesQuery(c.label, query));

/** Commands by group, in first-seen order; the ungrouped come first. */
export function groupCommands(commands: Command[]) {
  const groups = new Map<string, Command[]>();
  for (const c of commands) { const g = c.group ?? ''; groups.set(g, [...(groups.get(g) ?? []), c]); }
  return [...groups.entries()].sort(([a], [b]) => (a === '' ? -1 : b === '' ? 1 : 0)).map(([group, items]) => ({ group, items }));
}
export const moveHighlight = (key: string, index: number, count: number) => (!count ? -1 : key === 'ArrowDown' ? (index + 1) % count : key === 'ArrowUp' ? (index - 1 + count) % count : key === 'Home' ? 0 : key === 'End' ? count - 1 : index);
