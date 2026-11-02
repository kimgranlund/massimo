import { tick } from './setup.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
await import('../components/choice/choice.element.ts');
await import('../components/range/range.element.ts');
await import('../components/color/color.element.ts');
await import('../components/swiper/swiper.element.ts');
await import('../components/image/image.element.ts');
const { rangeKey, valueAt, snap } = await import('../dom/range.ts');

const NATIVE = 'input, button, select, textarea, label, fieldset, legend, option, optgroup, output, datalist, meter, progress, form';
const key = (el: Element, k: string) => { const e = new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }); el.dispatchEvent(e); return e; };
const mount = (html: string) => { const d = document.createElement('div'); d.innerHTML = html; document.body.append(d); return d; };

test('checkbox: role, toggle by click and Space, mixed, form value, required', async () => {
  const d = mount('<ui-checkbox name="terms" required>Accept</ui-checkbox>');
  const c = d.firstElementChild as any;
  await tick();
  assert.equal(c.getAttribute('role'), 'checkbox');
  assert.equal(c.getAttribute('aria-checked'), 'false');
  assert.equal(c.querySelector(NATIVE), null);
  assert.equal(c.querySelector('[data-part=leading] > [data-part=box]') !== null, true, 'box in the leading slot');
  assert.equal(c.validity.valueMissing, true);
  c.click(); await tick();
  assert.equal(c.getAttribute('aria-checked'), 'true');
  assert.equal(c.internals.value, 'on');
  key(c, ' '); await tick();
  assert.equal(c.checked, false);
  c.indeterminate = true; await tick();
  assert.equal(c.getAttribute('aria-checked'), 'mixed');
  c.click(); await tick();
  assert.equal(c.indeterminate, false, 'activation clears mixed');
  d.remove();
});

test('switch: role switch, Enter toggles', async () => {
  const d = mount('<ui-switch>Wi-Fi</ui-switch>');
  const s = d.firstElementChild as any;
  await tick();
  assert.equal(s.getAttribute('role'), 'switch');
  key(s, 'Enter'); await tick();
  assert.equal(s.getAttribute('aria-checked'), 'true');
  d.remove();
});

test('radio group: one checked, arrows move and select, roving tab stop, group required', async () => {
  const d = mount('<ui-radio name="plan" value="a" required>A</ui-radio><ui-radio name="plan" value="b">B</ui-radio><ui-radio name="plan" value="c" disabled>C</ui-radio>');
  const [a, b, c] = d.querySelectorAll('ui-radio') as any;
  await tick();
  assert.deepEqual([a, b, c].map((r: any) => r.getAttribute('tabindex')), ['0', '-1', '-1'], 'first enabled is the tab stop');
  assert.equal(b.validity.valueMissing, true, 'required applies to the whole group');
  a.click(); await tick();
  key(a, 'ArrowDown'); await tick();
  assert.equal(b.checked, true);
  assert.equal(a.checked, false);
  assert.equal(document.activeElement, b);
  key(b, 'ArrowDown'); await tick();
  assert.equal(a.checked, true, 'wraps and skips disabled');
  assert.equal(a.internals.value, 'a');
  assert.equal(b.internals.value, null);
  assert.ok(!b.validity.valueMissing, 'group satisfied once one is checked');
  d.remove();
});

test('range: keys step, PageUp 10%, Home/End, pointer mapping, ratio variable', async () => {
  assert.equal(snap(13.3, { value: 0, min: 0, max: 100, step: 5 }), 15);
  assert.equal(rangeKey('PageUp', { value: 50, min: 0, max: 100, step: 1 }), 60);
  assert.equal(valueAt(60, { left: 0, width: 116 }, 16, { value: 0, min: 0, max: 100, step: 1 }), 52);
  const d = mount('<ui-range min="0" max="10" step="1" value="5" label="Volume"></ui-range>');
  const r = d.firstElementChild as any;
  await tick();
  assert.equal(r.getAttribute('role'), 'slider');
  assert.equal(r.getAttribute('aria-valuenow'), '5');
  let changes = 0;
  r.addEventListener('change', () => changes++);
  key(r, 'ArrowRight'); key(r, 'End'); await tick();
  assert.equal(r.value, 10);
  assert.equal(r.style.getPropertyValue('--ui-ratio'), '1');
  assert.equal(changes, 2);
  assert.equal(r.internals.value, '10');
  key(r, 'Home'); await tick();
  assert.equal(r.getAttribute('aria-valuenow'), '0');
  d.remove();
});

