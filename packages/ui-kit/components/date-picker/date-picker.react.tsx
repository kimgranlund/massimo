// React <DatePicker>: a Popover holding a Calendar, like <ui-date-picker>.
import { useState } from 'react';
import { Popover } from '../popover/popover.react.tsx';
import { Calendar } from '../calendar/calendar.react.tsx';
import { parseIso, shortDate } from '../../dom/calendar.ts';
import { datePicker } from '../../styled-system/recipes/date-picker.js';

export interface DatePickerProps {
  label?: string;
  defaultValue?: string;
  min?: string;
  max?: string;
  locale?: string;
  name?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

export function DatePicker({ label = 'Choose a date', defaultValue = '', min, max, locale, name, onValueChange, className }: DatePickerProps) {
  const [value, setValue] = useState(defaultValue), [open, setOpen] = useState(false);
  return (
    <div data-ui="date-picker" className={[datePicker().root, className].filter(Boolean).join(' ')}>
      {name && <input type="hidden" name={name} value={value} />}
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger leading={<i {...{ name: 'calendar-blank' }} />}>{parseIso(value) ? shortDate(value, locale) : label}</Popover.Trigger>
        <Popover.Positioner><Popover.Popup>
          <Calendar value={value} min={min} max={max} locale={locale} label={label} onValueChange={(v) => { setValue(v); setOpen(false); onValueChange?.(v); }} />
        </Popover.Popup></Popover.Positioner>
      </Popover.Root>
    </div>
  );
}
