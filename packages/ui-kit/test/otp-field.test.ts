// OTP Field (T-0026): resolver, headless editing (dom/otp.ts), the web component (anatomy, ARIA,
// typing, paste distribution, Backspace / Delete, arrows, focus redirect, validation type, mask,
// completion, validity, events, authored cells and separators), the React renderer (SSR), markup
// parity between them, and the compound parts.
import { tick } from './setup.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadTsx } from './load-tsx.ts';
import { resolveOtpField, resolveControl } from '../tokens/geometry/resolve.ts';
import { otpAllowed, otpDelete, otpFocusable, otpInsert, otpKey } from '../dom/otp.ts';

await import('../components/otp-field/otp-field.element.ts');
const { OTPField } = await loadTsx(new URL('../components/otp-field/otp-field.react.tsx', import.meta.url));
const NATIVE = 'input, button, select, textarea, label, fieldset, legend, option, optgroup, output, datalist, meter, progress, form';
const mount = async (markup: string) => { const d = document.createElement('div'); d.innerHTML = markup; document.body.append(d); await tick(); return d; };
const ssr = (el: any) => { const d = document.createElement('div'); d.innerHTML = renderToStaticMarkup(el); return d.querySelector('[data-ui]') as HTMLElement; };
const html = (el: any) => renderToStaticMarkup(el).replace(/_R_[a-z0-9]+_/gi, 'ID');
const typeIn = (cell: Element, data: string, inputType = 'insertText') => { const e = new InputEvent('beforeinput', { inputType, data, bubbles: true, cancelable: true }); cell.dispatchEvent(e); return e; };
const paste = (cell: Element, text: string) => { const e = new InputEvent('beforeinput', { inputType: 'insertFromPaste', data: text, bubbles: true, cancelable: true }); cell.dispatchEvent(e); return e; };
const key = (el: Element, k: string) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
const events = (el: Element) => { const log: string[] = []; for (const n of ['change', 'complete', 'valueinvalid']) el.addEventListener(n, (e: any) => log.push(`${n}:${e.detail.value}:${e.detail.reason}`)); return log; };

test('resolveOtpField: square 8u cells, pad u − B, control radius and font, 1u gap, 2u × 0.5u separator', () => {
  const o = resolveOtpField({ unit: 4 }), c = resolveControl({ unit: 4 });
  assert.equal(o.cell, 32);
  assert.equal(o.padding, 4);
  assert.equal(o.radius, c.radius);
  assert.equal(o.fontSize, 14);
  assert.equal(o.gap, 4);
  assert.deepEqual([o.separatorWidth, o.separatorThickness, o.separatorRadius], [8, 2, 1]);
  assert.equal(resolveOtpField({ unit: 4, border: 1 }).padding, 3);
});

test('dom/otp: validation types, overwrite and distribution, contiguous value, deletes, focus limit, keys', () => {
  assert.ok(otpAllowed('7') && !otpAllowed('a'));
  assert.ok(otpAllowed('a', 'alpha') && !otpAllowed('7', 'alpha'));
  assert.ok(otpAllowed('Z', 'alphanumeric') && otpAllowed('3', 'alphanumeric') && !otpAllowed('-', 'alphanumeric'));
  assert.ok(otpAllowed('-', 'none') && !otpAllowed(' ', 'none'));
  assert.deepEqual(otpInsert('12', 2, '3', 6), { value: '123', focus: 3, invalid: false, accepted: '3' });
  assert.deepEqual(otpInsert('123', 1, '9', 6).value, '193', 'overwrites the focused cell');
  assert.deepEqual(otpInsert('', 4, '5', 6).value, '5', 'never past the first empty cell');
  assert.deepEqual(otpInsert('', 0, '12 34-56', 6), { value: '123456', focus: 5, invalid: true, accepted: '123456' });
  assert.equal(otpInsert('', 0, '1234567', 6).value, '123456', 'cut to length');
  assert.equal(otpInsert('', 0, 'ab', 4, 'alpha', (v) => v.toUpperCase()).value, 'AB', 'normalizeValue');
  assert.deepEqual(otpDelete('123', 1, true), { value: '13', focus: 1 });
  assert.deepEqual(otpDelete('123', 3, true), { value: '12', focus: 2 }, 'Backspace on the empty cell clears the one before');
  assert.deepEqual(otpDelete('123', 3, false), { value: '123', focus: 3 });
  assert.equal(otpFocusable('12', 5, 6), 2);
  assert.equal(otpFocusable('123456', 9, 6), 5);
  assert.deepEqual(otpKey('ArrowLeft', true), { move: 1 }, 'mirrored in RTL');
});

