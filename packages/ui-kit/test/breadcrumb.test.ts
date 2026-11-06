// Breadcrumb (T-0036): truncation, web component, React renderer (SSR) and the resolver.
import { tick } from './setup.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadTsx } from './load-tsx.ts';
import { resolveBreadcrumb } from '../tokens/geometry/resolve.ts';
import { pressKey, visibleCrumbs } from '../dom/breadcrumb.ts';

await import('../components/breadcrumb/breadcrumb.element.ts');
const { Breadcrumb } = await loadTsx(new URL('../components/breadcrumb/breadcrumb.react.tsx', import.meta.url));
const mount = async (markup: string) => { const d = document.createElement('div'); d.innerHTML = markup; document.body.append(d); await tick(); return d.firstElementChild as HTMLElement; };
const links = (el: Element) => [...el.querySelectorAll('[data-part=link]')].map((c) => c.textContent);
const TRAIL = '<a href="/">Home</a><a href="/a">A</a><a href="/b">B</a><a href="/c">C</a><span>Now</span>';

test('resolveBreadcrumb: 1u apart, a 5u ellipsis, a 40u label', () => {
  assert.deepEqual(resolveBreadcrumb({ unit: 4 }), { gap: 4, ellipsis: 20, maxLabel: 160 });
});

test('visibleCrumbs keeps the root and the end, and folds only when it helps', () => {
  assert.deepEqual(visibleCrumbs(5, 3, false), { shown: [0, 3, 4], folded: true });
  assert.deepEqual(visibleCrumbs(5, 5, false), { shown: [0, 1, 2, 3, 4], folded: false });
  assert.deepEqual(visibleCrumbs(5, 0, false).folded, false);
  assert.deepEqual(visibleCrumbs(5, 1, false).folded, false, 'one crumb can\'t hold a root and a current page');
  assert.deepEqual(visibleCrumbs(5, 3, true).folded, false);
  assert.ok(pressKey('Enter') && pressKey(' ') && !pressKey('Tab'));
});

test('ui-breadcrumb: a named navigation, an ordered list, and the last crumb is current', async () => {
  const el = await mount(`<ui-breadcrumb label="Project">${TRAIL}</ui-breadcrumb>`);
  assert.equal(el.getAttribute('role'), 'navigation');
  assert.equal(el.getAttribute('aria-label'), 'Project');
  assert.equal(el.querySelector('[data-part=list]')!.localName, 'ol');
  assert.deepEqual(links(el), ['Home', 'A', 'B', 'C', 'Now']);
  assert.equal(el.querySelectorAll('[aria-current=page]').length, 1);
  assert.equal(el.querySelector('[aria-current=page]')!.textContent, 'Now');
  assert.equal(el.querySelectorAll('[data-part=separator]').length, 4);
  assert.equal(el.querySelector('[data-part=separator]')!.getAttribute('aria-hidden'), 'true');
});

test('max-items folds the middle; the ellipsis is a button that shows every crumb', async () => {
  const el = await mount(`<ui-breadcrumb max-items="3">${TRAIL}</ui-breadcrumb>`);
  assert.deepEqual(links(el), ['Home', 'C', 'Now']);
  const more = el.querySelector('[data-part=ellipsis]') as HTMLElement;
  assert.equal(more.getAttribute('role'), 'button');
  assert.equal(more.getAttribute('tabindex'), '0');
  more.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  await tick();
  assert.deepEqual(links(el), ['Home', 'A', 'B', 'C', 'Now']);
  assert.equal(el.querySelector('[data-part=ellipsis]'), null);
});

test('React Breadcrumb: the same landmark, list and current page, folded on the server', () => {
  const d = document.createElement('div');
  d.innerHTML = renderToStaticMarkup(h(Breadcrumb, { label: 'Project', maxItems: 3 }, h('a', { href: '/' }, 'Home'), h('a', { href: '/a' }, 'A'), h('a', { href: '/b' }, 'B'), h('span', null, 'Now')));
  const el = d.firstElementChild as HTMLElement;
  assert.equal(el.localName, 'nav');
  assert.equal(el.getAttribute('data-ui'), 'breadcrumb');
  assert.deepEqual(links(el), ['Home', 'B', 'Now']);
  assert.equal(el.querySelector('[aria-current=page]')!.textContent, 'Now');
  assert.equal(el.querySelector('[data-part=ellipsis]')!.getAttribute('role'), 'button');
});
