// Wave 6: data table and chart.
import { tick } from './setup.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadTsx } from './load-tsx.ts';
import { ariaSort, nextSort, parseSort, sortRows, sortText } from '../dom/table.ts';
import { arcPath, barPath, chartMarkup, donutSlices, foldSeries, legendEntries, niceTicks, tooltipRows } from '../dom/chart.ts';

await import('../components/data-table/data-table.element.ts');
await import('../components/chart/chart.element.ts');
const { DataTable } = await loadTsx(new URL('../components/data-table/data-table.react.tsx', import.meta.url));
const { Chart } = await loadTsx(new URL('../components/chart/chart.react.tsx', import.meta.url));
const mount = async (markup: string) => { const d = document.createElement('div'); d.innerHTML = markup; document.body.append(d); await tick(); await tick(); return d.firstElementChild as any; };
const COLS = [{ key: 'name', label: 'Name', sort: 'text' as const }, { key: 'total', label: 'Total', sort: 'number' as const, align: 'end' as const }];
const ROWS = [{ name: 'b', total: 2 }, { name: 'a', total: 10 }, { name: 'c', total: null }];
const DATA = { categories: ['Q1', 'Q2', 'Q3'], series: [{ name: 'N', values: [3, null, 5] }, { name: 'S', values: [2, 4, 1] }] };

test('sorting: a cycle, stable order, empties last, numbers as numbers', () => {
  assert.deepEqual(nextSort(null, 'a'), { key: 'a', dir: 'asc' });
  assert.deepEqual(nextSort({ key: 'a', dir: 'asc' }, 'a'), { key: 'a', dir: 'desc' });
  assert.equal(nextSort({ key: 'a', dir: 'desc' }, 'a'), null);
  assert.deepEqual(nextSort({ key: 'a', dir: 'desc' }, 'b'), { key: 'b', dir: 'asc' });
  assert.deepEqual(parseSort('x:desc'), { key: 'x', dir: 'desc' });
  assert.equal(parseSort(''), null);
  assert.equal(sortText(null), '');
  assert.equal(ariaSort({ key: 'a', dir: 'desc' }, 'a'), 'descending');
  assert.equal(ariaSort(null, 'a'), 'none');
  assert.deepEqual(sortRows(ROWS, COLS[1], 'asc').map((r) => r.total), [2, 10, null]);
  assert.deepEqual(sortRows(ROWS, COLS[1], 'desc').map((r) => r.total), [10, 2, null]);
  assert.deepEqual(sortRows(ROWS, COLS[0], 'asc').map((r) => r.name), ['a', 'b', 'c']);
  assert.deepEqual(sortRows(ROWS, undefined, 'asc'), ROWS);
});

test('ui-data-table: a native table that sorts, with interactive cells', async () => {
  const el = await mount(`<ui-data-table label="T" columns='${JSON.stringify(COLS)}' rows='${JSON.stringify(ROWS)}'></ui-data-table>`);
  assert.equal(el.getAttribute('role'), 'region');
  const table = el.querySelector(':scope > table');
  assert.ok(table);
  assert.equal(table.querySelectorAll('thead th[scope=col]').length, 2);
  assert.equal(table.querySelectorAll('tbody tr').length, 3);
  assert.equal(table.querySelector('td[data-align=end]').textContent, '2');
  let seen = '';
  el.addEventListener('sortchange', (e: any) => { seen = e.detail.sort; });
  el.querySelectorAll('[data-part=sort]')[1].click();
  await tick();
  assert.equal(seen, 'total:asc');
  assert.equal(el.querySelectorAll('th')[1].getAttribute('aria-sort'), 'ascending');
  assert.equal(el.querySelector('td[data-align=end]').textContent, '2');
  el.columns = [{ key: 'name', label: 'Name', render: (r: any) => { const a = document.createElement('a'); a.textContent = r.name; return a; } }];
  await tick();
  assert.equal(el.querySelector('td a').textContent, 'b');
});

