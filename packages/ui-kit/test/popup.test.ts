// Anchored popups (popover, tooltip, preview card): web component behavior in happy-dom, React
// server markup, the same data-* state on both renderers (contracts/states.json), Base UI event
// details and the shared pieces (dom/popup.ts).
import { tick } from './setup.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createElement as h, type ReactElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadTsx } from './load-tsx.ts';
import { arrowOffset, chooseSide, createHoverIntent } from '../dom/popup.ts';

await import('../components/popover/popover.element.ts');
const { Popover } = await loadTsx(new URL('../components/popover/popover.react.tsx', import.meta.url));
await import('../components/tooltip/tooltip.element.ts');
const { Tooltip } = await loadTsx(new URL('../components/tooltip/tooltip.react.tsx', import.meta.url));
await import('../components/preview-card/preview-card.element.ts');
const { PreviewCard } = await loadTsx(new URL('../components/preview-card/preview-card.react.tsx', import.meta.url));

const NATIVE = 'input, button, select, textarea, label, fieldset, legend, option, optgroup, output, datalist, meter, progress, form';
const contract = JSON.parse(readFileSync(new URL('../contracts/states.json', import.meta.url), 'utf8'));
const STATE = new Set(Object.keys(contract.attributes));
const STRUCTURE = new Set(['data-ui', 'data-part', 'data-size']);
const names = (el: Element | null | undefined) => [...(el?.attributes ?? [])].map((a) => a.name).filter((n) => n.startsWith('data-') && !STRUCTURE.has(n)).sort();
const html = (el: ReactNode) => renderToStaticMarkup(el as any).replace(/_R_[a-z0-9]+_/gi, 'ID');
const key = (el: Element, k: string) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
const kit = (el: Element | null | undefined) => [...(el?.classList ?? [])].filter((c) => c.startsWith('ui-')).join(' ');
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function wc<T extends HTMLElement = any>(markup: string): Promise<T> {
  const box = document.createElement('div');
  box.innerHTML = markup;
  document.body.append(box);
  await tick(); await tick();
  return box.firstElementChild as T;
}
function ssr(el: ReactElement) {
  const box = document.createElement('div');
  box.innerHTML = renderToStaticMarkup(el);
  return box.querySelector('[data-ui]') as HTMLElement;
}
type Part = [string, string];
/** Same data-* on host and parts in both renderers; each name is in the contract for that element and part. */
export async function same(tag: string, markup: string, el: ReactElement, parts: Part[]) {
  const a = await wc(markup), b = ssr(el);
  const allowed = contract.components[tag];
  assert.ok(allowed, `${tag} is in contracts/states.json components`);
  for (const [label, s] of parts) {
    const ea = [...(s === ':scope' ? [a] : a.querySelectorAll(s))], eb = [...(s === ':scope' ? [b] : b.querySelectorAll(s))];
    assert.equal(ea.length, eb.length, `${tag} ${label}: same count`);
    ea.forEach((x, k) => {
      assert.deepEqual(names(x), names(eb[k]), `${tag} ${label}[${k}]: web component vs React`);
      for (const n of names(x)) {
        assert.ok(STATE.has(n), `${tag} ${label}: ${n} is defined in the contract`);
        assert.ok((allowed[label] ?? []).includes(n), `${tag} ${label}: ${n} is listed for it`);
      }
    });
  }
  a.parentElement!.remove();
}

// ── Shared pieces ──

test('popup arrow: centered on the anchor, clamped inside the popup ends (data-uncentered)', () => {
  const popup = { left: 100, top: 50, width: 200, height: 80 };
  assert.deepEqual(arrowOffset(popup, { left: 150, top: 0, width: 40, height: 30 }, 'bottom', 16), { offset: 70, uncentered: false });
  assert.deepEqual(arrowOffset(popup, { left: 80, top: 0, width: 20, height: 30 }, 'bottom', 16), { offset: 16, uncentered: true });
  assert.deepEqual(arrowOffset(popup, { left: 0, top: 60, width: 40, height: 20 }, 'right', 8), { offset: 20, uncentered: false });
});

