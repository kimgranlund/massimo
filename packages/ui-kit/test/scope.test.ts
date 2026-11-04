// Scoped themes (tokens/themes/scope.ts): the CSS a scope needs. The browser side (lengths, tokens,
// shadows, anchor colors, scheme) is apps/studio/scope-check.html in check:browsers.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { themeScopeCss, scopeSelector, unitTokenVars, motionTokenVars, elevationTokenVars, SHADOW_LAYERS } from '../tokens/index.ts';

const theme = { schemaVersion: 2 as const, name: 'probe', geometry: { parameters: { unit: 3 } }, color: { roles: { primary: 'teal' } } };

test('scope: the selector is a validated data-ui-scope attribute', () => {
  assert.equal(scopeSelector('probe'), '[data-ui-scope="probe"]');
  assert.throws(() => scopeSelector('x"] body { color: red } ['));
});

test('scope: the base block redeclares the theme and every derived token; colors and shadows per scheme', () => {
  const css = themeScopeCss(theme);
  const base = css.slice(0, css.indexOf('}\n'));
  assert.match(base, /^\[data-ui-scope="probe"\] \{/);
  assert.match(base, /--ui-unit: 3;/);
  for (const k of [...Object.keys(unitTokenVars()), ...Object.keys(motionTokenVars()), ...Object.keys(elevationTokenVars())]) assert.ok(base.includes(`${k}:`), `base redeclares ${k}`);
  for (const k of Object.keys(SHADOW_LAYERS)) assert.ok(base.includes(`--colors-shadow-layer-${k}:`));
  assert.match(base, /--colors-primary-solid:/);
  assert.match(base, /color: var\(--colors-fg\);/, 'plain text follows the scope');
  assert.match(css, /@media \(prefers-color-scheme: dark\) \{\n:root:not\(\.light\) \[data-ui-scope="probe"\]:not\(\.light\) \{/);
  assert.match(css, /:root\.dark \[data-ui-scope="probe"\]:not\(\.light\), \[data-ui-scope="probe"\]\.dark \{/);
  assert.match(css, /:root\.light \[data-ui-scope="probe"\]:not\(\.dark\), \[data-ui-scope="probe"\]\.light \{/);
});

test('scope: a theme without colors still scopes its parameters and shadow colors', () => {
  const css = themeScopeCss({ schemaVersion: 2, name: 'plain', motion: { parameters: { 'motion-scale': 0.5 } } });
  assert.match(css, /--ui-motion-scale: 0\.5;/);
  assert.ok(!css.includes('--colors-spectrum-'), 'no ramps without a color section');
  assert.match(css, /--colors-shadow-layer-umbra:/);
});

test('scope: a theme with its own scheme leads with it; the scope element can still force the other', () => {
  const dark = themeScopeCss({ ...theme, scheme: 'dark' });
  assert.ok(!dark.includes('prefers-color-scheme'), 'a dark-first scope ignores the OS');
  assert.match(dark, /\[data-ui-scope="probe"\]\.light \{/);
  const light = themeScopeCss({ ...theme, scheme: 'light' });
  assert.match(light, /\[data-ui-scope="probe"\]\.dark \{/);
  assert.ok(!light.includes(':root.dark'));
});
