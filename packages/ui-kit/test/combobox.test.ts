// Combobox (and Autocomplete, below): web component behavior in happy-dom, React server markup and
// client behavior, the same data-* state on both renderers (contracts/states.json), Base UI event
// details, and the composed parts against the presets.
import { tick } from './setup.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createElement as h, type ReactElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadTsx } from './load-tsx.ts';
import { comboboxKeyIntent, inlineCompletion, matchesQuery } from '../dom/combobox.ts';

await import('../components/combobox/combobox.element.ts');
const { Combobox } = await loadTsx(new URL('../components/combobox/combobox.react.tsx', import.meta.url));

const NATIVE = 'input, button, select, textarea, label, fieldset, legend, option, optgroup, output, datalist, meter, progress, form';
const contract = JSON.parse(readFileSync(new URL('../contracts/states.json', import.meta.url), 'utf8'));
const STATE = new Set(Object.keys(contract.attributes));
const STRUCTURE = new Set(['data-ui', 'data-part', 'data-size', 'data-index', 'data-value']);
const names = (el: Element | null | undefined) => [...(el?.attributes ?? [])].map((a) => a.name).filter((n) => n.startsWith('data-') && !STRUCTURE.has(n)).sort();
const key = (el: Element, k: string, o: KeyboardEventInit = {}) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...o }));
const part = (el: Element, p: string) => el.querySelector<HTMLElement>(`[data-part=${p}]`)!;
const FRUIT = '<ui-option value="apple">Apple</ui-option><ui-option value="banana">Banana</ui-option><ui-option value="cherry" disabled>Cherry</ui-option><ui-option value="date">Dåte</ui-option>';

async function wc<T extends HTMLElement = any>(markup: string): Promise<T> {
  const box = document.createElement('div');
  box.innerHTML = markup;
  document.body.append(box);
  await tick(); await tick();
  return box.firstElementChild as T;
}
function ssr(el: ReactElement) {
  const box = document.createElement('div');
  box.innerHTML = renderToStaticMarkup(el);
  return box.querySelector('[data-ui]') as HTMLElement;
}
/** Type into the contenteditable input. */
async function type(el: any, text: string) {
  const ed = el.editor as HTMLElement;
  ed.textContent = text;
  ed.dispatchEvent(new Event('input', { bubbles: true }));
  await tick();
}
const shown = (el: Element) => [...el.querySelectorAll('ui-option')].filter((o) => !(o as HTMLElement).hidden).map((o) => o.getAttribute('value'));
const events = (el: Element, ...types: string[]) => {
  const log: [string, any][] = [];
  for (const t of types) el.addEventListener(t, (e) => log.push([t, (e as CustomEvent).detail]));
  return log;
};

test('dom/combobox: filter, inline completion and key intents', () => {
  assert.ok(matchesQuery('Banana', 'NAN'));
  assert.ok(matchesQuery('Dåte', 'date'), 'accent-insensitive');
  assert.ok(matchesQuery('Apple', ''));
  assert.ok(!matchesQuery('Apple', 'x'));
  const items = [{ value: 'a', label: 'Apple' }, { value: 'b', label: 'Apricot', disabled: true }, { value: 'c', label: 'Avocado' }];
  assert.equal(inlineCompletion(items, 'ap'), 0);
  assert.equal(inlineCompletion(items, 'av'), 2);
  assert.equal(inlineCompletion(items, 'apple'), undefined, 'nothing left to complete');
  assert.equal(comboboxKeyIntent(false, { key: 'ArrowDown' }), 'open');
  assert.equal(comboboxKeyIntent(false, { key: 'Enter' }), undefined);
  assert.equal(comboboxKeyIntent(true, { key: 'Enter' }), 'commit');
  assert.equal(comboboxKeyIntent(true, { key: 'Home' }), undefined, 'Home and End stay with the caret');
  assert.equal(comboboxKeyIntent(true, { key: 'Backspace' }, { empty: true, multiple: true }), 'remove-last');
});