test('popup side: the preferred side while the natural size fits, else the roomier opposite one', () => {
  const vp = { width: 800, height: 600 }, a = { top: 100, bottom: 140, left: 300, right: 400 };
  assert.equal(chooseSide(a, { width: 200, height: 300 }, vp, 'bottom', 4), 'bottom');
  assert.equal(chooseSide(a, { width: 200, height: 300 }, vp, 'top', 4), 'bottom', 'no room above: flips');
  assert.equal(chooseSide({ ...a, top: 500, bottom: 540 }, { width: 200, height: 300 }, vp, 'bottom', 4), 'top');
  assert.equal(chooseSide({ ...a, top: 500, bottom: 540 }, { width: 200, height: 40 }, vp, 'bottom', 4), 'bottom', 'a small popup fits below');
  assert.equal(chooseSide({ ...a, left: 500, right: 600 }, { width: 300, height: 40 }, vp, 'right', 4), 'left');
});

test('popup hover intent: opens after the delay, a re-entry cancels the close', async () => {
  const log: string[] = [];
  const hi = createHoverIntent({ delay: () => 20, closeDelay: () => 0, onOpen: () => log.push('open'), onClose: () => log.push('close') });
  hi.enter(new Event('pointerenter'));
  assert.ok(hi.pending);
  await sleep(40);
  assert.deepEqual(log, ['open']);
  hi.leave(new Event('pointerleave'));
  hi.enter(new Event('pointerenter'), false); // into the popup before the close fires
  await sleep(80);
  assert.deepEqual(log, ['open']);
  hi.leave(new Event('pointerleave'));
  await sleep(80);
  assert.deepEqual(log, ['open', 'close']);
});

// ── Popover ──

test('popover: the preset builds a ui-button trigger and a dialog popup in a manual-popover positioner', async () => {
  const el = await wc('<ui-popover label="Share"><h2 data-part="title">Share link</h2><p data-part="description">Anyone can view.</p></ui-popover>');
  const t = el.querySelector(':scope > [data-part=trigger]')!, pos = el.querySelector(':scope > [data-part=positioner]')!, p = pos.querySelector(':scope > [data-part=popup]')!;
  assert.equal(el.children.length, 2);
  assert.equal(t.localName, 'ui-button');
  assert.equal(t.querySelector('[data-part=contents]')!.textContent, 'Share');
  assert.deepEqual([t.getAttribute('aria-haspopup'), t.getAttribute('aria-expanded'), t.getAttribute('aria-controls')], ['dialog', 'false', p.id]);
  assert.equal(pos.getAttribute('popover'), 'manual');
  assert.equal(p.getAttribute('role'), 'dialog');
  assert.equal(p.getAttribute('aria-labelledby'), p.querySelector('[data-part=title]')!.id);
  assert.equal(p.getAttribute('aria-describedby'), p.querySelector('[data-part=description]')!.id);
  assert.match(el.style.getPropertyValue('--ui-anchor'), /^--anchor-/);
  assert.deepEqual(names(el), ['data-closed']);
  assert.deepEqual(names(pos), ['data-closed', 'data-placement']);
  assert.equal(pos.getAttribute('data-placement'), 'bottom-center');
  assert.equal(kit(el), 'ui-popover__root');
  assert.equal(kit(t), 'ui-button__root ui-button__root--variant_neutral ui-popover__trigger');
  assert.equal(kit(pos), 'ui-popover__positioner');
  assert.equal(kit(p), 'ui-popover__popup');
  assert.equal(kit(p.querySelector('[data-part=title]')), 'ui-popover__title');
  assert.equal(el.querySelector(NATIVE), null, 'no native form elements');
  el.parentElement!.remove();
});

test('popover: a press opens it (openchange trigger-press), moves focus in; Escape closes and returns focus', async () => {
  const el = await wc('<ui-popover label="Edit"><ui-button data-part="close">Done</ui-button><span>x</span></ui-popover>') as any;
  const events: any[] = [];
  el.addEventListener('openchange', (e: CustomEvent) => events.push(e.detail));
  el.trigger.focus();
  el.trigger.click(); await tick();
  assert.equal(el.open, true);
  assert.deepEqual([events[0].open, events[0].reason, events[0].event?.type], [true, 'trigger-press', 'click']);
  assert.deepEqual(names(el.positioner), ['data-align', 'data-open', 'data-placement', 'data-side']);
  assert.equal(el.trigger.getAttribute('data-popup-open'), '');
  assert.equal(el.trigger.getAttribute('aria-expanded'), 'true');
  assert.equal(document.activeElement, el.querySelector('[data-part=close]'), 'focus moved to the first tabbable');
  key(el.popup, 'Escape'); await tick();
  assert.equal(el.open, false);
  assert.equal(events[1].reason, 'escape-key');
  assert.equal(document.activeElement, el.trigger, 'focus returned');
  el.parentElement!.remove();
});

