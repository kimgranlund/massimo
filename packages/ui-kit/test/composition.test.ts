// Composition (Base UI alignment level 4): the compound parts and the authored [data-part] markup
// render the same DOM, recipe classes and data-* as the one-component presets, in both renderers;
// render (element or function) replaces a part's element and className may be a function of the
// state (components/compound.react.tsx, components/slots.ts adoptPart).
import { tick } from './setup.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement as h, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadTsx } from './load-tsx.ts';

const L = (p: string) => loadTsx(new URL(`../components/${p}`, import.meta.url));
const { Button } = await L('button/button.react.tsx');
const { Checkbox, Radio, Switch } = await L('choice/choice.react.tsx');
const { Slider, Range, Progress } = await L('range/range.react.tsx');
const { Field } = await L('field/field.react.tsx');
const { Input } = await L('input/input.react.tsx');
const { Listbox, Segmented, Option } = await L('listbox/listbox.react.tsx');
const { Select, SelectOption } = await L('select/select.react.tsx');

/** Server markup with React's generated ids normalized (the trees differ in depth, so useId differs). */
const html = (el: ReactNode) => renderToStaticMarkup(el as any).replace(/_R_[a-z0-9]+_/gi, 'ID');
const i = (name: string) => h('i', { name });

test('React: each composed form renders the markup of its preset', () => {
  const pairs: [string, ReactNode, ReactNode][] = [
    ['checkbox', h(Checkbox, { defaultChecked: true, prefix: '#', suffix: '(2)', name: 'a' }, 'Accept'),
      h(Checkbox.Root, { defaultChecked: true, prefix: '#', suffix: '(2)', name: 'a' }, h(Checkbox.Indicator), 'Accept')],
    ['checkbox mixed', h(Checkbox, { indeterminate: true }, 'Some'), h(Checkbox.Root, { indeterminate: true }, 'Some', h(Checkbox.Indicator))],
    ['radio', h(Radio, { name: 'r', value: 'a', defaultChecked: true }, 'One'), h(Radio.Root, { name: 'r', value: 'a', defaultChecked: true }, h(Radio.Indicator), 'One')],
    ['switch', h(Switch, { defaultChecked: true, suffix: 'on' }, 'Wi-Fi'), h(Switch.Root, { defaultChecked: true, suffix: 'on' }, h(Switch.Thumb), 'Wi-Fi')],
    ['slider', h(Slider, { defaultValue: 25, label: 'Volume', name: 'v' }),
      h(Slider.Root, { defaultValue: 25, label: 'Volume', name: 'v' }, h(Slider.Track, null, h(Slider.Indicator)), h(Slider.Thumb))],
    ['range alias', h(Range, { defaultValue: 25 }), h(Slider, { defaultValue: 25 })],
    ['progress', h(Progress, { value: 40, label: 'Upload' }), h(Progress.Root, { value: 40, label: 'Upload' }, h(Progress.Track, null, h(Progress.Indicator)))],
    ['field', h(Field, { label: 'Unit', unit: 'px', readout: '4.5', description: 'Sets u.', error: 'Too big', layout: 'inline', htmlFor: 'f' }, (ids: object) => h(Range, { ...ids, defaultValue: 25 })),
      h(Field.Root, { layout: 'inline', htmlFor: 'f' },
        h(Field.Label, { unit: 'px' }, 'Unit'), h(Field.Control, { render: (ids: object) => h(Range, { ...ids, defaultValue: 25 }) }),
        h(Field.Readout, null, '4.5'), h(Field.Description, null, 'Sets u.'), h(Field.Error, null, 'Too big'))],
    ['input', h(Input, { id: 'p', label: 'Price', defaultValue: '40', description: 'Before tax', error: 'Bad', prefix: '$', suffix: 'USD', leading: i('tag') }),
      h(Input.Root, { id: 'p', defaultValue: '40' }, h(Input.Label, null, 'Price'), h(Input.Control, { prefix: '$', suffix: 'USD', leading: i('tag') }),
        h(Input.Description, null, 'Before tax'), h(Input.Error, null, 'Bad'))],
    ['listbox', h(Listbox, { label: 'Folder', defaultValue: 'inbox', name: 'l' }, h(Option, { value: 'inbox', leading: i('tray'), suffix: '12' }, 'Inbox'), h(Option, { value: 'sent' }, 'Sent')),
      h(Listbox.Root, { label: 'Folder', defaultValue: 'inbox', name: 'l' },
        h(Listbox.Item, { value: 'inbox', leading: i('tray'), suffix: '12' }, h(Listbox.ItemText, null, 'Inbox')), h(Listbox.Item, { value: 'sent' }, h(Listbox.ItemText, null, 'Sent')))],
    ['segmented', h(Segmented, { label: 'View', defaultValue: 'grid' }, h(Option, { value: 'grid' }, 'Grid')),
      h(Segmented.Root, { label: 'View', defaultValue: 'grid' }, h(Segmented.Item, { value: 'grid' }, h(Segmented.ItemText, null, 'Grid')))],
    ['select', h(Select, { id: 's', label: 'Role', defaultValue: 'eng', leading: i('briefcase'), prefix: 'As', suffix: 'x', description: 'Pick', error: 'Bad', name: 'role' },
      h(SelectOption, { value: 'design', leading: i('pen') }, 'Designer'), h(SelectOption, { value: 'eng' }, 'Engineer')),
      h(Select.Root, { id: 's', defaultValue: 'eng', name: 'role' },
        h(Select.Label, null, 'Role'),
        h(Select.Trigger, { leading: i('briefcase'), prefix: 'As', suffix: 'x' }, h(Select.Value), h(Select.Icon)),
        h(Select.Popup, null, h(Select.List, null,
          h(Select.Item, { value: 'design', leading: i('pen') }, h(Select.ItemText, null, 'Designer')), h(Select.Item, { value: 'eng' }, h(Select.ItemText, null, 'Engineer')))),
        h(Select.Description, null, 'Pick'), h(Select.Error, null, 'Bad'))],
    // A trigger without children gets Select.Value and Select.Icon.
    ['select default trigger', h(Select, { id: 't', label: 'A' }, h(SelectOption, { value: 'a' }, 'A')),
      h(Select.Root, { id: 't' }, h(Select.Label, null, 'A'), h(Select.Trigger), h(Select.Popup, null, h(Select.List, null, h(Select.Item, { value: 'a' }, 'A'))))],
  ];
  for (const [name, preset, composed] of pairs) {
    const a = html(preset), b = html(composed);
    assert.ok(a.includes('class="ui-'), `${name}: the preset carries recipe classes`);
    assert.equal(b, a, `${name}: composed = preset`);
  }
  // A composed error makes the host invalid at once, as the preset's error prop does.
  assert.match(html(h(Input.Root, null, h(Input.Control), h(Input.Error, null, 'Bad'))), /^<div data-ui="input" data-invalid=""/);
});

