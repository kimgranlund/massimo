// Every kit control keeps the arrow cursor, like a native control; the pointing hand stays with links.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const COMPONENTS = fileURLToPath(new URL('../components', import.meta.url));

test('no component recipe sets cursor: pointer', () => {
  const bad = readdirSync(COMPONENTS, { withFileTypes: true }).filter((d) => d.isDirectory())
    .flatMap((d) => readdirSync(join(COMPONENTS, d.name)).filter((f) => f.endsWith('.recipe.ts')).map((f) => join(d.name, f)))
    .filter((f) => /cursor:\s*'pointer'/.test(readFileSync(join(COMPONENTS, f), 'utf8')));
  assert.deepEqual(bad, []);
});
