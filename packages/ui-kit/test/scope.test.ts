// Scoped themes (tokens/themes/scope.ts): the CSS a scope needs. The browser side (lengths, tokens,
// shadows, anchor colors, scheme) is apps/studio/scope-check.html in check:browsers.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { themeScopeCss, scopeSelector } from '../tokens/themes/scope.ts';
import { unitTokenVars } from '../tokens/geometry/index.ts';
import { motionTokenVars } from '../tokens/motion/index.ts';
import { elevationTokenVars, SHADOW_LAYERS } from '../tokens/elevation/index.ts';

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
  for (const k of [...Object.keys(unitTokenVars()), ...Object.keys(elevationTokenVars())]) assert.ok(base.includes(`${k}:`), `base redeclares ${k}`);
  assert.ok(!base.includes(Object.keys(motionTokenVars())[0] + ':'), 'no motion tokens without motion parameters');
  const moving = themeScopeCss({ ...theme, motion: { parameters: { 'motion-scale': 0.5 } } });
  for (const k of Object.keys(motionTokenVars())) assert.ok(moving.includes(`${k}:`), `with motion parameters it redeclares ${k}`);
  for (const k of Object.keys(SHADOW_LAYERS)) assert.ok(base.includes(`--colors-shadow-layer-${k}:`));
  assert.match(base, /--colors-primary-solid:/);
  assert.match(base, /color: var\(--colors-fg\);/, 'plain text follows the scope');
  assert.match(base, /font-family: var\(--font-voice-body, var\(--fonts-sans\)\);/, 'and takes the scope\'s body face');
  assert.match(css, /@media \(prefers-color-scheme: dark\) \{\n:root:not\(\.light\) \[data-ui-scope="probe"\]:not\(\.light\) \{/);
  assert.match(css, /:root\.dark \[data-ui-scope="probe"\]:not\(\.light\), \[data-ui-scope="probe"\]\.dark \{/);
  assert.ok(!css.includes(':root.light'), 'no separate light block: the base is light and the dark rules exclude .light');
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

test('scope: only the ramp families its roles use are emitted', () => {
  const css = themeScopeCss(theme);
  const fams = new Set([...css.matchAll(/--colors-spectrum-([a-z0-9-]+?)-\d+:/g)].map((m) => m[1]));
  const refs = new Set([...css.matchAll(/var\(--colors-spectrum-([a-z0-9-]+?)-\d+\)/g)].map((m) => m[1]));
  assert.deepEqual([...fams].sort(), [...refs].sort(), 'every declared family is referenced, and every referenced one declared');
  assert.ok(fams.size < 13, `${fams.size} families, not all`);
  assert.ok(css.length < 80_000, `${css.length} bytes`);
});
