// Wave 4: toolbar, command bar, search trigger, tree view and sidebar.
import { tick } from './setup.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadTsx } from './load-tsx.ts';
import { fitCount, rovingNext } from '../dom/toolbar.ts';
import { filterCommands, groupCommands, moveHighlight } from '../dom/command.ts';
import { treeKey, visibleRows } from '../dom/tree.ts';

await import('../components/toolbar/toolbar.element.ts');
await import('../components/command-bar/command-bar.element.ts');
await import('../components/search-trigger/search-trigger.element.ts');
await import('../components/tree-view/tree-view.element.ts');
await import('../components/sidebar/sidebar.element.ts');
const { TreeView } = await loadTsx(new URL('../components/tree-view/tree-view.react.tsx', import.meta.url));
const { Sidebar } = await loadTsx(new URL('../components/sidebar/sidebar.react.tsx', import.meta.url));
const mount = async (markup: string) => { const d = document.createElement('div'); d.innerHTML = markup; document.body.append(d); await tick(); await tick(); return d.firstElementChild as any; };
const TREE = [{ id: 'a', label: 'A', children: [{ id: 'a1', label: 'A1' }] }, { id: 'b', label: 'B' }];

test('toolbar: wrapping focus and how many fit', () => {
  assert.equal(rovingNext('ArrowRight', 2, 3, false), 0);
  assert.equal(rovingNext('ArrowRight', 0, 3, false, true), 2);
  assert.equal(rovingNext('ArrowDown', 0, 3, true), 1);
  assert.equal(rovingNext('ArrowDown', 0, 3, false), null);
  assert.equal(fitCount([40, 40, 40], 136, 8, 40), 3, 'all fit with no More button');
  assert.equal(fitCount([40, 40, 40], 100, 8, 40), 1);
  assert.equal(fitCount([40, 40], 30, 8, 40), 0);
});

test('commands: filter by label and keywords, group in order, wrap the highlight', () => {
  const list = [{ id: '1', label: 'New project', group: 'Create' }, { id: '2', label: 'Theme', keywords: 'dark mode', group: 'View' }, { id: '3', label: 'Help' }];
  assert.deepEqual(filterCommands(list, 'dark').map((c) => c.id), ['2']);
  assert.deepEqual(filterCommands(list, '').length, 3);
  assert.deepEqual(groupCommands(list).map((g) => g.group), ['', 'Create', 'View']);
  assert.equal(moveHighlight('ArrowDown', 2, 3), 0);
  assert.equal(moveHighlight('ArrowUp', 0, 3), 2);
  assert.equal(moveHighlight('ArrowDown', 0, 0), -1);
});

test('tree: visible rows and every key', () => {
  const closed = visibleRows(TREE, new Set()), open = visibleRows(TREE, new Set(['a']));
  assert.deepEqual(closed.map((r) => r.item.id), ['a', 'b']);
  assert.deepEqual(open.map((r) => r.item.id), ['a', 'a1', 'b']);
  assert.equal(open[1].level, 2);
  assert.deepEqual(treeKey('ArrowRight', closed, 'a'), { expand: 'a' });
  assert.deepEqual(treeKey('ArrowRight', open, 'a'), { focus: 'a1' });
  assert.deepEqual(treeKey('ArrowLeft', open, 'a'), { collapse: 'a' });
  assert.deepEqual(treeKey('ArrowLeft', open, 'a1'), { focus: 'a' });
  assert.deepEqual(treeKey('ArrowLeft', open, 'b'), null);
  assert.deepEqual(treeKey('End', open, 'a'), { focus: 'b' });
  assert.deepEqual(treeKey('Enter', open, 'b'), { select: 'b' });
  assert.deepEqual(treeKey('ArrowLeft', closed, 'a', true), { expand: 'a' }, 'RTL swaps');
});

test('ui-toolbar: a named toolbar', async () => {
  const el = await mount('<ui-toolbar label="Format"><ui-button>B</ui-button><ui-button>I</ui-button></ui-toolbar>');
  assert.equal(el.getAttribute('role'), 'toolbar');
  assert.equal(el.getAttribute('aria-label'), 'Format');
});

test('ui-command-bar: lists commands in a dialog', async () => {
  const el = await mount(`<ui-command-bar commands='[{"id":"a","label":"Alpha"},{"id":"b","label":"Beta","group":"G"}]'></ui-command-bar>`);
  assert.ok(el.querySelector('ui-dialog'));
  assert.equal(el.querySelectorAll('[role=option]').length, 2);
  assert.equal(el.querySelector('[role=option]').getAttribute('aria-selected'), 'true');
});

test('ui-search-trigger opens the bar it names', async () => {
  const d = document.createElement('div');
  d.innerHTML = '<ui-command-bar id="cb"></ui-command-bar><ui-search-trigger for="cb"></ui-search-trigger>';
  document.body.append(d); await tick(); await tick();
  (d.querySelector('ui-search-trigger ui-button') as HTMLElement).click();
  await tick();
  assert.equal((d.querySelector('ui-command-bar') as any).open, true);
});

test('ui-tree-view: rows with tree semantics; focus and selection are separate', async () => {
  const el = await mount(`<ui-tree-view label="Files" items='${JSON.stringify(TREE)}'></ui-tree-view>`);
  assert.equal(el.getAttribute('role'), 'tree');
  const row = el.querySelector('[data-id=a]');
  assert.equal(row.getAttribute('aria-expanded'), 'false');
  row.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
  await tick();
  assert.equal(el.querySelectorAll('[role=treeitem]').length, 3);
  assert.equal(el.value, '', 'expanding selects nothing');
});

test('ui-sidebar: a landmark that collapses', async () => {
  const el = await mount('<ui-sidebar label="Main"><div data-part="section"><a href="#"><span>Home</span></a></div></ui-sidebar>');
  assert.equal(el.getAttribute('role'), 'navigation');
  (el.querySelector('[data-part=toggle]') as HTMLElement).click();
  await tick();
  assert.ok(el.hasAttribute('data-collapsed'));
  assert.equal(el.querySelector('[data-part=toggle]').getAttribute('aria-expanded'), 'false');
});

test('React twins: tree and sidebar', () => {
  const d = document.createElement('div');
  d.innerHTML = renderToStaticMarkup(h(TreeView, { label: 'F', items: TREE, defaultValue: 'b' }));
  assert.equal(d.querySelector('[aria-selected=true]')!.getAttribute('data-id'), 'b');
  d.innerHTML = renderToStaticMarkup(h(Sidebar, { label: 'M', defaultCollapsed: true }));
  assert.equal(d.firstElementChild!.localName, 'nav');
  assert.ok(d.firstElementChild!.hasAttribute('data-collapsed'));
});
