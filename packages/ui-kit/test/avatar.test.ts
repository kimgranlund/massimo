// Avatar (T-0003): resolver, web component (load status, fallback, initials, delay, parts), React
// renderer (SSR), state parity, composition and the loading-status event in both renderers.
import { tick } from './setup.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { loadTsx } from './load-tsx.ts';
import { resolveAvatar, resolveControl } from '../tokens/geometry/resolve.ts';
import { initialsOf } from '../dom/index.ts';

await import('../components/avatar/avatar.element.ts');
const { Avatar } = await loadTsx(new URL('../components/avatar/avatar.react.tsx', import.meta.url));
const contract = JSON.parse(readFileSync(new URL('../contracts/states.json', import.meta.url), 'utf8'));
const NATIVE = 'input, button, select, textarea, label, fieldset, legend, option, optgroup, output, datalist, meter, progress, form';
const STRUCTURE = ['data-ui', 'data-size', 'data-part', 'data-avatar-size', 'data-generated'];
const dataNames = (el: Element | null) => [...(el?.attributes ?? [])].map((a) => a.name).filter((n) => n.startsWith('data-') && !STRUCTURE.includes(n)).sort();
const mount = async (markup: string) => { const d = document.createElement('div'); d.innerHTML = markup; document.body.append(d); await tick(); return d; };
const ssr = (el: any) => { const d = document.createElement('div'); d.innerHTML = renderToStaticMarkup(el); return d.querySelector("[data-ui]") as HTMLElement; };
const html = (el: any) => renderToStaticMarkup(el);

test('resolveAvatar: sm = the slot, md = the control height; type and icon scale with k', () => {
  const c = resolveControl({ unit: 4 });
  assert.equal(resolveAvatar('sm', { unit: 4 }).size, c.slot);
  assert.equal(resolveAvatar('md', { unit: 4 }).size, c.height);
  assert.equal(resolveAvatar('lg', { unit: 4 }).size, 48);
  const xl = resolveAvatar('xl', { unit: 4 });
  assert.equal(xl.size, 64);
  assert.equal(xl.fontSize, 2 * c.fontSize);
  assert.equal(resolveAvatar('md', { unit: 4 }).iconSize, resolveControl({ unit: 4, iconSize: 'md' }).iconSize);
  assert.equal(resolveAvatar('md', { unit: 4 }).radius, 16, 'a circle at s = 1');
  assert.equal(resolveAvatar('md', { unit: 4, radiusScale: 0 }).radius, 0);
  assert.equal(resolveAvatar('md', { unit: 4, radiusScale: 3 }).radius, 16, 'never past a circle');
  assert.throws(() => resolveAvatar('huge' as any), RangeError);
});

test('initialsOf: first and last word, up to two letters', () => {
  assert.equal(initialsOf('Maya Lindqvist'), 'ML');
  assert.equal(initialsOf('  kim  '), 'K');
  assert.equal(initialsOf('Ana María de la Cruz'), 'AC');
  assert.equal(initialsOf(''), '');
});

test('ui-avatar: image part and fallback; initials, icon, authored content; names the host', async () => {
  const d = await mount('<ui-avatar name="Maya Lindqvist"></ui-avatar><ui-avatar></ui-avatar><ui-avatar alt="Team">AB</ui-avatar>');
  const [a, b, c] = d.querySelectorAll('ui-avatar');
  const part = (el: Element, p: string) => el.querySelector(`:scope > [data-part=${p}]`) as HTMLElement;
  assert.equal(part(a, 'image').localName, 'img');
  assert.equal(part(a, 'image').hidden, true, 'no src: the image is hidden');
  assert.equal(part(a, 'fallback').textContent, 'ML');
  assert.equal(a.getAttribute('role'), 'img');
  assert.equal(a.getAttribute('aria-label'), 'Maya Lindqvist');
  assert.equal(part(a, 'fallback').getAttribute('aria-hidden'), 'true');
  assert.equal(part(b, 'fallback').querySelector('i')?.getAttribute('name'), 'user');
  assert.equal(b.hasAttribute('role'), false, 'unnamed: no role');
  assert.equal(part(c, 'fallback').textContent, 'AB', 'authored content wins');
  assert.equal(c.getAttribute('aria-label'), 'Team');
  assert.ok(a.classList.contains('ui-avatar__root') && part(a, 'image').classList.contains('ui-avatar__image') && part(a, 'fallback').classList.contains('ui-avatar__fallback'));
  assert.equal(d.querySelector(NATIVE), null);
  (a as any).name = 'Kim'; await tick();
  assert.equal(part(a, 'fallback').textContent, 'K', 'generated initials follow name');
  d.remove();
});

