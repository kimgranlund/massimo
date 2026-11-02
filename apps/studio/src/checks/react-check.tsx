// Browser parity check: every native React renderer next to its web component, at several sizes and
// states. Compares rendered geometry and paint, and the data-* state attributes (contracts/states.json)
// on each twin's host and items; "fails": [] means the twins match. Composition (Base UI level 4):
// each preset next to its composed form (React compound parts; web components with authored
// [data-part] children), compared part by part in a separate #composed root.
import '../index.css';
import '@massimo/ui-kit/components/choice/element';
import '@massimo/ui-kit/components/range/element';
import '@massimo/ui-kit/components/btg/element';
import '@massimo/ui-kit/components/color/element';
import '@massimo/ui-kit/components/image/element';
import '@massimo/ui-kit/components/listbox/element';
import '@massimo/ui-kit/components/swiper/element';
import '@massimo/ui-kit/components/select/element';
import '@massimo/ui-kit/components/button/element';
import '@massimo/ui-kit/components/input/element';
import '@massimo/ui-kit/components/field/element';
import '@massimo/ui-kit/components/separator/element';
import '@massimo/ui-kit/components/avatar/element';
import '@massimo/ui-kit/components/meter/element';
import '@massimo/ui-kit/icons';
import { Button } from '@massimo/ui-kit/components/button/react';
import { Input } from '@massimo/ui-kit/components/input/react';
import { Select, SelectOption } from '@massimo/ui-kit/components/select/react';
import { Swiper } from '@massimo/ui-kit/components/swiper/react';
import { Listbox, Segmented, Option } from '@massimo/ui-kit/components/listbox/react';
import { Badge, Tag, Chip } from '@massimo/ui-kit/components/btg/react';
import { Swatch, Palette } from '@massimo/ui-kit/components/color/react';
import { Image } from '@massimo/ui-kit/components/image/react';
import { Card, Group } from '@massimo/ui-kit/components/container/react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { Checkbox, Radio, Switch } from '@massimo/ui-kit/components/choice/react';
import { Range, Progress } from '@massimo/ui-kit/components/range/react';
import { Field } from '@massimo/ui-kit/components/field/react';
import { Slider } from '@massimo/ui-kit/components/range/react';
import { Separator } from '@massimo/ui-kit/components/separator/react';
import { Avatar } from '@massimo/ui-kit/components/avatar/react';
import { Meter } from '@massimo/ui-kit/components/meter/react';

const UNITS = [2, 3, 4, 4.5, 6];
const r2 = (v: number) => Math.round(v * 100) / 100;

