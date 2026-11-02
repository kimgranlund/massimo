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
  assert.deepEqual(diffFromDefaults({ ...defaultParams, unit: 5 }), { unit: 5 });
});

test('preset globalCss keeps every :root theme parameter (no key collisions between style objects)', async () => {
  const { uiKitPreset } = await import('../preset.ts');
  const root = (uiKitPreset.globalCss as Record<string, Record<string, string>>)[':root'];
  for (const name of ['--ui-unit', '--ui-border', '--ui-label-edge', '--ui-radius-scale', '--ui-accent-hue']) assert.ok(root?.[name], `${name} missing`);
});