test('popover: outside press, Close part and a canceled openchange', async () => {
  const el = await wc('<ui-popover label="Edit"><ui-button data-part="close">Done</ui-button></ui-popover>') as any;
  const reasons: string[] = [];
  el.addEventListener('openchange', (e: CustomEvent) => reasons.push(e.detail.reason));
  el.trigger.click(); await tick();
  document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
  await tick();
  assert.equal(el.open, false);
  el.trigger.click(); await tick();
  el.querySelector('[data-part=close]').click(); await tick();
  assert.equal(el.open, false);
  assert.deepEqual(reasons, ['trigger-press', 'outside-press', 'trigger-press', 'close-press']);
  el.addEventListener('openchange', (e: Event) => e.preventDefault());
  el.trigger.click(); await tick();
  assert.equal(el.open, false, 'canceled: stays closed');
  // Setting open from script fires nothing.
  el.open = true; await tick();
  assert.equal(reasons.length, 5);
  assert.equal(el.positioner.getAttribute('data-open'), '');
  el.parentElement!.remove();
});

test('popover: modal traps Tab; default-open, disabled, authored parts and an arrow', async () => {
  const m = await wc('<ui-popover label="Rename" modal><ui-button>One</ui-button><ui-button>Two</ui-button></ui-popover>') as any;
  m.trigger.click(); await tick();
  assert.equal(m.popup.getAttribute('aria-modal'), 'true');
  const [one, two] = m.popup.querySelectorAll('ui-button');
  assert.equal(document.activeElement, one);
  two.focus();
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true }));
  assert.equal(document.activeElement, one, 'Tab wraps inside a modal popover');
  m.parentElement!.remove();
  const d = await wc('<ui-popover label="A" default-open><p>x</p></ui-popover>') as any;
  assert.equal(d.open, true);
  assert.notEqual(document.activeElement, d.popup.querySelector('p'), 'a default-open popover does not take focus');
  d.parentElement!.remove();
  const off = await wc('<ui-popover label="A" disabled><p>x</p></ui-popover>') as any;
  off.trigger.click(); await tick();
  assert.equal(off.open, false);
  off.parentElement!.remove();
  const parts = await wc('<ui-popover side="top" align="start"><span data-part="trigger" class="mine">Info</span><div data-part="popup"><p>Body</p><div data-part="arrow"></div></div></ui-popover>') as any;
  assert.equal(parts.trigger.getAttribute('role'), 'button', 'a plain trigger becomes a button');
  assert.equal(parts.trigger.getAttribute('tabindex'), '0');
  assert.ok(parts.trigger.classList.contains('mine'));
  assert.equal(parts.arrow.parentElement, parts.positioner, 'the arrow moves beside the popup');
  assert.equal(kit(parts.arrow), 'ui-popover__arrow');
  assert.equal(parts.positioner.getAttribute('data-placement'), 'top-start');
  key(parts.trigger, 'Enter'); await tick();
  assert.equal(parts.open, true, 'Enter on a plain trigger presses it');
  assert.deepEqual(names(parts.arrow), ['data-align', 'data-open', 'data-side']);
  assert.equal(parts.arrow.getAttribute('data-side'), parts.positioner.getAttribute('data-side'), 'the arrow follows the side in use');
  parts.parentElement!.remove();
});

test('popover: open-on-hover opens after the delay (trigger-hover) and closes when the pointer leaves', async () => {
  const el = await wc('<ui-popover label="Hover" open-on-hover delay="10" close-delay="0"><p>x</p></ui-popover>') as any;
  const reasons: string[] = [];
  el.addEventListener('openchange', (e: CustomEvent) => reasons.push(e.detail.reason));
  el.trigger.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }));
  await sleep(30);
  assert.equal(el.open, true);
  el.trigger.dispatchEvent(new PointerEvent('pointerleave', { pointerType: 'mouse' }));
  await sleep(80);
  assert.equal(el.open, false);
  assert.deepEqual(reasons, ['trigger-hover', 'trigger-hover']);
  el.parentElement!.remove();
});