test('ui-combobox: anatomy, ARIA and no native form elements', async () => {
  const el = await wc(`<ui-combobox label="Fruit" placeholder="Pick">${FRUIT}</ui-combobox>`);
  assert.equal(el.querySelector(NATIVE), null);
  assert.deepEqual([...el.children].map((c) => c.getAttribute('data-part')), ['label', 'control', 'popup', 'description', 'error']);
  assert.deepEqual([...part(el, 'control').children].map((c) => c.getAttribute('data-part')), ['leading', 'prefix', 'chips', 'input', 'suffix', 'clear', 'trigger']);
  const input = el.editor;
  assert.equal(input.getAttribute('role'), 'combobox');
  assert.equal(input.getAttribute('aria-autocomplete'), 'list');
  assert.equal(input.getAttribute('aria-expanded'), 'false');
  assert.equal(input.getAttribute('aria-controls'), el.popup.id);
  assert.equal(input.getAttribute('aria-labelledby'), part(el, 'label').id);
  assert.equal(input.getAttribute('contenteditable'), 'plaintext-only');
  assert.equal(input.getAttribute('data-placeholder'), 'Pick');
  assert.equal(el.popup.getAttribute('role'), 'listbox');
  assert.equal(el.list.querySelectorAll('ui-option').length, 4, 'options move into the list');
  assert.ok(part(el, 'trigger').getAttribute('role') === 'button' && part(el, 'trigger').getAttribute('tabindex') === '-1');
  assert.ok(part(el, 'clear').hidden, 'clear hides while empty');
  assert.ok(el.classList.contains('ui-combobox__root'));
  assert.ok(part(el, 'empty').classList.contains('ui-combobox__empty'));
  el.parentElement!.remove();
});

test('ui-combobox: typing filters (contains, accents folded), opens, highlights; Enter commits', async () => {
  const el = await wc(`<ui-combobox label="Fruit">${FRUIT}</ui-combobox>`);
  const log = events(el, 'openchange', 'inputvaluechange', 'change');
  await type(el, 'an');
  assert.equal(el.open, true);
  assert.deepEqual(shown(el), ['banana']);
  assert.deepEqual(log[0], ['inputvaluechange', { value: 'an', reason: 'input-change', event: log[0][1].event }]);
  assert.equal(log[1][1].reason, 'input-change', 'typing opens with reason input-change');
  assert.equal(el.editor.getAttribute('aria-activedescendant'), null, 'no highlight without autoHighlight');
  key(el.editor, 'ArrowDown'); await tick();
  const banana = el.querySelector('ui-option[value=banana]');
  assert.equal(el.editor.getAttribute('aria-activedescendant'), banana.id);
  assert.ok(banana.hasAttribute('data-highlighted'));
  key(el.editor, 'Enter'); await tick();
  assert.equal(el.value, 'banana');
  assert.equal(el.inputValue, 'Banana', 'the input shows the label');
  assert.equal(el.editor.textContent, 'Banana');
  assert.equal(el.open, false);
  assert.ok(banana.hasAttribute('data-selected'));
  const change = log.find(([t]) => t === 'change')!;
  assert.equal(change[1].value, 'banana');
  assert.equal(change[1].reason, 'item-press');
  await type(el, 'DATE');
  assert.deepEqual(shown(el), ['date'], 'accent-insensitive');
  await type(el, 'zz');
  assert.deepEqual(shown(el), []);
  assert.ok(!part(el, 'empty').hidden, 'empty state');
  assert.equal(part(el, 'empty').textContent, 'No results.');
  assert.ok(el.popup.hasAttribute('data-empty') && el.editor.hasAttribute('data-list-empty'));
  key(el.editor, 'Escape'); await tick();
  assert.equal(el.open, false);
  assert.equal(el.inputValue, 'Banana', 'closing restores the selected label');
  el.parentElement!.remove();
});