test('ui-otp-field: role=group, length cells (role=textbox, Character i of n), one tab stop, autocomplete, inputmode, classes, no native elements', async () => {
  const d = await mount('<ui-otp-field name="code" length="4" label="Code" value="12"></ui-otp-field>');
  const el = d.firstElementChild as any, cells = el.cells as HTMLElement[];
  assert.equal(el.getAttribute('role'), 'group');
  assert.equal(el.getAttribute('aria-label'), 'Code');
  assert.equal(cells.length, 4);
  assert.deepEqual(cells.map((c) => c.textContent), ['1', '2', '', '']);
  assert.equal(cells[0].getAttribute('role'), 'textbox');
  assert.equal(cells[2].getAttribute('aria-label'), 'Character 3 of 4');
  assert.deepEqual(cells.map((c) => c.getAttribute('tabindex')), ['-1', '-1', '0', '-1'], 'the first empty cell is the tab stop');
  assert.equal(cells[0].getAttribute('autocomplete'), 'one-time-code');
  assert.equal(cells[1].getAttribute('autocomplete'), 'off');
  assert.equal(cells[0].getAttribute('inputmode'), 'numeric');
  assert.deepEqual(cells.map((c) => c.hasAttribute('data-filled')), [true, true, false, false]);
  assert.ok(el.classList.contains('ui-otp-field__root'));
  assert.ok(cells.every((c) => c.classList.contains('ui-otp-field__input')));
  assert.equal(el.internals.value, '12');
  assert.ok(el.hasAttribute('data-filled') && !el.hasAttribute('data-complete'));
  assert.equal(d.querySelector(NATIVE), null);
  el.length = 6; await tick();
  assert.equal(el.cells.length, 6, 'length regenerates the cells');
  d.remove();
});

test('ui-otp-field: typing fills and advances; letters are rejected (valueinvalid); paste distributes; complete fires once', async () => {
  const d = await mount('<ui-otp-field length="4"></ui-otp-field>');
  const el = d.firstElementChild as any, log = events(el);
  el.cells[0].focus();
  assert.ok(typeIn(el.cells[0], '1').defaultPrevented);
  await tick();
  assert.equal(el.value, '1');
  assert.equal(document.activeElement, el.cells[1], 'focus moves on');
  typeIn(el.cells[1], 'x');
  assert.equal(el.value, '1');
  assert.equal(document.activeElement, el.cells[1], 'a rejected key stays');
  paste(el.cells[1], '2 3-4 5');
  await tick();
  assert.equal(el.value, '1234');
  assert.ok(el.hasAttribute('data-complete'));
  assert.ok(el.cells.every((c: Element) => c.hasAttribute('data-complete')));
  assert.equal(document.activeElement, el.cells[3]);
  paste(el.cells[0], '1234');
  assert.deepEqual(log, ['change:1:input-change', 'valueinvalid:x:input-change', 'valueinvalid:2 3-4 5:input-paste', 'change:1234:input-paste', 'complete:1234:input-paste', 'complete:1234:input-paste'],
    'a complete value pasted again fires complete without change');
  d.remove();
});

test('ui-otp-field: Backspace, Delete, arrows, Home / End; focus never lands past the first empty cell', async () => {
  const d = await mount('<ui-otp-field length="5" value="123"></ui-otp-field>');
  const el = d.firstElementChild as any, log = events(el);
  el.cells[4].focus();
  assert.equal(document.activeElement, el.cells[3], 'redirected to the first empty cell');
  key(el.cells[3], 'Backspace');
  assert.equal(el.value, '12');
  assert.equal(document.activeElement, el.cells[2]);
  key(el.cells[2], 'ArrowLeft');
  assert.equal(document.activeElement, el.cells[1]);
  key(el.cells[1], 'Delete');
  assert.equal(el.value, '1');
  key(el.cells[1], 'Home');
  assert.equal(document.activeElement, el.cells[0]);
  key(el.cells[0], 'End');
  assert.equal(document.activeElement, el.cells[1], 'End stops at the first empty cell');
  el.cells[0].dispatchEvent(new InputEvent('beforeinput', { inputType: 'deleteContentBackward', bubbles: true, cancelable: true }));
  assert.equal(el.value, '');
  assert.deepEqual(log, ['change:12:input-clear', 'change:1:keyboard', 'change::input-clear']);
  d.remove();
});

