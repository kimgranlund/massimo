// Writes public/brands/: each reference brand's root CSS and an index of names and font links, so
// the site's Theme select loads one stylesheet on demand. Generated, and ignored by git.
import { mkdirSync, readdirSync, readFileSync, existsSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { validateBrand } from '../../../packages/ui-kit/tokens/brand/index.ts';
import { buildBrand } from '../../../packages/ui-kit/tokens/brand/build.ts';

const source = fileURLToPath(new URL('../../../docs/references/brand-expressions/', import.meta.url));
const out = fileURLToPath(new URL('../public/brands/', import.meta.url));
mkdirSync(out, { recursive: true });
const index = readdirSync(source).filter((d) => existsSync(`${source}${d}/brand.json`)).sort().map((id) => {
  const r = validateBrand(JSON.parse(readFileSync(`${source}${id}/brand.json`, 'utf8')));
  if (!r.ok) throw new Error(`${id}: ${r.errors.join('; ')}`);
  const { css, theme } = buildBrand(r.brand);
  writeFileSync(`${out}${id}.css`, css);
  return { id, label: id.replaceAll('-', ' '), fonts: (theme.typography?.sources ?? []).map((s) => s.url) };
});
writeFileSync(`${out}index.json`, `${JSON.stringify(index, null, 2)}\n`);
console.log(`docs: ${index.length} brands`);
