// React Field and FieldGrid (server-rendered): the web component's anatomy and classes, a native
// <label htmlFor> on the control, and the ids handed to the control by the render function.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadTsx } from './load-tsx.ts';

const { Field, FieldGrid } = await loadTsx(new URL('../components/field/field.react.tsx', import.meta.url));
const { Range } = await loadTsx(new URL('../components/range/range.react.tsx', import.meta.url));
const { Segmented, Option } = await loadTsx(new URL('../components/listbox/listbox.react.tsx', import.meta.url));

const html = (el: any) => renderToStaticMarkup(el);
const bare = (el: any) => html(el).replace(/ class="[^"]*"/g, '');

test('Field: data-ui host, label with text and unit, control, readout, description; recipe classes', () => {
  const out = html(h(Field, { label: 'Unit', unit: 'px', readout: '4.5', description: 'Sets u.', layout: 'inline', htmlFor: 'unit',
    children: (ids: any) => h(Range, { ...ids, defaultValue: 4.5, min: 2, max: 12, step: 0.5 }) }));
  assert.match(out, /^<div data-ui="field" data-layout="inline" class="ui-field__root ui-field__root--layout_inline">/);
  assert.match(out, /<label data-part="label" for="unit" class="ui-field__label[^"]*"><span data-part="contents" id="unit-label" class="ui-field__contents[^"]*">Unit<\/span><span data-part="suffix" id="unit-unit" class="ui-field__suffix[^"]*">px<\/span><\/label>/);
  assert.match(out, /<span data-part="readout" class="ui-field__readout[^"]*">4.5<\/span><p data-part="description" id="unit-desc" class="ui-field__description[^"]*">Sets u.<\/p><\/div>$/);
  assert.doesNotMatch(out, /<ui-/, 'no custom elements');
});

test('Field: the render function wires a native control (id) and an ARIA one (aria-labelledby = label + unit)', () => {
  const native = bare(h(Field, { label: 'Unit', unit: 'px', description: 'Sets u.', htmlFor: 'u', children: (ids: any) => h(Range, ids) }));
  assert.match(native, /<input type="range" [^>]*id="u" aria-labelledby="u-label u-unit" aria-describedby="u-desc"/);
  const aria = bare(h(Field, { label: 'Plan', htmlFor: 'p', children: (ids: any) => h(Segmented, { 'aria-labelledby': ids['aria-labelledby'] }, h(Option, { value: 'a' }, 'A')) }));
  assert.match(aria, /role="listbox"[^>]*aria-labelledby="p-label"|aria-labelledby="p-label"[^>]*role="listbox"/);
  // Without a label there is nothing to point at.
  assert.doesNotMatch(bare(h(Field, { htmlFor: 'n', children: (ids: any) => h(Range, ids) })), /aria-labelledby|data-part="label"/);
  // Plain children render as they are; the default layout is stacked; no readout part when empty.
  const plain = html(h(Field, { label: 'Note' }, h('span', null, 'x')));
  assert.match(plain, /ui-field__root--layout_stacked/);
  assert.doesNotMatch(plain, /data-part="readout"/);
});

test('FieldGrid: data-ui host with the grid recipe class', () => {
  assert.equal(html(h(FieldGrid, { className: 'mine' }, h('h2', null, 'Look'))), '<div data-ui="field-grid" class="ui-field-grid__root mine"><h2>Look</h2></div>');
});
