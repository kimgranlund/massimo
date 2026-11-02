import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { tokensDtcg, tokensDtcgText, DTCG_PATH } from '../scripts/tokens-dtcg.ts';

test('tokens/tokens.dtcg.json matches the resolver (run npm run tokens:dtcg after changing geometry)', () => {
  assert.equal(readFileSync(DTCG_PATH, 'utf8'), tokensDtcgText());
});

test('DTCG shape: valid names, every token typed with a well-formed value', () => {
  let tokens = 0;
  const walk = (node: Record<string, any>, path: string) => {
    for (const [k, v] of Object.entries(node)) {
      if (k.startsWith('$')) continue;
      assert.match(k, /^[^${}.][^{}.]*$/, `invalid name at ${path}.${k}`);
      if ('$value' in v) {
        tokens++;
        assert.ok(v.$type === 'dimension' || v.$type === 'number', `${path}.${k} type`);
        if (v.$type === 'dimension') assert.ok(typeof v.$value.value === 'number' && v.$value.unit === 'px', `${path}.${k} value`);
        else assert.equal(typeof v.$value, 'number');
      } else walk(v, `${path}.${k}`);
    }
  };
  const tree = tokensDtcg();
  walk(tree, '');
  assert.ok(tokens > 60);
  assert.deepEqual(tree.control.height.$value, { value: 32, unit: 'px' });
  assert.equal(tree.control.height.$extensions['com.massimo.bySize']['u=3'], 24);
  assert.equal(tree.container.card.radius.$value.value, 28);
});
