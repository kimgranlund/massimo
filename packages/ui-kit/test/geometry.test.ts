import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RADIUS_FACTORS, resolveChoice, SIZES, GAPS, resolveButtonContents, resolveTextRun, CONTAINERS, CARD_PADDINGS, resolveContainer, resolveBtg, btgHeights, resolveControl, resolveComposite, resolveField, resolveSelectTrigger, resolveTrack, trackFill, thumbOffset, resolveSwiper, resolveImage, IMAGE_RATIOS, resolveFieldRow, resolveFieldGrid, resolveDisclosure, resolveTabs, resolveToast, trackPairFill, resolveDialog, resolveDrawer, resolveMenu, resolveMenubar, resolvePopup, resolveNavigationMenu } from '../tokens/geometry/resolve.ts';
// These tests pin u = 4 (the numbers below are at u = 4); the default unit is checked separately.
const U4 = { unit: 4 } as const;

test('size is the unit: height 8u, font 10px + u (spec table)', () => {
  const table = [[16, 2, 12], [18, 2.25, 12.25], [20, 2.5, 12.5], [22, 2.75, 12.75], [24, 3, 13], [28, 3.5, 13.5], [32, 4, 14], [36, 4.5, 14.5]];
  assert.deepEqual(SIZES.slice(0, 8), table.map((r) => r[1]));
  for (const [height, unit, font] of table) {
    const c = resolveControl({ unit, border: 0 });
    assert.equal(c.height, height);
    assert.equal(c.fontSize, font);
  }
});

test('32px control: 1u padding, 6u slots, contents 1u inline, line height 1.2 centered in the slot', () => {
  const c = resolveControl({ unit: 4, border: 0 });
  assert.equal(c.padding, 4);
  assert.equal(c.slot, 24);
  assert.deepEqual(c.contents, { paddingInline: 4, paddingBlock: 3.6, lineHeight: 16.8, minSize: 24 });
  // Single-line controls: line height 1.2 × font, capped at the 6u slot (u = 2: font 12, slot 12).
  assert.equal(resolveBtg('tag', U4).paddingBlock, 0, 'tag omits block padding');
  assert.equal(resolveBtg('badge', U4).paddingBlock, 0, 'badge omits block padding');
  assert.ok(Math.abs(resolveBtg('chip', U4).paddingBlock - (resolveBtg('chip', U4).slot - resolveBtg('chip', U4).lineHeight) / 2) < 1e-6);
  assert.deepEqual(resolveControl({ unit: 2 }).contents, { paddingInline: 2, paddingBlock: 0, lineHeight: 12, minSize: 12 });
  assert.equal(c.height, c.slot + 2 * c.padding);
});

test('button label padding: 1u beside a slot, 2u where a side has no slot', () => {
  assert.deepEqual(resolveButtonContents(false, false, U4), { start: 8, end: 8 });
  assert.deepEqual(resolveButtonContents(true, false, U4), { start: 4, end: 8 });
  assert.deepEqual(resolveButtonContents(false, true, U4), { start: 8, end: 4 });
  assert.deepEqual(resolveButtonContents(true, true, U4), { start: 4, end: 4 });
});

test('text run: 0.5u between text parts, 1u beside a slot, 2u at a bare edge', () => {
  assert.deepEqual(resolveTextRun({}, U4), { contents: { start: 8, end: 8 } });
  assert.deepEqual(resolveTextRun({ leading: true, prefix: true, suffix: true, trailing: true }, U4), {
    prefix: { start: 4, end: 2 }, contents: { start: 2, end: 2 }, suffix: { start: 2, end: 4 },
  });
  assert.deepEqual(resolveTextRun({ suffix: true }, U4), { contents: { start: 8, end: 2 }, suffix: { start: 2, end: 8 } });
  assert.deepEqual(resolveTextRun({ leading: true, prefix: true, contents: false }, U4), { prefix: { start: 4, end: 8 } });
  // Matches the older two-flag rule when there are no adornments.
  for (const [l, t] of [[false, false], [true, false], [false, true], [true, true]])
    assert.deepEqual(resolveTextRun({ leading: l, trailing: t }, U4).contents, resolveButtonContents(l, t, U4));
});

test('icon sizes: sm = font − 0.5u, md = font + 0.5u, lg = font + 1.5u, fill = slot', () => {
  assert.deepEqual((['sm', 'md', 'lg', 'fill'] as const).map((iconSize) => resolveControl({ unit: 4, iconSize }).iconSize), [12, 16, 20, 24]);
  // At u=2 the slot is 12px: md (13) and lg (15) cap at the slot so the control stays 16px.
  assert.deepEqual((['sm', 'md', 'lg', 'fill'] as const).map((iconSize) => resolveControl({ unit: 2, iconSize }).iconSize), [11, 12, 12, 12]);
  assert.equal(resolveControl({ unit: 2.5, iconSize: 'lg' }).iconSize, 15, 'lg caps below u≈2.9');
  assert.equal(resolveControl({ unit: 3, iconSize: 'lg' }).iconSize, 17.5, 'uncapped from u=3');
});

