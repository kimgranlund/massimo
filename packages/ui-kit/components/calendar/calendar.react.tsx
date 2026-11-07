// React <Calendar>: the same grid, keys and parts as <ui-calendar>.
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Button } from '../button/button.react.tsx';
import { addMonths, calendarCells, calendarKey, inBounds, monthLabel, orderRange, parseIso, todayIso, weekdays, weekStart } from '../../dom/calendar.ts';
import { calendar } from '../../styled-system/recipes/calendar.js';

export interface CalendarProps {
  value?: string;
  defaultValue?: string;
  min?: string;
  max?: string;
  locale?: string;
  mode?: 'single' | 'range';
  label?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

export function Calendar({ value, defaultValue = '', min, max, locale, mode = 'single', label = 'Choose a date', onValueChange, className }: CalendarProps) {
  const [own, setOwn] = useState(defaultValue), v = value ?? own;
  const [a = '', b = ''] = mode === 'range' ? v.split('/') : [];
  const [focusDate, setFocus] = useState(''), anchor = useRef('');
  const focus = focusDate || a || (parseIso(v) ? v : '') || todayIso();
  const start = weekStart(locale), c = calendar(), grid = useRef<HTMLDivElement>(null), moved = useRef(false);
  useEffect(() => { if (moved.current) { (grid.current?.querySelector('[tabindex="0"]') as HTMLElement | null)?.focus(); moved.current = false; } });
  const set = (next: string) => { setOwn(next); onValueChange?.(next); };
  const pick = (iso: string) => {
    if (!inBounds(iso, min, max)) return;
    setFocus(iso);
    if (mode !== 'range') return set(iso);
    if (anchor.current) { const [s, t] = orderRange(anchor.current, iso); anchor.current = ''; set(`${s}/${t}`); } else { anchor.current = iso; setOwn(`${iso}/`); }
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(focus); return; }
    const next = calendarKey(e.key, focus, start, e.shiftKey, getComputedStyle(e.currentTarget).direction === 'rtl');
    if (next) { e.preventDefault(); moved.current = true; setFocus(next); }
  };
  const weeks = calendarCells({ focus, start, value: mode === 'single' ? v : undefined, rangeStart: a, rangeEnd: b, min, max, today: todayIso(), locale });
  return (
    <div data-ui="calendar" className={[c.root, className].filter(Boolean).join(' ')}>
      <div data-part="header" className={c.header}>
        <Button variant="ghost" aria-label="Previous month" onClick={() => setFocus(addMonths(focus, -1))} leading={<i {...{ name: 'caret-left' }} />} />
        <span data-part="title" aria-live="polite" className={c.title}>{monthLabel(focus, locale)}</span>
        <Button variant="ghost" aria-label="Next month" onClick={() => setFocus(addMonths(focus, 1))} leading={<i {...{ name: 'caret-right' }} />} />
      </div>
      <div ref={grid} data-part="grid" role="grid" aria-label={label} className={c.grid} onKeyDown={onKey}>
        <div role="row" data-part="row" className={c.row}>{weekdays(start, locale).map((d) => <span key={d.long} role="columnheader" aria-label={d.long} data-part="weekday" className={c.weekday}>{d.short}</span>)}</div>
        {weeks.map((w) => (
          <div key={w[0].iso} role="row" data-part="row" className={c.row}>
            {w.map((x) => <span key={x.iso} role="gridcell" data-part="cell" data-date={x.iso} aria-label={x.label} aria-selected={x.selected} tabIndex={x.focused ? 0 : -1} data-outside={x.outside ? '' : undefined} data-today={x.today ? '' : undefined} data-in-range={x.inRange && !x.selected ? '' : undefined} aria-disabled={x.disabled ? true : undefined} className={c.cell} onClick={() => pick(x.iso)}>{x.day}</span>)}
          </div>
        ))}
      </div>
    </div>
  );
}
