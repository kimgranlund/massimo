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
  assert.equal(light['--colors-primary-solid'], `var(--colors-spectrum-${roles.primary}-9)`);
  assert.equal(light['--colors-bg'], `var(--colors-spectrum-${roles.neutral}-1)`);
  assert.equal(light['--colors-bg-overlay'], `var(--colors-spectrum-${roles.neutral}-1)`, 'overlay = page tone in light');
  assert.equal(dark['--colors-bg-overlay'], `var(--colors-spectrum-${roles.neutral}-2)`, 'overlay one step up in dark');
  assert.equal(dark['--colors-bg-inverse'], `var(--colors-spectrum-${roles.neutral}-12)`);
  assert.equal(light['--colors-bg-backdrop'], `color-mix(in oklch, var(--colors-spectrum-${roles.neutral}-12) 40%, transparent)`);
  assert.equal(dark['--colors-bg-backdrop'], `color-mix(in oklch, var(--colors-spectrum-${roles.neutral}-1) 70%, transparent)`);
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
  assert.match(css, /--colors-primary-solid: var\(--colors-spectrum-/);
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

test('diagnostics: quadrature, boundary, T*, C* and the limiting accent', async () => {
  const { hueQuadrature, gamutBoundary, spectrumDiagnostics } = await import('../tokens/colors/spectrum/index.ts');
  assert.equal(Math.round(hueQuadrature(20.14)), 0, 'unique red');
  assert.equal(Math.round(hueQuadrature(90)), 100, 'unique yellow');
  assert.equal(Math.round(hueQuadrature(164.25)), 200, 'unique green');
  assert.equal(Math.round(hueQuadrature(237.53)), 300, 'unique blue');
  assert.ok(gamutBoundary(225, 65, 'display-p3') > gamutBoundary(225, 65, 'srgb'), 'P3 holds more chroma than sRGB');
  const data = generateSpectrum();
  const d = spectrumDiagnostics(data, resolveRoles(data), 8);
  assert.equal(d.peakTone, data.checks!.light.peakTone);
  assert.ok(d.peakChroma > 0 && d.accents.some((a) => a.name === d.limitedBy));
  assert.equal(d.accents.length, families(data).accents.length);
  for (const [i, [, c]] of d.weakest.entries()) assert.ok(d.accents.every((a) => a.curve[i][1] >= c - 1e-9), 'weakest is the minimum');
});

test('roles: brand, feedback and data 1–6 resolve to generated families and emit role variables', async () => {
  const { generateSpectrum, resolveRoles, roleVariables, ROLE_NAMES, DATA_ROLES, families } = await import('../tokens/colors/spectrum/index.ts');
  const data = generateSpectrum({});
  const roles = resolveRoles(data);
  const f = families(data);
  assert.deepEqual(Object.keys(roles), [...ROLE_NAMES]);
  for (const r of ROLE_NAMES) assert.ok((r === 'neutral' ? f.all : f.accents).includes(roles[r]), `${r} → ${roles[r]}`);
  assert.equal(new Set(DATA_ROLES.map((r) => roles[r])).size, 6, 'data series are six distinct families');
  assert.notEqual(roles.info, roles.primary, 'info is not the primary by default');
  assert.notEqual(roles.secondary, roles.primary);
  const v = roleVariables(data, roles, 'light');
  assert.equal(v['--colors-data-3'], `var(--colors-spectrum-${roles.data3}-9)`);
  assert.equal(v['--colors-secondary-solid'], `var(--colors-spectrum-${roles.secondary}-9)`);
  assert.equal(v['--colors-warning-fg'], `var(--colors-spectrum-${roles.warning}-11)`);
  assert.equal(resolveRoles(data, { critical: 'h140' }).critical !== roles.critical, true, 'any role can be repointed');
});

test('selected option roles follow the emphasis: balanced is neutral 1 / 12 in light, the primary solid in dark', async () => {
  const { generateSpectrum, resolveRoles, roleVariables, selectionVars } = await import('../tokens/colors/spectrum/index.ts');
  const data = generateSpectrum({});
  const r = resolveRoles(data);
  const light = roleVariables(data, r, 'light'), dark = roleVariables(data, r, 'dark');
  assert.equal(light['--colors-bg-selected'], selectionVars('light')['bg-selected']);
  assert.match(light['--colors-bg-selected'], /var\(--colors-neutral-3\), var\(--colors-neutral-1\) calc\(clamp\(0, var\(--ui-emphasis, 1\), 1\) \* 100%\)\), var\(--colors-primary-3\)/);
  assert.equal(light['--colors-fg-selected'], 'var(--colors-neutral-12)');
  assert.match(dark['--colors-bg-selected'], /var\(--colors-neutral-4\), var\(--colors-primary-9\)/, 'dark: neutral 4 when quiet, else the primary solid');
  assert.match(dark['--colors-fg-selected'], /var\(--colors-neutral-12\), var\(--colors-fg-on-solid\)/);
});

