// Range pair (Base UI Slider with value [start, end]): the headless pair helpers, the web
// component's two thumbs (group host, slider thumbs, keys stop at the other thumb, pointer moves the
// nearer thumb, one form entry per thumb, activeThumbIndex), the React pair (server markup and
// client keys) and the same data-* on both renderers. The single-thumb API is covered elsewhere.
import { tick } from './setup.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadTsx } from './load-tsx.ts';

await import('../components/range/range.element.ts');
const { Range, Slider } = await loadTsx(new URL('../components/range/range.react.tsx', import.meta.url));
const { parsePair, snapPair, setPairValue, nearestThumb, pairKey, pairRatios } = await import('../dom/range.ts');

const NATIVE = 'input, button, select, textarea, label, fieldset, legend, option, optgroup, output, datalist, meter, progress, form';
const B = { min: 0, max: 100, step: 1 };
const key = (el: Element, k: string) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
const setValue = (el: HTMLInputElement, v: string) => Object.getOwnPropertyDescriptor(Object.getPrototypeOf(el), 'value')!.set!.call(el, v);
async function wc<T extends HTMLElement = any>(markup: string): Promise<T> {
  const box = document.createElement('div');
  box.innerHTML = markup;
  document.body.append(box);
  await tick(); await tick();
  return box.firstElementChild as T;
}
function ssr(el: any) {
  const box = document.createElement('div');
  box.innerHTML = renderToStaticMarkup(el);
  return box.querySelector('[data-ui]') as HTMLElement;
}
const dataNames = (el: Element) => [...el.attributes].map((a) => a.name).filter((n) => n.startsWith('data-') && n !== 'data-ui' && n !== 'data-part').sort();

test('pair helpers: parse, snap and order, stop at the other thumb, nearer thumb, keys, ratios', () => {
  assert.deepEqual(parsePair('20,80'), [20, 80]);
  assert.deepEqual(parsePair([1, 2]), [1, 2]);
  assert.equal(parsePair('50'), undefined);
  assert.equal(parsePair('1,2,3'), undefined);
  assert.deepEqual(snapPair([80.4, 19.6], B), [20, 80], 'snapped and ordered');
  assert.deepEqual(snapPair([-5, 500], B), [0, 100], 'clamped');
  assert.deepEqual(setPairValue([20, 80], 0, 90), [80, 80], 'the start stops at the end');
  assert.deepEqual(setPairValue([20, 80], 1, 10), [20, 20], 'the end stops at the start');
  assert.equal(nearestThumb([20, 80], 45), 0);
  assert.equal(nearestThumb([20, 80], 55), 1);
  assert.equal(nearestThumb([50, 50], 40), 0, 'met thumbs: the side of the press');
  assert.equal(nearestThumb([50, 50], 60), 1);
  assert.deepEqual(pairKey('End', [20, 80], 0, B), [80, 80]);
  assert.deepEqual(pairKey('Home', [20, 80], 1, B), [20, 20]);
  assert.deepEqual(pairKey('PageUp', [20, 80], 0, B), [30, 80], 'PageUp is 10% of the whole range');
  assert.deepEqual(pairKey('ArrowLeft', [20, 80], 0, B, true), [21, 80], 'RTL mirrors the arrows');
  assert.equal(pairKey('a', [20, 80], 0, B), undefined);
  assert.deepEqual(pairRatios([25, 75], B), [0.25, 0.75]);
});

