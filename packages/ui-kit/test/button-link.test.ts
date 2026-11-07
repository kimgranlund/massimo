// Button link (T-0037): link state, web component and React renderer (SSR).
import { tick } from './setup.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadTsx } from './load-tsx.ts';
import { linkAttrs } from '../dom/button-link.ts';

await import('../components/button-link/button-link.element.ts');
const { ButtonLink } = await loadTsx(new URL('../components/button-link/button-link.react.tsx', import.meta.url));
const mount = async (markup: string) => { const d = document.createElement('div'); d.innerHTML = markup; document.body.append(d); await tick(); return d.firstElementChild as any; };

test('linkAttrs: a new tab is isolated, unsafe schemes and disabled links have no href', () => {
  assert.equal(linkAttrs({ href: '/a' }).href, '/a');
  assert.equal(linkAttrs({ href: 'https://a.b', target: '_blank' }).rel, 'noopener noreferrer');
  assert.equal(linkAttrs({ href: 'https://a.b', target: '_blank', rel: 'me' }).rel, 'me');
  for (const bad of ['javascript:alert(1)', ' JavaScript:x', 'data:text/html,x', 'vbscript:x']) assert.equal(linkAttrs({ href: bad }).href, undefined, bad);
  const off = linkAttrs({ href: '/a', disabled: true });
  assert.equal(off.href, undefined);
  assert.equal(off['aria-disabled'], 'true');
  assert.equal(off.role, 'link');
});

test('ui-button-link: a real link wearing the button recipe, with sorted slots', async () => {
  const el = await mount('<ui-button-link href="/p" variant="primary"><i slot="trailing" name="arrow-right"></i>Pricing</ui-button-link>');
  const a = el.querySelector('a');
  assert.equal(a.getAttribute('href'), '/p');
  assert.equal(a.getAttribute('data-ui'), 'button');
  assert.match(a.className, /ui-button__root--variant_primary/);
  assert.match(a.className, /ui-button-link__link/);
  assert.equal(a.querySelector('[data-part=contents]').textContent, 'Pricing');
  assert.ok(a.querySelector('[data-part=trailing] i'));
  assert.equal(a.getAttribute('role'), null, 'a link stays a link');
  el.disabled = true; await tick();
  assert.equal(a.hasAttribute('href'), false);
  assert.equal(a.getAttribute('aria-disabled'), 'true');
});

test('React ButtonLink: the same host and link shape', () => {
  const d = document.createElement('div');
  d.innerHTML = renderToStaticMarkup(h(ButtonLink, { href: '/p', variant: 'primary', target: '_blank' }, 'Pricing'));
  const host = d.firstElementChild as HTMLElement, a = host.querySelector('a')!;
  assert.equal(host.getAttribute('data-ui'), 'button-link');
  assert.equal(a.getAttribute('rel'), 'noopener noreferrer');
  assert.match(a.className, /ui-button__root--variant_primary/);
  d.innerHTML = renderToStaticMarkup(h(ButtonLink, { href: '/p', disabled: true }, 'Pricing'));
  assert.equal(d.querySelector('a')!.hasAttribute('href'), false);
});
