import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveType, TYPE_ROLES } from '../tokens/typography/resolve.ts';

test('base role = control font (10px + u); steps scale by the ratio', () => {
  assert.equal(resolveType('body').size, 14);
  assert.equal(resolveType('body', { unit: 3 }).size, 13);
  assert.ok(Math.abs(resolveType('heading-1').size - 14 * 1.333 ** 4) < 1e-9);
  assert.equal(resolveType('display', { ratio: 1 }).size, 14, 'ratio 1 = product UI, every step equal');
});

test('fixed roles are n·u', () => {
  assert.equal(resolveType('caption').size, 12);
  assert.equal(resolveType('code', { unit: 5 }).size, 15);
});

test('line heights round up to the rhythm unit; controls keep 1.2; rhythm 0 is natural', () => {
  assert.equal(resolveType('body').lineHeight, 24, '14 × 1.5 = 21 -> 24 on a 4px grid');
  assert.equal(resolveType('body', { rhythm: 0.5 }).lineHeight, 22, '21 -> 22 on a 2px grid');
  assert.equal(resolveType('body', { rhythm: 0 }).lineHeight, 21);
  assert.equal(resolveType('control').lineHeightRatio, 1.2);
  for (const role of Object.keys(TYPE_ROLES) as (keyof typeof TYPE_ROLES)[]) {
    const t = resolveType(role);
    if (t.lineHeightRatio === undefined) assert.equal(t.lineHeight % 4, 0, `${role} on the 4px rhythm`);
  }
});

test('serif heading style: display and headings switch to regular serif; others stay', () => {
  assert.deepEqual([resolveType('heading-1', { heading: 'serif' }).family, resolveType('heading-1', { heading: 'serif' }).weight], ['serif', 400]);
  assert.equal(resolveType('body', { heading: 'serif' }).family, 'sans');
  assert.equal(resolveType('code').family, 'mono');
  assert.equal(resolveType('section-kicker').transform, 'uppercase');
});
