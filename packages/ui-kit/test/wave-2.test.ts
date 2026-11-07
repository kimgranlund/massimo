// Wave 2: chip select, selection control, file picker and color picker.
import { tick } from './setup.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadTsx } from './load-tsx.ts';
import { fileSummary, matchesAccept } from '../dom/file.ts';
import { formatOklch, parseOklch } from '../dom/color.ts';
import { selectionText } from '../dom/selection.ts';

await import('../components/chip-select/chip-select.element.ts');
await import('../components/selection-control/selection-control.element.ts');
await import('../components/file-picker/file-picker.element.ts');
await import('../components/color-picker/color-picker.element.ts');
const { SelectionControl } = await loadTsx(new URL('../components/selection-control/selection-control.react.tsx', import.meta.url));
const { FilePicker } = await loadTsx(new URL('../components/file-picker/file-picker.react.tsx', import.meta.url));
const mount = async (markup: string) => { const d = document.createElement('div'); d.innerHTML = markup; document.body.append(d); await tick(); await tick(); return d.firstElementChild as any; };

test('matchesAccept: extensions, wildcards and types', () => {
  const png = { name: 'a.PNG', type: 'image/png' }, pdf = { name: 'b.pdf', type: 'application/pdf' };
  assert.ok(matchesAccept(png, ''));
  assert.ok(matchesAccept(png, 'image/*'));
  assert.ok(matchesAccept(pdf, 'image/*, .pdf'));
  assert.ok(!matchesAccept(pdf, 'image/*'));
  assert.equal(fileSummary([]), 'No file chosen');
  assert.equal(fileSummary(['a']), 'a');
  assert.equal(fileSummary(['a', 'b']), '2 files');
});

test('oklch drafts parse, clamp and round-trip', () => {
  assert.deepEqual(parseOklch('oklch(0.6 0.15 250)'), { l: 0.6, c: 0.15, h: 250 });
  assert.deepEqual(parseOklch('oklch(2 -1 370)'), { l: 1, c: 0, h: 10 });
  assert.equal(parseOklch('red'), null);
  assert.equal(formatOklch({ l: 0.61234, c: 0.1, h: 12.34 }), 'oklch(0.612 0.1 12.3)');
});

test('selectionText: switches read On and Off, numbers take their unit', () => {
  assert.equal(selectionText({ checked: true }), 'On');
  assert.equal(selectionText({ checked: false }), 'Off');
  assert.equal(selectionText({ value: 40 }, '%'), '40%');
  assert.equal(selectionText(null), '');
});

test('ui-chip-select is a select with the chip class', async () => {
  const el = await mount('<ui-chip-select label="Sort" name="s" value="b"><ui-option value="a">A</ui-option><ui-option value="b">B</ui-option></ui-chip-select>');
  assert.match(el.className, /ui-chip-select__root/);
  assert.equal(el.value, 'b');
});

test('ui-selection-control shows its child\'s value and follows it', async () => {
  const el = await mount('<ui-selection-control label="V" unit="%"><ui-range label="V" value="40"></ui-range></ui-selection-control>');
  await tick();
  assert.equal(el.querySelector('[data-part=value]').textContent, '40%');
  el.querySelector('ui-range').value = 55;
  el.querySelector('ui-range').dispatchEvent(new Event('input', { bubbles: true }));
  assert.equal(el.querySelector('[data-part=value]').textContent, '55%');
});

test('ui-file-picker holds no native input, filters by accept and submits files', async () => {
  const el = await mount('<ui-file-picker label="F" name="f" accept="image/*"></ui-file-picker>');
  assert.equal(el.querySelector('input'), null);
  const good = new File(['x'], 'a.png', { type: 'image/png' }), bad = new File(['x'], 'b.txt', { type: 'text/plain' });
  el.choose([bad, good]);
  await tick();
  assert.deepEqual(el.files.map((f: File) => f.name), ['a.png']);
  assert.equal(el.querySelector('[data-part=name]').textContent, 'a.png');
  assert.ok(el.formValue() instanceof FormData);
  el.resetValue(); await tick();
  assert.equal(el.formValue(), null);
});

test('ui-color-picker keeps its value until Apply', async () => {
  const el = await mount('<ui-color-picker label="A" value="oklch(0.5 0.1 100)"></ui-color-picker>');
  assert.equal(el.formValue(), 'oklch(0.5 0.1 100)');
  assert.ok(el.querySelector('ui-popover'));
  assert.equal(el.querySelectorAll('ui-range').length, 3);
});

test('React twins: selection control and file picker', () => {
  const d = document.createElement('div');
  d.innerHTML = renderToStaticMarkup(h(SelectionControl, { label: 'V', value: '40%' }));
  assert.equal(d.querySelector('[data-part=value]')!.textContent, '40%');
  d.innerHTML = renderToStaticMarkup(h(FilePicker, { label: 'F', name: 'f' }));
  assert.equal(d.querySelector('input')!.getAttribute('type'), 'file');
});
