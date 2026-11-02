// Separator (T-0002): web component, React renderer (SSR), state parity and the render / className parts.
import { tick } from './setup.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { loadTsx } from './load-tsx.ts';
import { resolveSeparator } from '../tokens/geometry/resolve.ts';

await import('../components/separator/separator.element.ts');
const { Separator } = await loadTsx(new URL('../components/separator/separator.react.tsx', import.meta.url));
const contract = JSON.parse(readFileSync(new URL('../contracts/states.json', import.meta.url), 'utf8'));
const NATIVE = 'input, button, select, textarea, label, fieldset, legend, option, optgroup, output, datalist, meter, progress, form';
const dataNames = (el: Element) => [...el.attributes].map((a) => a.name).filter((n) => n.startsWith('data-') && !['data-ui', 'data-size'].includes(n)).sort();
const mount = async (markup: string) => { const d = document.createElement('div'); d.innerHTML = markup; document.body.append(d); await tick(); return d; };
const ssr = (el: any) => { const d = document.createElement('div'); d.innerHTML = renderToStaticMarkup(el); return d.firstElementChild as HTMLElement; };

test('resolveSeparator: max(1px, B), B capped at u/2', () => {
  assert.equal(resolveSeparator({ unit: 4, border: 0 }).thickness, 1);
  assert.equal(resolveSeparator({ unit: 4, border: 1 }).thickness, 1);
  assert.equal(resolveSeparator({ unit: 4, border: 2 }).thickness, 2);
  assert.equal(resolveSeparator({ unit: 2, border: 1 }).thickness, 1);
  assert.throws(() => resolveSeparator({ unit: 4, border: 3 }), RangeError);
});

test('ui-separator: role, aria-orientation, data-orientation, recipe class, no native elements', async () => {
  const d = await mount('<ui-separator></ui-separator><ui-separator orientation="vertical"></ui-separator>');
  const [a, b] = d.querySelectorAll('ui-separator');
  assert.equal(a.getAttribute('role'), 'separator');
  assert.equal(a.getAttribute('aria-orientation'), 'horizontal');
  assert.equal(a.getAttribute('data-orientation'), 'horizontal');
  assert.equal(b.getAttribute('aria-orientation'), 'vertical');
  assert.ok(a.classList.contains('ui-separator__root'));
  assert.equal(a.hasAttribute('tabindex'), false, 'not focusable');
  assert.equal(d.querySelector(NATIVE), null);
  (a as any).orientation = 'vertical'; await tick();
  assert.equal(a.getAttribute('data-orientation'), 'vertical');
  assert.equal(a.getAttribute('orientation'), 'vertical', 'reflects');
  d.remove();
});

test('React Separator: a div role=separator with the same attributes and classes', () => {
  const html = renderToStaticMarkup(h(Separator, { orientation: 'vertical' }));
  assert.equal(html, '<div data-ui="separator" role="separator" aria-orientation="vertical" data-orientation="vertical" class="ui-separator__root"></div>');
  assert.match(renderToStaticMarkup(h(Separator, {})), /aria-orientation="horizontal"/);
});

test('state parity: both renderers set the same data-*, all in the contract', async () => {
  for (const o of ['horizontal', 'vertical'] as const) {
    const d = await mount(`<ui-separator orientation="${o}"></ui-separator>`);
    const a = d.firstElementChild!, b = ssr(h(Separator, { orientation: o }));
    assert.deepEqual(dataNames(a), dataNames(b));
    assert.equal(a.getAttribute('data-orientation'), b.getAttribute('data-orientation'));
    for (const n of dataNames(a)) assert.ok(contract.components['ui-separator'].host.includes(n), n);
    assert.deepEqual([...a.classList].sort(), [...b.classList].sort());
    d.remove();
  }
});

test('React Separator: render element and className function of the state', () => {
  const html = renderToStaticMarkup(h(Separator, { orientation: 'vertical', render: h('hr'), className: (s: any) => (s.orientation === 'vertical' ? 'v' : 'h') }));
  assert.match(html, /^<hr data-ui="separator" role="separator" aria-orientation="vertical" data-orientation="vertical" class="ui-separator__root v"\/>$/);
});
