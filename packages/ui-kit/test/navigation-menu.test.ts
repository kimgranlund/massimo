// Navigation menu: web component behavior in happy-dom (anatomy, ARIA, hover, press, keys, the
// shared viewport), React server markup and the same data-* on both renderers.
import { tick } from './setup.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createElement as h, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadTsx } from './load-tsx.ts';
import { activationDirection } from '../dom/navigation.ts';

await import('../components/navigation-menu/navigation-menu.element.ts');
const { NavigationMenu } = await loadTsx(new URL('../components/navigation-menu/navigation-menu.react.tsx', import.meta.url));

const NATIVE = 'input, button, select, textarea, label, fieldset, legend, option, optgroup, output, datalist, meter, progress, form';
const contract = JSON.parse(readFileSync(new URL('../contracts/states.json', import.meta.url), 'utf8'));
const STATE = new Set(Object.keys(contract.attributes));
const STRUCTURE = new Set(['data-ui', 'data-part', 'data-size', 'data-value']);
const names = (el: Element | null | undefined) => [...(el?.attributes ?? [])].map((a) => a.name).filter((n) => n.startsWith('data-') && !STRUCTURE.has(n)).sort();
const kit = (el: Element | null | undefined) => [...(el?.classList ?? [])].filter((c) => c.startsWith('ui-')).join(' ');
const key = (el: Element, k: string, o: KeyboardEventInit = {}) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...o }));
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const MENU = `<ui-navigation-menu label="Main">
  <div data-part="item" value="docs" label="Docs"><a href="/docs/intro">Introduction</a><a href="/docs/geometry" active>Geometry</a></div>
  <div data-part="item" value="kit" label="Kit"><a href="/kit/button">Button</a></div>
  <div data-part="item"><a data-part="link" href="/blog">Blog</a></div>
</ui-navigation-menu>`;

async function wc(markup: string): Promise<any> {
  const box = document.createElement('div');
  box.innerHTML = markup;
  document.body.append(box);
  await tick(); await tick();
  return box.firstElementChild;
}

test('navigation menu: anatomy, landmark, triggers with carets, contents in the shared viewport', async () => {
  const el = await wc(MENU);
  const list = el.list, [docs, kitItem, blog] = el.items;
  assert.equal(el.getAttribute('role'), 'navigation');
  assert.equal(el.getAttribute('aria-label'), 'Main');
  assert.deepEqual([...el.children].map((c: Element) => c.getAttribute('data-part')), ['list', 'positioner']);
  assert.equal(list.getAttribute('role'), 'list');
  assert.equal(docs.item.getAttribute('role'), 'listitem');
  assert.equal(docs.trigger.getAttribute('role'), 'button');
  assert.equal(docs.trigger.querySelector('[data-part=contents]').textContent, 'Docs');
  assert.equal(docs.trigger.querySelector('[data-part=trailing] > i').getAttribute('name'), 'caret-down');
  assert.deepEqual([docs.trigger.getAttribute('aria-expanded'), docs.trigger.getAttribute('aria-controls')], ['false', docs.content.id]);
  assert.equal(docs.content.parentElement, el.viewport, 'contents live in the viewport');
  assert.ok(docs.content.hidden && kitItem.content.hidden);
  assert.equal(blog.link.getAttribute('data-part'), 'link');
  assert.equal(el.viewport.parentElement, el.popup);
  assert.equal(el.positioner.getAttribute('popover'), 'manual');
  const geo = docs.content.querySelectorAll('[data-part=link]')[1];
  assert.deepEqual(names(geo), ['data-active']);
  assert.equal(geo.getAttribute('aria-current'), 'page');
  assert.equal(kit(el), 'ui-navigation-menu__root');
  assert.equal(kit(list), 'ui-navigation-menu__list');
  assert.equal(kit(docs.trigger), 'ui-navigation-menu__trigger');
  assert.equal(kit(docs.content), 'ui-navigation-menu__content');
  assert.equal(kit(blog.link), 'ui-navigation-menu__link');
  assert.equal(kit(el.popup), 'ui-navigation-menu__popup');
  assert.equal(el.querySelector(NATIVE), null, 'no native form elements');
  el.parentElement.remove();
});

