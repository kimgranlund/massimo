import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { geometryCsv, CSV_PATH } from '../scripts/geometry-csv.ts';

test('docs/geometry.csv matches the resolver (run npm run geometry:csv after changing geometry)', () => {
  assert.equal(readFileSync(CSV_PATH, 'utf8'), geometryCsv());
});