test('ui-otp-field: validation types, mask, required and incomplete validity, readonly, disabled, auto-submit, reset', async () => {
  const d = await mount(`<form><ui-otp-field name="a" length="3" validation-type="alpha" mask></ui-otp-field><ui-otp-field name="r" length="3" required value="1"></ui-otp-field>
    <ui-otp-field name="ro" length="2" value="9" readonly></ui-otp-field><ui-otp-field name="s" length="2" auto-submit></ui-otp-field></form>`);
  const [a, r, ro, s] = d.querySelectorAll('ui-otp-field') as any;
  a.normalizeValue = (v: string) => v.toUpperCase();
  paste(a.cells[0], 'ab1c');
  assert.equal(a.value, 'ABC');
  assert.equal(a.cells[0].getAttribute('inputmode'), 'text');
  assert.ok(a.cells[0].hasAttribute('data-secret'), 'mask');
  assert.equal(r.validity.tooShort, true);
  r.dispatchEvent(new Event('focusout')); await tick();
  assert.ok(r.hasAttribute('data-invalid'));
  assert.equal(r.cells[0].getAttribute('aria-invalid'), 'true');
  typeIn(ro.cells[1], '5');
  assert.equal(ro.value, '9');
  assert.equal(ro.cells[0].getAttribute('contenteditable'), 'false');
  assert.ok(ro.cells[0].hasAttribute('data-readonly'));
  let submitted = 0;
  (s.form as HTMLFormElement).requestSubmit = () => { submitted++; };
  paste(s.cells[0], '42');
  assert.equal(submitted, 1, 'auto-submit on complete');
  r.formResetCallback(); await tick();
  assert.equal(r.value, '1');
  r.disabled = true; await tick();
  assert.ok(r.cells.every((c: Element) => c.getAttribute('tabindex') === '-1' && c.hasAttribute('data-disabled')));
  d.remove();
});

test('ui-otp-field: authored cells and separators keep the structure; length is their count', async () => {
  const d = await mount('<ui-otp-field length="9"><div data-part="input"></div><div data-part="input"></div><div data-part="separator" class="mine"></div><div data-part="input"></div><div data-part="input"></div></ui-otp-field>');
  const el = d.firstElementChild as any;
  assert.equal(el.length, 4);
  assert.deepEqual([...el.children].map((c: Element) => c.getAttribute('data-part')), ['input', 'input', 'separator', 'input', 'input']);
  const sep = el.querySelector('[data-part=separator]');
  assert.equal(sep.getAttribute('role'), 'separator');
  assert.equal(sep.getAttribute('data-orientation'), 'horizontal');
  assert.ok(sep.classList.contains('ui-otp-field__separator') && sep.classList.contains('mine'));
  paste(el.cells[0], '9876'); await tick();
  assert.equal(el.value, '9876');
  assert.equal(el.cells[2].textContent, '7');
  d.remove();
});

test('React OTPField: same anatomy, ARIA, classes and data-* as the web component (parity)', async () => {
  const pairs: [string, any][] = [
    ['<ui-otp-field length="4" label="Code" value="12"></ui-otp-field>', h(OTPField, { length: 4, label: 'Code', defaultValue: '12' })],
    ['<ui-otp-field length="3" value="123" disabled></ui-otp-field>', h(OTPField, { length: 3, value: '123', disabled: true })],
    ['<ui-otp-field length="2" validation-type="alphanumeric" readonly></ui-otp-field>', h(OTPField, { length: 2, validationType: 'alphanumeric', readOnly: true })],
  ];
  for (const [markup, el] of pairs) {
    const d = await mount(markup);
    const a = d.firstElementChild!, b = ssr(el);
    const data = (x: Element) => [...x.attributes].map((n) => n.name).filter((n) => n.startsWith('data-') && !['data-ui', 'data-size'].includes(n)).sort().join(' ');
    assert.equal(data(a), data(b), `${markup}: host data-*`);
    for (const k of ['role', 'aria-label', 'aria-disabled']) assert.equal(a.getAttribute(k), b.getAttribute(k), k);
    assert.deepEqual([...a.classList].sort(), [...b.classList].sort());
    const cells = (x: Element) => [...x.querySelectorAll('[data-part=input]')].map((c) => `${c.className}|${data(c)}|${c.getAttribute('aria-label')}|${c.getAttribute('tabindex') ?? c.getAttribute('tabIndex')}|${c.getAttribute('inputmode')}|${c.getAttribute('autocomplete')}|${c.textContent || (c as HTMLInputElement).getAttribute('value') || ''}`);
    assert.deepEqual(cells(a), cells(b), markup);
    d.remove();
  }
  const hidden = ssr(h(OTPField, { length: 4, name: 'code', defaultValue: '1234' })).querySelector('input[type=hidden]')!;
  assert.equal(hidden.getAttribute('name'), 'code');
  assert.equal(hidden.getAttribute('value'), '1234');
  assert.match(html(h(OTPField, { length: 2, mask: true })), /type="password"/);
});

