// React renderers are native HTML with the web components' anatomy (no ui-* custom elements).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createElement as h } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { loadTsx } from './load-tsx.ts';

const { Checkbox, Radio, Switch } = await loadTsx(new URL('../components/choice/choice.react.tsx', import.meta.url));
const { Range, Progress } = await loadTsx(new URL('../components/range/range.react.tsx', import.meta.url));

const html = (el: any) => renderToStaticMarkup(el);
/** Markup without class attributes: structure assertions; recipe classes are asserted separately. */
const bare = (el: any) => html(el).replace(/ class="[^"]*"/g, '');
const noCustom = (s: string) => assert.doesNotMatch(s, /<ui-/, 'no custom elements in React output');

test('Checkbox, Radio, Switch: native input inside a data-ui label with the construction pattern', () => {
  const cb = bare(h(Checkbox, { name: 'terms', defaultChecked: true, prefix: '#', suffix: '(2)' }, 'Accept'));
  assert.match(cb, /^<label data-ui="checkbox"/);
  assert.match(cb, /<input type="checkbox" name="terms" checked=""/);
  assert.match(cb, /<span data-part="leading"><span data-part="box" aria-hidden="true"><i name="check-bold" data-mark="checked"><\/i><i name="minus-bold" data-mark="mixed"><\/i><\/span><\/span><span data-part="prefix">#<\/span><span data-part="contents">Accept<\/span><span data-part="suffix">\(2\)<\/span>/);
  noCustom(cb);
  assert.match(bare(h(Switch, {}, 'Wi-Fi')), /<input type="checkbox" role="switch"/);
  assert.match(bare(h(Radio, { name: 'plan', value: 'pro' }, 'Pro')), /<input type="radio" name="plan" value="pro"/);
  assert.match(bare(h(Checkbox, { invalid: true }, 'x')), /data-invalid="true".*aria-invalid="true"/);
});

test('Range and Progress: native input/progress with track, fill, thumb and --ui-ratio', () => {
  const r = bare(h(Range, { defaultValue: 25, label: 'Volume', name: 'vol' }));
  assert.match(r, /^<div data-ui="range" style="--ui-ratio:0.25">/);
  assert.match(r, /<span data-part="track"><span data-part="fill"><\/span><\/span><span data-part="thumb"><\/span><input type="range" min="0" max="100" step="1" aria-label="Volume" name="vol" value="25"\/>/);
  noCustom(r);
  assert.match(bare(h(Progress, { value: 40, label: 'Upload' })), /--ui-ratio:0.4.*<progress max="100" aria-label="Upload" value="40"><\/progress>/);
  assert.match(bare(h(Progress, {})), /data-indeterminate="true"/);
  assert.match(html(h(Range, {})), /class="ui-range__root".*class="ui-range__track"><span data-part="fill" class="ui-range__fill">.*class="ui-range__thumb"/);
  assert.match(html(h(Progress, {})), /class="ui-progress__root".*class="ui-progress__track"><span data-part="fill" class="ui-progress__fill">/);
});

const { Badge, Tag, Chip } = await loadTsx(new URL('../components/btg/btg.react.tsx', import.meta.url));
const { Swatch, Palette } = await loadTsx(new URL('../components/color/color.react.tsx', import.meta.url));
const { Image } = await loadTsx(new URL('../components/image/image.react.tsx', import.meta.url));
const { Card, Group } = await loadTsx(new URL('../components/container/container.react.tsx', import.meta.url));

test('Badge, Tag, Chip: data-ui hosts with the construction pattern; Chip is a native toggle button', () => {
  // Classes come from the slot recipes (btg.recipe.ts): root on the host, one per part.
  assert.equal(html(h(Badge, {}, '3')), '<span class="ui-badge__root" data-ui="badge"><span data-part="contents" class="ui-badge__contents">3</span></span>');
  assert.match(html(h(Tag, { leading: h('i', { name: 'tag' }), suffix: 'M' }, 'Size')), /<span class="ui-tag__root" data-ui="tag"><span data-part="leading" class="ui-tag__leading"><i name="tag"><\/i><\/span><span data-part="contents" class="ui-tag__contents">Size<\/span><span data-part="suffix" class="ui-tag__suffix">M<\/span><\/span>/);
  const chip = html(h(Chip, { selectable: true, defaultSelected: true }, 'Design'));
  assert.match(chip, /^<button type="button" class="ui-chip__root ui-chip__root--selectable_true" data-ui="chip" data-selectable="true" aria-pressed="true"/);
  assert.match(html(h(Chip, { removable: true }, 'Remote')), /aria-keyshortcuts="Delete".*<span data-part="trailing" class="[^"]*"><i name="x" data-remove="" class="ui-chip__remove ui-chip__remove--selectable_false"><\/i><\/span>/);
  noCustom(chip);
});

test('Swatch and Palette: role=img swatches; a selectable palette is a radio group of native radios', () => {
  assert.match(bare(h(Swatch, { color: '#3366ff', label: 'Blue' })), /data-ui="swatch" role="img" aria-label="Blue" style="--ui-swatch-color:#3366ff"/);
  assert.match(bare(h(Swatch, { color: 'rgb(255 0 0 / 40%)' })), /data-alpha="true"/);
  const p = bare(h(Palette, { name: 'accent', defaultValue: '#22aa66', label: 'Accent' }, h(Swatch, { color: '#3366ff' }), h(Swatch, { color: '#22aa66' })));
  assert.match(p, /data-ui="palette" data-selectable="true" role="radiogroup" aria-label="Accent"/);
  const checked = p.match(/<label data-ui="swatch" style="--ui-swatch-color:#22aa66"><input [^>]*>/)?.[0] ?? '';
  for (const a of ['type="radio"', 'name="accent"', 'value="#22aa66"', 'aria-label="#22aa66"', 'checked=""']) assert.ok(checked.includes(a), `${a} in ${checked}`);
  assert.match(bare(h(Palette, { orientation: 'vertical' }, h(Swatch, { color: '#eee' }))), /role="group".*data-ui="swatch" role="img"/);
  assert.match(html(h(Palette, { name: 'p', orientation: 'vertical' }, h(Swatch, { color: '#eee' }))), /class="ui-palette__root ui-palette__root--orientation_vertical ui-palette__root--selectable_true".*<label class="ui-swatch__root"/);
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

test('Listbox, Segmented, Option: ARIA listboxes like the web components, form value in a hidden input', () => {
  const lb = bare(h(Listbox, { label: 'Folder', name: 'folder', defaultValue: 'sent' }, h(Option, { value: 'inbox', suffix: '12' }, 'Inbox'), h(Option, { value: 'sent' }, 'Sent'), h(Option, { value: 'spam', disabled: true }, 'Spam')));
  assert.match(lb, /^<div data-ui="listbox" role="listbox" aria-label="Folder" tabindex="0">/);
  const opt = (v: string) => lb.match(new RegExp(`<div data-ui="option" role="option" id="[^"]+" aria-selected="[a-z]+"[^>]*>(?=(?:(?!</div>).)*${v === 'inbox' ? 'Inbox' : v === 'sent' ? 'Sent' : 'Spam'})`))?.[0] ?? '';
  assert.ok(opt('sent').includes('aria-selected="true"'), opt('sent'));
  assert.ok(opt('inbox').includes('aria-selected="false"'));
  assert.ok(opt('spam').includes('aria-disabled="true"'));
  assert.match(lb, /<span data-part="contents">Inbox<\/span><span data-part="suffix">12<\/span>/);
  assert.match(lb, /<input type="hidden" name="folder" value="sent"\/>/);
  assert.match(bare(h(Segmented, { label: 'View' }, h(Option, { value: 'grid' }, 'Grid'))), /data-ui="segmented" role="listbox" aria-orientation="horizontal" aria-label="View"/);
  assert.throws(() => bare(h(Option, { value: 'x' }, 'x')), /inside <Listbox>/);
  noCustom(lb);
});

const { Swiper } = await loadTsx(new URL('../components/swiper/swiper.react.tsx', import.meta.url));

test('Swiper: carousel region, scroll-snap viewport of slides, native paddle and dot buttons; Image slideshow uses it', () => {
  const sw = html(h(Swiper, { label: 'Highlights', hoverControls: true }, h('div', null, 'One'), h('div', null, 'Two')));
  assert.match(sw, /^<div data-ui="swiper" role="region" aria-roledescription="carousel" aria-label="Highlights" data-hover-controls="true">/);
  assert.match(sw, /<div data-part="viewport" tabindex="0"><div data-part="slide" role="group" aria-roledescription="slide" aria-label="1 of 2"><div>One<\/div><\/div>/);
  assert.match(sw, /<button type="button" class="ui-button__root ui-button__root--variant_neutral" data-ui="button" data-part="paddle" data-dir="prev" data-icon-size="lg" aria-label="Previous slide" aria-disabled="true">/);
  assert.match(sw, /<button type="button" data-part="dot" aria-label="Go to slide 1" aria-current="true"><\/button><button type="button" data-part="dot" aria-label="Go to slide 2" aria-current="false">/);
  assert.match(html(h(Swiper, {}, h('div', null, 'only'))), /data-single="true"/);
  assert.match(html(h(Image, { slideshow: true, alt: 'Products' }, h('img', { src: '/1.jpg', alt: '1' }))), /data-slideshow="true".*data-ui="swiper".*aria-label="Products".*data-hover-controls="true"/);
  noCustom(sw);
});

const { Select, SelectOption } = await loadTsx(new URL('../components/select/select.react.tsx', import.meta.url));

test('Select: native <select> with a <button> trigger, <selectedcontent> value and rich options', () => {
  const s = bare(h(Select, { label: 'Role', name: 'role', defaultValue: 'eng', required: true, prefix: 'As' }, h(SelectOption, { value: 'design', leading: h('i', { name: 'pen' }) }, 'Designer'), h(SelectOption, { value: 'eng' }, 'Engineer')));
  assert.match(s, /^<div data-ui="select"><label data-part="label" id="[^"]+" for="[^"]+">Role<\/label><select /);
  assert.match(s, /<button data-part="trigger" type="button"><span data-part="prefix">As<\/span><selectedcontent data-part="contents"><\/selectedcontent><span data-part="trailing" aria-hidden="true"><i name="caret-down"><\/i><\/span><\/button>/);
  assert.match(s, /<option data-ui="option" value="design"><span data-part="leading"><i name="pen"><\/i><\/span><span data-part="contents">Designer<\/span><\/option><option data-ui="option" value="eng" selected="">/);
  const sel = s.match(/<select [^>]*>/)?.[0] ?? '';
  for (const a of ['name="role"', 'required=""']) assert.ok(sel.includes(a), `${a} in ${sel}`);
  assert.match(bare(h(Select, { label: 'X', error: 'Pick one' }, h(SelectOption, { value: 'a' }, 'A'))), /data-invalid="true".*<span data-part="error"[^>]*>Pick one<\/span>/);
  noCustom(s);
});

const { Button } = await loadTsx(new URL('../components/button/button.react.tsx', import.meta.url));
const { Input } = await loadTsx(new URL('../components/input/input.react.tsx', import.meta.url));

test('Button and Input: native <button> and <input> with the construction pattern', () => {
  const b = html(h(Button, { leading: h('i', { name: 'plus' }), suffix: '⌘N', loading: true }, 'Add'));
  assert.match(b, /^<button type="button" class="ui-button__root ui-button__root--variant_neutral" data-ui="button"/);
  assert.match(b, /aria-busy="true"/);
  assert.match(b, /<span data-part="leading" class="ui-button__leading[^"]*"><i name="plus"><\/i><\/span><span data-part="contents" class="ui-button__contents[^"]*">Add<\/span><span data-part="suffix" class="ui-button__suffix[^"]*">⌘N<\/span>/);
  assert.match(html(h(Button, { variant: 'primary' }, 'Save')), /class="ui-button__root ui-button__root--variant_primary"/);
  const i = bare(h(Input, { label: 'Price', name: 'price', defaultValue: '40', prefix: '$', suffix: 'USD', description: 'Before tax' }));
  assert.match(i, /^<div data-ui="input"><label data-part="label"/);
  assert.match(i, /<div data-part="control"><span data-part="prefix">\$<\/span><input data-part="contents"[^>]*name="price"[^>]*value="40"[^>]*\/><span data-part="suffix">USD<\/span><\/div>/);
  assert.match(i, /<p data-part="description"[^>]*>Before tax<\/p>/);
  noCustom(b + i);
});

test('hideLabel keeps the label in the markup (accessible name) and marks the host for visually hidden styling', async () => {
  const { input } = await import('../components/input/input.recipe.ts');
  const { select } = await import('../components/select/select.recipe.ts');
  for (const recipe of [input, select]) {
    const sel = Object.keys(recipe.base!.root!).find((k) => k.includes('[hide-label]') && k.includes('[data-hide-label]'));
    assert.ok(sel, 'hide-label rule exists for both renderers');
    assert.equal((recipe.base!.root as any)[sel!].clipPath, 'inset(50%)');
  }
  for (const out of [bare(h(Input, { label: 'Search', hideLabel: true })), bare(h(Select, { label: 'Role', hideLabel: true }, h(SelectOption, { value: 'a' }, 'A')))]) {
    assert.match(out, /data-hide-label="true"/);
    assert.match(out, /<label data-part="label"[^>]*>(Search|Role)<\/label>/);
  }
  assert.doesNotMatch(bare(h(Input, { label: 'Search' })), /data-hide-label/);
});

test('Input, Select, Listbox and Option carry their slot recipe classes on host and parts', () => {
  const i = html(h(Input, { label: 'Price', prefix: '$' }));
  assert.match(i, /^<div data-ui="input" class="ui-input__root"><label data-part="label" class="ui-input__label"[^>]*>Price<\/label><div data-part="control" class="ui-input__control"><span data-part="prefix" class="ui-input__prefix">\$<\/span><input data-part="contents" class="ui-input__contents"/);
  const s = html(h(Select, { label: 'Role' }, h(SelectOption, { value: 'a' }, 'A')));
  assert.match(s, /class="ui-select__root".*<button data-part="trigger" type="button" class="ui-select__trigger">.*<option class="ui-option__root" data-ui="option"/);
  const l = html(h(Listbox, { label: 'L' }, h(Option, { value: 'a' }, 'A')));
  assert.match(l, /class="ui-listbox__root".*class="ui-option__root" data-ui="option".*<span data-part="contents" class="ui-option__contents">A<\/span>/);
  assert.match(html(h(Segmented, { label: 'S' }, h(Option, { value: 'a' }, 'A'))), /class="ui-segmented__root"/);
});
