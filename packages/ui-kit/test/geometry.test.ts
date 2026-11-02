import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveControl, resolveComposite, resolveLabelEdges, resolveSelectTrigger, type Size } from '../tokens/geometry/resolve.ts';

const SIZES: Size[] = ['sm', 'md', 'lg'];

test('control golden values at u=4, B=0 (Differential Forms compact/default/loose)', () => {
  assert.deepEqual(SIZES.map((size) => resolveControl({ size, border: 0 }).height), [28, 32, 40]);
  assert.deepEqual(SIZES.map((size) => resolveControl({ size }).gap), [0, 4, 8]);
  for (const size of SIZES) {
    const c = resolveControl({ size });
    assert.equal(c.slot, 24, 'slot is size-independent');
    assert.equal(c.fontSize, 14, 'text is size-independent');
    assert.equal(c.lineHeight, 20);
    assert.equal(c.labelEdge, 6, 'label edge is size-independent');
  }
});

test('border is spent inside the inset, never added to height', () => {
  const a = resolveControl({ border: 0 }), b = resolveControl({ border: 2 });
  assert.equal(a.height, b.height);
  assert.equal(b.padding, b.inset - 2);
  assert.throws(() => resolveControl({ border: 3 }), RangeError, 'B > u/2 rejected');
});

test('curvature: soft 3u, capped at half height, scaled by radius-scale', () => {
  assert.equal(resolveControl().radius, 12);
  assert.equal(resolveControl({ size: 'sm', radiusScale: 3 }).radius, 14, 'cap = 28/2');
  assert.equal(resolveControl({ radiusScale: 0 }).radius, 0);
});

test('label edges: buttons double the opposite edge, text fields do not', () => {
  assert.deepEqual(resolveLabelEdges(6, false, false), { start: 6, end: 6 });
  assert.deepEqual(resolveLabelEdges(6, true, false), { start: 0, end: 12 });
  assert.deepEqual(resolveLabelEdges(6, true, false, false), { start: 0, end: 6 });
  const t = resolveSelectTrigger();
  assert.deepEqual([t.paddingStart, t.paddingEnd], [3 + 6, 3]);
});

test('composite: default Q=0.5u keeps a one-row segmented control at control height', () => {
  const c = resolveComposite();
  assert.equal(c.edge, 2);
  assert.equal(c.child.height, 28);
  assert.equal(c.rowHeight, 32);
  assert.equal(c.rowHeight, resolveControl().height);
  assert.equal(c.child.radius, 10, 'parent 12 minus edge 2');
});

test('composite grows instead of shrinking the slot under a tight budget', () => {
  const c = resolveComposite({ size: 'sm', border: 2, compositeInsetUnits: 1.5 });
  assert.equal(c.child.height, 28, 'child inset floors at B');
  assert.equal(c.rowHeight, 40, 'grows past the 28px control');
});

test('Q = 0 is an attached group: no gap, square children', () => {
  const c = resolveComposite({ compositeInsetUnits: 0, border: 0 });
  assert.equal(c.gap, 0);
  assert.equal(c.child.radius, 0);
  assert.equal(c.child.height, 32);
});