test('border is spent inside the padding, never added to height', () => {
  const a = resolveControl({ unit: 4, border: 0 }), b = resolveControl({ unit: 4, border: 2 });
  assert.equal(a.height, b.height);
  assert.equal(b.padding, 2);
  assert.throws(() => resolveControl({ unit: 2, border: 1.5 }), RangeError, 'B > u/2 rejected');
});

test('curvature: soft 3u, capped at half height, scaled', () => {
  assert.equal(resolveControl(U4).radius, 12);
  assert.equal(resolveControl({ unit: 2, radiusScale: 3 }).radius, 8, 'cap = 16/2');
  assert.equal(resolveControl({ unit: 4, radiusScale: 0 }).radius, 0);
});

test('fields and select trigger use button geometry: text where a button label sits', () => {
  const f = resolveField({ unit: 4, border: 1 });
  assert.deepEqual([f.paddingStart, f.paddingEnd], [3 + 8, 3 + 8], 'padding + 2u, as a slotless button label');
  const t = resolveSelectTrigger({ unit: 4, border: 1 });
  assert.deepEqual([t.paddingStart, t.valueGap, t.chevronSlot, t.paddingEnd, t.chevronIcon], [11, 4, 24, 3, 12], 'button with a trailing slot');
  const b = resolveButtonContents(false, true, { unit: 4, border: 1 });
  assert.equal(t.paddingStart, f.padding + b.start);
});

test('composite: 0.5u padding level; a control: the control radius, options R − D; one-row segmented is always 8u', () => {
  const c = resolveComposite({ unit: 4, border: 1 });
  assert.equal(c.edge, 2);
  assert.equal(c.padding, 1);
  assert.equal(c.child.height, 28);
  assert.equal(c.radius, 12, 'composite is a control: the 3u control radius');
  assert.equal(c.child.radius, 10, 'options split the difference: 12 - 2');
  assert.equal(resolveComposite({ unit: 4, radiusScale: 2, container: true }).radius, 16, 'the control radius caps at 4u, like a button');
  assert.equal(resolveComposite({ unit: 4, radiusScale: 0 }).child.radius, 0, 'square at s = 0');
  for (const unit of SIZES) for (const border of [0, 1]) {
    if (border > unit / 2) continue;
    assert.equal(resolveComposite({ unit, border }).rowHeight, 8 * unit, `row = 8u at u=${unit} B=${border}`);
  }
  assert.equal(resolveComposite({ unit: 4, gap: 0 }).gap, 0, 'gap override the gap');
});

