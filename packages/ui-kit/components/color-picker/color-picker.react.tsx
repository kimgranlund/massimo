// React <ColorPicker>: edit OKLCH channels in a Popover and accept or cancel, like <ui-color-picker>.
import { useState } from 'react';
import { Popover } from '../popover/popover.react.tsx';
import { Button } from '../button/button.react.tsx';
import { Slider } from '../range/range.react.tsx';
import { Swatch } from '../color/color.react.tsx';
import { COLOR_RANGES, formatOklch, parseOklch, type Oklch } from '../../dom/color.ts';
import { colorPicker } from '../../styled-system/recipes/color-picker.js';

export interface ColorPickerProps {
  label?: string;
  defaultValue?: string;
  name?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

const FALLBACK: Oklch = { l: 0.6, c: 0.15, h: 250 };

export function ColorPicker({ label = 'Color', defaultValue = 'oklch(0.6 0.15 250)', name, onValueChange, className }: ColorPickerProps) {
  const [value, setValue] = useState(defaultValue), [draft, setDraft] = useState<Oklch | null>(null), [open, setOpen] = useState(false);
  const accepted = parseOklch(value) ?? FALLBACK, now = draft ?? accepted, c = colorPicker();
  const close = () => { setDraft(null); setOpen(false); };
  const apply = () => { if (draft) { const next = formatOklch(draft); setValue(next); onValueChange?.(next); } close(); };
  const channel = (key: keyof Oklch, title: string) => <Slider label={title} {...COLOR_RANGES[key]} value={now[key]} onValueChange={(v: number | number[]) => setDraft({ ...now, [key]: v as number })} />;
  return (
    <div data-ui="color-picker" className={[c.root, className].filter(Boolean).join(' ')}>
      {name && <input type="hidden" name={name} value={value} />}
      <Popover.Root open={open} onOpenChange={(o: boolean) => { setOpen(o); if (!o) setDraft(null); }}>
        <Popover.Trigger leading={<Swatch color={value} label={value} />}>{label}</Popover.Trigger>
        <Popover.Positioner><Popover.Popup><div data-part="channels" className={c.channels}>
          <span data-part="preview" className={c.preview} style={{ background: formatOklch(now) }} role="img" aria-label={`Draft color ${formatOklch(now)}`} />
          {channel('l', 'Lightness')}{channel('c', 'Chroma')}{channel('h', 'Hue')}
          <div data-part="actions" className={c.actions}><Button onClick={close}>Cancel</Button><Button variant="primary" onClick={apply}>Apply</Button></div>
        </div></Popover.Popup></Popover.Positioner>
      </Popover.Root>
    </div>
  );
}
