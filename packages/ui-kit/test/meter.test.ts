// Meter (T-0004): resolver, headless state (formatNumber value text), web component, React renderer
// (SSR), markup parity between them, and the compound parts.
import { tick } from './setup.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadTsx } from './load-tsx.ts';
import { resolveMeter, resolveTrack } from '../tokens/geometry/resolve.ts';
import { meterState } from '../dom/index.ts';
import { formatNumber } from '../tokens/typography/format.ts';

await import('../components/meter/meter.element.ts');
const { Meter } = await loadTsx(new URL('../components/meter/meter.react.tsx', import.meta.url));
const NATIVE = 'input, button, select, textarea, label, fieldset, legend, option, optgroup, output, datalist, meter, progress, form';
const mount = async (markup: string) => { const d = document.createElement('div'); d.innerHTML = markup; document.body.append(d); await tick(); return d; };
const ssr = (el: any) => { const d = document.createElement('div'); d.innerHTML = renderToStaticMarkup(el); return d.querySelector('[data-ui]') as HTMLElement; };
const html = (el: any) => renderToStaticMarkup(el).replace(/_R_[a-z0-9]+_/gi, 'ID');
const NBSP = ' ';

test('resolveMeter: the progress track, a 1.5u row gap and a 2u column gap, control text', () => {
  const m = resolveMeter({ unit: 4 }), t = resolveTrack('progress', { unit: 4 });
  assert.equal(m.track, t.track);
  assert.equal(m.trackRadius, t.trackRadius);
  assert.equal(m.rowGap, 6);
  assert.equal(m.columnGap, 8);
  assert.equal(m.fontSize, 14);
  assert.equal(m.lineHeight, 16.8);
  assert.equal(resolveMeter({ unit: 2 }).lineHeight, 12, 'capped at the 6u slot');
});

test('meterState: clamps, ratio, formatNumber value text, aria-valuetext override', () => {
  const a = meterState({ value: 24 });
  assert.equal(a.formatted, '24%');
  assert.equal(a.ratio, 0.24);
  assert.equal(a.attrs['aria-valuetext'], '24%');
  assert.equal(meterState({ value: 150 }).value, 100);
  assert.equal(meterState({ value: -5, min: 0, max: 10 }).ratio, 0);
  const g = meterState({ value: 38.5, max: 50, format: { style: 'unit', unit: 'gigabyte', maximumFractionDigits: 1 }, locale: 'en-US' });
  assert.equal(g.formatted, formatNumber(38.5, { style: 'unit', unit: 'gigabyte', maximumFractionDigits: 1, locale: 'en-US' }));
  assert.match(g.formatted, new RegExp(`38\\.5${NBSP}GB`), 'formatNumber: a narrow no-break space before the unit');
  assert.equal(meterState({ value: -3, min: -10, max: 0, format: {} }).formatted, '−3', 'U+2212 minus');
  assert.equal(meterState({ value: 2, valueText: 'Weak' }).attrs['aria-valuetext'], 'Weak');
  assert.equal(meterState({ value: 5, min: 5, max: 5 }).ratio, 0, 'an empty range');
});

test('ui-meter: role, aria values, label wiring, value text, --ui-ratio, recipe classes', async () => {
  const d = await mount('<ui-meter label="Battery" value="72"></ui-meter><ui-meter value="3" max="4" format=\'{"style":"decimal"}\' value-text="3 of 4" locale="en-US"></ui-meter>');
  const [a, b] = d.querySelectorAll('ui-meter') as any;
  assert.equal(a.getAttribute('role'), 'meter');
  assert.equal(a.getAttribute('aria-valuenow'), '72');
  assert.equal(a.getAttribute('aria-valuemin'), '0');
  assert.equal(a.getAttribute('aria-valuemax'), '100');
  assert.equal(a.getAttribute('aria-valuetext'), '72%');
  const label = a.querySelector(':scope > [data-part=label]');
  assert.equal(label.textContent, 'Battery');
  assert.equal(a.getAttribute('aria-labelledby'), label.id);
  assert.equal(a.querySelector(':scope > [data-part=value]').textContent, '72%');
  assert.equal(a.querySelector(':scope > [data-part=value]').getAttribute('aria-hidden'), 'true');
  assert.equal(a.style.getPropertyValue('--ui-ratio'), '0.72');
  assert.ok(a.querySelector(':scope > [data-part=track] > [data-part=indicator]').classList.contains('ui-meter__indicator'));
  assert.equal(b.querySelector('[data-part=value]').textContent, '3');
  assert.equal(b.getAttribute('aria-valuetext'), '3 of 4');
  assert.equal(b.querySelector('[data-part=label]').hidden, true, 'no label: hidden');
  assert.equal(b.hasAttribute('aria-labelledby'), false);
  assert.equal(d.querySelector(NATIVE), null);
  a.value = 10; await tick();
  assert.equal(a.querySelector('[data-part=value]').textContent, '10%');
  a.format = { style: 'percent' }; a.max = 10; await tick();
  assert.equal(a.querySelector('[data-part=value]').textContent, '1,000%', 'a format object as a property');
  d.remove();
});

