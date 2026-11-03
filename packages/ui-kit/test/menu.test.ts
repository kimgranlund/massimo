// Menus (menu, context menu, menubar): web component behavior in happy-dom, React server markup and
// client behavior, the same data-* state on both renderers (contracts/states.json), Base UI event
// details, and the composed parts against the presets.
import { tick } from './setup.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createElement as h, type ReactElement, type ReactNode } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadTsx } from './load-tsx.ts';
import { menuNavigate, menuItems, inTriangle, aimsAtSubmenu } from '../dom/index.ts';

await import('../components/menu/menu.element.ts');
await import('../components/context-menu/context-menu.element.ts');
await import('../components/menubar/menubar.element.ts');
const { Menu } = await loadTsx(new URL('../components/menu/menu.react.tsx', import.meta.url));
const { ContextMenu } = await loadTsx(new URL('../components/context-menu/context-menu.react.tsx', import.meta.url));
const { Menubar } = await loadTsx(new URL('../components/menubar/menubar.react.tsx', import.meta.url));

const NATIVE = 'input, button, select, textarea, label, fieldset, legend, option, optgroup, output, datalist, meter, progress, form';
const contract = JSON.parse(readFileSync(new URL('../contracts/states.json', import.meta.url), 'utf8'));
const STATE = new Set(Object.keys(contract.attributes));
const STRUCTURE = new Set(['data-ui', 'data-part', 'data-size', 'data-index']);
const names = (el: Element | null | undefined) => [...(el?.attributes ?? [])].map((a) => a.name).filter((n) => n.startsWith('data-') && !STRUCTURE.has(n)).sort();
const html = (el: ReactNode) => renderToStaticMarkup(el as any).replace(/_R_[a-z0-9]+_/gi, 'ID');
const key = (el: Element, k: string, o: KeyboardEventInit = {}) => el.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true, ...o }));
/** Recipe classes on an element (variant classes left out). */
const kit = (el: Element | null) => [...(el?.classList ?? [])].filter((c) => c.startsWith('ui-') && !c.includes('--')).join(' ');

async function wc<T extends HTMLElement = any>(markup: string): Promise<T> {
  const box = document.createElement('div');
  box.innerHTML = markup;
  document.body.append(box);
  await tick(); await tick();
  return box.firstElementChild as T;
}
function ssr(el: ReactElement) {
  const box = document.createElement('div');
  box.innerHTML = renderToStaticMarkup(el);
  return box.querySelector('[data-ui]') as HTMLElement;
}
type Part = [string, string, string?];
/** Same data-* on host and parts in both renderers; each name is in the contract for that element and part. */
async function same(tag: string, markup: string, el: ReactElement, parts: Part[]) {
  const a = await wc(markup), b = ssr(el);
  const allowed = contract.components[tag];
  assert.ok(allowed, `${tag} is in contracts/states.json components`);
  for (const [label, s, rs] of parts) {
    const ea = [...(s === ':scope' ? [a] : a.querySelectorAll(s))], eb = [...((rs ?? s) === ':scope' ? [b] : b.querySelectorAll(rs ?? s))];
    assert.equal(ea.length, eb.length, `${tag} ${label}: same count`);
    ea.forEach((x, k) => {
      assert.deepEqual(names(x), names(eb[k]), `${tag} ${label}[${k}]: web component vs React`);
      for (const n of names(x)) {
        assert.ok(STATE.has(n), `${tag} ${label}: ${n} is defined in the contract`);
        assert.ok((allowed[label] ?? []).includes(n), `${tag} ${label}: ${n} is listed for it`);
      }
    });
  }
  a.parentElement!.remove();
}

const MENU = `<ui-menu><div data-part="trigger">Edit</div><div data-part="popup">
  <div data-part="item">Cut<span slot="suffix">⌘X</span></div>
  <div data-part="item" disabled>Copy</div>
  <div data-part="item">Paste</div>
  <div data-part="separator"></div>
  <div data-part="checkbox-item" checked>Grid</div>
  <div data-part="group"><div data-part="group-label">Sort</div>
    <div data-part="radio-group" value="name"><div data-part="radio-item" value="name">Name</div><div data-part="radio-item" value="date">Date</div></div></div>
  <ui-menu><div data-part="submenu-trigger">Share</div><div data-part="popup"><div data-part="item">Email</div><div data-part="item">Link</div></div></ui-menu>
</div></ui-menu>`;

// ── Headless ──

test('menu (dom): navigation wraps and skips disabled items; items of a nested popup are its own', () => {
  const items = [{ value: '', label: 'a' }, { value: '', label: 'b', disabled: true }, { value: '', label: 'c' }];
  assert.equal(menuNavigate(items, 0, 'ArrowDown'), 2);
  assert.equal(menuNavigate(items, 2, 'ArrowDown'), 0, 'wraps to the first');
  assert.equal(menuNavigate(items, 0, 'ArrowUp'), 2, 'wraps to the last');
  assert.equal(menuNavigate(items, 2, 'ArrowDown', { loop: false }), 2);
  assert.equal(menuNavigate(items, 0, 'ArrowRight', { horizontal: true }), 2);
  assert.equal(menuNavigate(items, 0, 'ArrowLeft', { horizontal: true, rtl: true }), 2);
  const box = document.createElement('div');
  box.innerHTML = '<div data-part="popup"><div data-part="item">a</div><div><div data-part="submenu-trigger">s</div><div data-part="popup"><div data-part="item">x</div></div></div></div>';
  assert.deepEqual(menuItems(box.firstElementChild).map((e) => e.textContent), ['a', 's']);
});

// ── Web component ──