test('Popover (React): the same data-* as ui-popover on host, trigger, positioner, popup and arrow', async () => {
  const P: Part[] = [['host', ':scope'], ['trigger', '[data-part=trigger]'], ['positioner', '[data-part=positioner]'], ['popup', '[data-part=popup]'], ['arrow', '[data-part=arrow]']];
  const tree = (open: boolean) => h(Popover.Root, { defaultOpen: open },
    h(Popover.Trigger, null, 'Share'),
    h(Popover.Positioner, null, h(Popover.Popup, null, h(Popover.Title, null, 'T')), h(Popover.Arrow)));
  const markup = (open: boolean) => `<ui-popover${open ? ' open' : ''}><ui-button data-part="trigger">Share</ui-button><div data-part="popup"><h2 data-part="title">T</h2><div data-part="arrow"></div></div></ui-popover>`;
  await same('ui-popover', markup(false), tree(false), P);
});

test('Popover (React): markup, preset vs parts, render and className functions', () => {
  const a = html(h(Popover, { label: 'Share' }, h('p', null, 'x')));
  assert.match(a, /^<div data-ui="popover" data-closed="" class="ui-popover__root" style="--ui-anchor:--ID\w*">/);
  assert.match(a, /<button type="button" class="ui-button__root ui-button__root--variant_neutral ui-popover__trigger" data-ui="button" data-part="trigger" aria-haspopup="dialog" aria-expanded="false" aria-controls="ID\w*popup">/);
  assert.match(a, /<div data-part="positioner" popover="manual" data-closed="" data-placement="bottom-center" class="ui-popover__positioner">/);
  assert.match(a, /<div data-part="popup" id="ID\w*popup" role="dialog" data-closed="" tabindex="-1" class="ui-popover__popup"><p>x<\/p><\/div>/);
  const b = html(h(Popover.Root, null, h(Popover.Trigger, null, 'Share'), h(Popover.Positioner, null, h(Popover.Popup, null, h('p', null, 'x')))));
  assert.equal(a, b, 'the preset renders its parts');
  const c = html(h(Popover.Root, { defaultOpen: true, className: (s: any) => (s.open ? 'is-open' : 'is-closed') }, h(Popover.Trigger, { render: h('a', { href: '#x' }) }, 'Go')));
  assert.match(c, /class="ui-popover__root is-open"/);
  assert.match(c, /<a href="#x" .*data-popup-open=""/);
});

// ── Tooltip ──

test('tooltip: the preset makes the child the trigger and content the role=tooltip popup it describes', async () => {
  const el = await wc('<ui-tooltip content="Bold (⌘B)"><ui-button aria-label="Bold" aria-describedby="hint">B</ui-button></ui-tooltip>') as any;
  const t = el.trigger, pos = el.positioner, p = el.popup;
  assert.equal(t.localName, 'ui-button');
  assert.equal(t.getAttribute('data-part'), 'trigger');
  assert.equal(p.getAttribute('role'), 'tooltip');
  assert.equal(p.textContent, 'Bold (⌘B)');
  assert.equal(t.getAttribute('aria-describedby'), `hint ${p.id}`, 'its own description first, then the tooltip');
  assert.equal(t.getAttribute('aria-haspopup'), null);
  assert.equal(pos.getAttribute('data-placement'), 'top-center');
  assert.equal(kit(el), 'ui-tooltip__root');
  assert.equal(kit(p), 'ui-tooltip__popup');
  assert.equal(kit(pos), 'ui-tooltip__positioner');
  assert.ok(t.classList.contains('ui-tooltip__trigger'));
  el.content = 'Bold'; await tick();
  assert.equal(p.textContent, 'Bold', 'content follows the property');
  assert.equal(el.querySelector(NATIVE), null, 'no native form elements');
  el.parentElement!.remove();
});

