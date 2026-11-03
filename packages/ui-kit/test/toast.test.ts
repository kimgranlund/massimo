// Toast: the manager (add, upsert, update, close, remove, promise, timers and their pause), the web
// component's anatomy, ARIA, stack state, events, keys and swipe in happy-dom, the React renderer's
// server markup (the same data-* as the web component, contracts/states.json) and client behavior.
import { tick } from './setup.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createElement as h, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadTsx } from './load-tsx.ts';
import { createToastManager, type ToastManager } from '../components/toast/manager.ts';

await import('../components/toast/toast.element.ts');
const { Toast, useToastManager } = await loadTsx(new URL('../components/toast/toast.react.tsx', import.meta.url));

const NATIVE = 'input, button, select, textarea, label, fieldset, legend, option, optgroup, output, datalist, meter, progress, form';
const contract = JSON.parse(readFileSync(new URL('../contracts/states.json', import.meta.url), 'utf8'));
const STATE = new Set(Object.keys(contract.attributes));
// Structure, and the enter flag (React server markup has not painted yet; the web component has).
const SKIP = new Set(['data-ui', 'data-part', 'data-size', 'data-id', 'data-starting-style']);
const names = (el: Element | null | undefined) => [...(el?.attributes ?? [])].map((a) => a.name).filter((n) => n.startsWith('data-') && !SKIP.has(n)).sort();
const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
const key = (el: Element, k: string) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));

async function viewport(m: ToastManager, attrs = 'placement="inline"') {
  const box = document.createElement('div');
  box.innerHTML = `<ui-toast-viewport ${attrs}></ui-toast-viewport>`;
  const el = box.firstElementChild as any;
  el.manager = m;
  document.body.append(box);
  await tick(); await tick();
  return el as HTMLElement & { manager: ToastManager; toasts: unknown[] };
}
const toastsOf = (el: Element) => [...el.querySelectorAll(':scope > [data-part=toast]')] as HTMLElement[];
const part = (t: Element, p: string) => t.querySelector(`[data-part=content] > [data-part=${p}]`) as HTMLElement | null;

// ── Manager ──

test('toast manager: add (newest first), upsert by id, update, close then remove, onClose / onRemove', () => {
  const m = createToastManager();
  const seen: string[] = [];
  const off = m.subscribe(() => seen.push(m.toasts.map((t) => t.id).join(',')));
  const a = m.add({ title: 'A', timeout: 0 });
  const b = m.add({ id: 'b', title: 'B', timeout: 0, onClose: () => seen.push('close b'), onRemove: () => seen.push('remove b') });
  assert.equal(b, 'b');
  assert.deepEqual(m.toasts.map((t) => t.id), ['b', a], 'newest first');
  assert.equal(m.add({ id: 'b', title: 'B2' }), 'b');
  assert.equal(m.toasts.length, 2, 'the same id updates in place');
  assert.equal(m.toasts[0].title, 'B2');
  assert.equal(m.toasts[0].updateKey, 1);
  m.update('b', (prev) => ({ description: `${prev.title} more` }));
  assert.equal(m.toasts[0].description, 'B2 more');
  assert.equal(m.toasts[0].updateKey, 2);
  m.close('b', { reason: 'close-press' });
  assert.equal(m.toasts[0].transitionStatus, 'ending');
  assert.equal(m.toasts[0].closeReason, 'close-press');
  assert.ok(seen.includes('close b'));
  m.remove('b');
  assert.deepEqual(m.toasts.map((t) => t.id), [a]);
  assert.ok(seen.includes('remove b'));
  m.close();
  assert.equal(m.toasts[0].transitionStatus, 'ending', 'close() closes every toast');
  off();
  m.close(a);
  const m2 = createToastManager();
  m2.add({ title: 'x' });
  m2.close();
  assert.equal(m2.toasts.length, 0, 'with no renderer subscribed, a closed toast is removed at once');
});

