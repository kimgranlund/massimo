import { test } from 'node:test';
import assert from 'node:assert/strict';
import { navigate, createTypeahead, selectKeyIntent, placePopup } from '../dom/listbox.ts';

const items = [{ value: 'a', label: 'Apple' }, { value: 'b', label: 'Banana', disabled: true }, { value: 'c', label: 'Cherry' }, { value: 'd', label: 'Cranberry' }];

test('navigate skips disabled, stops at ends, honours orientation and RTL', () => {
  assert.equal(navigate(items, 0, 'ArrowDown'), 2);
  assert.equal(navigate(items, 3, 'ArrowDown'), 3);
  assert.equal(navigate(items, -1, 'ArrowUp'), 3);
  assert.equal(navigate(items, 0, 'ArrowRight'), undefined, 'vertical ignores horizontal keys');
  assert.equal(navigate(items, 0, 'ArrowRight', { orientation: 'horizontal' }), 2);
  assert.equal(navigate(items, 2, 'ArrowRight', { orientation: 'horizontal', rtl: true }), 0);
});

test('typeahead: prefix search, cycling, timeout, space continues a search', () => {
  const t = createTypeahead(500);
  assert.equal(t(items, 0, 'c', 1000), 2);
  assert.equal(t(items, 2, 'r', 1100), 3, 'cr -> Cranberry');
  assert.equal(t(items, 3, 'c', 2000), 2, 'new search after timeout');
  assert.equal(t(items, 2, 'c', 2100), 3, 'cc cycles');
  assert.equal(t(items, 0, 'b', 5000), undefined, 'disabled not matched');
  assert.equal(createTypeahead()(items, 0, ' ', 0), undefined, 'space alone is not a search');
});

test('selectKeyIntent and placePopup', () => {
  assert.equal(selectKeyIntent(false, { key: 'ArrowDown' }), 'open');
  assert.equal(selectKeyIntent(true, { key: ' ' }, true), undefined, 'space continues search');
  assert.equal(selectKeyIntent(true, { key: ' ' }), 'commit');
  assert.equal(selectKeyIntent(true, { key: 'Tab' }), 'commit-tab');
  const below = placePopup({ top: 100, bottom: 140, left: 20, width: 200 }, { width: 800, height: 600 });
  assert.equal(below.side, 'bottom');
  assert.equal(below.top, 144);
  const above = placePopup({ top: 520, bottom: 560, left: 700, width: 200 }, { width: 800, height: 600 });
  assert.equal(above.side, 'top');
  assert.equal(above.left, 592, 'clamped inside the viewport');
});
