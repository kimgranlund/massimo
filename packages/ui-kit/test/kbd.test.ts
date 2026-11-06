// Kbd (T-0034): key notation, web component, React renderer (SSR) and the resolver.
import { tick } from './setup.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadTsx } from './load-tsx.ts';
import { resolveKbd } from '../tokens/geometry/resolve.ts';
import { parseKeys } from '../dom/kbd.ts';

await import('../components/kbd/kbd.element.ts');
const { Kbd } = await loadTsx(new URL('../components/kbd/kbd.react.tsx', import.meta.url));
const mount = async (markup: string) => { const d = document.createElement('div'); d.innerHTML = markup; document.body.append(d); await tick(); return d.firstElementChild as HTMLElement; };
const caps = (el: Element) => [...el.querySelectorAll('[data-part=cap]')].map((c) => c.textContent);

test('resolveKbd: a 5u cap, ½u apart, with 10 + ½u text', () => {
  assert.deepEqual(resolveKbd({ unit: 4 }), { height: 20, minWidth: 20, gap: 2, paddingInline: 4, fontSize: 12, radius: 4 });
  assert.equal(resolveKbd({ unit: 4, radiusScale: 0 }).radius, 0);
  assert.equal(resolveKbd({ unit: 4, radiusScale: 3 }).radius, 10, 'at most half the height');
});

test('parseKeys: mod follows the platform, and unknown keys show as written', () => {
  assert.deepEqual(parseKeys('mod+shift+p', 'mac').map((k) => k.glyph), ['⌘', '⇧', 'P']);
  assert.deepEqual(parseKeys('mod+shift+p', 'other').map((k) => k.glyph), ['Ctrl', 'Shift', 'P']);
  assert.deepEqual(parseKeys('mod+k', 'mac').map((k) => k.spoken), ['Command', 'K']);
  assert.deepEqual(parseKeys('alt', 'mac').map((k) => k.spoken), ['Option']);
  assert.deepEqual(parseKeys('F12', 'other').map((k) => k.glyph), ['F12']);
  assert.deepEqual(parseKeys('', 'other'), []);
});

test('ui-kbd: one cap per key, hidden from assistive technology, with a spoken label', async () => {
  const el = await mount('<ui-kbd keys="mod+k" platform="mac"></ui-kbd>');
  assert.deepEqual(caps(el), ['⌘', 'K']);
  assert.equal(el.querySelector('[data-part=keys]')!.getAttribute('aria-hidden'), 'true');
  assert.equal(el.querySelector('[data-part=label]')!.textContent, 'Command K');
  assert.equal(el.hasAttribute('tabindex'), false, 'no focus stop');
  (el as any).keys = 'esc';
  await tick();
  assert.deepEqual(caps(el), ['Esc'], 'follows the property');
  const text = await mount('<ui-kbd platform="other">k</ui-kbd>');
  assert.deepEqual(caps(text), ['K'], 'text content is the same input');
  assert.equal(text.querySelector('[data-part=label]')!.textContent, 'K');
});

test('React Kbd: a native kbd with the same parts, on the other platform on a server', () => {
  const d = document.createElement('div');
  d.innerHTML = renderToStaticMarkup(h(Kbd, { keys: 'mod+k' }));
  const el = d.firstElementChild as HTMLElement;
  assert.equal(el.localName, 'kbd');
  assert.equal(el.getAttribute('data-ui'), 'kbd');
  assert.deepEqual(caps(el), ['Ctrl', 'K']);
  d.innerHTML = renderToStaticMarkup(h(Kbd, { keys: 'mod+k', platform: 'mac' }));
  assert.deepEqual(caps(d.firstElementChild!), ['⌘', 'K']);
  assert.equal(d.querySelector('[data-part=label]')!.textContent, 'Command K');
});
