// ui-scroll-area and React ScrollArea (Base UI ScrollArea): the generated and the authored anatomy,
// Base UI's overflow and scrolling data-* and CSS variables from a measured viewport (happy-dom has
// no layout, so the sizes are stubbed), the thumb's length and offset with the geometry minimum,
// track press and thumb drag, the edge threshold; React renders the same parts, classes and data-*.
import { tick } from './setup.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadTsx } from './load-tsx.ts';

await import('../components/scroll-area/scroll-area.element.ts');
const { ScrollArea } = await loadTsx(new URL('../components/scroll-area/scroll-area.react.tsx', import.meta.url));

const NATIVE = 'input, button, select, textarea, label, fieldset, legend, option, optgroup, output, datalist, meter, progress, form';
async function mount(html: string) {
  const d = document.createElement('div');
  d.innerHTML = html;
  document.body.append(d);
  await tick(); await tick();
  return d;
}
/** Give an element layout numbers happy-dom does not compute. */
function size(el: Element, o: Record<string, number>) {
  for (const [k, v] of Object.entries(o)) Object.defineProperty(el, k, { configurable: true, value: v, writable: true });
}
const dataNames = (el: Element | null) => [...(el?.attributes ?? [])].map((a) => a.name).filter((n) => n.startsWith('data-') && !['data-ui', 'data-part', 'data-size'].includes(n)).sort();
const parts = (root: Element) => [root, ...root.querySelectorAll('[data-part=viewport], [data-part=content], [data-part=scrollbar], [data-part=thumb], [data-part=corner]')];
const pointer = (el: Element, type: string, o: Record<string, number>) => el.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 1, button: 0, ...o }));

/** A preset area with a 100px-high viewport over 400px of content and a 100px vertical track. */
async function tall() {
  const d = await mount('<ui-scroll-area><p>Long content</p></ui-scroll-area>');
  const sa = d.firstElementChild as any, vp = sa.viewport as HTMLElement;
  const [y, x] = sa.querySelectorAll('[data-part=scrollbar]');
  size(vp, { scrollHeight: 400, clientHeight: 100, scrollWidth: 200, clientWidth: 200, scrollTop: 0, scrollLeft: 0 });
  size(y, { clientHeight: 100, clientWidth: 8 });
  y.getBoundingClientRect = () => ({ top: 0, left: 192, right: 200, bottom: 100, width: 8, height: 100 }) as DOMRect;
  sa.sync();
  return { d, sa, vp, x, y };
}

test('ui-scroll-area: the preset generates viewport › content, two scrollbars with thumbs and the corner; recipe classes; no native elements', async () => {
  const d = await mount('<ui-scroll-area><p id="t">Text</p></ui-scroll-area>');
  const sa = d.firstElementChild as any;
  assert.equal(sa.querySelector(NATIVE), null);
  assert.deepEqual([...sa.children].map((c: Element) => c.getAttribute('data-part')), ['viewport', 'scrollbar', 'scrollbar', 'corner']);
  const content = sa.querySelector(':scope > [data-part=viewport] > [data-part=content]');
  assert.equal(content.querySelector('#t')?.textContent, 'Text', 'children are the content');
  const bars = sa.querySelectorAll('[data-part=scrollbar]');
  assert.deepEqual([...bars].map((b: Element) => b.getAttribute('data-orientation')), ['vertical', 'horizontal']);
  for (const b of bars) {
    assert.equal(b.getAttribute('aria-hidden'), 'true');
    assert.ok(b.querySelector(':scope > [data-part=thumb]')?.classList.contains('ui-scroll-area__thumb'));
    assert.ok(b.classList.contains('ui-scroll-area__scrollbar'));
    assert.ok(b.hidden, 'no overflow: the bar is hidden');
  }
  assert.ok(sa.classList.contains('ui-scroll-area__root') && sa.viewport.classList.contains('ui-scroll-area__viewport') && content.classList.contains('ui-scroll-area__content'));
  assert.equal(sa.viewport.getAttribute('role'), 'presentation');
  assert.ok(!sa.viewport.hasAttribute('tabindex'), 'not focusable while nothing overflows');
  d.remove();
});

