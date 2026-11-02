// Browser parity check: every native React renderer next to its web component, at several sizes and
// states. Compares rendered geometry and paint; "fails": [] means the twins match.
import '../index.css';
import '@massimo/ui-kit/components/choice/element';
import '@massimo/ui-kit/components/range/element';
import '@massimo/ui-kit/icons';
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
    };
  };
  for (const c of root.querySelectorAll('[data-case]')) {
    const [wc, re] = [c.querySelector('[data-side=wc]')!, c.querySelector('[data-side=react]')!];
    for (const k of ['cb', 'cbOn', 'cbMixed', 'cbOff', 'rd', 'sw', 'rg', 'pg']) {
      const a = measure(host(wc, k)), b = measure(host(re, k));
      for (const key of Object.keys(a) as (keyof typeof a)[]) {
        checks++;
        if (a[key] !== b[key]) fails.push(`u${c.getAttribute('data-case')} ${k}.${key}: wc ${a[key]} react ${b[key]}`);
      }
    }
  }
  document.getElementById('out')!.textContent = JSON.stringify({ checks, fails }, null, 1);
}, 600);
