// Verification records: components/<name>/verification/<name>.verification.json.
// A record binds a component folder's sources (by SHA-256) to the checks that cover them and
// the latest run of those checks. The unit tests fail when a bound source changes, so a change
// to a component is re-verified, not just re-hashed: `run` stamps new hashes only when every
// declared check passes.
//
//   node scripts/verification.ts check [name…]   report stale or missing records (exit 1 if any)
//   node scripts/verification.ts run <name…|--all>   run the checks; on pass, write hashes + latestRun
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

export const KIT = fileURLToPath(new URL('..', import.meta.url));

export interface Check { command: string; covers: string }
export interface VerificationRecord {
  $schema?: string;
  schemaVersion: 1;
  component: string;
  scope: string;
  sources: { path: string; sha256: string }[];
  renderers: Record<string, { checks: Check[]; latestRun: null | { date: string; outcome: 'pass'; commands: string[]; environment: { node: string } } }>;
  limitations: string[];
}

export const recordPath = (name: string) => `${KIT}components/${name}/verification/${name}.verification.json`;
export const sha256 = (path: string) => createHash('sha256').update(readFileSync(`${KIT}${path}`)).digest('hex');
export const componentFolders = () =>
  readdirSync(`${KIT}components`, { withFileTypes: true }).filter((d) => d.isDirectory() && existsSync(`${KIT}components/${d.name}/${d.name}.manifest.json`)).map((d) => d.name).sort();

export function readRecord(name: string): VerificationRecord {
  return JSON.parse(readFileSync(recordPath(name), 'utf8'));
}

/** Problems with a record: missing file, missing sources, hashes that no longer match, no passing run. */
export function staleness(name: string): string[] {
  if (!existsSync(recordPath(name))) return [`${name}: no verification record`];
  const r = readRecord(name);
  const out: string[] = [];
  for (const s of r.sources) {
    if (!existsSync(`${KIT}${s.path}`)) out.push(`${name}: source ${s.path} is missing`);
    else if (sha256(s.path) !== s.sha256) out.push(`${name}: ${s.path} changed since the last verified run (npm run verification -- run ${name})`);
  }
  for (const [renderer, v] of Object.entries(r.renderers)) {
    if (!v.checks.length) out.push(`${name}: renderer ${renderer} declares no checks`);
    if (v.latestRun?.outcome !== 'pass') out.push(`${name}: renderer ${renderer} has no passing run`);
  }
  return out;
}

/** Run every check of a record; stamp hashes and the run only when all pass. */
export function run(name: string): boolean {
  const r = readRecord(name);
  const commands = Object.values(r.renderers).flatMap((v) => v.checks.map((c) => c.command));
  for (const command of new Set(commands)) {
    try {
      // node:test runs each file as one test, so an unmatched name pattern still "passes" the file.
      // Count passing TAP lines that are not a whole file; a check must run at least one real test.
      const tap = command.startsWith('node --test') ? command.replace('node --test', 'node --test --test-reporter=tap') : command;
      const out = execSync(tap, { cwd: KIT, stdio: 'pipe', encoding: 'utf8' });
      const passed = command.startsWith('node --test') ? (out.match(/^\s*ok \d+ - .*$/gm) ?? []).filter((l) => !/\.test\.ts\s*$/.test(l)).length : 1;
      if (!(passed > 0)) { console.error(`FAIL  ${name}: ${command}\nran no tests`); return false; }
      console.log(`pass  ${name}: ${command} (${passed} tests)`);
    } catch (e: any) {
      console.error(`FAIL  ${name}: ${command}\n${String(e.stdout ?? '').split('\n').filter((l) => /not ok|✖|Error/.test(l)).slice(0, 10).join('\n')}`);
      return false;
    }
  }
  const date = new Date().toISOString().slice(0, 10);
  for (const s of r.sources) s.sha256 = sha256(s.path);
  for (const v of Object.values(r.renderers)) v.latestRun = { date, outcome: 'pass', commands: v.checks.map((c) => c.command), environment: { node: process.version } };
  writeFileSync(recordPath(name), JSON.stringify(r, null, 2) + '\n');
  return true;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [cmd, ...args] = process.argv.slice(2);
  const names = args.includes('--all') || !args.length ? componentFolders() : args;
  if (cmd === 'check') {
    const problems = names.flatMap(staleness);
    console.log(problems.length ? problems.join('\n') : `${names.length} records current`);
    process.exit(problems.length ? 1 : 0);
  } else if (cmd === 'run') {
    if (!args.length) { console.error('run needs a component folder name or --all'); process.exit(2); }
    const ok = names.map(run).every(Boolean);
    process.exit(ok ? 0 : 1);
  } else {
    console.error('usage: verification.ts check [name…] | run <name…|--all>');
    process.exit(2);
  }
}