test('menu: anatomy, roles, ids, recipe classes and no native form elements', async () => {
  const el = await wc(MENU) as any;
  const t = el.trigger as HTMLElement, p = el.popup as HTMLElement;
  assert.equal(t.getAttribute('role'), 'button');
  assert.equal(t.getAttribute('aria-haspopup'), 'menu');
  assert.equal(t.getAttribute('aria-expanded'), 'false');
  assert.equal(t.getAttribute('aria-controls'), p.id);
  assert.equal(t.getAttribute('tabindex'), '0');
  assert.equal(p.getAttribute('role'), 'menu');
  assert.equal(p.getAttribute('popover'), 'manual');
  assert.equal(p.getAttribute('aria-labelledby'), t.id);
  assert.deepEqual(names(p), ['data-closed']);
  assert.deepEqual(el.items.map((i: Element) => i.getAttribute('role')), ['menuitem', 'menuitem', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'menuitemradio', 'menuitem']);
  const [cut, copy, , grid, byName, byDate, share] = el.items as HTMLElement[];
  assert.equal(cut.getAttribute('tabindex'), '-1');
  assert.deepEqual(names(copy), ['data-disabled']);
  assert.equal(copy.getAttribute('aria-disabled'), 'true');
  assert.deepEqual(names(grid), ['data-checked']);
  assert.equal(grid.getAttribute('aria-checked'), 'true');
  assert.deepEqual(names(byName), ['data-checked']);
  assert.deepEqual(names(byDate), ['data-unchecked']);
  assert.equal(share.getAttribute('aria-haspopup'), 'menu');
  assert.equal(share.getAttribute('aria-expanded'), 'false');
  assert.equal(share.querySelector('[data-part=trailing] i')!.getAttribute('name'), 'caret-right');
  assert.deepEqual(names(grid.querySelector('[data-part=indicator]')), ['data-checked']);
  assert.equal(grid.querySelector('[data-part=leading] > [data-part=indicator] > i')!.getAttribute('name'), 'check');
  assert.equal(p.querySelector('[data-part=separator]')!.getAttribute('role'), 'separator');
  const group = p.querySelector('[data-part=group]')!;
  assert.equal(group.getAttribute('role'), 'group');
  assert.equal(group.getAttribute('aria-labelledby'), group.querySelector('[data-part=group-label]')!.id);
  assert.equal(kit(el), 'ui-menu__root');
  assert.equal(kit(t), 'ui-menu__trigger');
  assert.equal(kit(p), 'ui-menu__popup');
  assert.ok(p.classList.contains('ui-menu__popup--placement_anchor'));
  assert.equal(kit(cut), 'ui-menu__item');
  assert.equal(kit(cut.querySelector('[data-part=suffix]')), 'ui-menu__suffix');
  assert.equal(kit(grid), 'ui-menu__item ui-menu__checkbox-item');
  assert.equal(kit(share), 'ui-menu__item ui-menu__submenu-trigger');
  assert.ok(share.closest('[data-part=popup] ui-menu')!.querySelector('[data-part=popup]')!.classList.contains('ui-menu__popup--placement_submenu'));
  assert.equal(el.querySelector(NATIVE), null, 'no native form elements');
  el.parentElement.remove();
});

test('menu: the preset builds the trigger (label, caret) and the popup from the children', async () => {
  const el = await wc('<ui-menu label="Actions"><div data-part="item">One</div><div data-part="item">Two</div></ui-menu>') as any;
  assert.equal(el.children.length, 2);
  assert.equal(el.trigger.querySelector('[data-part=contents]').textContent, 'Actions');
  assert.equal(el.trigger.querySelector('[data-part=trailing] i').getAttribute('name'), 'caret-down');
  assert.deepEqual(el.items.map((i: Element) => i.textContent), ['One', 'Two']);
  el.parentElement.remove();
});

test('menu: a press opens and closes with openchange { open, reason, event }; cancelable; open is silent', async () => {
  const el = await wc(MENU) as any, got: any[] = [];
  el.addEventListener('openchange', (e: CustomEvent) => { if (e.target === el) got.push(e.detail); });
  el.trigger.click(); await tick();
  assert.equal(el.open, true);
  assert.equal(el.trigger.getAttribute('aria-expanded'), 'true');
  assert.deepEqual(names(el.trigger), ['data-popup-open', 'data-pressed']);
  assert.deepEqual(names(el.popup), ['data-align', 'data-open', 'data-side']);
  assert.deepEqual(Object.keys(got[0]).sort(), ['event', 'open', 'reason']);
  assert.deepEqual([got[0].open, got[0].reason], [true, 'trigger-press']);
  assert.ok(got[0].event instanceof Event);
  el.trigger.click(); await tick();
  assert.equal(el.open, false);
  const stop = (e: Event) => e.preventDefault();
  el.addEventListener('openchange', stop);
  el.trigger.click(); await tick();
  assert.equal(el.open, false, 'preventDefault keeps it closed');
  el.removeEventListener('openchange', stop);
  const n = got.length;
  el.open = true; await tick();
  assert.equal(got.length, n, 'setting open fires nothing');
  assert.deepEqual(names(el.popup), ['data-align', 'data-open', 'data-side']);
  el.parentElement.remove();
});

test('menu: keys open on the first or last item; arrows wrap and skip disabled; typeahead; Escape returns focus', async () => {
  const el = await wc(MENU) as any;
  const t = el.trigger as HTMLElement, reasons: string[] = [];
  el.addEventListener('openchange', (e: CustomEvent) => { if (e.target === el) reasons.push(e.detail.reason); });
  t.focus();
  key(t, 'ArrowDown'); await tick(); await tick();
  const [cut, , paste, grid, , , share] = el.items as HTMLElement[];
  assert.equal(document.activeElement, cut, 'ArrowDown opens on the first item');
  assert.deepEqual(names(cut), ['data-highlighted']);
  key(cut, 'ArrowDown'); await tick();
  assert.equal(document.activeElement, paste, 'skips the disabled item');
  assert.deepEqual(names(cut), []);
  key(paste, 'End'); await tick();
  assert.equal(document.activeElement, share);
  key(share, 'ArrowDown'); await tick();
  assert.equal(document.activeElement, cut, 'wraps');
  key(cut, 'g'); await tick();
  assert.equal(document.activeElement, grid, 'typeahead');
  key(grid, 'Escape'); await tick(); await tick();
  assert.equal(el.open, false);
  assert.equal(document.activeElement, t, 'focus returns to the trigger');
  key(t, 'ArrowUp'); await tick(); await tick();
  assert.equal(document.activeElement, share, 'ArrowUp opens on the last item');
  key(share, 'Tab'); document.body.focus();
  assert.deepEqual(reasons.slice(0, 3), ['list-navigation', 'escape-key', 'list-navigation']);
  el.parentElement.remove();
});

