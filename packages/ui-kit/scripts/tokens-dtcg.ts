// Generates tokens/tokens.dtcg.json: the geometry as Design Tokens Community Group (2025.10)
// tokens. DTCG has no arithmetic, so each token carries:
//   $value                       the resolved value at the default theme (u = 4, B = 1, s = 1)
//   $extensions.com.massimo.formula  the generative rule (u = {input.u}, B = {input.border}, s = {input.radiusScale})
//   $extensions.com.massimo.bySize   the resolved value at every supported size (u = 2 … 12)
// Rows come from scripts/geometry-csv.ts, which computes them with the resolver, so the CSV,
// the CSS and this file share one source. Run: npm run tokens:dtcg (test fails when stale).
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { GEOMETRY_DEFAULTS, SIZES } from '../tokens/geometry/resolve.ts';
import { rows } from './geometry-csv.ts';

type Json = Record<string, any>;
const NUMBER_TOKENS = new Set(['in.s', 'in.k']);
const ROOT_PATH: Record<string, string> = { in: 'input' };
const round = (n: number) => Math.round(n * 1000) / 1000;

export function tokensDtcg(): Json {
  const tree: Json = {
    $schema: 'https://www.designtokens.org/schemas/2025.10/format.json',
    $description: `ui-kit geometry. Everything derives from u (size, 2–12px), B (border) and s (radius scale). $value is resolved at u=${GEOMETRY_DEFAULTS.unit}, B=${GEOMETRY_DEFAULTS.border}, s=${GEOMETRY_DEFAULTS.radiusScale}; com.massimo.formula gives the rule and com.massimo.bySize the value at every size.`,
  };
  for (const r of rows) {
    const value = r.value(GEOMETRY_DEFAULTS.unit);
    if (Number.isNaN(value)) continue; // inputs without a numeric value (e.g. the gap attribute)
    const [head, ...rest] = r.id.split('.');
    const path = [ROOT_PATH[head] ?? head, ...rest];
    let group = tree;
    for (const key of path.slice(0, -1)) {
      group[key] ??= {};
      if ('$value' in group[key]) throw new Error(`${r.id}: ${key} is already a token`);
      group = group[key];
    }
    const leaf = path.at(-1)!;
    if (group[leaf]) throw new Error(`${r.id}: duplicate or group/token clash`);
    const isNumber = NUMBER_TOKENS.has(r.id);
    group[leaf] = {
      $type: isNumber ? 'number' : 'dimension',
      $value: isNumber ? round(value) : { value: round(value), unit: 'px' },
      $description: [r.element, r.quantity, r.notes].filter(Boolean).join(' · '),
      $extensions: {
        'com.massimo.formula': r.formula,
        'com.massimo.status': r.status,
        'com.massimo.bySize': Object.fromEntries(SIZES.map((u) => [`u=${u}`, round(r.value(u))])),
      },
    };
  }
  return tree;
}

export const DTCG_PATH = fileURLToPath(new URL('../tokens/tokens.dtcg.json', import.meta.url));
export const tokensDtcgText = () => JSON.stringify(tokensDtcg(), null, 2) + '\n';

if (import.meta.main) {
  writeFileSync(DTCG_PATH, tokensDtcgText());
  console.log(`wrote ${DTCG_PATH}`);
}
