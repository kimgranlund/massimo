import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateTheme, themeCss, diffFromDefaults, defaultParams } from '../tokens/themes/index.ts';

test('validateTheme accepts known in-range params only', () => {
  assert.deepEqual(validateTheme('brand-x', { 'unit': 3 }), { ok: true, name: 'brand-x', params: { 'unit': 3 } });
  assert.equal(validateTheme('Brand X', {}).ok, false);
  assert.equal(validateTheme('x', { 'unit': 99 }).ok, false);
  assert.equal(validateTheme('x', { 'unit': '3' }).ok, false);
  assert.equal(validateTheme('x', { 'color: red; --a': 1 }).ok, false);
});

test('themeCss emits defaults on :root and one root-scoped block per theme', () => {
  const css = themeCss({ warm: { 'unit': 3 } });
  assert.equal(css[':root']['--ui-unit'], '4.5');
  assert.deepEqual(css[':root[data-ui-theme="warm"]'], { '--ui-unit': '3' });
});

test('diffFromDefaults keeps only changed params', () => {
  assert.deepEqual(diffFromDefaults({ ...defaultParams, unit: 5 }), { unit: 5 });
});

test('preset globalCss keeps every :root theme parameter (no key collisions between style objects)', async () => {
  const { uiKitPreset } = await import('../preset.ts');
  const root = (uiKitPreset.globalCss as Record<string, Record<string, string>>)[':root'];
  for (const name of ['--ui-unit', '--ui-border', '--ui-radius-scale', '--ui-corner-shape']) assert.ok(root?.[name], `${name} missing`);
});

test('preset style objects merge per selector; shared selectors keep both sides', async () => {
  const { uiKitPreset, globalCssParts } = await import('../preset.ts');
  const merged = uiKitPreset.globalCss as Record<string, Record<string, unknown>>;
  for (const [name, part] of Object.entries(globalCssParts))
    for (const [sel, rule] of Object.entries(part))
      for (const prop of Object.keys(rule)) assert.ok(prop in merged[sel], `${name}: ${sel} { ${prop} } lost in the merge`);
});
