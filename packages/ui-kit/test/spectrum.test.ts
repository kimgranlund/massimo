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
  assert.equal(light['--colors-bg'], `var(--colors-spectrum-${roles.neutral}-1)`);
  assert.ok(['#fff', '#000'].includes(dark['--colors-fg-on-solid']));
  const { ramps } = await import('../tokens/colors/spectrum/index.ts');
  assert.equal(data.schemes.light[roles.neutral][0].hct[2].toFixed(1), '97.5', 'light step 1 = Light endpoint tone');
  assert.equal(data.schemes.dark[roles.neutral][0].hct[2].toFixed(1), '5.0', 'dark step 1 = Dark endpoint tone (default 5)');
  const moved = generateSpectrum({ darkTone: 10 });
  assert.notEqual(ramps(moved, 'dark')[roles.neutral][0], ramps(data, 'dark')[roles.neutral][0], 'Dark endpoint moves step 1 (the page background)');
  assert.equal(ramps(data, 'light')[roles.neutral].length, 12, 'steps 1-12');
  const css = spectrumCSS(data, roles);
  assert.match(css, /@media \(prefers-color-scheme: dark\)/);
  assert.match(css, /--colors-spectrum-\w+-12:/);
  assert.doesNotMatch(css, /--colors-spectrum-\w+-0:/, 'no step 0');
  assert.match(css, /--colors-accent-solid: var\(--colors-spectrum-/);
  assert.equal(resolveRoles(data, { primary: 'blue' }).primary !== undefined, true, 'unknown names resolve by hue');
  const scoped = spectrumCSS(data, roles, '[data-canvas]');
  assert.match(scoped, /^\[data-canvas\] \{/);
  assert.match(scoped, /\[data-canvas\]\.dark \{/);
  assert.doesNotMatch(scoped, /:root/, 'scoped CSS never touches the document root');
});

test('defaults.json is the current default Spectrum (run npm run spectrum:defaults)', async () => {
  const { readFileSync } = await import('node:fs');
  const { spectrumDefaultsText, DEFAULTS_PATH } = await import('../scripts/spectrum-defaults.ts');
  assert.equal(readFileSync(DEFAULTS_PATH, 'utf8'), spectrumDefaultsText());
});
