// Color anchors (spectrum/anchors.ts): a brand's exact colors in the generated ramps.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateSpectrum, rampVar, resolveRoles, anchoredSpectrum } from '../tokens/colors/spectrum/index.ts';
import { linearY, toneOfY, type ColorAnchor } from '../tokens/colors/spectrum/anchors.ts';
import type { Spectrum } from '../tokens/colors/spectrum/index.ts';
import { apcaLc } from '../tokens/colors/spectrum/contrast.ts';
import { themeCss } from '../tokens/themes/index.ts';
import { validateThemeObject } from '../tokens/themes/theme.ts';
import { lintTheme } from '../tokens/themes/lint.ts';

const data = generateSpectrum({});
const roles = resolveRoles(data, {});
// Published palettes (docs/reports/2026-11-03-color-anchoring-spike.md).
const IBM = [{ role: 'primary', value: '#0f62fe' }, { role: 'critical', value: '#da1e28' }, { role: 'success', value: '#24a148' }, { role: 'warning', value: '#f1c21b' }] as const;
const M3 = [{ role: 'primary', value: '#6750a4' }, { role: 'secondary', value: '#625b71' }, { role: 'critical', value: '#b3261e' }] as const;

test('anchors: each anchor is exact at its step; its family takes its hue; steps 1–8 keep their lightness; the order holds', () => {
  for (const palette of [IBM, M3]) {
    const r = anchoredSpectrum(data, roles, [...palette]);
    for (const a of r.report) {
      const before = data.schemes.light[a.family], after = r.data.schemes.light[a.family];
      const anchored = after[a.step - 1];
      assert.match(anchored.css, /^oklch\(/);
      // Exact: the stored OKLCH is the anchor's.
      const hue = anchored.oklch[2];
      for (const sw of after) if (sw.step > 1) assert.ok(Math.abs(((sw.oklch[2] - hue + 540) % 360) - 180) < 1e-6, `${a.family} ${sw.step}: hue pinned`);
      for (const sw of after) if (sw.step > 1 && sw.step < 9 && sw.step !== a.step) assert.ok(Math.abs(sw.oklch[0] - before[sw.step - 1].oklch[0]) < 1e-9, `${a.family} ${sw.step}: lightness kept`);
      assert.deepEqual(after[0].oklch, before[0].oklch, 'the page step is untouched');
      assert.ok(a.inOrder, `${a.role} ${a.value}: Lc ${a.lc} between ${a.below} and ${a.above}`);
      assert.ok(a.inRange);
      // Dark ramp: hue pinned too, nothing overridden.
      for (const sw of r.data.schemes.dark[a.family]) if (sw.step > 1) assert.ok(Math.abs(((sw.oklch[2] - hue + 540) % 360) - 180) < 1e-6);
    }
    assert.ok(r.report.length === palette.length);
  }
});

test('anchors: an anchor at steps 8–12 moves its role\'s solid there, and theme CSS points the solid at it', () => {
  const r = anchoredSpectrum(data, roles, [{ role: 'primary', value: '#0f62fe' }]);
  const step = r.report[0].step;
  assert.ok(step >= 8 && step <= 12, `IBM blue lands on ${step}`);
  assert.equal(r.solidSteps.light.primary, step);
  const css = themeCss({ b: { schemaVersion: 2, name: 'b', color: { anchors: [{ role: 'primary', value: '#0f62fe' }] } } });
  const light = css[':root[data-ui-theme="b"]'];
  assert.equal(light['--colors-primary-solid'], `var(${rampVar(roles.primary, step)})`);
  assert.equal(light['--colors-primary-solid-hover'], `var(${rampVar(roles.primary, Math.min(12, step + 1))})`);
  assert.match(light[rampVar(roles.primary, step)], /^oklch\(/);
  // The text on the anchored solid is recomputed for it.
  const sw = r.data.schemes.light[roles.primary][step - 1];
  assert.ok(Math.abs(sw.apca.lc) >= 60, `text on the anchored solid reads (Lc ${sw.apca.lc})`);
});

test('anchors: chroma is re-shaped toward the anchor and stays in the gamut', () => {
  const r = anchoredSpectrum(data, roles, [{ role: 'primary', value: '#0f62fe' }]);
  const fam = roles.primary;
  const before = data.schemes.light[fam][9].oklch[1], after = r.data.schemes.light[fam][9].oklch[1];
  assert.ok(after > before, `step 10 chroma rises toward the vivid anchor (${before.toFixed(3)} → ${after.toFixed(3)})`);
  assert.ok(r.data.schemes.light[fam].every((sw) => Number.isFinite(sw.oklch[1]) && sw.oklch[1] >= 0));
});

const chromas = (d: typeof data, fam: string, mode: 'light' | 'dark' = 'light') => d.schemes[mode][fam].map((sw) => sw.oklch[1]);

test('anchors: key reach leaves the tints generated and keeps every step at or under the anchor', () => {
  const nasa = { role: 'primary', value: '#cc243c' };
  const r = anchoredSpectrum(data, roles, [nasa]);
  const a = r.report[0], fam = a.family, cap = r.data.schemes.light[fam][a.step - 1].oklch[1];
  assert.equal(a.step, 11);
  const before = chromas(data, fam), after = chromas(r.data, fam);
  for (let i = 1; i < 8; i++) assert.ok(after[i] <= before[i] + 1e-9, `step ${i + 1}: ${after[i].toFixed(3)} ≤ generated ${before[i].toFixed(3)}`);
  assert.ok(before[2] - after[2] < 0.02, 'tints stay near the generated chroma');
  for (let i = 8; i < 12; i++) assert.ok(after[i] <= cap + 1e-9, `step ${i + 1} is no louder than the anchor`);
  assert.ok(after[8] > before[8], 'step 9 rises toward the anchor');
  assert.equal(after[8].toFixed(3), cap.toFixed(3), 'and reaches it');
  for (const c of chromas(r.data, fam, 'dark').slice(1)) assert.ok(c <= cap + 1e-9, 'the dark ramp is capped too');
});

test('anchors: ramp reach scales every step, and is the default on a neutral family', () => {
  const key = anchoredSpectrum(data, roles, [{ role: 'primary', value: '#cc243c' }]);
  const ramp = anchoredSpectrum(data, roles, [{ role: 'primary', value: '#cc243c', reach: 'ramp' }]);
  const fam = key.report[0].family;
  assert.ok(chromas(ramp.data, fam)[2] > chromas(key.data, fam)[2], 'tints carry the color');
  assert.ok(chromas(ramp.data, fam)[8] > chromas(key.data, fam)[8], 'and step 9 passes the anchor');
  const n = anchoredSpectrum(data, roles, [{ role: 'neutral', value: '#7c7c6c' }]);
  const nr = anchoredSpectrum(data, roles, [{ role: 'neutral', value: '#7c7c6c', reach: 'ramp' }]);
  assert.deepEqual(chromas(n.data, roles.neutral), chromas(nr.data, roles.neutral));
});

test('anchors: key reach on a muted anchor mutes its tints; on a light anchor it starts at that step', () => {
  const muted = anchoredSpectrum(data, roles, [{ role: 'primary', value: '#6f6b7a', step: 9 }]);
  const before = chromas(data, roles.primary), after = chromas(muted.data, roles.primary);
  for (let i = 1; i < 8; i++) assert.ok(after[i] < before[i], `step ${i + 1} is muted`);
  const light = anchoredSpectrum(data, roles, [{ role: 'primary', value: '#f5d90a' }]);
  const a = light.report[0], c = chromas(light.data, a.family);
  assert.ok(a.step < 9, `a light anchor lands below the solids (step ${a.step})`);
  assert.ok(c[a.step] > chromas(data, a.family)[a.step], 'the step above it takes the chroma');
});

test('anchors: a dark anchor does not pull the solids under the tints', () => {
  const r = anchoredSpectrum(data, roles, [{ role: 'primary', value: '#1f3a5f' }]);
  const a = r.report[0], c = chromas(r.data, a.family);
  assert.equal(a.step, 12);
  assert.ok(c[8] >= c[7], `step 9 ${c[8].toFixed(3)} ≥ step 8 ${c[7].toFixed(3)}`);
});

test('anchors: reach is validated', () => {
  const ok = (a: object) => validateThemeObject({ schemaVersion: 2, name: 'r', color: { anchors: [a] } }).ok;
  assert.ok(ok({ role: 'primary', value: '#cc243c', reach: 'ramp' }));
  assert.equal(ok({ role: 'primary', value: '#cc243c', reach: 'wide' }), false);
  assert.equal(ok({ role: 'ground', value: '#ffffff', reach: 'ramp' }), false);
});

test('anchors: validation, one per role, and the lint rules for order and range', () => {
  const t = (anchors: unknown) => ({ schemaVersion: 2, name: 'a', color: { anchors } });
  assert.ok(validateThemeObject(t([{ role: 'primary', value: '#0f62fe', name: 'blue 60' }])).ok);
  const bad = validateThemeObject(t([{ role: 'hero', value: 'blue' }, { role: 'primary', value: '#0f62fe', step: 13 }, { role: 'primary', value: '#000000' }]));
  assert.equal(bad.ok, false);
  const errors = (bad as any).errors.join('\n');
  for (const m of [/color\.anchors\.0\.role: unknown role/, /color\.anchors\.0\.value: must be a #rrggbb/, /color\.anchors\.1\.step/, /color\.anchors: one anchor per role/]) assert.match(errors, m);
  const ids = (anchors: unknown) => lintTheme(t(anchors) as any, { only: ['vibrancy.anchor-order', 'vibrancy.anchor-range'] }).findings.map((f) => f.id);
  assert.deepEqual(ids([{ role: 'primary', value: '#0f62fe' }]), []);
  assert.deepEqual(ids([{ role: 'primary', value: '#0f62fe', step: 4 }]), ['vibrancy.anchor-order']);
  assert.deepEqual(ids([{ role: 'secondary', value: '#050505' }]), ['vibrancy.anchor-range']);
  assert.ok(apcaLc(0, 97.5) > 100, 'near black is beyond the ramp');
});

test('anchors: a near-black brand primary (step 12) becomes the solid, with hover one step lighter', () => {
  const r = anchoredSpectrum(data, roles, [{ role: 'primary', value: '#1f3a5f' }]);
  assert.equal(r.report[0].step, 12);
  assert.equal(r.solidSteps.light.primary, 12);
  const css = themeCss({ n: { schemaVersion: 2, name: 'n', color: { anchors: [{ role: 'primary', value: '#1f3a5f' }] } } })[':root[data-ui-theme="n"]'];
  assert.equal(css['--colors-primary-solid-hover'], `var(${rampVar(roles.primary, 11)})`);
});

test('anchors: two anchors on one family split: the second role moves to the nearest free family', () => {
  assert.equal(roles.primary, roles.data1, 'primary and data 1 share a family by default');
  const r = anchoredSpectrum(data, roles, [{ role: 'primary', value: '#d1187a' }, { role: 'data1', value: '#6b3fd6' }]);
  assert.notEqual(r.roles.primary, r.roles.data1);
  for (const a of r.report) {
    const sw = r.data.schemes.light[a.family][a.step - 1];
    const want = a.role === 'primary' ? '#d1187a' : '#6b3fd6';
    assert.equal(a.family, r.roles[a.role as 'primary' | 'data1']);
    assert.ok(sw.css.startsWith('oklch('), `${a.role} exact at ${a.family} ${a.step} (${want})`);
  }
  const hue = (f: string) => r.data.schemes.light[f][8].oklch[2];
  assert.ok(Math.abs(hue(r.roles.primary) - hue(r.roles.data1)) > 20, 'the two families keep their own hues');
});

test('anchors: light solid steps stay in light; a dark anchor color sets its own dark step and solid', () => {
  const navy = themeCss({ n: { schemaVersion: 2, name: 'n', color: { anchors: [{ role: 'primary', value: '#1f3a5f' }] } } });
  assert.equal(navy[':root[data-ui-theme="n"]']['--colors-primary-solid'], `var(${rampVar(roles.primary, 12)})`, 'light: the anchored step');
  assert.ok(!navy[':root[data-ui-theme="n"].dark']['--colors-primary-solid']?.endsWith('-12)'), 'dark: not the lightest dark step');
  const r = anchoredSpectrum(data, roles, [{ role: 'primary', value: '#1f3a5f', dark: '#7fb2f0' }]);
  const d = r.report[0].dark!;
  assert.ok(d.step >= 2 && d.step <= 12 && d.inOrder, `dark anchor at step ${d.step}, Lc ${d.lc}`);
  assert.match(r.data.schemes.dark[r.report[0].family][d.step - 1].css, /^oklch\(/);
  if (d.step >= 8) assert.equal(r.solidSteps.dark.primary, d.step);
  assert.ok(validateThemeObject({ schemaVersion: 2, name: 'd', color: { anchors: [{ role: 'primary', value: '#1f3a5f', dark: '#7fb2f0' }] } }).ok);
  assert.equal(validateThemeObject({ schemaVersion: 2, name: 'd', color: { anchors: [{ role: 'primary', value: '#1f3a5f', dark: 'blue' }] } }).ok, false);
});

test('anchors: steps 9–12 settle into one run around a pin', () => {
  const spread = (ramp: { oklch: number[] }[], from: number) => {
    const d = [0, 1, 2].map((i) => ramp[from - 1 + i].oklch[0] - ramp[from + i].oklch[0]).map(Math.abs);
    return Math.max(...d) / Math.min(...d);
  };
  const r = anchoredSpectrum(data, roles, [{ role: 'primary', value: '#003057' }, { role: 'ink', value: '#00142c' }, { role: 'ground', value: '#ffffff' }]);
  const primary = r.data.schemes.light[r.roles.primary], neutral = r.data.schemes.light[r.roles.neutral], darkNeutral = r.data.schemes.dark[r.roles.neutral];
  // Generated, the dark anchor leaves a step 11 to 12 gap about 2.5 times the others; settled, under 1.3.
  assert.ok(spread(data.schemes.light[r.roles.primary], 9) < 1.3, 'the generated run is even');
  for (const ramp of [primary, neutral, darkNeutral]) assert.ok(spread(ramp, 9) < 1.3, 'lightness runs evenly into the pin');
  // Chroma runs straight from step 9 to the pin.
  const [c9, c10, c11, c12] = [9, 10, 11, 12].map((n) => primary[n - 1].oklch[1]);
  assert.ok(Math.abs(c10 - (c9 + (c12 - c9) / 3)) < 1e-6 && Math.abs(c11 - (c9 + (2 * (c12 - c9)) / 3)) < 1e-6);
  // Step 9, the solid, stays where the generator put it.
  assert.equal(primary[8].oklch[0], data.schemes.light[r.roles.primary][8].oklch[0]);
  // A page pin eases into the ramp: steps 2–4 carry its chroma, step 5 keeps the generator's lightness,
  // and the tint never dips on the way to the solids.
  const page = darkNeutral[0].oklch, gen = data.schemes.dark[r.roles.neutral];
  assert.ok(darkNeutral[1].oklch[1] > gen[1].oklch[1] + 0.02 && darkNeutral[1].oklch[1] < page[1]);
  assert.equal(darkNeutral[4].oklch[0], gen[4].oklch[0]);
  for (let n = 5; n <= 8; n++) assert.ok(darkNeutral[n - 1].oklch[1] >= darkNeutral[3].oklch[1] - 1e-3, `step ${n} holds the tint`);
});

test('anchors: a pin brighter than its step costs the text steps no contrast', () => {
  const r = anchoredSpectrum(data, roles, [{ role: 'primary', value: '#ffe01b', step: 9 }]);
  for (const n of [10, 11, 12]) assert.equal(r.data.schemes.light[r.roles.primary][n - 1].oklch[0], data.schemes.light[r.roles.primary][n - 1].oklch[0]);
});

test('anchors: a pin below step 9 leaves the run alone', () => {
  const r = anchoredSpectrum(data, roles, [{ role: 'primary', value: '#ffe01b', step: 7 }]);
  for (const n of [9, 10, 11, 12]) assert.equal(r.data.schemes.light[r.roles.primary][n - 1].oklch[0], data.schemes.light[r.roles.primary][n - 1].oklch[0]);
});

test('key intensity scales steps 9–12 alone, keeps contrast, and leaves neutrals and pins', () => {
  const chromas = (d: Spectrum, f: string) => d.schemes.light[f].map((s) => s.oklch[1]);
  const lift = (keyIntensity: number, anchors: ColorAnchor[] = []) => {
    const gen = generateSpectrum({ keyIntensity });
    return anchoredSpectrum(gen, resolveRoles(gen, {}), anchors);
  };
  const base = generateSpectrum({}), roles = resolveRoles(base, {});
  assert.equal(anchoredSpectrum(base, roles, []).data, base, '100 is the generated spectrum, untouched');
  const up = lift(150).data, down = lift(50).data, off = lift(0).data, family = roles.primary, neutral = roles.neutral;
  const was = chromas(base, family);
  for (const mode of ['light', 'dark'] as const) for (const [f, ramp] of Object.entries(down.schemes[mode])) ramp.forEach((sw, i) => {
    const orig = base.schemes[mode][f][i];
    if (i < 8 || f === neutral) { assert.equal(sw.css, orig.css, `${f} ${i + 1} ${mode}`); return; }
    assert.ok(Math.abs(sw.oklch[1] - orig.oklch[1] / 2) < 1e-3, `${f} ${i + 1} ${mode} halves`);
    assert.ok(Math.abs(toneOfY(linearY(sw.oklch)) - toneOfY(linearY(orig.oklch))) < 0.05, `${f} ${i + 1} ${mode} keeps its tone`);
  });
  chromas(up, family).forEach((c, i) => assert.ok(i < 8 ? c === was[i] : c > was[i], `step ${i + 1} up`));
  chromas(off, family).slice(8).forEach((c) => assert.ok(c < 1e-6, 'zero is gray'));
  // A pin stays exact and the scale eases to it, so the run keeps one curve.
  const anchor = { role: 'primary', value: '#003057', step: 12 } as ColorAnchor;
  const plain = lift(100, [anchor]), quiet = lift(50, [anchor]);
  const f = plain.report[0].family, a = chromas(plain.data, f), b = chromas(quiet.data, f);
  assert.equal(quiet.data.schemes.light[f][11].css, plain.data.schemes.light[f][11].css, 'pin exact');
  assert.ok(Math.abs(b[8] / a[8] - 0.5) < 0.01, 'the far end of the run takes the full scale');
  assert.ok(Math.abs(b[10] / a[10] - 5 / 6) < 0.01, 'the scale eases toward the pin');
  // Past the gamut the run plateaus at step 9 rather than peaking on a text step.
  const top = chromas(lift(300).data, family).slice(8);
  top.forEach((c, i) => assert.ok(c <= top[0] + 1e-6 && (i === 0 || c >= was[8 + i]), `step ${9 + i} at 300`));
});

test('key depth moves the tones of steps 9–12 alone, keeps chroma, and opens room for intensity', () => {
  const at = (settings: Record<string, number>, anchors: ColorAnchor[] = []) => {
    const gen = generateSpectrum(settings);
    return anchoredSpectrum(gen, resolveRoles(gen, {}), anchors);
  };
  const plain = at({}).data, deep = at({ keyDepth: 20 }).data, family = roles.primary;
  const tone = (d: Spectrum, f: string, m: 'light' | 'dark', i: number) => toneOfY(linearY(d.schemes[m][f][i].oklch));
  for (const mode of ['light', 'dark'] as const) for (const [f, ramp] of Object.entries(deep.schemes[mode])) ramp.forEach((sw, i) => {
    if (i < 8 || f === roles.neutral) assert.equal(sw.css, plain.schemes[mode][f][i].css, `${f} ${i + 1} ${mode}`);
  });
  assert.ok(tone(deep, family, 'light', 8) < tone(plain, family, 'light', 8) - 5, 'darker solid in light');
  assert.ok(tone(deep, family, 'dark', 8) < tone(plain, family, 'dark', 8) - 2, 'darker solid in dark');
  assert.ok(Math.abs(tone(deep, family, 'light', 11) - tone(plain, family, 'light', 11)) < 0.1, 'step 12 stays');
  assert.ok(Math.abs(deep.schemes.light[family][8].oklch[1] - plain.schemes.light[family][8].oklch[1]) < 1e-3, 'depth alone keeps the chroma');
  for (const mode of ['light', 'dark'] as const) for (const depth of [-30, 30]) {
    const ramp = at({ keyDepth: depth }).data.schemes[mode][family], tones = ramp.map((_, i) => toneOfY(linearY(ramp[i].oklch)));
    tones.slice(1).forEach((t, i) => assert.ok(mode === 'light' ? t < tones[i] : t > tones[i], `${mode} ${depth}: order at ${i + 2}`));
  }
  const ceiling = at({ keyIntensity: 300 }).data.schemes.light[family][8].oklch[1];
  assert.ok(at({ keyIntensity: 300, keyDepth: 20 }).data.schemes.light[family][8].oklch[1] > ceiling * 1.3, 'depth lifts the ceiling');
  // A pin stays exact under depth too.
  const anchor = { role: 'primary', value: '#003057', step: 12 } as ColorAnchor;
  const a = at({}, [anchor]), b = at({ keyDepth: 15 }, [anchor]), f = a.report[0].family;
  assert.equal(b.data.schemes.light[f][11].css, a.data.schemes.light[f][11].css, 'pin exact');
  // The lint's contrast check follows the steps: a lighter run can fail where the default passes.
  const roleChecks = (depth: number) => at({ keyDepth: depth }).data.checks!.light.rows[family].roles;
  const step11Lc = (depth: number) => apcaLc(tone(at({ keyDepth: depth }).data, family, 'light', 10), tone(plain, family, 'light', 0));
  assert.ok(Math.abs(roleChecks(0).r11 - roleChecks(-30).r11) < 0.3, 'moving toward the page costs step 11 nothing');
  assert.ok(Math.abs(at({ keyDepth: 20 }).data.checks!.dark.rows[family].roles.r11 - plain.checks!.dark.rows[family].roles.r11) < 0.3, 'nor in dark');
  assert.ok(roleChecks(20).r11 > roleChecks(0).r11 + 1, 'moving away from it gains contrast, and the check follows');
  assert.ok(step11Lc(20) > step11Lc(0) + 1, 'the step itself moved');
  assert.ok(Math.abs(roleChecks(0).r12 - roleChecks(-30).r12) < 0.3, 'r12 stays');
  const oklch = at({ generator: 'oklch', keyDepth: 20 } as never).data;
  assert.ok(tone(oklch, family, 'light', 8) < tone(generateSpectrum({ generator: 'oklch' } as never), family, 'light', 8) - 5, 'the OKLCH generator too');
});
