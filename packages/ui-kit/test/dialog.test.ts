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

// ── Alert dialog ──

await import('../components/alert-dialog/alert-dialog.element.ts');
const { AlertDialog } = await loadTsx(new URL('../components/alert-dialog/alert-dialog.react.tsx', import.meta.url));
const ALERT = '<ui-alert-dialog label="Delete project?" description="This cannot be undone."><ui-button data-part="trigger">Delete…</ui-button><div data-part="actions"><ui-button variant="primary">Delete</ui-button><ui-button data-part="close">Cancel</ui-button></div></ui-alert-dialog>';

test('alert dialog: role=alertdialog, always modal, focus on the least destructive action, no outside-press dismissal', async () => {
  const outside = document.createElement('p');
  document.body.append(outside);
  const el = await wc(ALERT, 'ui-alert-dialog') as any;
  const p = el.popup as HTMLElement;
  assert.equal(p.getAttribute('role'), 'alertdialog');
  assert.equal(p.getAttribute('aria-modal'), 'true');
  assert.ok(p.classList.contains('ui-alert-dialog__popup') && !p.classList.contains('ui-dialog__popup'));
  assert.ok(el.classList.contains('ui-alert-dialog__root'));
  assert.equal(el.querySelector(NATIVE), null, 'no native form elements');
  el.setAttribute('modal', 'false');
  el.setAttribute('disable-pointer-dismissal', '');
  const got: string[] = [];
  el.addEventListener('openchange', (e: CustomEvent) => got.push(e.detail.reason));
  el.trigger.focus();
  el.trigger.click(); await tick();
  assert.equal(el.open, true);
  assert.ok(outside.hasAttribute('inert'), 'modal whatever the modal attribute');
  assert.equal(document.activeElement?.textContent, 'Cancel', 'focus starts on the close part, not the first button');
  press(el.backdrop); await tick();
  assert.equal(el.open, true, 'an outside press does not close it');
  key(document.activeElement!, 'Escape'); await tick();
  assert.equal(el.open, false);
  assert.equal(document.activeElement, el.trigger, 'focus returned');
  el.open = true; await tick();
  (p.querySelector('[data-part=close]') as HTMLElement).click(); await tick();
  assert.deepEqual(got, ['trigger-press', 'escape-key', 'close-press']);
  el.parentElement.remove(); outside.remove();
});

test('AlertDialog (React): the same data-* as ui-alert-dialog; role alertdialog; composed parts render the preset; client: no outside press, focus on Close', async () => {
  const P: Part[] = [['host', ':scope'], ['trigger', '[data-part=trigger]'], ['backdrop', '[data-part=backdrop]'], ['popup', '[data-part=popup]']];
  const bare = '<ui-alert-dialog label="Delete project?" description="This cannot be undone."><ui-button data-part="trigger">Delete…</ui-button></ui-alert-dialog>';
  await sameDialog('ui-alert-dialog', bare, h(AlertDialog, { label: 'Delete project?', description: 'This cannot be undone.', trigger: 'Delete…' }), P);
  await sameDialog('ui-alert-dialog', bare.replace('<ui-alert-dialog', '<ui-alert-dialog open'), h(AlertDialog, { label: 'Delete project?', description: 'x', trigger: 'Delete…', defaultOpen: true }), P);
  const a = html(h(AlertDialog, { label: 'Delete?', trigger: 'Delete' }, h(AlertDialog.Actions, null, h(AlertDialog.Close, null, 'Cancel'))));
  assert.match(a, /^<div data-ui="alert-dialog" data-closed="" class="ui-alert-dialog__root">/);
  assert.match(a, /<div data-part="popup" id="ID\w*" role="alertdialog" aria-modal="true" tabindex="-1" popover="manual" data-closed="" class="ui-alert-dialog__popup">/);
  const b = html(h(AlertDialog.Root, null, h(AlertDialog.Trigger, null, 'Delete'), h(AlertDialog.Portal, null, h(AlertDialog.Backdrop), h(AlertDialog.Popup, null, h(AlertDialog.Title, null, 'Delete?'), h(AlertDialog.Actions, null, h(AlertDialog.Close, null, 'Cancel'))))));
  assert.equal(b, a, 'composed = preset');
  const { createRoot } = await import('react-dom/client');
  const { act } = await import('react');
  const box = document.createElement('div');
  document.body.append(box);
  const root = createRoot(box);
  const calls: string[] = [];
  await act(async () => root.render(h(AlertDialog, { label: 'Delete?', trigger: 'Delete', onOpenChange: (_o: boolean, d: any) => calls.push(d.reason) },
    h(AlertDialog.Actions, null, h('button', { type: 'button' }, 'Delete'), h(AlertDialog.Close, null, 'Cancel')))));
  await act(async () => { (box.querySelector('[data-part=trigger]') as HTMLButtonElement).click(); });
  assert.equal(document.activeElement?.textContent, 'Cancel');
  await act(async () => { press(box.querySelector('[data-part=backdrop]')!); });
  assert.ok(box.querySelector('[data-part=popup]')!.hasAttribute('data-open'), 'an outside press does not close it');
  await act(async () => { key(document.activeElement!, 'Escape'); });
  assert.deepEqual(calls, ['trigger-press', 'escape-key']);
  await act(async () => root.unmount());
  box.remove();
});