test('progress: determinate and indeterminate', async () => {
  const d = mount('<ui-progress value="25" label="Upload"></ui-progress><ui-progress></ui-progress>');
  const [p, q] = d.querySelectorAll('ui-progress') as any;
  await tick();
  assert.equal(p.getAttribute('role'), 'progressbar');
  assert.equal(p.getAttribute('aria-valuenow'), '25');
  assert.equal(p.style.getPropertyValue('--ui-ratio'), '0.25');
  assert.ok(q.hasAttribute('data-indeterminate'));
  assert.equal(q.getAttribute('aria-valuenow'), null);
  d.remove();
});

test('swatch and selectable palette', async () => {
  const d = mount('<ui-swatch color="#ff0000" label="Red"></ui-swatch><ui-palette name="c" value="#00f"><ui-swatch color="#f00"></ui-swatch><ui-swatch color="#0f0"></ui-swatch><ui-swatch color="#00f"></ui-swatch></ui-palette>');
  const sw = d.querySelector('ui-swatch') as any;
  const pal = d.querySelector('ui-palette') as any;
  await tick();
  assert.equal(sw.getAttribute('role'), 'img');
  assert.equal(sw.getAttribute('aria-label'), 'Red');
  assert.equal(sw.style.getPropertyValue('--ui-swatch-color'), '#ff0000');
  assert.equal(sw.hasAttribute('data-alpha'), false, 'opaque color: no checkerboard layer');
  for (const c of ['#ff000080', 'rgb(0 0 0 / 50%)', 'rgba(0,0,0,.5)', 'transparent', 'oklch(0.5 0.1 200 / 0.3)']) {
    sw.color = c; await Promise.resolve();
    assert.equal(sw.hasAttribute('data-alpha'), true, c);
  }
  sw.color = '#ff0000'; await Promise.resolve();
  assert.equal(pal.getAttribute('role'), 'listbox');
  assert.equal(pal.swatches[2].getAttribute('aria-selected'), 'true');
  key(pal, 'Home'); await tick();
  assert.equal(pal.value, '#f00');
  assert.equal(pal.internals.value, '#f00');
  d.remove();
});

test('swiper builds viewport, paddles and dots; image presets and slideshow', async () => {
  (globalThis as any).IntersectionObserver ??= class { observe() {} disconnect() {} };
  const d = mount('<ui-swiper label="Gallery"><div>1</div><div>2</div><div>3</div></ui-swiper>');
  const s = d.firstElementChild as any;
  await tick();
  assert.equal(s.slides.length, 3);
  assert.equal(s.querySelectorAll('[data-part=paddle]').length, 2);
  assert.equal(s.querySelectorAll('[data-part=dot]').length, 3);
  assert.equal(s.querySelector('[data-part=dot]').getAttribute('aria-current'), 'true');
  assert.equal(s.slides[1].getAttribute('aria-label'), '2 of 3');
  assert.equal(s.querySelector('[data-dir=prev]').disabled, true, 'prev disabled on the first slide');
  s.go(2); await tick();
  assert.equal(s.querySelectorAll('[data-part=dot]')[2].getAttribute('aria-current'), 'true');

  const img = mount('<ui-image src="/a.jpg" alt="A" ratio="wide" fit="contain"></ui-image><ui-image ratio="3/2"></ui-image><ui-image ratio="evil;"></ui-image><ui-image slideshow><img src="/1.jpg" alt=""><img src="/2.jpg" alt=""></ui-image>');
  const [one, custom, bad, show] = img.querySelectorAll('ui-image') as any;
  await tick();
  assert.equal(one.style.getPropertyValue('aspect-ratio').replace(/\s/g, ''), '16/9');
  assert.equal(one.querySelector('img').getAttribute('src'), '/a.jpg');
  assert.equal(one.querySelector('img').loading, 'lazy');
  assert.equal(custom.style.getPropertyValue('aspect-ratio').replace(/\s/g, ''), '3/2');
  assert.equal(bad.style.getPropertyValue('aspect-ratio'), '', 'invalid ratio ignored');
  assert.equal(show.querySelector('ui-swiper').slides.length, 2);
  assert.ok(show.querySelector('ui-swiper').hasAttribute('hover-controls'));
  d.remove(); img.remove();
});