test('toast manager: timeouts close; pause keeps the time left; promise moves loading to success or error', async () => {
  const m = createToastManager({ timeout: 40 });
  const off = m.subscribe(() => {});
  const id = m.add({ title: 'T' });
  assert.equal(m.toasts[0].timeout, 40, 'the provider default');
  m.pause('hover');
  await wait(60);
  assert.notEqual(m.toasts[0].transitionStatus, 'ending', 'paused: still open');
  m.pause('focus');
  m.resume('hover');
  await wait(60);
  assert.notEqual(m.toasts[0].transitionStatus, 'ending', 'still paused by focus');
  m.resume('focus');
  await wait(60);
  assert.equal(m.toasts.find((t) => t.id === id)!.transitionStatus, 'ending', 'closes after the time left');
  assert.equal(m.toasts[0].closeReason, 'none');
  const keep = m.add({ title: 'K', timeout: 0 });
  await wait(60);
  assert.notEqual(m.toasts.find((t) => t.id === keep)!.transitionStatus, 'ending', 'timeout 0 keeps it');

  let ok!: (v: string) => void;
  const p = m.promise(new Promise<string>((r) => { ok = r; }), { loading: 'Saving', success: (v) => ({ title: `Saved ${v}` }), error: 'Failed' });
  const loading = m.toasts[0];
  assert.deepEqual([loading.type, loading.description, loading.timeout], ['loading', 'Saving', 0]);
  ok('draft'); await p; await tick();
  const done = m.toasts.find((t) => t.id === loading.id)!;
  assert.deepEqual([done.type, done.title, done.timeout], ['success', 'Saved draft', 40]);
  const q = m.promise(Promise.reject(new Error('no')), { loading: 'L', success: 'S', error: (e) => ({ description: String((e as Error).message) }) });
  await q.catch(() => {}); await tick();
  assert.deepEqual([m.toasts[0].type, m.toasts[0].description], ['error', 'no']);
  off();
});

// ── Web component ──

test('ui-toast-viewport: region, toasts as dialogs with title, description, action and close; no native form elements', async () => {
  const m = createToastManager();
  const el = await viewport(m);
  assert.equal(el.getAttribute('role'), 'region');
  assert.equal(el.getAttribute('aria-label'), 'Notifications');
  assert.equal(el.getAttribute('aria-live'), 'polite');
  assert.equal(el.getAttribute('tabindex'), '-1');
  m.add({ title: 'Saved', description: 'Draft stored.', type: 'success', timeout: 0, actionProps: { children: 'Undo' } });
  m.add({ description: 'Second', priority: 'high', timeout: 0 });
  await tick();
  const [front, back] = toastsOf(el);
  assert.equal(front.getAttribute('role'), 'alertdialog');
  assert.equal(front.getAttribute('aria-live'), 'assertive');
  assert.equal(front.getAttribute('aria-labelledby'), null, 'no title');
  assert.equal(part(front, 'description')!.id, front.getAttribute('aria-describedby'));
  assert.equal(part(front, 'action'), null);
  assert.equal(back.getAttribute('role'), 'dialog');
  assert.equal(back.getAttribute('aria-modal'), 'false');
  assert.equal(part(back, 'title')!.tagName, 'H2');
  assert.equal(part(back, 'title')!.id, back.getAttribute('aria-labelledby'));
  assert.equal(part(back, 'description')!.tagName, 'P');
  assert.equal(part(back, 'action')!.getAttribute('role'), 'button');
  assert.equal(part(back, 'action')!.textContent, 'Undo');
  assert.equal(part(back, 'close')!.getAttribute('aria-label'), 'Close');
  assert.equal(back.getAttribute('data-type'), 'success');
  assert.equal(part(back, 'title')!.getAttribute('data-type'), 'success');
  assert.equal(front.style.getPropertyValue('--toast-index'), '0');
  assert.equal(back.style.getPropertyValue('--toast-index'), '1');
  assert.ok(back.querySelector('[data-part=content]')!.hasAttribute('data-behind'));
  assert.ok(!front.querySelector('[data-part=content]')!.hasAttribute('data-behind'));
  assert.ok(front.style.getPropertyValue('--toast-height'), 'stack variables set from layout');
  assert.ok(el.style.getPropertyValue('--toast-frontmost-height'));
  assert.equal(el.querySelectorAll(NATIVE).length, 0);
  assert.ok(el.classList.contains('ui-toast__root'));
  assert.ok(front.classList.contains('ui-toast__toast'));
  assert.ok(part(back, 'action')!.classList.contains('ui-toast__action'));
  el.parentElement!.remove();
});