test('ui-data-table navigable: an ARIA grid with one tab stop', async () => {
  const el = await mount(`<ui-data-table label="T" navigable columns='${JSON.stringify(COLS)}' rows='${JSON.stringify(ROWS)}'></ui-data-table>`);
  assert.equal(el.querySelector('table').getAttribute('role'), 'grid');
  assert.equal(el.querySelectorAll('th[tabindex="0"], td[tabindex="0"]').length, 1);
});

test('React DataTable: the same structure, sorted on a server', () => {
  const d = document.createElement('div');
  d.innerHTML = renderToStaticMarkup(h(DataTable, { label: 'T', columns: COLS, rows: ROWS, defaultSort: 'total:desc' }));
  assert.equal(d.querySelector('[data-ui=data-table]')!.getAttribute('role'), 'region');
  assert.equal(d.querySelector('td[data-align=end]')!.textContent, '10');
  assert.equal(d.querySelectorAll('th')[1].getAttribute('aria-sort'), 'descending');
});

test('chart math: round ticks, fixed folding, marks anchored', () => {
  assert.deepEqual(niceTicks(0, 97), [0, 20, 40, 60, 80, 100]);
  assert.deepEqual(niceTicks(0, 0), [0, 1]);
  assert.deepEqual(niceTicks(-3, 3).at(0), -4);
  const many = Array.from({ length: 9 }, (_, i) => ({ name: `s${i}`, values: [1] }));
  const f = foldSeries(many);
  assert.equal(f.length, 6);
  assert.equal(f[5].name, 'Other');
  assert.equal(f[5].values[0], 4);
  assert.equal(barPath(0, 0, 10, 0, 4, 'top'), '', 'a zero-height bar draws nothing');
  assert.ok(barPath(0, 0, 10, 20, 4, 'top').includes('Q'));
  assert.match(arcPath(50, 50, 40, 20, 0, Math.PI), /^M50 10A40 40 0 0 1/);
  assert.deepEqual(donutSlices({ categories: ['a', 'b'], series: [{ name: 'x', values: [1, 2] }] }).map((s) => s.value), [1, 2]);
});

test('chart markup: legend rules, gaps, one tooltip per band, escaped text', () => {
  for (const kind of ['column', 'bar', 'line', 'area', 'donut'] as const) assert.match(chartMarkup({ kind, data: DATA, width: 480, height: 240, label: 'x' }), /data-part="plot"/);
  const line = chartMarkup({ kind: 'line', data: DATA, width: 480, height: 240 });
  assert.equal((line.match(/data-mark="line"/g) ?? []).length, 3, 'a null breaks the first series in two');
  assert.deepEqual(legendEntries({ kind: 'line', data: DATA }), ['N', 'S']);
  assert.deepEqual(legendEntries({ kind: 'line', data: { categories: ['a'], series: [{ name: 'One', values: [1] }] } }), [], 'one series: no legend');
  const t = tooltipRows({ kind: 'column', data: DATA }, 1);
  assert.equal(t.title, 'Q2');
  assert.deepEqual(t.rows.map((r) => r.name), ['S'], 'a gap has no row');
  assert.ok(!chartMarkup({ kind: 'column', data: { categories: ['<b>'], series: [{ name: '"x"', values: [1] }] }, width: 300, height: 200 }).includes('<b>'));
  const stacked = chartMarkup({ kind: 'column', data: DATA, width: 480, height: 240, stacked: true });
  assert.ok(stacked.includes('data-mark="fill"'));
});

test('charts carry a figure name and a table, in both renderers', async () => {
  const el = await mount(`<ui-chart label="R" kind="line" data='${JSON.stringify(DATA)}'></ui-chart>`);
  assert.equal(el.getAttribute('role'), 'figure');
  assert.equal(el.getAttribute('aria-label'), 'R');
  assert.ok(el.querySelector('table caption'));
  assert.equal(el.querySelector('svg').getAttribute('aria-hidden'), 'true');
  const d = document.createElement('div');
  d.innerHTML = renderToStaticMarkup(h(Chart, { label: 'R', kind: 'donut', data: DATA }));
  assert.equal(d.querySelector('[data-ui=chart]')!.getAttribute('role'), 'figure');
  assert.ok(d.querySelector('[data-mark=slice]'));
});