test('menu: an item press fires click and closes (item-press); checkbox and radio items change and stay open', async () => {
  const el = await wc(MENU) as any, reasons: string[] = [], changes: any[] = [];
  el.addEventListener('openchange', (e: CustomEvent) => { if (e.target === el) reasons.push(e.detail.reason); });
  el.addEventListener('change', (e: CustomEvent) => changes.push([(e.target as Element).getAttribute('data-part'), e.detail]));
  const [cut, copy, , grid, , byDate] = el.items as HTMLElement[];
  let clicks = 0;
  cut.addEventListener('click', () => clicks++);
  el.trigger.click(); await tick();
  copy.click(); await tick();
  assert.equal(el.open, true, 'a disabled item does nothing');
  grid.click(); await tick();
  assert.equal(el.open, true, 'a checkbox item keeps the menu open');
  assert.ok(!grid.hasAttribute('checked'));
  assert.deepEqual(names(grid), ['data-unchecked']);
  assert.equal(grid.getAttribute('aria-checked'), 'false');
  assert.deepEqual(changes[0][0], 'checkbox-item');
  assert.deepEqual([changes[0][1].checked, changes[0][1].reason], [false, 'item-press']);
  byDate.click(); await tick();
  assert.equal(el.popup.querySelector('[data-part=radio-group]').getAttribute('value'), 'date');
  assert.deepEqual(names(byDate), ['data-checked']);
  assert.deepEqual([changes[1][0], changes[1][1].value, changes[1][1].reason], ['radio-group', 'date', 'item-press']);
  // A prevented change keeps the item as it is.
  const stop = (e: Event) => e.preventDefault();
  el.addEventListener('change', stop);
  grid.click(); await tick();
  assert.ok(!grid.hasAttribute('checked'));
  el.removeEventListener('change', stop);
  grid.setAttribute('close-on-click', '');
  grid.click(); await tick();
  assert.equal(el.open, false, 'close-on-click closes a checkbox item');
  el.trigger.click(); await tick();
  cut.click(); await tick();
  assert.equal(clicks, 1);
  assert.equal(el.open, false);
  assert.deepEqual(reasons, ['trigger-press', 'item-press', 'trigger-press', 'item-press']);
  el.parentElement.remove();
});

test('submenu safe triangle: inTriangle, aimsAtSubmenu', () => {
  assert.ok(inTriangle({ x: 1, y: 1 }, { x: 0, y: 0 }, { x: 4, y: 0 }, { x: 0, y: 4 }));
  assert.ok(!inTriangle({ x: 3, y: 3 }, { x: 0, y: 0 }, { x: 4, y: 0 }, { x: 0, y: 4 }));
  const sub = { left: 200, right: 300, top: 0, bottom: 100 };
  assert.ok(aimsAtSubmenu({ x: 100, y: 50 }, { x: 110, y: 54 }, sub), 'diagonally toward the submenu');
  assert.ok(!aimsAtSubmenu({ x: 100, y: 50 }, { x: 100, y: 60 }, sub), 'straight down is not');
  assert.ok(!aimsAtSubmenu({ x: 100, y: 50 }, { x: 90, y: 50 }, sub), 'away is not');
  assert.ok(aimsAtSubmenu({ x: 400, y: 50 }, { x: 390, y: 46 }, sub), 'a submenu on the left (RTL, flipped)');
  assert.ok(!aimsAtSubmenu({ x: 100, y: 50 }, { x: 100, y: 50 }, sub), 'no movement is not');
  assert.ok(!aimsAtSubmenu({ x: 100, y: 50 }, { x: 110, y: 50 }, { left: 0, right: 0, top: 0, bottom: 0 }), 'an unlaid submenu is not');
});

test('menu: crossing a sibling toward an open submenu keeps it open until the pointer rests (safe triangle)', async () => {
  const el = await wc(MENU) as any;
  el.trigger.focus();
  key(el.trigger, 'ArrowUp'); await tick(); await tick();
  const share = el.items.at(-1) as HTMLElement, sub = share.parentElement as any, sibling = el.items.at(-2) as HTMLElement;
  key(share, 'ArrowRight'); await tick(); await tick();
  assert.equal(sub.open, true);
  sub.popup.getBoundingClientRect = () => ({ left: 200, right: 300, top: 0, bottom: 100 });
  const move = (t: Element, x: number, y: number) => t.dispatchEvent(new PointerEvent('pointermove', { clientX: x, clientY: y, bubbles: true }));
  move(share, 100, 50);
  move(sibling, 110, 55);
  assert.equal(sub.open, true, 'aiming at the submenu across a sibling keeps it open');
  assert.notEqual(el.querySelector('[data-highlighted]'), sibling);
  await new Promise((r) => setTimeout(r, 350));
  assert.equal(sub.open, false, 'resting on the sibling closes it');
  assert.ok(sibling.hasAttribute('data-highlighted'));
  // Moving away from the submenu closes it at once.
  share.click(); await tick(); await tick();
  assert.equal(sub.open, true);
  move(share, 100, 50);
  move(sibling, 95, 60);
  assert.equal(sub.open, false);
  el.parentElement!.remove();
});