test('ui-combobox: arrows skip disabled and filtered options; autoHighlight; trigger and clear', async () => {
  const el = await wc(`<ui-combobox auto-highlight>${FRUIT}</ui-combobox>`);
  const log = events(el, 'openchange', 'change', 'inputvaluechange');
  key(el.editor, 'ArrowDown'); await tick();
  assert.equal(el.open, true);
  assert.equal(log[0][1].reason, 'list-navigation');
  const ids = (v: string) => el.querySelector(`ui-option[value=${v}]`).id;
  assert.equal(el.editor.getAttribute('aria-activedescendant'), ids('apple'));
  key(el.editor, 'ArrowDown'); key(el.editor, 'ArrowDown'); await tick();
  assert.equal(el.editor.getAttribute('aria-activedescendant'), ids('date'), 'cherry is disabled');
  await type(el, 'b');
  assert.equal(el.editor.getAttribute('aria-activedescendant'), ids('banana'), 'autoHighlight takes the first match');
  key(el.editor, 'Escape'); await tick();
  part(el, 'trigger').click(); await tick();
  assert.equal(el.open, true);
  assert.equal(log.at(-1)![1].reason, 'trigger-press');
  assert.equal(shown(el).length, 4, 'the trigger shows every option');
  (el.querySelector('ui-option[value=date]') as HTMLElement).click(); await tick();
  assert.equal(el.value, 'date');
  assert.ok(!part(el, 'clear').hidden);
  part(el, 'clear').click(); await tick();
  assert.equal(el.value, '');
  assert.equal(el.inputValue, '');
  assert.equal(log.filter(([t]) => t === 'change').at(-1)![1].reason, 'clear-press');
  // openchange is cancelable
  el.addEventListener('openchange', (e: Event) => e.preventDefault(), { once: true });
  part(el, 'trigger').click(); await tick();
  assert.equal(el.open, false);
  el.parentElement!.remove();
});

test('ui-combobox: multiple shows chips, toggles, removes; form value per value', async () => {
  const form = document.createElement('form');
  form.innerHTML = `<ui-combobox name="f" multiple value="apple,date">${FRUIT}</ui-combobox>`;
  document.body.append(form);
  await tick(); await tick();
  const el = form.firstElementChild as any;
  const chips = () => [...part(el, 'chips').children].map((c) => c.textContent);
  assert.deepEqual(chips(), ['Apple', 'Dåte']);
  assert.ok(part(el, 'chip').classList.contains('ui-combobox__chip'));
  assert.equal(el.popup.getAttribute('aria-multiselectable'), 'true');
  const fd = el.formValue() as FormData;
  assert.deepEqual(fd.getAll('f'), ['apple', 'date']);
  const log = events(el, 'change');
  await type(el, 'ban');
  key(el.editor, 'ArrowDown'); key(el.editor, 'Enter'); await tick();
  assert.deepEqual(el.values, ['apple', 'date', 'banana']);
  assert.deepEqual(log.at(-1)![1].value, ['apple', 'date', 'banana']);
  assert.equal(el.open, true, 'multiple stays open');
  assert.equal(el.inputValue, '', 'the query clears');
  (el.querySelector('[data-part=chip-remove]') as HTMLElement).click(); await tick();
  assert.deepEqual(el.values, ['date', 'banana']);
  assert.equal(log.at(-1)![1].reason, 'chip-remove-press');
  key(el.editor, 'Backspace'); await tick();
  assert.deepEqual(el.values, ['date']);
  form.remove();
});

