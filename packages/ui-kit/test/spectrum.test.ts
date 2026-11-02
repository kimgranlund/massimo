import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateSpectrum, normalizeSpectrum, resolveRoles, roleVariables, spectrumCSS, spectrumOverrides, families, SPECTRUM_DEFAULTS } from '../tokens/colors/spectrum/index.ts';

test('settings validate field by field', () => {
  assert.equal(normalizeSpectrum({ hue: 120 }).hue, 120);
  assert.throws(() => normalizeSpectrum({ hue: 999 }));
  assert.throws(() => normalizeSpectrum({ nope: 1 }));
  assert.deepEqual(spectrumOverrides({ ...SPECTRUM_DEFAULTS, chroma: 60 }), { chroma: 60 });
});

test('engine generates 12-step light and dark ramps and roles map onto kit variables', async () => {
  const data = generateSpectrum();
  const f = families(data);
  assert.ok(f.accents.length >= 12);
  for (const mode of ['light', 'dark'] as const) for (const ramp of Object.values(data.schemes[mode])) assert.equal(ramp.length, 12);
  const roles = resolveRoles(data);
  assert.ok(f.accents.includes(roles.primary));
  assert.ok(f.accents.includes(roles.critical));
  const light = roleVariables(data, roles, 'light'), dark = roleVariables(data, roles, 'dark');
  assert.equal(light['--colors-accent-solid'], `var(--colors-spectrum-${roles.primary}-9)`);
  assert.equal(light['--colors-bg'], `var(--colors-spectrum-${roles.neutral}-0)`);
  assert.ok(['#fff', '#000'].includes(dark['--colors-fg-on-solid']));
  const { ramps } = await import('../tokens/colors/spectrum/index.ts');
  assert.notEqual(ramps(data, 'light')[roles.neutral][0], ramps(data, 'dark')[roles.neutral][0], 'schemes differ');
  assert.equal(ramps(data, 'light')[roles.neutral].length, 13, 'steps 0-12');
  const css = spectrumCSS(data, roles);
  assert.match(css, /@media \(prefers-color-scheme: dark\)/);
  assert.match(css, /--colors-spectrum-\w+-12:/);
  assert.match(css, /--colors-spectrum-\w+-0:/, 'canvas step 0');
  assert.match(css, /--colors-accent-solid: var\(--colors-spectrum-/);
  assert.equal(resolveRoles(data, { primary: 'blue' }).primary !== undefined, true, 'unknown names resolve by hue');
});

test('defaults.json is the current default Spectrum (run npm run spectrum:defaults)', async () => {
  const { readFileSync } = await import('node:fs');
  const { spectrumDefaultsText, DEFAULTS_PATH } = await import('../scripts/spectrum-defaults.ts');
  assert.equal(readFileSync(DEFAULTS_PATH, 'utf8'), spectrumDefaultsText());
});
