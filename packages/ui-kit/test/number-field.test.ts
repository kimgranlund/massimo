// Number Field (T-0025): resolver, headless parsing / formatting / stepping (dom/number.ts), the web
// component (anatomy, ARIA, typing, commit, keys, steppers, scrub, wheel, form value, validity,
// events), the React renderer (SSR), markup parity between them, and the compound parts.
import { tick } from './setup.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadTsx } from './load-tsx.ts';
import { resolveNumberField, resolveControl, resolveTextRun } from '../tokens/geometry/resolve.ts';
import { clampNumber, formatNumberValue, numberInputMode, parseNumber, sanitizeNumberText, snapNumber, stepAmount, stepNumber, stepperDisabled } from '../dom/index.ts';

await import('../components/number-field/number-field.element.ts');
const { NumberField } = await loadTsx(new URL('../components/number-field/number-field.react.tsx', import.meta.url));
const NATIVE = 'input, button, select, textarea, label, fieldset, legend, option, optgroup, output, datalist, meter, progress, form';
const mount = async (markup: string) => { const d = document.createElement('div'); d.innerHTML = markup; document.body.append(d); await tick(); return d; };
const ssr = (el: any) => { const d = document.createElement('div'); d.innerHTML = renderToStaticMarkup(el); return d.querySelector('[data-ui]') as HTMLElement; };
const html = (el: any) => renderToStaticMarkup(el).replace(/_R_[a-z0-9]+_/gi, 'ID');
const WheelEvent = (window as any).WheelEvent as typeof globalThis.WheelEvent;
const MINUS = '\u2212', NNBSP = '\u202f';
const part = (el: Element, p: string) => el.querySelector(`[data-part=${p}]`) as HTMLElement;
const key = (el: Element, k: string, init: KeyboardEventInit = {}) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...init }));
const type = (ed: HTMLElement, text: string) => { ed.textContent = text; ed.dispatchEvent(new Event('input', { bubbles: true })); };
const events = (el: Element) => { const log: string[] = []; for (const n of ['input', 'change']) el.addEventListener(n, (e: any) => log.push(`${n}:${e.detail?.value}:${e.detail?.reason}`)); return log; };

test('resolveNumberField: 8u control, 6u stepper slots, 1u text run beside them, concentric stepper radius, sm glyph', () => {
  const g = resolveNumberField({ unit: 4 }), c = resolveControl({ unit: 4 });
  assert.equal(g.height, c.height);
  assert.equal(g.padding, 4);
  assert.equal(g.stepper, 24);
  assert.equal(g.contentsStart, 4);
  assert.equal(g.contentsEnd, 4);
  assert.deepEqual([g.contentsStart, g.contentsEnd], [resolveTextRun({ leading: true, trailing: true }, { unit: 4 }).contents!.start, resolveTextRun({ leading: true, trailing: true }, { unit: 4 }).contents!.end]);
  assert.equal(g.stepperRadius, c.radius - 4);
  assert.equal(g.stepperIcon, 14 - 2, 'icon size sm: font − 0.5u');
  assert.equal(g.rowGap, 6);
  assert.equal(resolveNumberField({ unit: 4, border: 1 }).padding, 3, 'pad u − B');
  assert.equal(resolveNumberField({ unit: 4, radiusScale: 0 }).stepperRadius, 0);
});

test('parseNumber / formatNumberValue: locale separators, U+2212, grouping spaces, percent, currency text', () => {
  assert.equal(parseNumber('1,234.5', { locale: 'en-US' }), 1234.5);
  assert.equal(parseNumber('1.234,5', { locale: 'de-DE' }), 1234.5);
  assert.equal(parseNumber(`1${NNBSP}234,5`, { locale: 'fr-FR' }), 1234.5);
  assert.equal(parseNumber(`${MINUS}12`, { locale: 'en-US' }), -12);
  assert.equal(parseNumber('-12'), -12);
  assert.equal(parseNumber('$1,200.00', { locale: 'en-US', format: { style: 'currency', currency: 'USD' } }), 1200);
  assert.equal(parseNumber('45%', { locale: 'en-US', format: { style: 'percent' } }), 0.45);
  assert.equal(parseNumber('١٢٣', { locale: 'ar-EG' }), 123, 'locale digits');
  assert.equal(parseNumber('  '), null);
  assert.ok(Number.isNaN(parseNumber('1-2')));
  assert.ok(Number.isNaN(parseNumber('abc')));
  assert.equal(formatNumberValue(-1234.5, { locale: 'en-US' }), `${MINUS}1,234.5`, 'formatNumber: U+2212');
  assert.equal(formatNumberValue(null), '');
  assert.equal(formatNumberValue(0.12345, { locale: 'en-US', step: 0.0001 }), '0.1235', 'the step widens the fraction digits');
  assert.equal(formatNumberValue(1200, { locale: 'en-US', format: { style: 'currency', currency: 'EUR' } }), '€1,200.00');
  assert.equal(sanitizeNumberText('12a3\n4', { locale: 'en-US' }), '1234');
});