test('Menu (React): crossing a sibling toward an open submenu keeps it open until the pointer rests', async () => {
  const { createRoot } = await import('react-dom/client');
  const { act } = await import('react');
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  const box = document.createElement('div');
  document.body.append(box);
  const root = createRoot(box);
  const M = Menu;
  await act(async () => root.render(h(M.Root, { defaultOpen: true }, h(M.Trigger, null, 'Edit'), h(M.Positioner, null, h(M.Popup, null,
    h(M.Item, null, 'Copy'),
    h(M.SubmenuRoot, { defaultOpen: true }, h(M.SubmenuTrigger, null, 'Share'), h(M.Positioner, null, h(M.Popup, null, h(M.Item, null, 'Email')))))))));
  const share = box.querySelector<HTMLElement>('[data-part=submenu-trigger]')!;
  const copy = box.querySelector<HTMLElement>('[data-part=item]')!;
  const subPopup = () => box.querySelectorAll<HTMLElement>('[data-part=popup]')[1];
  const isOpen = () => share.getAttribute('aria-expanded') === 'true';
  assert.ok(isOpen());
  subPopup().getBoundingClientRect = () => ({ left: 200, right: 300, top: 0, bottom: 100 }) as DOMRect;
  const move = (t: Element, x: number, y: number) => act(async () => { t.dispatchEvent(new PointerEvent('pointermove', { clientX: x, clientY: y, bubbles: true })); });
  await move(share, 100, 50);
  await move(copy, 110, 55);
  assert.ok(isOpen(), 'aiming at the submenu across a sibling keeps it open');
  await act(async () => { await new Promise((r) => setTimeout(r, 350)); });
  assert.ok(!isOpen(), 'resting on the sibling closes it');
  assert.ok(copy.hasAttribute('data-highlighted'));
  await act(async () => root.unmount());
  box.remove();
});

test('menu: a submenu opens on ArrowRight (first item), closes on ArrowLeft back to its trigger; RTL swaps them', async () => {
  const el = await wc(MENU) as any;
  el.trigger.focus();
  key(el.trigger, 'ArrowUp'); await tick(); await tick();
  const share = el.items.at(-1) as HTMLElement, sub = share.parentElement as any;
  assert.equal(document.activeElement, share);
  key(share, 'ArrowRight'); await tick(); await tick();
  assert.equal(sub.open, true);
  assert.deepEqual(names(share), ['data-highlighted', 'data-popup-open']);
  assert.equal(share.getAttribute('aria-expanded'), 'true');
  assert.equal(document.activeElement, sub.items[0]);
  assert.deepEqual(names(sub.popup), ['data-align', 'data-open', 'data-side']);
  assert.equal(sub.popup.getAttribute('data-side'), 'right');
  key(sub.items[0], 'ArrowDown'); await tick();
  assert.equal(document.activeElement, sub.items[1]);
  key(sub.items[1], 'ArrowLeft'); await tick(); await tick();
  assert.equal(sub.open, false);
  assert.equal(el.open, true, 'the parent stays open');
  assert.equal(document.activeElement, share);
  // Enter opens it too; an item press in the submenu closes the whole tree.
  key(share, 'Enter'); await tick(); await tick();
  assert.equal(sub.open, true);
  sub.items[0].click(); await tick();
  assert.equal(sub.open, false);
  assert.equal(el.open, false);
  el.parentElement.remove();
  const rtl = await wc(`<div dir="rtl">${MENU}</div>`) as any;
  const m = rtl.querySelector('ui-menu') as any;
  m.trigger.focus();
  key(m.trigger, 'ArrowUp'); await tick(); await tick();
  const s = m.items.at(-1).parentElement as any;
  key(m.items.at(-1), 'ArrowRight'); await tick();
  assert.equal(s.open, false, 'ArrowRight does not open in RTL');
  key(m.items.at(-1), 'ArrowLeft'); await tick(); await tick();
  assert.equal(s.open, true, 'ArrowLeft opens in RTL');
  rtl.parentElement.remove();
});

test('menu: disabled, default-open and the pointer highlight', async () => {
  const off = await wc('<ui-menu label="A" disabled><div data-part="item">x</div></ui-menu>') as any;
  off.trigger.click(); await tick();
  assert.equal(off.open, false);
  assert.deepEqual(names(off.trigger), ['data-disabled']);
  assert.equal(off.trigger.getAttribute('tabindex'), '-1');
  off.parentElement.remove();
  const d = await wc('<ui-menu label="A" default-open><div data-part="item">x</div><div data-part="item">y</div></ui-menu>') as any;
  assert.equal(d.open, true);
  assert.notEqual(document.activeElement, d.items[0], 'markup-opened menus leave focus alone');
  d.items[1].dispatchEvent(new PointerEvent('pointermove', { bubbles: true }));
  await tick();
  assert.equal(document.activeElement, d.items[1]);
  assert.deepEqual(names(d.items[1]), ['data-highlighted']);
  d.parentElement.remove();
});

test('menu: a ui-menu built on its own and then moved into a popup becomes a submenu (its trigger an item with a caret)', async () => {
  const sub = await wc('<ui-menu><div data-part="trigger">Share</div><div data-part="popup"><div data-part="item">Email</div></div></ui-menu>') as any;
  assert.equal(sub.trigger.getAttribute('data-part'), 'trigger');
  const parent = await wc('<ui-menu label="File"><div data-part="item">New</div></ui-menu>') as any;
  parent.popup.append(sub);
  await tick(); await tick();
  assert.equal(sub.trigger.getAttribute('data-part'), 'submenu-trigger');
  assert.equal(sub.trigger.getAttribute('role'), 'menuitem');
  assert.equal(sub.trigger.querySelector('[data-part=trailing] i')!.getAttribute('name'), 'caret-right');
  assert.deepEqual(parent.items.map((i: Element) => i.getAttribute('data-part')), ['item', 'submenu-trigger']);
  parent.parentElement.remove();
});

