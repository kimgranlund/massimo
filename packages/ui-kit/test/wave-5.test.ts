// Wave 5: scroll regions, page, shells and the floating panel.
import { tick } from './setup.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadTsx } from './load-tsx.ts';
import { allocatePanes, needsDrawer } from '../dom/shell.ts';
import { clampBox, moveKey, sizeBox, snapBox } from '../dom/drag.ts';
import { resolveFloatingPanel, resolvePage, resolveScrollRegion, resolveShell } from '../tokens/geometry/resolve.ts';

await import('../components/admin-shell/admin-shell.element.ts');
await import('../components/floating-panel/floating-panel.element.ts');
const { Pane, PaneBody } = await loadTsx(new URL('../components/pane/pane.react.tsx', import.meta.url));
const { PageSurface } = await loadTsx(new URL('../components/page-surface/page-surface.react.tsx', import.meta.url));
const { ContentShell, ContentMain } = await loadTsx(new URL('../components/content-shell/content-shell.react.tsx', import.meta.url));
const { AppShell } = await loadTsx(new URL('../components/app-shell/app-shell.react.tsx', import.meta.url));
const { AdminShell } = await loadTsx(new URL('../components/admin-shell/admin-shell.react.tsx', import.meta.url));
const { FloatingPanel } = await loadTsx(new URL('../components/floating-panel/floating-panel.react.tsx', import.meta.url));
const mount = async (markup: string) => { const d = document.createElement('div'); d.innerHTML = markup; document.body.append(d); await tick(); await tick(); return d.firstElementChild as any; };
const W = { start: 240, rail: 48, end: 320, content: 480 };

test('resolvers: fixed insets and shared widths', () => {
  assert.deepEqual(resolveScrollRegion({ unit: 4 }), { bar: 48, inset: 16, gap: 8 });
  assert.equal(resolvePage('readable', { unit: 4 }).width, 640);
  assert.equal(resolvePage('full', { unit: 4 }).maxWidth, 1388);
  assert.throws(() => resolvePage('huge' as never));
  assert.equal(resolveShell({ unit: 4 }).end, 320);
  assert.equal(resolveFloatingPanel({ unit: 4 }).min, 160);
});

test('allocatePanes: end leaves first, then start falls to a rail, then closes', () => {
  const want = { start: true, end: true };
  assert.deepEqual(allocatePanes(1100, W, want, null), { start: 'inline', end: 'inline' });
  assert.deepEqual(allocatePanes(1000, W, want, null), { start: 'inline', end: 'closed' });
  assert.deepEqual(allocatePanes(600, W, want, null), { start: 'rail', end: 'closed' });
  assert.deepEqual(allocatePanes(400, W, want, null), { start: 'closed', end: 'closed' });
  assert.deepEqual(allocatePanes(400, W, want, 'start'), { start: 'drawer', end: 'closed' });
  assert.deepEqual(allocatePanes(1000, W, want, 'end'), { start: 'inline', end: 'drawer' });
  assert.deepEqual(allocatePanes(1100, W, { start: false, end: true }, null), { start: 'closed', end: 'inline' });
  assert.ok(needsDrawer(1000, W, want, 'end'));
  assert.ok(!needsDrawer(1100, W, want, 'end'));
  assert.ok(needsDrawer(400, W, want, 'start'));
  assert.ok(!needsDrawer(600, W, want, 'start'));
});

test('panel placement: clamps, snaps, sizes and reads keys', () => {
  const v = { width: 1000, height: 800, margin: 16 }, b = { x: 0, y: 0, width: 320, height: 200 };
  assert.deepEqual(clampBox({ ...b, x: 5000, y: -50 }, v), { ...b, x: 664, y: 16 });
  assert.deepEqual(snapBox('bottom-end', b, v), { ...b, x: 664, y: 584 });
  assert.deepEqual(snapBox('center', b, v), { ...b, x: 340, y: 300 });
  assert.equal(clampBox({ ...b, width: 2000 }, v).x, 16, 'too wide: the header stays reachable');
  assert.deepEqual(moveKey('ArrowRight', 16), [16, 0]);
  assert.deepEqual(moveKey('ArrowUp', 16, true), [0, -64]);
  assert.equal(moveKey('a', 16), null);
  assert.equal(sizeBox(b, -500, 0, 160, v).width, 160);
});

test('ui-admin-shell: sets its panes and makes a scrim', async () => {
  const el = await mount('<ui-admin-shell><aside data-part="start"><a href="#">Home</a></aside><main data-part="content"></main></ui-admin-shell>');
  assert.ok(el.hasAttribute('data-start'));
  assert.ok(el.querySelector(':scope > [data-part=scrim]'));
  assert.equal(typeof el.toggle, 'function');
});

test('ui-floating-panel: a body that stays mounted; show and hide report', async () => {
  const el = await mount('<ui-floating-panel label="Tools"><div data-part="header">Tools</div><div data-part="body">x</div></ui-floating-panel>');
  assert.equal(el.getAttribute('popover'), 'manual');
  assert.equal(el.getAttribute('aria-label'), 'Tools');
  const seen: boolean[] = [];
  el.addEventListener('openchange', (e: any) => seen.push(e.detail.open));
  el.show(); await tick(); el.hide(); await tick();
  assert.deepEqual(seen, [true, false]);
  el.collapsed = true; await tick();
  const body = el.querySelector('[data-part=body]');
  assert.ok(body.hidden && body.isConnected);
  assert.equal(el.querySelector('[data-part=controls] ui-button').getAttribute('aria-expanded'), 'false');
});

test('React twins carry the same hosts and parts', () => {
  const html = (n: any) => { const d = document.createElement('div'); d.innerHTML = renderToStaticMarkup(n); return d.firstElementChild!; };
  assert.equal(html(h(Pane, null, h(PaneBody))).getAttribute('data-ui'), 'pane');
  assert.equal(html(h(Pane, null, h(PaneBody))).querySelector('[data-part=body]')!.getAttribute('tabindex'), '0');
  assert.equal(html(h(PageSurface, { width: 'wide', gap: 2 })).getAttribute('width'), 'wide');
  assert.equal(html(h(ContentShell, null, h(ContentMain))).querySelector('main')!.getAttribute('data-part'), 'main');
  assert.equal(html(h(AppShell, { variant: 'editor' })).getAttribute('variant'), 'editor');
  assert.equal(html(h(AdminShell)).querySelector('[data-part=scrim]')!.getAttribute('aria-hidden'), 'true');
  assert.equal(html(h(FloatingPanel, { label: 'T', open: true })).getAttribute('popover'), 'manual');
});