test('ui-avatar: loading → loaded / error with data-loading, data-error and loadingstatuschange', async () => {
  const d = await mount('<ui-avatar src="a.png" name="Ada"></ui-avatar>');
  const a = d.firstElementChild as any;
  const img = a.querySelector('[data-part=image]') as HTMLImageElement, fb = a.querySelector('[data-part=fallback]') as HTMLElement;
  const seen: string[] = [];
  a.addEventListener('loadingstatuschange', (e: CustomEvent) => seen.push(e.detail.status));
  assert.equal(a.status, 'loading');
  assert.deepEqual(dataNames(img), ['data-loading']);
  assert.equal(fb.hidden, false);
  img.dispatchEvent(new Event('load')); await tick();
  assert.equal(a.status, 'loaded');
  assert.deepEqual(dataNames(img), []);
  assert.equal(img.hidden, false);
  assert.equal(fb.hidden, true);
  a.src = 'b.png'; await tick();
  img.dispatchEvent(new Event('error')); await tick();
  assert.deepEqual(dataNames(img), ['data-error']);
  assert.equal(img.hidden, true);
  assert.equal(fb.hidden, false);
  assert.deepEqual(seen, ['loaded', 'loading', 'error']);
  d.remove();
});

test('ui-avatar: delay hides the fallback until it passes', async () => {
  const d = await mount('<ui-avatar delay="20" name="Ada"></ui-avatar>');
  const fb = d.querySelector('[data-part=fallback]') as HTMLElement;
  assert.equal(fb.hidden, true);
  await new Promise((r) => setTimeout(r, 40)); await tick();
  assert.equal(fb.hidden, false);
  d.remove();
});

test('ui-avatar: authored image and fallback parts are kept (composition)', async () => {
  const d = await mount('<ui-avatar name="Kim Sandberg"><img data-part="image" src="k.png" alt="" class="mine"><span data-part="fallback">KS</span></ui-avatar>');
  const a = d.firstElementChild as any;
  assert.equal(a.src, 'k.png', 'the authored img seeds src');
  assert.equal(a.children.length, 2);
  assert.ok(a.querySelector('img').classList.contains('mine'));
  assert.equal(a.querySelector('[data-part=fallback]').textContent, 'KS');
  d.remove();
});

test('React Avatar: same anatomy, classes and data-* as the web component (SSR)', async () => {
  const pairs: [string, any][] = [
    ['<ui-avatar name="Maya Lindqvist"></ui-avatar>', h(Avatar, { name: 'Maya Lindqvist' })],
    ['<ui-avatar></ui-avatar>', h(Avatar, {})],
    ['<ui-avatar src="a.png" alt="Ada">AL</ui-avatar>', h(Avatar, { src: 'a.png', alt: 'Ada' }, 'AL')],
  ];
  for (const [markup, el] of pairs) {
    const d = await mount(markup);
    const a = d.firstElementChild!, b = ssr(el);
    assert.equal(b.localName, 'span');
    assert.equal(a.getAttribute('role'), b.getAttribute('role'));
    assert.equal(a.getAttribute('aria-label'), b.getAttribute('aria-label'));
    assert.deepEqual([...a.children].map((c) => `${c.localName}[${c.getAttribute('data-part')}]${(c as HTMLElement).hidden}:${c.className}:${c.textContent}:${c.getAttribute('aria-hidden')}`),
      [...b.children].map((c) => `${c.localName}[${c.getAttribute('data-part')}]${(c as HTMLElement).hidden}:${c.className}:${c.textContent}:${c.getAttribute('aria-hidden')}`), markup);
    assert.deepEqual([...a.classList].sort(), [...b.classList].sort());
    d.remove();
  }
  const s = html(h(Avatar, { name: 'Ada' }));
  assert.match(s, /^<span data-ui="avatar" data-avatar-size="md" role="img" aria-label="Ada" class="ui-avatar__root">/);
  assert.match(s, /<i name="user">|>A</);
});

test('state parity: host, image and fallback data-* match and are in the contract', async () => {
  const d = await mount('<ui-avatar src="a.png" name="A"></ui-avatar>');
  const a = d.firstElementChild!, b = ssr(h(Avatar, { src: 'a.png', name: 'A' }));
  const allowed = contract.components['ui-avatar'];
  for (const [label, sel] of [['host', ':scope'], ['image', '[data-part=image]'], ['fallback', '[data-part=fallback]']]) {
    const ea = sel === ':scope' ? a : a.querySelector(sel), eb = sel === ':scope' ? b : b.querySelector(sel);
    assert.deepEqual(dataNames(ea), dataNames(eb), label);
    for (const n of dataNames(ea)) assert.ok(allowed[label].includes(n), `${label}: ${n}`);
  }
  assert.deepEqual(dataNames(a.querySelector('[data-part=image]')), ['data-loading']);
  d.remove();
});

test('React Avatar: compound parts render the preset; render and className functions', () => {
  const preset = html(h(Avatar, { src: 'k.png', name: 'Kim Sandberg', avatarSize: 'lg' }, 'KS'));
  const composed = html(h(Avatar.Root, { name: 'Kim Sandberg', avatarSize: 'lg' }, h(Avatar.Image, { src: 'k.png' }), h(Avatar.Fallback, null, 'KS')));
  assert.equal(composed, preset);
  assert.match(html(h(Avatar.Root, { name: 'A', render: h('div'), className: (s: any) => (s ? 'x' : '') }, h(Avatar.Fallback))), /^<div data-ui="avatar"[^>]*class="ui-avatar__root x"/);
  assert.match(html(h(Avatar.Root, {}, h(Avatar.Image, { src: 'a.png', className: (s: any) => (s.loading ? 'is-loading' : '') }))), /class="ui-avatar__image is-loading"/);
  assert.throws(() => html(h(Avatar.Fallback)), /inside Avatar.Root/);
});
