// Runs the jig's check pages in Chromium, Firefox and WebKit through Playwright and fails on any
// failed check. Per engine: geometry-check.html and react-check.html ("fails": [] in each), the
// select popup's placement on both sides of the viewport (data-side and the 1u offset; Safari keeps
// a squeezed first fit, select.element.ts #measureSide), and every motion easing against the
// resolver (tokens/motion: the CSS solve, 1e-4 per sample).
//
//   npm run check:browsers                  all three engines
//   npm run check:browsers -- firefox webkit
//
// Needs the Playwright browsers once: npx playwright install chromium firefox webkit.
// Starts its own Vite server for apps/studio on a free port (after Panda codegen).
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { chromium, firefox, webkit, type BrowserType, type Page } from 'playwright';
import { createServer } from 'vite';

const studio = fileURLToPath(new URL('..', import.meta.url));
const kit = fileURLToPath(new URL('../../../packages/ui-kit/', import.meta.url));
const ENGINES: Record<string, BrowserType> = { chromium, firefox, webkit };
const names = process.argv.slice(2).filter((a) => !a.startsWith('-'));
const engines = names.length ? names : Object.keys(ENGINES);
for (const n of engines) if (!ENGINES[n]) throw new Error(`unknown engine ${n} (chromium, firefox, webkit)`);

for (const dir of [kit, studio]) execFileSync('npx', ['panda', 'codegen', '--silent'], { cwd: dir, stdio: 'inherit' });
process.chdir(studio); // the Panda PostCSS plugin finds panda.config.ts from the working directory
const server = await createServer({ root: studio, configFile: `${studio}vite.config.ts`, logLevel: 'error', server: { host: '127.0.0.1', port: 0 } });
await server.listen();
const addr = server.httpServer!.address();
const base = `http://127.0.0.1:${typeof addr === 'object' && addr ? addr.port : 0}`;

async function checkPage(page: Page, path: string): Promise<string[]> {
  await page.goto(`${base}/${path}`);
  await page.waitForFunction(() => { const t = document.getElementById('out')?.textContent; return !!t && t !== 'pending'; }, null, { timeout: 120_000 });
  const r = JSON.parse((await page.textContent('#out'))!) as { checks: number; fails: string[] };
  console.log(`  ${path}: ${r.checks} checks, ${r.fails.length} fails`);
  return r.fails;
}

// A select fixed near the top opens below its trigger; near the bottom (no room for the list) above.
async function checkSelect(page: Page): Promise<string[]> {
  const fails = await page.evaluate(async (geometryUrl) => {
    const { popupOffset } = await import(/* @vite-ignore */ geometryUrl);
    const out: string[] = [], u: number = popupOffset();
    document.getElementById('root')?.remove();
    for (const edge of ['top', 'bottom'] as const) {
      const box = document.createElement('div');
      box.style.cssText = `position: fixed; left: 40px; ${edge}: 20px; width: 220px`;
      box.innerHTML = '<ui-select label="Pick" value="b">' + ['Alpha', 'Bravo', 'Charlie', 'Delta', 'Echo'].map((o) => `<ui-option value="${o[0].toLowerCase()}">${o}</ui-option>`).join('') + '</ui-select>';
      document.body.append(box);
      await new Promise((r) => setTimeout(r, 300));
      const trigger = box.querySelector('[data-part=trigger]') as HTMLElement, popup = box.querySelector('[data-part=popup]') as HTMLElement;
      trigger.click();
      await new Promise((r) => setTimeout(r, 900));
      const t = trigger.getBoundingClientRect(), p = popup.getBoundingClientRect();
      const side = edge === 'top' ? 'bottom' : 'top', gap = side === 'bottom' ? p.top - t.bottom : t.top - p.bottom;
      if (popup.getAttribute('data-side') !== side) out.push(`select near the ${edge}: data-side ${popup.getAttribute('data-side')}, want ${side}`);
      if (Math.abs(gap - u) > 0.5) out.push(`select near the ${edge}: popup ${gap.toFixed(1)}px from the trigger, want 1u (${u}px)`);
      if (popup.scrollHeight > popup.clientHeight + 1) out.push(`select near the ${edge}: list squeezed to ${p.height.toFixed(1)}px`);
      trigger.click();
      await new Promise((r) => setTimeout(r, 600));
      box.remove();
    }
    return out;
  }, `${base}/@fs${kit}tokens/geometry/resolve.ts`);
  console.log(`  select placement: ${fails.length} fails`);
  return fails;
}

// Every spring and intent easing, as computed by the engine, against the resolver at the defaults.
async function checkMotion(page: Page): Promise<string[]> {
  const fails = await page.evaluate(async (motionUrl) => {
    const m = await import(/* @vite-ignore */ motionUrl);
    const out: string[] = [];
    const tokens: [string, string][] = [...m.SPRING_NAMES.map((s: string) => [s, s]), ...Object.entries(m.INTENTS as Record<string, string>)];
    for (const [token, spring] of tokens) {
      const d = document.createElement('div');
      d.style.transition = `opacity var(--durations-${token}) var(--easings-${token})`;
      document.body.append(d);
      const cs = getComputedStyle(d);
      const pts = [...cs.transitionTimingFunction.matchAll(/(-?[\d.e-]+) [\d.]+%/g)].map((x) => Number(x[1]));
      const want = m.RESOLVED_SPRINGS[spring];
      const ms = parseFloat(cs.transitionDuration) * 1000;
      d.remove();
      if (pts.length !== want.points.length) { out.push(`easing ${token}: ${pts.length} samples, want ${want.points.length} (${cs.transitionTimingFunction.slice(0, 60)})`); continue; }
      const worst = Math.max(...pts.map((v, i) => Math.abs(v - want.points[i])));
      if (worst > 1e-4) out.push(`easing ${token}: a sample is ${worst.toExponential(1)} off the solved spring`);
      if (Math.abs(ms - want.ms) > 1) out.push(`easing ${token}: ${ms.toFixed(1)}ms, want ${want.ms}ms`);
    }
    return out;
  }, `${base}/@fs${kit}tokens/motion/index.ts`);
  console.log(`  motion easings: ${fails.length} fails`);
  return fails;
}

let failed = 0;
try {
  for (const name of engines) {
    const browser = await ENGINES[name].launch();
    console.log(`${name} ${browser.version()}`);
    const page = await browser.newPage({ viewport: { width: 1000, height: 600 } });
    const errors: string[] = [];
    page.on('pageerror', (e) => errors.push(e.message));
    const fails = [
      ...await checkPage(page, 'geometry-check.html'),
      ...await checkMotion(page),
      ...await checkSelect(page),
      ...await checkPage(page, 'react-check.html'),
      ...errors.map((e) => `page error: ${e}`),
    ];
    for (const f of fails) console.log(`    ${f}`);
    failed += fails.length;
    await browser.close();
  }
} finally {
  await server.close();
}
console.log(failed ? `${failed} fails` : 'all engines pass');
process.exit(failed ? 1 : 0);