// ── React ──

const M = Menu as any;
const reactMenu = (p: Record<string, unknown> = {}) => h(M.Root, p,
  h(M.Trigger, null, 'Edit'),
  h(M.Positioner, null, h(M.Popup, null,
    h(M.Item, { suffix: '⌘X' }, 'Cut'),
    h(M.Item, { disabled: true }, 'Copy'),
    h(M.Item, null, 'Paste'),
    h(M.Separator),
    h(M.CheckboxItem, { defaultChecked: true }, 'Grid'),
    h(M.Group, null, h(M.GroupLabel, null, 'Sort'),
      h(M.RadioGroup, { defaultValue: 'name' }, h(M.RadioItem, { value: 'name' }, 'Name'), h(M.RadioItem, { value: 'date' }, 'Date'))),
    h(M.SubmenuRoot, null, h(M.SubmenuTrigger, null, 'Share'), h(M.Positioner, null, h(M.Popup, null, h(M.Item, null, 'Email'), h(M.Item, null, 'Link')))))));

const MENU_PARTS: Part[] = [
  ['host', ':scope'], ['trigger', ':scope > [data-part=trigger]'], ['popup', '[data-part=popup]'],
  ['item', '[data-part=item]'], ['checkbox-item', '[data-part=checkbox-item]'], ['radio-item', '[data-part=radio-item]'],
  ['indicator', '[data-part=indicator]'], ['submenu-trigger', '[data-part=submenu-trigger]'], ['separator', '[data-part=separator]'],
  ['group', '[data-part=group]'], ['group-label', '[data-part=group-label]'], ['radio-group', '[data-part=radio-group]'],
];

test('Menu (React): the same data-* as ui-menu on host, trigger, popup and every item kind', async () => {
  await same('ui-menu', MENU, reactMenu(), MENU_PARTS);
  await same('ui-menu', '<ui-menu label="A" disabled><div data-part="item">x</div></ui-menu>', h(Menu, { label: 'A', disabled: true }, h(M.Item, null, 'x')), [['host', ':scope'], ['trigger', ':scope > [data-part=trigger]'], ['popup', '[data-part=popup]'], ['item', '[data-part=item]']]);
});