// ── Drawer ──

await import('../components/drawer/drawer.element.ts');
const { Drawer } = await loadTsx(new URL('../components/drawer/drawer.react.tsx', import.meta.url));
const { createSwipeDismiss } = await import('../dom/swipe.ts');
const DRAWER = '<ui-drawer side="right" label="Filters" description="Narrow the list."><ui-button data-part="trigger">Filters</ui-button><p>Body</p><div data-part="actions"><ui-button data-part="close">Done</ui-button></div></ui-drawer>';
const ptr = (el: EventTarget, type: string, x: number, y: number, t?: number) => {
  const e = new PointerEvent(type, { bubbles: true, cancelable: true, clientX: x, clientY: y, pointerId: 1, button: 0 } as any);
  // timeStamp is not an init field: set it so a test controls the release speed.
  if (t !== undefined) Object.defineProperty(e, 'timeStamp', { value: t });
  return el.dispatchEvent(e);
};

test('drawer (headless): a drag toward the edge moves the popup (--drawer-swipe-movement-*), a release past the threshold swipes, a short one springs back', () => {
  const el = document.createElement('div');
  document.body.append(el);
  Object.defineProperty(el, 'offsetWidth', { value: 300 });
  const swiped: Event[] = [];
  const s = createSwipeDismiss({ el: () => el, direction: () => 'right', onSwipe: (e) => swiped.push(e), velocity: Infinity });
  s.attach();
  ptr(el, 'pointerdown', 100, 100); ptr(el, 'pointermove', 103, 100);
  assert.ok(!el.hasAttribute('data-swiping'), 'within the slop: still a press');
  ptr(el, 'pointermove', 160, 102);
  assert.ok(el.hasAttribute('data-swiping'));
  assert.equal(el.style.getPropertyValue('--drawer-swipe-movement-x'), '60px');
  assert.equal(el.style.getPropertyValue('--drawer-swipe-movement-y'), '0px');
  ptr(el, 'pointermove', 80, 102);
  assert.equal(el.style.getPropertyValue('--drawer-swipe-movement-x'), '0px', 'never past its open position');
  ptr(el, 'pointermove', 150, 102); ptr(el, 'pointerup', 150, 102);
  assert.equal(swiped.length, 0, '50px of 300: springs back');
  assert.ok(!el.hasAttribute('data-swiping') && el.style.getPropertyValue('--drawer-swipe-movement-x') === '');
  ptr(el, 'pointerdown', 100, 100); ptr(el, 'pointermove', 250, 100); ptr(el, 'pointerup', 250, 100);
  assert.equal(swiped.length, 1, '150px of 300 (past 40%): swiped');
  assert.ok(el.hasAttribute('data-swipe-dismiss'));
  s.reset();
  assert.ok(!el.hasAttribute('data-swipe-dismiss'));
  // A drag along the other axis, or from a [data-swipe-ignore] element, does not swipe.
  el.innerHTML = '<span data-swipe-ignore>x</span>';
  ptr(el.firstChild!, 'pointerdown', 100, 100); ptr(el, 'pointermove', 250, 100);
  assert.ok(!el.hasAttribute('data-swiping'));
  ptr(el, 'pointerup', 250, 100);
  ptr(el, 'pointerdown', 100, 100); ptr(el, 'pointermove', 104, 160); ptr(el, 'pointermove', 250, 160);
  assert.ok(!el.hasAttribute('data-swiping'), 'a vertical drag is not a swipe to the right');
  s.detach(); el.remove();
});