test('React: render takes an element (props merged into it) or a function of the props and the state', () => {
  // Element: the part's props, recipe class and data-* land on the author's element; its own props win, classes join.
  const a = html(h(Button, { render: h('a', { href: '#x', className: 'mine' }), variant: 'primary' }, 'Go'));
  assert.match(a, /^<a href="#x" class="ui-button__root ui-button__root--variant_primary mine" type="button" data-ui="button">/);
  const thumb = html(h(Slider.Root, { defaultValue: 25 }, h(Slider.Track, null, h(Slider.Indicator)), h(Slider.Thumb, { render: h('b') })));
  assert.match(thumb, /<b data-part="thumb" class="ui-range__thumb"><\/b><input type="range"/, 'the native input stays after the painted thumb');
  // Function: receives the merged props and the part's state.
  const seen: any[] = [];
  const cb = html(h(Checkbox.Root, { defaultChecked: true }, h(Checkbox.Indicator, { render: (props: any, state: any) => { seen.push(state); return h('em', props); } }), 'Accept'));
  assert.match(cb, /<span data-part="leading" class="ui-checkbox__leading"><em data-part="indicator" aria-hidden="true" class="ui-checkbox__indicator"><i name="check-bold" data-mark="checked">/);
  assert.equal(seen[0].checked, true);
  assert.equal(seen[0].filled, true);
  const sw = html(h(Switch.Root, null, h(Switch.Thumb, { render: (props: any) => h('i', { ...props, 'data-k': 'knob' }) })));
  assert.match(sw, /<span data-part="indicator" aria-hidden="true" class="ui-switch__indicator"><i data-part="thumb" class="ui-switch__thumb" data-k="knob"><\/i><\/span>/, 'Switch.Thumb renders the track around the thumb it replaces');
  // Field.Control hands the ids to the element it renders.
  assert.match(html(h(Field.Root, { htmlFor: 'u' }, h(Field.Label, null, 'U'), h(Field.Control, { render: h('ui-range' as any) }))), /<ui-range id="u" aria-labelledby="u-label"><\/ui-range>/);
});