test('Menu (React): native trigger button, roles and classes; the preset renders the composed parts; className and render get the state', () => {
  const a = html(reactMenu());
  assert.match(a, /^<div data-ui="menu" class="ui-menu__root ui-menu__root--placement_anchor">/);
  assert.match(a, /<button type="button" data-part="trigger" id="ID\w*" role="button" aria-haspopup="menu" aria-expanded="false" aria-controls="ID\w*" class="ui-menu__trigger/);
  assert.match(a, /<div data-part="popup" popover="manual" id="ID\w*" role="menu" tabindex="-1" aria-labelledby="ID\w*" data-closed="" class="ui-menu__popup/);
  assert.match(a, /<div data-part="checkbox-item" role="menuitemcheckbox" tabindex="-1" aria-checked="true" data-checked="" class="ui-menu__item [^"]*ui-menu__checkbox-item/);
  assert.match(a, /<div data-part="submenu-trigger" id="ID\w*" role="menuitem" tabindex="-1" aria-haspopup="menu" aria-expanded="false"/);
  assert.match(a, /<i name="caret-right"><\/i>/);
  assert.equal(new RegExp(NATIVE.split(', ').filter((t) => t !== 'button').map((t) => `<${t}[ >]`).join('|')).test(a), false, 'no native form elements beyond the trigger button');
  const preset = html(h(Menu, { label: 'Edit' }, h(M.Item, null, 'Cut')));
  const parts = html(h(M.Root, null, h(M.Trigger, { trailing: h('i', { name: 'caret-down' }) }, 'Edit'), h(M.Positioner, null, h(M.Popup, null, h(M.Item, null, 'Cut')))));
  assert.equal(preset, parts, 'composed = preset');
  const fn = html(h(M.Root, null, h(M.Trigger, { className: (s: any) => (s.disabled ? 'off' : 'on') }, 'A'), h(M.Popup, null, h(M.Item, { render: (p: any, s: any) => h('a', { ...p, href: '#', 'data-s': String(!!s.highlighted) }) }, 'x'))));
  assert.match(fn, /class="ui-menu__trigger[^"]* on"/);
  assert.match(fn, /<a data-part="item" role="menuitem"[^>]* href="#" data-s="false">/);
});

test('Menu (React): presses, keys and items call onOpenChange / onCheckedChange / onValueChange with Base UI details', async () => {
  const { createRoot } = await import('react-dom/client');
  const { act } = await import('react');
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  const box = document.createElement('div');
  document.body.append(box);
  const root = createRoot(box);
  const calls: any[] = [];
  const log = (k: string) => (v: unknown, d: any) => calls.push([k, v, d.reason]);
  await act(async () => root.render(h(M.Root, { onOpenChange: log('open') },
    h(M.Trigger, null, 'Edit'),
    h(M.Popup, null,
      h(M.Item, null, 'Cut'), h(M.Item, { disabled: true }, 'Copy'),
      h(M.CheckboxItem, { onCheckedChange: log('checked') }, 'Grid'),
      h(M.RadioGroup, { defaultValue: 'a', onValueChange: log('value') }, h(M.RadioItem, { value: 'a' }, 'A'), h(M.RadioItem, { value: 'b' }, 'B'))))));
  const t = box.querySelector('[data-part=trigger]') as HTMLElement;
  const items = () => [...box.querySelectorAll<HTMLElement>('[role^=menuitem]')];
  await act(async () => { t.click(); });
  assert.equal(t.getAttribute('aria-expanded'), 'true');
  assert.deepEqual(names(t), ['data-popup-open', 'data-pressed']);
  await act(async () => { items()[2].click(); });
  assert.equal(items()[2].getAttribute('aria-checked'), 'true');
  await act(async () => { items()[4].click(); });
  assert.deepEqual(names(items()[4]), ['data-checked']);
  assert.equal(t.getAttribute('aria-expanded'), 'true', 'checkable items keep it open');
  await act(async () => { items()[0].click(); });
  assert.equal(t.getAttribute('aria-expanded'), 'false');
  await act(async () => { t.focus(); key(t, 'ArrowDown'); });
  assert.equal(document.activeElement, items()[0]);
  assert.deepEqual(names(items()[0]), ['data-highlighted']);
  await act(async () => { key(items()[0], 'ArrowDown'); });
  assert.equal(document.activeElement, items()[2], 'skips the disabled item');
  await act(async () => { key(items()[2], 'Escape'); });
  assert.equal(t.getAttribute('aria-expanded'), 'false');
  assert.equal(document.activeElement, t);
  assert.deepEqual(calls, [
    ['open', true, 'trigger-press'], ['checked', true, 'item-press'], ['value', 'b', 'item-press'], ['open', false, 'item-press'],
    ['open', true, 'list-navigation'], ['open', false, 'escape-key'],
  ]);
  await act(async () => root.unmount());
  box.remove();
});

// ── Context menu ──

const CTX = '<ui-context-menu><div data-part="trigger" tabindex="0">Canvas</div><div data-part="item">Copy</div><div data-part="item">Paste</div><ui-menu><div data-part="submenu-trigger">Arrange</div><div data-part="popup"><div data-part="item">Front</div></div></ui-menu></ui-context-menu>';

test('context menu: the area is the trigger (no role); contextmenu opens the popup at the pointer (trigger-press); the native menu is prevented', async () => {
  const el = await wc(CTX) as any, got: any[] = [];
  el.addEventListener('openchange', (e: CustomEvent) => { if (e.target === el) got.push(e.detail); });
  const t = el.trigger as HTMLElement, p = el.popup as HTMLElement;
  assert.equal(t.getAttribute('role'), null);
  assert.equal(t.getAttribute('aria-haspopup'), null);
  assert.equal(t.querySelector('[data-part=contents]'), null, 'the area keeps its own content');
  assert.equal(p.getAttribute('role'), 'menu');
  assert.equal(p.getAttribute('aria-labelledby'), null);
  assert.equal(kit(el), 'ui-context-menu__root');
  assert.equal(kit(t), 'ui-context-menu__trigger');
  assert.equal(kit(p), 'ui-menu__popup');
  assert.ok(p.classList.contains('ui-menu__popup--placement_point'));
  assert.deepEqual(el.items.map((i: Element) => i.getAttribute('data-part')), ['item', 'item', 'submenu-trigger']);
  const e = new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 120, clientY: 80 });
  t.dispatchEvent(e); await tick(); await tick();
  assert.ok(e.defaultPrevented, 'no native context menu');
  assert.equal(el.open, true);
  assert.deepEqual(names(t), ['data-popup-open']);
  assert.deepEqual(names(p), ['data-align', 'data-open', 'data-side']);
  assert.deepEqual([got[0].open, got[0].reason], [true, 'trigger-press']);
  // Script placement at the point, 1u below it (--u falls back to 4 in happy-dom).
  assert.equal(p.style.left, '120px');
  assert.equal(p.style.top, '84px');
  // Again elsewhere while open: it moves, no new event.
  t.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 200, clientY: 50 })); await tick();
  assert.equal(p.style.left, '200px');
  assert.equal(got.length, 1);
  key(p, 'Escape'); await tick();
  assert.equal(el.open, false);
  assert.equal(el.querySelector(NATIVE), null, 'no native form elements');
  el.parentElement.remove();
});

test("context menu: Shift+F10 and the ContextMenu key open on the first item; a long touch press opens; items and submenus are the menu's", async () => {
  const el = await wc(CTX) as any;
  const t = el.trigger as HTMLElement;
  t.focus();
  key(t, 'F10', { shiftKey: true }); await tick(); await tick();
  assert.equal(el.open, true);
  assert.equal(document.activeElement, el.items[0]);
  key(el.items[0], 'End'); await tick();
  const sub = el.items[2].parentElement as any;
  key(el.items[2], 'ArrowRight'); await tick(); await tick();
  assert.equal(sub.open, true, 'submenus open beside their trigger');
  assert.equal(sub.popup.getAttribute('data-side'), 'right');
  sub.items[0].click(); await tick();
  assert.equal(el.open, false, 'an item press closes the tree');
  key(t, 'ContextMenu'); await tick();
  assert.equal(el.open, true);
  el.open = false; await tick();
  t.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch', clientX: 10, clientY: 10 }));
  await new Promise((r) => setTimeout(r, 550));
  await tick();
  assert.equal(el.open, true, 'a 500ms touch press opens it');
  el.open = false; await tick();
  t.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerType: 'touch', clientX: 10, clientY: 10 }));
  t.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerType: 'touch' }));
  await new Promise((r) => setTimeout(r, 550));
  assert.equal(el.open, false, 'a short press does not');
  el.disabled = true; await tick();
  t.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true }));
  await tick();
  assert.equal(el.open, false, 'disabled');
  assert.deepEqual(names(t), ['data-disabled']);
  el.parentElement.remove();
});