test('drawer: side variant and data-swipe-direction; the dialog behavior; a swipe closes it with reason swipe', async () => {
  const el = await wc(DRAWER, 'ui-drawer') as any;
  const p = el.popup as HTMLElement;
  assert.equal(p.getAttribute('role'), 'dialog');
  assert.equal(p.getAttribute('data-swipe-direction'), 'right');
  assert.ok(p.classList.contains('ui-drawer__popup') && p.classList.contains('ui-drawer__popup--side_right'));
  assert.ok(el.classList.contains('ui-drawer__root--side_right'));
  assert.equal(el.querySelector(NATIVE), null, 'no native form elements');
  el.side = 'top'; await tick();
  assert.equal(p.getAttribute('data-swipe-direction'), 'up');
  assert.ok(p.classList.contains('ui-drawer__popup--side_top') && !p.classList.contains('ui-drawer__popup--side_right'));
  el.side = 'nowhere'; await tick();
  assert.equal(p.getAttribute('data-swipe-direction'), 'down', 'unknown: bottom');
  const got: string[] = [];
  el.addEventListener('openchange', (e: CustomEvent) => got.push(e.detail.reason));
  el.trigger.click(); await tick();
  assert.equal(el.open, true);
  assert.equal(p.getAttribute('aria-modal'), 'true');
  ptr(p, 'pointerdown', 10, 10); ptr(p, 'pointermove', 10, 200); ptr(p, 'pointerup', 10, 200);
  await tick();
  assert.equal(el.open, false);
  assert.deepEqual(got, ['trigger-press', 'swipe']);
  el.open = true; await tick();
  assert.ok(!p.hasAttribute('data-swipe-dismiss'), 'reopening clears the swipe');
  press(el.backdrop); await tick();
  assert.equal(el.open, false);
  assert.equal(got.at(-1), 'outside-press');
  el.parentElement.remove();
});

test('Drawer (React): the same data-* as ui-drawer; side classes; composed parts render the preset; a swipe calls onOpenChange(false, { reason: swipe })', async () => {
  const P: Part[] = [['host', ':scope'], ['trigger', '[data-part=trigger]'], ['backdrop', '[data-part=backdrop]'], ['popup', '[data-part=popup]']];
  const bare = '<ui-drawer side="left" label="Menu"><ui-button data-part="trigger">Menu</ui-button></ui-drawer>';
  await sameDialog('ui-drawer', bare, h(Drawer, { side: 'left', label: 'Menu', trigger: 'Menu' }), P);
  await sameDialog('ui-drawer', bare.replace('<ui-drawer', '<ui-drawer open'), h(Drawer, { side: 'left', label: 'Menu', trigger: 'Menu', defaultOpen: true }), P);
  const a = html(h(Drawer, { label: 'Menu', trigger: 'Menu' }, 'x'));
  assert.match(a, /^<div data-ui="drawer" data-closed="" class="ui-drawer__root ui-drawer__root--side_bottom">/);
  assert.match(a, /<div data-part="popup" id="ID\w*" role="dialog" aria-modal="true" tabindex="-1" popover="manual" data-closed="" data-swipe-direction="down" class="ui-drawer__popup ui-drawer__popup--side_bottom">/);
  const b = html(h(Drawer.Root, null, h(Drawer.Trigger, null, 'Menu'), h(Drawer.Portal, null, h(Drawer.Backdrop), h(Drawer.Popup, null, h(Drawer.Title, null, 'Menu'), 'x'))));
  assert.equal(b, a, 'composed = preset');
  const { createRoot } = await import('react-dom/client');
  const { act } = await import('react');
  const box = document.createElement('div');
  document.body.append(box);
  const root = createRoot(box);
  const calls: any[] = [];
  await act(async () => root.render(h(Drawer, { side: 'right', label: 'Filters', trigger: 'Filters', onOpenChange: (o: boolean, d: any) => calls.push([o, d.reason]) }, h(Drawer.Close, null, 'Done'))));
  await act(async () => { (box.querySelector('[data-part=trigger]') as HTMLButtonElement).click(); });
  const p = box.querySelector('[data-part=popup]') as HTMLElement;
  assert.ok(p.hasAttribute('data-open'));
  await act(async () => { ptr(p, 'pointerdown', 10, 10); ptr(p, 'pointermove', 200, 10); ptr(p, 'pointerup', 200, 10); });
  assert.deepEqual(calls, [[true, 'trigger-press'], [false, 'swipe']]);
  assert.ok(p.hasAttribute('data-closed'));
  await act(async () => root.unmount());
  box.remove();
});