test('one color vocabulary: every brand and feedback role has the same steps, no aliases', async () => {
  const { ROLE_STEPS, SCALE_ROLES } = await import('../tokens/colors/spectrum/index.ts');
  const { semanticColors, semanticShadows } = await import('../tokens/colors/index.ts');
  const names = Object.keys(ROLE_STEPS);
  assert.ok(!names.some((n) => /^(accent|danger)-/.test(n)), 'no accent-* / danger-* aliases');
  const c = semanticColors as Record<string, Record<string, unknown>>;
  assert.ok(!('accent' in c) && !('danger' in c));
  for (const role of SCALE_ROLES) {
    for (const key of ['solid', 'solidHover', 'subtle', 'subtleHover', 'border', 'fg', ...Array.from({ length: 12 }, (_, i) => String(i + 1))]) assert.ok(c[role][key], `${role}.${key}`);
  }
  assert.deepEqual([...ROLE_STEPS['critical-solid']], ['critical', 9]);
  assert.deepEqual([...ROLE_STEPS['neutral-border']], ['neutral', 7]);
  // Shadows follow the scheme and the shadow role, never raw black.
  // Shadows draw on the per-scheme shadow layer colors, which are the shadow role at each scheme's alpha.
  const md = (semanticShadows as Record<string, { value: Record<string, string> }>).md.value;
  assert.match(md.base, /\{colors\.shadowLayer\.umbra\}/);
  const layer = (c.shadowLayer as Record<string, { value: Record<string, string> }>).umbra.value;
  assert.match(layer.base, /\{colors\.shadow\}/);
  assert.notEqual(layer.base, layer._dark);
  assert.ok(!/oklch\(0 0 0/.test(JSON.stringify(semanticShadows)));
});

test('white and black are neutral step 3 of the light and dark ramps; fg.strong is black in light, white in dark, in the kit tokens and at runtime', async () => {
  const D = (await import('../tokens/colors/spectrum/defaults.json', { with: { type: 'json' } })).default as any;
  const { colors, semanticColors } = await import('../tokens/colors/index.ts');
  const { generateSpectrum, resolveRoles, roleVariables } = await import('../tokens/colors/spectrum/index.ts');
  assert.equal(colors.white.value, D.light[D.roles.neutral][2], 'white: light neutral 3');
  assert.equal(colors.black.value, D.dark[D.roles.neutral][2], 'black: dark neutral 3');
  const strong = (semanticColors as any).fg.strong.value;
  assert.deepEqual([strong.base, strong._dark], ['{colors.black}', '{colors.white}']);
  const data = generateSpectrum({}), roles = resolveRoles(data, {});
  const light = roleVariables(data, roles, 'light'), dark = roleVariables(data, roles, 'dark');
  assert.equal(light['--colors-white'], dark['--colors-white'], 'white is the same in both schemes');
  assert.equal(light['--colors-white'], data.schemes.light[roles.neutral][2].css);
  assert.deepEqual([light['--colors-fg-strong'], dark['--colors-fg-strong']], ['var(--colors-black)', 'var(--colors-white)']);
});

test('white and black map to a neutral step or to pure, at runtime and in a saved theme', async () => {
  const { generateSpectrum, resolveRoles, endpointVars } = await import('../tokens/colors/spectrum/index.ts');
  const { themeCss, validateThemeObject } = await import('../tokens/themes/index.ts');
  const data = generateSpectrum({}), roles = resolveRoles(data, {});
  assert.deepEqual(endpointVars(data, roles), { '--colors-white': data.schemes.light[roles.neutral][2].css, '--colors-black': data.schemes.dark[roles.neutral][2].css });
  const mapped = endpointVars(data, roles, { white: 'pure', black: 3 });
  assert.equal(mapped['--colors-white'], '#fff');
  assert.equal(mapped['--colors-black'], data.schemes.dark[roles.neutral][2].css);
  const theme = { schemaVersion: 2 as const, name: 'ends', color: { endpoints: { white: 'pure' as const, black: 3 } } };
  assert.ok(validateThemeObject(theme).ok);
  assert.equal(validateThemeObject({ ...theme, color: { endpoints: { grey: 1 } } }).ok, false);
  assert.equal(validateThemeObject({ ...theme, color: { endpoints: { white: 13 } } }).ok, false);
  const css = themeCss({ ends: theme });
  assert.equal(css[':root[data-ui-theme="ends"]']['--colors-white'], '#fff');
  assert.equal(css[':root[data-ui-theme="ends"].dark']['--colors-black'], mapped['--colors-black'], 'the same black in every scheme');
});

test('contrast-targeted ramps: tones solve from APCA targets against the page; defaults reproduce the old ramp; legacy peak tones map to targets', async () => {
  const { apcaLc, toneForLc, stepTones, DEFAULT_TARGETS } = await import('../tokens/colors/spectrum/contrast.ts');
  const { generateSpectrum } = await import('../tokens/colors/spectrum/index.ts');
  for (const lc of [10, 45, 75]) assert.ok(Math.abs(apcaLc(toneForLc(97.5, lc, 'light'), 97.5) - lc) < 0.05, `solves Lc ${lc} on a light page`);
  assert.ok(Math.abs(apcaLc(toneForLc(5, 60, 'dark'), 5) - 60) < 0.05, 'and on a dark page');
  const tones = stepTones(97.5, DEFAULT_TARGETS.light, 'light');
  assert.ok(tones.every((t, i) => i === 0 || t < tones[i - 1]), 'strictly darker step by step on a light page');
  const d = generateSpectrum({});
  assert.ok(d.schemes.light.neutral.every((sw, i) => Math.abs(sw.hct[2] - [97.5, 93.1, 88.6, 84.2, 79.8, 75.3, 70.9, 66.4, 62, 52.5, 43, 30.9][i]) < 0.2), 'the default targets reproduce the even ramp');
  const raised = generateSpectrum({ targetsLight: [...DEFAULT_TARGETS.light.slice(0, 9), 85, 95] });
  assert.ok(raised.schemes.light.neutral[10].hct[2] < 35, 'a higher step 11 target darkens step 11');
  const page = generateSpectrum({ toneMax: 90 });
  assert.ok(Math.abs(apcaLc(page.schemes.light.neutral[10].hct[2], page.schemes.light.neutral[0].hct[2]) - DEFAULT_TARGETS.light[9]) < 0.5, 'a darker page keeps each step’s contrast');
  const legacy = generateSpectrum({ ptAuto: 0, pt: 55 });
  assert.notDeepEqual(legacy.settings.targetsLight, [...DEFAULT_TARGETS.light], 'legacy peak tones become measured targets');
});
