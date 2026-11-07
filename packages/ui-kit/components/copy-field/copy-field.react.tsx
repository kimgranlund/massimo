// React <CopyField>: a read-only Input with a Button in its trailing slot, like <ui-copy-field>.
import { useEffect, useRef, useState } from 'react';
import { Input } from '../input/input.react.tsx';
import { Button } from '../button/button.react.tsx';
import { COPIED_MS, copyText } from '../../dom/copy.ts';
import { copyField } from '../../styled-system/recipes/copy-field.js';

export interface CopyFieldProps {
  label?: string;
  hideLabel?: boolean;
  value: string;
  onCopy?: (value: string) => void;
  className?: string;
}

export function CopyField({ label, hideLabel, value, onCopy, className }: CopyFieldProps) {
  const [status, setStatus] = useState<'' | 'copied' | 'failed'>('');
  const timer = useRef(0);
  useEffect(() => () => clearTimeout(timer.current), []);
  const copy = async () => {
    const ok = await copyText(value);
    setStatus(ok ? 'copied' : 'failed');
    if (!ok) return;
    onCopy?.(value);
    clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setStatus(''), COPIED_MS);
  };
  const c = copyField();
  return (
    <div data-ui="copy-field" className={[c.root, className].filter(Boolean).join(' ')}>
      <Input readOnly label={label} hideLabel={hideLabel} value={value} trailing={
        <Button variant="primary" aria-label="Copy" onClick={copy} leading={<i {...{ name: status === 'copied' ? 'check' : 'copy' }} />} />
      } />
      <span data-part="status" role="status" className={c.status}>{status === 'copied' ? 'Copied' : status === 'failed' ? 'Couldn\'t copy. Select the text instead.' : ''}</span>
    </div>
  );
}
