import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Window } from 'happy-dom';
import { conditions } from '../styles/conditions.ts';
import { uiKitPreset } from '../preset.ts';

test('state conditions are in the preset and match both renderers', () => {
  for (const k of Object.keys(conditions)) assert.equal((uiKitPreset as any).conditions[k], (conditions as any)[k], k);
  const win = new Window(); const doc = win.document;
  doc.body.innerHTML = `
    <ui-checkbox id="wc" aria-checked="true" aria-disabled="true"></ui-checkbox>
    <label id="native" data-ui="checkbox"><input type="checkbox" checked disabled></label>
    <label id="off" data-ui="checkbox"><input type="checkbox"></label>`;
  const sel = (c: string) => c.replace(/&/g, '*');
  for (const id of ['wc', 'native']) {
    assert.ok(doc.getElementById(id)!.matches(sel(conditions.checked)), `${id} checked`);
    assert.ok(doc.getElementById(id)!.matches(sel(conditions.disabled)), `${id} disabled`);
  }
  assert.ok(!doc.getElementById('off')!.matches(sel(conditions.checked)), 'unchecked native does not match');
});
