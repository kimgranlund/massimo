// The Brand CLI (tokens/brand): write the schema, and validate, lint or hydrate a brand file.
//   node scripts/brand.ts schema [--check]     write contracts/brand.schema.json (or exit 1 when stale)
//   node scripts/brand.ts validate <brand.json>
//   node scripts/brand.ts lint <brand.json>      brand findings, then the hydrated theme's lint
//   node scripts/brand.ts hydrate <brand.json>   print the theme (schema v2) and the open questions
//   node scripts/brand.ts build <brand.json> [--out dir] [--scope]
//       write what an app loads: <name>.theme.json (the hydrated theme), <name>.css (the theme on the
//       document root) or with --scope <name>.scope.css (on [data-ui-scope="<name>"]), and
//       <name>.fonts.html (the font <link> tags). Load the kit CSS first, then the brand CSS.
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { brandJsonSchemaText, validateBrand, hydrate, lintBrand } from '../tokens/brand/index.ts';
import { lintTheme, validateThemeObject } from '../tokens/themes/index.ts';
import { buildBrand } from '../tokens/brand/build.ts';
import { anchoredSpectrum, generateSpectrum, resolveRoles } from '../tokens/colors/spectrum/index.ts';
import { normalizeSpectrum, spectrumOverrides } from '../tokens/colors/spectrum/config.ts';

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
  console.log(`${b.name}: ${brand.length} brand findings, ${t.length} theme findings`);
} else if (cmd === 'hydrate') {
  const { theme, unresolved } = hydrate(load());
  const v = validateThemeObject(theme);
  // Where each anchor lands (placed at render time, so the theme stores no step).
  const data = generateSpectrum(spectrumOverrides(normalizeSpectrum(theme.color?.spectrum ?? {})));
  const anchors = anchoredSpectrum(data, resolveRoles(data, theme.color?.roles ?? {}), theme.color?.anchors).report
    .map((a) => ({ role: a.role, family: a.family, value: a.value, step: a.step, lc: a.lc, target: a.target, inOrder: a.inOrder, ...(a.dark ? { dark: a.dark } : {}) }));
  console.log(JSON.stringify({ theme, anchors, unresolved, valid: v.ok }, null, 2));
  if (!v.ok) process.exit(1);
} else if (cmd === 'build') {
  const args = process.argv.slice(4);
  const out = args.includes('--out') ? args[args.indexOf('--out') + 1] : '.';
  const r = buildBrand(load(), { scope: args.includes('--scope') });
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, `${r.theme.name}.theme.json`), JSON.stringify({ $schema: 'https://massimo.dev/contracts/theme.schema.json', ...r.theme }, null, 2) + '\n');
  // The scoped build gets its own file, so one brand can ship both.
  const cssFile = `${r.theme.name}${args.includes('--scope') ? '.scope' : ''}.css`;
  writeFileSync(join(out, cssFile), r.css);
  writeFileSync(join(out, `${r.theme.name}.fonts.html`), r.fonts);
  console.log(`wrote ${out}/${r.theme.name}.theme.json, ${cssFile}, ${r.theme.name}.fonts.html${r.unresolved.length ? `; ${r.unresolved.length} open questions (npm run brand -- hydrate)` : ''}`);
} else { console.error('usage: brand.ts schema [--check] | validate | lint | hydrate | build <brand.json> [--out dir] [--scope]'); process.exit(2); }
