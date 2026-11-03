import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import Ajv from 'ajv';
import { validateTheme, validateThemeObject, themeCss, themeJsonSchemaText, savedThemes, diffFromDefaults, defaultParams } from '../tokens/themes/index.ts';

test('validateTheme accepts known in-range params only', () => {
  assert.deepEqual(validateTheme('brand-x', { 'unit': 3 }), { ok: true, name: 'brand-x', params: { 'unit': 3 } });
  assert.equal(validateTheme('Brand X', {}).ok, false);
  assert.equal(validateTheme('x', { 'unit': 99 }).ok, false);
  assert.equal(validateTheme('x', { 'unit': '3' }).ok, false);
  assert.equal(validateTheme('x', { 'color: red; --a': 1 }).ok, false);
});

const FULL = {
  schemaVersion: 1, name: 'harbor', description: 'Compact, crisp, layered.',
  parameters: { unit: 4, density: 0, 'radius-scale': 0.5, 'shadow-strength': 1.5 },
  icons: 'lucide', scheme: 'dark',
  color: { spectrum: { hue: 200, chroma: 60 }, roles: { primary: 'teal', critical: 'red' } },
  typography: { faces: { sans: '"Avenir Next", system-ui, sans-serif' }, voices: { heading: 'serif' } },
  provenance: { 'parameters.density': { source: 'hand', reason: 'data-dense tool' } },
};

test('validateThemeObject: one object for every section; all problems at once', () => {
  assert.deepEqual(validateThemeObject(FULL), { ok: true, theme: FULL });
  const bad = validateThemeObject({ schemaVersion: 2, name: 'Bad Name', parameters: { unit: 99, density: 0.5, nope: 1 }, scheme: 'dim', color: { roles: { primary: 'Teal!' }, spectrum: { hue: 999 } }, typography: { faces: { sans: 'x; } body { color: red' }, voices: { heading: 'comic' } }, extra: 1 });
  assert.equal(bad.ok, false);
  const errors = (bad as { errors: string[] }).errors.join('\n');
  for (const path of ['schemaVersion', 'name', 'parameters.unit', 'parameters.density', 'parameters.nope', 'scheme', 'color.roles.primary', 'color.spectrum', 'typography.faces.sans', 'typography.voices.heading', 'extra'])
    assert.match(errors, new RegExp(`^${path.replace('.', '\\.')}:`, 'm'), `reports ${path}`);
});

test('contracts/theme.schema.json is current (npm run theme:schema) and agrees with the validator', () => {
  assert.equal(readFileSync(new URL('../contracts/theme.schema.json', import.meta.url), 'utf8'), themeJsonSchemaText());
  const ajv = new (Ajv as any)({ strict: false, allErrors: true });
  const schema = ajv.compile(JSON.parse(themeJsonSchemaText()));
  const cases: [unknown, boolean][] = [
    [FULL, true], [{ schemaVersion: 1, name: 'x' }, true],
    [{ schemaVersion: 1, name: 'x', parameters: { unit: 99 } }, false], [{ schemaVersion: 1, name: 'x', parameters: { nope: 1 } }, false],
    [{ schemaVersion: 1, name: 'x', typography: { voices: { heading: 'comic' } } }, false], [{ schemaVersion: 1, name: 'x', color: { roles: { primary: 'Teal!' } } }, false],
    [{ schemaVersion: 1, name: 'x', scheme: 'dim' }, false], [{ name: 'x' }, false],
  ];
  for (const [theme, ok] of cases) {
    assert.equal(schema(theme), ok, `schema: ${JSON.stringify(theme)}`);
    assert.equal(validateThemeObject(theme).ok, ok, `validator: ${JSON.stringify(theme)}`);
  }
});

test('saved themes are valid theme objects named by their key', () => {
  for (const [key, t] of Object.entries(savedThemes)) {
    const r = validateThemeObject(t);
    assert.ok(r.ok, `${key}: ${JSON.stringify((r as any).errors)}`);
    assert.equal(t.name, key);
  }
});