test('navigation menu: a press toggles an item (change, trigger-press); switching sets the activation direction', async () => {
  const el = await wc(MENU);
  const [docs, kitItem] = el.items;
  const changes: any[] = [];
  el.addEventListener('change', (e: CustomEvent) => changes.push(e.detail));
  docs.trigger.click(); await tick();
  assert.equal(el.value, 'docs');
  assert.deepEqual([changes[0].value, changes[0].reason], ['docs', 'trigger-press']);
  assert.equal(docs.trigger.getAttribute('data-popup-open'), '');
  assert.equal(docs.trigger.getAttribute('aria-expanded'), 'true');
  assert.equal(docs.content.hidden, false);
  assert.deepEqual(names(docs.content), ['data-open']);
  assert.deepEqual(names(el.positioner), ['data-align', 'data-open', 'data-placement', 'data-side']);
  kitItem.trigger.click(); await tick();
  assert.equal(el.value, 'kit');
  assert.ok(docs.content.hidden);
  assert.equal(kitItem.content.getAttribute('data-activation-direction'), 'right');
  kitItem.trigger.click(); await tick();
  assert.equal(el.value, '');
  assert.equal(changes.at(-1).value, '');
  el.addEventListener('change', (e: Event) => e.preventDefault());
  docs.trigger.click(); await tick();
  assert.equal(el.value, '', 'canceled: stays closed');
  el.value = 'kit'; await tick();
  assert.equal(kitItem.content.hidden, false, 'setting value opens without a change');
  assert.equal(changes.length, 4, 'the canceled change was dispatched; setting value dispatches none');
  el.parentElement.remove();
});

test('navigation menu: hover opens after the delay, moving between triggers switches at once, leaving closes', async () => {
  const el = await wc(MENU.replace('label="Main"', 'label="Main" delay="10" close-delay="10"'));
  const [docs, kitItem] = el.items;
  const over = (t: Element, from: Element | null = null) => t.dispatchEvent(new PointerEvent('pointerover', { bubbles: true, pointerType: 'mouse', relatedTarget: from }));
  const out = (t: Element, to: Element | null = null) => t.dispatchEvent(new PointerEvent('pointerout', { bubbles: true, pointerType: 'mouse', relatedTarget: to }));
  over(docs.trigger); await sleep(5);
  assert.equal(el.value, '');
  await sleep(30);
  assert.equal(el.value, 'docs');
  out(docs.trigger, kitItem.trigger); over(kitItem.trigger, docs.trigger); await tick();
  assert.equal(el.value, 'kit', 'switches at once');
  out(kitItem.trigger, el.popup); over(el.popup, kitItem.trigger); await sleep(40);
  assert.equal(el.value, 'kit', 'the pointer is on the popup');
  out(el.popup, document.body); await sleep(40);
  assert.equal(el.value, '');
  el.parentElement.remove();
});

test('navigation menu: arrows move between stops, ArrowDown opens into the content, Escape closes and returns focus', async () => {
  const el = await wc(MENU);
  const [docs, kitItem, blog] = el.items;
  docs.trigger.focus();
  key(docs.trigger, 'ArrowRight');
  assert.equal(document.activeElement, kitItem.trigger);
  key(kitItem.trigger, 'ArrowRight');
  assert.equal(document.activeElement, blog.link);
  key(blog.link, 'ArrowRight');
  assert.equal(document.activeElement, docs.trigger, 'wraps');
  key(docs.trigger, 'End');
  assert.equal(document.activeElement, blog.link);
  key(blog.link, 'Home');
  key(docs.trigger, 'ArrowDown');
  await sleep(40);
  assert.equal(el.value, 'docs');
  assert.equal(document.activeElement, docs.content.querySelector('a'), 'focus moves to the first link');
  key(document.activeElement!, 'Escape'); await tick();
  assert.equal(el.value, '');
  assert.equal(document.activeElement, docs.trigger);
  key(docs.trigger, 'Enter'); await tick();
  assert.equal(el.value, 'docs', 'Enter presses the trigger');
  el.parentElement.remove();
});

