// The floating layer foundation (dom/floating.ts, components/floating.react.ts, recipe-parts.ts
// anchoredPopup): placement, positioner variables, dismiss layer, focus scope, top layer.
import './setup.ts';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  anchorPositioning, applyPlacement, createDismissLayer, createFocusScope, createPositioner, isOutside, placeFloating,
  positionerVars, showTopLayer, hideTopLayer, tabbables, type DismissReason,
} from '../dom/floating.ts';
import { placePopup, popupVars } from '../dom/listbox.ts';
import { anchoredPopup, floatingPopup, sideOrigins } from '../components/recipe-parts.ts';

const VP = { width: 800, height: 600 };
const A = { top: 100, bottom: 140, left: 300, width: 200 };

test('placeFloating: sides, flip, alignment, clamping; placePopup is its bottom / start case', () => {
  const b = placeFloating(A, VP, { offset: 4 });
  assert.deepEqual([b.side, b.align, b.top, b.bottom, b.left], ['bottom', 'start', 144, undefined, 300]);
  assert.equal(b.transformOrigin, 'top center');
  // Little room below, more above: flips to top, anchored from the bottom inset.
  const f = placeFloating({ ...A, top: 520, bottom: 560 }, VP, { offset: 4 });
  assert.deepEqual([f.side, f.bottom, f.top, f.transformOrigin], ['top', 84, undefined, 'bottom center']);
  // Preferred top with room stays top.
  assert.equal(placeFloating({ ...A, top: 400, bottom: 440 }, VP, { side: 'top' }).side, 'top');
  // Alignment: end lines the popup's end up with the anchor's, center centers it.
  assert.equal(placeFloating(A, VP, { align: 'end', popup: { width: 300, height: 100 } }).left, 200);
  assert.equal(placeFloating(A, VP, { align: 'center', popup: { width: 300, height: 100 } }).left, 250);
  // Never narrower than the anchor, kept inside the viewport margin.
  assert.equal(placeFloating({ ...A, left: 700 }, VP).left, 592);
  // Inline sides: right of the anchor, flipped left when there is no room.
  const r = placeFloating(A, VP, { side: 'right', offset: 4, popup: { width: 100, height: 80 } });
  assert.deepEqual([r.side, r.left, r.top, r.transformOrigin, r.availableWidth], ['right', 504, 100, 'left center', 288]);
  const l = placeFloating({ ...A, left: 600 }, VP, { side: 'right', offset: 4, popup: { width: 100, height: 80 } });
  assert.deepEqual([l.side, l.right, l.left], ['left', 204, undefined]);
  // placePopup (the select popup) is the bottom / start placement with its gap as the offset.
  assert.deepEqual(placePopup(A, VP, 4), placeFloating(A, VP, { side: 'bottom', align: 'start', offset: 4 }));
  assert.equal(popupVars, positionerVars);
  assert.deepEqual(positionerVars(b), { '--anchor-width': '200px', '--anchor-height': '40px', '--available-width': '492px', '--available-height': '448px', '--transform-origin': 'top center' });
});

test('applyPlacement and the script positioner write insets, the variables and data-side', () => {
  const anchor = document.createElement('div'), popup = document.createElement('div');
  document.body.append(anchor, popup);
  applyPlacement(popup, placeFloating(A, VP, { offset: 4 }));
  assert.deepEqual([popup.style.top, popup.style.bottom, popup.style.left], ['144px', 'auto', '300px']);
  assert.equal(popup.style.getPropertyValue('--available-height'), '448px');
  let side = '';
  const p = createPositioner({ anchor: () => anchor, popup: () => popup, offset: () => 4, onSide: (s) => { side = s; }, script: true });
  p.start();
  assert.equal(p.running, true);
  assert.equal(side, 'bottom');
  assert.ok(popup.style.getPropertyValue('--anchor-width'), 'variables set from script');
  p.stop();
  assert.equal(p.running, false);
  assert.equal(typeof anchorPositioning(), 'boolean');
  anchor.remove(); popup.remove();
});

test('dismiss layer: outside press, Escape on the topmost only, focus-out, nesting, reasons', () => {
  const outer = document.createElement('div'), inner = document.createElement('div'), away = document.createElement('button');
  document.body.append(outer, inner, away);
  const log: string[] = [];
  const a = createDismissLayer({ inside: () => [outer], focusOut: true, onDismiss: (r: DismissReason) => log.push(`outer:${r}`) });
  const b = createDismissLayer({ inside: () => [inner], onDismiss: (r: DismissReason) => log.push(`inner:${r}`) });
  a.activate(); b.activate();
  assert.equal(b.topmost, true);
  // A press inside the nested (later) layer is not outside the outer one.
  inner.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
  assert.deepEqual(log, []);
  outer.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
  assert.deepEqual(log, ['inner:outside-press'], 'inside the outer layer is outside the inner one');
  log.length = 0;
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.deepEqual(log, ['inner:escape-key'], 'Escape goes to the topmost layer only');
  // A key the component already handled (defaultPrevented) dismisses nothing.
  log.length = 0;
  const handled = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
  handled.preventDefault();
  document.dispatchEvent(handled);
  assert.deepEqual(log, []);
  b.deactivate();
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
  assert.deepEqual(log, ['outer:escape-key']);
  log.length = 0;
  outer.dispatchEvent(new (window as any).FocusEvent('focusout', { bubbles: true, relatedTarget: away }));
  assert.deepEqual(log, ['outer:focus-out']);
  a.deactivate();
  away.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }));
  assert.deepEqual(log, ['outer:focus-out'], 'inactive layers do not listen');
  assert.equal(isOutside(away, [outer, inner]), true);
  assert.equal(isOutside(outer, [outer]), false);
  outer.remove(); inner.remove(); away.remove();
});

