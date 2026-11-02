// ui-field and ui-field-grid: structure, labelling (the control's name is the field label), readout,
// description, subgrid rows, and no native form elements.
import { tick } from './setup.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
await import('../components/field/field.element.ts');
await import('../components/input/input.element.ts');
await import('../components/select/select.element.ts');
await import('../components/range/range.element.ts');
await import('../components/choice/choice.element.ts');
await import('../components/listbox/listbox.element.ts');

const NATIVE = 'input, button, select, textarea, label, fieldset, legend, option, optgroup, output, datalist, meter, progress, form';
const mount = (html: string) => { const d = document.createElement('div'); d.innerHTML = html; document.body.append(d); return d; };
/** Text of the elements an aria-labelledby (or describedby) value lists, joined by spaces. */
const refText = (el: Element | null, attr = 'aria-labelledby') =>
  (el?.getAttribute(attr) ?? '').split(/\s+/).filter(Boolean).map((id) => document.getElementById(id)?.textContent ?? `#${id}?`).join(' ');

test('ui-field: label, unit, readout and description parts around the authored control; no native elements', async () => {
  const d = mount('<ui-field label="Unit" unit="px" readout="4.5" description="Sets u."><ui-range value="4.5" min="2" max="12" step="0.5"></ui-range></ui-field>');
  const f = d.firstElementChild as any;
  await tick();
  assert.equal(f.querySelector(NATIVE), null);
  const parts = [...f.children].map((c: Element) => c.getAttribute('data-part') ?? c.localName);
  assert.deepEqual(parts, ['label', 'ui-range', 'readout', 'description'], 'the control stays a direct child; parts are siblings');
  assert.equal(f.querySelector(':scope > [data-part=label] > [data-part=contents]').textContent, 'Unit');
  assert.equal(f.querySelector(':scope > [data-part=label] > [data-part=suffix]').textContent, 'px');
  assert.equal(f.querySelector(':scope > [data-part=readout]').textContent, '4.5');
  assert.equal(f.layout, 'stacked', 'stacked is the default');
  // Recipe classes on host and parts.
  assert.ok(f.classList.contains('ui-field__root') && f.classList.contains('ui-field__root--layout_stacked'));
  assert.ok(f.querySelector('[data-part=readout]').classList.contains('ui-field__readout'));
  assert.ok(f.querySelector('[data-part=suffix]').classList.contains('ui-field__suffix'));
  d.remove();
});

test('ui-field labels a host-role control: aria-labelledby is the label text and unit; description wired', async () => {
  const d = mount('<ui-field label="Unit" unit="px" description="Sets u."><ui-range></ui-range></ui-field>');
  const f = d.firstElementChild as any, r = f.querySelector('ui-range');
  await tick();
  assert.equal(r.getAttribute('role'), 'slider');
  assert.equal(refText(r), 'Unit px', 'accessible name = field label + unit');
  assert.equal(refText(r, 'aria-describedby'), 'Sets u.');
  assert.equal(r.hasAttribute('aria-label'), false, 'no label of its own');
  f.unit = ''; f.label = 'Size'; await tick();
  assert.equal(refText(r), 'Size', 'follows the label; drops the unit id');
  f.label = ''; f.description = ''; await tick();
  assert.equal(r.hasAttribute('aria-labelledby'), false, 'no label, no reference');
  assert.equal(r.hasAttribute('aria-describedby'), false);
  d.remove();
});