test('stepNumber: step, clamp, snap on step, float noise, empty start; amounts by modifier; stepper limits; input mode', () => {
  assert.equal(stepNumber(0.1, 1, 0.2), 0.3, 'no binary noise');
  assert.equal(stepNumber(null, 1, 1), 1);
  assert.equal(stepNumber(9.5, 1, 1, { max: 10 }), 10);
  assert.equal(stepNumber(0, -1, 1, { min: 0 }), 0);
  assert.equal(stepNumber(1.3, 1, 1, { snapOnStep: true }), 2);
  assert.equal(stepNumber(1.3, -1, 1, { snapOnStep: true }), 1);
  assert.equal(stepNumber(2, 1, 1, { snapOnStep: true }), 3);
  assert.equal(stepNumber(7, 1, 5, { min: 1, snapOnStep: true }), 11, 'the grid starts at min');
  assert.equal(snapNumber(7.4, 0.5), 7.5);
  assert.equal(clampNumber(12, { min: 0, max: 10 }), 10);
  const steps = { step: 1, smallStep: 0.1, largeStep: 10 };
  assert.deepEqual([stepAmount({}, steps), stepAmount({ shiftKey: true }, steps), stepAmount({ altKey: true }, steps)], [1, 10, 0.1]);
  assert.equal(stepperDisabled(1, { disabled: false, readonly: false, value: 10, max: 10 }), true);
  assert.equal(stepperDisabled(-1, { disabled: false, readonly: false, value: 10, max: 10 }), false);
  assert.equal(stepperDisabled(-1, { disabled: false, readonly: true, value: 5 }), true);
  assert.deepEqual([numberInputMode(0, 1), numberInputMode(0, 0.5), numberInputMode(null, 1)], ['numeric', 'decimal', 'text']);
});

test('ui-number-field: anatomy, recipe classes, ARIA, formatted text, steppers, no native form elements', async () => {
  const d = await mount('<ui-number-field label="Quantity" value="1234.5" min="0" max="10000" description="Units" locale="en-US"></ui-number-field>');
  const el = d.firstElementChild as any;
  assert.deepEqual([...el.children].map((c: Element) => c.getAttribute('data-part')), ['scrub-area', 'group', 'description', 'error']);
  assert.deepEqual([...part(el, 'group').children].map((c) => c.getAttribute('data-part')), ['decrement', 'prefix', 'input', 'suffix', 'increment']);
  const input = el.input as HTMLElement;
  assert.equal(input.getAttribute('role'), 'textbox');
  assert.equal(input.getAttribute('aria-roledescription'), 'Number field');
  assert.equal(input.getAttribute('aria-labelledby'), part(el, 'label').id);
  assert.equal(input.getAttribute('aria-describedby'), part(el, 'description').id);
  assert.equal(input.getAttribute('inputmode'), 'numeric', 'whole steps from 0: digits');
  assert.ok(input.hasAttribute('data-numeric'), 'tabular figures');
  assert.equal(input.textContent, '1,234.5');
  const inc = part(el, 'increment'), dec = part(el, 'decrement');
  assert.equal(inc.getAttribute('role'), 'button');
  assert.equal(inc.getAttribute('aria-label'), 'Increase');
  assert.equal(dec.getAttribute('aria-label'), 'Decrease');
  assert.equal(inc.getAttribute('tabindex'), '-1');
  assert.equal(inc.getAttribute('aria-controls'), input.id);
  assert.ok(el.classList.contains('ui-number-field__root'));
  for (const p of ['scrub-area', 'label', 'group', 'decrement', 'input', 'increment', 'description']) assert.ok(part(el, p).classList.contains(`ui-number-field__${p}`), p);
  assert.equal(part(el, 'prefix').hidden, true);
  assert.equal(d.querySelector(NATIVE), null);
  assert.equal(el.internals.value, '1234.5', 'the form value is the number');
  assert.ok(el.hasAttribute('data-filled'));
  d.remove();
});