test('ui-range pair: group host, two slider thumbs, ratios, no native elements', async () => {
  const r = await wc('<ui-range value="20,80" label="Price"></ui-range>');
  assert.deepEqual(r.value, [20, 80]);
  assert.equal(r.getAttribute('role'), 'group');
  assert.equal(r.getAttribute('aria-label'), 'Price');
  assert.equal(r.hasAttribute('tabindex'), false, 'the thumbs are the tab stops');
  assert.equal(r.hasAttribute('aria-valuenow'), false);
  assert.equal(r.querySelector(NATIVE), null);
  const thumbs = r.querySelectorAll('[data-part=thumb]');
  assert.equal(thumbs.length, 2);
  assert.deepEqual([...thumbs].map((t) => [t.getAttribute('role'), t.getAttribute('tabindex'), t.getAttribute('aria-valuenow'), t.getAttribute('aria-valuemin'), t.getAttribute('aria-valuemax'), t.getAttribute('aria-label'), t.dataset.index]),
    [['slider', '0', '20', '0', '100', 'Price, minimum', '0'], ['slider', '0', '80', '0', '100', 'Price, maximum', '1']]);
  assert.ok([...thumbs].every((t) => t.classList.contains('ui-range__thumb')), 'both thumbs carry the recipe class');
  assert.equal(r.style.getPropertyValue('--ui-ratio-start'), '0.2');
  assert.equal(r.style.getPropertyValue('--ui-ratio'), '0.8');
  assert.deepEqual([...thumbs].map((t) => t.style.getPropertyValue('--ui-ratio')), ['0.2', '0.8']);
  // Back to one thumb: the slider is the host again.
  r.value = 30; await tick();
  assert.equal(r.getAttribute('role'), 'slider');
  assert.equal(r.querySelectorAll('[data-part=thumb]').length, 1);
  assert.equal(r.style.getPropertyValue('--ui-ratio-start'), '');
  r.parentElement.remove();
});

test('ui-range pair: keys move the focused thumb and stop at the other; input / change carry activeThumbIndex', async () => {
  const r = await wc('<ui-range value="40,60" step="5"></ui-range>');
  const got: [string, any][] = [];
  for (const t of ['input', 'change']) r.addEventListener(t, (e: Event) => got.push([t, (e as CustomEvent).detail]));
  const [a, b] = r.querySelectorAll('[data-part=thumb]');
  key(a, 'ArrowRight'); await tick();
  assert.deepEqual(r.value, [45, 60]);
  key(a, 'End'); await tick();
  assert.deepEqual(r.value, [60, 60], 'the start stops at the end');
  key(a, 'End'); await tick();
  key(b, 'Home'); await tick();
  assert.deepEqual(r.value, [60, 60], 'the end cannot pass the start');
  key(b, 'ArrowUp'); await tick();
  assert.deepEqual(got.map(([t, d]) => [t, d.value, d.activeThumbIndex, d.reason]), [
    ['input', [45, 60], 0, 'keyboard'], ['change', [45, 60], undefined, 'keyboard'],
    ['input', [60, 60], 0, 'keyboard'], ['change', [60, 60], undefined, 'keyboard'],
    ['input', [60, 65], 1, 'keyboard'], ['change', [60, 65], undefined, 'keyboard'],
  ], 'no events without a new value');
  assert.equal(r.querySelectorAll('[data-part=thumb]')[1].getAttribute('aria-valuenow'), '65');
  r.parentElement.remove();
});

test('ui-range pair: a press moves the nearer thumb and focuses it; a drag stops at the other thumb', async () => {
  const r = await wc('<ui-range value="20,80"></ui-range>');
  // A 116px host with a 16px track: the thumb centers travel 8..108 (100px for 0..100).
  r.getBoundingClientRect = () => ({ left: 0, top: 0, width: 116, height: 16, right: 116, bottom: 16, x: 0, y: 0, toJSON() {} });
  const got: [string, any][] = [];
  for (const t of ['input', 'change']) r.addEventListener(t, (e: Event) => got.push([t, (e as CustomEvent).detail]));
  const down = (x: number) => r.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, clientX: x }));
  const move = (x: number) => r.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: x }));
  const up = () => r.dispatchEvent(new PointerEvent('pointerup', { bubbles: true }));
  down(8 + 60); await tick();
  assert.deepEqual(r.value, [20, 60], 'the end thumb is nearer to 60');
  assert.equal(document.activeElement, r.querySelectorAll('[data-part=thumb]')[1]);
  assert.ok(r.querySelectorAll('[data-part=thumb]')[1].hasAttribute('data-dragging'), 'the dragged thumb');
  assert.ok(!r.querySelectorAll('[data-part=thumb]')[0].hasAttribute('data-dragging'));
  move(8 + 5); await tick();
  assert.deepEqual(r.value, [20, 20], 'dragging stops at the start thumb');
  up(); await tick();
  assert.ok(!r.hasAttribute('data-dragging'));
  assert.deepEqual(got.map(([t, d]) => [t, d.value, d.reason]), [['input', [20, 60], 'track-press'], ['input', [20, 20], 'drag'], ['change', [20, 20], 'drag']]);
  r.parentElement.remove();
});