test('drawer snap points (headless): parse, extents, nearest; a drag moves both ways and settles on the nearest point or dismisses', async () => {
  const { parseSnapPoints, snapExtent, nearestSnap } = await import('../dom/swipe.ts');
  assert.deepEqual(parseSnapPoints('0.4, 1'), [0.4, 1]);
  assert.deepEqual(parseSnapPoints('148px, 20rem'), ['148px', '20rem']);
  assert.deepEqual(parseSnapPoints(''), []);
  assert.equal(snapExtent(0.5, 800, 600), 400, 'a fraction of the viewport');
  assert.equal(snapExtent(1, 800, 600), 600, 'at most the sheet');
  assert.equal(snapExtent('148px', 800, 600), 148);
  assert.equal(snapExtent('10rem', 800, 600, 16), 160);
  assert.equal(snapExtent(200, 800, 600), 200, 'a px number');
  assert.ok(Number.isNaN(snapExtent('auto', 800, 600)));
  assert.equal(nearestSnap([240, 600], 500), 1);
  assert.equal(nearestSnap([240, 600], 300), 0);
  const el = document.createElement('div');
  document.body.append(el);
  let index = 0;
  const snapped: number[] = [], swiped: Event[] = [];
  const s = createSwipeDismiss({
    el: () => el, direction: () => 'down', onSwipe: (e) => swiped.push(e), velocity: Infinity,
    snap: { extents: () => [240, 600], index: () => index, onSnap: (i) => { snapped.push(i); index = i; } },
  });
  s.attach();
  ptr(el, 'pointerdown', 100, 500, 0); ptr(el, 'pointermove', 100, 300, 1000);
  assert.equal(el.style.getPropertyValue('--drawer-swipe-movement-y'), '-200px', 'drags outward toward a larger point');
  ptr(el, 'pointermove', 100, 0, 2000);
  assert.equal(el.style.getPropertyValue('--drawer-swipe-movement-y'), '-360px', 'no further than the largest point');
  ptr(el, 'pointerup', 100, 0, 3000);
  assert.deepEqual(snapped, [1], 'settles on the full point');
  ptr(el, 'pointerdown', 100, 100, 4000); ptr(el, 'pointermove', 100, 200, 5000); ptr(el, 'pointerup', 100, 200, 6000);
  assert.deepEqual(snapped, [1], '100px down from 600: stays');
  ptr(el, 'pointerdown', 100, 100, 7000); ptr(el, 'pointermove', 100, 500, 8000); ptr(el, 'pointerup', 100, 500, 9000);
  assert.deepEqual(snapped, [1, 0], '400px down: the smaller point');
  assert.equal(swiped.length, 0);
  ptr(el, 'pointerdown', 100, 100, 10000); ptr(el, 'pointermove', 100, 250, 11000); ptr(el, 'pointerup', 100, 250, 12000);
  assert.equal(swiped.length, 1, 'below half the smallest point: dismissed');
  s.detach(); el.remove();
});

test('drawer snap points: the sheet rests at its point (--drawer-snap-y); a swipe settles on another and fires snappointchange', async () => {
  const el = await wc('<ui-drawer label="Sheet" snap-points="0.25, 1"><p>Body</p></ui-drawer>', 'ui-drawer') as any;
  const p = el.popup as HTMLElement;
  Object.defineProperty(p, 'offsetHeight', { value: 600, configurable: true });
  const vh = window.innerHeight, small = Math.min(600, 0.25 * vh), big = Math.min(600, vh);
  const got: any[] = [];
  el.addEventListener('snappointchange', (e: CustomEvent) => got.push([e.detail.value, e.detail.reason]));
  el.open = true; await tick();
  assert.equal(p.style.getPropertyValue('--drawer-snap-y'), `${600 - small}px`, 'resting at the first point');
  ptr(p, 'pointerdown', 10, 500, 0); ptr(p, 'pointermove', 10, 500 - (big - small), 1000); ptr(p, 'pointerup', 10, 500 - (big - small), 2000);
  await tick();
  assert.deepEqual(got, [[1, 'swipe']]);
  assert.equal(el.getAttribute('snap-point'), '1');
  assert.equal(p.style.getPropertyValue('--drawer-snap-y'), `${600 - big}px`);
  assert.equal(el.open, true);
  el.snapPoint = '0.25'; await tick();
  assert.equal(p.style.getPropertyValue('--drawer-snap-y'), `${600 - small}px`, 'setting snap-point moves it');
  el.parentElement.remove();
});

