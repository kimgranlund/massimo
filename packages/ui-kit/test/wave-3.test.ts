// Wave 3: grid navigation, calendar, date pickers and time picker.
import { tick } from './setup.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadTsx } from './load-tsx.ts';
import { gridMove, rovingTabindex } from '../dom/grid-nav.ts';
import { addDays, addMonths, calendarCells, calendarKey, inBounds, monthGrid, orderRange, parseIso, rangeComplete, rangeText } from '../dom/calendar.ts';
import { parseTime, timeSlots } from '../dom/time.ts';

await import('../components/calendar/calendar.element.ts');
await import('../components/date-picker/date-picker.element.ts');
await import('../components/date-range-picker/date-range-picker.element.ts');
const { Calendar } = await loadTsx(new URL('../components/calendar/calendar.react.tsx', import.meta.url));
const mount = async (markup: string) => { const d = document.createElement('div'); d.innerHTML = markup; document.body.append(d); await tick(); await tick(); return d.firstElementChild as any; };

test('gridMove: arrows, ends, pages, edges and RTL', () => {
  const size = { rows: 4, cols: 5, pageRows: 2 };
  assert.deepEqual(gridMove('ArrowRight', { row: 1, col: 1 }, size), { row: 1, col: 2 });
  assert.deepEqual(gridMove('ArrowRight', { row: 1, col: 1 }, { ...size, rtl: true }), { row: 1, col: 0 });
  assert.deepEqual(gridMove('ArrowLeft', { row: 0, col: 0 }, size), { row: 0, col: 0 }, 'stops at the edge');
  assert.deepEqual(gridMove('Home', { row: 2, col: 3 }, size), { row: 2, col: 0 });
  assert.deepEqual(gridMove('End', { row: 2, col: 3 }, size, true), { row: 3, col: 4 });
  assert.deepEqual(gridMove('PageDown', { row: 3, col: 0 }, size), { row: 3, col: 0 });
  assert.equal(gridMove('a', { row: 0, col: 0 }, size), null);
  assert.equal(rovingTabindex({ row: 1, col: 1 }, { row: 1, col: 1 }), 0);
  assert.equal(rovingTabindex({ row: 1, col: 2 }, { row: 1, col: 1 }), -1);
});

test('dates: invalid days, month ends, leap years and a stable six-week grid', () => {
  assert.equal(parseIso('2026-02-30'), null);
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(addMonths('2026-01-31', 1), '2026-02-28');
  assert.equal(addMonths('2024-01-31', 1), '2024-02-29');
  const g = monthGrid('2026-11-15', 1);
  assert.equal(g.length, 6);
  assert.equal(g[0][0], '2026-10-26', 'starts on the week start');
  assert.ok(inBounds('2026-05-01', '2026-01-01', '2026-12-31'));
  assert.ok(!inBounds('2027-05-01', '', '2026-12-31'));
  assert.deepEqual(orderRange('2026-02-01', '2026-01-01'), ['2026-01-01', '2026-02-01']);
  assert.ok(rangeComplete('2026-01-01/2026-02-01'));
  assert.ok(!rangeComplete('2026-01-01/'));
  assert.equal(rangeText('', 'Pick', 'en-US'), 'Pick');
});

test('calendar keys: days, weeks, week ends, months, years, RTL', () => {
  assert.equal(calendarKey('ArrowRight', '2026-11-06', 0), '2026-11-07');
  assert.equal(calendarKey('ArrowRight', '2026-11-06', 0, false, true), '2026-11-05');
  assert.equal(calendarKey('ArrowDown', '2026-11-06', 0), '2026-11-13');
  assert.equal(calendarKey('Home', '2026-11-06', 0), '2026-11-01');
  assert.equal(calendarKey('End', '2026-11-06', 0), '2026-11-07');
  assert.equal(calendarKey('PageDown', '2026-11-06', 0), '2026-12-06');
  assert.equal(calendarKey('PageUp', '2026-11-06', 0, true), '2025-11-06');
  assert.equal(calendarKey('a', '2026-11-06', 0), null);
});

test('calendar cells mark the day, the focus, range and bounds', () => {
  const cells = calendarCells({ focus: '2026-11-06', start: 0, rangeStart: '2026-11-02', rangeEnd: '2026-11-04', max: '2026-11-20', today: '2026-11-03', locale: 'en-US' }).flat();
  const at = (iso: string) => cells.find((c) => c.iso === iso)!;
  assert.ok(at('2026-11-03').inRange && at('2026-11-03').today);
  assert.ok(at('2026-11-02').selected);
  assert.ok(at('2026-11-06').focused);
  assert.ok(at('2026-11-21').disabled);
  assert.ok(at('2026-12-01').outside);
  assert.equal(cells.filter((c) => c.focused).length, 1);
});

test('parseTime reads what people type, and rejects the rest', () => {
  for (const [text, want] of [['9:30 pm', '21:30'], ['2130', '21:30'], ['21:30', '21:30'], ['12am', '00:00'], ['12 pm', '12:00'], ['9', '09:00']] as const) assert.equal(parseTime(text), want, text);
  for (const bad of ['25:00', '13pm', '10:61', 'soon']) assert.equal(parseTime(bad), null, bad);
  assert.equal(timeSlots(30).length, 48);
  assert.equal(timeSlots(15)[1], '00:15');
});

test('ui-calendar: a grid with one tab stop, and clicking picks a day', async () => {
  const el = await mount('<ui-calendar value="2026-11-06" locale="en-US"></ui-calendar>');
  assert.equal(el.querySelector('[data-part=grid]').getAttribute('role'), 'grid');
  assert.equal(el.querySelectorAll('[role=gridcell][tabindex="0"]').length, 1);
  assert.equal(el.querySelectorAll('[role=gridcell]').length, 42);
  assert.equal(el.querySelector('[aria-selected=true]').getAttribute('data-date'), '2026-11-06');
  el.querySelector('[data-date="2026-11-10"]').click();
  await tick();
  assert.equal(el.value, '2026-11-10');
  assert.equal(el.formValue(), '2026-11-10');
});

test('ui-calendar range: two picks make one ordered range', async () => {
  const el = await mount('<ui-calendar mode="range" value="2026-11-20/2026-11-22" locale="en-US"></ui-calendar>');
  el.querySelector('[data-date="2026-11-10"]').click(); await tick();
  el.querySelector('[data-date="2026-11-05"]').click(); await tick();
  assert.equal(el.value, '2026-11-05/2026-11-10');
});

test('pickers wrap the calendar in a popover and submit ISO', async () => {
  const el = await mount('<ui-date-picker value="2026-11-06" locale="en-US"></ui-date-picker>');
  assert.ok(el.querySelector('ui-popover ui-calendar'));
  assert.equal(el.formValue(), '2026-11-06');
  const r = await mount('<ui-date-range-picker value="2026-11-01/2026-11-30" locale="en-US"></ui-date-range-picker>');
  assert.equal(r.formValue(), '2026-11-01/2026-11-30');
});

test('React Calendar: the same grid, on a server', () => {
  const d = document.createElement('div');
  d.innerHTML = renderToStaticMarkup(h(Calendar, { defaultValue: '2026-11-06', locale: 'en-US' }));
  assert.equal(d.querySelector('[aria-selected=true]')!.getAttribute('data-date'), '2026-11-06');
  assert.equal(d.querySelectorAll('[role=gridcell]').length, 42);
});
