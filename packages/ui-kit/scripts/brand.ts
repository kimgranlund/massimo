// The Brand CLI (tokens/brand): write the schema, and validate, lint or hydrate a brand file.
//   node scripts/brand.ts schema [--check]     write contracts/brand.schema.json (or exit 1 when stale)
//   node scripts/brand.ts validate <brand.json>
//   node scripts/brand.ts lint <brand.json>      brand findings, then the hydrated theme's lint
//   node scripts/brand.ts hydrate <brand.json>   print the theme (schema v2) and the open questions
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { brandJsonSchemaText, validateBrand, hydrate, lintBrand } from '../tokens/brand/index.ts';
import { lintTheme, validateThemeObject } from '../tokens/themes/index.ts';

const [cmd, arg, flag] = process.argv.slice(2);
const load = () => {
  const r = validateBrand(JSON.parse(readFileSync(arg, 'utf8')));
  if (!r.ok) { console.error(r.errors.join('\n')); process.exit(1); }
  return r.brand;
};
if (cmd === 'schema') {
  const path = fileURLToPath(new URL('../contracts/brand.schema.json', import.meta.url));
  const text = brandJsonSchemaText();
  if (arg === '--check' || flag === '--check') { const cur = (() => { try { return readFileSync(path, 'utf8'); } catch { return ''; } })(); if (cur !== text) { console.error('contracts/brand.schema.json is stale: npm run brand:schema'); process.exit(1); } console.log('current'); }
  else { writeFileSync(path, text); console.log('wrote contracts/brand.schema.json'); }
} else if (cmd === 'validate') { load(); console.log('valid'); }
else if (cmd === 'lint') {
  const b = load();
  const brand = lintBrand(b), { theme } = hydrate(b), t = lintTheme(theme).findings;
  for (const f of brand) console.log(`  ${f.severity} ${f.id}: ${f.message}`);
  for (const f of t) console.log(`  ${f.severity} ${f.id} (theme): ${f.message}`);
  console.log(`${b.name}: ${brand.length + t.length} findings`);
} else if (cmd === 'hydrate') {
  const { theme, unresolved } = hydrate(load());
  const v = validateThemeObject(theme);
  console.log(JSON.stringify({ theme, unresolved, valid: v.ok }, null, 2));
  if (!v.ok) process.exit(1);
} else { console.error('usage: brand.ts schema [--check] | validate | lint | hydrate <brand.json>'); process.exit(2); }