test('focus scope: moves focus in, traps Tab, returns focus', () => {
  const opener = document.createElement('button');
  const box = document.createElement('div');
  box.innerHTML = '<div tabindex="0" id="f1"></div><div tabindex="-1"></div><div tabindex="0" id="f2" hidden></div><div tabindex="0" id="f3"></div>';
  document.body.append(opener, box);
  opener.focus();
  assert.deepEqual(tabbables(box).map((e) => e.id), ['f1', 'f3']);
  const scope = createFocusScope(() => box, { trap: true });
  scope.activate();
  assert.equal(document.activeElement?.id, 'f1', 'focus moves to the first tabbable');
  box.querySelector<HTMLElement>('#f3')!.focus();
  const tab = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
  box.querySelector('#f3')!.dispatchEvent(tab);
  assert.equal(tab.defaultPrevented, true);
  assert.equal(document.activeElement?.id, 'f1', 'Tab wraps to the first');
  box.querySelector('#f1')!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true }));
  assert.equal(document.activeElement?.id, 'f3', 'Shift+Tab wraps to the last');
  scope.deactivate();
  assert.equal(document.activeElement, opener, 'focus returns to the opener');
  opener.remove(); box.remove();
});

test('top layer: popover="manual" unless declared', () => {
  const el = document.createElement('div');
  document.body.append(el);
  showTopLayer(el);
  assert.equal(el.getAttribute('popover'), 'manual');
  hideTopLayer(el);
  const auto = document.createElement('div');
  auto.setAttribute('popover', 'auto');
  showTopLayer(auto);
  assert.equal(auto.getAttribute('popover'), 'auto');
  el.remove();
});

test('anchoredPopup: position-area, flip, margin and variables by side and align', () => {
  const sel = anchoredPopup({ anchor: '--a' });
  assert.deepEqual(sel, {
    positionAnchor: '--a', positionArea: 'block-end span-inline-end', positionTryFallbacks: 'flip-block', positionTryOrder: 'most-block-size',
    '--anchor-width': 'anchor-size(width)', '--anchor-height': 'anchor-size(height)',
    '--available-width': '100%', '--available-height': 'calc(100% - var(--u))', marginBlockStart: 'var(--u)',
  });
  const r = anchoredPopup({ anchor: '--a', side: 'right', align: 'center' });
  assert.equal(r.positionArea, 'inline-end span-all');
  assert.equal(r.positionTryFallbacks, 'flip-inline');
  assert.equal(r.alignSelf, 'anchor-center');
  assert.equal(r.marginInlineStart, 'var(--u)');
  assert.equal(anchoredPopup({ anchor: '--a', side: 'top', align: 'end' }).positionArea, 'block-start span-inline-start');
  // Every length is a geometry variable or a positioner variable.
  assert.equal(floatingPopup.minWidth, 'var(--anchor-width)');
  assert.equal(sideOrigins['&[data-side=top]']['--transform-origin'], 'bottom center');
});

test('useFloatingLayer (React): top layer, data-side, dismiss with reasons, focus scope', async () => {
  const { createElement: h, useState, act } = await import('react');
  const { createRoot } = await import('react-dom/client');
  const { useFloatingLayer, FloatingContext } = await import('../components/floating.react.ts');
  (globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
  const reasons: string[] = [];
  let setOpen!: (v: boolean) => void;
  function Demo() {
    const [open, set] = useState(false);
    setOpen = set;
    const f = useFloatingLayer<HTMLDivElement, HTMLDivElement>({
      open, onOpenChange: (o, d) => { reasons.push(d.reason); set(o); }, focus: { trap: true },
    });
    return h(FloatingContext.Provider, { value: { open, side: f.side, align: f.align } },
      h('div', { ref: f.anchorRef, id: 'anchor', tabIndex: 0 }),
      h('div', { ref: f.popupRef, id: 'popup', popover: 'manual', ...f.popupProps }, h('div', { id: 'item', tabIndex: 0 })));
  }
  const box = document.createElement('div');
  document.body.append(box);
  const root = createRoot(box);
  await act(async () => root.render(h(Demo)));
  const popup = box.querySelector('#popup')!;
  assert.equal(popup.hasAttribute('data-closed'), true);
  (box.querySelector('#anchor') as HTMLElement).focus();
  await act(async () => setOpen(true));
  assert.equal(popup.hasAttribute('data-open'), true);
  assert.equal(popup.getAttribute('data-side'), 'bottom');
  assert.equal(popup.getAttribute('data-align'), 'start');
  assert.equal(document.activeElement?.id, 'item', 'the focus scope moved focus in');
  await act(async () => { document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true })); });
  assert.deepEqual(reasons, ['escape-key']);
  assert.equal(popup.hasAttribute('data-closed'), true);
  assert.equal(document.activeElement?.id, 'anchor', 'focus returned to the anchor');
  await act(async () => setOpen(true));
  await act(async () => { document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); });
  assert.deepEqual(reasons, ['escape-key', 'outside-press']);
  await act(async () => root.unmount());
  box.remove();
});
