// Color anchors (spectrum/anchors.ts): a brand's exact colors in the generated ramps.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { generateSpectrum, resolveRoles, anchoredSpectrum } from '../tokens/colors/spectrum/index.ts';
import { apcaLc } from '../tokens/colors/spectrum/contrast.ts';
import { themeCss } from '../tokens/themes/index.ts';
import { validateThemeObject } from '../tokens/themes/theme.ts';
import { lintTheme } from '../tokens/themes/lint.ts';

const data = generateSpectrum({});
const roles = resolveRoles(data, {});
// Published palettes (docs/reports/2026-11-03-color-anchoring-spike.md).
const IBM = [{ role: 'primary', value: '#0f62fe' }, { role: 'critical', value: '#da1e28' }, { role: 'success', value: '#24a148' }, { role: 'warning', value: '#f1c21b' }] as const;
const M3 = [{ role: 'primary', value: '#6750a4' }, { role: 'secondary', value: '#625b71' }, { role: 'critical', value: '#b3261e' }] as const;

test('anchors: each anchor is exact at its step; its family takes its hue; lightness is kept; the order holds', () => {
  for (const palette of [IBM, M3]) {
    const r = anchoredSpectrum(data, roles, [...palette]);
    for (const a of r.report) {
      const before = data.schemes.light[a.family], after = r.data.schemes.light[a.family];
      const anchored = after[a.step - 1];
      assert.match(anchored.css, /^oklch\(/);
      // Exact: the stored OKLCH is the anchor's.
      const hue = anchored.oklch[2];
      for (const sw of after) if (sw.step > 1) assert.ok(Math.abs(((sw.oklch[2] - hue + 540) % 360) - 180) < 1e-6, `${a.family} ${sw.step}: hue pinned`);
      for (const sw of after) if (sw.step > 1 && sw.step !== a.step) assert.ok(Math.abs(sw.oklch[0] - before[sw.step - 1].oklch[0]) < 1e-9, `${a.family} ${sw.step}: lightness kept`);
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
  assert.equal(light['--colors-primary-solid'], `var(--colors-spectrum-${roles.primary}-${step})`);
  assert.equal(light['--colors-primary-solid-hover'], `var(--colors-spectrum-${roles.primary}-${Math.min(12, step + 1)})`);
  assert.match(light[`--colors-spectrum-${roles.primary}-${step}`], /^oklch\(/);
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
  assert.equal(css['--colors-primary-solid-hover'], `var(--colors-spectrum-${roles.primary}-11)`);
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
  assert.equal(navy[':root[data-ui-theme="n"]']['--colors-primary-solid'], `var(--colors-spectrum-${roles.primary}-12)`, 'light: the anchored step');
  assert.ok(!navy[':root[data-ui-theme="n"].dark']['--colors-primary-solid']?.endsWith('-12)'), 'dark: not the lightest dark step');
  const r = anchoredSpectrum(data, roles, [{ role: 'primary', value: '#1f3a5f', dark: '#7fb2f0' }]);
  const d = r.report[0].dark!;
  assert.ok(d.step >= 2 && d.step <= 12 && d.inOrder, `dark anchor at step ${d.step}, Lc ${d.lc}`);
  assert.match(r.data.schemes.dark[r.report[0].family][d.step - 1].css, /^oklch\(/);
  if (d.step >= 8) assert.equal(r.solidSteps.dark.primary, d.step);
  assert.ok(validateThemeObject({ schemaVersion: 2, name: 'd', color: { anchors: [{ role: 'primary', value: '#1f3a5f', dark: '#7fb2f0' }] } }).ok);
  assert.equal(validateThemeObject({ schemaVersion: 2, name: 'd', color: { anchors: [{ role: 'primary', value: '#1f3a5f', dark: 'blue' }] } }).ok, false);
});