const C = ContextMenu as any;
test('ContextMenu (React): the same data-* as ui-context-menu on host, trigger, popup and items; the preset renders the composed parts', async () => {
  const P: Part[] = [['host', ':scope'], ['trigger', ':scope > [data-part=trigger]'], ['popup', '[data-part=popup]'], ['item', '[data-part=item]'], ['submenu-trigger', '[data-part=submenu-trigger]']];
  const parts = h(C.Root, null, h(C.Trigger, { tabIndex: 0 }, 'Canvas'), h(C.Portal, null, h(C.Positioner, null, h(C.Popup, null,
    h(C.Item, null, 'Copy'), h(C.Item, null, 'Paste'),
    h(C.SubmenuRoot, null, h(C.SubmenuTrigger, null, 'Arrange'), h(C.Positioner, null, h(C.Popup, null, h(C.Item, null, 'Front'))))))));
  await same('ui-context-menu', CTX, parts, P);
  const a = html(h(ContextMenu, { label: 'Canvas' }, h(C.Item, null, 'Copy')));
  assert.match(a, /^<div data-ui="context-menu" class="ui-context-menu__root"><div data-part="trigger" class="ui-context-menu__trigger">Canvas<\/div><div data-part="popup" popover="manual" id="ID\w*" role="menu" tabindex="-1" data-closed="" class="ui-menu__popup/);
  assert.equal(a, html(h(C.Root, null, h(C.Trigger, null, 'Canvas'), h(C.Positioner, null, h(C.Popup, null, h(C.Item, null, 'Copy'))))), 'composed = preset');
});

test('ContextMenu (React): contextmenu and Shift+F10 open at a point with onOpenChange(true, { reason: trigger-press })', async () => {
  const { createRoot } = await import('react-dom/client');
  const { act } = await import('react');
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  const box = document.createElement('div');
  document.body.append(box);
  const root = createRoot(box);
  const calls: any[] = [];
  await act(async () => root.render(h(ContextMenu, { label: 'Area', onOpenChange: (o: boolean, d: any) => calls.push([o, d.reason]) }, h(C.Item, null, 'Copy'), h(C.Item, null, 'Paste'))));
  const t = box.querySelector('[data-part=trigger]') as HTMLElement, p = box.querySelector('[data-part=popup]') as HTMLElement;
  const e = new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 40, clientY: 30 });
  await act(async () => { t.dispatchEvent(e); });
  assert.ok(e.defaultPrevented);
  assert.deepEqual(names(t), ['data-popup-open']);
  assert.equal(p.style.left, '40px');
  assert.equal(p.style.top, '34px');
  await act(async () => { key(p, 'Escape'); });
  assert.deepEqual(names(t), []);
  t.tabIndex = 0;
  await act(async () => { t.focus(); key(t, 'F10', { shiftKey: true }); });
  assert.equal(document.activeElement, box.querySelector('[role=menuitem]'));
  assert.deepEqual(calls, [[true, 'trigger-press'], [false, 'escape-key'], [true, 'trigger-press']]);
  await act(async () => root.unmount());
  box.remove();
});

// ── Menubar ──

const BAR = '<ui-menubar label="App"><ui-menu label="File"><div data-part="item">New</div><div data-part="item">Open</div></ui-menu><ui-menu label="Edit" disabled><div data-part="item">Undo</div></ui-menu><ui-menu label="View"><div data-part="item">Zoom</div></ui-menu></ui-menubar>';

test('menubar: role=menubar; its menus\' triggers are menuitems with one tab stop; arrows wrap and skip disabled menus', async () => {
  const bar = await wc(BAR) as any;
  await tick();
  const [file, edit, view] = bar.menus as any[];
  assert.equal(bar.getAttribute('role'), 'menubar');
  assert.equal(bar.getAttribute('aria-orientation'), 'horizontal');
  assert.equal(bar.getAttribute('aria-label'), 'App');
  assert.deepEqual(names(bar), ['data-orientation']);
  assert.equal(kit(bar), 'ui-menubar__root');
  assert.deepEqual([file, edit, view].map((m) => m.trigger.getAttribute('role')), ['menuitem', 'menuitem', 'menuitem']);
  assert.deepEqual([file, edit, view].map((m) => m.trigger.getAttribute('tabindex')), ['0', '-1', '-1']);
  assert.equal(file.trigger.querySelector('[data-part=trailing] i'), null, 'bar triggers have no caret');
  file.trigger.focus();
  key(file.trigger, 'ArrowRight'); await tick();
  assert.equal(document.activeElement, view.trigger, 'skips the disabled menu');
  assert.deepEqual([file, edit, view].map((m) => m.trigger.getAttribute('tabindex')), ['-1', '-1', '0']);
  key(view.trigger, 'ArrowRight'); await tick();
  assert.equal(document.activeElement, file.trigger, 'wraps');
  key(file.trigger, 'End'); await tick();
  assert.equal(document.activeElement, view.trigger);
  key(view.trigger, 'Home'); await tick();
  assert.equal(document.activeElement, file.trigger);
  assert.equal(bar.querySelector(NATIVE), null, 'no native form elements');
  bar.parentElement.remove();
});

test('menubar: ArrowDown opens a menu on its first item; ArrowRight inside it switches menus (sibling-open); hovering another trigger opens it', async () => {
  const bar = await wc(BAR) as any;
  await tick();
  const [file, , view] = bar.menus as any[], reasons: string[] = [];
  bar.addEventListener('openchange', (e: CustomEvent) => reasons.push(`${(e.target as any).label}:${e.detail.open}:${e.detail.reason}`));
  file.trigger.focus();
  key(file.trigger, 'ArrowDown'); await tick(); await tick();
  assert.equal(file.open, true);
  assert.equal(document.activeElement, file.items[0]);
  assert.deepEqual(names(bar), ['data-has-submenu-open', 'data-orientation']);
  key(file.items[0], 'ArrowRight'); await tick(); await tick(); await tick();
  assert.equal(file.open, false);
  assert.equal(view.open, true);
  assert.equal(document.activeElement, view.items[0]);
  key(view.items[0], 'Escape'); await tick(); await tick();
  assert.equal(view.open, false);
  assert.equal(document.activeElement, view.trigger);
  assert.deepEqual(names(bar), ['data-orientation']);
  // Hover: once a menu is open, another trigger opens on pointerenter, and the first closes.
  file.trigger.click(); await tick();
  view.trigger.dispatchEvent(new PointerEvent('pointerenter'));
  await new Promise((r) => setTimeout(r, 10)); await tick(); await tick();
  assert.equal(view.open, true);
  assert.equal(file.open, false);
  assert.deepEqual(reasons, ['File:true:list-navigation', 'File:false:sibling-open', 'View:true:list-navigation', 'View:false:escape-key', 'File:true:trigger-press', 'View:true:trigger-hover', 'File:false:sibling-open']);
  bar.parentElement.remove();
});

