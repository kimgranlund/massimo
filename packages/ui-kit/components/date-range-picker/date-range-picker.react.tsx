// React <DateRangePicker>: a Popover with a range Calendar, Cancel and Apply, like <ui-date-range-picker>.
import { useState } from 'react';
import { Popover } from '../popover/popover.react.tsx';
import { Calendar } from '../calendar/calendar.react.tsx';
import { Button } from '../button/button.react.tsx';
import { rangeComplete, rangeText } from '../../dom/calendar.ts';
import { dateRangePicker } from '../../styled-system/recipes/date-range-picker.js';

export interface DateRangePickerProps {
  label?: string;
  defaultValue?: string;
  min?: string;
  max?: string;
  locale?: string;
  name?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

export function DateRangePicker({ label = 'Choose dates', defaultValue = '', min, max, locale, name, onValueChange, className }: DateRangePickerProps) {
  const [value, setValue] = useState(defaultValue), [draft, setDraft] = useState<string | null>(null), [open, setOpen] = useState(false), c = dateRangePicker();
  const now = draft ?? value;
  const close = () => { setDraft(null); setOpen(false); };
  const apply = () => { if (draft && rangeComplete(draft)) { setValue(draft); onValueChange?.(draft); } close(); };
  return (
    <div data-ui="date-range-picker" className={[c.root, className].filter(Boolean).join(' ')}>
      {name && <input type="hidden" name={name} value={value} />}
      <Popover.Root open={open} onOpenChange={(o: boolean) => { setOpen(o); if (!o) setDraft(null); }}>
        <Popover.Trigger leading={<i {...{ name: 'calendar-blank' }} />}>{rangeText(value, label, locale)}</Popover.Trigger>
        <Popover.Positioner><Popover.Popup><div data-part="body" className={c.body}>
          <Calendar mode="range" value={now} min={min} max={max} locale={locale} label={label} onValueChange={setDraft} />
          <div data-part="actions" className={c.actions}><Button onClick={close}>Cancel</Button><Button variant="primary" disabled={!rangeComplete(now)} onClick={apply}>Apply</Button></div>
        </div></Popover.Popup></Popover.Positioner>
      </Popover.Root>
    </div>
  );
}