test('React: className may be a function of the part state; the recipe class stays first', () => {
  const states: Record<string, any> = {};
  const cls = (k: string) => (s: any) => { states[k] = s; return s.checked || s.filled ? `${k}-on` : `${k}-off`; };
  const cb = html(h(Checkbox.Root, { defaultChecked: true, className: cls('root') }, h(Checkbox.Indicator, { className: cls('ind') }), 'x'));
  assert.match(cb, /^<label data-ui="checkbox" data-filled="" data-checked="" class="ui-checkbox__root root-on"/);
  assert.match(cb, /class="ui-checkbox__indicator ind-on"/);
  assert.equal(states.ind.checked, true, 'parts receive the Root state');
  html(h(Select.Root, { defaultValue: 'a', required: true }, h(Select.Trigger, { className: cls('trigger') }), h(Select.Popup, null, h(Select.List, null, h(Select.Item, { value: 'a', className: cls('item') }, 'A')))));
  assert.equal(states.trigger.required, true);
  assert.equal(states.trigger.filled, true);
  assert.equal(states.item.selected, true, 'a select item knows it is selected');
  const lb = html(h(Listbox.Root, { defaultValue: 'b', className: (s: any) => `o-${s.orientation}` }, h(Listbox.Item, { value: 'a', className: (s: any) => (s.selected ? 'sel' : 'not') }, 'A'), h(Listbox.Item, { value: 'b', className: (s: any) => (s.selected ? 'sel' : 'not') }, 'B')));
  assert.match(lb, /class="ui-listbox__root o-vertical"/);
  assert.match(lb, /class="ui-option__root not".*class="ui-option__root sel"/);
  assert.match(html(h(Progress.Root, { className: (s: any) => (s.indeterminate ? 'busy' : 'done') })), /class="ui-progress__root busy"/);
});

test('React: ItemIndicator renders on the selected item only; the select trigger hides its copy', () => {
  const lb = html(h(Listbox.Root, { defaultValue: 'b' }, h(Listbox.Item, { value: 'a' }, h(Listbox.ItemText, null, 'A'), h(Listbox.ItemIndicator)), h(Listbox.Item, { value: 'b' }, h(Listbox.ItemText, null, 'B'), h(Listbox.ItemIndicator))));
  assert.equal((lb.match(/data-mark="selected"/g) ?? []).length, 1);
  assert.match(lb, /<span data-part="contents" class="ui-option__contents">B<\/span><span data-part="trailing" data-mark="selected" aria-hidden="true" class="ui-option__trailing"><i name="check"><\/i><\/span>/);
  const sel = html(h(Select.Root, { defaultValue: 'b' }, h(Select.Trigger), h(Select.Popup, null, h(Select.List, null, h(Select.Item, { value: 'a' }, h(Select.ItemText, null, 'A'), h(Select.ItemIndicator)), h(Select.Item, { value: 'b' }, h(Select.ItemText, null, 'B'), h(Select.ItemIndicator))))));
  assert.equal((sel.match(/data-mark="selected"/g) ?? []).length, 1);
});

