// Spinner (T-0033): web component, React renderer (SSR), the resolver, and motion.
import { tick } from './setup.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadTsx } from './load-tsx.ts';
import { resolveSpinner } from '../tokens/geometry/resolve.ts';
import { spinner } from '../components/spinner/spinner.recipe.ts';

await import('../components/spinner/spinner.element.ts');
const { Spinner } = await loadTsx(new URL('../components/spinner/spinner.react.tsx', import.meta.url));
const mount = async (markup: string) => { const d = document.createElement('div'); d.innerHTML = markup; document.body.append(d); await tick(); return d.firstElementChild as HTMLElement; };

test('resolveSpinner: a 4u ring, a u/2 stroke, 2u from the label', () => {
  assert.deepEqual(resolveSpinner({ unit: 4 }), { ring: 16, stroke: 2, gap: 8 });
  assert.deepEqual(resolveSpinner({ unit: 6 }), { ring: 24, stroke: 3, gap: 12 });
});

test('ui-spinner: a status named by its label, or Loading', async () => {
  const bare = await mount('<ui-spinner></ui-spinner>');
  assert.equal(bare.getAttribute('role'), 'status');
  assert.equal(bare.getAttribute('aria-label'), 'Loading');
  assert.equal((bare.querySelector('[data-part=label]') as HTMLElement).hidden, true);
  assert.equal(bare.querySelector('[data-part=ring]')!.getAttribute('aria-hidden'), 'true');
  const named = await mount('<ui-spinner label="Saving"></ui-spinner>');
  assert.equal(named.getAttribute('aria-label'), 'Saving');
  assert.equal(named.querySelector('[data-part=label]')!.textContent, 'Saving');
  assert.equal((named.querySelector('[data-part=label]') as HTMLElement).hidden, false);
  const hidden = await mount('<ui-spinner label="Saving" hide-label></ui-spinner>');
  assert.equal(hidden.getAttribute('aria-label'), 'Saving');
  assert.equal((hidden.querySelector('[data-part=label]') as HTMLElement).hidden, true);
  assert.equal(hidden.hasAttribute('tabindex'), false, 'no focus stop');
});

test('React Spinner: the same role, name and parts', () => {
  const d = document.createElement('div');
  d.innerHTML = renderToStaticMarkup(h(Spinner, { label: 'Saving' }));
  const el = d.firstElementChild as HTMLElement;
  assert.equal(el.getAttribute('role'), 'status');
  assert.equal(el.getAttribute('aria-label'), 'Saving');
  assert.equal(el.getAttribute('data-ui'), 'spinner');
  assert.equal(el.querySelector('[data-part=label]')!.textContent, 'Saving');
  d.innerHTML = renderToStaticMarkup(h(Spinner, { label: 'Saving', hideLabel: true }));
  assert.equal(d.querySelector('[data-part=label]')!.hasAttribute('hidden'), true);
  d.innerHTML = renderToStaticMarkup(h(Spinner, {}));
  assert.equal(d.firstElementChild!.getAttribute('aria-label'), 'Loading');
});

test('the ring turns on an intent token and holds still under reduced motion', () => {
  const ring = (spinner as any).base.ring['&::before'];
  assert.match(ring.animation, /\{durations\.reveal\}/);
  assert.equal(ring['@media (prefers-reduced-motion: reduce)'].animation, 'none');
});