test('ui-meter: authored parts are adopted; label text seeds the label', async () => {
  const preset = await mount('<ui-meter label="Strength" value="24"></ui-meter>');
  const composed = await mount('<ui-meter value="24"><span data-part="label" class="mine">Strength</span><span data-part="value"></span><span data-part="track"><span data-part="indicator"></span></span></ui-meter>');
  const a = preset.firstElementChild as any, b = composed.firstElementChild as any;
  assert.equal(b.label, 'Strength');
  assert.ok(b.querySelector('[data-part=label]').classList.contains('mine'));
  const sig = (el: Element) => [...el.querySelectorAll('[data-part]')].map((p) => `${p.getAttribute('data-part')}:${[...p.classList].filter((c) => c.startsWith('ui-')).join(' ')}:${p.textContent}`).join('|');
  assert.equal(sig(b), sig(a));
  assert.equal(b.querySelectorAll('[data-part=track]').length, 1);
  preset.remove(); composed.remove();
});

test('React Meter: same anatomy, ARIA and classes as the web component (parity)', async () => {
  const pairs: [string, any][] = [
    ['<ui-meter label="Battery" value="72"></ui-meter>', h(Meter, { label: 'Battery', value: 72 })],
    ['<ui-meter value="3" max="4" value-text="3 of 4"></ui-meter>', h(Meter, { value: 3, max: 4, valueText: '3 of 4' })],
  ];
  for (const [markup, el] of pairs) {
    const d = await mount(markup);
    const a = d.firstElementChild!, b = ssr(el);
    for (const k of ['role', 'aria-valuenow', 'aria-valuemin', 'aria-valuemax', 'aria-valuetext']) assert.equal(a.getAttribute(k), b.getAttribute(k), k);
    assert.equal(a.hasAttribute('aria-labelledby'), b.hasAttribute('aria-labelledby'));
    const parts = (el: Element) => [...el.querySelectorAll('[data-part]')].map((p) => `${p.getAttribute('data-part')}:${p.className}:${p.textContent}:${(p as HTMLElement).hidden}`);
    assert.deepEqual(parts(a), parts(b), markup);
    assert.deepEqual([...a.classList].sort(), [...b.classList].sort());
    const da = [...a.attributes].filter((x) => x.name.startsWith('data-')), db = [...b.attributes].filter((x) => x.name.startsWith('data-') && !['data-ui', 'data-size'].includes(x.name));
    assert.deepEqual(da.map((x) => x.name), db.map((x) => x.name), 'no state data-* on either');
    d.remove();
  }
});

test('React Meter: compound parts render the preset; Meter.Value children function; render and className', () => {
  const preset = html(h(Meter, { label: 'Storage', value: 20, max: 50 }));
  const composed = html(h(Meter.Root, { value: 20, max: 50 }, h(Meter.Label, null, 'Storage'), h(Meter.Value), h(Meter.Track, null, h(Meter.Indicator))));
  assert.equal(composed, preset);
  assert.match(preset, /^<div data-ui="meter" role="meter" aria-valuenow="20" aria-valuemin="0" aria-valuemax="50" aria-valuetext="40%" aria-labelledby="ID" class="ui-meter__root" style="--ui-ratio:0.4">/);
  assert.match(html(h(Meter.Root, { value: 20 }, h(Meter.Value, null, ((f: string, v: number) => `${v} → ${f}`) as any))), />20 → 20%</);
  assert.match(html(h(Meter.Root, { value: 1, render: h('section'), className: () => 'm' }, h(Meter.Track))), /^<section data-ui="meter"[^>]*class="ui-meter__root m"/);
  assert.throws(() => html(h(Meter.Value)), /inside Meter.Root/);
});