test('Drawer (React): snapPoints rest the sheet; a swipe calls onSnapPointChange; snapPoint is controllable', async () => {
  const { createRoot } = await import('react-dom/client');
  const { act } = await import('react');
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  const box = document.createElement('div');
  document.body.append(box);
  const root = createRoot(box);
  const got: any[] = [];
  const proto = (globalThis as any).HTMLElement.prototype, had = Object.getOwnPropertyDescriptor(proto, 'offsetHeight');
  Object.defineProperty(proto, 'offsetHeight', { configurable: true, get() { return this.getAttribute?.('data-part') === 'popup' ? 600 : 0; } });
  try {
    const vh = window.innerHeight, small = Math.min(600, 0.25 * vh), big = Math.min(600, vh);
    await act(async () => root.render(h(Drawer, { label: 'Sheet', defaultOpen: true, snapPoints: [0.25, 1], onSnapPointChange: (v: any, d: any) => got.push([v, d.reason]) }, h('p', null, 'Body'))));
    const p = document.querySelector('[data-ui=drawer] [data-part=popup], [data-part=popup][class*=ui-drawer]') as HTMLElement;
    assert.ok(p);
    assert.equal(p.style.getPropertyValue('--drawer-snap-y'), `${600 - small}px`);
    await act(async () => { ptr(p, 'pointerdown', 10, 500, 0); ptr(p, 'pointermove', 10, 500 - (big - small), 1000); ptr(p, 'pointerup', 10, 500 - (big - small), 2000); });
    assert.deepEqual(got, [[1, 'swipe']]);
    assert.equal(p.style.getPropertyValue('--drawer-snap-y'), `${600 - big}px`, 'uncontrolled: it moves to the new point');
    await act(async () => root.render(h(Drawer, { label: 'Sheet', defaultOpen: true, snapPoints: [0.25, 1], snapPoint: 0.25 }, h('p', null, 'Body'))));
    assert.equal(p.style.getPropertyValue('--drawer-snap-y'), `${600 - small}px`, 'controlled snapPoint wins');
    await act(async () => root.unmount());
  } finally {
    if (had) Object.defineProperty(proto, 'offsetHeight', had); else delete proto.offsetHeight;
    box.remove();
  }
});

test('drawer snap points (headless): a flick goes to the next point in its direction; toward the edge from the smallest it dismisses', () => {
  const el = document.createElement('div');
  document.body.append(el);
  let index = 1;
  const snapped: number[] = [], swiped: Event[] = [];
  const s = createSwipeDismiss({
    el: () => el, direction: () => 'down', onSwipe: (e) => swiped.push(e), velocity: 0.5,
    snap: { extents: () => [200, 400, 600], index: () => index, onSnap: (i) => { snapped.push(i); index = i; } },
  });
  s.attach();
  // From 600, a fast 60px flick down (2 px/ms): the next point below, 400 (not the nearest, 600).
  index = 2;
  ptr(el, 'pointerdown', 0, 0, 100); ptr(el, 'pointermove', 0, 30, 110); ptr(el, 'pointermove', 0, 60, 125); ptr(el, 'pointerup', 0, 60, 126);
  assert.deepEqual(snapped, [1], 'a flick down from the largest point stops at the next one');
  // From 200 (the smallest), a flick down dismisses.
  index = 0;
  ptr(el, 'pointerdown', 0, 0, 200); ptr(el, 'pointermove', 0, 30, 210); ptr(el, 'pointermove', 0, 60, 225); ptr(el, 'pointerup', 0, 60, 226);
  assert.equal(swiped.length, 1);
  // From 200, a flick up: the next point above, 400.
  index = 0; snapped.length = 0;
  ptr(el, 'pointerdown', 0, 100, 300); ptr(el, 'pointermove', 0, 70, 310); ptr(el, 'pointermove', 0, 40, 325); ptr(el, 'pointerup', 0, 40, 326);
  assert.deepEqual(snapped, [1]);
  s.detach(); el.remove();
});