test('ui-scroll-area: overflow data-* and CSS variables follow the viewport; the thumb has the track ratio, at least 4u', async () => {
  const { d, sa, vp, x, y } = await tall();
  for (const el of [sa, vp, y]) {
    assert.ok(el.hasAttribute('data-has-overflow-y') && el.hasAttribute('data-overflow-y-end') && !el.hasAttribute('data-overflow-y-start'), el.getAttribute('data-part') ?? 'root');
    assert.ok(!el.hasAttribute('data-has-overflow-x'));
  }
  assert.ok(!y.hidden && x.hidden, 'only the overflowing axis shows its bar');
  assert.equal(vp.getAttribute('tabindex'), '0');
  assert.equal(y.style.getPropertyValue('--scroll-area-thumb-height'), '25px', 'track 100 × 100 / 400');
  assert.equal(y.style.getPropertyValue('--scroll-area-thumb-offset'), '0px');
  assert.equal(vp.style.getPropertyValue('--scroll-area-overflow-y-end'), '300px');
  assert.equal(sa.style.getPropertyValue('--scroll-area-corner-height'), '0px');
  assert.ok(sa.querySelector('[data-part=corner]').hidden);
  // Scroll to the end: start set, end cleared, the thumb at the track's end, data-scrolling while scrolling.
  vp.scrollTop = 300;
  vp.dispatchEvent(new Event('scroll'));
  assert.ok(sa.hasAttribute('data-overflow-y-start') && !sa.hasAttribute('data-overflow-y-end'));
  assert.ok(sa.hasAttribute('data-scrolling') && y.querySelector('[data-part=thumb]').hasAttribute('data-scrolling'));
  assert.equal(y.style.getPropertyValue('--scroll-area-thumb-offset'), '75px');
  // A tiny ratio keeps the 4u minimum (unit 4 → 16px).
  size(vp, { scrollHeight: 10000 });
  sa.sync();
  assert.equal(y.style.getPropertyValue('--scroll-area-thumb-height'), '16px');
  // Both axes: the corner shows and takes the 2u thickness.
  size(vp, { scrollWidth: 600, scrollHeight: 400 });
  sa.sync();
  assert.ok(!x.hidden && !sa.querySelector('[data-part=corner]').hidden);
  assert.equal(sa.style.getPropertyValue('--scroll-area-corner-width'), '8px');
  d.remove();
});

test('ui-scroll-area: a press on the track centers the thumb under it; dragging the thumb scrolls along the track', async () => {
  const { d, vp, y } = await tall();
  pointer(y, 'pointerdown', { clientY: 50 });
  assert.equal(vp.scrollTop, 150, '(50 − 25/2) / (100 − 25) × 300');
  const thumb = y.querySelector('[data-part=thumb]')!;
  pointer(thumb, 'pointerdown', { clientY: 10 });
  pointer(y, 'pointermove', { clientY: 25 });
  assert.equal(vp.scrollTop, 210, '150 + 15 / 75 × 300');
  pointer(y, 'pointerup', { clientY: 25 });
  pointer(y, 'pointermove', { clientY: 90 });
  assert.equal(vp.scrollTop, 210, 'released: no more dragging');
  d.remove();
});

test('ui-scroll-area: overflow-edge-threshold delays the edge attributes; authored parts are used as written', async () => {
  const { d, sa, vp } = await tall();
  sa.overflowEdgeThreshold = 10;
  vp.scrollTop = 5;
  sa.sync();
  assert.ok(!sa.hasAttribute('data-overflow-y-start'), 'within the threshold');
  vp.scrollTop = 20;
  sa.sync();
  assert.ok(sa.hasAttribute('data-overflow-y-start'));
  d.remove();
  const a = await mount('<ui-scroll-area><div data-part="viewport" id="v"><div data-part="content">x</div></div><div data-part="scrollbar" data-orientation="horizontal" keep-mounted></div></ui-scroll-area>');
  const s = a.firstElementChild as any;
  assert.equal(s.viewport.id, 'v');
  assert.deepEqual([...s.children].map((c: Element) => c.getAttribute('data-part')), ['viewport', 'scrollbar'], 'no generated parts');
  const bar = s.querySelector('[data-part=scrollbar]');
  assert.ok(bar.querySelector('[data-part=thumb]'), 'a scrollbar without a thumb gets one');
  assert.ok(!bar.hidden, 'keep-mounted shows it without overflow');
  assert.ok(s.querySelector('[data-part=content]').classList.contains('ui-scroll-area__content'));
  a.remove();
});

