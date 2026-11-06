// Textarea (T-0035): multiline text entry, web component, React renderer (SSR) and the resolver.
import { tick } from './setup.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadTsx } from './load-tsx.ts';
import { resolveField, resolveTextarea } from '../tokens/geometry/resolve.ts';
import { multilineText, onTextBeforeInput, readMultiline, textEntryAttrs, toMultiline } from '../dom/text-entry.ts';

await import('../components/textarea/textarea.element.ts');
const { Textarea } = await loadTsx(new URL('../components/textarea/textarea.react.tsx', import.meta.url));
const mount = async (markup: string) => { const d = document.createElement('div'); d.innerHTML = markup; document.body.append(d); await tick(); return d.firstElementChild as any; };
const before = (inputType: string) => { let prevented = false; return { e: { inputType, preventDefault: () => { prevented = true; } } as unknown as InputEvent, prevented: () => prevented }; };

test('resolveTextarea: one row is an input, each further row adds a line', () => {
  const f = resolveField({ unit: 4 });
  assert.equal(resolveTextarea({ unit: 4, rows: 1 }).minHeight, f.height);
  assert.equal(resolveTextarea({ unit: 4, rows: 3 }).minHeight, f.height + 2 * f.contents.lineHeight);
  assert.equal(resolveTextarea({ unit: 4 }).rows, 3);
});

test('multiline entry keeps line breaks; single-line entry is unchanged', () => {
  assert.equal(toMultiline('a\r\nb\rc\nd'), 'a\nb\nc\nd');
  assert.equal(textEntryAttrs({ type: 'text', editable: true, multiline: true })['aria-multiline'], 'true');
  assert.equal(textEntryAttrs({ type: 'text', editable: true })['aria-multiline'], 'false');
  const line = before('insertParagraph');
  assert.equal(onTextBeforeInput(line.e, true), undefined);
  assert.equal(line.prevented(), false, 'Enter adds a line');
  const single = before('insertParagraph');
  assert.equal(onTextBeforeInput(single.e), 'submit');
  assert.equal(single.prevented(), true, 'Enter still submits a single-line input');
});

test('an editor\'s hidden break after an empty last line is not part of the value', () => {
  const read = (innerText: string) => readMultiline({ innerText } as HTMLElement);
  assert.equal(read('one\ntwo'), 'one\ntwo');
  assert.equal(read('a\n\n'), 'a\n', 'one Enter at the end');
  assert.equal(read('a\n\n\n'), 'a\n\n', 'two');
  assert.equal(read('a\n\nb'), 'a\n\nb', 'a blank line inside the text stays');
  assert.equal(read('\n'), '', 'an emptied editor');
  for (const value of ['a', 'a\n', 'a\n\n']) assert.equal(read(multilineText(value)), value, 'writing round-trips');
});

test('ui-textarea: a multiline textbox with the input\'s form behavior, and rows reach CSS', async () => {
  const el = await mount('<ui-textarea label="Notes" name="notes" rows="5" value="one&#10;two"></ui-textarea>');
  assert.equal(el.editor.getAttribute('aria-multiline'), 'true');
  assert.equal(el.editor.getAttribute('role'), 'textbox');
  assert.equal(el.editor.textContent, 'one\ntwo');
  assert.equal(el.style.getPropertyValue('--ui-rows'), '5');
  assert.match(el.className, /ui-textarea__root/);
  assert.equal(el.querySelector('input, textarea'), null, 'no native form element');
  el.value = 'x\ny'; await tick();
  assert.equal(el.editor.textContent, 'x\ny');
});

test('React Textarea: a native textarea wired to its label, with rows', () => {
  const d = document.createElement('div');
  d.innerHTML = renderToStaticMarkup(h(Textarea, { label: 'Notes', rows: 5, id: 'n', description: 'Help' }));
  const area = d.querySelector('textarea')!, label = d.querySelector('label')!;
  assert.equal(area.getAttribute('rows'), '5');
  assert.equal(label.getAttribute('for'), area.id);
  assert.equal(d.firstElementChild!.getAttribute('data-ui'), 'textarea');
  assert.match(area.getAttribute('aria-describedby') ?? '', /./);
});