// ── Web components: authored [data-part] children ──
await import('../components/select/select.element.ts');
await import('../components/input/input.element.ts');
await import('../components/choice/choice.element.ts');
await import('../components/range/range.element.ts');
await import('../components/field/field.element.ts');

/**
 * Per element (the host, then every part and option in document order): its data-part path, classes,
 * data-* state attributes and hidden flag. Ids, ARIA references and slot attributes are left out:
 * they differ by construction (generated ids) and style nothing.
 */
function signature(host: Element) {
  const chain = (el: Element) => { const p: string[] = []; for (let e: Element | null = el; e && e !== host; e = e.parentElement) if (e.getAttribute('data-part')) p.unshift(e.getAttribute('data-part')!); else if (e.localName === 'ui-option') p.unshift('option'); return p.join('>'); };
  const data = (el: Element) => [...el.attributes].filter((a) => a.name.startsWith('data-') && a.name !== 'data-part').map((a) => `${a.name}=${a.value}`).sort().join(' ');
  return [host, ...host.querySelectorAll('[data-part], ui-option, i')].map((el) => `${chain(el) || 'host'} <${el.localName}> .${el.className} ${data(el)}${(el as HTMLElement).hidden ? ' hidden' : ''} ${el.localName === 'i' ? el.getAttribute('name') : ''}`.trim());
}

async function mount(markup: string) {
  const box = document.createElement('div');
  box.innerHTML = markup;
  document.body.append(box);
  await tick(); await tick();
  return box;
}

test('web components: authored parts render the same parts, classes and data-* as the generated anatomy', async () => {
  const pairs: [string, string, string][] = [
    ['select',
      '<ui-select label="Role" value="eng" description="Pick"><i slot="leading" name="briefcase"></i><span slot="prefix">As</span><ui-option value="design">Designer</ui-option><ui-option value="eng">Engineer</ui-option></ui-select>',
      '<ui-select value="eng"><span data-part="label">Role</span><div data-part="trigger"><span data-part="leading"><i name="briefcase"></i></span><span data-part="prefix">As</span><span data-part="value"></span><span data-part="icon"></span></div><div data-part="popup"><div data-part="list"><ui-option value="design">Designer</ui-option><ui-option value="eng">Engineer</ui-option></div></div><span data-part="description">Pick</span></ui-select>'],
    ['input',
      '<ui-input label="Price" value="40" description="Before tax"><span slot="prefix">$</span><span slot="suffix">USD</span></ui-input>',
      '<ui-input value="40"><span data-part="label">Price</span><div data-part="control"><span data-part="prefix"><span>$</span></span><span data-part="contents"></span><span data-part="suffix"><span>USD</span></span></div><span data-part="description">Before tax</span></ui-input>'],
    ['checkbox', '<ui-checkbox checked>Accept<span slot="suffix">(2)</span></ui-checkbox>',
      '<ui-checkbox checked><span data-part="leading"><span data-part="indicator"></span></span><span data-part="contents">Accept</span><span data-part="suffix">(2)</span></ui-checkbox>'],
    ['checkbox loose indicator', '<ui-checkbox>Accept</ui-checkbox>', '<ui-checkbox><span data-part="indicator"></span>Accept</ui-checkbox>'],
    ['radio', '<ui-radio name="c1" value="a" checked>One</ui-radio>', '<ui-radio name="c2" value="a" checked><span data-part="indicator"></span><span data-part="contents">One</span></ui-radio>'],
    ['switch', '<ui-switch checked>Wi-Fi</ui-switch>', '<ui-switch checked><span data-part="indicator"><span data-part="thumb"></span></span>Wi-Fi</ui-switch>'],
    ['switch thumbless', '<ui-switch>Wi-Fi</ui-switch>', '<ui-switch><span data-part="indicator"></span>Wi-Fi</ui-switch>'],
    ['range', '<ui-range value="25"></ui-range>', '<ui-range value="25"><span data-part="track"><span data-part="indicator"></span></span><span data-part="thumb"></span></ui-range>'],
    ['progress', '<ui-progress value="40"></ui-progress>', '<ui-progress value="40"><span data-part="track"><span data-part="indicator"></span></span></ui-progress>'],
    ['field',
      '<ui-field label="Unit" unit="px" readout="4.5" description="Sets u." error="Too big" layout="inline"><ui-range value="25"></ui-range></ui-field>',
      '<ui-field layout="inline"><span data-part="label"><span data-part="contents">Unit</span><span data-part="suffix">px</span></span><ui-range value="25"></ui-range><span data-part="readout">4.5</span><span data-part="description">Sets u.</span><span data-part="error">Too big</span></ui-field>'],
    ['field text label', '<ui-field label="Name"><ui-range></ui-range></ui-field>', '<ui-field><span data-part="label">Name</span><ui-range></ui-range></ui-field>'],
  ];
  for (const [name, preset, composed] of pairs) {
    const a = await mount(preset), b = await mount(composed);
    const sa = signature(a.firstElementChild!), sb = signature(b.firstElementChild!);
    assert.ok(sa[0].includes('ui-'), `${name}: the host carries recipe classes`);
    assert.deepEqual(sb, sa, `${name}: composed = generated`);
    a.remove(); b.remove();
  }
});