test('ui-combobox: required, disabled, readonly; composition adopts parts', async () => {
  const el = await wc(`<ui-combobox required>${FRUIT}</ui-combobox>`);
  assert.equal(el.checkValidity(), false);
  el.value = 'apple'; await tick();
  assert.equal(el.checkValidity(), true);
  assert.equal(el.inputValue, 'Apple', 'a set value writes its label');
  el.disabled = true; await tick();
  assert.equal(el.editor.getAttribute('contenteditable'), 'false');
  key(el.editor, 'ArrowDown'); await tick();
  assert.equal(el.open, false);
  el.parentElement!.remove();
  const c = await wc(`<ui-combobox><span data-part="label">Town</span><div data-part="control"><span slot="leading"><i name="map-pin"></i></span><span data-part="trigger"><i name="caret-up-down"></i></span></div>
    <div data-part="popup"><div data-part="list">${FRUIT}</div><div data-part="empty">Nothing</div></div></ui-combobox>`);
  assert.equal(c.label, 'Town');
  assert.equal(c.emptyText, 'Nothing');
  assert.ok(!part(c, 'leading').hidden);
  assert.equal(part(c, 'trigger').querySelector('i')!.getAttribute('name'), 'caret-up-down');
  assert.equal(c.list.querySelectorAll('ui-option').length, 4);
  c.parentElement!.remove();
});

test('Combobox (React): the same data-* as the web component on host and parts', async () => {
  const a = await wc(`<ui-combobox label="Fruit" value="banana">${FRUIT}</ui-combobox>`);
  const b = ssr(h(Combobox, { label: 'Fruit', defaultValue: 'banana' },
    h(Combobox.Item, { value: 'apple' }, 'Apple'), h(Combobox.Item, { value: 'banana' }, 'Banana'), h(Combobox.Item, { value: 'cherry', disabled: true }, 'Cherry'), h(Combobox.Item, { value: 'date' }, 'Dåte')));
  assert.equal(b.querySelector('[data-part=input]')!.localName, 'input');
  assert.equal((b.querySelector('[data-part=input]') as HTMLInputElement).getAttribute('value'), 'Banana');
  const allowed = contract.components['ui-combobox'];
  const pairs: [string, string][] = [['host', ':scope'], ['input', '[data-part=input]'], ['trigger', '[data-part=trigger]'], ['clear', '[data-part=clear]'], ['popup', '[data-part=popup]'], ['list', '[data-part=list]'], ['item', '[role=option]']];
  for (const [label, s] of pairs) {
    const ea = s === ':scope' ? [a] : [...a.querySelectorAll(s)], eb = s === ':scope' ? [b] : [...b.querySelectorAll(s)];
    assert.equal(ea.length, eb.length, `${label}: same count`);
    ea.forEach((x, k) => {
      const na = names(x).filter((n) => n !== 'data-dirty' && n !== 'data-touched'), nb = names(eb[k]).filter((n) => n !== 'data-dirty' && n !== 'data-touched');
      assert.deepEqual(na, nb, `${label}[${k}]`);
      for (const n of na) { assert.ok(STATE.has(n), `${n} in the contract`); assert.ok((allowed[label] ?? []).includes(n), `${label}: ${n} listed`); }
    });
  }
  const kit = (el: Element | null) => [...(el?.classList ?? [])].filter((c) => c.startsWith('ui-')).join(' ');
  for (const p of ['control', 'input', 'trigger', 'popup', 'list', 'empty']) assert.equal(kit(part(a, p)), kit(part(b, p)), `${p} classes`);
  a.parentElement!.remove();
});

test('Combobox (React): composed parts render the preset', () => {
  const items = [h(Combobox.Item, { key: 'a', value: 'a' }, 'A'), h(Combobox.Item, { key: 'b', value: 'b' }, 'B')];
  const preset = renderToStaticMarkup(h(Combobox, { label: 'L', id: 'x' }, ...items));
  const parts = renderToStaticMarkup(h(Combobox.Root, { id: 'x' },
    h(Combobox.Label, null, 'L'),
    h(Combobox.Control, null, h(Combobox.Chips), h(Combobox.Input), h(Combobox.Clear), h(Combobox.Trigger)),
    h(Combobox.Positioner, null, h(Combobox.Popup, null, h(Combobox.List, null, ...items), h(Combobox.Empty, null, 'No results.')))));
  assert.equal(parts, preset);
});