test('menubar: vertical bars move on ArrowDown / ArrowUp and open beside on ArrowRight', async () => {
  const bar = await wc(BAR.replace('<ui-menubar label="App">', '<ui-menubar label="App" orientation="vertical">')) as any;
  await tick();
  const [file, , view] = bar.menus as any[];
  assert.deepEqual(names(bar), ['data-orientation']);
  assert.equal(bar.getAttribute('data-orientation'), 'vertical');
  file.trigger.focus();
  key(file.trigger, 'ArrowDown'); await tick();
  assert.equal(document.activeElement, view.trigger);
  key(view.trigger, 'ArrowRight'); await tick(); await tick();
  assert.equal(view.open, true);
  assert.equal(view.popup.getAttribute('data-side'), 'right');
  assert.ok(view.popup.classList.contains('ui-menu__popup--placement_submenu'));
  bar.parentElement.remove();
});

const reactBar = () => h(Menubar, { label: 'App' },
  h(Menu, { label: 'File' }, h(M.Item, null, 'New'), h(M.Item, null, 'Open')),
  h(Menu, { label: 'Edit', disabled: true }, h(M.Item, null, 'Undo')),
  h(Menu, { label: 'View' }, h(M.Item, null, 'Zoom')));

test('Menubar (React): the same data-* as ui-menubar on the bar, its menus and their triggers; roles and tab stop', async () => {
  const P: Part[] = [['host', ':scope'], ['trigger', ':scope > [data-ui=menu] > [data-part=trigger], :scope > ui-menu > [data-part=trigger]']];
  const a = await wc(BAR), b = ssr(reactBar());
  await tick();
  const allowed = contract.components['ui-menubar'];
  assert.ok(allowed);
  assert.deepEqual(names(a), names(b));
  const ta = [...a.querySelectorAll(':scope > ui-menu > [data-part=trigger]')], tb = [...b.querySelectorAll(':scope > [data-ui=menu] > [data-part=trigger]')];
  assert.equal(ta.length, 3);
  ta.forEach((t, k) => {
    assert.deepEqual(names(t), names(tb[k]));
    assert.equal(t.getAttribute('role'), tb[k].getAttribute('role'));
    assert.equal(t.getAttribute('tabindex'), tb[k].getAttribute('tabindex'));
  });
  for (const n of names(a)) assert.ok(allowed.host.includes(n));
  void P;
  a.parentElement!.remove();
  const m = html(reactBar());
  assert.match(m, /^<div data-ui="menubar" role="menubar" aria-orientation="horizontal" aria-label="App" data-orientation="horizontal" class="ui-menubar__root/);
  assert.match(m, /<button type="button" data-part="trigger" id="ID\w*" role="menuitem" aria-haspopup="menu" aria-expanded="false" aria-controls="ID\w*" tabindex="0"/);
});

test('Menubar (React): arrows move the tab stop; ArrowDown opens; ArrowRight in a menu switches with sibling-open', async () => {
  const { createRoot } = await import('react-dom/client');
  const { act } = await import('react');
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  const box = document.createElement('div');
  document.body.append(box);
  const root = createRoot(box);
  const calls: string[] = [];
  const log = (k: string) => (o: boolean, d: any) => calls.push(`${k}:${o}:${d.reason}`);
  await act(async () => root.render(h(Menubar, null,
    h(Menu, { label: 'File', onOpenChange: log('File') }, h(M.Item, null, 'New')),
    h(Menu, { label: 'View', onOpenChange: log('View') }, h(M.Item, null, 'Zoom')))));
  const ts = () => [...box.querySelectorAll<HTMLElement>('[data-part=trigger]')];
  await act(async () => { ts()[0].focus(); key(ts()[0], 'ArrowRight'); });
  assert.equal(document.activeElement, ts()[1]);
  assert.deepEqual(ts().map((t) => t.getAttribute('tabindex')), ['-1', '0']);
  await act(async () => { key(ts()[1], 'ArrowDown'); });
  const zoom = box.querySelectorAll<HTMLElement>('[role=menuitem][data-part=item]')[1];
  assert.equal(document.activeElement, zoom);
  assert.ok(box.firstElementChild!.hasAttribute('data-has-submenu-open'));
  await act(async () => { key(zoom, 'ArrowRight'); });
  assert.equal(ts()[0].getAttribute('aria-expanded'), 'true');
  assert.equal(ts()[1].getAttribute('aria-expanded'), 'false');
  assert.deepEqual(calls, ['View:true:list-navigation', 'View:false:sibling-open', 'File:true:list-navigation']);
  await act(async () => root.unmount());
  box.remove();
});

test('menubar: RTL mirrors the arrows along the bar', async () => {
  const box = await wc(`<div dir="rtl">${BAR}</div>`) as any;
  await tick();
  const bar = box.querySelector('ui-menubar') as any, [file, , view] = bar.menus as any[];
  file.trigger.focus();
  key(file.trigger, 'ArrowLeft'); await tick();
  assert.equal(document.activeElement, view.trigger, 'ArrowLeft moves to the next trigger');
  key(view.trigger, 'ArrowRight'); await tick();
  assert.equal(document.activeElement, file.trigger);
  box.parentElement.remove();
});
