import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SIZES, GAPS, resolveButtonContents, resolveTextRun, CONTAINERS, resolveContainer, resolveBtg, btgHeights, resolveControl, resolveComposite, resolveField, resolveSelectTrigger } from '../tokens/geometry/resolve.ts';

test('size is the unit: height 8u, font 10px + u (spec table)', () => {
  const table = [[16, 2, 12], [18, 2.25, 12.25], [20, 2.5, 12.5], [24, 3, 13], [28, 3.5, 13.5], [32, 4, 14], [36, 4.5, 14.5]];
  assert.deepEqual(SIZES.slice(0, 7), table.map((r) => r[1]));
  for (const [height, unit, font] of table) {
    const c = resolveControl({ unit, border: 0 });
    assert.equal(c.height, height);
    assert.equal(c.fontSize, font);
  }
});

test('32px control: 1u padding, 6u slots, contents 1u inline, line height 1.2 centered in the slot', () => {
  const c = resolveControl({ border: 0 });
  assert.equal(c.padding, 4);
  assert.equal(c.slot, 24);
  assert.deepEqual(c.contents, { paddingInline: 4, paddingBlock: 3.6, lineHeight: 16.8, minSize: 24 });
  // Single-line controls: line height 1.2 × font, capped at the 6u slot (u = 2: font 12, slot 12).
  assert.equal(resolveBtg('tag').paddingBlock, 0, 'tag omits block padding');
  assert.equal(resolveBtg('badge').paddingBlock, 0, 'badge omits block padding');
  assert.ok(Math.abs(resolveBtg('chip').paddingBlock - (resolveBtg('chip').slot - resolveBtg('chip').lineHeight) / 2) < 1e-6);
  assert.deepEqual(resolveControl({ unit: 2 }).contents, { paddingInline: 2, paddingBlock: 0, lineHeight: 12, minSize: 12 });
  assert.equal(c.height, c.slot + 2 * c.padding);
});

test('button label padding: 1u beside a slot, 2u where a side has no slot', () => {
  assert.deepEqual(resolveButtonContents(false, false), { start: 8, end: 8 });
  assert.deepEqual(resolveButtonContents(true, false), { start: 4, end: 8 });
  assert.deepEqual(resolveButtonContents(false, true), { start: 8, end: 4 });
  assert.deepEqual(resolveButtonContents(true, true), { start: 4, end: 4 });
});