test('ui-number-field: typing changes the value as it parses; blur commits (clamp, reformat) with Base UI reasons', async () => {
  const d = await mount('<ui-number-field label="N" value="5" min="0" max="100" locale="en-US"></ui-number-field>');
  const el = d.firstElementChild as any, input = el.input as HTMLElement, log = events(el);
  input.dispatchEvent(new Event('focus'));
  type(input, '1,500');
  assert.equal(el.value, 1500, 'typing: the parsed value (no clamp yet)');
  assert.equal(input.textContent, '1,500', 'the text stays the user\'s');
  type(input, '1,50x');
  assert.equal(el.value, 1500, 'unparsable text keeps the value');
  type(input, '');
  assert.equal(el.value, null);
  type(input, '250');
  input.dispatchEvent(new Event('blur'));
  await tick();
  assert.equal(el.value, 100, 'clamped to max on blur');
  assert.equal(input.textContent, '100');
  assert.deepEqual(log, ['input:1500:input-change', 'input:null:input-clear', 'input:250:input-change', 'input:100:input-blur', 'change:100:input-blur']);
  d.remove();
});

test('ui-number-field: arrow keys step (Shift large, Alt small), Home / End go to min / max, change fires per key', async () => {
  const d = await mount('<ui-number-field label="N" value="5" min="0" max="50" locale="en-US"></ui-number-field>');
  const el = d.firstElementChild as any, input = el.input as HTMLElement, log = events(el);
  key(input, 'ArrowUp'); assert.equal(el.value, 6);
  key(input, 'ArrowUp', { shiftKey: true }); assert.equal(el.value, 16);
  key(input, 'ArrowDown', { altKey: true }); assert.equal(el.value, 15.9);
  key(input, 'End'); assert.equal(el.value, 50);
  key(input, 'ArrowUp'); assert.equal(el.value, 50, 'clamped');
  key(input, 'Home'); assert.equal(el.value, 0);
  await tick();
  assert.equal(input.textContent, '0');
  assert.deepEqual(log.filter((l) => l.startsWith('change')), ['change:6:keyboard', 'change:16:keyboard', 'change:15.9:keyboard', 'change:50:keyboard', 'change:0:keyboard']);
  d.remove();
});

test('ui-number-field: stepper clicks step and commit; a stepper at its limit is data-disabled; disabled and read-only stop them', async () => {
  const d = await mount('<ui-number-field label="N" value="9" max="10" locale="en-US"></ui-number-field>');
  const el = d.firstElementChild as any, log = events(el);
  part(el, 'increment').click();
  await tick();
  assert.equal(el.value, 10);
  assert.ok(part(el, 'increment').hasAttribute('data-disabled'));
  assert.equal(part(el, 'increment').getAttribute('aria-disabled'), 'true');
  assert.ok(!part(el, 'decrement').hasAttribute('data-disabled'));
  part(el, 'decrement').click(); await tick();
  assert.equal(el.value, 9);
  assert.deepEqual(log, ['input:10:increment-press', 'change:10:increment-press', 'input:9:decrement-press', 'change:9:decrement-press']);
  el.readonly = true; await tick();
  part(el, 'increment').click();
  assert.equal(el.value, 9);
  assert.ok(el.hasAttribute('data-readonly'));
  assert.equal(el.input.getAttribute('contenteditable'), 'false');
  el.readonly = false; el.disabled = true; await tick();
  key(el.input, 'ArrowUp');
  assert.equal(el.value, 9);
  assert.ok(el.hasAttribute('data-disabled'));
  d.remove();
});

test('ui-number-field: press and hold repeats; scrub drags step per pixel-sensitivity with data-scrubbing; wheel needs allow-wheel-scrub', async () => {
  const d = await mount('<ui-number-field label="N" value="0" allow-wheel-scrub pixel-sensitivity="4" locale="en-US"></ui-number-field>');
  const el = d.firstElementChild as any, log = events(el);
  const pd = (t: Element, x = 0) => t.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, button: 0, clientX: x }));
  pd(part(el, 'increment'));
  assert.equal(el.value, 1, 'a step on press');
  await new Promise((r) => setTimeout(r, 400 + 60 * 3 + 30));
  window.dispatchEvent(new PointerEvent('pointerup'));
  const held = el.value;
  assert.ok(held >= 3, `held: repeats (${held})`);
  assert.equal(log.filter((l) => l.startsWith('change')).length, 1, 'one commit on release');
  part(el, 'increment').dispatchEvent(new MouseEvent('click', { bubbles: true })); // the click after the press does not step again
  assert.equal(el.value, held);
  // Scrub: 4px per step.
  pd(part(el, 'scrub-area'), 100);
  window.dispatchEvent(new PointerEvent('pointermove', { clientX: 113 }));
  assert.equal(el.value, held + 3);
  assert.ok(el.hasAttribute('data-scrubbing') && part(el, 'scrub-area').hasAttribute('data-scrubbing'));
  window.dispatchEvent(new PointerEvent('pointermove', { clientX: 104 })); // the 1px carried + 9px back: two steps
  assert.equal(el.value, held + 1);
  window.dispatchEvent(new PointerEvent('pointerup', { clientX: 105 }));
  assert.ok(!el.hasAttribute('data-scrubbing'));
  assert.equal(log.at(-1), `change:${held + 1}:scrub`);
  // Wheel: only while the input is focused and the group hovered.
  const group = part(el, 'group'), v = el.value;
  group.dispatchEvent(new WheelEvent('wheel', { deltaY: -10, bubbles: true, cancelable: true }));
  assert.equal(el.value, v, 'not focused');
  el.focus(); group.dispatchEvent(new PointerEvent('pointerenter'));
  const w = new WheelEvent('wheel', { deltaY: -10, bubbles: true, cancelable: true });
  group.dispatchEvent(w);
  assert.equal(el.value, v + 1);
  assert.ok(w.defaultPrevented);
  assert.equal(log.at(-1), `change:${v + 1}:wheel`);
  d.remove();
});