test('tooltip: hover opens after the delay (trigger-hover); leaving, a press and Escape close it; the warm group skips the delay', async () => {
  await sleep(450); // let the warm group from earlier tests cool down
  const el = await wc('<ui-tooltip content="Save" delay="20"><ui-button>S</ui-button></ui-tooltip>') as any;
  const reasons: string[] = [];
  el.addEventListener('openchange', (e: CustomEvent) => reasons.push(`${e.detail.open}:${e.detail.reason}`));
  const enter = () => el.trigger.dispatchEvent(new PointerEvent('pointerenter', { pointerType: 'mouse' }));
  const leave = () => el.trigger.dispatchEvent(new PointerEvent('pointerleave', { pointerType: 'mouse' }));
  enter(); await sleep(5);
  assert.equal(el.open, false, 'still waiting for the delay');
  await sleep(40);
  assert.equal(el.open, true);
  assert.equal(el.popup.hasAttribute('data-instant'), false, 'a cold open runs the motion');
  assert.notEqual(document.activeElement, el.popup, 'focus never moves');
  leave(); await sleep(80);
  assert.equal(el.open, false);
  // Warm: the next hover opens at once, without motion.
  enter(); await tick();
  assert.equal(el.open, true, 'warm: no delay');
  assert.equal(el.popup.getAttribute('data-instant'), 'delay');
  el.trigger.click(); await tick();
  assert.equal(el.open, false, 'a press closes it');
  enter(); await tick();
  key(el.positioner, 'Escape'); await tick();
  assert.equal(el.open, false);
  assert.deepEqual(reasons, ['true:trigger-hover', 'false:trigger-hover', 'true:trigger-hover', 'false:trigger-press', 'true:trigger-hover', 'false:escape-key']);
  el.parentElement!.remove();
});

test('tooltip: keyboard focus opens it at once (trigger-focus), blur closes it (focus-out); disabled never opens', async () => {
  const el = await wc('<ui-tooltip content="Search"><ui-button>Find</ui-button></ui-tooltip>') as any;
  const reasons: string[] = [];
  el.addEventListener('openchange', (e: CustomEvent) => reasons.push(`${e.detail.open}:${e.detail.reason}`));
  el.trigger.focus(); await tick();
  assert.equal(el.open, true);
  el.trigger.blur(); await tick();
  assert.equal(el.open, false);
  assert.deepEqual(reasons, ['true:trigger-focus', 'false:focus-out']);
  el.disabled = true; await tick();
  el.trigger.focus(); await tick();
  assert.equal(el.open, false);
  el.parentElement!.remove();
  const parts = await wc('<ui-tooltip side="bottom" align="start"><span data-part="trigger" tabindex="0">?</span><div data-part="popup">Help<div data-part="arrow"></div></div></ui-tooltip>') as any;
  assert.equal(parts.trigger.getAttribute('role'), null, 'a focusable authored trigger keeps its own semantics');
  assert.equal(parts.arrow.parentElement, parts.positioner);
  assert.equal(parts.positioner.getAttribute('data-placement'), 'bottom-start');
  parts.parentElement!.remove();
});

test('Tooltip (React): the same data-* as ui-tooltip; preset vs parts; Provider delays', async () => {
  const P: Part[] = [['host', ':scope'], ['trigger', '[data-part=trigger]'], ['positioner', '[data-part=positioner]'], ['popup', '[data-part=popup]'], ['arrow', '[data-part=arrow]']];
  const tree = h(Tooltip.Root, null, h(Tooltip.Trigger, null, 'B'), h(Tooltip.Positioner, null, h(Tooltip.Popup, null, 'Bold'), h(Tooltip.Arrow)));
  await same('ui-tooltip', '<ui-tooltip><ui-button data-part="trigger">B</ui-button><div data-part="popup">Bold<div data-part="arrow"></div></div></ui-tooltip>', tree, P);
  const a = html(h(Tooltip, { content: 'Bold' }, h('span', { tabIndex: 0 }, 'B')));
  assert.match(a, /^<div data-ui="tooltip" data-closed="" class="ui-tooltip__root" style="--ui-anchor:--ID\w*">/);
  assert.match(a, /<span tabindex="0" data-part="trigger" class="ui-tooltip__trigger" aria-describedby="ID\w*popup">B<\/span>/);
  assert.match(a, /<div data-part="popup" id="ID\w*popup" role="tooltip" data-closed="" class="ui-tooltip__popup">Bold<\/div>/);
  assert.match(a, /data-placement="top-center"/);
  const b = html(h(Tooltip.Root, null, h(Tooltip.Trigger, { render: h('span', { tabIndex: 0 }) }, 'B'), h(Tooltip.Positioner, null, h(Tooltip.Popup, null, 'Bold'))));
  assert.equal(a, b, 'the preset renders its parts');
  assert.doesNotThrow(() => html(h(Tooltip.Provider, { delay: 100, timeout: 0 }, h(Tooltip, { content: 'x' }, 'y'))));
});

// ── Preview card ──

