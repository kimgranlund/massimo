import { tick } from './setup.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
const { signal, computed, effect } = await import('../core/signals.ts');
const { html, render, repeat } = await import('../core/template.ts');
const { UIElement, define } = await import('../core/element.ts');

test('effect drops dependencies it no longer reads', async () => {
  const flag = signal(true), a = signal(1), b = signal(1);
  let runs = 0;
  const stop = effect(() => { runs++; void (flag.value ? a.value : b.value); });
  flag.value = false; await tick();
  a.value = 2; await tick();
  assert.equal(runs, 2);
  stop(); b.value = 2; await tick();
  assert.equal(runs, 2);
});

test('computed follows its source', async () => {
  const n = signal(2), dbl = computed(() => n.value * 2);
  n.value = 5; await tick();
  assert.equal(dbl.value, 10);
});

test('repeat keeps keyed nodes and disposes removed items', async () => {
  const host = document.createElement('div');
  const live = signal(0);
  let hits = 0;
  const view = (ids: string[]) => html`<ul>${repeat(ids, (x) => x, (x) => html`<li>${x}${() => (hits++, live.value)}</li>`)}</ul>`;
  render(view(['a', 'b', 'c']), host);
  const liA = host.querySelectorAll('li')[0];
  render(view(['c', 'a']), host);
  const lis = [...host.querySelectorAll('li')];
  assert.deepEqual(lis.map((l) => l.textContent![0]), ['c', 'a']);
  assert.equal(lis[1], liA);
  hits = 0; live.value = 1; await tick();
  assert.equal(hits, 2);
});

test('UIElement props, attributes, bindings and events', async () => {
  class XEl extends UIElement {
    static properties = { label: { type: String, default: 'hi', reflect: true }, count: { type: Number, default: 0 }, on: { type: Boolean, reflect: true } };
    declare label: string; declare count: number; declare on: boolean;
    template() { return html`<p class=${this.label} ?hidden=${this.on} .tab-index=${3} @click=${() => this.count++}>${this.label}:${this.count}</p>`; }
  }
  define('x-el', XEl);
  const el = document.createElement('x-el') as XEl;
  el.setAttribute('label', 'yo');
  document.body.append(el);
  const p = el.querySelector('p')!;
  assert.equal(el.textContent, 'yo:0');
  assert.equal(p.className, 'yo');
  assert.equal(p.tabIndex, 3);
  p.click(); await tick();
  assert.equal(el.textContent, 'yo:1');
  assert.equal(el.querySelector('p'), p, 'same node after re-render');
  el.on = true; await tick();
  assert.ok(p.hasAttribute('hidden'));
  assert.ok(el.hasAttribute('on'), 'boolean reflects');
  el.remove();
});

test('modality: keydown -> keyboard, pointerdown -> pointer', async () => {
  const { trackModality } = await import('../core/modality.ts');
  trackModality();
  const root = document.documentElement;
  document.dispatchEvent(new (globalThis as any).window.KeyboardEvent('keydown', { key: 'Tab' }));
  assert.equal(root.getAttribute('data-modality'), 'keyboard');
  document.dispatchEvent(new (globalThis as any).window.PointerEvent('pointerdown'));
  assert.equal(root.getAttribute('data-modality'), 'pointer');
  document.dispatchEvent(new (globalThis as any).window.KeyboardEvent('keydown', { key: 'c', metaKey: true }));
  assert.equal(root.getAttribute('data-modality'), 'pointer', 'shortcuts do not switch to keyboard');
});