test('containers: wrappers concentric with their controls, card radius = padding, area square', () => {
  const at4 = Object.fromEntries((['group', 'collection', 'card-xs', 'card-sm', 'card-md', 'card-lg', 'card-xl', 'panel', 'region', 'page'] as const).map((l) => {
    const c = resolveContainer(l, { unit: 4, border: 0 });
    return [l, [c.padding, c.gap, c.radius]];
  }));
  assert.deepEqual(at4, {
    group: [4, 4, 16], collection: [8, 8, 20],
    'card-xs': [8, 8, 8], 'card-sm': [12, 12, 12], 'card-md': [16, 16, 16], 'card-lg': [20, 20, 20], 'card-xl': [24, 24, 24],
    panel: [24, 24, 0], region: [32, 32, 0], page: [32, 32, 0],
  });
  for (const [l, c] of Object.entries(CONTAINERS)) {
    const want = c.family === 'area' ? 0 : c.family === 'composite' ? 3 : c.family === 'container' ? c.padding : 3 + c.padding;
    assert.equal(c.maxRadius, want, `${l} (${c.family}) max radius`);
  }
  assert.deepEqual(CARD_PADDINGS.map((p) => CONTAINERS[`card-${p}`].padding), [2, 3, 4, 5, 6], 'card xs…xl = 2…6u');
  assert.equal(resolveContainer('card-md', { unit: 4, radiusScale: 0.5 }).radius, 8, 'card: the padding × the corner scale');
  assert.equal(resolveContainer('card-md', { unit: 4, radiusScale: 3 }).radius, 16, 'card: never rounder than its padding');
  assert.equal(resolveContainer('collection', { unit: 4, radiusScale: 1 }).radius, 12 + 8, 'wrapper: concentric with its controls');
  assert.equal(resolveContainer('card-md', { unit: 4, radiusScale: 3, surface: true }).radius, 16, 'a surface (toast, popover, dialog) stays at most its padding');
  assert.equal(resolveContainer('card-md', { unit: 4, radiusScale: 0.5, surface: true }).radius, 8, 'the corner scale lowers a surface');
  // Concentric: the control radius (min(3u·s, 4u)) + the padding, at every scale; square at s = 0.
  assert.equal(resolveContainer('group', { unit: 4, radiusScale: 0.5 }).radius, 6 + 4, 'group at s = 0.5');
  assert.equal(resolveContainer('collection', { unit: 4, radiusScale: 2 }).radius, 16 + 8, 'collection at s = 2: the 4u control cap + 2u');
  assert.equal(resolveContainer('group', { unit: 4, radiusScale: 0 }).radius, 0, 'square at s = 0');
  // Radius magnitude t: R = t × the concentric radius; the attribute wins over the theme factor.
  assert.equal(resolveContainer('collection', { unit: 4, radiusScale: 3, radius: 0.25 }).radius, 0.25 * (16 + 8), 'sharper than pill contents');
  assert.equal(resolveContainer('card-md', { unit: 4, radiusFactor: 0.5 }).radius, 8, 'card: t × the padding');
  assert.equal(resolveContainer('card-md', { unit: 4, radius: 2.5 }).radius, 40, 'a card can be rounder than it is deep');
  assert.throws(() => resolveContainer('card-md', { radius: 5 }), /0\.\.4/);
  assert.ok(RADIUS_FACTORS.includes(3.3) && RADIUS_FACTORS.at(-1) === 4, 'the radius attribute has a rule for every step a card can take');
  assert.equal(resolveContainer('group', { unit: 4, radius: 1, radiusFactor: 0 }).radius, 16, 'attribute over theme');
  assert.equal(resolveContainer('panel', { unit: 4, radius: 0.5 }).radius, 0, 'areas stay square');
  assert.throws(() => resolveContainer('group', { radius: 2 }), /0\.\.1/);
  const card = resolveContainer('card-md', { unit: 5, gap: 2 });
  assert.deepEqual([card.padding + card.border, card.gap], [20, 10], '<ui-card size="5" gap="2">');
  assert.equal(resolveContainer('group', { unit: 4, height: 20 }).radius, 10, 'half-height cap');
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
  const chip = resolveBtg('chip', { unit: 4, border: 1 }), tag = resolveBtg('tag', { unit: 4, border: 1 }), badge = resolveBtg('badge', { unit: 4, border: 1 });
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
  const c = resolveControl(U4);
  assert.equal(c.radius, c.inset + c.slot / 3);
  assert.equal(resolveBtg('chip', { unit: 4, radiusScale: 3 }).radius, 12, 'pill at height / 2');
});

test('badge / tag / chip label wrapper: 1u′ (chip bare edge 1.5u′), u′ = height / 8', () => {
  for (const kind of ['chip', 'tag', 'badge'] as const) for (const u of [2, 3, 4, 6]) {
    const k = resolveBtg(kind, { unit: u }), lu = k.height / 8;
    assert.deepEqual([k.localUnit, k.bareEdge, k.slotEdge, k.between], [lu, kind === 'chip' ? 1.5 * lu : lu, lu, lu / 4], `${kind} u=${u}`);
    assert.equal(k.padding, Math.max(0, lu / 2));
  }
});


test('range: inset thumb (track − u, 0.5u) and a fill cap concentric around it at every value', () => {
  const t = resolveTrack('range', U4), W = 200;
  assert.deepEqual([t.track, t.thumb, t.thumbInset, t.thumbRadius], [16, 12, 2, 6]);
  for (const p of [0, 0.25, 0.5, 1]) {
    const center = thumbOffset(p, W, U4) + t.thumb / 2;
    assert.equal(trackFill('range', p, W, U4) - center, t.track / 2, `fill ends one track radius past the thumb center at ${p}`);
  }
  assert.equal(trackFill('range', 1, W, U4), W);
  assert.equal(trackFill('progress', 0.5, W, U4), 100);
});

test('range pair: the fill starts one track radius before the first thumb center and ends one past the second', () => {
  const t = resolveTrack('range', U4), W = 200;
  for (const [a, b] of [[0, 0], [0.25, 0.75], [0.5, 0.5], [0, 1]]) {
    const f = trackPairFill(a, b, W, U4);
    assert.equal(thumbOffset(a, W, U4) + t.thumb / 2 - f.offset, t.track / 2, `start cap at ${a}`);
    assert.equal(f.offset + f.width - (thumbOffset(b, W, U4) + t.thumb / 2), t.track / 2, `end cap at ${b}`);
  }
  assert.deepEqual(trackPairFill(0, 0.4, W, U4), { offset: 0, width: trackFill('range', 0.4, W, U4) }, 'r0 = 0 is the one-thumb fill');
});

