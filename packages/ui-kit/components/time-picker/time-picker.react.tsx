// React <TimePicker>: Autocomplete with time suggestions, like <ui-time-picker>.
import { useState } from 'react';
import { Autocomplete } from '../autocomplete/autocomplete.react.tsx';
import { SelectOption } from '../select/select.react.tsx';
import { parseTime, timeSlots } from '../../dom/time.ts';
import { timePicker } from '../../styled-system/recipes/time-picker.js';

export interface TimePickerProps {
  label?: string;
  name?: string;
  defaultValue?: string;
  step?: number;
  required?: boolean;
  onValueChange?: (value: string) => void;
  className?: string;
}

export function TimePicker({ label = 'Time', name, defaultValue = '', step = 30, required, onValueChange, className }: TimePickerProps) {
  const [value, setValue] = useState(defaultValue), [error, setError] = useState('');
  const commit = (text: string) => {
    const time = parseTime(text);
    setError(text && !time ? 'Enter a time, like 14:30 or 2:30 pm.' : '');
    setValue(time ?? text);
    if (time) onValueChange?.(time);
  };
  return (
    <div data-ui="time-picker" className={[timePicker().root, className].filter(Boolean).join(' ')}>
      <Autocomplete label={label} name={name} value={value} required={required} error={error || undefined} onValueChange={commit as never}>
        {timeSlots(step).map((t) => <SelectOption key={t} value={t}>{t}</SelectOption>)}
      </Autocomplete>
    </div>
  );
}
