// Buttons and menus keep the arrow cursor: a kit control behaves like a native control, and the pointing
// hand stays with links. Pointer is left only on the input-like controls listed here.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const COMPONENTS = fileURLToPath(new URL('../components', import.meta.url));
const POINTER_ALLOWED = ['choice', 'color', 'range'];

test('no button or menu recipe sets cursor: pointer', () => {
  const bad = readdirSync(COMPONENTS, { withFileTypes: true }).filter((d) => d.isDirectory() && !POINTER_ALLOWED.includes(d.name))
    .flatMap((d) => readdirSync(join(COMPONENTS, d.name)).filter((f) => f.endsWith('.recipe.ts')).map((f) => join(d.name, f)))
    .filter((f) => /cursor:\s*'pointer'/.test(readFileSync(join(COMPONENTS, f), 'utf8')));
  assert.deepEqual(bad, []);
});
