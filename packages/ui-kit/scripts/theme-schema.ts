// Writes contracts/theme.schema.json, the JSON Schema of a theme object, from tokens/themes/theme.ts
// (and the PARAMS, SPECTRUM_FIELDS, ROLE_NAMES, FACES and VOICES it reads).
//   node scripts/theme-schema.ts          write contracts/theme.schema.json
//   node scripts/theme-schema.ts --check  exit 1 when it is stale
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { themeJsonSchemaText } from '../tokens/themes/theme.ts';

const path = fileURLToPath(new URL('../contracts/theme.schema.json', import.meta.url));
const text = themeJsonSchemaText();
if (process.argv.includes('--check')) {
  let cur = '';
  try { cur = readFileSync(path, 'utf8'); } catch { /* missing */ }
  if (cur !== text) { console.error('contracts/theme.schema.json is stale: run npm run theme:schema'); process.exit(1); }
  console.log('theme.schema.json current');
} else {
  writeFileSync(path, text);
  console.log('wrote contracts/theme.schema.json');
}
