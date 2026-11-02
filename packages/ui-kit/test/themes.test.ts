import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateTheme, themeCss, diffFromDefaults, defaultParams } from '../tokens/themes/index.ts';

test('validateTheme accepts known in-range params only', () => {
  assert.deepEqual(validateTheme('brand-x', { 'accent-hue': 30 }), { ok: true, name: 'brand-x', params: { 'accent-hue': 30 } });
  assert.equal(validateTheme('Brand X', {}).ok, false);
  assert.equal(validateTheme('x', { 'accent-hue': 999 }).ok, false);
  assert.equal(validateTheme('x', { 'accent-hue': '30' }).ok, false);
  assert.equal(validateTheme('x', { 'color: red; --a': 1 }).ok, false);
});

test('themeCss emits defaults on :root and one root-scoped block per theme', () => {
  const css = themeCss({ warm: { 'accent-hue': 30 } });
  assert.equal(css[':root']['--ui-accent-hue'], '265');
  assert.deepEqual(css[':root[data-ui-theme="warm"]'], { '--ui-accent-hue': '30' });
});

test('diffFromDefaults keeps only changed params', () => {
  assert.deepEqual(diffFromDefaults({ ...defaultParams, density: 1.2 }), { density: 1.2 });
});