test('the default unit is 4.5px everywhere: 36px controls, 14.5px control text', async () => {
  const { GEOMETRY_DEFAULTS } = await import('../tokens/geometry/resolve.ts');
  const { TYPE_DEFAULTS } = await import('../tokens/typography/resolve.ts');
  const { PARAMS: THEME_PARAMS } = await import('../tokens/themes/params.ts');
  assert.equal(GEOMETRY_DEFAULTS.unit, 4.5);
  assert.equal(TYPE_DEFAULTS.unit, 4.5);
  assert.equal((THEME_PARAMS as any).unit.default, 4.5);
  assert.equal(resolveControl().height, 36);
  assert.equal(resolveControl().fontSize, 14.5);
});

test('Panda spacing, sizes and radii are in u and recompute in sized subtrees', async () => {
  const { spacing, radii, unitTokenVars } = await import('../tokens/geometry/index.ts');
  const { geometry } = await import('../styles/geometry.ts');
  assert.equal((spacing as any)[8].value, 'calc(8 * var(--ui-unit) * 1px)');
  assert.match((spacing as any).inset.page.value, /var\(--ui-pad-page\).*var\(--ui-border\)/);
  assert.match((radii as any).md.value, /1\.5 \* var\(--ui-unit\) \* var\(--ui-radius-scale\)/);
  const vars = unitTokenVars();
  for (const name of ['--spacing-8', '--spacing-0\\.5', '--spacing-gap-card-md', '--sizes-6', '--radii-lg', '--font-sizes-sm']) assert.ok(name in vars, name);
  assert.deepEqual((geometry as any)[':where([size], [data-size], [density], [data-density])'], vars);
});

test('swiper: 8u round paddles inset 2u; 2u dots (active 4u) in 4u hit areas, u apart, 2u above the bottom', () => {
  assert.deepEqual(resolveSwiper({ unit: 4 }), { paddle: 32, paddleInset: 8, paddleRadius: 16, dot: 8, dotActive: 16, dotRadius: 4, dotHit: 16, dotsGap: 4, dotsInset: 8 });
});

test('image: height = width / ratio for presets and custom w/h, none for no or an invalid ratio; square frame', () => {
  assert.equal(resolveImage({ ratio: 'wide', width: 160 }).height, 90);
  assert.equal(resolveImage({ ratio: '3/2', width: 150 }).height, 100);
  assert.equal(resolveImage({ ratio: 'evil;', width: 160 }).height, null);
  assert.equal(resolveImage({ width: 160 }).height, null);
  assert.equal(resolveImage({ ratio: 'square' }).radius, 0);
  assert.equal(IMAGE_RATIOS.story, 9 / 16);
  assert.equal(resolveImage({ unit: 3, ratio: 'wide' }).slideshow.paddle, 24);
});

test('field rows: column gap 2u, row gap 1.5u stacked / 1u inline, readout ≥ 10u; grid gaps 2u, 4u above a heading', () => {
  assert.deepEqual(resolveFieldRow('stacked', { unit: 4 }), { unit: 4, columnGap: 8, rowGap: 6, unitGap: 4, readoutMinWidth: 40 });
  assert.deepEqual(resolveFieldRow('inline', { unit: 4 }), { unit: 4, columnGap: 8, rowGap: 4, unitGap: 8, readoutMinWidth: 40 });
  assert.deepEqual(resolveFieldGrid({ unit: 4 }), { unit: 4, columnGap: 8, rowGap: 8, labelMaxFraction: 0.4, readoutMinWidth: 40, headingSpace: 16 });
});

// Choice groups (geometry:choice-group). Imports are hoisted; kept beside the test for merge-friendly appends.
import { resolveChoiceGroup } from '../tokens/geometry/resolve.ts';
test('choice groups: 6u rows 1u apart (7u pitch); horizontal 4u between choices, 1u between lines; the gap attribute wins', () => {
  assert.deepEqual(resolveChoiceGroup('vertical', U4), { unit: 4, rowHeight: 24, gap: 4, rowGap: 4, columnGap: 0, pitch: 28 });
  assert.deepEqual(resolveChoiceGroup('horizontal', U4), { unit: 4, rowHeight: 24, gap: 16, rowGap: 4, columnGap: 16, pitch: 28 });
  assert.equal(resolveChoiceGroup('vertical', { unit: 4, gap: 2 }).gap, 8);
  assert.equal(resolveChoiceGroup('horizontal', { unit: 4, gap: 2 }).columnGap, 8);
});

// Fieldset (geometry:fieldset).
import { resolveFieldset } from '../tokens/geometry/resolve.ts';
test('fieldset: the collection gap (2u; theme gapUnits and the gap attribute win), no box', () => {
  assert.deepEqual(resolveFieldset(U4), { unit: 4, gap: 8, padding: 0, border: 0, radius: 0 });
  assert.equal(resolveFieldset({ unit: 4, gapUnits: 3 }).gap, 12);
  assert.equal(resolveFieldset({ unit: 4, gapUnits: 3, gap: 1 }).gap, 4);
});