// ── Autocomplete ──

await import('../components/autocomplete/autocomplete.element.ts');
const { Autocomplete } = await loadTsx(new URL('../components/autocomplete/autocomplete.react.tsx', import.meta.url));
const CITIES = '<ui-option>Oslo</ui-option><ui-option>Osaka</ui-option><ui-option disabled>Ottawa</ui-option><ui-option>Paris</ui-option>';
/** Type one character at the end, as the browser would (an insertText input event). */
async function typeChar(el: any, text: string) {
  const ed = el.editor as HTMLElement;
  ed.textContent = text;
  ed.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: text.slice(-1) }));
  await tick();
}

test('ui-autocomplete: anatomy (no chips, no trigger), free text is the value, suggestions filter', async () => {
  const el = await wc(`<ui-autocomplete label="City" name="city">${CITIES}</ui-autocomplete>`);
  assert.equal(el.querySelector(NATIVE), null);
  assert.deepEqual([...part(el, 'control').children].map((c) => c.getAttribute('data-part')), ['leading', 'prefix', 'input', 'suffix', 'clear', 'trigger']);
  assert.ok(part(el, 'trigger').hidden, 'no trigger without show-trigger');
  assert.ok(el.classList.contains('ui-autocomplete__root'));
  assert.equal(el.editor.getAttribute('aria-autocomplete'), 'list');
  const log = events(el, 'input', 'change', 'openchange');
  await type(el, 'os');
  assert.equal(el.value, 'os', 'the text is the value');
  assert.equal(el.formValue(), 'os');
  assert.deepEqual(shown(el), [null, null], 'Oslo and Osaka');
  assert.equal(log[0][0], 'input');
  assert.equal(log[0][1].reason, 'input-change');
  assert.equal(log.filter(([t]) => t === 'change').length, 0, 'change waits for a commit or blur');
  assert.ok(el.open);
  key(el.editor, 'ArrowDown'); key(el.editor, 'ArrowDown'); key(el.editor, 'Enter'); await tick();
  assert.equal(el.value, 'Osaka');
  assert.equal(el.editor.textContent, 'Osaka');
  assert.equal(el.open, false);
  assert.equal(log.find(([t]) => t === 'change')![1].reason, 'item-press');
  assert.equal(el.querySelector('[data-selected]'), null, 'suggestions are never selected');
  await type(el, 'zz');
  assert.ok(part(el, 'empty').hidden, 'nothing matches and no empty text: no message (the popup is not shown)');
  assert.ok(el.popup.hasAttribute('data-empty'));
  el.parentElement!.remove();
});

test('ui-autocomplete: inline completion (mode both / inline); arrows write the suggestion; clear; show-trigger', async () => {
  const el = await wc(`<ui-autocomplete mode="both" show-trigger>${CITIES}</ui-autocomplete>`);
  assert.equal(el.editor.getAttribute('aria-autocomplete'), 'both');
  assert.ok(!part(el, 'trigger').hidden);
  await typeChar(el, 'Os');
  assert.equal(el.value, 'Oslo', 'completed to the first match');
  assert.equal(el.editor.textContent, 'Oslo');
  assert.equal(el.editor.getAttribute('aria-activedescendant'), el.querySelector('ui-option').id);
  assert.equal(window.getSelection()?.toString(), 'lo', 'the completion is selected');
  key(el.editor, 'ArrowDown'); await tick();
  assert.equal(el.value, 'Osaka', 'arrows write the highlighted suggestion');
  // Deleting does not complete again.
  el.editor.textContent = 'O';
  el.editor.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'deleteContentBackward' }));
  await tick();
  assert.equal(el.value, 'O');
  const log = events(el, 'change');
  part(el, 'clear').click(); await tick();
  assert.equal(el.value, '');
  assert.equal(log[0][1].reason, 'clear-press');
  const inl = await wc(`<ui-autocomplete mode="inline">${CITIES}</ui-autocomplete>`);
  await typeChar(inl, 'P');
  assert.equal(inl.value, 'Paris');
  assert.equal(shown(inl).length, 4, 'inline does not filter');
  el.parentElement!.remove(); inl.parentElement!.remove();
});