test('ui-range pair: one form entry per thumb, reset to the default pair', async () => {
  const form = document.createElement('form');
  form.innerHTML = '<ui-range name="price" default-value="10,90"></ui-range>';
  document.body.append(form);
  await tick(); await tick();
  const r = form.firstElementChild as any;
  assert.deepEqual(r.value, [10, 90], 'default-value seeds the pair');
  const v = r.internals.value as FormData;
  assert.ok(v instanceof FormData);
  assert.deepEqual(v.getAll('price'), ['10', '90']);
  key(r.querySelector('[data-part=thumb]'), 'End'); await tick();
  assert.deepEqual((r.internals.value as FormData).getAll('price'), ['90', '90']);
  assert.ok(r.hasAttribute('data-dirty'));
  r.formResetCallback?.(); await tick();
  assert.deepEqual(r.value, [10, 90]);
  form.remove();
});

test('React Slider pair: a group of two thumbs, each with its native input; same data-* as the web component', async () => {
  const el = ssr(h(Range, { defaultValue: [20, 80], label: 'Price', name: 'price' }));
  assert.equal(el.getAttribute('role'), 'group');
  assert.equal(el.getAttribute('aria-label'), 'Price');
  assert.equal(el.style.getPropertyValue('--ui-ratio-start'), '0.2');
  const inputs = el.querySelectorAll('input');
  assert.deepEqual([...inputs].map((i) => [i.type, i.name, i.getAttribute('value'), i.getAttribute('aria-label'), i.dataset.index]), [['range', 'price', '20', 'Price, minimum', '0'], ['range', 'price', '80', 'Price, maximum', '1']]);
  const thumbs = el.querySelectorAll<HTMLElement>('[data-part=thumb]');
  assert.deepEqual([...thumbs].map((t) => [t.dataset.index, t.style.getPropertyValue('--ui-ratio'), t.nextElementSibling?.tagName]), [['0', '0.2', 'INPUT'], ['1', '0.8', 'INPUT']]);
  // Compound parts: one Slider.Thumb per value.
  const parts = ssr(h(Slider.Root, { defaultValue: [20, 80], label: 'Price', name: 'price' }, h(Slider.Track, null, h(Slider.Indicator)), h(Slider.Thumb, { index: 0 }), h(Slider.Thumb, { index: 1 })));
  assert.equal(parts.outerHTML, el.outerHTML, 'the preset is the composed parts');
  const w = await wc('<ui-range value="20,80" label="Price"></ui-range>');
  assert.deepEqual(dataNames(w), dataNames(el), 'host data-*');
  const wt = w.querySelectorAll('[data-part=thumb]');
  [...thumbs].forEach((t, i) => assert.deepEqual(dataNames(wt[i]), dataNames(t), `thumb ${i} data-*`));
  w.parentElement.remove();
});

test('React Slider pair: keys on a thumb input stop at the other thumb; onValueChange names the thumb', async () => {
  const { createRoot } = await import('react-dom/client');
  const { act } = await import('react');
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  const box = document.createElement('div');
  document.body.append(box);
  const root = createRoot(box);
  const calls: any[] = [];
  await act(async () => root.render(h(Range, { defaultValue: [40, 60], onValueChange: (v: number[], d: any) => calls.push(['value', v, d.activeThumbIndex, d.reason]), onValueCommitted: (v: number[], d: any) => calls.push(['commit', v, d.reason]) })));
  const [a, b] = box.querySelectorAll<HTMLInputElement>('input');
  await act(async () => { setValue(a, '45'); a.dispatchEvent(new Event('input', { bubbles: true })); a.dispatchEvent(new Event('change', { bubbles: true })); });
  await act(async () => { setValue(b, '30'); b.dispatchEvent(new Event('input', { bubbles: true })); });
  assert.deepEqual(calls, [['value', [45, 60], 0, 'keyboard'], ['commit', [45, 60], 'keyboard'], ['value', [45, 45], 1, 'keyboard']]);
  assert.equal(b.value, '45', 'the end input stops at the start');
  assert.equal(box.querySelector<HTMLElement>('[data-ui=range]')!.style.getPropertyValue('--ui-ratio'), '0.45');
  await act(async () => root.unmount());
  box.remove();
});