test('disclosure: the collapsible trigger is an 8u control row with a sm caret; the panel starts at its label edge (3u), 2u below', () => {
  const d = resolveDisclosure({ unit: 4, border: 1 });
  assert.equal(d.height, 32);
  assert.equal(d.padding, 3, 'u - B');
  assert.deepEqual([d.labelStart, d.labelEnd], [8, 4]);
  assert.equal(d.caret, 12, 'icon sm = font - 0.5u');
  assert.equal(d.radius, 12);
  assert.equal(d.panelInline, 12, 'border + padding + bare label edge');
  assert.equal(d.panelBlockEnd, 8);
  assert.equal(resolveDisclosure({ unit: 2 }).caret, 11, 'sm below the 6u slot at u = 2');
  // Accordion: a 1px (thin token) divider outside the padding, the same at every B.
  assert.equal(d.divider, 1);
  assert.equal(d.itemHeight, 33);
  assert.equal(resolveDisclosure({ unit: 4, border: 0 }).itemHeight, d.itemHeight);
});

test('disclosure: segmented tabs are 7u composite options in an 8u list; underline tabs are 8u rows with a 0.5u bar on a 1px track', () => {
  const s = resolveTabs('segmented', { unit: 4, border: 1 });
  assert.deepEqual([s.listHeight, s.listEdge, s.listPadding, s.listGap, s.tabHeight, s.tabRadius, s.indicatorRadius, s.gap], [32, 2, 1, 2, 28, 10, 10, 8]);
  assert.equal(resolveTabs('segmented', { unit: 4, border: 0 }).listHeight, 32, 'one row stays 8u at any B');
  assert.equal(s.listRadius, 12, 'the control radius, min(3u·s, 4u)');
  const n = resolveTabs('underline', { unit: 4, border: 1 });
  assert.deepEqual([n.listHeight, n.tabHeight, n.tabPadding, n.listGap, n.indicatorThickness, n.indicatorRadius, n.track, n.labelStart], [32, 32, 3, 0, 2, 1, 1, 8]);
});

test('toast: a card-sm container (padding 3u - B, radius 3u x min(1, s)) with an 8u action and a 6u close, in an 80u viewport', () => {
  const t = resolveToast({ unit: 4, border: 1 });
  assert.deepEqual([t.padding, t.edge, t.radius, t.width, t.margin, t.gap, t.peek, t.columnGap, t.textGap], [11, 12, 12, 320, 16, 8, 8, 4, 2]);
  assert.deepEqual([t.actionHeight, t.actionPadding, t.actionLabel, t.actionRadius, t.close, t.closeRadius, t.closeIcon], [32, 3, 8, 12, 24, 12, 12]);
  assert.equal(resolveToast({ unit: 4, radiusScale: 2 }).radius, 12, 'never rounder than its edge');
  assert.equal(resolveToast({ unit: 4, radiusScale: 0.5 }).radius, 6);
  assert.equal(resolveToast({ unit: 4, padUnits: 4 }).padding, 16, 'pad-card-sm follows the theme');
});

// Form (geometry:form).
import { resolveForm } from '../tokens/geometry/resolve.ts';
test('form: the collection gap (2u; theme gapUnits and the gap attribute win), no box', () => {
  assert.deepEqual(resolveForm({ unit: 4 }), { unit: 4, gap: 8, padding: 0, border: 0, radius: 0 });
  assert.equal(resolveForm({ unit: 4, gapUnits: 3 }).gap, 12);
  assert.equal(resolveForm({ unit: 4, gapUnits: 3, gap: 1 }).gap, 4);
});

// Scroll area (geometry:scroll-area).
import { resolveScrollArea } from '../tokens/geometry/resolve.ts';
import { resolveCombobox } from '../tokens/geometry/resolve.ts';
test('scroll area: a 2u track, the thumb u thick 0.5u inside it, at least 4u long, pill radii, a 2u corner', () => {
  assert.deepEqual(resolveScrollArea({ unit: 4 }), { unit: 4, thickness: 8, inset: 2, thumb: 4, thumbMin: 16, trackRadius: 4, thumbRadius: 2, corner: 8 });
  assert.equal(resolveScrollArea({ unit: 4, radiusScale: 0 }).thumbRadius, 0);
  assert.equal(resolveScrollArea({ unit: 6, radiusScale: 0.1 }).thumbRadius, 1.8);
});