test('text run: 0.5u between text parts, 1u beside a slot, 2u at a bare edge', () => {
  assert.deepEqual(resolveTextRun({}), { contents: { start: 8, end: 8 } });
  assert.deepEqual(resolveTextRun({ leading: true, prefix: true, suffix: true, trailing: true }), {
    prefix: { start: 4, end: 2 }, contents: { start: 2, end: 2 }, suffix: { start: 2, end: 4 },
  });
  assert.deepEqual(resolveTextRun({ suffix: true }), { contents: { start: 8, end: 2 }, suffix: { start: 2, end: 8 } });
  assert.deepEqual(resolveTextRun({ leading: true, prefix: true, contents: false }), { prefix: { start: 4, end: 8 } });
  // Matches the older two-flag rule when there are no adornments.
  for (const [l, t] of [[false, false], [true, false], [false, true], [true, true]])
    assert.deepEqual(resolveTextRun({ leading: l, trailing: t }).contents, resolveButtonContents(l, t));
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

test('fields and select trigger use button geometry: text where a button label sits', () => {
  const f = resolveField({ border: 1 });
  assert.deepEqual([f.paddingStart, f.paddingEnd], [3 + 8, 3 + 8], 'padding + 2u, as a slotless button label');
  const t = resolveSelectTrigger({ border: 1 });
  assert.deepEqual([t.paddingStart, t.valueGap, t.chevronSlot, t.paddingEnd, t.chevronIcon], [11, 4, 24, 3, 12], 'button with a trailing slot');
  const b = resolveButtonContents(false, true, { border: 1 });
  assert.equal(t.paddingStart, f.padding + b.start);
});

test('composite: 0.5u padding level; one-row segmented is always 8u; options keep the 3u control radius', () => {
  const c = resolveComposite({ border: 1 });
  assert.equal(c.edge, 2);
  assert.equal(c.padding, 1);
  assert.equal(c.child.height, 28);
  assert.equal(c.radius, 14);
  assert.equal(c.child.radius, 12, 'concentric: 14 - 2 = control radius');
  for (const unit of SIZES) for (const border of [0, 1]) {
    if (border > unit / 2) continue;
    assert.equal(resolveComposite({ unit, border }).rowHeight, 8 * unit, `row = 8u at u=${unit} B=${border}`);
  }
  assert.equal(resolveComposite({ gap: 0 }).gap, 0, 'gap override the gap');
});

test('containers: padding, gap = padding, concentric max radius, square panel and region', () => {
  const at4 = Object.fromEntries((['group', 'collection', 'tile', 'card', 'panel', 'region', 'page'] as const).map((l) => {
    const c = resolveContainer(l, { border: 0 });
    return [l, [c.padding, c.gap, c.radius]];
  }));
  assert.deepEqual(at4, { group: [4, 4, 16], collection: [8, 8, 20], tile: [12, 12, 24], card: [16, 16, 28], panel: [24, 24, 0], region: [32, 32, 0], page: [32, 32, 0] });
  for (const l of ['group', 'collection', 'tile', 'card'] as const) assert.equal(CONTAINERS[l].maxRadius, 3 + CONTAINERS[l].padding, `${l} radius = 3u + padding`);
  const card = resolveContainer('card', { unit: 5, gap: 2 });
  assert.deepEqual([card.padding + card.border, card.gap], [20, 10], '<ui-card size="5" gap="2">');
  assert.equal(resolveContainer('group', { height: 20 }).radius, 10, 'half-height cap');
  assert.equal(resolveContainer('card', { border: 1 }).padding, 15, 'border lives inside the padding');
  assert.equal(resolveContainer('card').padding, 16, 'default border is 0');
});

test('sizes run to 12', () => {
  assert.equal(SIZES.at(-1), 12);
  const c = resolveControl({ unit: 12 });
  assert.deepEqual([c.height, c.fontSize], [96, 22]);
  assert.equal(GAPS.length, 17);
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
  const chip = resolveBtg('chip', { border: 1 }), tag = resolveBtg('tag', { border: 1 }), badge = resolveBtg('badge', { border: 1 });
  assert.deepEqual([chip.fontSize, tag.fontSize, badge.fontSize], [14, 12, 10]);
  // Local unit u′ = height / 8: chip 24 → 3, tag 20 → 2.5, badge 16 → 2 (u = 4).
  assert.deepEqual([chip.localUnit, tag.localUnit, badge.localUnit], [3, 2.5, 2]);
  assert.deepEqual([chip.slot, tag.slot, badge.slot], [21, 17.5, 14], 'slot = height − u′');
  assert.equal(chip.padding, 0.5, '0.5u′ minus the 1px border');
  assert.equal(chip.slot + 2 * chip.padding + 2 * chip.border, chip.height, 'border + padding + slot = height');
  assert.equal(chip.iconSize, 16);
  assert.equal(tag.iconSize, 14);
  for (const k of [chip, tag, badge]) assert.equal(k.slot + 2 * k.padding + 2 * k.border, k.height, 'border + padding + slot = height');
  // Concentric radius 0.5u′ + slot / 3: badge u′ 2, slot 14 → 1 + 14/3.
  assert.ok(Math.abs(badge.radius - (1 + 14 / 3)) < 1e-9);
  // The button obeys the same rule: 1u + 6u / 3 = 3u.
  const c = resolveControl();
  assert.equal(c.radius, c.inset + c.slot / 3);
  assert.equal(resolveBtg('chip', { radiusScale: 3 }).radius, 12, 'pill at height / 2');
});

test('badge / tag / chip label wrapper: 1u′ on both sides, u′ = height / 8', () => {
  for (const kind of ['chip', 'tag', 'badge'] as const) for (const u of [2, 3, 4, 6]) {
    const k = resolveBtg(kind, { unit: u }), lu = k.height / 8;
    assert.deepEqual([k.localUnit, k.bareEdge, k.slotEdge, k.between], [lu, lu, lu, lu / 4], `${kind} u=${u}`);
    assert.equal(k.padding, Math.max(0, lu / 2));
  }
});