test('preview card: the preset makes the first child link the trigger and the rest the card', async () => {
  const el = await wc('<ui-preview-card><a href="/ada">Ada Lovelace</a><strong>Ada Lovelace</strong><p>Mathematician</p></ui-preview-card>') as any;
  assert.equal(el.trigger.localName, 'a');
  assert.equal(el.trigger.getAttribute('data-part'), 'trigger');
  assert.equal(el.trigger.getAttribute('role'), null, 'a link keeps its role');
  assert.equal(el.popup.querySelector('p')!.textContent, 'Mathematician');
  assert.equal(el.popup.getAttribute('role'), null, 'Base UI: no popup role');
  assert.equal(el.trigger.getAttribute('aria-describedby'), null);
  assert.equal(el.positioner.getAttribute('data-placement'), 'bottom-center');
  assert.equal(kit(el), 'ui-preview-card__root');
  assert.equal(kit(el.popup), 'ui-preview-card__popup');
  assert.ok(el.trigger.classList.contains('ui-preview-card__trigger'));
  assert.equal(el.querySelector(NATIVE), null, 'no native form elements');
  el.parentElement!.remove();
});

test('preview card: hover opens after the delay and stays while the pointer moves onto the card; leaving closes it after close-delay', async () => {
  const el = await wc('<ui-preview-card delay="10" close-delay="30"><a href="/ada">Ada</a><p>Card</p></ui-preview-card>') as any;
  const reasons: string[] = [];
  el.addEventListener('openchange', (e: CustomEvent) => reasons.push(`${e.detail.open}:${e.detail.reason}`));
  const ev = (t: Element, type: string) => t.dispatchEvent(new PointerEvent(type, { pointerType: 'mouse' }));
  ev(el.trigger, 'pointerenter'); await sleep(30);
  assert.equal(el.open, true);
  ev(el.trigger, 'pointerleave'); await sleep(10);
  ev(el.positioner, 'pointerenter'); await sleep(60);
  assert.equal(el.open, true, 'the pointer reached the card before the close delay');
  ev(el.positioner, 'pointerleave'); await sleep(60);
  assert.equal(el.open, false);
  el.trigger.click(); await tick();
  assert.equal(el.open, false, 'a press follows the link, it does not toggle');
  el.trigger.focus(); await tick();
  assert.equal(el.open, true, 'keyboard focus opens it');
  key(el.positioner, 'Escape'); await tick();
  assert.equal(el.open, false);
  assert.deepEqual(reasons, ['true:trigger-hover', 'false:trigger-hover', 'true:trigger-focus', 'false:escape-key']);
  el.parentElement!.remove();
});

test('PreviewCard (React): the same data-* as ui-preview-card; the trigger is a link; preset vs parts', async () => {
  const P: Part[] = [['host', ':scope'], ['trigger', '[data-part=trigger]'], ['positioner', '[data-part=positioner]'], ['popup', '[data-part=popup]'], ['arrow', '[data-part=arrow]']];
  const tree = h(PreviewCard.Root, null, h(PreviewCard.Trigger, { href: '/ada' }, 'Ada'), h(PreviewCard.Positioner, null, h(PreviewCard.Popup, null, h('p', null, 'Card')), h(PreviewCard.Arrow)));
  await same('ui-preview-card', '<ui-preview-card><a data-part="trigger" href="/ada">Ada</a><div data-part="popup"><p>Card</p><div data-part="arrow"></div></div></ui-preview-card>', tree, P);
  const a = html(h(PreviewCard, { trigger: 'Ada', href: '/ada' }, h('p', null, 'Card')));
  assert.match(a, /^<div data-ui="preview-card" data-closed="" class="ui-preview-card__root" style="--ui-anchor:--ID\w*">/);
  assert.match(a, /<a data-part="trigger" class="ui-preview-card__trigger" href="\/ada">Ada<\/a>/);
  assert.match(a, /<div data-part="popup" id="ID\w*popup" data-closed="" class="ui-preview-card__popup"><p>Card<\/p><\/div>/);
  const b = html(h(PreviewCard, { trigger: h('a', { href: '/ada' }, 'Ada') }, h('p', null, 'Card')));
  const noHref = (m: string) => m.replace(' href="/ada"', '');
  assert.ok(b.includes(' href="/ada"'));
  assert.equal(noHref(a), noHref(b), 'a trigger element renders as the Trigger (attribute order aside)');
});
