// Regressions from the adversarial review (2026-11-03): each case once broke.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { migrateTheme, validateThemeObject, themeFromCharacter, themeScopeCss, FONT_STACK } from '../tokens/themes/index.ts';
import { validateBrand, hydrate, lintBrand } from '../tokens/brand/index.ts';
import { generateSpectrum, resolveRoles, anchoredSpectrum } from '../tokens/colors/spectrum/index.ts';

const mini = { schemaVersion: 1, name: 'm', subject: { name: 'M', audience: 'a', primaryJob: 'j', kind: 'tool', sources: ['s'] } };

test('migrateTheme never changes the caller\'s theme', () => {
  const v1 = { schemaVersion: 1, name: 'x', parameters: { emphasis: 2, unit: 4 }, color: { spectrum: {} }, geometry: {}, typography: { faces: { sans: 'Georgia, serif' } } };
  const before = JSON.stringify(v1);
  const v2 = migrateTheme(v1) as any;
  assert.equal(JSON.stringify(v1), before);
  assert.deepEqual(v2.color, { spectrum: {}, parameters: { emphasis: 2 } });
  assert.deepEqual(v2.geometry, { parameters: { unit: 4 } });
  assert.notEqual(v2.typography, v1.typography, 'typography is a copy');
});

test('validateBrand lists bad shapes as errors instead of throwing', () => {
  for (const [patch, path] of [[{ color: { anchors: 'x' } }, 'color.anchors'], [{ territories: [{ name: 't', description: 'd', palette: 5 }] }, 'territories.0.palette'], [{ voice: { tone: 5 } }, 'voice.tone'], [{ f: () => 1 }, 'brand']] as const) {
    const r = validateBrand({ ...mini, ...patch });
    assert.equal(r.ok, false);
    assert.ok((r as any).errors.some((e: string) => e.startsWith(path)), `${path}: ${(r as any).errors}`);
  }
});

test('hydrate and lintBrand resolve face refs on an unvalidated brand too', () => {
  const raw = { ...mini, type: { faces: { body: { ref: 'inter' } } } } as any;
  assert.doesNotThrow(() => lintBrand(raw));
  assert.match(hydrate(raw).theme.typography!.faces!.sans!, /^"Inter", /);
});

test('anchors claim families in role order: a brand role keeps its family whatever the order written', () => {
  const d = generateSpectrum({}), r = resolveRoles(d, {});
  const a = anchoredSpectrum(d, r, [{ role: 'data1', value: '#6b3fd6' }, { role: 'primary', value: '#d1187a' }]);
  assert.equal(a.roles.primary, r.primary);
  assert.notEqual(a.roles.data1, r.primary);
});

test('a hand-set icon set wins over the character, with hand provenance', () => {
  const t = themeFromCharacter({ iconography: 'lucide' }, { icons: 'tabler' }).theme;
  assert.equal(t.icons, 'tabler');
  assert.deepEqual(t.provenance!.icons, { source: 'hand' });
});

test('a colorless scope with a scheme follows the document instead of forcing dark tokens on light ramps', () => {
  const css = themeScopeCss({ schemaVersion: 2, name: 'd', scheme: 'dark' });
  assert.match(css, /prefers-color-scheme: dark/);
  assert.ok(!css.startsWith('[data-ui-scope="d"] {') || !/--colors-shadow-layer-umbra: color-mix\(in oklch, var\(--colors-shadow\) 50%/.test(css.slice(0, css.indexOf('}'))), 'the base block is not the dark one');
});

test('font stacks need balanced quotes', () => {
  for (const ok of ['"Inter Tight", Helvetica, sans-serif', "'Avenir Next', Avenir", 'system-ui, -apple-system, "Segoe UI", sans-serif']) assert.ok(FONT_STACK.test(ok), ok);
  for (const bad of ['"Foo', 'Foo"', 'a; }', '"a", ,b', '']) assert.ok(!FONT_STACK.test(bad), bad);
  assert.equal(validateThemeObject({ schemaVersion: 2, name: 'f', typography: { faces: { display: '"Foo' } } }).ok, false);
});

test('the dark selection uses the primary solid, so its text is that solid\'s contrast color (an anchored dark step included)', async () => {
  const { selectionVars } = await import('../tokens/colors/spectrum/index.ts');
  assert.match(selectionVars('dark')['bg-selected'], /var\(--colors-primary-solid\)/);
  assert.ok(!selectionVars('dark')['bg-selected'].includes('primary-9'));
});