test('ui-toast-viewport: limit marks older toasts data-limited and inert; hover and focus expand and pause', async () => {
  const m = createToastManager({ timeout: 30 });
  const el = await viewport(m, 'limit="2"');
  for (const t of ['a', 'b', 'c']) m.add({ id: t, title: t });
  await tick();
  const [c, b, a] = toastsOf(el);
  assert.deepEqual([c, b, a].map((x) => x.dataset.id), ['c', 'b', 'a']);
  assert.ok(a.hasAttribute('data-limited') && a.hasAttribute('inert'));
  assert.ok(!b.hasAttribute('data-limited'));
  el.dispatchEvent(new PointerEvent('pointerenter'));
  await tick();
  assert.ok(el.hasAttribute('data-expanded'));
  assert.ok(c.hasAttribute('data-expanded') && c.querySelector('[data-part=content]')!.hasAttribute('data-expanded'));
  assert.ok(m.paused, 'hover pauses the timers');
  await wait(50);
  assert.ok(m.toasts.every((t) => t.transitionStatus !== 'ending'));
  el.dispatchEvent(new PointerEvent('pointerleave'));
  await tick();
  assert.ok(!el.hasAttribute('data-expanded'));
  assert.ok(!m.paused);
  part(c, 'close')!.focus();
  await tick();
  assert.ok(el.hasAttribute('data-expanded'), 'focus expands');
  assert.ok(m.paused, 'focus pauses');
  (document.activeElement as HTMLElement).blur();
  await tick();
  assert.ok(!m.paused);
  el.parentElement!.remove();
});

test('ui-toast-viewport: openchange on add and close; close-press and Escape are cancelable; the toast leaves, then is removed', async () => {
  const m = createToastManager();
  const el = await viewport(m);
  const got: any[] = [];
  let veto = false;
  el.addEventListener('openchange', (e: any) => { got.push(e.detail); if (veto) e.preventDefault(); });
  const clicks: Event[] = [];
  m.add({ id: 'x', title: 'X', timeout: 0, actionProps: { children: 'Undo', onClick: (e: Event) => clicks.push(e) } });
  await tick();
  assert.deepEqual([got[0].open, got[0].id, got[0].reason], [true, 'x', 'none']);
  const [t] = toastsOf(el);
  key(part(t, 'action')!, 'Enter');
  assert.equal(clicks.length, 1, 'Enter presses the action');
  assert.equal(m.toasts[0].transitionStatus === 'ending', false, 'the action does not close');
  veto = true;
  part(t, 'close')!.click();
  assert.deepEqual([got[1].open, got[1].reason, got[1].event?.type], [false, 'close-press', 'click']);
  assert.notEqual(m.toasts[0].transitionStatus, 'ending', 'preventDefault keeps it');
  key(part(t, 'close')!, 'Escape');
  assert.equal(got[2].reason, 'escape-key');
  veto = false;
  key(t, 'Escape');
  await tick();
  assert.equal(got.length, 4, 'one event per close');
  assert.equal(got[3].reason, 'escape-key');
  assert.ok(t.hasAttribute('data-ending-style'));
  await wait(40);
  assert.equal(m.toasts.length, 0, 'removed after its exit');
  assert.equal(toastsOf(el).length, 0);
  m.add({ id: 'y', title: 'Y', timeout: 0 });
  await tick();
  m.close('y');
  await tick();
  assert.deepEqual([got.at(-1).open, got.at(-1).id, got.at(-1).reason], [false, 'y', 'none'], 'a script close is reported after the fact');
  el.parentElement!.remove();
});

