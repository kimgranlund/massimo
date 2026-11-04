// Brand reproduction eval: how close is a candidate brand, authored from a brief and the guide alone,
// to the worked brand from the same brief? Scores what the brief should settle: the grounding, the
// territory, the signature scale, and the 15 descriptor scales (describeTheme on each hydrated
// theme). Appends one row per candidate to eval.jsonl in a report folder (the KPI docs/kpi/001-brand-
// reproduction.md), so guide changes are measured over time instead of judged once.
//   node scripts/brand-eval.ts <worked-name> <candidate.json> [--note "what changed"] [--log <report dir>] [--dry]
import { appendFileSync, mkdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';
import { describeTheme, DESCRIPTORS } from '../tokens/themes/index.ts';
import { hydrate, lintBrand, primaryTerritory, validateBrand, type Brand } from '../tokens/brand/index.ts';
import { EXAMPLE_BRANDS } from '../tokens/brand/examples.ts';

export interface EvalRow { date: string; brief: string; scales: { agree: number; total: number; differ: string[] }; grounding: boolean; territory: boolean; signature: boolean; lintWarnings: number; unresolved: number; score: number; note?: string }

/** Compare a candidate brand with a worked one. score = the mean of scale agreement and the three frame matches. */
export function evaluate(worked: Brand, candidate: Brand, note?: string): EvalRow {
  const w = describeTheme(hydrate(worked).theme), c = describeTheme(hydrate(candidate).theme);
  const ids = Object.keys(DESCRIPTORS);
  const differ = ids.filter((id) => w[id].value !== c[id].value);
  const ref = (b: Brand) => b.grounding?.primary.ref ?? b.grounding?.primary.name;
  const grounding = ref(worked) === ref(candidate) && worked.grounding?.primary.relation === candidate.grounding?.primary.relation;
  const territory = primaryTerritory(worked)?.ref === primaryTerritory(candidate)?.ref;
  const signature = worked.signature?.scale === candidate.signature?.scale;
  const agree = ids.length - differ.length;
  const score = Math.round(((agree / ids.length + Number(grounding) + Number(territory) + Number(signature)) / 4) * 100) / 100;
  return {
    date: new Date().toISOString().slice(0, 10), brief: worked.name,
    scales: { agree, total: ids.length, differ }, grounding, territory, signature,
    lintWarnings: lintBrand(candidate).filter((f) => f.severity === 'warning').length,
    unresolved: hydrate(candidate).unresolved.length, score, ...(note ? { note } : {}),
  };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [name, file] = process.argv.slice(2);
  const args = process.argv.slice(4);
  const worked = EXAMPLE_BRANDS.find((b) => b.name === name);
  if (!worked || !file) { console.error(`usage: brand-eval.ts <${EXAMPLE_BRANDS.map((b) => b.name).join(' | ')}> <candidate.json> [--note "…"] [--dry]`); process.exit(2); }
  const v = validateBrand(JSON.parse(readFileSync(file, 'utf8')));
  if (!v.ok) { console.error(v.errors.join('\n')); process.exit(1); }
  const row = evaluate(worked, v.brand, args.includes('--note') ? args[args.indexOf('--note') + 1] : undefined);
  console.log(JSON.stringify(row));
  if (!args.includes('--dry')) {
    // --log <dir>: a new dated report folder for a new round; else the first round's.
    const dir = args.includes('--log') ? resolve(args[args.indexOf('--log') + 1]) : fileURLToPath(new URL('../../../docs/reports/2026-11-03-brand-reproduction/', import.meta.url));
    mkdirSync(dir, { recursive: true });
    appendFileSync(join(dir, 'eval.jsonl'), JSON.stringify(row) + '\n');
  }
}
