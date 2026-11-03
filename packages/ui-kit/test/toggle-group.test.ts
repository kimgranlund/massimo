// Toggle group (T-0030, Base UI ToggleGroup): the web component (single and multiple pressed values,
// the group's cancelable change in place of the toggle's, seeding, roving focus with arrow keys,
// Home / End and RTL, disabled), the React renderer (server markup, client presses and keys,
// controlled value) and the same data-* on both renderers.
import { tick } from './setup.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { loadTsx } from './load-tsx.ts';

await import('../components/toggle-group/toggle-group.element.ts');
const { ToggleGroup } = await loadTsx(new URL('../components/toggle-group/toggle-group.react.tsx', import.meta.url));
const { Toggle } = await loadTsx(new URL('../components/toggle/toggle.react.tsx', import.meta.url));
const contract = JSON.parse(readFileSync(new URL('../contracts/states.json', import.meta.url), 'utf8'));
const NATIVE = 'input, button, select, textarea, label, fieldset, legend, option, optgroup, output, datalist, meter, progress, form';
const STRUCTURE = ['data-ui', 'data-size', 'data-icon-size', 'data-part'];
const dataNames = (el: Element) => [...el.attributes].map((a) => a.name).filter((n) => n.startsWith('data-') && !STRUCTURE.includes(n)).sort();
const key = (el: Element, k: string) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
const ssr = (el: any) => { const d = document.createElement('div'); d.innerHTML = renderToStaticMarkup(el); return d.firstElementChild as HTMLElement; };
async function wc(markup: string) {
  const box = document.createElement('div');
  box.innerHTML = markup;
  document.body.append(box);
  await tick(); await tick();
  return box.firstElementChild as any;
}
const THREE = '<ui-toggle value="b">Bold</ui-toggle><ui-toggle value="i">Italic</ui-toggle><ui-toggle value="u">Underline</ui-toggle>';
const pressed = (g: Element) => [...g.querySelectorAll('ui-toggle')].map((t: any) => t.pressed);
const focused = () => document.activeElement?.textContent;
const tabs = (g: Element) => [...g.querySelectorAll('ui-toggle')].map((t) => t.getAttribute('tabindex'));

test('ui-toggle-group single: one pressed at a time, the pressed one releases, change carries the values', async () => {
  const g = await wc(`<ui-toggle-group aria-label="Marks" default-value="i">${THREE}</ui-toggle-group>`);
  assert.equal(g.getAttribute('role'), 'group');
  assert.deepEqual(dataNames(g), ['data-orientation']);
  assert.equal(g.querySelector(NATIVE), null);
  assert.ok(g.classList.contains('ui-toggle-group__root'));
  assert.deepEqual(pressed(g), [false, true, false], 'default-value seeds the value');
  const got: any[] = [];
  let toggleEvents = 0;
  g.addEventListener('change', (e: CustomEvent) => { if (e.target === g) got.push([e.detail.value, e.detail.reason]); else toggleEvents++; });
  document.body.addEventListener('change', (e) => { if ((e.target as Element).localName === 'ui-toggle') toggleEvents++; });
  const [b, i] = g.querySelectorAll('ui-toggle');
  b.click(); await tick();
  assert.deepEqual(pressed(g), [true, false, false], 'pressing one releases the other');
  assert.equal(g.value, 'b');
  b.click(); await tick();
  assert.deepEqual(pressed(g), [false, false, false], 'the pressed toggle releases');
  key(i, 'Enter'); await tick();
  assert.deepEqual(got, [[['b'], 'none'], [[], 'none'], [['i'], 'none']]);
  assert.equal(toggleEvents, 0, "a toggle's own change does not leave the group");
  g.parentElement.remove();
});

