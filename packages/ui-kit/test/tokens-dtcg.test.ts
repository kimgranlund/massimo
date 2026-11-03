import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { dtcgFiles, DTCG_DIR } from '../scripts/tokens-dtcg.ts';

const SCHEMA = JSON.parse(readFileSync(new URL('./fixtures/dtcg-2025.10-format.json', import.meta.url), 'utf8'));
const ajv = new (Ajv as any)({ strict: false, allErrors: true });
(addFormats as any)(ajv);
const validate = ajv.compile(SCHEMA);
const files = dtcgFiles();
const dtcg = Object.keys(files).filter((f) => f.endsWith('.dtcg.json'));

test('committed tokens/dtcg files match the generator (run npm run tokens:dtcg)', () => {
  for (const [name, text] of Object.entries(files)) assert.equal(readFileSync(DTCG_DIR + name, 'utf8'), text, name);
});

for (const name of dtcg) {
  test(`${name} validates against the DTCG 2025.10 schema`, () => {
    const ok = validate(JSON.parse(files[name]));
    assert.ok(ok, JSON.stringify(validate.errors?.slice(0, 3)));
  });
}

test('the schema check bites: malformed tokens are rejected', () => {
  const bad = JSON.parse(files['geometry.dtcg.json']);
  bad.control.height.$value = { value: '32', unit: 'em' };
  assert.equal(validate(bad), false);
  const badColor = JSON.parse(files['color.light.dtcg.json']);
  badColor.color.spectrum.indigo['9'].$value = { colorSpace: 'cmyk', components: [0, 0, 0, 0] };
  assert.equal(validate(badColor), false);
});

test('every alias resolves within its file set (geometry + typography + one scheme)', () => {
  for (const scheme of ['color.light.dtcg.json', 'color.dark.dtcg.json']) {
    const merged: Record<string, any> = {};
    const tokens = new Map<string, any>();
    const walk = (node: any, path: string[]) => {
      for (const [k, v] of Object.entries(node)) {
        if (k.startsWith('$')) continue;
        if ((v as any).$value !== undefined) tokens.set([...path, k].join('.'), v); else walk(v, [...path, k]);
      }
    };
    for (const f of ['geometry.dtcg.json', 'typography.dtcg.json', scheme]) walk(JSON.parse(files[f]), []);
    const refs = (v: any): string[] => typeof v === 'string' ? [...v.matchAll(/\{([^}]+)\}/g)].map((m) => m[1]) : v && typeof v === 'object' ? Object.values(v).flatMap(refs) : [];
    for (const [path, t] of tokens) for (const ref of refs(t.$value)) assert.ok(tokens.has(ref), `${scheme}: ${path} -> {${ref}} does not resolve`);
    void merged;
  }
});

test('types cover the system: ratios are numbers, roles are typography, ramps are oklch', () => {
  const g = JSON.parse(files['geometry.dtcg.json']), t = JSON.parse(files['typography.dtcg.json']), c = JSON.parse(files['color.dark.dtcg.json']);
  assert.equal(t.input['type-ratio'].$type, 'number');
  assert.equal(g.input.container['card-md'].pad.$value, 4);
  assert.equal(c.shadow.md.$type, 'shadow');
  assert.equal(c.shadow.md.$value.length, 3, 'umbra, penumbra, ambient');
  assert.equal(t.typography['heading-1'].$type, 'typography');
  assert.equal(t.typography['heading-1'].$value.fontFamily, '{font.voice.heading}');
  assert.equal(t.font.voice.heading.$value, '{font.face.sans}');
  assert.equal(c.color.spectrum.indigo['9'].$value.colorSpace, 'oklch');
  assert.equal(c.color.role['primary-solid'].$value, '{color.spectrum.indigo.9}');
});