test('ui-number-field: snap-on-step and allow-out-of-range on commit; required and range validity; reset; adornments', async () => {
  const d = await mount(`<form><ui-number-field name="n" label="N" step="5" snap-on-step locale="en-US"></ui-number-field>
    <ui-number-field name="o" label="O" min="0" max="10" allow-out-of-range value="4" locale="en-US"><span slot="prefix">$</span><span slot="suffix">USD</span></ui-number-field>
    <ui-number-field name="r" label="R" required></ui-number-field></form>`);
  const [a, b, r] = d.querySelectorAll('ui-number-field') as any;
  type(a.input, '12'); a.input.dispatchEvent(new Event('blur'));
  assert.equal(a.value, 10, 'snapped to the step grid');
  type(b.input, '25'); b.input.dispatchEvent(new Event('blur')); await tick();
  assert.equal(b.value, 25, 'kept out of range');
  assert.equal(b.validity.rangeOverflow, true);
  assert.equal(part(b, 'prefix').textContent, '$');
  assert.equal(part(b, 'prefix').hidden, false);
  assert.equal(part(b, 'suffix').textContent, 'USD');
  assert.equal(r.validity.valueMissing, true);
  assert.ok(!r.hasAttribute('data-invalid'), 'not shown before interaction');
  r.dispatchEvent(new Event('focusout')); await tick();
  assert.ok(r.hasAttribute('data-invalid'));
  assert.equal(part(r, 'error').textContent, 'Fill in this field.');
  b.formResetCallback(); await tick();
  assert.equal(b.value, 4);
  assert.equal(b.input.textContent, '4');
  d.remove();
});

test('ui-number-field: format and locale display; paste keeps number characters; Enter commits', async () => {
  const d = await mount(`<ui-number-field label="Price" value="1200" locale="de-DE" format='{"style":"currency","currency":"EUR"}'></ui-number-field>`);
  const el = d.firstElementChild as any;
  assert.equal(el.input.textContent, formatNumberValue(1200, { locale: 'de-DE', format: { style: 'currency', currency: 'EUR' } }));
  assert.match(el.input.textContent, new RegExp(`1\\.200,00${NNBSP}€`));
  type(el.input, '1.500,5');
  key(el.input, 'Enter');
  el.input.dispatchEvent(new InputEvent('beforeinput', { inputType: 'insertParagraph', bubbles: true, cancelable: true }));
  await tick();
  assert.equal(el.value, 1500.5);
  assert.match(el.input.textContent, /1\.500,50/);
  const bad = new InputEvent('beforeinput', { inputType: 'insertText', data: 'x', bubbles: true, cancelable: true });
  el.input.dispatchEvent(bad);
  assert.ok(bad.defaultPrevented, 'a letter is refused');
  const ok = new InputEvent('beforeinput', { inputType: 'insertText', data: '5', bubbles: true, cancelable: true });
  el.input.dispatchEvent(ok);
  assert.ok(!ok.defaultPrevented);
  d.remove();
});