test('ui-toggle-group multiple: several pressed; seeding from pressed toggles; cancel keeps the state', async () => {
  const g = await wc('<ui-toggle-group multiple><ui-toggle value="b" pressed>B</ui-toggle><ui-toggle value="i" pressed>I</ui-toggle><ui-toggle>U</ui-toggle></ui-toggle-group>');
  assert.deepEqual(dataNames(g), ['data-multiple', 'data-orientation']);
  assert.equal(g.value, 'b,i', 'pressed toggles seed the value');
  const u = g.querySelectorAll('ui-toggle')[2];
  u.click(); await tick();
  assert.equal(g.value, 'b,i,2', 'a toggle without a value is its index');
  assert.deepEqual(pressed(g), [true, true, true]);
  g.addEventListener('change', (e: Event) => e.preventDefault(), { once: true });
  g.querySelector('ui-toggle').click(); await tick();
  assert.deepEqual(pressed(g), [true, true, true], 'preventDefault keeps every toggle');
  g.value = 'i'; await tick();
  assert.deepEqual(pressed(g), [false, true, false], 'setting value presses without an event');
  g.parentElement.remove();
  // Single mode seeds only the first pressed toggle.
  const s = await wc('<ui-toggle-group><ui-toggle value="a" pressed>A</ui-toggle><ui-toggle value="b" pressed>B</ui-toggle></ui-toggle-group>');
  assert.deepEqual(pressed(s), [true, false]);
  s.parentElement.remove();
});

test('ui-toggle-group roving focus: one tab stop, arrows wrap and skip disabled, Home / End, RTL, vertical', async () => {
  const g = await wc('<ui-toggle-group value="u"><ui-toggle value="b">B</ui-toggle><ui-toggle value="i" disabled>I</ui-toggle><ui-toggle value="u">U</ui-toggle><ui-toggle value="s">S</ui-toggle></ui-toggle-group>');
  const [b, , u, s] = g.querySelectorAll('ui-toggle');
  assert.deepEqual(tabs(g), ['-1', '-1', '0', '-1'], 'the first pressed toggle is the tab stop');
  u.focus(); key(u, 'ArrowRight'); await tick();
  assert.equal(focused(), s.textContent);
  key(s, 'ArrowRight'); await tick();
  assert.equal(focused(), b.textContent, 'wraps');
  key(b, 'ArrowRight'); await tick();
  assert.equal(focused(), u.textContent, 'skips the disabled toggle');
  assert.deepEqual(tabs(g), ['-1', '-1', '0', '-1'], 'the focused toggle is the tab stop');
  key(u, 'Home'); await tick();
  assert.equal(focused(), b.textContent);
  assert.deepEqual(tabs(g), ['0', '-1', '-1', '-1']);
  key(b, 'End'); await tick();
  assert.equal(focused(), s.textContent);
  g.style.direction = 'rtl';
  key(s, 'ArrowRight'); await tick();
  assert.equal(focused(), u.textContent, 'RTL mirrors Left / Right');
  g.style.direction = '';
  g.orientation = 'vertical'; await tick();
  assert.equal(g.getAttribute('data-orientation'), 'vertical');
  key(u, 'ArrowRight'); await tick();
  assert.equal(focused(), u.textContent, 'vertical ignores Left / Right');
  key(u, 'ArrowDown'); await tick();
  assert.equal(focused(), s.textContent);
  g.disabled = true; await tick();
  assert.ok([...g.querySelectorAll('ui-toggle')].every((t: Element) => t.hasAttribute('data-disabled') && t.getAttribute('tabindex') === '-1'), 'a disabled group disables every toggle');
  g.querySelector('ui-toggle').click(); await tick();
  assert.equal(g.value, 'u');
  g.parentElement.remove();
});

