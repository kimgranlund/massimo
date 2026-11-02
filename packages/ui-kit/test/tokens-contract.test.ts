// contracts/tokens.json agrees with the Panda theme: every path it names exists, and every Panda
// token category and condition is covered by some entry. Structural (groups, not every token), so
// renaming a token inside a group does not touch the contract.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { tokens, semanticTokens } from '../tokens/index.ts';
import { uiKitPreset } from '../preset.ts';

const KIT = new URL('../', import.meta.url).pathname;
const contract = JSON.parse(readFileSync(`${KIT}contracts/tokens.json`, 'utf8'));
const theme: any = { tokens, semanticTokens, conditions: (uiKitPreset as any).conditions };
const entries = Object.entries<any>(contract.tokens);
const named = entries.flatMap(([, e]) => e.panda ?? []);

const resolve = (path: string) => path.split('.').reduce((o: any, k) => (o && typeof o === 'object' && Object.hasOwn(o, k) ? o[k] : undefined), theme);
const covered = (path: string, paths: string[]) => paths.some((p) => p === path || path.startsWith(p + '.'));

/** Every Panda category (tokens.x, semanticTokens.x) and condition (conditions.x). */
const required = (t: any) => [
  ...Object.keys(t.tokens).map((k) => `tokens.${k}`),
  ...Object.keys(t.semanticTokens).map((k) => `semanticTokens.${k}`),
  ...Object.keys(t.conditions).map((k) => `conditions.${k}`),
];
const missing = (paths: string[]) => paths.filter((p) => resolve(p) === undefined);
const uncovered = (t: any, paths: string[]) => required(t).filter((p) => !covered(p, paths));

test('every token group the contract names exists in the Panda theme', () => {
  assert.deepEqual(missing(named), []);
  for (const [k, e] of entries) {
    assert.equal(e.id, `tokens:${k}`, `${k}: id`);
    assert.ok(e.summary, `${k}: summary`);
    for (const f of [e.source, ...(e.dtcg ?? [])]) assert.ok(existsSync(`${KIT}${f}`), `${k}: ${f} exists`);
  }
});

test('every Panda token category and condition is covered by a contract entry', () => {
  assert.deepEqual(uncovered(theme, named), []);
});

test('the token contract check bites', () => {
  assert.deepEqual(missing(['tokens.spacing.pad', 'tokens.nope', 'semanticTokens.colors.nope']), ['tokens.nope', 'semanticTokens.colors.nope']);
  assert.deepEqual(uncovered({ ...theme, tokens: { ...tokens, zIndex: {} } }, named), ['tokens.zIndex']);
  assert.deepEqual(uncovered({ ...theme, conditions: { ...theme.conditions, hovered: '&:hover' } }, named), ['conditions.hovered']);
  assert.deepEqual(uncovered(theme, named.filter((p: string) => p !== 'tokens.radii')), ['tokens.radii']);
});

test('the color-roles entry names the role families and every semantic color group is a family or a listed surface', () => {
  const roles = contract.tokens['color-roles'];
  assert.deepEqual(roles.roleFamilies, ['primary', 'secondary', 'neutral', 'critical', 'warning', 'success', 'info', 'data']);
  const surfaces = roles.panda.filter((p: string) => p.startsWith('semanticTokens.colors.')).map((p: string) => p.split('.')[2]);
  for (const g of Object.keys(semanticTokens.colors)) assert.ok([...roles.roleFamilies, ...surfaces].includes(g), `semanticTokens.colors.${g} is neither a role family nor a listed surface`);
});