test('ui-number-field: authored parts are adopted; label text seeds the label', async () => {
  const preset = await mount('<ui-number-field label="Width" value="3"></ui-number-field>');
  const composed = await mount('<ui-number-field value="3"><span data-part="scrub-area" class="mine"><span data-part="label">Width</span></span><div data-part="group"><span data-part="decrement"><i name="caret-left"></i></span><div data-part="input"></div><span data-part="increment"></span></div></ui-number-field>');
  const a = preset.firstElementChild as any, b = composed.firstElementChild as any;
  assert.equal(b.label, 'Width');
  assert.ok(part(b, 'scrub-area').classList.contains('mine'));
  assert.equal(part(b, 'decrement').querySelector('i')!.getAttribute('name'), 'caret-left', 'stepper content replaced');
  assert.equal(part(b, 'increment').querySelector('i')!.getAttribute('name'), 'plus', 'an empty authored stepper keeps the glyph');
  const sig = (el: Element) => [...el.querySelectorAll('[data-part]')].map((p) => `${p.getAttribute('data-part')}:${[...p.classList].filter((c) => c.startsWith('ui-')).join(' ')}`).join('|');
  assert.equal(sig(b), sig(a));
  assert.equal(b.querySelectorAll('[data-part=group]').length, 1);
  preset.remove(); composed.remove();
});

test('React NumberField: same anatomy, ARIA, classes and data-* as the web component (parity)', async () => {
  const pairs: [string, any][] = [
    ['<ui-number-field label="Quantity" value="1234.5" min="0" description="Units" locale="en-US"></ui-number-field>', h(NumberField, { label: 'Quantity', defaultValue: 1234.5, min: 0, description: 'Units', locale: 'en-US' })],
    ['<ui-number-field label="Max" value="10" max="10" required locale="en-US"><span slot="prefix">$</span></ui-number-field>', h(NumberField, { label: 'Max', value: 10, max: 10, required: true, prefix: '$', locale: 'en-US' })],
    ['<ui-number-field label="Off" disabled></ui-number-field>', h(NumberField, { label: 'Off', disabled: true })],
  ];
  for (const [markup, el] of pairs) {
    const d = await mount(markup);
    const a = d.firstElementChild!, b = ssr(el);
    const shown = (x: Element) => [...x.querySelectorAll('[data-part]')].filter((p) => !(p as HTMLElement).hidden && !p.closest('[hidden]'));
    const parts = (x: Element) => shown(x).map((p) => `${p.getAttribute('data-part')}:${[...p.classList].sort().join(' ')}:${p.hasAttribute('data-disabled')}:${p.getAttribute('aria-label')}:${p.getAttribute('aria-roledescription')}:${p.hasAttribute('data-numeric')}`);
    assert.deepEqual(parts(a), parts(b), markup);
    assert.deepEqual([...a.classList].sort(), [...b.classList].sort());
    const state = (x: Element) => [...x.attributes].map((n) => n.name).filter((n) => n.startsWith('data-') && !['data-ui', 'data-size'].includes(n)).sort();
    assert.deepEqual(state(a), state(b), `${markup}: host data-*`);
    const ia = part(a, 'input'), ib = part(b, 'input');
    assert.equal(ia.textContent, (ib as HTMLInputElement).getAttribute('value') ?? '', 'the same formatted text');
    assert.equal(ia.getAttribute('inputmode'), ib.getAttribute('inputmode'));
    d.remove();
  }
  const hiddenInput = ssr(h(NumberField, { name: 'qty', defaultValue: -3 })).querySelector('input[type=hidden]')!;
  assert.equal(hiddenInput.getAttribute('name'), 'qty');
  assert.equal(hiddenInput.getAttribute('value'), '-3', 'the form value is the number');
});

test('React NumberField: compound parts render the preset; render and className; parts need their Root', () => {
  const preset = html(h(NumberField, { label: 'Width', defaultValue: 3, prefix: '$', description: 'In px' }));
  const composed = html(h(NumberField.Root, { defaultValue: 3 },
    h(NumberField.ScrubArea, null, h(NumberField.Label, null, 'Width')),
    h(NumberField.Group, { prefix: '$' }, h(NumberField.Decrement), h(NumberField.Input), h(NumberField.Increment)),
    h(NumberField.Description, null, 'In px')));
  assert.equal(composed, preset);
  assert.match(preset, /^<div data-ui="number-field"[^>]*class="ui-number-field__root"/);
  assert.match(preset, /<button data-part="decrement" type="button" aria-label="Decrease" aria-controls="ID" tabindex="-1"/);
  assert.match(preset, /<input data-part="input" data-numeric=""[^>]*aria-roledescription="Number field"[^>]*value="3"/);
  assert.match(html(h(NumberField.Root, { render: h('section'), className: (s: any) => (s.disabled ? 'off' : 'on'), disabled: true }, h(NumberField.Group))), /^<section data-ui="number-field"[^>]*class="ui-number-field__root off"/);
  assert.throws(() => html(h(NumberField.Input)), /inside NumberField.Root/);
});
