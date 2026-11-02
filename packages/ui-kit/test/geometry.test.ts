import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SIZES, resolveBtg, btgHeights, resolveControl, resolveComposite, resolveField, resolveSelectTrigger } from '../tokens/geometry/resolve.ts';

test('size is the unit: height 8u, font 10px + u (spec table)', () => {
  const table = [[16, 2, 12], [18, 2.25, 12.25], [20, 2.5, 12.5], [24, 3, 13], [28, 3.5, 13.5], [32, 4, 14], [36, 4.5, 14.5]];
  assert.deepEqual(SIZES, table.map((r) => r[1]));
  for (const [height, unit, font] of table) {
    const c = resolveControl({ unit, border: 0 });
    assert.equal(c.height, height);
    assert.equal(c.fontSize, font);
  }
});

test('32px control: 1u padding, 6u slots, contents 1u inline / 0.75u block', () => {
  const c = resolveControl({ border: 0 });
  assert.equal(c.padding, 4);
  assert.equal(c.slot, 24);
  assert.deepEqual(c.contents, { paddingInline: 4, paddingBlock: 3, lineHeight: 18, minSize: 24 });
  assert.equal(c.height, c.slot + 2 * c.padding);
});

test('icon sizes: sm = font − 0.5u, md = font + 0.5u, lg = font + 1.5u, fill = slot', () => {
  assert.deepEqual((['sm', 'md', 'lg', 'fill'] as const).map((iconSize) => resolveControl({ iconSize }).iconSize), [12, 16, 20, 24]);
  // At u=2 the slot is 12px: md (13) and lg (15) cap at the slot so the control stays 16px.
  assert.deepEqual((['sm', 'md', 'lg', 'fill'] as const).map((iconSize) => resolveControl({ unit: 2, iconSize }).iconSize), [11, 12, 12, 12]);
  assert.equal(resolveControl({ unit: 2.5, iconSize: 'lg' }).iconSize, 15, 'lg caps below u≈2.9');
  assert.equal(resolveControl({ unit: 3, iconSize: 'lg' }).iconSize, 17.5, 'uncapped from u=3');
});

test('border is spent inside the padding, never added to height', () => {
  const a = resolveControl({ border: 0 }), b = resolveControl({ border: 2 });
  assert.equal(a.height, b.height);
  assert.equal(b.padding, 2);
  assert.throws(() => resolveControl({ unit: 2, border: 1.5 }), RangeError, 'B > u/2 rejected');
});

test('curvature: soft 3u, capped at half height, scaled', () => {
  assert.equal(resolveControl().radius, 12);
  assert.equal(resolveControl({ unit: 2, radiusScale: 3 }).radius, 8, 'cap = 16/2');
  assert.equal(resolveControl({ radiusScale: 0 }).radius, 0);
});

test('fields and select trigger put text where button contents sit', () => {
  const f = resolveField();
  assert.deepEqual([f.paddingStart, f.paddingEnd], [3 + 4, 3 + 4]);
  const t = resolveSelectTrigger();
  assert.deepEqual([t.paddingStart, t.paddingEnd, t.chevronSlot], [7, 3, 24]);
});

test('composite: default Q=0.5u keeps a one-row segmented control at control height', () => {
  const c = resolveComposite();
  assert.equal(c.edge, 2);
  assert.equal(c.child.height, 28);
  assert.equal(c.rowHeight, 32);
  assert.equal(c.child.radius, 10);
});

test('composite grows instead of shrinking the slot under a tight budget', () => {
  const c = resolveComposite({ unit: 3, border: 1, compositeInsetUnits: 1.5 });
  assert.equal(c.child.inset, 1, 'child inset floors at B');
  assert.equal(c.child.height, 20);
  assert.equal(c.rowHeight, 29, 'grows past the 24px control');
});

test('Q = 0 is an attached group: no gap, square children', () => {
  const c = resolveComposite({ compositeInsetUnits: 0, border: 0 });
  assert.equal(c.gap, 0);
  assert.equal(c.child.radius, 0);
  assert.equal(c.child.height, 32);
});

test('badge / tag / chip: 12 + k·u with the cap; your u=3, 4, 5 values hold', () => {
  assert.deepEqual(btgHeights(3), { badge: 15, tag: 18, chip: 21 });
  assert.deepEqual(btgHeights(4), { badge: 16, tag: 20, chip: 24 });
  assert.deepEqual(btgHeights(5), { badge: 17, tag: 22, chip: 27 });
  assert.deepEqual(btgHeights(2), { badge: 12, tag: 14, chip: 16 }, 'capped: chip = control height, one u per step');
  assert.deepEqual(btgHeights(2.25), { badge: 13.5, tag: 15.75, chip: 18 });
  for (const u of SIZES) {
    const h = btgHeights(u);
    assert.ok(h.chip <= 8 * u, `chip never taller than a control at u=${u}`);
    assert.ok(h.tag <= h.chip - u && h.badge <= h.tag - u, `ladder keeps one u per step at u=${u}`);
  }
});

test('badge / tag / chip: text, slots, padding', () => {
  const chip = resolveBtg('chip'), tag = resolveBtg('tag'), badge = resolveBtg('badge');
  assert.deepEqual([chip.fontSize, tag.fontSize, badge.fontSize], [14, 12, 10]);
  assert.equal(chip.slot, tag.height, 'chip slot holds a tag');
  assert.equal(tag.slot, badge.height, 'tag slot holds a badge');
  assert.equal(chip.padding, 1, '0.5u minus the 1px border');
  assert.equal(chip.slot + 2 * chip.padding + 2 * chip.border, chip.height, 'border + padding + slot = height');
  assert.equal(chip.iconSize, 16);
  assert.equal(tag.iconSize, 14);
  assert.equal(badge.radius, 8, 'pill');
});