test('navigation menu: the activation direction', () => {
  assert.equal(activationDirection(0, 1, false), 'right');
  assert.equal(activationDirection(2, 1, false), 'left');
  assert.equal(activationDirection(0, 1, true), 'down');
  assert.equal(activationDirection(-1, 1, false), '');
});

function ssr(el: ReactElement) {
  const box = document.createElement('div');
  box.innerHTML = renderToStaticMarkup(el);
  return box.querySelector('[data-ui]') as HTMLElement;
}

test('NavigationMenu (React): the same data-* as ui-navigation-menu on host, list, items, triggers and links', async () => {
  const tree = h(NavigationMenu, { label: 'Main' },
    h(NavigationMenu.Item, { value: 'docs', label: 'Docs' }, h(NavigationMenu.Link, { href: '/docs/intro' }, 'Introduction')),
    h(NavigationMenu.Item, { value: 'blog' }, h(NavigationMenu.Link, { href: '/blog', active: true }, 'Blog')));
  const a = await wc('<ui-navigation-menu label="Main"><div data-part="item" value="docs" label="Docs"><a href="/docs/intro">Introduction</a></div><div data-part="item" value="blog"><a data-part="link" href="/blog" active>Blog</a></div></ui-navigation-menu>');
  const b = ssr(tree);
  const allowed = contract.components['ui-navigation-menu'];
  for (const [label, sel] of [['host', ':scope'], ['list', ':scope > [data-part=list]'], ['item', '[data-part=item]'], ['trigger', '[data-part=trigger]'], ['link', ':scope > [data-part=list] > [data-part=item] > [data-part=link]'], ['positioner', '[data-part=positioner]'], ['popup', '[data-part=popup]']] as const) {
    const ea = sel === ':scope' ? [a] : [...a.querySelectorAll(sel)], eb = sel === ':scope' ? [b] : [...b.querySelectorAll(sel)];
    assert.equal(ea.length, eb.length, `${label}: same count`);
    ea.forEach((x: Element, i: number) => {
      assert.deepEqual(names(x), names(eb[i]), `${label}[${i}]`);
      for (const n of names(x)) { assert.ok(STATE.has(n), `${n} in the contract`); assert.ok((allowed[label] ?? []).includes(n), `${label}: ${n} listed`); }
    });
  }
  assert.equal(b.localName, 'nav');
  assert.equal(b.getAttribute('aria-label'), 'Main');
  assert.equal(kit(b.querySelector('[data-part=trigger]')), 'ui-navigation-menu__trigger');
  assert.equal(b.querySelector('[data-part=trigger]')!.getAttribute('aria-controls'), b.querySelector('[data-part=content]')!.id);
  assert.equal(b.querySelector('[data-part=trigger] [data-part=trailing] i')!.getAttribute('name'), 'caret-down');
  a.parentElement.remove();
});

test('NavigationMenu (React): the preset renders its parts; className and render functions', () => {
  const items = [h(NavigationMenu.Item, { key: 'a', value: 'a', label: 'A' }, h(NavigationMenu.Link, { href: '#a' }, 'a'))];
  const a = renderToStaticMarkup(h(NavigationMenu, { label: 'Main' }, ...items)).replace(/_R_[a-z0-9]+_/gi, 'ID');
  const b = renderToStaticMarkup(h(NavigationMenu.Root, { label: 'Main' },
    h(NavigationMenu.List, null, ...items),
    h(NavigationMenu.Positioner, null, h(NavigationMenu.Popup, null, h(NavigationMenu.Viewport))))).replace(/_R_[a-z0-9]+_/gi, 'ID');
  assert.equal(a, b);
  assert.match(a, /^<nav data-ui="navigation-menu" aria-label="Main" data-orientation="horizontal" class="ui-navigation-menu__root"/);
  const c = renderToStaticMarkup(h(NavigationMenu.Root, { defaultValue: 'a', className: (s: any) => `o-${s.orientation}` },
    h(NavigationMenu.List, null, h(NavigationMenu.Item, { value: 'a', label: 'A' }, 'x'))));
  assert.match(c, /class="ui-navigation-menu__root o-horizontal"/);
  assert.match(c, /data-popup-open=""/);
  assert.match(c, /data-part="content"[^>]*data-open=""/);
});