test('ui-field labels ui-input and ui-select through their labelledby property (the role element inside)', async () => {
  const d = mount(`
    <ui-field label="Name" description="Shown on the invoice."><ui-input value="Ada" description="Own help."></ui-input></ui-field>
    <ui-field label="Role" layout="inline"><ui-select value="a"><ui-option value="a">A</ui-option></ui-select></ui-field>`);
  const [fi, fs] = d.querySelectorAll('ui-field') as any;
  await tick();
  const editor = fi.querySelector('[role=textbox]');
  assert.equal(refText(editor), 'Name');
  assert.equal(refText(editor, 'aria-describedby'), 'Own help. Shown on the invoice.', 'own description first, then the field\'s');
  assert.equal(fi.querySelector('ui-input').hasAttribute('aria-labelledby'), false, 'nothing on the generic host');
  const trigger = fs.querySelector('[role=combobox]');
  assert.equal(refText(trigger), 'Role');
  assert.equal(refText(fs.querySelector('[role=listbox]')), 'Role', 'the popup listbox is named too');
  // The control re-renders (value change) and keeps the outside name.
  fi.querySelector('ui-input').value = 'Grace'; await tick();
  assert.equal(refText(editor), 'Name');
  // A label of its own wins over the field's.
  fi.querySelector('ui-input').label = 'Own'; await tick();
  assert.equal(refText(editor), 'Own');
  assert.equal(d.querySelector(NATIVE), null);
  d.remove();
});

test('ui-field: a swapped control is rewired and the old one unwired; a label press focuses or toggles', async () => {
  const d = mount('<ui-field label="Wi-Fi" layout="inline"><ui-switch></ui-switch></ui-field>');
  const f = d.firstElementChild as any;
  await tick();
  const sw = f.querySelector('ui-switch');
  assert.equal(refText(sw), 'Wi-Fi');
  (f.querySelector('[data-part=label] > [data-part=contents]') as HTMLElement).click(); await tick();
  assert.equal(sw.checked, true, 'label press toggles a switch');
  const seg = document.createElement('ui-segmented');
  seg.innerHTML = '<ui-option value="a">A</ui-option><ui-option value="b">B</ui-option>';
  sw.replaceWith(seg);
  await tick(); await tick();
  assert.equal(refText(seg), 'Wi-Fi', 'new control named');
  assert.equal(sw.hasAttribute('aria-labelledby'), false, 'old control released');
  (f.querySelector('[data-part=label]') as HTMLElement).click();
  assert.equal(document.activeElement, seg, 'label press focuses other controls');
  d.remove();
});

test('ui-field: a slot="readout" child is the readout; a plain wrapper of several controls is not labelled', async () => {
  const d = mount('<ui-field id="pad" label="card" readout="x"><div class="pair"><ui-select labelledby="pad-field-label head"></ui-select></div><span slot="readout">12 px</span></ui-field><span id="head">Padding</span>');
  const f = d.firstElementChild as any;
  await tick();
  const readouts = f.querySelectorAll(':scope > [data-part=readout]');
  assert.equal(readouts.length, 1);
  assert.equal(readouts[0].textContent, '12 px');
  assert.ok(readouts[0].classList.contains('ui-field__readout'));
  assert.equal(f.querySelector('.pair').hasAttribute('aria-labelledby'), false, 'a div is not a control');
  assert.deepEqual(f.labelIds, ['pad-field-label'], 'ids follow the host id');
  assert.equal(refText(f.querySelector('[role=combobox]')), 'card Padding', 'a nested control lists the field label id itself');
  d.remove();
});

test('ui-field-grid: fields become subgrid rows (recipe classes); the inline layout variant', async () => {
  const d = mount('<ui-field-grid><h2>Geometry</h2><ui-field label="Unit" layout="inline"><ui-range></ui-range></ui-field></ui-field-grid>');
  const g = d.firstElementChild as any;
  await tick();
  assert.ok(g.classList.contains('ui-field-grid__root'));
  const f = g.querySelector('ui-field');
  assert.ok(f.classList.contains('ui-field__root--layout_inline'));
  // Each layout variant makes the field a subgrid row of a grid (variants outrank base styles, so the
  // rule lives there, not in the grid recipe's base).
  const { field, fieldGrid } = await import('../components/field/field.recipe.ts');
  for (const layout of ['stacked', 'inline'])
    assert.deepEqual((field as any).variants.layout[layout].root['.ui-field-grid__root > &'], { gridColumn: '1 / -1', gridTemplateColumns: 'subgrid' }, layout);
  assert.equal((fieldGrid as any).base.root['& > :not(.ui-field__root)'].gridColumn, '1 / -1', 'headings span every column');
  d.remove();
});
