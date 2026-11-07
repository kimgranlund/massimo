// React <ValueSlider>: the kit's Slider with its label and value inside the track, like <ui-value-slider>.
import { useState } from 'react';
import { Slider } from '../range/range.react.tsx';
import { valueSlider } from '../../styled-system/recipes/value-slider.js';

export interface ValueSliderProps {
  label: string;
  name?: string;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  onValueChange?: (value: number) => void;
  className?: string;
}

export function ValueSlider({ label, name, defaultValue = 50, min = 0, max = 100, step = 1, unit = '', onValueChange, className }: ValueSliderProps) {
  const [value, setValue] = useState(defaultValue), c = valueSlider();
  return (
    <div data-ui="value-slider" className={[c.root, className].filter(Boolean).join(' ')}>
      <Slider label={label} name={name} min={min} max={max} step={step} value={value} onValueChange={(v: number | number[]) => { const n = v as number; setValue(n); onValueChange?.(n); }} />
      <span data-part="label" aria-hidden="true" className={c.label}>{label}</span>
      <span data-part="value" aria-hidden="true" className={c.value}>{value}{unit}</span>
    </div>
  );
}
