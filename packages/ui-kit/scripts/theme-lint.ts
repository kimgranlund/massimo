// Lints themes against contracts/theme-constraints.json (tokens/themes/lint.ts).
//   node scripts/theme-lint.ts                 the kit defaults and every saved theme
//   node scripts/theme-lint.ts <file.json>     a theme object file (the jig's Copy)
//   node scripts/theme-lint.ts <name>          one saved theme
// Prints one line per finding; exits 1 when any theme has an error (or is not a valid theme object).
import { readFileSync, existsSync } from 'node:fs';
import { lintTheme } from '../tokens/themes/lint.ts';
import { savedThemes, validateThemeObject, type Theme } from '../tokens/themes/index.ts';

const arg = process.argv[2];
const targets: [string, Partial<Theme>][] = [];
if (!arg) targets.push(['(defaults)', {}], ...Object.entries(savedThemes));
else if (existsSync(arg)) {
  const v = validateThemeObject(JSON.parse(readFileSync(arg, 'utf8')));
  if (!v.ok) { console.error(`${arg}: not a valid theme object\n  ${v.errors.join('\n  ')}`); process.exit(1); }
  targets.push([v.theme.name, v.theme]);
} else if (savedThemes[arg]) targets.push([arg, savedThemes[arg]]);
else { console.error(`${arg}: no such file or saved theme`); process.exit(1); }

let failed = false;
for (const [name, theme] of targets) {
  const r = lintTheme(theme);
  console.log(`${name}: ${r.findings.length ? `${r.findings.filter((f) => f.severity === 'error').length} errors, ${r.findings.filter((f) => f.severity === 'warning').length} warnings, ${r.findings.filter((f) => f.severity === 'info').length} info` : 'clean'}`);
  for (const f of r.findings) console.log(`  ${f.severity.padEnd(7)} ${f.id}: ${f.message}. Fix: ${f.fix}`);
  failed ||= !r.ok;
}
process.exit(failed ? 1 : 0);