test('combobox: the select trigger row with 6u clear and trigger slots, 6u chips that wrap, the composite popup', () => {
  const g = resolveCombobox({ unit: 4, border: 1 });
  assert.deepEqual([g.height, g.padding, g.inputStart, g.inputEnd, g.inputBareEnd, g.triggerSlot, g.triggerIcon, g.clearSlot], [32, 3, 8, 4, 8, 24, 12, 24]);
  assert.deepEqual([g.chipHeight, g.chipRadius, g.chipLabelStart, g.chipRemove, g.chipGap, g.rowGap, g.afterChip], [24, 8, 4, 24, 2, 2, 2]);
  assert.equal(g.rowHeight(1), 32);
  assert.equal(g.rowHeight(2), 58, '8u + a 6u chip line + 0.5u');
  assert.deepEqual([g.popupOffset, g.popupEdge, g.optionHeight, g.emptyInline, g.emptyHeight], [4, 2, 28, 10, 28]);
  assert.equal(resolveCombobox({ unit: 4, border: 0 }).height, 32, 'the row is 8u at any B');
  assert.equal(resolveCombobox({ unit: 2, radiusScale: 0 }).chipRadius, 0);
});

test('dialog: the popup is a card-xl container (6u padding inside B, radius = padding), parts 2u apart, 96u wide within a 4u viewport margin', () => {
  const d = resolveDialog({ unit: 4, border: 1 });
  assert.deepEqual([d.padding, d.edge, d.radius, d.gap, d.actionsGap, d.margin, d.width], [23, 24, 24, 8, 8, 16, 384]);
  assert.equal(resolveDialog({ unit: 4, radiusScale: 2 }).radius, 24, 'the corner scale lowers, never raises, a container radius');
  assert.equal(resolveDialog({ unit: 4, radiusScale: 0.5 }).radius, 12);
  assert.equal(resolveDialog({ unit: 4, padUnits: 5 }).padding, 20, 'pad-card-xl is a theme parameter');
  assert.equal(resolveDialog({ unit: 4, gap: 3 }).gap, 12, 'the gap attribute wins');
  const narrow = resolveDialog({ unit: 4, viewport: { width: 360, height: 640 } });
  assert.deepEqual([narrow.width, narrow.maxHeight], [328, 608], 'viewport less 4u each side');
});

test('drawer: an area-level sheet (6u panel padding inside B, square, parts 2u apart); side sheets 80u wide, top and bottom full width, 8u of the viewport kept', () => {
  const r = resolveDrawer('right', { unit: 4, border: 1, viewport: { width: 1280, height: 800 } });
  assert.deepEqual([r.padding, r.edge, r.radius, r.gap, r.width, r.height, r.reserve], [23, 24, 0, 8, 320, 800, 32]);
  assert.equal(resolveDrawer('left', { unit: 4, viewport: { width: 300, height: 800 } }).width, 268, 'at most the viewport less 8u');
  const b = resolveDrawer('bottom', { unit: 4, radiusScale: 2, viewport: { width: 1280, height: 800 } });
  assert.deepEqual([b.width, b.maxHeight, b.radius], [1280, 768, 0], 'square at any corner scale');
  assert.equal(resolveDrawer('top', { unit: 4, padUnits: 4 }).padding, 16, 'pad-panel is a theme parameter');
});

test('menu: an 8u trigger; the popup is a composite 1u away; items are 7u composite options; separators 0.5u apart', () => {
  const m = resolveMenu({ unit: 4, border: 1 });
  assert.deepEqual([m.triggerHeight, m.triggerPadding, m.triggerRadius, m.offset], [32, 3, 12, 4]);
  assert.deepEqual([m.popupEdge, m.popupPadding, m.popupGap, m.popupRadius], [2, 1, 2, 12]);
  assert.deepEqual([m.itemHeight, m.itemInset, m.itemPadding, m.itemRadius, m.labelStart, m.labelBesideSlot], [28, 2, 1, 10, 8, 4]);
  assert.deepEqual([m.separator, m.separatorMargin, m.slot], [1, 2, 24]);
  assert.equal(resolveMenu({ unit: 4, border: 0 }).itemHeight, 28, 'items stay 7u at any B');
});

test('menu: a menubar is an 8u composite row of 7u composite-option triggers; its radius is the control radius', () => {
  const b = resolveMenubar({ unit: 4, border: 1 });
  assert.deepEqual([b.rowHeight, b.edge, b.padding, b.gap, b.radius, b.triggerHeight, b.triggerPadding, b.triggerRadius, b.labelStart, b.offset], [32, 2, 1, 2, 12, 28, 1, 10, 8, 4]);
  assert.equal(resolveMenubar({ unit: 4, border: 0 }).rowHeight, 32, 'one row stays 8u at any B');
  assert.equal(resolveMenubar({ unit: 4, radiusScale: 2 }).radius, 16, 'the 4u control cap');
  assert.equal(resolveMenubar({ unit: 4, radiusScale: 2, vertical: true }).radius, 16, 'vertical too: a composite is a control');
});