test('React ScrollArea: the preset renders Root › Viewport › Content, two Scrollbars with Thumbs and the Corner; composed = preset', () => {
  const out = renderToStaticMarkup(h(ScrollArea, { style: { height: 100 } }, h('p', {}, 'Text')));
  assert.match(out, /^<div data-ui="scroll-area" class="ui-scroll-area__root" style="height:100px"><div data-part="viewport" role="presentation" class="ui-scroll-area__viewport"><div data-part="content" role="presentation" class="ui-scroll-area__content"><p>Text<\/p><\/div><\/div>/);
  assert.match(out, /<div data-part="scrollbar" hidden="" aria-hidden="true" data-orientation="vertical" class="ui-scroll-area__scrollbar"><div data-part="thumb" data-orientation="vertical" class="ui-scroll-area__thumb"><\/div><\/div>/);
  assert.match(out, /<div data-part="corner" hidden="" class="ui-scroll-area__corner"><\/div><\/div>$/);
  const S = ScrollArea;
  const composed = renderToStaticMarkup(h(S.Root, { style: { height: 100 } },
    h(S.Viewport, {}, h(S.Content, {}, h('p', {}, 'Text'))),
    h(S.Scrollbar, { orientation: 'vertical' }, h(S.Thumb)), h(S.Scrollbar, { orientation: 'horizontal' }, h(S.Thumb)), h(S.Corner)));
  assert.equal(composed, out);
  assert.match(renderToStaticMarkup(h(S.Root, {}, h(S.Viewport), h(S.Scrollbar, { keepMounted: true, className: (s: any) => `o-${s.orientation}` }, h(S.Thumb)))), /data-part="scrollbar" aria-hidden="true" keep-mounted="" data-orientation="vertical" class="ui-scroll-area__scrollbar o-vertical"/);
});

test('state parity: every part carries the same data-* in both renderers (before overflow is measured)', async () => {
  const contract = JSON.parse(readFileSync(new URL('../contracts/states.json', import.meta.url), 'utf8')).components['ui-scroll-area'];
  const d = await mount('<ui-scroll-area><p>Text</p></ui-scroll-area>');
  const box = document.createElement('div');
  box.innerHTML = renderToStaticMarkup(h(ScrollArea, {}, h('p', {}, 'Text')));
  const pa = parts(d.firstElementChild!), pb = parts(box.firstElementChild!);
  assert.equal(pa.length, pb.length);
  pa.forEach((x, i) => {
    assert.deepEqual(dataNames(x), dataNames(pb[i]), `${x.getAttribute('data-part') ?? 'root'}`);
    assert.equal((x as HTMLElement).hidden, (pb[i] as HTMLElement).hidden, `${x.getAttribute('data-part') ?? 'root'} hidden`);
  });
  // Measured: every attribute the web component sets is in the contract.
  const { d: t, sa } = await tall();
  const key = (el: Element) => ({ viewport: 'viewport', content: 'content', scrollbar: 'scrollbar', thumb: 'thumb', corner: 'corner' } as Record<string, string>)[el.getAttribute('data-part') ?? ''] ?? 'host';
  for (const el of parts(sa)) for (const n of dataNames(el).filter((n) => n !== 'data-orientation' || key(el) !== 'host')) assert.ok(contract[key(el)].includes(n), `${key(el)} ${n}`);
  d.remove(); t.remove();
});
