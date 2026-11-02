import { tick } from './setup.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
const { sanitizeSvg, registerIconSet, startIcons, stopIcons, iconSetFor, moduleSet, BUILTIN_SETS } = await import('../icons/index.ts');
const { validateTheme } = await import('../tokens/themes/index.ts');

const settle = async () => { for (let i = 0; i < 5; i++) await tick(); };
const svg = (id: string) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24"><path id="${id}" d="M0 0h24v24H0z"/></svg>`;

test('sanitizeSvg keeps drawing markup and strips anything executable', () => {
  const out = sanitizeSvg(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" onload="alert(1)" width="24">
    <script>alert(1)</script><foreignObject><div>x</div></foreignObject><use href="https://evil/x.svg#a"/>
    <path d="M1 1" fill="url(https://evil/x)" stroke="url(#ok)" onclick="alert(1)"/></svg>`)!;
  assert.ok(out);
  assert.equal(out.getAttribute('onload'), null);
  assert.equal(out.getAttribute('width'), null, 'size comes from CSS');
  assert.equal(out.getAttribute('aria-hidden'), 'true');
  assert.equal(out.querySelector('script, foreignObject, use'), null);
  const path = out.querySelector('path')!;
  assert.equal(path.getAttribute('onclick'), null);
  assert.equal(path.getAttribute('fill'), null, 'external url() removed');
  assert.equal(path.getAttribute('stroke'), 'url(#ok)', 'local reference kept');
  assert.equal(sanitizeSvg('<div>not svg</div>'), null);
});

test('<i name> renders from the active set, follows data-icons and aliases', async () => {
  const calls: string[] = [];
  registerIconSet('test-a', { load: async (n) => { calls.push(`a:${n}`); return svg(`a-${n}`); } });
  registerIconSet('test-b', { load: async (n) => { calls.push(`b:${n}`); return svg(`b-${n}`); }, aliases: { star: 'star-outline' } });
  startIcons();
  const wrap = document.createElement('div');
  wrap.setAttribute('data-icons', 'test-a');
  wrap.innerHTML = '<i name="star"></i><i name="star" aria-label="Favourite"></i>';
  document.body.append(wrap);
  await settle();
  const [deco, named] = wrap.querySelectorAll('i');
  assert.equal(deco.querySelector('path')!.id, 'a-star');
  assert.equal(deco.getAttribute('aria-hidden'), 'true');
  assert.equal(named.getAttribute('role'), 'img');
  assert.equal(calls.filter((c) => c === 'a:star').length, 1, 'cached per set and name');

  wrap.setAttribute('data-icons', 'test-b');
  await settle();
  assert.equal(deco.querySelector('path')!.id, 'b-star-outline', 'alias applied after set switch');

  deco.setAttribute('name', 'heart');
  await settle();
  assert.equal(deco.querySelector('path')!.id, 'b-heart');
  wrap.remove();
});

test('system glyphs stay on Phosphor under any theme set; content icons follow the theme', async () => {
  const wrap = document.createElement('div');
  wrap.setAttribute('data-icons', 'lucide');
  wrap.innerHTML = '<i name="plus"></i><i name="caret-down"></i><i name="star"></i><i name="plus" data-icons="lucide"></i>';
  document.body.append(wrap);
  const [plus, caret, star, forced] = wrap.querySelectorAll('i');
  assert.equal(iconSetFor(plus), 'phosphor');
  assert.equal(iconSetFor(caret), 'phosphor');
  assert.equal(iconSetFor(star), 'lucide', 'content icon follows the scope');
  assert.equal(iconSetFor(forced), 'lucide', 'data-icons on the icon itself wins');
  wrap.remove();
});

test('missing icons are marked; theme selects the set; unknown data-icons falls back', async () => {
  registerIconSet('test-fail', { load: async () => { throw new Error('404'); } });
  const i = document.createElement('i');
  i.setAttribute('name', 'nope');
  const wrap = document.createElement('div');
  wrap.setAttribute('data-icons', 'test-fail');
  wrap.append(i);
  document.body.append(wrap);
  const warn = console.warn; console.warn = () => {};
  await settle();
  console.warn = warn;
  assert.ok(i.hasAttribute('data-icon-missing'));
  assert.equal(i.children.length, 0);

  const loose = document.createElement('i');
  loose.setAttribute('data-icons', 'does-not-exist');
  assert.equal(iconSetFor(loose), 'phosphor', 'unregistered set falls back to the default');
  wrap.remove();
  stopIcons();
});

test('moduleSet maps file names to lazy loaders; themes validate icons', async () => {
  const set = moduleSet({ '/x/assets/regular/plus.svg': async () => svg('plus') });
  assert.match(await set.load('plus'), /id="plus"/);
  await assert.rejects(set.load('minus'));
  assert.deepEqual(Object.keys(BUILTIN_SETS), ['phosphor', 'lucide', 'tabler']);
  assert.equal(validateTheme('t', { icons: 'lucide' }).ok, true);
  assert.equal(validateTheme('t', { icons: '<script>' }).ok, false);
  assert.equal(validateTheme('t', { icons: 3 }).ok, false);
});

test('phosphor set loads the bold and fill weights from their folders (check-bold → assets/bold)', async () => {
  const { BUILTIN_SETS: sets, SYSTEM_GLYPHS: system } = await import('../icons/sets.ts');
  const seen: string[] = [];
  const g = globalThis as any, prev = g.fetch;
  g.fetch = async (u: string) => { seen.push(String(u)); return new Response('<svg/>', { status: 200 }); };
  try { for (const n of ['check', 'check-bold', 'heart-fill']) await sets.phosphor.load(n); } finally { g.fetch = prev; }
  assert.deepEqual(seen.map((u) => u.split('/assets/')[1]), ['regular/check.svg', 'bold/check-bold.svg', 'fill/heart-fill.svg']);
  assert.ok(system.has('check-bold') && system.has('minus-bold'), 'checkbox marks are system glyphs');
});
