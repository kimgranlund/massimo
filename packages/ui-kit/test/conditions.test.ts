import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { Window } from 'happy-dom';
import { conditions } from '../styles/conditions.ts';
import { uiKitPreset } from '../preset.ts';

const states = JSON.parse(readFileSync(new URL('../contracts/states.json', import.meta.url), 'utf8'));
const sel = (c: string) => c.replace(/&/g, '*');

test('state conditions are in the preset and key on the data-* contract', () => {
  for (const k of Object.keys(conditions)) assert.equal((uiKitPreset as any).conditions[k], (conditions as any)[k], k);
  // Every condition the contract names exists, and keys on its attribute.
  for (const [attr, def] of Object.entries<any>(states.attributes)) {
    if (!def.condition) continue;
    const c = (conditions as any)[def.condition.slice(1)];
    assert.ok(c, `${def.condition} for ${attr}`);
    assert.ok(c.includes(`[${attr}]`), `${def.condition} keys on [${attr}]: ${c}`);
  }
  // No ARIA in the conditions: ARIA is semantics, data-* the styling contract.
  for (const [k, c] of Object.entries(conditions)) assert.doesNotMatch(c, /aria-/, k);
});

test('conditions match a web component host and a React host by the same data-*', () => {
  const doc = new Window().document;
  doc.body.innerHTML = `
    <ui-checkbox id="wc" data-checked data-disabled></ui-checkbox>
    <label id="react" data-ui="checkbox" data-checked data-disabled><input type="checkbox" checked></label>
    <label id="off" data-ui="checkbox" data-unchecked><input type="checkbox"></label>
    <label id="fieldset" data-ui="checkbox" data-unchecked><input type="checkbox" disabled></label>
    <ui-button id="busy" data-busy></ui-button>`;
  for (const id of ['wc', 'react']) {
    assert.ok(doc.getElementById(id)!.matches(sel(conditions.checked)), `${id} checked`);
    assert.ok(doc.getElementById(id)!.matches(sel(conditions.disabled)), `${id} disabled`);
  }
  assert.ok(!doc.getElementById('off')!.matches(sel(conditions.checked)), 'unchecked does not match checked');
  assert.ok(doc.getElementById('off')!.matches(sel(conditions.unchecked)));
  // The one native fallback: a native control disabled without data-disabled (a <fieldset disabled>).
  assert.ok(doc.getElementById('fieldset')!.matches(sel(conditions.disabled)), 'native :disabled child');
  assert.ok(!doc.getElementById('busy')!.matches(sel(conditions.enabled)), 'busy is not enabled');
  assert.ok(doc.getElementById('off')!.matches(sel(conditions.enabled)));
});
