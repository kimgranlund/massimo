// Native twins: rules for ui-* tags not yet on slot recipes get data-ui twins with native state hooks (styles/native.ts).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { twinSelector, splitSelectors, withNativeTwins } from '../styles/native.ts';

test('twinSelector maps the tag and the ARIA state to the native element', () => {
  assert.equal(twinSelector('ui-option[aria-selected=true]'), '[data-ui=option]:is([aria-selected=true], :checked)');
  assert.equal(twinSelector('ui-option[data-active]'), '[data-ui=option]:is([data-active], :focus)');
  assert.equal(twinSelector('ui-listbox > ui-option'), '[data-ui=listbox] > [data-ui=option]');
  assert.equal(twinSelector('ui-card'), '[data-ui=card]');
  assert.equal(twinSelector('ui-checkbox[aria-checked=true]'), null, 'recipe components have no twins');
  assert.equal(twinSelector('ui-option-like'), null, 'whole tag names only');
});

test('splitSelectors respects nesting', () => {
  assert.deepEqual(splitSelectors(':is(a, b) > c, d:not(e, f), [x="1,2"]'), [':is(a, b) > c', 'd:not(e, f)', '[x="1,2"]']);
});

test('withNativeTwins adds twins (also inside at-rules) and merges equal keys instead of replacing', () => {
  const css = withNativeTwins({
    'ui-option': { display: 'flex' },
    '[data-ui=option]': { position: 'relative' },
    '@media (forced-colors: active)': { 'ui-listbox ui-option': { outline: '1px solid' } },
    'ui-button': { color: 'red' },
  });
  assert.deepEqual(css['[data-ui=option]'], { display: 'flex', position: 'relative' });
  assert.deepEqual(css['@media (forced-colors: active)']['[data-ui=listbox] [data-ui=option]'], { outline: '1px solid' });
  assert.equal(Object.keys(css).filter((k) => k.includes('button')).length, 1);
});