function Pair({ u }: { u: number }) {
  return (
    <div data-size={u} data-case={u} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, width: 640, marginBottom: 16 }}>
      <div data-side="wc">
        <ui-button data-k="bt">Save</ui-button>
        <ui-button data-k="btI"><i slot="leading" name="plus" />Add<span slot="suffix">⌘N</span></ui-button>
        <ui-button data-k="btO" aria-label="More"><i slot="leading" name="dots-three" /></ui-button>
        <ui-button data-k="btL" loading>Saving</ui-button>
        <ui-button data-k="btD" disabled>Off</ui-button>
        <ui-button data-k="btP" variant="primary"><i slot="leading" name="plus" />Add</ui-button>
        <div style={{ width: 300 }} data-k="in"><ui-input label="Price" value="40" description="Before tax"><span slot="prefix">$</span><span slot="suffix">USD</span></ui-input></div>
        <ui-checkbox data-k="cb">Accept</ui-checkbox>
        <ui-checkbox data-k="cbOn" checked>Accept</ui-checkbox>
        <ui-checkbox data-k="cbMixed" indeterminate>Some</ui-checkbox>
        <ui-checkbox data-k="cbOff" disabled>Off</ui-checkbox>
        <ui-radio data-k="rd" name={`r${u}`} value="a" checked>One</ui-radio>
        <ui-switch data-k="sw" checked>Wi-Fi<span slot="suffix">on</span></ui-switch>
        <div style={{ width: 300 }}><ui-range data-k="rg" value={25} /></div>
        <div style={{ width: 300 }}><ui-field data-k="fd" layout="inline" label="Unit" unit="px" readout="4.5" description="Sets u."><ui-range value={25} /></ui-field></div>
        <div style={{ width: 300 }}><ui-progress data-k="pg" value={40} /></div>
        <ui-badge data-k="bd">3</ui-badge>
        <ui-tag data-k="tg"><i slot="leading" name="tag" />Size<span slot="suffix">M</span></ui-tag>
        <ui-chip data-k="ch" selectable selected><i slot="leading" name="check" />Design</ui-chip>
        <ui-chip data-k="chX" removable>Remote</ui-chip>
        <ui-swatch data-k="sws" color="#3366ff" />
        <ui-swatch data-k="swa" color="rgb(255 0 0 / 40%)" />
        <ui-palette data-k="pl" name={`p${u}`} value="#22aa66"><ui-swatch color="#3366ff" /><ui-swatch color="#22aa66" /><ui-swatch color="#dd4433" /></ui-palette>
        <ui-palette data-k="plv" orientation="vertical"><ui-swatch color="#eef" /><ui-swatch color="#99f" /></ui-palette>
        <div style={{ width: 200 }}><ui-image data-k="im" ratio="wide" /></div>
        <div style={{ width: 200 }}><ui-image data-k="imc" ratio="3/2" /></div>
        <ui-card data-k="cd"><span>a</span><span>b</span></ui-card>
        <ui-group data-k="gp" gap="2"><span>a</span><span>b</span></ui-group>
        <ui-listbox data-k="lb" label="Folder" value="inbox"><ui-option value="inbox"><i slot="leading" name="tray" />Inbox<span slot="suffix">12</span></ui-option><ui-option value="sent">Sent</ui-option><ui-option value="spam" disabled>Spam</ui-option></ui-listbox>
        <ui-segmented data-k="sg" label="View" value="grid"><ui-option value="grid">Grid</ui-option><ui-option value="list">List</ui-option></ui-segmented>
        <div style={{ width: 300 }}><ui-select data-k="sel" label="Role" value="eng"><i slot="leading" name="briefcase" /><ui-option value="design">Designer</ui-option><ui-option value="eng">Engineer</ui-option></ui-select></div>
        <div style={{ width: 300 }}><ui-swiper data-k="swp" label="Highlights"><div style={{ height: 80 }}>One</div><div>Two</div><div>Three</div></ui-swiper></div>
        <div style={{ width: 200 }}><ui-image data-k="ims" slideshow ratio="square" alt="Products"><img src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" alt="1" /><img src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" alt="2" /></ui-image></div>
        <div style={{ width: 300 }}><ui-separator data-k="sp" /></div>
        <div style={{ display: 'flex', height: 40 }}><ui-separator data-k="spv" orientation="vertical" /></div>
        <ui-avatar data-k="av" name="Ada Lovelace" />
        <div style={{ width: 300 }}><ui-meter data-k="mt" label="Storage" value={30} /></div>
        <div style={{ width: 300 }}><ui-meter data-k="mtN" value={3} max={4} format='{"style":"decimal"}' /></div>
        <ui-avatar data-k="avS" avatar-size="sm" />
        <ui-avatar data-k="avX" avatar-size="xl" alt="Team">TM</ui-avatar>
      </div>
      <div data-side="react">
        <Button data-k="bt">Save</Button>
        <Button data-k="btI" leading={<i name="plus" />} suffix="⌘N">Add</Button>
        <Button data-k="btO" aria-label="More" leading={<i name="dots-three" />} />
        <Button data-k="btL" loading>Saving</Button>
        <Button data-k="btD" disabled>Off</Button>
        <Button data-k="btP" variant="primary" leading={<i name="plus" />}>Add</Button>
        <div style={{ width: 300 }} data-k="in"><Input label="Price" defaultValue="40" description="Before tax" prefix="$" suffix="USD" /></div>
        <Checkbox data-k="cb">Accept</Checkbox>
        <Checkbox data-k="cbOn" defaultChecked>Accept</Checkbox>
        <Checkbox data-k="cbMixed" indeterminate>Some</Checkbox>
        <Checkbox data-k="cbOff" disabled>Off</Checkbox>
        <Radio data-k="rd" name={`rr${u}`} value="a" defaultChecked>One</Radio>
        <Switch data-k="sw" defaultChecked suffix="on">Wi-Fi</Switch>
        <div style={{ width: 300 }}><Range data-k="rg" defaultValue={25} label="Volume" /></div>
        <div style={{ width: 300 }}><Field data-k="fd" layout="inline" label="Unit" unit="px" readout="4.5" description="Sets u.">{(ids) => <Range {...ids} defaultValue={25} />}</Field></div>
        <div style={{ width: 300 }}><Progress data-k="pg" value={40} label="Upload" /></div>
        <Badge data-k="bd">3</Badge>
        <Tag data-k="tg" leading={<i name="tag" />} suffix="M">Size</Tag>
        <Chip data-k="ch" selectable defaultSelected leading={<i name="check" />}>Design</Chip>
        <Chip data-k="chX" removable>Remote</Chip>
        <Swatch data-k="sws" color="#3366ff" />
        <Swatch data-k="swa" color="rgb(255 0 0 / 40%)" />
        <Palette data-k="pl" name={`pp${u}`} defaultValue="#22aa66"><Swatch color="#3366ff" /><Swatch color="#22aa66" /><Swatch color="#dd4433" /></Palette>
        <Palette data-k="plv" orientation="vertical"><Swatch color="#eef" /><Swatch color="#99f" /></Palette>
        <div style={{ width: 200 }}><Image data-k="im" ratio="wide" /></div>
        <div style={{ width: 200 }}><Image data-k="imc" ratio="3/2" /></div>
        <Card data-k="cd"><span>a</span><span>b</span></Card>
        <Group data-k="gp" gap={2}><span>a</span><span>b</span></Group>
        <Listbox data-k="lb" label="Folder" defaultValue="inbox"><Option value="inbox" leading={<i name="tray" />} suffix="12">Inbox</Option><Option value="sent">Sent</Option><Option value="spam" disabled>Spam</Option></Listbox>
        <Segmented data-k="sg" label="View" defaultValue="grid"><Option value="grid">Grid</Option><Option value="list">List</Option></Segmented>
        <div style={{ width: 300 }}><div data-k="sel"><Select label="Role" defaultValue="eng" leading={<i name="briefcase" />}><SelectOption value="design">Designer</SelectOption><SelectOption value="eng">Engineer</SelectOption></Select></div></div>
        <div style={{ width: 300 }}><Swiper data-k="swp" label="Highlights"><div style={{ height: 80 }}>One</div><div>Two</div><div>Three</div></Swiper></div>
        <div style={{ width: 200 }}><Image data-k="ims" slideshow ratio="square" alt="Products"><img src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" alt="1" /><img src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" alt="2" /></Image></div>
        <div style={{ width: 300 }}><Separator data-k="sp" /></div>
        <div style={{ display: 'flex', height: 40 }}><Separator data-k="spv" orientation="vertical" /></div>
        <Avatar data-k="av" name="Ada Lovelace" />
        <div style={{ width: 300 }}><Meter data-k="mt" label="Storage" value={30} /></div>
        <div style={{ width: 300 }}><Meter data-k="mtN" value={3} max={4} format={{ style: 'decimal' }} /></div>
        <Avatar data-k="avS" avatarSize="sm" />
        <Avatar data-k="avX" avatarSize="xl" alt="Team">TM</Avatar>
      </div>
    </div>
  );
}

