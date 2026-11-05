import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveType, TYPE_ROLES } from '../tokens/typography/resolve.ts';
// These tests pin u = 4 (the numbers below are at u = 4); the default unit is checked separately.
const U4 = { unit: 4 } as const;

test('base role = control font (10px + u); steps scale by the ratio', () => {
  assert.equal(resolveType('body-md', U4).size, 14);
  assert.equal(resolveType('body-md', { unit: 3 }).size, 13);
  assert.ok(Math.abs(resolveType('heading-1', U4).size - 14 * 1.333 ** 4) < 1e-9);
  assert.equal(resolveType('display', { unit: 4, ratio: 1 }).size, 14, 'ratio 1 = product UI, every step equal');
});

test('small roles are step −½: below body at every size', () => {
  assert.ok(Math.abs(resolveType('body-sm', U4).size - 14 / Math.sqrt(1.333)) < 1e-9);
  for (const unit of [2, 4.5, 8, 12]) for (const role of ['body-sm', 'label', 'control-sm', 'code'] as const) {
    assert.ok(resolveType(role, { unit }).size < resolveType('body-md', { unit }).size, `${role} at u = ${unit}`);
    assert.ok(resolveType(role, { unit }).size >= 10, `${role} at u = ${unit} stays readable`);
  }
});

test('heading line height is 1.3 − step/20 and tracking −(step − 1)/100', () => {
  for (const role of ['display', 'heading-1', 'heading-2', 'heading-3'] as const) {
    const { step, lh, tracking } = TYPE_ROLES[role];
    assert.ok(Math.abs(lh - (1.3 - step / 20)) < 1e-9, role);
    assert.ok(Math.abs(tracking + (step - 1) / 100) < 1e-9, role);
  }
});

test('line heights round up to the rhythm unit; controls keep 1.2; rhythm 0 is natural', () => {
  assert.equal(resolveType('body-md', U4).lineHeight, 24, '14 × 1.5 = 21 -> 24 on a 4px grid');
  assert.equal(resolveType('body-md', { unit: 4, rhythm: 0.5 }).lineHeight, 22, '21 -> 22 on a 2px grid');
  assert.equal(resolveType('body-md', { unit: 4, rhythm: 0 }).lineHeight, 21);
  assert.equal(resolveType('control-md', U4).lineHeightRatio, 1.2);
  for (const role of Object.keys(TYPE_ROLES) as (keyof typeof TYPE_ROLES)[]) {
    const t = resolveType(role, U4);
    if (t.lineHeightRatio === undefined) assert.equal(t.lineHeight % 4, 0, `${role} on the 4px rhythm`);
  }
});

test('voices: roles point at voices, voices at faces; serif display/heading drop to 400', () => {
  assert.equal(resolveType('heading-1', U4).face, 'sans');
  assert.equal(resolveType('control-md', U4).face, 'controls', 'the ui voice uses the Controls face');
  assert.match(resolveType('label', U4).stack, /^system-ui/);
  assert.equal(resolveType('display', U4).face, 'display', 'display is its own face');
  assert.equal(resolveType('code', U4).face, 'mono');
  assert.equal(resolveType('section-kicker', U4).voice, 'ui', 'kickers are a role on the ui voice');
  const serifHeadings = resolveType('heading-1', { unit: 4, voices: { heading: 'serif' } });
  assert.deepEqual([serifHeadings.face, serifHeadings.weight], ['serif', 400]);
  assert.equal(resolveType('body-md', { unit: 4, voices: { heading: 'serif' } }).face, 'sans', 'other voices unaffected');
  assert.equal(resolveType('label', { unit: 4, voices: { ui: 'serif' } }).weight, 450, 'only display/heading drop weight');
  const didot = resolveType('display', { unit: 4, faces: { display: 'Didot, "Bodoni 72", serif' } });
  assert.equal(didot.weight, 400, 'a serif stack on the display face reads as serif');
  assert.equal(resolveType('section-kicker', U4).transform, 'uppercase');
});
