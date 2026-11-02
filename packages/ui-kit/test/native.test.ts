// Native twins: rules for ui-* tags get data-ui twins with native state hooks (styles/native.ts).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { twinSelector, splitSelectors, withNativeTwins } from '../styles/native.ts';

test('twinSelector maps the tag and the ARIA state to the native input', () => {
  assert.equal(twinSelector('ui-checkbox[aria-checked=true] [data-part=box]'), '[data-ui=checkbox]:has(> input:checked) [data-part=box]');
  assert.equal(twinSelector('ui-checkbox[aria-checked=mixed] [data-part=box] > i'), '[data-ui=checkbox]:has(> input:indeterminate) [data-part=box] > i');
  assert.equal(twinSelector('ui-radio:not([aria-checked=true]) [data-part=box]::after'), '[data-ui=radio]:not(:has(> input:checked)) [data-part=box]::after');
  assert.equal(twinSelector(':is(ui-checkbox, ui-radio)[aria-disabled=true]'), ':is([data-ui=checkbox], [data-ui=radio]):has(> input:disabled)');
  assert.equal(twinSelector('[data-modality=keyboard] ui-switch:focus-visible'), '[data-modality=keyboard] [data-ui=switch]:has(> input:focus-visible)');
  assert.equal(twinSelector('ui-checkbox[aria-invalid=true]'), '[data-ui=checkbox]:is([data-invalid], :has(> input:user-invalid))');
  assert.equal(twinSelector('ui-range > [data-part=thumb]'), '[data-ui=range] > [data-part=thumb]');
  assert.equal(twinSelector('ui-button[aria-disabled=true]'), null, 'button has hand-written twins');
  assert.equal(twinSelector('ui-checkbox-like'), null, 'whole tag names only');
});

test('splitSelectors respects nesting', () => {
  assert.deepEqual(splitSelectors(':is(a, b) > c, d:not(e, f), [x="1,2"]'), [':is(a, b) > c', 'd:not(e, f)', '[x="1,2"]']);
});

test('withNativeTwins adds twins (also inside at-rules) and merges equal keys instead of replacing', () => {
  const css = withNativeTwins({
    'ui-checkbox': { display: 'inline-flex' },
    '[data-ui=checkbox]': { position: 'relative' },
    '@media (forced-colors: active)': { 'ui-switch [data-part=box]': { outline: '1px solid' } },
    'ui-button': { color: 'red' },
  });
  assert.deepEqual(css['[data-ui=checkbox]'], { display: 'inline-flex', position: 'relative' });
  assert.deepEqual(css['@media (forced-colors: active)']['[data-ui=switch] [data-part=box]'], { outline: '1px solid' });
  assert.equal(Object.keys(css).filter((k) => k.includes('button')).length, 1);
});