test('themeCss emits defaults on :root and one root-scoped block per theme: parameters, faces, voices, colors per scheme', () => {
  const css = themeCss({ warm: { schemaVersion: 1, name: 'warm', parameters: { unit: 3 } } });
  assert.equal(css[':root']['--ui-unit'], '4.5');
  assert.deepEqual(css[':root[data-ui-theme="warm"]'], { '--ui-unit': '3' });
  const full = themeCss({ harbor: FULL as any });
  const root = full[':root[data-ui-theme="harbor"]'];
  assert.equal(root['--ui-density'], '0');
  assert.equal(root['--fonts-sans'], FULL.typography.faces.sans);
  assert.equal(root['--font-voice-heading'], 'var(--fonts-serif)');
  assert.equal(root['--font-voice-heading-weight'], '400', 'serif headings drop to 400');
  assert.ok(root['--colors-primary-solid'], 'colors in light on the theme root');
  assert.ok(full[':root[data-ui-theme="harbor"].dark']['--colors-primary-solid'], 'a forced dark root');
  assert.ok(full['@media (prefers-color-scheme: dark)'][':root[data-ui-theme="harbor"]:not(.light)'], 'the OS dark scheme');
  assert.notEqual(full[':root[data-ui-theme="harbor"].dark']['--colors-spectrum-neutral-1'], root['--colors-spectrum-neutral-1'], 'dark ramps differ from light');
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

test('theme lint: every contract rule has a predicate, and its failing fixture fires it while its passing fixture does not', async () => {
  const { lintTheme, RULES, THEME_CONSTRAINTS } = await import('../tokens/themes/lint.ts');
  assert.deepEqual(Object.keys(RULES).sort(), Object.keys(THEME_CONSTRAINTS).sort(), 'contracts/theme-constraints.json and lint.ts name the same rules');
  for (const [id, rule] of Object.entries(THEME_CONSTRAINTS)) {
    const fired = (t: unknown) => lintTheme(t as any, { only: [id] }).findings.some((f) => f.id === id);
    assert.ok(fired(rule.fixtures.fail), `${id}: the failing fixture fires`);
    assert.ok(!fired(rule.fixtures.pass), `${id}: the passing fixture does not`);
    assert.ok(validateThemeObject({ schemaVersion: 1, name: 'fixture', ...(rule.fixtures.fail as object) }).ok, `${id}: the failing fixture is a valid theme`);
  }
  const r = lintTheme({ parameters: { unit: 2.5, 'modal-shadow': undefined, 'shadow-modal': 0 } as any });
  assert.equal(r.findings[0].severity, 'warning', 'warnings before info');
  assert.ok(Object.values(THEME_CONSTRAINTS).every((c) => c.severity !== 'error'), 'the lint advises, it never blocks');
});

test('typography.colors maps a type role to a text color: validated, emitted as --ui-type-color-<role>', async () => {
  const { DEFAULT_TYPE_COLORS } = await import('../tokens/typography/resolve.ts');
  assert.equal(DEFAULT_TYPE_COLORS['heading-1'], 'strong');
  assert.equal(DEFAULT_TYPE_COLORS.body, 'inherit');
  const t = { schemaVersion: 1 as const, name: 'tc', typography: { colors: { caption: 'muted' as const, 'heading-2': 'primary' as const } } };
  assert.ok(validateThemeObject(t).ok);
  assert.equal(validateThemeObject({ ...t, typography: { colors: { caption: 'pink' } } }).ok, false);
  assert.equal(validateThemeObject({ ...t, typography: { colors: { footer: 'muted' } } }).ok, false);
  const root = themeCss({ tc: t })[':root[data-ui-theme="tc"]'];
  assert.equal(root['--ui-type-color-caption'], 'var(--colors-fg-muted)');
  assert.equal(root['--ui-type-color-heading-2'], 'var(--colors-primary-fg)');
});