test('ui-toast-viewport: F6 moves focus into the viewport and back; a swipe past 10u dismisses toward its direction', async () => {
  const m = createToastManager();
  const el = await viewport(m, 'swipe-direction="right"');
  const before = document.createElement('div');
  before.tabIndex = 0;
  document.body.append(before);
  before.focus();
  key(document.body, 'F6');
  assert.equal(document.activeElement, before, 'nothing to focus without toasts');
  m.add({ id: 's', title: 'S', timeout: 0 });
  await tick();
  key(before, 'F6');
  assert.equal(document.activeElement, el);
  key(el, 'F6');
  assert.equal(document.activeElement, before, 'F6 again returns focus');
  const got: any[] = [];
  el.addEventListener('openchange', (e: any) => got.push(e.detail));
  const [t] = toastsOf(el);
  const ptr = (type: string, x: number, y = 0) => t.dispatchEvent(new PointerEvent(type, { clientX: x, clientY: y, pointerId: 1, button: 0, bubbles: true }));
  ptr('pointerdown', 0); ptr('pointermove', 0, 30);
  assert.ok(!t.hasAttribute('data-swiping'), 'down is not an allowed direction here');
  ptr('pointermove', 20);
  assert.ok(t.hasAttribute('data-swiping'));
  assert.equal(t.style.getPropertyValue('--toast-swipe-movement-x'), '20px');
  ptr('pointerup', 20);
  assert.ok(!t.hasAttribute('data-swiping'));
  assert.equal(t.style.getPropertyValue('--toast-swipe-movement-x'), '0px', 'short: springs back');
  assert.equal(got.length, 0);
  ptr('pointerdown', 0); ptr('pointermove', 80); ptr('pointerup', 80);
  assert.equal(t.getAttribute('data-swipe-direction'), 'right');
  assert.deepEqual([got[0].open, got[0].reason], [false, 'swipe']);
  before.remove();
  el.parentElement!.remove();
});

// ── React ──

function ssr(el: ReactElement) {
  const box = document.createElement('div');
  box.innerHTML = renderToStaticMarkup(el);
  return box.querySelector('[data-ui]') as HTMLElement;
}
const seed = (m: ToastManager) => {
  m.add({ id: 'a', title: 'Saved', description: 'Draft stored.', type: 'success', timeout: 0, actionProps: { children: 'Undo' } });
  m.add({ id: 'b', description: 'Second', timeout: 0 });
};

test('Toast (React): the same data-* as ui-toast-viewport on host, toast, content, title, description, action and close', async () => {
  const mw = createToastManager(), mr = createToastManager();
  seed(mw); seed(mr);
  const a = await viewport(mw);
  const b = ssr(h(Toast.Provider, { toastManager: mr }, h(Toast.Viewport, { placement: 'inline' })));
  const allowed = contract.components['ui-toast-viewport'];
  const P: [string, string][] = [['host', ':scope'], ['toast', '[data-part=toast]'], ['content', '[data-part=content]'], ['title', '[data-part=title]'], ['description', '[data-part=description]'], ['action', '[data-part=action]'], ['close', '[data-part=close]']];
  for (const [label, s] of P) {
    const ea = s === ':scope' ? [a] : [...a.querySelectorAll(s)], eb = s === ':scope' ? [b] : [...b.querySelectorAll(s)];
    assert.equal(ea.length, eb.length, `${label}: same count`);
    ea.forEach((x, k) => {
      assert.deepEqual(names(x), names(eb[k]), `${label}[${k}]: web component vs React`);
      for (const n of names(x)) {
        assert.ok(STATE.has(n), `${label}: ${n} is in the contract`);
        assert.ok((allowed[label] ?? []).includes(n), `${label}: ${n} is listed for it`);
      }
      assert.deepEqual([...x.classList].filter((c) => c.startsWith('ui-')), [...eb[k].classList].filter((c) => c.startsWith('ui-')), `${label}[${k}]: recipe classes`);
    });
  }
  assert.equal(b.getAttribute('role'), 'region');
  assert.equal(b.querySelector('[data-part=action]')!.tagName, 'BUTTON');
  assert.equal(b.querySelector('[data-part=title]')!.tagName, 'H2');
  assert.ok(b.querySelector('[data-part=toast]')!.hasAttribute('data-starting-style'), 'just mounted');
  a.parentElement!.remove();
});