test('ui-autocomplete: required; change on blur; Enter without a highlight submits', async () => {
  const form = document.createElement('form');
  form.innerHTML = `<ui-autocomplete name="q" required>${CITIES}</ui-autocomplete>`;
  document.body.append(form);
  await tick(); await tick();
  const el = form.firstElementChild as any;
  assert.equal(el.checkValidity(), false);
  let submitted = 0;
  form.requestSubmit = () => { submitted++; };
  el.dispatchEvent(new Event('focusin'));
  await type(el, 'Berlin');
  assert.equal(el.checkValidity(), true);
  key(el.editor, 'Enter'); await tick();
  assert.equal(el.open, false);
  el.editor.dispatchEvent(new InputEvent('beforeinput', { bubbles: true, cancelable: true, inputType: 'insertParagraph' }));
  assert.equal(submitted, 1);
  const log = events(el, 'change');
  el.dispatchEvent(new Event('focusout'));
  assert.equal(log[0][1].value, 'Berlin');
  assert.equal(log[0][1].reason, 'focus-out');
  form.remove();
});

test('Autocomplete (React): the same data-* and classes as the web component; parts render the preset', async () => {
  const a = await wc(`<ui-autocomplete label="City" value="Oslo">${CITIES}</ui-autocomplete>`);
  const items = () => [h(Autocomplete.Item, { key: 1, value: 'Oslo' }, 'Oslo'), h(Autocomplete.Item, { key: 2, value: 'Osaka' }, 'Osaka'), h(Autocomplete.Item, { key: 3, value: 'Ottawa', disabled: true }, 'Ottawa'), h(Autocomplete.Item, { key: 4, value: 'Paris' }, 'Paris')];
  const b = ssr(h(Autocomplete, { label: 'City', defaultValue: 'Oslo' }, ...items()));
  assert.equal(b.getAttribute('data-ui'), 'autocomplete');
  assert.equal(b.querySelector('[data-part=chips]'), null);
  assert.equal(b.querySelector('[data-part=input]')!.getAttribute('value'), 'Oslo');
  const allowed = contract.components['ui-autocomplete'];
  for (const [label, s] of [['host', ':scope'], ['input', '[data-part=input]'], ['clear', '[data-part=clear]'], ['popup', '[data-part=popup]'], ['list', '[data-part=list]'], ['item', '[role=option]']] as const) {
    const ea = s === ':scope' ? [a] : [...a.querySelectorAll(s)], eb = s === ':scope' ? [b] : [...b.querySelectorAll(s)];
    assert.equal(ea.length, eb.length, `${label}: same count`);
    ea.forEach((x, k) => {
      const na = names(x).filter((n) => n !== 'data-dirty'), nb = names(eb[k]).filter((n) => n !== 'data-dirty');
      assert.deepEqual(na, nb, `${label}[${k}]`);
      for (const n of na) assert.ok((allowed[label] ?? []).includes(n), `${label}: ${n} listed`);
    });
  }
  const kit = (el: Element | null) => [...(el?.classList ?? [])].filter((c) => c.startsWith('ui-')).join(' ');
  for (const p of ['control', 'input', 'clear', 'popup', 'list']) assert.equal(kit(part(a, p)), kit(part(b, p)), `${p} classes`);
  a.parentElement!.remove();
  const preset = renderToStaticMarkup(h(Autocomplete, { label: 'L', id: 'x', mode: 'both' }, ...items()));
  const parts = renderToStaticMarkup(h(Autocomplete.Root, { id: 'x', mode: 'both' },
    h(Autocomplete.Label, null, 'L'), h(Autocomplete.Control, null, h(Autocomplete.Input), h(Autocomplete.Clear)),
    h(Autocomplete.Positioner, null, h(Autocomplete.Popup, null, h(Autocomplete.List, null, ...items()), h(Autocomplete.Empty, null, '')))));
  assert.equal(parts, preset);
  assert.match(preset, /aria-autocomplete="both"/);
});

