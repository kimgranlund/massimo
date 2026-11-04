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
  await page.waitForFunction(() => { const t = document.getElementById('out')?.textContent; return !!t && t !== 'pending'; }, null, { timeout: 300_000 }); // WebKit needs ~2 min for the 31k geometry checks under load
  const r = JSON.parse((await page.textContent('#out'))!) as { checks: number; fails: string[] };
  console.log(`  ${path}: ${r.checks} checks, ${r.fails.length} fails`);
  return r.fails;
}

// The jig wears its own brand on its panel (data-ui-scope="massimo", public/brand/massimo.scope.css)
// while the canvas keeps the theme being tuned: the panel's buttons take the brand's crisp radius
// and its body face; the canvas's buttons keep the defaults.
async function checkStudioBrand(page: Page): Promise<string[]> {
  await page.goto(`${base}/#/components`);
  await page.waitForFunction(() => !!document.querySelector('[data-canvas] ui-button') && !!document.querySelector('aside[data-ui-scope=massimo] ui-button'), null, { timeout: 60_000 });
  await page.waitForTimeout(300);
  const r = await page.evaluate(() => {
    const cs = (sel: string) => getComputedStyle(document.querySelector(sel)!);
    return { panelRadius: parseFloat(cs('aside[data-ui-scope=massimo] ui-button').borderTopLeftRadius), canvasRadius: parseFloat(cs('[data-canvas] ui-button').borderTopLeftRadius), panelFont: cs('aside[data-ui-scope=massimo]').fontFamily, scale: cs('aside[data-ui-scope=massimo]').getPropertyValue('--ui-radius-scale').trim() };
  });
  const fails: string[] = [];
  if (r.scale !== '0.5') fails.push(`studio brand: panel radius scale ${r.scale}, want 0.5 (crisp)`);
  if (!(r.panelRadius < r.canvasRadius)) fails.push(`studio brand: panel button radius ${r.panelRadius} should be crisper than the canvas's ${r.canvasRadius}`);
  if (!/^"?Inter"?,/.test(r.panelFont)) fails.push(`studio brand: panel face ${r.panelFont}, want Inter`);
  // A role's panel swatch shows the theme being tuned, not the brand the panel wears: Massimo anchors the
  // amber ramp to its signal orange, which a --colors-spectrum-* variable inside the panel would show.
  const panelTab = page.locator('aside[data-ui-scope=massimo] ui-option', { hasText: 'Colors' }).first();
  await panelTab.click();
  await page.waitForFunction(() => { const c = ([...document.querySelectorAll('aside ui-field')].find((f) => f.textContent?.trim().startsWith('Secondary'))?.querySelector('ui-swatch') as (Element & { color?: string }) | null | undefined)?.color; return !!c && c !== 'transparent'; }, null, { timeout: 30_000 });
  const sw = await page.evaluate(() => {
    const row = [...document.querySelectorAll('aside ui-field')].find((f) => f.textContent?.trim().startsWith('Secondary'));
    const el = row?.querySelector('ui-swatch') as (Element & { color?: string }) | null | undefined;
    const probe = document.createElement('i');
    document.querySelector('[data-canvas]')!.append(probe);
    probe.style.color = 'var(--colors-spectrum-amber-9)';
    const canvas = getComputedStyle(probe).color;
    const raw = el?.color ?? '';
    probe.style.color = raw;
    const swatch = getComputedStyle(probe).color;
    probe.remove();
    return { found: !!el, canvas, swatch, raw };
  });
  if (!sw.found) fails.push('studio brand: no secondary role swatch in the panel');
  else if (sw.raw.includes('var(')) fails.push(`studio brand: secondary swatch reads a variable (${sw.raw}), which the panel's brand recolors`);
  else if (sw.swatch !== sw.canvas) fails.push(`studio brand: secondary swatch ${sw.swatch} differs from the canvas ramp ${sw.canvas}`);
  console.log(`  studio brand: ${fails.length} fails`);
  return fails;
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
      ...await checkPage(page, 'scope-check.html'),
      ...await checkPage(page, 'brand-demo.html'),
      ...await checkStudioBrand(page),
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
