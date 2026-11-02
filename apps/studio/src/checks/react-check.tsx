// Browser parity check: every native React renderer next to its web component, at several sizes and
// states. Compares rendered geometry and paint; "fails": [] means the twins match.
import '../index.css';
import '@massimo/ui-kit/components/choice/element';
import '@massimo/ui-kit/components/range/element';
import '@massimo/ui-kit/components/btg/element';
import '@massimo/ui-kit/components/color/element';
import '@massimo/ui-kit/components/image/element';
import '@massimo/ui-kit/components/listbox/element';
import '@massimo/ui-kit/components/swiper/element';
import '@massimo/ui-kit/icons';
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

const UNITS = [2, 3, 4, 4.5, 6];
const r2 = (v: number) => Math.round(v * 100) / 100;

function Pair({ u }: { u: number }) {
  return (
    <div data-size={u} data-case={u} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, width: 640, marginBottom: 16 }}>
      <div data-side="wc">
        <ui-checkbox data-k="cb">Accept</ui-checkbox>
        <ui-checkbox data-k="cbOn" checked>Accept</ui-checkbox>
        <ui-checkbox data-k="cbMixed" indeterminate>Some</ui-checkbox>
        <ui-checkbox data-k="cbOff" disabled>Off</ui-checkbox>
        <ui-radio data-k="rd" name={`r${u}`} value="a" checked>One</ui-radio>
        <ui-switch data-k="sw" checked>Wi-Fi<span slot="suffix">on</span></ui-switch>
        <div style={{ width: 300 }}><ui-range data-k="rg" value={25} /></div>
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
        <div style={{ width: 300 }}><ui-swiper data-k="swp" label="Highlights"><div style={{ height: 80 }}>One</div><div>Two</div><div>Three</div></ui-swiper></div>
        <div style={{ width: 200 }}><ui-image data-k="ims" slideshow ratio="square" alt="Products"><img src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" alt="1" /><img src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" alt="2" /></ui-image></div>
      </div>
      <div data-side="react">
        <Checkbox data-k="cb">Accept</Checkbox>
        <Checkbox data-k="cbOn" defaultChecked>Accept</Checkbox>
        <Checkbox data-k="cbMixed" indeterminate>Some</Checkbox>
        <Checkbox data-k="cbOff" disabled>Off</Checkbox>
        <Radio data-k="rd" name={`rr${u}`} value="a" defaultChecked>One</Radio>
        <Switch data-k="sw" defaultChecked suffix="on">Wi-Fi</Switch>
        <div style={{ width: 300 }}><Range data-k="rg" defaultValue={25} label="Volume" /></div>
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
        <div style={{ width: 300 }}><Swiper data-k="swp" label="Highlights"><div style={{ height: 80 }}>One</div><div>Two</div><div>Three</div></Swiper></div>
        <div style={{ width: 200 }}><Image data-k="ims" slideshow ratio="square" alt="Products"><img src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" alt="1" /><img src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" alt="2" /></Image></div>
      </div>
    </div>
  );
}

const root = document.getElementById('root')!;
flushSync(() => createRoot(root).render(<>{UNITS.map((u) => <Pair key={u} u={u} />)}</>));

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
    const box = q('[data-part=box]'), track = q('[data-part=track]'), fill = q('[data-part=fill]'), thumb = q('[data-part=thumb]'), contents = q('[data-part=contents]');
    const er = rect(el)!;
    return {
      height: r2(er.height), width: r2(er.width),
      boxW: box ? r2(rect(box)!.width) : 0, boxBg: box ? getComputedStyle(box).backgroundColor : '',
      boxAfter: box ? getComputedStyle(box, '::after').translate + ' ' + getComputedStyle(box, '::after').backgroundColor : '',
      mark: box ? [...box.querySelectorAll('i')].map((i) => getComputedStyle(i).display).join(',') : '',
      contentsLeft: contents ? r2(rect(contents)!.left - er.left) : 0,
      fillW: fill ? r2(rect(fill)!.width) : 0, trackH: track ? r2(rect(track)!.height) : 0,
      thumbLeft: thumb ? r2(rect(thumb)!.left - er.left) : 0, opacity: getComputedStyle(el).opacity,
      font: getComputedStyle(el).fontFamily,
      bg: getComputedStyle(el).backgroundColor, radius: getComputedStyle(el).borderTopLeftRadius, pad: getComputedStyle(el).paddingLeft,
      // Child layout: each part's offset and size (covers slots, labels, swatches and container gaps).
      kids: kids.filter((k) => k.localName !== 'input' && k.localName !== 'progress' && !k.hidden).map((k) => { const r = k.getBoundingClientRect(); return `${r2(r.left - er.left)}:${r2(r.top - er.top)}:${r2(r.width)}x${r2(r.height)}:${getComputedStyle(k).backgroundColor}:${getComputedStyle(k).outlineStyle}`; }).join(' '),
    };
  };
  for (const c of root.querySelectorAll('[data-case]')) {
    const [wc, re] = [c.querySelector('[data-side=wc]')!, c.querySelector('[data-side=react]')!];
    for (const k of ['cb', 'cbOn', 'cbMixed', 'cbOff', 'rd', 'sw', 'rg', 'pg', 'bd', 'tg', 'ch', 'chX', 'sws', 'swa', 'pl', 'plv', 'im', 'imc', 'cd', 'gp', 'lb', 'sg', 'swp', 'ims']) {
      const a = measure(host(wc, k)), b = measure(host(re, k));
      for (const key of Object.keys(a) as (keyof typeof a)[]) {
        checks++;
        if (a[key] !== b[key]) fails.push(`u${c.getAttribute('data-case')} ${k}.${key}: wc ${a[key]} react ${b[key]}`);
      }
    }
  }
  document.getElementById('out')!.textContent = JSON.stringify({ checks, fails }, null, 1);
}, 600);
