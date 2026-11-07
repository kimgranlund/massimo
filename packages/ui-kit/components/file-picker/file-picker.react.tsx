// React <FilePicker>: a native file input behind the kit's button, in the same shape as <ui-file-picker>.
import { useId, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { Button } from '../button/button.react.tsx';
import { fileSummary, matchesAccept } from '../../dom/file.ts';
import { filePicker } from '../../styled-system/recipes/file-picker.js';

export interface FilePickerProps {
  label?: string;
  description?: string;
  name?: string;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  onFiles?: (files: File[]) => void;
  className?: string;
}

export function FilePicker({ label, description, name, accept = '', multiple, disabled, onFiles, className }: FilePickerProps) {
  const input = useRef<HTMLInputElement>(null), id = useId(), c = filePicker();
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const choose = (list: File[]) => { const fit = list.filter((f) => matchesAccept(f, accept)), next = multiple ? fit : fit.slice(0, 1); setFiles(next); onFiles?.(next); };
  return (
    <div data-ui="file-picker" className={[c.root, className].filter(Boolean).join(' ')}>
      {label && <label data-part="label" htmlFor={id} className={c.label}>{label}</label>}
      <div data-part="control" data-dragging={dragging || undefined} className={c.control}
        onDragOver={(e: DragEvent) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)}
        onDrop={(e: DragEvent) => { e.preventDefault(); setDragging(false); if (!disabled) choose([...e.dataTransfer.files]); }}>
        <input ref={input} id={id} type="file" name={name} accept={accept || undefined} multiple={multiple} disabled={disabled} hidden onChange={(e: ChangeEvent<HTMLInputElement>) => choose([...(e.target.files ?? [])])} />
        <Button disabled={disabled} onClick={() => input.current?.click()}>Choose {multiple ? 'files' : 'file'}</Button>
        <span data-part="name" className={c.name}>{fileSummary(files.map((f) => f.name))}</span>
      </div>
      {description && <p data-part="description" className={c.description}>{description}</p>}
    </div>
  );
}