test('React ToggleGroup: server markup and data-* match the web component', async () => {
  const el = ssr(h(ToggleGroup, { 'aria-label': 'Marks', multiple: true, defaultValue: ['i'] }, h(Toggle, { value: 'b' }, 'Bold'), h(Toggle, { value: 'i' }, 'Italic')));
  assert.equal(el.getAttribute('role'), 'group');
  assert.equal(el.getAttribute('data-ui'), 'toggle-group');
  assert.ok(el.classList.contains('ui-toggle-group__root'));
  assert.deepEqual([...el.querySelectorAll('button')].map((b) => b.getAttribute('aria-pressed')), ['false', 'true']);
  const w = await wc('<ui-toggle-group aria-label="Marks" multiple value="i"><ui-toggle value="b">Bold</ui-toggle><ui-toggle value="i">Italic</ui-toggle></ui-toggle-group>');
  assert.deepEqual(dataNames(el), dataNames(w), 'host data-*');
  [...el.querySelectorAll('button')].forEach((b, k) => assert.deepEqual(dataNames(b), dataNames(w.querySelectorAll('ui-toggle')[k]), `toggle ${k} data-*`));
  assert.deepEqual(contract.components['ui-toggle-group'].host, ['data-orientation', 'data-disabled', 'data-multiple']);
  const d = ssr(h(ToggleGroup, { disabled: true, orientation: 'vertical' }, h(Toggle, { value: 'b' }, 'Bold')));
  assert.deepEqual(dataNames(d), ['data-disabled', 'data-orientation']);
  assert.ok(d.querySelector('button')!.hasAttribute('data-disabled'), 'a disabled group disables its toggles');
  w.parentElement.remove();
});

test('React ToggleGroup: presses, single and multiple, onValueChange, roving tabIndex and keys', async () => {
  const { createRoot } = await import('react-dom/client');
  const { act } = await import('react');
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  const box = document.createElement('div');
  document.body.append(box);
  const root = createRoot(box);
  const calls: any[] = [];
  const items = () => [h(Toggle, { key: 'b', value: 'b' }, 'B'), h(Toggle, { key: 'i', value: 'i', disabled: true }, 'I'), h(Toggle, { key: 'u', value: 'u', onPressedChange: (p: boolean) => calls.push(['toggle', p]) }, 'U')];
  await act(async () => root.render(h(ToggleGroup, { defaultValue: ['u'], onValueChange: (v: string[], d: any) => calls.push([v, d.reason]) }, items())));
  const bs = () => [...box.querySelectorAll<HTMLButtonElement>('button')];
  assert.deepEqual(bs().map((b) => b.tabIndex), [-1, -1, 0], 'the first pressed toggle is the tab stop');
  await act(async () => { bs()[0].click(); });
  assert.deepEqual(bs().map((b) => b.getAttribute('aria-pressed')), ['true', 'false', 'false']);
  await act(async () => { bs()[0].click(); });
  assert.deepEqual(bs().map((b) => b.getAttribute('aria-pressed')), ['false', 'false', 'false'], 'the pressed toggle releases');
  await act(async () => { bs()[2].click(); });
  assert.deepEqual(calls, [[['b'], 'none'], [[], 'none'], [['u'], 'none'], ['toggle', true]], "a toggle's onPressedChange still fires");
  await act(async () => { bs()[2].focus(); key(bs()[2], 'ArrowRight'); });
  assert.equal(focused(), bs()[0].textContent, 'wraps and skips the disabled toggle');
  assert.deepEqual(bs().map((b) => b.tabIndex), [0, -1, -1], 'the focused toggle is the tab stop');
  await act(async () => { key(bs()[0], 'End'); });
  assert.equal(focused(), bs()[2].textContent);
  // Multiple and controlled.
  calls.length = 0;
  await act(async () => root.render(h(ToggleGroup, { multiple: true, value: ['b'], onValueChange: (v: string[]) => calls.push(v) }, items())));
  await act(async () => { bs()[2].click(); });
  assert.deepEqual(calls[0], ['b', 'u']);
  assert.deepEqual(bs().map((b) => b.getAttribute('aria-pressed')), ['true', 'false', 'false'], 'controlled: the value prop decides');
  await act(async () => root.unmount());
  box.remove();
});
