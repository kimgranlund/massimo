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

const { Badge, Tag, Chip } = await loadTsx(new URL('../components/btg/btg.react.tsx', import.meta.url));
const { Swatch, Palette } = await loadTsx(new URL('../components/color/color.react.tsx', import.meta.url));
const { Image } = await loadTsx(new URL('../components/image/image.react.tsx', import.meta.url));
const { Card, Group } = await loadTsx(new URL('../components/container/container.react.tsx', import.meta.url));

test('Badge, Tag, Chip: data-ui hosts with the construction pattern; Chip is a native toggle button', () => {
  assert.equal(html(h(Badge, {}, '3')), '<span data-ui="badge"><span data-part="contents">3</span></span>');
  assert.match(html(h(Tag, { leading: h('i', { name: 'tag' }), suffix: 'M' }, 'Size')), /<span data-ui="tag"><span data-part="leading"><i name="tag"><\/i><\/span><span data-part="contents">Size<\/span><span data-part="suffix">M<\/span><\/span>/);
  const chip = html(h(Chip, { selectable: true, defaultSelected: true }, 'Design'));
  assert.match(chip, /^<button type="button" data-ui="chip" data-selectable="true" aria-pressed="true"/);
  assert.match(html(h(Chip, { removable: true }, 'Remote')), /aria-keyshortcuts="Delete".*<span data-part="trailing"><i name="x" data-remove=""><\/i><\/span>/);
  noCustom(chip);
});

test('Swatch and Palette: role=img swatches; a selectable palette is a radio group of native radios', () => {
  assert.match(html(h(Swatch, { color: '#3366ff', label: 'Blue' })), /data-ui="swatch" role="img" aria-label="Blue" style="--ui-swatch-color:#3366ff"/);
  assert.match(html(h(Swatch, { color: 'rgb(255 0 0 / 40%)' })), /data-alpha="true"/);
  const p = html(h(Palette, { name: 'accent', defaultValue: '#22aa66', label: 'Accent' }, h(Swatch, { color: '#3366ff' }), h(Swatch, { color: '#22aa66' })));
  assert.match(p, /data-ui="palette" data-selectable="true" role="radiogroup" aria-label="Accent"/);
  const checked = p.match(/<label data-ui="swatch" style="--ui-swatch-color:#22aa66"><input [^>]*>/)?.[0] ?? '';
  for (const a of ['type="radio"', 'name="accent"', 'value="#22aa66"', 'aria-label="#22aa66"', 'checked=""']) assert.ok(checked.includes(a), `${a} in ${checked}`);
  assert.match(html(h(Palette, { orientation: 'vertical' }, h(Swatch, { color: '#eee' }))), /role="group".*data-ui="swatch" role="img"/);
  noCustom(p);
});

test('Image and containers: data-ui hosts; presets as data-ratio, custom ratio as a variable', () => {
  assert.match(html(h(Image, { src: '/a.jpg', alt: 'A', ratio: 'wide' })), /data-ui="image" data-ratio="wide" data-fit="cover".*<img src="\/a.jpg" alt="A" loading="lazy" decoding="async"/);
  assert.match(html(h(Image, { ratio: '3/2' })), /--ui-image-ratio:3\/2/);
  assert.doesNotMatch(html(h(Image, { ratio: 'evil;' })), /--ui-image-ratio/);
  assert.equal(html(h(Card, {}, 'x')), '<div data-ui="card">x</div>');
  assert.equal(html(h(Group, { gap: 2 }, 'x')), '<div data-ui="group" gap="2">x</div>');
});

const { Listbox, Segmented, Option } = await loadTsx(new URL('../components/listbox/listbox.react.tsx', import.meta.url));

test('Listbox, Segmented, Option: radio groups of native radios with the construction pattern', () => {
  const lb = html(h(Listbox, { label: 'Folder', name: 'folder', defaultValue: 'sent' }, h(Option, { value: 'inbox', suffix: '12' }, 'Inbox'), h(Option, { value: 'sent' }, 'Sent'), h(Option, { value: 'spam', disabled: true }, 'Spam')));
  assert.match(lb, /^<div data-ui="listbox" role="radiogroup" aria-label="Folder" aria-orientation="vertical">/);
  const opt = (v: string) => lb.match(new RegExp(`<label data-ui="option"><input [^>]*value="${v}"[^>]*>`))?.[0] ?? '';
  assert.ok(opt('sent').includes('checked=""') && opt('sent').includes('name="folder"'));
  assert.ok(!opt('inbox').includes('checked'));
  assert.ok(opt('spam').includes('disabled=""'));
  assert.match(lb, /<span data-part="contents">Inbox<\/span><span data-part="suffix">12<\/span>/);
  assert.match(html(h(Segmented, { label: 'View' }, h(Option, { value: 'grid' }, 'Grid'))), /data-ui="segmented" role="radiogroup" aria-label="View" aria-orientation="horizontal"/);
  assert.throws(() => html(h(Option, { value: 'x' }, 'x')), /inside <Listbox>/);
  noCustom(lb);
});

const { Swiper } = await loadTsx(new URL('../components/swiper/swiper.react.tsx', import.meta.url));

test('Swiper: carousel region, scroll-snap viewport of slides, native paddle and dot buttons; Image slideshow uses it', () => {
  const sw = html(h(Swiper, { label: 'Highlights', hoverControls: true }, h('div', null, 'One'), h('div', null, 'Two')));
  assert.match(sw, /^<div data-ui="swiper" role="region" aria-roledescription="carousel" aria-label="Highlights" data-hover-controls="true">/);
  assert.match(sw, /<div data-part="viewport" tabindex="0"><div data-part="slide" role="group" aria-roledescription="slide" aria-label="1 of 2"><div>One<\/div><\/div>/);
  assert.match(sw, /<button type="button" data-ui="button" data-part="paddle" data-dir="prev" aria-label="Previous slide" aria-disabled="true">/);
  assert.match(sw, /<button type="button" data-part="dot" aria-label="Go to slide 1" aria-current="true"><\/button><button type="button" data-part="dot" aria-label="Go to slide 2" aria-current="false">/);
  assert.match(html(h(Swiper, {}, h('div', null, 'only'))), /data-single="true"/);
  assert.match(html(h(Image, { slideshow: true, alt: 'Products' }, h('img', { src: '/1.jpg', alt: '1' }))), /data-slideshow="true".*data-ui="swiper".*aria-label="Products".*data-hover-controls="true"/);
  noCustom(sw);
});
