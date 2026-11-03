// Modal layers (dialog, alert dialog, drawer): web component behavior in happy-dom (top layer,
// inert outside, scroll lock, focus in and back, Escape / outside press / close reasons, nesting),
// the headless pieces (dom/dialog.ts), React server markup and client behavior, the same data-*
// on both renderers (contracts/states.json), and the composed parts against the presets.
import { tick } from './setup.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createElement as h, type ReactElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadTsx } from './load-tsx.ts';
import { inertOutside, lockScroll, parseModal } from '../dom/dialog.ts';

await import('../components/button/button.element.ts');
await import('../components/dialog/dialog.element.ts');
const { Dialog } = await loadTsx(new URL('../components/dialog/dialog.react.tsx', import.meta.url));

const NATIVE = 'input, button, select, textarea, label, fieldset, legend, option, optgroup, output, datalist, meter, progress, form';
const contract = JSON.parse(readFileSync(new URL('../contracts/states.json', import.meta.url), 'utf8'));
const STATE = new Set(Object.keys(contract.attributes));
const STRUCTURE = new Set(['data-ui', 'data-part', 'data-size']);
const names = (el: Element | null | undefined) => [...(el?.attributes ?? [])].map((a) => a.name).filter((n) => n.startsWith('data-') && !STRUCTURE.has(n)).sort();
const html = (el: ReactNode) => renderToStaticMarkup(el as any).replace(/_R_[a-z0-9]+_/gi, 'ID');
const key = (el: EventTarget, k: string) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
const press = (el: EventTarget) => el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true }));
const kit = (el: Element | null | undefined) => [...(el?.classList ?? [])].filter((c) => c.startsWith('ui-dialog')).join(' ');

