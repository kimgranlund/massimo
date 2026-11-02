// ui-fieldset and React Fieldset: role=group named by its legend (no native fieldset or legend in
// the web component), disabled reaching every kit control inside at any depth (and nested
// fieldsets), data-disabled on host and legend, authored legends kept; React renders a native
// fieldset with the same classes and data-*, and its kit hosts inside take data-disabled.
import { tick } from './setup.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadTsx } from './load-tsx.ts';

await import('../components/fieldset/fieldset.element.ts');
await import('../components/field/field.element.ts');
await import('../components/input/input.element.ts');
await import('../components/radio-group/radio-group.element.ts');
const { Fieldset } = await loadTsx(new URL('../components/fieldset/fieldset.react.tsx', import.meta.url));
const { Checkbox, Radio } = await loadTsx(new URL('../components/choice/choice.react.tsx', import.meta.url));
const { RadioGroup } = await loadTsx(new URL('../components/radio-group/radio-group.react.tsx', import.meta.url));

const NATIVE = 'input, button, select, textarea, label, fieldset, legend, option, optgroup, output, datalist, meter, progress, form';
async function mount(html: string) {
  const d = document.createElement('div');
  d.innerHTML = html;
  document.body.append(d);
  await tick(); await tick();
  return d;
}
const dataNames = (el: Element | null) => [...(el?.attributes ?? [])].map((a) => a.name).filter((n) => n.startsWith('data-') && !['data-ui', 'data-part', 'data-size', 'data-mark'].includes(n)).sort();

test('ui-fieldset: role=group named by its legend part, recipe classes, no native elements', async () => {
  const d = await mount('<ui-fieldset legend="Billing"><ui-input label="Name"></ui-input></ui-fieldset>');
  const f = d.firstElementChild as any, legend = f.querySelector(':scope > [data-part=legend]');
  assert.equal(f.querySelector(NATIVE), null);
  assert.equal(f.getAttribute('role'), 'group');
  assert.equal(legend.textContent, 'Billing');
  assert.equal(f.firstElementChild, legend, 'the legend comes first');
  assert.equal(document.getElementById(f.getAttribute('aria-labelledby'))?.textContent, 'Billing');
  assert.ok(f.classList.contains('ui-fieldset__root') && legend.classList.contains('ui-fieldset__legend'));
  f.legend = '';
  await tick();
  assert.ok(legend.hidden && !f.hasAttribute('aria-labelledby'), 'no legend text: hidden, and no name from it');
  d.remove();
  // An authored legend (a heading) is kept; its text seeds legend.
  const a = await mount('<ui-fieldset id="ship"><h3 data-part="legend">Shipping</h3><ui-input label="Street"></ui-input></ui-fieldset>');
  const af = a.firstElementChild as any;
  assert.equal(af.legend, 'Shipping');
  assert.equal(af.querySelector('h3').id, 'ship-fieldset-legend');
  assert.equal(af.getAttribute('aria-labelledby'), 'ship-fieldset-legend');
  assert.ok(af.querySelector('h3').classList.contains('ui-fieldset__legend'));
  a.remove();
});

test('ui-fieldset: disabled reaches every kit control inside, at any depth and through nested fieldsets', async () => {
  const d = await mount(`<ui-fieldset legend="Profile"><ui-field label="Name"><ui-input></ui-input></ui-field>
    <div><ui-radio-group value="a"><ui-radio value="a">A</ui-radio><ui-radio value="b">B</ui-radio></ui-radio-group></div>
    <ui-fieldset legend="Inner"><ui-input label="Inner"></ui-input></ui-fieldset></ui-fieldset>`);
  const f = d.firstElementChild as any;
  const [input, inner] = f.querySelectorAll('ui-input'), group = f.querySelector('ui-radio-group'), radio = f.querySelectorAll('ui-radio')[1];
  const nested = f.querySelector('ui-fieldset ui-fieldset');
  assert.ok(!input.isDisabled && !radio.isDisabled && !f.hasAttribute('data-disabled'));
  f.disabled = true;
  await tick();
  for (const el of [input, group, radio, inner]) {
    assert.equal(el.isDisabled, true, `${el.localName} is disabled`);
    assert.ok(el.hasAttribute('data-disabled'), `${el.localName} data-disabled`);
  }
  assert.ok(f.hasAttribute('data-disabled') && f.querySelector('[data-part=legend]').hasAttribute('data-disabled'));
  assert.equal(f.getAttribute('aria-disabled'), 'true');
  assert.ok(nested.hasAttribute('data-disabled'), 'a nested fieldset is disabled with its outer one');
  assert.equal(input.internals.value, null, 'disabled controls submit nothing');
  radio.click();
  await tick();
  assert.equal(group.value, 'a', 'a disabled radio group does not change');
  f.disabled = false;
  await tick();
  assert.ok(!input.isDisabled && !radio.isDisabled && !inner.isDisabled && !nested.hasAttribute('data-disabled'));
  d.remove();
});

test('React Fieldset: native fieldset with the same classes; legend div names it; disabled reaches the kit hosts', () => {
  const out = renderToStaticMarkup(h(Fieldset, { legend: 'Billing', disabled: true }, h(Checkbox, { value: 'a' }, 'A')));
  assert.match(out, /^<fieldset data-ui="fieldset" aria-labelledby="([^"]+)" disabled="" data-disabled="" class="ui-fieldset__root"><div data-part="legend" id="\1" data-disabled="" class="ui-fieldset__legend">Billing<\/div>/);
  assert.match(out, /<label data-ui="checkbox" data-disabled=""/);
  const plain = renderToStaticMarkup(h(Fieldset, {}, 'x'));
  assert.doesNotMatch(plain, /aria-labelledby|data-disabled/);
  const composed = renderToStaticMarkup(h(Fieldset.Root, { disabled: true }, h(Fieldset.Legend, {}, 'Billing'), h(Checkbox, { value: 'a' }, 'A')));
  assert.equal(composed, out, 'Root + Legend render the preset');
});

test('state parity: fieldset host, legend and the controls inside carry the same data-* in both renderers', async () => {
  const contract = JSON.parse(readFileSync(new URL('../contracts/states.json', import.meta.url), 'utf8'));
  for (const disabled of [false, true]) {
    const d = await mount(`<ui-fieldset legend="Plan"${disabled ? ' disabled' : ''}><ui-radio-group value="a"><ui-radio value="a">A</ui-radio><ui-radio value="b">B</ui-radio></ui-radio-group></ui-fieldset>`);
    const a = d.firstElementChild!;
    const box = document.createElement('div');
    box.innerHTML = renderToStaticMarkup(h(Fieldset, { legend: 'Plan', disabled }, h(RadioGroup, { defaultValue: 'a' }, h(Radio, { value: 'a' }, 'A'), h(Radio, { value: 'b' }, 'B'))));
    const b = box.firstElementChild!;
    assert.deepEqual(dataNames(a), dataNames(b), `host disabled=${disabled}`);
    for (const n of dataNames(a)) assert.ok(contract.components['ui-fieldset'].host.includes(n));
    assert.deepEqual(dataNames(a.querySelector('[data-part=legend]')), dataNames(b.querySelector('[data-part=legend]')), 'legend');
    const ma = [...a.querySelectorAll('ui-radio-group, ui-radio')], mb = [...b.querySelectorAll('[data-ui=radio-group], [data-ui=radio]')];
    ma.forEach((x, i) => assert.deepEqual(dataNames(x), dataNames(mb[i]), `member ${i} disabled=${disabled}`));
    d.remove();
  }
});