test('web components: authored parts keep the author attributes, classes and content; text seeds properties', async () => {
  const box = await mount('<ui-select><span data-part="label" class="mine">Role</span><div data-part="trigger" data-k="t" class="t"><span data-part="value">Pick one</span><span data-part="icon"><i name="caret-up-down"></i></span></div><ui-option value="a">A</ui-option></ui-select>');
  const s = box.firstElementChild as any;
  assert.equal(s.label, 'Role');
  assert.equal(s.placeholder, 'Pick one', 'the authored value text is the placeholder');
  const trigger = s.trigger as HTMLElement;
  assert.equal(trigger.getAttribute('data-k'), 't');
  assert.ok(trigger.classList.contains('t') && trigger.classList.contains('ui-select__trigger'));
  assert.equal(trigger.getAttribute('role'), 'combobox', 'the host still owns the role');
  assert.ok(s.querySelector(':scope > [data-part=label]').classList.contains('mine'));
  assert.equal(trigger.querySelector('[data-part=icon] > i')!.getAttribute('name'), 'caret-up-down', 'the authored icon replaces the chevron');
  assert.equal(trigger.querySelector('[data-part=value]')!.textContent, 'Pick one');
  // A reconnect keeps the adopted parts.
  box.append(s); await tick(); await tick();
  assert.equal(s.trigger.getAttribute('data-k'), 't');
  assert.equal(s.trigger.querySelector('[data-part=icon] > i')!.getAttribute('name'), 'caret-up-down');
  assert.equal(s.label, 'Role');
  box.remove();
  const r = await mount('<ui-range><span data-part="thumb" class="knob"><i name="dot"></i></span></ui-range>');
  const thumb = r.querySelector('[data-part=thumb]')!;
  assert.ok(thumb.classList.contains('knob') && thumb.classList.contains('ui-range__thumb'));
  assert.equal(thumb.querySelector('i')!.getAttribute('name'), 'dot');
  r.remove();
  const c = await mount('<ui-checkbox><span data-part="indicator" class="box"><i name="x"></i></span>Accept</ui-checkbox>');
  const ind = c.querySelector('[data-part=leading] > [data-part=indicator]')!;
  assert.ok(ind.classList.contains('box') && ind.classList.contains('ui-checkbox__indicator'));
  assert.equal(ind.querySelectorAll('i').length, 1, 'an authored indicator with content keeps it');
  c.remove();
});
