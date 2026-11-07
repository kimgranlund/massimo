// Setting row, data list and stat card (T-0038 to T-0040).
import { tick } from './setup.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadTsx } from './load-tsx.ts';
import { resolveDataList, resolveSettingRow, resolveStatCard } from '../tokens/geometry/resolve.ts';
import { parseTrend, trendLabel, trendPoints } from '../dom/stat.ts';
import { dataListTags } from '../components/data-list/data-list.recipe.ts';
import { settingRowTags } from '../components/setting-row/setting-row.recipe.ts';

await import('../components/stat-card/stat-card.element.ts');
const { SettingRow } = await loadTsx(new URL('../components/setting-row/setting-row.react.tsx', import.meta.url));
const { DataList } = await loadTsx(new URL('../components/data-list/data-list.react.tsx', import.meta.url));
const { StatCard } = await loadTsx(new URL('../components/stat-card/stat-card.react.tsx', import.meta.url));
const dom = (el: any) => { const d = document.createElement('div'); d.innerHTML = renderToStaticMarkup(el); return d.firstElementChild as HTMLElement; };
const mount = async (markup: string) => { const d = document.createElement('div'); d.innerHTML = markup; document.body.append(d); await tick(); return d.firstElementChild as any; };

test('resolvers: setting row, data list and stat card', () => {
  assert.deepEqual(resolveSettingRow({ unit: 4 }), { gap: 16, copy: 160 });
  assert.deepEqual(resolveDataList({ unit: 4 }), { label: 120, gap: 16, rowBlock: 6 });
  assert.equal(resolveDataList({ unit: 4, density: 'compact' }).rowBlock, 3);
  assert.deepEqual(resolveStatCard({ unit: 4 }), { trend: 40, deltaGap: 8 });
});

test('setting row: CSS-only tag and twin; copy and controls wrap apart', () => {
  assert.equal((settingRowTags as any)[':is(ui-setting-row, [data-ui=setting-row])'].flexWrap, 'wrap');
  const el = dom(h(SettingRow, { title: 'Digest', description: 'Weekly' }, h('button', null, 'x')));
  assert.equal(el.getAttribute('data-ui'), 'setting-row');
  assert.equal(el.querySelector('[data-part=title]')!.textContent, 'Digest');
  assert.equal(el.querySelector('[data-part=description]')!.textContent, 'Weekly');
  assert.equal(dom(h(SettingRow, { title: 'Digest' })).querySelector('[data-part=description]'), null);
});

test('data list: a native dl with a group per record, and rows own their gutters', () => {
  assert.ok(!('gap' in (dataListTags as any)[':is(ui-data-list, [data-ui=data-list])']['& > dl']), 'no gap between rows');
  const el = dom(h(DataList, { divided: true, layout: 'stacked' }, h(DataList.Item, { label: 'Plan' }, 'Pro')));
  assert.equal(el.getAttribute('data-ui'), 'data-list');
  assert.ok(el.hasAttribute('divided'));
  assert.equal(el.getAttribute('layout'), 'stacked');
  assert.equal(el.querySelector('dl > div > dt')!.textContent, 'Plan');
  assert.equal(el.querySelector('dl > div > dd')!.textContent, 'Pro');
});

test('stat trend: a line in the box, described in words', () => {
  assert.deepEqual(parseTrend('4, 6, x, 9'), [4, 6, 9]);
  assert.deepEqual(parseTrend(''), []);
  assert.equal(trendPoints([0, 10], 100, 32), '0,31 100,1');
  assert.equal(trendPoints([5], 100, 32), '', 'one value is no line');
  assert.equal(trendPoints([5, 5], 100, 32), '0,31 100,31', 'a flat series stays in the box');
  assert.equal(trendLabel([3, 9]), 'Trend rising, from 3 to 9');
  assert.equal(trendLabel([9, 3]), 'Trend falling, from 9 to 3');
  assert.equal(trendLabel([3, 3]), 'Trend flat, from 3 to 3');
});

test('ui-stat-card: parts, an explicit tone, and empty parts left out', async () => {
  const el = await mount('<ui-stat-card label="Churn" value="2.1%" delta="-0.4%" tone="positive" comparison="vs May" trend="3,2.5,2.1"></ui-stat-card>');
  assert.equal(el.querySelector('[data-part=label]').textContent, 'Churn');
  assert.equal(el.querySelector('[data-part=delta]').getAttribute('data-tone'), 'positive', 'a falling number is good news here');
  assert.equal(el.querySelector('svg').getAttribute('role'), 'img');
  assert.equal(el.querySelector('svg').getAttribute('aria-label'), 'Trend falling, from 3 to 2.1');
  const bare = await mount('<ui-stat-card label="Users" value="12"></ui-stat-card>');
  assert.equal(bare.querySelector('[data-part=delta]').hidden, true);
  assert.equal(bare.querySelector('[data-part=comparison]').hidden, true);
  assert.equal(bare.querySelector('svg'), null);
});

test('React StatCard: the same parts, with empty ones left out', () => {
  const el = dom(h(StatCard, { label: 'Churn', value: '2.1%', delta: '-0.4%', tone: 'positive', trend: [3, 2] }));
  assert.equal(el.getAttribute('data-ui'), 'stat-card');
  assert.equal(el.querySelector('[data-part=delta]')!.getAttribute('data-tone'), 'positive');
  assert.equal(el.querySelector('svg')!.getAttribute('aria-label'), 'Trend falling, from 3 to 2');
  assert.equal(dom(h(StatCard, { label: 'U', value: '1' })).querySelector('[data-part=delta]'), null);
});