test('React OTPField: compound parts render the preset; separators; render and className; parts need their Root', () => {
  const preset = html(h(OTPField, { length: 3, defaultValue: '1' }));
  const composed = html(h(OTPField.Root, { length: 3, defaultValue: '1' }, h(OTPField.Input), h(OTPField.Input), h(OTPField.Input)));
  assert.equal(composed, preset);
  const grouped = html(h(OTPField.Root, { length: 4 }, h(OTPField.Input), h(OTPField.Input), h(OTPField.Separator), h(OTPField.Input), h(OTPField.Input)));
  assert.match(grouped, /<div data-part="separator" role="separator" aria-orientation="horizontal" data-orientation="horizontal" class="ui-otp-field__separator"><\/div>/);
  assert.match(grouped, /aria-label="Character 4 of 4"/);
  assert.match(html(h(OTPField.Root, { length: 1, render: h('section'), className: (s: any) => (s.complete ? 'done' : 'todo'), value: '5' }, h(OTPField.Input))), /^<section data-ui="otp-field"[^>]*class="ui-otp-field__root done"/);
  assert.throws(() => html(h(OTPField.Input)), /inside OTPField.Root/);
});

test('ui-otp-field: SMS autofill through WebOTP fills the code as typed (input-change, complete); aborted on disconnect; off without one-time-code', async () => {
  // happy-dom: window is its own object, and navigator is the window's.
  const w = (globalThis as any).window as any, nav = w.navigator as any;
  const hadCred = Object.getOwnPropertyDescriptor(nav, 'credentials'), hadOtp = 'OTPCredential' in w;
  const calls: AbortSignal[] = [];
  let resolve!: (v: unknown) => void;
  Object.defineProperty(nav, 'credentials', { configurable: true, value: { get: (o: any) => { calls.push(o.signal); assert.deepEqual(o.otp, { transport: ['sms'] }); return new Promise((r) => { resolve = r; }); } } });
  w.OTPCredential = function OTPCredential() {};
  try {
    const d = await mount('<ui-otp-field length="6"></ui-otp-field>');
    const el = d.firstElementChild as any;
    const got: string[] = [];
    for (const t of ['change', 'complete']) el.addEventListener(t, (e: CustomEvent) => got.push(`${t}:${e.detail.value}:${e.detail.reason}`));
    assert.equal(calls.length, 1, 'asks for the code once connected');
    resolve({ code: '123456' }); await tick(); await tick();
    assert.equal(el.value, '123456');
    assert.deepEqual(got, ['change:123456:input-change', 'complete:123456:input-change']);
    d.remove();
    const off = await mount('<ui-otp-field length="6" autocomplete="off"></ui-otp-field>');
    assert.equal(calls.length, 1, 'no request without one-time-code');
    off.remove();
    const gone = await mount('<ui-otp-field length="4"></ui-otp-field>');
    assert.equal(calls.length, 2);
    gone.remove();
    assert.ok(calls[1].aborted, 'disconnecting aborts the request');
  } finally {
    if (hadCred) Object.defineProperty(nav, 'credentials', hadCred); else delete nav.credentials;
    if (!hadOtp) delete w.OTPCredential;
  }
});

test('requestOtpCode: null where WebOTP is missing', async () => {
  const { requestOtpCode } = await import('../dom/otp.ts');
  assert.equal(await requestOtpCode(new AbortController().signal), null);
});
