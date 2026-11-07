// Input actions, the copy field and the value slider.
import { tick } from './setup.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadTsx } from './load-tsx.ts';
import { resolveField, resolveFieldAction, resolveValueSlider } from '../tokens/geometry/resolve.ts';
import { copyText } from '../dom/copy.ts';

await import('../components/copy-field/copy-field.element.ts');
await import('../components/value-slider/value-slider.element.ts');
const { CopyField } = await loadTsx(new URL('../components/copy-field/copy-field.react.tsx', import.meta.url));
const { ValueSlider } = await loadTsx(new URL('../components/value-slider/value-slider.react.tsx', import.meta.url));
const mount = async (markup: string) => { const d = document.createElement('div'); d.innerHTML = markup; document.body.append(d); await tick(); await tick(); return d.firstElementChild as any; };

test('resolveFieldAction: the composite rule keeps the field\'s height', () => {
  const f = resolveField({ unit: 4 }), a = resolveFieldAction({ unit: 4 });
  assert.equal(a.edge, 2);
  assert.equal(a.height + 2 * a.edge, f.height);
  assert.equal(a.radius, f.radius - 2);
  assert.equal(resolveFieldAction({ unit: 4, radiusScale: 0 }).radius, 0, 'corners never go negative');
});

test('resolveValueSlider: a control-height track', () => {
  assert.deepEqual(resolveValueSlider({ unit: 4 }), { height: 32, textEdge: 8, thumb: 2, thumbHeight: 24 });
});

test('copyText reports a refused clipboard instead of throwing', async () => {
  const had = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => { throw new Error('no'); } } });
  assert.equal(await copyText('x'), false);
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: async () => undefined } });
  assert.equal(await copyText('x'), true);
  if (had) Object.defineProperty(navigator, 'clipboard', had);
});

test('ui-copy-field: a read-only field with a named action and a status', async () => {
  const el = await mount('<ui-copy-field label="Link" value="a.b/c"></ui-copy-field>');
  const input = el.querySelector('ui-input');
  assert.equal(input.readonly, true);
  assert.equal(input.value, 'a.b/c');
  assert.equal(el.querySelector('ui-button').getAttribute('aria-label'), 'Copy');
  assert.equal(el.querySelector('[data-part=status]').getAttribute('role'), 'status');
});

test('ui-value-slider: wraps a range, with visible text hidden from assistive technology', async () => {
  const el = await mount('<ui-value-slider label="u" unit="px" min="2" max="12" step="0.5" value="4.5"></ui-value-slider>');
  const range = el.querySelector('ui-range');
  assert.equal(range.value, 4.5);
  assert.equal(range.label, 'u');
  assert.equal(el.querySelector('[data-part=value]').textContent, '4.5px');
  assert.equal(el.querySelector('[data-part=value]').getAttribute('aria-hidden'), 'true');
});

test('React twins render the same shape', () => {
  const d = document.createElement('div');
  d.innerHTML = renderToStaticMarkup(h(CopyField, { label: 'Link', value: 'a' }));
  assert.equal(d.firstElementChild!.getAttribute('data-ui'), 'copy-field');
  assert.equal(d.querySelector('[data-part=status]')!.getAttribute('role'), 'status');
  d.innerHTML = renderToStaticMarkup(h(ValueSlider, { label: 'u', unit: 'px', defaultValue: 4 }));
  assert.equal(d.querySelector('[data-part=value]')!.textContent, '4px');
});
