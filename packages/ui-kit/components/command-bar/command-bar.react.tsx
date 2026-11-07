// React <CommandBar>: the same search and results as <ui-command-bar>, on Dialog and Input.
import { useState, type KeyboardEvent } from 'react';
import { Dialog } from '../dialog/dialog.react.tsx';
import { Input } from '../input/input.react.tsx';
import { Kbd } from '../kbd/kbd.react.tsx';
import { filterCommands, groupCommands, moveHighlight, type Command } from '../../dom/command.ts';
import { commandBar } from '../../styled-system/recipes/command-bar.js';

export interface CommandBarProps {
  label?: string;
  open: boolean;
  commands: Command[];
  onOpenChange: (open: boolean) => void;
  onSelect: (command: Command) => void;
}

export function CommandBar({ label = 'Commands', open, commands, onOpenChange, onSelect }: CommandBarProps) {
  const [query, setQuery] = useState(''), [active, setActive] = useState(0), c = commandBar();
  const groups = groupCommands(filterCommands(commands, query)), items = groups.flatMap((g) => g.items);
  const close = () => { setQuery(''); setActive(0); onOpenChange(false); };
  const choose = (command?: Command) => { if (command) { close(); onSelect(command); } };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); choose(items[active]); } else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) { e.preventDefault(); setActive(moveHighlight(e.key, active, items.length)); }
  };
  let index = -1;
  return (
    <Dialog label={label} open={open} onOpenChange={(o: boolean) => { if (o) onOpenChange(true); else close(); }}>
      <Input label="Search commands" hideLabel placeholder="Search commands" value={query} onValueChange={(v: string) => { setQuery(v); setActive(0); }} onKeyDown={onKey} />
      <div data-part="list" role="listbox" aria-label={label} className={c.list}>
        {groups.map(({ group, items: rows }) => [
          group && <div key={group} data-part="group" role="presentation" className={c.group}>{group}</div>,
          ...rows.map((item) => { index++; const i = index; return (
            <div key={item.id} data-part="item" role="option" data-id={item.id} aria-selected={i === active} className={c.item} onClick={() => choose(item)}>
              <span>{item.label}</span>{item.shortcut && <Kbd keys={item.shortcut} />}
            </div>
          ); }),
        ])}
        {!items.length && <div data-part="empty" className={c.empty}>No matching commands</div>}
      </div>
    </Dialog>
  );
}