/** Presets (data-side=preset) and their composed forms (data-side=composed), the same data-k on both. */
function ComposedPair({ u }: { u: number }) {
  const presets = (
    <>
      <Button data-k="bt" leading={<i name="plus" />}>Add</Button>
      <Checkbox data-k="cb" defaultChecked suffix="(2)">Accept</Checkbox>
      <Checkbox data-k="cbM" indeterminate>Some</Checkbox>
      <Radio data-k="rd" name={`cr${u}`} value="a" defaultChecked>One</Radio>
      <Switch data-k="sw" defaultChecked suffix="on">Wi-Fi</Switch>
      <div style={{ width: 300 }}><Range data-k="rg" defaultValue={25} label="Volume" /></div>
      <div style={{ width: 300 }}><Progress data-k="pg" value={40} label="Upload" /></div>
      <div style={{ width: 300 }}><Meter data-k="mt" value={40} label="Storage" /></div>
      <div style={{ width: 300 }}><Field data-k="fd" layout="inline" label="Unit" unit="px" readout="4.5" description="Sets u." error="Too big">{(ids) => <Range {...ids} defaultValue={25} />}</Field></div>
      <div style={{ width: 300 }}><Input data-k="in" label="Price" defaultValue="40" description="Before tax" prefix="$" suffix="USD" /></div>
      <Listbox data-k="lb" label="Folder" defaultValue="inbox"><Option value="inbox" leading={<i name="tray" />} suffix="12">Inbox</Option><Option value="sent">Sent</Option></Listbox>
      <Segmented data-k="sg" label="View" defaultValue="grid"><Option value="grid">Grid</Option><Option value="list">List</Option></Segmented>
      <div style={{ width: 300 }}><Select data-k="sel" label="Role" defaultValue="eng" leading={<i name="briefcase" />} description="Pick"><SelectOption value="design">Designer</SelectOption><SelectOption value="eng">Engineer</SelectOption></Select></div>
      <ui-button data-k="wbt"><i slot="leading" name="plus" />Add</ui-button>
      <ui-checkbox data-k="wcb" checked>Accept<span slot="suffix">(2)</span></ui-checkbox>
      <ui-switch data-k="wsw" checked>Wi-Fi<span slot="suffix">on</span></ui-switch>
      <ui-radio data-k="wrd" name={`wr${u}`} value="a" checked>One</ui-radio>
      <div style={{ width: 300 }}><ui-range data-k="wrg" value={25} /></div>
      <div style={{ width: 300 }}><ui-progress data-k="wpg" value={40} /></div>
      <div style={{ width: 300 }}><ui-meter data-k="wmt" value={40} label="Storage" /></div>
      <div style={{ width: 300 }}><ui-field data-k="wfd" layout="inline" label="Unit" unit="px" readout="4.5" description="Sets u." error="Too big"><ui-range value={25} /></ui-field></div>
      <div style={{ width: 300 }}><ui-input data-k="win" label="Price" value="40" description="Before tax"><span slot="prefix">$</span><span slot="suffix">USD</span></ui-input></div>
      <ui-listbox data-k="wlb" label="Folder" value="inbox"><ui-option value="inbox"><i slot="leading" name="tray" />Inbox<span slot="suffix">12</span></ui-option><ui-option value="sent">Sent</ui-option></ui-listbox>
      <div style={{ width: 300 }}><ui-select data-k="wsel" label="Role" value="eng" description="Pick"><i slot="leading" name="briefcase" /><ui-option value="design">Designer</ui-option><ui-option value="eng">Engineer</ui-option></ui-select></div>
    </>
  );
  const composed = (
    <>
      <Button data-k="bt" leading={<i name="plus" />} render={<button />}>Add</Button>
      <Checkbox.Root data-k="cb" defaultChecked suffix="(2)"><Checkbox.Indicator />Accept</Checkbox.Root>
      <Checkbox.Root data-k="cbM" indeterminate><Checkbox.Indicator />Some</Checkbox.Root>
      <Radio.Root data-k="rd" name={`cr${u}c`} value="a" defaultChecked><Radio.Indicator />One</Radio.Root>
      <Switch.Root data-k="sw" defaultChecked suffix="on"><Switch.Thumb />Wi-Fi</Switch.Root>
      <div style={{ width: 300 }}><Slider.Root data-k="rg" defaultValue={25} label="Volume"><Slider.Track><Slider.Indicator /></Slider.Track><Slider.Thumb /></Slider.Root></div>
      <div style={{ width: 300 }}><Progress.Root data-k="pg" value={40} label="Upload"><Progress.Track><Progress.Indicator /></Progress.Track></Progress.Root></div>
      <div style={{ width: 300 }}><Meter.Root data-k="mt" value={40}><Meter.Label>Storage</Meter.Label><Meter.Value /><Meter.Track><Meter.Indicator /></Meter.Track></Meter.Root></div>
      <div style={{ width: 300 }}>
        <Field.Root data-k="fd" layout="inline">
          <Field.Label unit="px">Unit</Field.Label><Field.Control render={(ids) => <Range {...ids} defaultValue={25} />} />
          <Field.Readout>4.5</Field.Readout><Field.Description>Sets u.</Field.Description><Field.Error>Too big</Field.Error>
        </Field.Root>
      </div>
      <div style={{ width: 300 }}><Input.Root data-k="in" defaultValue="40"><Input.Label>Price</Input.Label><Input.Control prefix="$" suffix="USD" /><Input.Description>Before tax</Input.Description></Input.Root></div>
      <Listbox.Root data-k="lb" label="Folder" defaultValue="inbox"><Listbox.Item value="inbox" leading={<i name="tray" />} suffix="12"><Listbox.ItemText>Inbox</Listbox.ItemText></Listbox.Item><Listbox.Item value="sent">Sent</Listbox.Item></Listbox.Root>
      <Segmented.Root data-k="sg" label="View" defaultValue="grid"><Segmented.Item value="grid"><Segmented.ItemText>Grid</Segmented.ItemText></Segmented.Item><Segmented.Item value="list">List</Segmented.Item></Segmented.Root>
      <div style={{ width: 300 }}>
        <Select.Root data-k="sel" defaultValue="eng">
          <Select.Label>Role</Select.Label>
          <Select.Trigger leading={<i name="briefcase" />}><Select.Value /><Select.Icon /></Select.Trigger>
          <Select.Popup><Select.List><Select.Item value="design"><Select.ItemText>Designer</Select.ItemText></Select.Item><Select.Item value="eng"><Select.ItemText>Engineer</Select.ItemText></Select.Item></Select.List></Select.Popup>
          <Select.Description>Pick</Select.Description>
        </Select.Root>
      </div>
      <ui-button data-k="wbt"><span data-part="leading"><i name="plus" /></span><span data-part="contents">Add</span></ui-button>
      <ui-checkbox data-k="wcb" checked><span data-part="leading"><span data-part="indicator" /></span><span data-part="contents">Accept</span><span data-part="suffix">(2)</span></ui-checkbox>
      <ui-switch data-k="wsw" checked><span data-part="indicator"><span data-part="thumb" /></span>Wi-Fi<span data-part="suffix">on</span></ui-switch>
      <ui-radio data-k="wrd" name={`wr${u}c`} value="a" checked><span data-part="indicator" /><span data-part="contents">One</span></ui-radio>
      <div style={{ width: 300 }}><ui-range data-k="wrg" value={25}><span data-part="track"><span data-part="indicator" /></span><span data-part="thumb" /></ui-range></div>
      <div style={{ width: 300 }}><ui-progress data-k="wpg" value={40}><span data-part="track"><span data-part="indicator" /></span></ui-progress></div>
      <div style={{ width: 300 }}><ui-meter data-k="wmt" value={40}><span data-part="label">Storage</span><span data-part="value" /><span data-part="track"><span data-part="indicator" /></span></ui-meter></div>
      <div style={{ width: 300 }}>
        <ui-field data-k="wfd" layout="inline">
          <span data-part="label"><span data-part="contents">Unit</span><span data-part="suffix">px</span></span><ui-range value={25} />
          <span data-part="readout">4.5</span><span data-part="description">Sets u.</span><span data-part="error">Too big</span>
        </ui-field>
      </div>
      <div style={{ width: 300 }}><ui-input data-k="win" value="40"><span data-part="label">Price</span><div data-part="control"><span data-part="prefix"><span>$</span></span><span data-part="suffix"><span>USD</span></span></div><span data-part="description">Before tax</span></ui-input></div>
      <ui-listbox data-k="wlb" label="Folder" value="inbox"><ui-option value="inbox"><span data-part="leading"><i name="tray" /></span><span data-part="contents">Inbox</span><span data-part="suffix">12</span></ui-option><ui-option value="sent"><span data-part="contents">Sent</span></ui-option></ui-listbox>
      <div style={{ width: 300 }}>
        <ui-select data-k="wsel" value="eng">
          <span data-part="label">Role</span>
          <div data-part="trigger"><span data-part="leading"><i name="briefcase" /></span><span data-part="value" /><span data-part="icon" /></div>
          <div data-part="popup"><div data-part="list"><ui-option value="design">Designer</ui-option><ui-option value="eng">Engineer</ui-option></div></div>
          <span data-part="description">Pick</span>
        </ui-select>
      </div>
    </>
  );
  return (
    <div data-size={u} data-ccase={u} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, width: 640, marginBottom: 16 }}>
      <div data-side="preset">{presets}</div>
      <div data-side="composed">{composed}</div>
    </div>
  );
}