test('popup: 1u offset, a 2u × 1u arrow; the popover is a card-sm with the group gap, capped at 80u', () => {
  const p = resolvePopup('popover', { unit: 4, border: 1 });
  assert.deepEqual([p.offset, p.arrowWidth, p.arrowHeight], [4, 8, 4]);
  assert.equal(p.paddingBlock, 11, '3u - B');
  assert.equal(p.radius, 12);
  assert.equal(p.gap, 4, 'group gap 1u');
  assert.equal(resolvePopup('popover', { unit: 4, gap: 2 }).gap, 8, 'the gap attribute wins');
  assert.equal(p.maxWidth, 320);
  assert.equal(resolvePopup('popover', { unit: 4, radiusScale: 2 }).radius, 12, 'never above the padding');
  assert.equal(p.minWidthAnchor, true);
});

test('popup: a tooltip is a 7u text row (0.5u edge, 2u ends), radius min(3u·s, 3.5u), capped at 60u, not trigger-wide', () => {
  const t = resolvePopup('tooltip', { unit: 4, border: 1 });
  assert.equal(t.height, 28);
  assert.equal(t.lineHeight, 16.8);
  assert.equal(t.paddingBlock + t.border + t.lineHeight / 2, 14, 'the text centered in the 7u row');
  assert.equal(t.paddingInline, 7, '2u - B');
  assert.equal(t.radius, 12);
  assert.equal(resolvePopup('tooltip', { unit: 4, radiusScale: 3 }).radius, 14, 'capped at half the row');
  assert.equal(t.maxWidth, 240);
  assert.equal(t.minWidthAnchor, false);
});

test('popup: a preview card is a card-md with the collection gap, capped at 80u', () => {
  const c = resolvePopup('preview-card', { unit: 4, border: 1 });
  assert.deepEqual([c.paddingBlock, c.paddingInline, c.radius, c.gap, c.maxWidth, c.offset], [15, 15, 16, 8, 320, 4]);
  assert.equal(resolvePopup('preview-card', { unit: 4, radiusScale: 0.5 }).radius, 8);
});

test('navigation menu: an 8u composite list of 7u triggers and links with a sm caret; the popup a composite container', () => {
  const n = resolveNavigationMenu({ unit: 4, border: 1 });
  assert.deepEqual([n.listHeight, n.listEdge, n.listPadding, n.listGap], [32, 2, 1, 2]);
  assert.deepEqual([n.itemHeight, n.itemPadding, n.itemRadius], [28, 1, 10]);
  assert.deepEqual([n.labelStart, n.labelEnd, n.caret, n.offset], [8, 4, 12, 4]);
  assert.deepEqual([n.popupEdge, n.popupPadding, n.popupRadius, n.linkHeight, n.linkRadius], [2, 1, 12, 28, 10]);
});

test('density: compact, default, loose change insets and the ladder, never type, slots or icons', () => {
  const at = (density: 'compact' | 'default' | 'loose') => resolveControl({ unit: 4, density });
  assert.deepEqual(['compact', 'default', 'loose'].map((d) => at(d as any).height), [28, 32, 40], 'controls 7u, 8u, 10u');
  assert.deepEqual(['compact', 'default', 'loose'].map((d) => at(d as any).padding), [2, 4, 8], 'inset 0.5u, 1u, 2u');
  for (const d of ['compact', 'loose'] as const) {
    assert.equal(at(d).fontSize, at('default').fontSize, `${d}: the font stays`);
    assert.equal(at(d).slot, at('default').slot, `${d}: the 6u slot stays`);
    assert.equal(at(d).iconSize, at('default').iconSize, `${d}: icons stay`);
    for (const unit of SIZES) for (const border of [0, 1]) {
      if (border > unit / 2) continue;
      // The composite and its option each keep their own edge (≥ B), so where the compact inset cannot hold both the row grows (6u + 4B).
      const c = resolveControl({ unit, border, density: d });
      assert.equal(resolveComposite({ unit, border, density: d }).rowHeight, Math.max(c.height, c.slot + 4 * border), `${d} u=${unit} B=${border}: one composite row is the control height`);
    }
  }
  assert.deepEqual(['compact', 'default', 'loose'].map((d) => resolveContainer('card-md', { unit: 4, density: d as any }).padding), [8, 16, 24], 'the ladder × 0.5, 1, 1.5');
  assert.equal(resolveContainer('card-md', { unit: 4, density: 'loose', gap: 2 }).gap, 8, 'an explicit gap attribute is taken as written');
  assert.equal(resolveBtg('chip', { unit: 2, density: 'compact' }).height, 14, 'a chip is never taller than a compact control');
  assert.equal(resolveControl({ unit: 4, radiusScale: 3, density: 'compact' }).radius, 14, 'the radius cap is half the compact height');
  assert.throws(() => resolveControl({ density: 'tight' as any }), /density/);
});