test('Toast (React): the composed parts render the same markup as the default list; parts outside their Root throw', () => {
  const m1 = createToastManager(), m2 = createToastManager();
  seed(m1); seed(m2);
  const norm = (s: string) => s.replace(/_R_[a-z0-9]+_/gi, 'ID');
  function List() {
    const { toasts } = useToastManager();
    return toasts.map((t: any) => h(Toast.Root, { key: t.id, toast: t }, h(Toast.Content, null, h(Toast.Title), h(Toast.Description), t.actionProps ? h(Toast.Action) : null, h(Toast.Close))));
  }
  const a = norm(renderToStaticMarkup(h(Toast.Provider, { toastManager: m1 }, h(Toast.Viewport, null))));
  const b = norm(renderToStaticMarkup(h(Toast.Provider, { toastManager: m2 }, h(Toast.Viewport, null, h(List)))));
  assert.equal(a, b);
  const c = renderToStaticMarkup(h(Toast.Provider, { toastManager: m1 }, h(Toast.Viewport, null, h(Toast.Root, { toast: m1.toasts[0], className: (s: any) => (s.type ? `t-${s.type}` : 'none') }, h(Toast.Content, null, h(Toast.Title, null, 'Custom'))))));
  assert.match(c, /class="ui-toast__toast[^"]* none"/);
  assert.match(c, /<h2[^>]*>Custom<\/h2>/);
  assert.throws(() => renderToStaticMarkup(h(Toast.Viewport)), /inside Toast.Provider/);
  assert.equal(typeof Toast.useToastManager, 'function');
});

test('Toast (React): useToastManager adds toasts; the close fires onOpenChange (close-press) and removes the toast', async () => {
  const { createRoot } = await import('react-dom/client');
  const { act } = await import('react');
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  const box = document.createElement('div');
  document.body.append(box);
  const root = createRoot(box);
  let api: any;
  function Grab() { api = useToastManager(); return null; }
  const changes: any[] = [];
  await act(async () => root.render(h(Toast, { placement: 'inline', onOpenChange: (open: boolean, d: any) => changes.push([open, d.reason]) }, h(Grab))));
  await act(async () => { api.add({ id: 'r', title: 'Hello', timeout: 0 }); });
  const t = box.querySelector('[data-part=toast]') as HTMLElement;
  assert.ok(t);
  assert.equal(t.querySelector('[data-part=title]')!.textContent, 'Hello');
  assert.deepEqual(changes, [[true, 'none']]);
  await act(async () => { (box.querySelector('[data-part=close]') as HTMLElement).click(); });
  assert.deepEqual(changes[1], [false, 'close-press']);
  assert.ok(t.hasAttribute('data-ending-style'));
  await act(async () => { await wait(40); });
  assert.equal(box.querySelector('[data-part=toast]'), null, 'removed after its exit');
  assert.equal(api.toasts.length, 0);
  await act(async () => root.unmount());
  box.remove();
});