const root = document.getElementById('root')!;
flushSync(() => createRoot(root).render(<>{UNITS.map((u) => <Pair key={u} u={u} />)}</>));
// The composed cases sit in their own root after the twins, so the twins' layout is unchanged.
const composedRoot = document.createElement('div');
composedRoot.id = 'composed';
root.after(composedRoot);
flushSync(() => createRoot(composedRoot).render(<>{UNITS.map((u) => <ComposedPair key={u} u={u} />)}</>));

setTimeout(() => {
  const fails: string[] = []; let checks = 0;
  const host = (side: Element, k: string) => {
    const el = side.querySelector(`[data-k="${k}"]`)!;
    // React spreads data-k onto the native input; its host is the data-ui ancestor.
    return (el.closest('[data-ui]') ?? el) as HTMLElement;
  };
  const measure = (el: HTMLElement) => {
    const q = (s: string) => el.querySelector(s) as HTMLElement | null;
    const rect = (e: Element | null) => (e ? e.getBoundingClientRect() : null);
    const kids = [...el.children] as HTMLElement[];
    const box = q('[data-part=indicator]'), track = q('[data-part=track]'), fill = q('[data-part=track] > [data-part=indicator]'), thumb = q('[data-part=thumb]'), contents = q('[data-part=contents]');
    const er = rect(el)!;
    return {
      height: r2(er.height), width: r2(er.width),
      boxW: box ? r2(rect(box)!.width) : 0, boxBg: box ? getComputedStyle(box).backgroundColor : '',
      // The radio dot is the indicator's ::after; the switch knob its thumb part.
      boxAfter: box ? ((k: CSSStyleDeclaration) => k.translate + ' ' + k.backgroundColor)(box.querySelector(':scope > [data-part=thumb]') ? getComputedStyle(box.querySelector(':scope > [data-part=thumb]')!) : getComputedStyle(box, '::after')) : '',
      mark: box ? [...box.querySelectorAll('i')].map((i) => getComputedStyle(i).display).join(',') : '',
      contentsLeft: contents && !contents.hidden ? r2(rect(contents)!.left - er.left) : 0,
      fillW: fill ? r2(rect(fill)!.width) : 0, trackH: track ? r2(rect(track)!.height) : 0,
      thumbLeft: thumb ? r2(rect(thumb)!.left - er.left) : 0, opacity: getComputedStyle(el).opacity,
      font: getComputedStyle(el).fontFamily,
      bg: getComputedStyle(el).backgroundColor, radius: getComputedStyle(el).borderTopLeftRadius, pad: getComputedStyle(el).paddingLeft,
      // Child layout: each part's offset and size (covers slots, labels, swatches and container gaps).
      kids: kids.filter((k) => k.localName !== 'input' && k.localName !== 'progress' && !k.hidden).map((k) => { const r = k.getBoundingClientRect(); return `${r2(r.left - er.left)}:${r2(r.top - er.top)}:${r2(r.width)}x${r2(r.height)}:${getComputedStyle(k).backgroundColor}:${getComputedStyle(k).outlineStyle}`; }).join(' '),
    };
  };
  // State contract (contracts/states.json): the twins carry the same data-* state attributes.
  const STRUCTURE = new Set(['data-ui', 'data-part', 'data-size', 'data-icon-size', 'data-hide-label', 'data-selectable', 'data-mark', 'data-dir', 'data-index', 'data-remove', 'data-hover-controls', 'data-no-dots', 'data-no-paddles', 'data-ratio', 'data-fit', 'data-slideshow', 'data-generated', 'data-k', 'data-case', 'data-side', 'data-avatar-size']);
  const stateOf = (el: Element) => [...el.attributes].map((a) => a.name).filter((n) => n.startsWith('data-') && !STRUCTURE.has(n)).sort().join(' ');
  for (const c of root.querySelectorAll('[data-case]')) {
    const [wc, re] = [c.querySelector('[data-side=wc]')!, c.querySelector('[data-side=react]')!];
    for (const k of ['bt', 'btL', 'btD', 'cb', 'cbOn', 'cbMixed', 'cbOff', 'rd', 'sw', 'rg', 'pg', 'ch', 'chX', 'sws', 'swa', 'pl', 'plv', 'lb', 'sg', 'sp', 'spv', 'av', 'avS', 'avX', 'mt', 'mtN']) {
      const a = host(wc, k), b = host(re, k);
      const parts = (h: HTMLElement) => [h, ...h.querySelectorAll('[role=option], [data-ui=swatch], ui-swatch')];
      const pa = parts(a), pb = parts(b);
      checks++;
      if (pa.length !== pb.length) { fails.push(`u${c.getAttribute('data-case')} ${k} state parts: wc ${pa.length} react ${pb.length}`); continue; }
      pa.forEach((x, i) => { const va = stateOf(x), vb = stateOf(pb[i]); if (va !== vb) fails.push(`u${c.getAttribute('data-case')} ${k}[${i}] data-*: wc "${va}" react "${vb}"`); });
    }
  }
  for (const c of root.querySelectorAll('[data-case]')) {
    const [wc, re] = [c.querySelector('[data-side=wc]')!, c.querySelector('[data-side=react]')!];
    for (const k of ['bt', 'btI', 'btO', 'btL', 'btD', 'btP', 'cb', 'cbOn', 'cbMixed', 'cbOff', 'rd', 'sw', 'rg', 'fd', 'pg', 'bd', 'tg', 'ch', 'chX', 'sws', 'swa', 'pl', 'plv', 'im', 'imc', 'cd', 'gp', 'lb', 'sg', 'swp', 'ims', 'sp', 'spv', 'av', 'avS', 'avX', 'mt', 'mtN']) {
      const a = measure(host(wc, k)), b = measure(host(re, k));
      for (const key of Object.keys(a) as (keyof typeof a)[]) {
        checks++;
        if (a[key] !== b[key]) fails.push(`u${c.getAttribute('data-case')} ${k}.${key}: wc ${a[key]} react ${b[key]}`);
      }
    }
  }
  // Input: same parts; the React control holds a native <input> as its contents part.
  for (const c of root.querySelectorAll('[data-case]')) {
    const wc = c.querySelector('[data-side=wc] [data-k=in] ui-input') as HTMLElement, re = c.querySelector('[data-side=react] [data-k=in] [data-ui=input]') as HTMLElement;
    for (const sel of [':scope > [data-part=label]', ':scope > [data-part=control]', ':scope > [data-part=control] > [data-part=prefix]', ':scope > [data-part=control] > [data-part=contents]', ':scope > [data-part=control] > [data-part=suffix]', ':scope > [data-part=description]']) {
      const ea = wc.querySelector(sel), eb = re.querySelector(sel);
      const fa = (e: Element | null, h: Element) => { if (!e) return 'missing'; const r = e.getBoundingClientRect(), hr = h.getBoundingClientRect(), cs = getComputedStyle(e); return `${r2(r.left - hr.left)}:${r2(r.top - hr.top)}:${r2(r.width)}x${r2(r.height)}:${cs.backgroundColor}:${cs.borderTopLeftRadius}:${cs.paddingLeft}:${cs.color}:${cs.fontSize}:${cs.fontFamily}`; };
      checks++;
      const va = fa(ea, wc), vb = fa(eb, re);
      if (va !== vb) fails.push(`u${c.getAttribute('data-case')} in${sel.replace(':scope', '')}: wc ${va} react ${vb}`);
    }
  }
  // Select: same parts, different DOM (the React trigger is the <button> inside a native <select>).
  if (CSS.supports('appearance', 'base-select')) for (const c of root.querySelectorAll('[data-case]')) {
    const wc = c.querySelector('[data-side=wc] [data-k=sel]') as HTMLElement, re = c.querySelector('[data-side=react] [data-k=sel] [data-ui=select]') as HTMLElement;
    const parts: [string, string, string][] = [
      ['host', ':scope', ':scope'], ['label', ':scope > [data-part=label]', ':scope > [data-part=label]'],
      ['trigger', ':scope > [data-part=trigger]', ':scope > select > [data-part=trigger]'],
      ['leading', ':scope > [data-part=trigger] > [data-part=leading]', ':scope > select > [data-part=trigger] > [data-part=leading]'],
      ['value', ':scope > [data-part=trigger] > [data-part=value]', ':scope > select > [data-part=trigger] > [data-part=value]'],
      ['chevron', ':scope > [data-part=trigger] > [data-part=icon]', ':scope > select > [data-part=trigger] > [data-part=icon]'],
    ];
    for (const [name, a, b] of parts) {
      const ea = wc.querySelector(a) ?? wc, eb = re.querySelector(b) ?? re;
      const fa = (e: Element, h: Element) => { const r = e.getBoundingClientRect(), hr = h.getBoundingClientRect(), cs = getComputedStyle(e); return `${r2(r.left - hr.left)}:${r2(r.top - hr.top)}:${r2(r.width)}x${r2(r.height)}:${cs.backgroundColor}:${cs.borderTopLeftRadius}:${cs.paddingLeft}:${cs.color}:${cs.fontSize}`; };
      checks++;
      const va = name === 'host' ? fa(wc, wc) : fa(ea as Element, wc), vb = name === 'host' ? fa(re, re) : fa(eb as Element, re);
      if (va !== vb) fails.push(`u${c.getAttribute('data-case')} sel.${name}: wc ${va} react ${vb}`);
    }
  }
  // Composition: each composed form against its preset, the host (measure) and every part below it
  // (offset, size, paint, type), and the data-* state of the host and its parts.
  // Closed popups and native options have no box (and an arbitrary position): they are left out.
  const deep = (h: HTMLElement) => [...h.querySelectorAll<HTMLElement>('[data-part], [role=option], ui-option')].filter((e) => !e.closest('[hidden]') && e.getClientRects().length > 0 && e.getBoundingClientRect().width > 0).map((e) => {
    const r = e.getBoundingClientRect(), hr = h.getBoundingClientRect(), cs = getComputedStyle(e);
    return `${e.getAttribute('data-part') ?? 'option'}@${r2(r.left - hr.left)}:${r2(r.top - hr.top)}:${r2(r.width)}x${r2(r.height)}:${cs.backgroundColor}:${cs.color}:${cs.borderTopLeftRadius}:${cs.paddingLeft}:${cs.fontSize}:${cs.display}:${stateOf(e)}`;
  }).join(' | ');
  for (const c of composedRoot.querySelectorAll('[data-ccase]')) {
    const [pre, com] = [c.querySelector('[data-side=preset]')!, c.querySelector('[data-side=composed]')!];
    const u = c.getAttribute('data-ccase');
    const keys = [...pre.querySelectorAll('[data-k]')].map((e) => e.getAttribute('data-k')!);
    if (keys.length < 20) fails.push(`u${u} composed: only ${keys.length} cases`);
    for (const k of keys) {
      const a = host(pre, k), b = host(com, k);
      // A select's closed popup has no box: measure() would read its position, so selects compare by parts only.
      const sel = k === 'sel' || k === 'wsel';
      const ma = sel ? {} : measure(a), mb = sel ? {} : measure(b);
      for (const key of Object.keys(ma) as (keyof typeof ma)[]) {
        checks++;
        if (ma[key] !== (mb as typeof ma)[key]) fails.push(`u${u} composed ${k}.${key}: preset ${ma[key]} composed ${(mb as typeof ma)[key]}`);
      }
      checks++;
      const da = deep(a), db = deep(b);
      if (!da) fails.push(`u${u} composed ${k}: no parts measured`);
      if (da !== db) fails.push(`u${u} composed ${k} parts: preset ${da} composed ${db}`);
      checks++;
      if (stateOf(a) !== stateOf(b)) fails.push(`u${u} composed ${k} data-*: preset "${stateOf(a)}" composed "${stateOf(b)}"`);
    }
  }
  // Keyboard: ArrowDown on a focused listbox moves and selects (selection follows focus) in both.
  const u4 = root.querySelector('[data-case="4"]')!;
  const lbs = [u4.querySelector('[data-side=wc] [data-k=lb]') as HTMLElement, u4.querySelector('[data-side=react] [data-k=lb]') as HTMLElement];
  const read = (lb: HTMLElement) => [...lb.querySelectorAll('[role=option]')].map((o) => `${o.getAttribute('aria-selected')}${o.hasAttribute('data-highlighted') ? '*' : ''}`).join(',') + ` ad=${!!lb.getAttribute('aria-activedescendant')}`;
  const press = (lb: HTMLElement) => new Promise<string>((done) => {
    lb.focus();
    lb.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true, cancelable: true }));
    setTimeout(() => done(read(lb)), 150);
  });
  press(lbs[0]).then((a) => press(lbs[1]).then((b) => {
    checks++;
    if (a !== b) fails.push(`keyboard listbox: wc ${a} react ${b}`);
    document.getElementById('out')!.textContent = JSON.stringify({ checks, fails }, null, 1);
  }));
  if (false) document.getElementById('out')!.textContent = JSON.stringify({ checks, fails }, null, 1);
}, 600);