const GROUPED = '<div data-part="group"><div data-part="group-label">Fruit</div><ui-option value="apple">Apple</ui-option><ui-option value="banana">Banana</ui-option></div>'
  + '<div data-part="group"><div data-part="group-label">Vegetables</div><ui-option value="carrot">Carrot</ui-option><ui-option value="leek">Leek</ui-option></div>';

test('ui-combobox: groups (Combobox.Group, GroupLabel) are named, navigate in order, and hide when filtered out', async () => {
  const el = await wc(`<ui-combobox label="Food">${GROUPED}</ui-combobox>`);
  const groups = [...el.list.querySelectorAll(':scope > [data-part=group]')] as HTMLElement[];
  assert.equal(groups.length, 2, 'authored groups move into the list');
  const [fruit, veg] = groups;
  assert.equal(fruit.getAttribute('role'), 'group');
  assert.equal(fruit.getAttribute('aria-labelledby'), part(fruit, 'group-label').id);
  assert.ok(fruit.classList.contains('ui-combobox__group'));
  assert.ok(part(fruit, 'group-label').classList.contains('ui-combobox__group-label'));
  assert.deepEqual(el.options.map((o: any) => o.optionValue), ['apple', 'banana', 'carrot', 'leek']);
  el.open = true; await tick();
  key(el.editor, 'ArrowDown'); await tick();
  key(el.editor, 'ArrowDown'); await tick();
  key(el.editor, 'ArrowDown'); await tick();
  assert.equal(el.editor.getAttribute('aria-activedescendant'), el.querySelector('ui-option[value=carrot]').id, 'arrows cross into the next group');
  await type(el, 'lee');
  assert.deepEqual(shown(el), ['leek']);
  assert.ok(fruit.hidden, 'a group with no match hides');
  assert.ok(!veg.hidden);
  await type(el, 'zz');
  assert.ok(fruit.hidden && veg.hidden);
  el.parentElement!.remove();
});

test('Combobox (React): Group and GroupLabel with the same markup; a group with no match hides', async () => {
  const { createRoot } = await import('react-dom/client');
  const { act } = await import('react');
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  const C = Combobox;
  const tree = h(C.Root, { defaultOpen: true }, h(C.Control, null, h(C.Input)), h(C.Popup, null, h(C.List, null,
    h(C.Group, null, h(C.GroupLabel, null, 'Fruit'), h(C.Item, { value: 'apple' }, 'Apple'), h(C.Item, { value: 'banana' }, 'Banana')),
    h(C.Group, null, h(C.GroupLabel, null, 'Vegetables'), h(C.Item, { value: 'carrot' }, 'Carrot'), h(C.Item, { value: 'leek' }, 'Leek')))));
  const box = document.createElement('div');
  document.body.append(box);
  const root = createRoot(box);
  await act(async () => root.render(tree));
  const groups = [...box.querySelectorAll<HTMLElement>('[data-part=list] > [data-part=group]')];
  assert.equal(groups.length, 2);
  const [fruit, veg] = groups;
  assert.equal(fruit.getAttribute('role'), 'group');
  assert.equal(fruit.getAttribute('aria-labelledby'), part(fruit, 'group-label').id);
  assert.match(fruit.className, /ui-combobox__group/);
  assert.match(part(fruit, 'group-label').className, /ui-combobox__group-label/);
  const input = box.querySelector<HTMLInputElement>('[data-part=input]')!;
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
  await act(async () => { setter.call(input, 'lee'); input.dispatchEvent(new Event('input', { bubbles: true })); });
  assert.ok(fruit.hidden, 'a group with no match hides');
  assert.ok(!veg.hidden);
  await act(async () => root.unmount());
  box.remove();
});