test('attached (inset none): no edge but the border, no gap, square children with outer corners; thumbs fill the track', () => {
  for (const border of [0, 1]) for (const density of ['compact', 'default', 'loose'] as const) {
    const c = resolveComposite({ unit: 4, border, density, inset: 'none' }), ctl = resolveControl({ unit: 4, border, density });
    assert.equal(c.edge, border);
    assert.equal(c.gap, 0);
    assert.equal(c.child.radius, 0);
    assert.equal(c.child.outerRadius, Math.max(0, c.radius - c.edge));
    assert.equal(c.rowHeight, Math.max(ctl.height, ctl.slot + 4 * border), `B=${border} ${density}: one row is the control height`);
  }
  const t = resolveTrack('range', { unit: 4, inset: 'none' });
  assert.deepEqual([t.thumb, t.thumbInset, t.thumbRadius], [16, 0, t.trackRadius]);
  const s = resolveChoice('switch', { unit: 4, border: 1, inset: 'none' });
  assert.deepEqual([s.thumb, s.thumbInset, s.thumbTravel], [18, 1, 16]);
  assert.equal(resolveChoice('switch', { unit: 4 }).thumbTravel, 16, 'inset switch travels 4u too');
});

test('universal container: an area inside the chain restarts it', async () => {
  const { resolveContainerTree, resolveContainer } = await import('../tokens/geometry/resolve.ts');
  const g = { unit: 4 };
  const t = resolveContainerTree({ preset: 'card', children: [{ preset: 'panel', children: [{ preset: 'card', padding: 'lg' }] }] }, g);
  const inner = t.children[0].children[0];
  assert.equal(inner.radius, resolveContainer('card-lg', g).radius);
  assert.equal(inner.edge, resolveContainer('card-lg', g).edge);
});

test('universal container: padding is the input and radius follows; unpainted wrappers add no inset', async () => {
  const { resolveContainerTree, resolveContainer } = await import('../tokens/geometry/resolve.ts');
  const g = { unit: 4 };
  const lone = resolveContainerTree({ preset: 'card' }, g);
  assert.deepEqual([lone.radius, lone.edge], [resolveContainer('card-md', g).radius, resolveContainer('card-md', g).edge], 'a lone card is unchanged');
  const held = resolveContainerTree({ preset: 'card', children: [{ preset: 'group' }] }, g);
  assert.equal(held.edge, lone.edge, 'holding a wrapper does not cost a card its padding');
  const t = resolveContainerTree({ preset: 'card', children: [{ preset: 'card', children: [{ preset: 'card' }] }] }, g);
  assert.deepEqual([t.edge, t.children[0].edge, t.children[0].children[0].edge], [16, 12, 12], 'cards step down the ladder to 3u');
  assert.deepEqual([t.radius, t.children[0].radius], [16, 16 * 0.4], 'with no room for a concentric curve, the parent × k');
  const near = (node: { children: { radius: number }[] }) => Math.round(node.children[0].radius);
  assert.equal(near(resolveContainerTree({ preset: 'card', padding: 'sm', radius: 3.33, children: [{ preset: 'collection', surface: 'panel' }] }, g)), 28, 'r 40, p 12: concentric at 28');
  assert.equal(near(resolveContainerTree({ preset: 'card', padding: 'xl', radius: 1.67, children: [{ preset: 'collection', surface: 'panel' }] }, g)), 16, 'r 40, p 24: concentric at 16');
  assert.equal(t.children[0].gap, 12, 'a nested card gaps at its padding');
  const small = resolveContainerTree({ preset: 'card', padding: 'xs', children: [{ preset: 'card' }] }, g);
  assert.equal(small.children[0].edge, 8, 'a nested card is never deeper than its parent');
  const set = resolveContainerTree({ preset: 'card', children: [{ preset: 'card', padding: 'xs' }] }, g);
  assert.equal(set.children[0].edge, 8, 'a padding attribute wins');
  const w = resolveContainerTree({ preset: 'card', children: [{ preset: 'collection', children: [{ preset: 'card', children: [{ preset: 'group' }] }] }] }, g);
  const wrap = w.children[0], card = wrap.children[0];
  assert.deepEqual([wrap.edge, wrap.padding, wrap.gap], [0, 0, 8], 'an unpainted wrapper has no inset and keeps its gap');
  assert.deepEqual([card.radius, card.edge], [16 * 0.4, 12], 'and passes its parent through');
  const painted = resolveContainerTree({ preset: 'group', surface: 'panel' }, g);
  assert.equal(painted.edge, resolveContainer('group', g).edge, 'a painted wrapper keeps its padding');
  const top = resolveContainerTree({ preset: 'collection', children: [{ preset: 'card' }] }, g);
  assert.deepEqual([top.children[0].radius, top.children[0].edge], [lone.radius, lone.edge], 'a card under an unpainted root is a root');
  const area = resolveContainerTree({ preset: 'page', children: [{ preset: 'card' }] }, g);
  assert.equal(area.radius, 0, 'areas are square');
  assert.deepEqual([area.children[0].radius, area.children[0].edge], [lone.radius, lone.edge], 'and restart the chain');
});
