// React renderers are native HTML with the web components' anatomy (no ui-* custom elements).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadTsx } from './load-tsx.ts';

const { Checkbox, Radio, Switch } = await loadTsx(new URL('../components/choice/choice.react.tsx', import.meta.url));
const { Range, Progress } = await loadTsx(new URL('../components/range/range.react.tsx', import.meta.url));

const html = (el: any) => renderToStaticMarkup(el);
const noCustom = (s: string) => assert.doesNotMatch(s, /<ui-/, 'no custom elements in React output');

test('Checkbox, Radio, Switch: native input inside a data-ui label with the construction pattern', () => {
  const cb = html(h(Checkbox, { name: 'terms', defaultChecked: true, prefix: '#', suffix: '(2)' }, 'Accept'));
  assert.match(cb, /^<label data-ui="checkbox"/);
  assert.match(cb, /<input type="checkbox" name="terms" checked=""/);
  assert.match(cb, /<span data-part="leading"><span data-part="box" aria-hidden="true"><i name="check" data-mark="checked"><\/i><i name="minus" data-mark="mixed"><\/i><\/span><\/span><span data-part="prefix">#<\/span><span data-part="contents">Accept<\/span><span data-part="suffix">\(2\)<\/span>/);
  noCustom(cb);
  assert.match(html(h(Switch, {}, 'Wi-Fi')), /<input type="checkbox" role="switch"/);
  assert.match(html(h(Radio, { name: 'plan', value: 'pro' }, 'Pro')), /<input type="radio" name="plan" value="pro"/);
  assert.match(html(h(Checkbox, { invalid: true }, 'x')), /data-invalid="true".*aria-invalid="true"/);
});

test('Range and Progress: native input/progress with track, fill, thumb and --ui-ratio', () => {
  const r = html(h(Range, { defaultValue: 25, label: 'Volume', name: 'vol' }));
  assert.match(r, /^<div data-ui="range" style="--ui-ratio:0.25">/);
  assert.match(r, /<span data-part="track"><span data-part="fill"><\/span><\/span><span data-part="thumb"><\/span><input type="range" min="0" max="100" step="1" aria-label="Volume" name="vol" value="25"\/>/);
  noCustom(r);
  assert.match(html(h(Progress, { value: 40, label: 'Upload' })), /--ui-ratio:0.4.*<progress max="100" aria-label="Upload" value="40"><\/progress>/);
  assert.match(html(h(Progress, {})), /data-indeterminate="true"/);
});