async function wc<T extends HTMLElement = any>(markup: string, tag = 'ui-dialog'): Promise<T> {
  const box = document.createElement('div');
  box.innerHTML = markup;
  document.body.append(box);
  await tick(); await tick();
  return box.querySelector(tag) as T;
}
function ssr(el: ReactElement) {
  const box = document.createElement('div');
  box.innerHTML = renderToStaticMarkup(el);
  return box.querySelector('[data-ui]') as HTMLElement;
}
type Part = [string, string];
/** Same data-* on host and parts in both renderers; each name is in the contract for that element and part. */
export async function sameDialog(tag: string, markup: string, el: ReactElement, parts: Part[]) {
  const a = await wc(markup, tag), b = ssr(el);
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

const PRESET = '<ui-dialog label="Rename file" description="Pick a new name."><ui-button data-part="trigger">Rename</ui-button><p>Body</p><div data-part="actions"><ui-button data-part="close">Cancel</ui-button><ui-button variant="primary">Save</ui-button></div></ui-dialog>';

// ── Headless ──

test('dialog (headless): modal parsing, scroll lock counted, inert outside counted and keeps the author\'s', () => {
  assert.deepEqual([parseModal(null), parseModal('true'), parseModal(''), parseModal('false'), parseModal(false), parseModal('trap-focus')], [true, true, true, false, false, 'trap-focus']);
  const html = document.documentElement;
  const a = lockScroll(), b = lockScroll();
  assert.ok(html.hasAttribute('data-scroll-locked'));
  a();
  assert.ok(html.hasAttribute('data-scroll-locked'), 'nested lock holds');
  b();
  assert.ok(!html.hasAttribute('data-scroll-locked'));
  const root = document.createElement('div');
  root.innerHTML = '<p id="x"></p><p id="y" inert></p><div id="live" aria-live="polite"></div><div id="wrap"><span id="sib"></span><div id="layer"></div></div>';
  document.body.append(root);
  const layer = root.querySelector('#layer')!;
  const u1 = inertOutside(layer), u2 = inertOutside(layer);
  assert.ok(root.querySelector('#x')!.hasAttribute('inert') && root.querySelector('#sib')!.hasAttribute('inert'));
  assert.ok(!root.querySelector('#live')!.hasAttribute('inert'), 'live regions stay');
  assert.ok(!layer.hasAttribute('inert') && !root.querySelector('#wrap')!.hasAttribute('inert'), 'the layer and its ancestors stay');
  u1();
  assert.ok(root.querySelector('#x')!.hasAttribute('inert'), 'counted');
  u2();
  assert.ok(!root.querySelector('#x')!.hasAttribute('inert'));
  assert.ok(root.querySelector('#y')!.hasAttribute('inert'), "the author's inert stays");
  root.remove();
});

// ── Web component ──

test('dialog: the preset builds trigger, backdrop and a popup (title, description, content); closed state', async () => {
  await import('../components/input/input.element.ts');
  // A ui-input's own description part is not the dialog's.
  const el = await wc(PRESET.replace('<p>Body</p>', '<ui-input label="Name" description="Field help"></ui-input><p>Body</p>')) as any;
  const [t, b, p] = [...el.children] as HTMLElement[];
  assert.deepEqual([t, b, p].map((x) => x.getAttribute('data-part')), ['trigger', 'backdrop', 'popup']);
  const title = p.querySelector('[data-part=title]')!, desc = p.querySelector('[data-part=description]')!;
  assert.equal(title.localName, 'h2');
  assert.equal(title.textContent, 'Rename file');
  assert.equal(desc.localName, 'p');
  assert.equal(p.firstElementChild, title);
  assert.equal(title.nextElementSibling, desc);
  assert.equal(p.getAttribute('role'), 'dialog');
  assert.equal(p.getAttribute('aria-modal'), 'true');
  assert.equal(p.getAttribute('aria-labelledby'), title.id);
  assert.equal(p.getAttribute('aria-describedby'), desc.id);
  assert.equal(p.getAttribute('tabindex'), '-1');
  assert.equal(p.getAttribute('popover'), 'manual');
  assert.equal(b.getAttribute('aria-hidden'), 'true');
  assert.equal(t.getAttribute('aria-haspopup'), 'dialog');
  assert.equal(t.getAttribute('aria-expanded'), 'false');
  assert.equal(t.getAttribute('aria-controls'), p.id);
  assert.deepEqual(names(el), ['data-closed']);
  assert.deepEqual(names(p), ['data-closed']);
  assert.deepEqual(names(b), ['data-closed']);
  assert.equal(kit(el), 'ui-dialog__root');
  assert.equal(kit(b), 'ui-dialog__backdrop');
  assert.equal(kit(p), 'ui-dialog__popup');
  assert.equal(kit(title), 'ui-dialog__title');
  assert.equal(kit(desc), 'ui-dialog__description');
  assert.equal(kit(p.querySelector('[data-part=actions]')), 'ui-dialog__actions');
  assert.equal(kit(t), 'ui-dialog__trigger');
  assert.ok(t.classList.contains('ui-button__root'), 'the trigger keeps its own recipe');
  assert.equal(kit(p.querySelector('[data-part=close]')), 'ui-dialog__close');
  assert.equal(el.querySelector(NATIVE), null, 'no native form elements');
  el.parentElement.remove();
});

test('dialog: a trigger press opens (top layer, inert outside, scroll lock, focus in); Escape closes and focus returns', async () => {
  const outside = document.createElement('p');
  document.body.append(outside);
  const el = await wc(PRESET) as any;
  const got: any[] = [];
  el.addEventListener('openchange', (e: CustomEvent) => got.push(e.detail));
  const t = el.trigger as HTMLElement;
  t.focus();
  t.click(); await tick();
  assert.equal(el.open, true);
  assert.ok(el.hasAttribute('open'), 'open reflects');
  assert.deepEqual([got[0].open, got[0].reason], [true, 'trigger-press']);
  assert.deepEqual(Object.keys(got[0]).sort(), ['event', 'open', 'reason']);
  assert.equal(t.getAttribute('aria-expanded'), 'true');
  assert.deepEqual(names(t).filter((n) => n === 'data-popup-open'), ['data-popup-open']);
  assert.deepEqual(names(el.popup), ['data-open']);
  assert.ok(outside.hasAttribute('inert'), 'the page is inert');
  assert.ok(t.hasAttribute('inert'), 'the trigger too');
  assert.ok(!el.popup.hasAttribute('inert') && !el.backdrop.hasAttribute('inert'));
  assert.ok(document.documentElement.hasAttribute('data-scroll-locked'));
  assert.ok(el.popup.contains(document.activeElement), 'focus moved into the popup');
  assert.equal(document.activeElement, el.popup.querySelector('[data-part=close]'), 'the first tabbable');
  key(document.activeElement!, 'Escape'); await tick();
  assert.equal(el.open, false);
  assert.equal(got[1].reason, 'escape-key');
  assert.ok(!outside.hasAttribute('inert') && !t.hasAttribute('inert'), 'inert lifted');
  assert.ok(!document.documentElement.hasAttribute('data-scroll-locked'));
  assert.equal(document.activeElement, t, 'focus returned to the trigger');
  el.parentElement.remove(); outside.remove();
});

test('dialog: outside press, close parts, disable-pointer-dismissal, preventDefault, [autofocus], setting open fires nothing', async () => {
  const el = await wc(PRESET.replace('<ui-button variant="primary">', '<ui-button variant="primary" autofocus>')) as any;
  const got: any[] = [];
  el.addEventListener('openchange', (e: CustomEvent) => got.push(e.detail.reason));
  el.open = true; await tick();
  assert.equal(got.length, 0, 'setting open fires nothing');
  assert.equal(document.activeElement?.textContent, 'Save', '[autofocus] takes focus');
  press(el.popup.querySelector('p')); await tick();
  assert.equal(el.open, true, 'a press inside stays open');
  press(el.backdrop); await tick();
  assert.equal(el.open, false);
  assert.equal(got.at(-1), 'outside-press');
  el.open = true; await tick();
  (el.popup.querySelector('[data-part=close]') as HTMLElement).click(); await tick();
  assert.equal(el.open, false);
  assert.equal(got.at(-1), 'close-press');
  el.setAttribute('disable-pointer-dismissal', '');
  el.open = true; await tick();
  press(el.backdrop); await tick();
  assert.equal(el.open, true, 'disable-pointer-dismissal ignores outside presses');
  const stop = (e: Event) => e.preventDefault();
  el.addEventListener('openchange', stop);
  key(document.activeElement!, 'Escape'); await tick();
  assert.equal(el.open, true, 'preventDefault keeps it open');
  el.removeEventListener('openchange', stop);
  key(document.activeElement!, 'Escape'); await tick();
  assert.equal(el.open, false);
  el.parentElement.remove();
});

test('dialog: modal=false leaves the page interactive; trap-focus traps without inert; removal while open undoes', async () => {
  const outside = document.createElement('p');
  document.body.append(outside);
  const el = await wc(PRESET.replace('<ui-dialog', '<ui-dialog modal="false"')) as any;
  el.open = true; await tick();
  assert.equal(el.popup.getAttribute('aria-modal'), null);
  assert.ok(!outside.hasAttribute('inert'));
  assert.ok(!document.documentElement.hasAttribute('data-scroll-locked'));
  el.open = false; await tick();
  el.modal = 'trap-focus';
  el.open = true; await tick();
  assert.equal(el.popup.getAttribute('aria-modal'), null);
  assert.ok(!outside.hasAttribute('inert'));
  el.modal = 'true';
  el.open = false; await tick();
  el.open = true; await tick();
  assert.ok(outside.hasAttribute('inert'));
  el.parentElement.remove();
  assert.ok(!outside.hasAttribute('inert'), 'removed while open: inert lifted');
  assert.ok(!document.documentElement.hasAttribute('data-scroll-locked'));
  outside.remove();
});

test('dialog: authored parts; a nested dialog has no backdrop, its parent counts it; Escape and outside presses close the nested one first', async () => {
  const el = await wc(`<ui-dialog><ui-button data-part="trigger">Open</ui-button><div data-part="backdrop" class="mine"></div>
    <div data-part="popup"><h3 data-part="title">Settings</h3><p>Body</p>
      <ui-dialog label="Confirm"><ui-button data-part="trigger">More</ui-button><ui-button data-part="close">OK</ui-button></ui-dialog>
      <ui-button data-part="close">Done</ui-button></div></ui-dialog>`) as any;
  const child = el.popup.querySelector('ui-dialog') as any;
  assert.equal(el.backdrop.classList.contains('mine'), true, 'the authored backdrop is kept');
  assert.equal(el.popup.querySelector('[data-part=title]').localName, 'h3');
  assert.equal(el.popup.getAttribute('aria-labelledby'), el.popup.querySelector('h3').id);
  const reasons: string[] = [];
  el.addEventListener('openchange', (e: CustomEvent) => { if (e.target === el) reasons.push(e.detail.reason); });
  el.open = true; await tick();
  child.trigger.click(); await tick();
  assert.equal(child.open, true);
  assert.equal(el.open, true, "the child's trigger press does not reach the parent");
  assert.deepEqual(names(child.popup), ['data-nested', 'data-open']);
  assert.ok(child.backdrop.hidden, 'a nested dialog shows no backdrop');
  assert.deepEqual(names(el.popup), ['data-nested-dialog-open', 'data-open']);
  assert.equal(el.popup.style.getPropertyValue('--nested-dialogs'), '1');
  key(document.activeElement!, 'Escape'); await tick();
  assert.equal(child.open, false);
  assert.equal(el.open, true, 'Escape closes the topmost only');
  assert.deepEqual(names(el.popup), ['data-open']);
  child.open = true; await tick();
  press(document.body); await tick();
  assert.deepEqual([child.open, el.open], [false, true], 'an outside press closes the topmost only');
  // The child's close part closes the child only; the parent's close part the parent.
  child.open = true; await tick();
  (child.popup.querySelector('[data-part=close]') as HTMLElement).click(); await tick();
  assert.deepEqual([child.open, el.open], [false, true]);
  ([...el.popup.querySelectorAll('[data-part=close]')].at(-1) as HTMLElement).click(); await tick();
  assert.equal(el.open, false);
  assert.deepEqual(reasons, ['close-press']);
  el.parentElement.remove();
});

// ── React ──

test('Dialog (React): the same data-* as ui-dialog on host, trigger, backdrop and popup', async () => {
  const P: Part[] = [['host', ':scope'], ['trigger', '[data-part=trigger]'], ['backdrop', '[data-part=backdrop]'], ['popup', '[data-part=popup]']];
  const props = { label: 'Rename', description: 'New name', trigger: 'Rename' };
  await sameDialog('ui-dialog', '<ui-dialog label="Rename" description="New name"><ui-button data-part="trigger">Rename</ui-button><p>x</p></ui-dialog>', h(Dialog, props, h('p', null, 'x')), P);
  await sameDialog('ui-dialog', '<ui-dialog label="Rename" open><ui-button data-part="trigger">Rename</ui-button><p>x</p></ui-dialog>', h(Dialog, { ...props, defaultOpen: true }, h('p', null, 'x')), P);
});

test('Dialog (React): parts, recipe classes, kit Button trigger and close; the composed parts render the preset', () => {
  const a = html(h(Dialog, { label: 'Rename', description: 'New name', trigger: 'Open' }, h('p', null, 'x'), h(Dialog.Actions, null, h(Dialog.Close, null, 'Cancel'))));
  assert.match(a, /^<div data-ui="dialog" data-closed="" class="ui-dialog__root">/);
  assert.match(a, /<button type="button" class="ui-button__root[^"]* ui-dialog__trigger" data-ui="button" data-part="trigger" aria-haspopup="dialog" aria-expanded="false" aria-controls="ID\w*">/);
  assert.match(a, /<div data-part="backdrop" aria-hidden="true" popover="manual" data-closed="" class="ui-dialog__backdrop"><\/div>/);
  assert.match(a, /<div data-part="popup" id="ID\w*" role="dialog" aria-modal="true" tabindex="-1" popover="manual" data-closed="" class="ui-dialog__popup">/);
  assert.match(a, /<h2 data-part="title" id="ID\w*" class="ui-dialog__title">Rename<\/h2><p data-part="description" id="ID\w*" class="ui-dialog__description">New name<\/p><p>x<\/p>/);
  assert.match(a, /<div data-part="actions" class="ui-dialog__actions"><button [^>]*class="ui-button__root[^"]* ui-dialog__close"[^>]*data-part="close"/);
  const b = html(h(Dialog.Root, null,
    h(Dialog.Trigger, null, 'Open'),
    h(Dialog.Portal, null, h(Dialog.Backdrop), h(Dialog.Popup, null, h(Dialog.Title, null, 'Rename'), h(Dialog.Description, null, 'New name'), h('p', null, 'x'), h(Dialog.Actions, null, h(Dialog.Close, null, 'Cancel'))))));
  assert.equal(b, a, 'composed = preset');
  const seen: any[] = [];
  const c = html(h(Dialog.Root, { defaultOpen: true, className: (s: any) => (s.open ? 'is-open' : 'is-closed') },
    h(Dialog.Popup, { render: (props: any, state: any) => { seen.push(state); return h('section', props); } }, 'K')));
  assert.match(c, /class="ui-dialog__root is-open"/);
  assert.match(c, /<section data-part="popup"/);
  assert.equal(seen[0].open, true);
  assert.throws(() => html(h(Dialog.Popup)), /inside Dialog.Root/);
  assert.match(html(h(Dialog.Root, { modal: false }, h(Dialog.Popup))), /role="dialog" tabindex="-1"/, 'no aria-modal when not modal');
});

test('Dialog (React): trigger press opens, Escape and the close part close with Base UI reasons; focus returns; controlled stays', async () => {
  const { createRoot } = await import('react-dom/client');
  const { act } = await import('react');
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  const outside = document.createElement('p');
  document.body.append(outside);
  const box = document.createElement('div');
  document.body.append(box);
  const root = createRoot(box);
  const calls: any[] = [];
  await act(async () => root.render(h('div', null,
    h(Dialog, { label: 'A', trigger: 'Open A', onOpenChange: (o: boolean, d: any) => calls.push([o, d.reason]) }, h(Dialog.Close, null, 'Close')),
    h(Dialog, { label: 'B', trigger: 'Open B', open: false, onOpenChange: (o: boolean, d: any) => calls.push([o, d.reason]) }, 'y'))));
  const [a, b] = [...box.querySelectorAll('[data-ui=dialog]')] as HTMLElement[];
  const trigger = a.querySelector('[data-part=trigger]') as HTMLButtonElement;
  trigger.focus();
  await act(async () => { trigger.click(); });
  const popup = a.querySelector('[data-part=popup]')!;
  assert.ok(popup.hasAttribute('data-open'));
  assert.deepEqual(calls[0], [true, 'trigger-press']);
  assert.ok(outside.hasAttribute('inert'), 'modal: the page is inert');
  assert.ok(popup.contains(document.activeElement), 'focus moved in');
  assert.equal(popup.getAttribute('aria-labelledby'), popup.querySelector('h2')!.id);
  await act(async () => { key(document.activeElement!, 'Escape'); });
  assert.deepEqual(calls[1], [false, 'escape-key']);
  assert.ok(popup.hasAttribute('data-closed'));
  assert.ok(!outside.hasAttribute('inert'));
  assert.equal(document.activeElement, trigger, 'focus returned');
  await act(async () => { trigger.click(); });
  await act(async () => { (popup.querySelector('[data-part=close]') as HTMLButtonElement).click(); });
  assert.deepEqual(calls[3], [false, 'close-press']);
  await act(async () => { (b.querySelector('[data-part=trigger]') as HTMLButtonElement).click(); });
  assert.deepEqual(calls[4], [true, 'trigger-press'], 'reports the request');
  assert.ok(b.hasAttribute('data-closed'), 'controlled: stays closed');
  await act(async () => root.unmount());
  box.remove(); outside.remove();
});
