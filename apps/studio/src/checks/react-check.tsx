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
import '@massimo/ui-kit/components/toggle/element';
import '@massimo/ui-kit/components/radio-group/element';
import '@massimo/ui-kit/components/checkbox-group/element';
import '@massimo/ui-kit/components/fieldset/element';
import '@massimo/ui-kit/components/collapsible/element';
import '@massimo/ui-kit/components/accordion/element';
import '@massimo/ui-kit/components/tabs/element';
import { createToastManager, type ToastManager } from '@massimo/ui-kit/components/toast/element';
import '@massimo/ui-kit/components/form/element';
import '@massimo/ui-kit/components/scroll-area/element';
import '@massimo/ui-kit/components/number-field/element';
import '@massimo/ui-kit/components/otp-field/element';
import '@massimo/ui-kit/components/combobox/element';
import '@massimo/ui-kit/components/autocomplete/element';
import '@massimo/ui-kit/components/toggle-group/element';
import '@massimo/ui-kit/components/dialog/element';
import '@massimo/ui-kit/components/alert-dialog/element';
import '@massimo/ui-kit/components/drawer/element';
import '@massimo/ui-kit/components/menu/element';
import '@massimo/ui-kit/components/context-menu/element';
import '@massimo/ui-kit/components/menubar/element';
import '@massimo/ui-kit/components/popover/element';
import '@massimo/ui-kit/components/tooltip/element';
import '@massimo/ui-kit/components/preview-card/element';
import '@massimo/ui-kit/components/navigation-menu/element';
import '@massimo/ui-kit/icons';
import { Button } from '@massimo/ui-kit/components/button/react';
import { Input } from '@massimo/ui-kit/components/input/react';
import { Select, SelectOption } from '@massimo/ui-kit/components/select/react';
import { Swiper } from '@massimo/ui-kit/components/swiper/react';
import { Listbox, Segmented, Option } from '@massimo/ui-kit/components/listbox/react';
import { Badge, Tag, Chip } from '@massimo/ui-kit/components/btg/react';
import { Swatch, Palette } from '@massimo/ui-kit/components/color/react';
import { Image } from '@massimo/ui-kit/components/image/react';
import { Container } from '@massimo/ui-kit/components/container/react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import { useState } from 'react';
import { Checkbox, Radio, Switch } from '@massimo/ui-kit/components/choice/react';
import { Range, Progress } from '@massimo/ui-kit/components/range/react';
import { Field } from '@massimo/ui-kit/components/field/react';
import { Slider } from '@massimo/ui-kit/components/range/react';
import { Separator } from '@massimo/ui-kit/components/separator/react';
import { Avatar } from '@massimo/ui-kit/components/avatar/react';
import { Meter } from '@massimo/ui-kit/components/meter/react';
import { Toggle } from '@massimo/ui-kit/components/toggle/react';
import { RadioGroup } from '@massimo/ui-kit/components/radio-group/react';
import { CheckboxGroup } from '@massimo/ui-kit/components/checkbox-group/react';
import { Fieldset } from '@massimo/ui-kit/components/fieldset/react';
import { Form } from '@massimo/ui-kit/components/form/react';
import { ScrollArea } from '@massimo/ui-kit/components/scroll-area/react';
import { Combobox } from '@massimo/ui-kit/components/combobox/react';
import { Autocomplete } from '@massimo/ui-kit/components/autocomplete/react';
import { Collapsible } from '@massimo/ui-kit/components/collapsible/react';
import { Accordion } from '@massimo/ui-kit/components/accordion/react';
import { Tabs } from '@massimo/ui-kit/components/tabs/react';
import { Toast } from '@massimo/ui-kit/components/toast/react';
import { NumberField } from '@massimo/ui-kit/components/number-field/react';
import { OTPField } from '@massimo/ui-kit/components/otp-field/react';
import { ToggleGroup } from '@massimo/ui-kit/components/toggle-group/react';
import { Dialog } from '@massimo/ui-kit/components/dialog/react';
import { AlertDialog } from '@massimo/ui-kit/components/alert-dialog/react';
import { Drawer } from '@massimo/ui-kit/components/drawer/react';
import { Menu } from '@massimo/ui-kit/components/menu/react';
import { ContextMenu } from '@massimo/ui-kit/components/context-menu/react';
import { Menubar } from '@massimo/ui-kit/components/menubar/react';
import { Popover } from '@massimo/ui-kit/components/popover/react';
import { Tooltip } from '@massimo/ui-kit/components/tooltip/react';
import { PreviewCard } from '@massimo/ui-kit/components/preview-card/react';
import { NavigationMenu } from '@massimo/ui-kit/components/navigation-menu/react';

/** Toast twins: each side draws its own manager seeded with the same two toasts (no timeout). */
const seedToasts = (m: ToastManager) => {
  m.add({ id: 'b', title: 'Second', description: 'More text that wraps onto a second line here.' });
  m.add({ id: 'a', title: 'Saved', description: 'Draft stored.', type: 'success', actionProps: { children: 'Undo' } });
  return m;
};
const seeded = new WeakSet<Element>();
function ToastWc({ k }: { k: string }) {
  const ref = (el: (HTMLElement & { manager: ToastManager }) | null) => { if (el && !seeded.has(el)) { seeded.add(el); el.manager = seedToasts(createToastManager({ timeout: 0 })); } };
  return <ui-toast-viewport ref={ref} data-k={k} placement="inline" />;
}
function ToastReact({ k }: { k: string }) {
  const [m] = useState(() => seedToasts(createToastManager({ timeout: 0 })));
  return <Toast.Provider toastManager={m} timeout={0}><Toast.Viewport data-k={k} placement="inline" /></Toast.Provider>;
}

const UNITS = [2, 3, 4, 4.5, 6];
/** Group twins (radio group, checkbox group, fieldset): measured, and their members' data-* compared. */
const GROUP_KEYS = ['rgv', 'rgh', 'cgv', 'cgh', 'fs', 'fsd', 'fm'];
const r2 = (v: number) => Math.round(v * 100) / 100;
/** Attributes the DOM types lack (a navigation item's value and label, a link's active), for ui-navigation-menu markup. */
const nav = (a: Record<string, string>) => a as Record<string, string>;

// ── Anchored popups: twins opened one pair at a time (open = "<u>:<key>"), measured at rest ──
const POPUP_KEYS = ['pop', 'tip', 'pc', 'nav'];
function PopupPair({ u, open }: { u: number; open: string | null }) {
  const on = (k: string) => open === `${u}:${k}`;
  return (
    <div data-size={u} data-pcase={u} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, width: 640, height: 60 * u }}>
      <div data-side="wc">
        <ui-popover data-k="pop" side="bottom" align="start" open={on('pop')}><ui-button data-part="trigger">Open popover</ui-button><div data-part="popup"><h2 data-part="title">Title</h2><p data-part="description">Description text</p><div data-part="arrow" /></div></ui-popover>
        <ui-tooltip data-k="tip" side="bottom" open={on('tip')}><ui-button data-part="trigger">Tip</ui-button><div data-part="popup">Tooltip text<div data-part="arrow" /></div></ui-tooltip>
        <ui-preview-card data-k="pc" side="bottom" align="start" open={on('pc')}><a data-part="trigger" href="#x">Preview</a><div data-part="popup"><strong>Card</strong><span>Body</span><div data-part="arrow" /></div></ui-preview-card>
        <ui-navigation-menu data-k="nav" label="N" value={on('nav') ? 'a' : ''}><div data-part="item" {...nav({ value: 'a', label: 'Menu' })}><a href="#a">Link one</a><a href="#b" {...nav({ active: '' })}>Link two</a></div><div data-part="item" {...nav({ value: 'p' })}><a data-part="link" href="#c">Plain</a></div></ui-navigation-menu>
      </div>
      <div data-side="react">
        <Popover.Root data-k="pop" open={on('pop')}><Popover.Trigger>Open popover</Popover.Trigger><Popover.Positioner side="bottom" align="start"><Popover.Popup><Popover.Title>Title</Popover.Title><Popover.Description>Description text</Popover.Description></Popover.Popup><Popover.Arrow /></Popover.Positioner></Popover.Root>
        <Tooltip.Root data-k="tip" open={on('tip')}><Tooltip.Trigger>Tip</Tooltip.Trigger><Tooltip.Positioner side="bottom"><Tooltip.Popup>Tooltip text</Tooltip.Popup><Tooltip.Arrow /></Tooltip.Positioner></Tooltip.Root>
        <PreviewCard.Root data-k="pc" open={on('pc')}><PreviewCard.Trigger href="#x">Preview</PreviewCard.Trigger><PreviewCard.Positioner side="bottom" align="start"><PreviewCard.Popup><strong>Card</strong><span>Body</span></PreviewCard.Popup><PreviewCard.Arrow /></PreviewCard.Positioner></PreviewCard.Root>
        <NavigationMenu data-k="nav" label="N" value={on('nav') ? 'a' : ''}><NavigationMenu.Item value="a" label="Menu"><NavigationMenu.Link href="#a">Link one</NavigationMenu.Link><NavigationMenu.Link href="#b" active>Link two</NavigationMenu.Link></NavigationMenu.Item><NavigationMenu.Item value="p"><NavigationMenu.Link href="#c">Plain</NavigationMenu.Link></NavigationMenu.Item></NavigationMenu>
      </div>
    </div>
  );
}

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
        <div style={{ width: 300 }}><ui-number-field data-k="nf" label="Width" value={1234.5} min={0} max={1234.5} description="In px" locale="en-US"><span slot="prefix">$</span></ui-number-field></div>
        <div style={{ width: 300 }}><ui-number-field data-k="nfD" label="Off" value={3} disabled locale="en-US"><span slot="suffix">kg</span></ui-number-field></div>
        <ui-otp-field data-k="otp" length={4} value="12" label="Code" />
        <ui-otp-field data-k="otpD" length={3} value="123" disabled />
        <div style={{ width: 300 }} data-k="cmb"><ui-combobox label="Fruit" value="b" description="Pick one"><i slot="leading" name="leaf" /><ui-option value="a">Apple</ui-option><ui-option value="b">Banana</ui-option></ui-combobox></div>
        <div style={{ width: 300 }} data-k="acp"><ui-autocomplete label="City" value="Os" mode="both" show-trigger><i slot="leading" name="map-pin" /><ui-option>Oslo</ui-option><ui-option>Osaka</ui-option></ui-autocomplete></div>
        <div style={{ width: 220 }} data-k="cmbM"><ui-combobox multiple value="a,b,c" placeholder="Add"><ui-option value="a">Apple</ui-option><ui-option value="b">Banana</ui-option><ui-option value="c">Cherry</ui-option></ui-combobox></div>
        <ui-checkbox data-k="cb">Accept</ui-checkbox>
        <ui-checkbox data-k="cbOn" checked>Accept</ui-checkbox>
        <ui-checkbox data-k="cbMixed" indeterminate>Some</ui-checkbox>
        <ui-checkbox data-k="cbOff" disabled>Off</ui-checkbox>
        <ui-radio data-k="rd" name={`r${u}`} value="a" checked>One</ui-radio>
        <ui-switch data-k="sw" checked>Wi-Fi<span slot="suffix">on</span></ui-switch>
        <div style={{ width: 300 }}><ui-range data-k="rg" value={25} /></div>
        <div style={{ width: 300 }}><ui-range data-k="rgP" value={[20, 70]} label="Price" /></div>
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
        <ui-container data-k="cd" preset="card"><ui-section><span>a</span><span>b</span></ui-section></ui-container>
        <ui-container data-k="gp" preset="group" gap="2"><span>a</span><span>b</span></ui-container>
        <ui-container data-k="uc" preset="card" padding="lg"><ui-section><ui-container data-k="ucN" preset="group"><span>a</span><span>b</span></ui-container></ui-section></ui-container>
        <ui-container data-k="ucL" preset="card" padding="xl"><ui-section><ui-container data-k="ucL1" preset="card"><ui-section><span>b</span></ui-section></ui-container></ui-section></ui-container>
        <ui-container data-k="ucS" preset="collection" layout="row" surface="raised" radius="0.5" gap="1"><span>a</span><span>b</span></ui-container>
        <ui-listbox data-k="lb" label="Folder" value="inbox"><ui-option value="inbox"><i slot="leading" name="tray" />Inbox<span slot="suffix">12</span></ui-option><ui-option value="sent">Sent</ui-option><ui-option value="spam" disabled>Spam</ui-option></ui-listbox>
        <ui-segmented data-k="sg" label="View" value="grid"><ui-option value="grid">Grid</ui-option><ui-option value="list">List</ui-option></ui-segmented>
        <div style={{ width: 300 }}><ui-select data-k="sel" label="Role" value="eng"><i slot="leading" name="briefcase" /><ui-option value="design">Designer</ui-option><ui-option value="eng">Engineer</ui-option></ui-select></div>
        <div style={{ width: 300 }}><ui-swiper data-k="swp" label="Highlights"><div style={{ height: 80 }}>One</div><div>Two</div><div>Three</div></ui-swiper></div>
        <div style={{ width: 200 }}><ui-image data-k="ims" slideshow ratio="square" alt="Products"><img src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" alt="1" /><img src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" alt="2" /></ui-image></div>
        <div style={{ width: 300 }}><ui-separator data-k="sp" /></div>
        <div style={{ display: 'flex', height: 40 }}><ui-separator data-k="spv" orientation="vertical" /></div>
        <ui-avatar data-k="av" name="Ada Lovelace" />
        <ui-toggle data-k="tg"><i slot="leading" name="star" />Star</ui-toggle>
        <ui-toggle data-k="tgP" pressed>Bold<span slot="suffix">B</span></ui-toggle>
        <ui-toggle data-k="tgD" disabled aria-label="Off"><i slot="leading" name="text-b" /></ui-toggle>
        <ui-toggle-group data-k="tgg" multiple value="b"><ui-toggle value="b"><i slot="leading" name="text-b" />Bold</ui-toggle><ui-toggle value="i">Italic</ui-toggle><ui-toggle value="u" disabled>Under</ui-toggle></ui-toggle-group>
        <ui-toggle-group data-k="tggV" orientation="vertical" value="a"><ui-toggle value="a">One</ui-toggle><ui-toggle value="b">Two</ui-toggle></ui-toggle-group>
        <div style={{ width: 300 }}><ui-meter data-k="mt" label="Storage" value={30} /></div>
        <div style={{ width: 300 }}><ui-meter data-k="mtN" value={3} max={4} format='{"style":"decimal"}' /></div>
        <ui-avatar data-k="avS" avatar-size="sm" />
        <ui-avatar data-k="avX" avatar-size="xl" alt="Team">TM</ui-avatar>
        <ui-radio-group data-k="rgv" value="b"><ui-radio value="a">One</ui-radio><ui-radio value="b">Two</ui-radio></ui-radio-group>
        <ui-radio-group data-k="rgh" orientation="horizontal" disabled><ui-radio value="a">One</ui-radio><ui-radio value="b">Two</ui-radio></ui-radio-group>
        <ui-checkbox-group data-k="cgv" value="a"><ui-checkbox parent>All</ui-checkbox><ui-checkbox value="a">One</ui-checkbox><ui-checkbox value="b">Two</ui-checkbox></ui-checkbox-group>
        <ui-checkbox-group data-k="cgh" orientation="horizontal" value="a b" disabled><ui-checkbox value="a">One</ui-checkbox><ui-checkbox value="b">Two</ui-checkbox></ui-checkbox-group>
        <div style={{ width: 300 }}><ui-fieldset data-k="fs" legend="Address"><ui-checkbox>Same</ui-checkbox><ui-switch checked>Ship</ui-switch></ui-fieldset></div>
        <div style={{ width: 300 }}><ui-fieldset data-k="fsd" legend="Address" disabled><ui-checkbox checked>Same</ui-checkbox><ui-radio-group value="a"><ui-radio value="a">One</ui-radio></ui-radio-group></ui-fieldset></div>
        <div style={{ width: 300 }}><ui-form data-k="fm"><ui-checkbox name="same">Same</ui-checkbox><ui-switch name="ship" checked>Ship</ui-switch></ui-form></div>
        <ui-scroll-area data-k="sa" style={{ height: 120, width: 240 }}><div style={{ width: 480, height: 480 }} /></ui-scroll-area>
        <ui-scroll-area data-k="saY" style={{ height: 120, width: 240 }}><div style={{ height: 480 }} /></ui-scroll-area>
        <div style={{ width: 300 }}><ui-collapsible data-k="col" label="Details" open><p>Panel</p></ui-collapsible></div>
        <div style={{ width: 300 }}><ui-collapsible data-k="colD" label="Off" disabled><p>Panel</p></ui-collapsible></div>
        <div style={{ width: 300 }}><ui-tabs data-k="tab" default-value="b"><div data-part="list"><div {...{ value: 'a' }} data-part="tab">A</div><div {...{ value: 'b' }} data-part="tab"><i slot="leading" name="code" />B</div><div {...{ value: 'c', disabled: true }} data-part="tab">C</div></div><div {...{ value: 'a' }} data-part="panel">a</div><div {...{ value: 'b' }} data-part="panel">b</div><div {...{ value: 'c' }} data-part="panel">c</div></ui-tabs></div>
        <div style={{ width: 300 }}><ToastWc k="tst" /></div>
        <div style={{ width: 300 }}><ui-tabs data-k="tabU" variant="underline"><div {...{ value: 'a', label: 'One' }} data-part="panel">a</div><div {...{ value: 'b', label: 'Two' }} data-part="panel">b</div></ui-tabs></div>
        <div style={{ width: 300 }}><ui-menu data-k="mn"><div data-part="trigger"><i slot="leading" name="sliders" />View</div><div data-part="popup"><div data-part="item">Cut</div><div {...{ checked: '' }} data-part="checkbox-item">Grid</div></div></ui-menu></div>
        <div style={{ width: 300 }}><ui-menu data-k="mnO" label="Open" default-open><div data-part="item">Cut<span slot="suffix">X</span></div><div data-part="item"><i slot="leading" name="copy" />Copy</div><div data-part="separator" /><div {...{ checked: '' }} data-part="checkbox-item">Grid</div><div data-part="group"><div data-part="group-label">Sort</div><div {...{ value: 'a' }} data-part="radio-group"><div {...{ value: 'a' }} data-part="radio-item">A</div><div {...{ value: 'b' }} data-part="radio-item">B</div></div></div></ui-menu></div>
        <div style={{ width: 300 }}><ui-menu data-k="mnD" label="Off" disabled><div data-part="item">x</div></ui-menu></div>
        <div style={{ width: 300 }}><ui-menubar data-k="mb" label="App"><ui-menu label="File"><div data-part="item">New</div></ui-menu><ui-menu><div data-part="trigger"><i slot="leading" name="pencil" />Edit</div><div data-part="popup"><div data-part="item">Undo</div></div></ui-menu><ui-menu label="Off" disabled><div data-part="item">x</div></ui-menu></ui-menubar></div>
        <div style={{ width: 300 }}><ui-menubar data-k="mbV" orientation="vertical"><ui-menu label="One"><div data-part="item">x</div></ui-menu><ui-menu label="Two"><div data-part="item">y</div></ui-menu></ui-menubar></div>
        <div style={{ width: 300 }}><ui-context-menu data-k="cm"><div data-part="trigger" style={{ height: 6 * u }}>Area</div><div data-part="item">Copy</div></ui-context-menu></div>
        <div style={{ width: 300 }}><ui-accordion data-k="acc" default-value="b"><ui-collapsible value="a" label="A"><p>a</p></ui-collapsible><ui-collapsible value="b" label="B"><i slot="leading" name="truck" /><p>b</p></ui-collapsible><ui-collapsible value="c" label="C" disabled><p>c</p></ui-collapsible></ui-accordion></div>
        <ui-dialog data-k="dlg" modal="false" disable-pointer-dismissal open label="Rename" description="Pick a name."><ui-button data-part="trigger">Rename</ui-button><p>Body</p><div data-part="actions"><ui-button data-part="close">Cancel</ui-button><ui-button variant="primary">Save</ui-button></div></ui-dialog>
        <ui-alert-dialog data-k="adlg" label="Delete?" description="Gone for good."><ui-button data-part="trigger">Delete</ui-button><div data-part="actions"><ui-button data-part="close">Cancel</ui-button><ui-button variant="primary">Delete</ui-button></div></ui-alert-dialog>
        <ui-drawer data-k="drw" side="right" modal="false" disable-pointer-dismissal open label="Filters" description="Narrow the list."><ui-button data-part="trigger">Filters</ui-button><p>Body</p><div data-part="actions"><ui-button data-part="close">Done</ui-button></div></ui-drawer>
      </div>
      <div data-side="react">
        <Button data-k="bt">Save</Button>
        <Button data-k="btI" leading={<i name="plus" />} suffix="⌘N">Add</Button>
        <Button data-k="btO" aria-label="More" leading={<i name="dots-three" />} />
        <Button data-k="btL" loading>Saving</Button>
        <Button data-k="btD" disabled>Off</Button>
        <Button data-k="btP" variant="primary" leading={<i name="plus" />}>Add</Button>
        <div style={{ width: 300 }} data-k="in"><Input label="Price" defaultValue="40" description="Before tax" prefix="$" suffix="USD" /></div>
        <div style={{ width: 300 }}><NumberField data-k="nf" label="Width" defaultValue={1234.5} min={0} max={1234.5} description="In px" locale="en-US" prefix="$" /></div>
        <div style={{ width: 300 }}><NumberField data-k="nfD" label="Off" defaultValue={3} disabled locale="en-US" suffix="kg" /></div>
        <OTPField data-k="otp" length={4} defaultValue="12" label="Code" />
        <OTPField data-k="otpD" length={3} defaultValue="123" disabled />
        <div style={{ width: 300 }} data-k="cmb"><Combobox label="Fruit" defaultValue="b" description="Pick one" leading={<i name="leaf" />}><Combobox.Item value="a">Apple</Combobox.Item><Combobox.Item value="b">Banana</Combobox.Item></Combobox></div>
        <div style={{ width: 300 }} data-k="acp"><Autocomplete label="City" defaultValue="Os" mode="both" showTrigger leading={<i name="map-pin" />}><Autocomplete.Item value="Oslo">Oslo</Autocomplete.Item><Autocomplete.Item value="Osaka">Osaka</Autocomplete.Item></Autocomplete></div>
        <div style={{ width: 220 }} data-k="cmbM"><Combobox multiple defaultValue={['a', 'b', 'c']} placeholder="Add"><Combobox.Item value="a">Apple</Combobox.Item><Combobox.Item value="b">Banana</Combobox.Item><Combobox.Item value="c">Cherry</Combobox.Item></Combobox></div>
        <Checkbox data-k="cb">Accept</Checkbox>
        <Checkbox data-k="cbOn" defaultChecked>Accept</Checkbox>
        <Checkbox data-k="cbMixed" indeterminate>Some</Checkbox>
        <Checkbox data-k="cbOff" disabled>Off</Checkbox>
        <Radio data-k="rd" name={`rr${u}`} value="a" defaultChecked>One</Radio>
        <Switch data-k="sw" defaultChecked suffix="on">Wi-Fi</Switch>
        <div style={{ width: 300 }}><Range data-k="rg" defaultValue={25} label="Volume" /></div>
        <div style={{ width: 300 }}><Range data-k="rgP" defaultValue={[20, 70]} label="Price" /></div>
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
        <Container data-k="cd" preset="card"><ui-section><span>a</span><span>b</span></ui-section></Container>
        <Container data-k="gp" preset="group" gap={2}><span>a</span><span>b</span></Container>
        <Container data-k="uc" preset="card" padding="lg"><ui-section><Container data-k="ucN" preset="group"><span>a</span><span>b</span></Container></ui-section></Container>
        <Container data-k="ucL" preset="card" padding="xl"><ui-section><Container data-k="ucL1" preset="card"><ui-section><span>b</span></ui-section></Container></ui-section></Container>
        <Container data-k="ucS" preset="collection" layout="row" surface="raised" radius={0.5} gap={1}><span>a</span><span>b</span></Container>
        <Listbox data-k="lb" label="Folder" defaultValue="inbox"><Option value="inbox" leading={<i name="tray" />} suffix="12">Inbox</Option><Option value="sent">Sent</Option><Option value="spam" disabled>Spam</Option></Listbox>
        <Segmented data-k="sg" label="View" defaultValue="grid"><Option value="grid">Grid</Option><Option value="list">List</Option></Segmented>
        <div style={{ width: 300 }}><div data-k="sel"><Select label="Role" defaultValue="eng" leading={<i name="briefcase" />}><SelectOption value="design">Designer</SelectOption><SelectOption value="eng">Engineer</SelectOption></Select></div></div>
        <div style={{ width: 300 }}><Swiper data-k="swp" label="Highlights"><div style={{ height: 80 }}>One</div><div>Two</div><div>Three</div></Swiper></div>
        <div style={{ width: 200 }}><Image data-k="ims" slideshow ratio="square" alt="Products"><img src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" alt="1" /><img src="data:image/gif;base64,R0lGODlhAQABAAAAACw=" alt="2" /></Image></div>
        <div style={{ width: 300 }}><Separator data-k="sp" /></div>
        <div style={{ display: 'flex', height: 40 }}><Separator data-k="spv" orientation="vertical" /></div>
        <Avatar data-k="av" name="Ada Lovelace" />
        <Toggle data-k="tg" leading={<i name="star" />}>Star</Toggle>
        <Toggle data-k="tgP" pressed suffix="B">Bold</Toggle>
        <Toggle data-k="tgD" disabled aria-label="Off" leading={<i name="text-b" />} />
        <ToggleGroup data-k="tgg" multiple defaultValue={['b']}><Toggle value="b" leading={<i name="text-b" />}>Bold</Toggle><Toggle value="i">Italic</Toggle><Toggle value="u" disabled>Under</Toggle></ToggleGroup>
        <ToggleGroup data-k="tggV" orientation="vertical" defaultValue={['a']}><Toggle value="a">One</Toggle><Toggle value="b">Two</Toggle></ToggleGroup>
        <div style={{ width: 300 }}><Meter data-k="mt" label="Storage" value={30} /></div>
        <div style={{ width: 300 }}><Meter data-k="mtN" value={3} max={4} format={{ style: 'decimal' }} /></div>
        <Avatar data-k="avS" avatarSize="sm" />
        <Avatar data-k="avX" avatarSize="xl" alt="Team">TM</Avatar>
        <RadioGroup data-k="rgv" defaultValue="b"><Radio value="a">One</Radio><Radio value="b">Two</Radio></RadioGroup>
        <RadioGroup data-k="rgh" orientation="horizontal" disabled><Radio value="a">One</Radio><Radio value="b">Two</Radio></RadioGroup>
        <CheckboxGroup data-k="cgv" defaultValue={['a']} allValues={['a', 'b']}><Checkbox parent>All</Checkbox><Checkbox value="a">One</Checkbox><Checkbox value="b">Two</Checkbox></CheckboxGroup>
        <CheckboxGroup data-k="cgh" orientation="horizontal" defaultValue={['a', 'b']} disabled><Checkbox value="a">One</Checkbox><Checkbox value="b">Two</Checkbox></CheckboxGroup>
        <div style={{ width: 300 }}><Fieldset data-k="fs" legend="Address"><Checkbox>Same</Checkbox><Switch defaultChecked>Ship</Switch></Fieldset></div>
        <div style={{ width: 300 }}><Fieldset data-k="fsd" legend="Address" disabled><Checkbox defaultChecked>Same</Checkbox><RadioGroup defaultValue="a"><Radio value="a">One</Radio></RadioGroup></Fieldset></div>
        <div style={{ width: 300 }}><Form data-k="fm"><Checkbox name="same">Same</Checkbox><Switch name="ship" defaultChecked>Ship</Switch></Form></div>
        <ScrollArea data-k="sa" style={{ height: 120, width: 240 }}><div style={{ width: 480, height: 480 }} /></ScrollArea>
        <ScrollArea data-k="saY" style={{ height: 120, width: 240 }}><div style={{ height: 480 }} /></ScrollArea>
        <div style={{ width: 300 }}><Collapsible data-k="col" label="Details" defaultOpen><p>Panel</p></Collapsible></div>
        <div style={{ width: 300 }}><Collapsible data-k="colD" label="Off" disabled><p>Panel</p></Collapsible></div>
        <div style={{ width: 300 }}><Tabs.Root data-k="tab" defaultValue="b"><Tabs.List><Tabs.Tab value="a">A</Tabs.Tab><Tabs.Tab value="b" leading={<i name="code" />}>B</Tabs.Tab><Tabs.Tab value="c" disabled>C</Tabs.Tab><Tabs.Indicator /></Tabs.List><Tabs.Panel value="a">a</Tabs.Panel><Tabs.Panel value="b">b</Tabs.Panel><Tabs.Panel value="c">c</Tabs.Panel></Tabs.Root></div>
        <div style={{ width: 300 }}><ToastReact k="tst" /></div>
        <div style={{ width: 300 }}><Tabs data-k="tabU" variant="underline" items={[{ value: 'a', label: 'One', content: 'a' }, { value: 'b', label: 'Two', content: 'b' }]} /></div>
        <div style={{ width: 300 }}><Menu.Root data-k="mn"><Menu.Trigger leading={<i name="sliders" />}>View</Menu.Trigger><Menu.Popup><Menu.Item>Cut</Menu.Item><Menu.CheckboxItem defaultChecked>Grid</Menu.CheckboxItem></Menu.Popup></Menu.Root></div>
        <div style={{ width: 300 }}><Menu data-k="mnO" label="Open" defaultOpen><Menu.Item suffix="X">Cut</Menu.Item><Menu.Item leading={<i name="copy" />}>Copy</Menu.Item><Menu.Separator /><Menu.CheckboxItem defaultChecked>Grid</Menu.CheckboxItem><Menu.Group><Menu.GroupLabel>Sort</Menu.GroupLabel><Menu.RadioGroup defaultValue="a"><Menu.RadioItem value="a">A</Menu.RadioItem><Menu.RadioItem value="b">B</Menu.RadioItem></Menu.RadioGroup></Menu.Group></Menu></div>
        <div style={{ width: 300 }}><Menu data-k="mnD" label="Off" disabled><Menu.Item>x</Menu.Item></Menu></div>
        <div style={{ width: 300 }}><Menubar data-k="mb" label="App"><Menu label="File"><Menu.Item>New</Menu.Item></Menu><Menu.Root><Menu.Trigger leading={<i name="pencil" />}>Edit</Menu.Trigger><Menu.Popup><Menu.Item>Undo</Menu.Item></Menu.Popup></Menu.Root><Menu label="Off" disabled><Menu.Item>x</Menu.Item></Menu></Menubar></div>
        <div style={{ width: 300 }}><Menubar data-k="mbV" orientation="vertical"><Menu label="One"><Menu.Item>x</Menu.Item></Menu><Menu label="Two"><Menu.Item>y</Menu.Item></Menu></Menubar></div>
        <div style={{ width: 300 }}><ContextMenu.Root data-k="cm"><ContextMenu.Trigger style={{ height: 6 * u }}>Area</ContextMenu.Trigger><ContextMenu.Popup><ContextMenu.Item>Copy</ContextMenu.Item></ContextMenu.Popup></ContextMenu.Root></div>
        <div style={{ width: 300 }}><Accordion data-k="acc" defaultValue={['b']}><Accordion.Item value="a" label="A"><p>a</p></Accordion.Item><Accordion.Item value="b" label="B" leading={<i name="truck" />}><p>b</p></Accordion.Item><Accordion.Item value="c" label="C" disabled><p>c</p></Accordion.Item></Accordion></div>
        <Dialog data-k="dlg" modal={false} disablePointerDismissal defaultOpen label="Rename" description="Pick a name." trigger="Rename"><p>Body</p><Dialog.Actions><Dialog.Close>Cancel</Dialog.Close><Button variant="primary">Save</Button></Dialog.Actions></Dialog>
        <AlertDialog data-k="adlg" label="Delete?" description="Gone for good." trigger="Delete"><Dialog.Actions><Dialog.Close>Cancel</Dialog.Close><Button variant="primary">Delete</Button></Dialog.Actions></AlertDialog>
        <Drawer data-k="drw" side="right" modal={false} disablePointerDismissal defaultOpen label="Filters" description="Narrow the list." trigger="Filters"><p>Body</p><Drawer.Actions><Drawer.Close>Done</Drawer.Close></Drawer.Actions></Drawer>
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
      <div style={{ width: 300 }}><Range data-k="rgP" defaultValue={[20, 70]} label="Price" /></div>
      <div style={{ width: 300 }}><Progress data-k="pg" value={40} label="Upload" /></div>
      <div style={{ width: 300 }}><Meter data-k="mt" value={40} label="Storage" /></div>
      <div style={{ width: 300 }}><Field data-k="fd" layout="inline" label="Unit" unit="px" readout="4.5" description="Sets u." error="Too big">{(ids) => <Range {...ids} defaultValue={25} />}</Field></div>
      <div style={{ width: 300 }}><Input data-k="in" label="Price" defaultValue="40" description="Before tax" prefix="$" suffix="USD" /></div>
      <div style={{ width: 300 }}><NumberField data-k="nf" label="Width" defaultValue={24} prefix="$" description="In px" locale="en-US" /></div>
      <div style={{ width: 300 }}><ui-number-field data-k="wnf" label="Width" value={24} description="In px" locale="en-US"><span slot="prefix">$</span></ui-number-field></div>
      <OTPField data-k="otp" length={4} defaultValue="12" />
      <ui-otp-field data-k="wotp" length={4} value="12" />
      <Listbox data-k="lb" label="Folder" defaultValue="inbox"><Option value="inbox" leading={<i name="tray" />} suffix="12">Inbox</Option><Option value="sent">Sent</Option></Listbox>
      <Segmented data-k="sg" label="View" defaultValue="grid"><Option value="grid">Grid</Option><Option value="list">List</Option></Segmented>
      <div style={{ width: 300 }}><Select data-k="sel" label="Role" defaultValue="eng" leading={<i name="briefcase" />} description="Pick"><SelectOption value="design">Designer</SelectOption><SelectOption value="eng">Engineer</SelectOption></Select></div>
      <div style={{ width: 300 }}><Collapsible data-k="col" label="Keys" leading={<i name="key" />} defaultOpen><p>Panel</p></Collapsible></div>
      <div style={{ width: 300 }}><ui-collapsible data-k="wcol" label="Keys" open><i slot="leading" name="key" /><p>Panel</p></ui-collapsible></div>
      <div style={{ width: 300 }}><Tabs data-k="tab" variant="underline" label="T" items={[{ value: 'a', label: 'One', leading: <i name="code" />, content: 'a' }, { value: 'b', label: 'Two', content: 'b' }]} /></div>
      <div style={{ width: 300 }}><ui-tabs data-k="wtab" variant="underline" label="T"><div {...{ value: 'a', label: 'One' }} data-part="panel">a</div><div {...{ value: 'b', label: 'Two' }} data-part="panel">b</div></ui-tabs></div>
      <div style={{ width: 300 }}><Menu data-k="mnu" label="Edit" leading={<i name="pencil" />}><Menu.Item>Cut</Menu.Item></Menu></div>
      <div style={{ width: 300 }}><ui-menu data-k="wmnu" label="Edit"><div data-part="item">Cut</div></ui-menu></div>
      <div style={{ width: 300 }}><ContextMenu data-k="cmu" label="Area"><ContextMenu.Item>Copy</ContextMenu.Item></ContextMenu></div>
      <div style={{ width: 300 }}><ui-context-menu data-k="wcmu" label="Area"><div data-part="item">Copy</div></ui-context-menu></div>
      <div style={{ width: 300 }}><Accordion data-k="acc" defaultValue={['a']}><Accordion.Item value="a" label="Ship" leading={<i name="truck" />}><p>a</p></Accordion.Item><Accordion.Item value="b" label="Return"><p>b</p></Accordion.Item></Accordion></div>
      <div style={{ width: 300 }}><ui-accordion data-k="wacc" value="a"><ui-collapsible value="a" label="Ship"><i slot="leading" name="truck" /><p>a</p></ui-collapsible><ui-collapsible value="b" label="Return"><p>b</p></ui-collapsible></ui-accordion></div>
      <Dialog data-k="dlg" modal={false} disablePointerDismissal defaultOpen label="Delete" description="Gone for good." trigger="Delete"><p>Body</p><Dialog.Actions><Dialog.Close>Keep</Dialog.Close></Dialog.Actions></Dialog>
      <ui-dialog data-k="wdlg" modal="false" disable-pointer-dismissal open label="Delete" description="Gone for good."><ui-button data-part="trigger">Delete</ui-button><p>Body</p><div data-part="actions"><ui-button data-part="close">Keep</ui-button></div></ui-dialog>
      <ui-button data-k="wbt"><i slot="leading" name="plus" />Add</ui-button>
      <ui-checkbox data-k="wcb" checked>Accept<span slot="suffix">(2)</span></ui-checkbox>
      <ui-switch data-k="wsw" checked>Wi-Fi<span slot="suffix">on</span></ui-switch>
      <ui-radio data-k="wrd" name={`wr${u}`} value="a" checked>One</ui-radio>
      <div style={{ width: 300 }}><ui-range data-k="wrg" value={25} /></div>
      <div style={{ width: 300 }}><ui-range data-k="wrgP" value={[20, 70]} label="Price" /></div>
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
      <Dialog.Root data-k="dlg" modal={false} disablePointerDismissal defaultOpen>
        <Dialog.Trigger>Delete</Dialog.Trigger>
        <Dialog.Portal><Dialog.Backdrop /><Dialog.Popup><Dialog.Title>Delete</Dialog.Title><Dialog.Description>Gone for good.</Dialog.Description><p>Body</p><Dialog.Actions><Dialog.Close>Keep</Dialog.Close></Dialog.Actions></Dialog.Popup></Dialog.Portal>
      </Dialog.Root>
      <ui-dialog data-k="wdlg" modal="false" disable-pointer-dismissal open><ui-button data-part="trigger">Delete</ui-button><div data-part="backdrop" /><div data-part="popup"><h2 data-part="title">Delete</h2><p data-part="description">Gone for good.</p><p>Body</p><div data-part="actions"><ui-button data-part="close">Keep</ui-button></div></div></ui-dialog>
      <Button data-k="bt" leading={<i name="plus" />} render={<button />}>Add</Button>
      <Checkbox.Root data-k="cb" defaultChecked suffix="(2)"><Checkbox.Indicator />Accept</Checkbox.Root>
      <Checkbox.Root data-k="cbM" indeterminate><Checkbox.Indicator />Some</Checkbox.Root>
      <Radio.Root data-k="rd" name={`cr${u}c`} value="a" defaultChecked><Radio.Indicator />One</Radio.Root>
      <Switch.Root data-k="sw" defaultChecked suffix="on"><Switch.Thumb />Wi-Fi</Switch.Root>
      <div style={{ width: 300 }}><Slider.Root data-k="rg" defaultValue={25} label="Volume"><Slider.Track><Slider.Indicator /></Slider.Track><Slider.Thumb /></Slider.Root></div>
      <div style={{ width: 300 }}><Slider.Root data-k="rgP" defaultValue={[20, 70]} label="Price"><Slider.Track><Slider.Indicator /></Slider.Track><Slider.Thumb index={0} /><Slider.Thumb index={1} /></Slider.Root></div>
      <div style={{ width: 300 }}><Progress.Root data-k="pg" value={40} label="Upload"><Progress.Track><Progress.Indicator /></Progress.Track></Progress.Root></div>
      <div style={{ width: 300 }}><Meter.Root data-k="mt" value={40}><Meter.Label>Storage</Meter.Label><Meter.Value /><Meter.Track><Meter.Indicator /></Meter.Track></Meter.Root></div>
      <div style={{ width: 300 }}>
        <Field.Root data-k="fd" layout="inline">
          <Field.Label unit="px">Unit</Field.Label><Field.Control render={(ids) => <Range {...ids} defaultValue={25} />} />
          <Field.Readout>4.5</Field.Readout><Field.Description>Sets u.</Field.Description><Field.Error>Too big</Field.Error>
        </Field.Root>
      </div>
      <div style={{ width: 300 }}><Input.Root data-k="in" defaultValue="40"><Input.Label>Price</Input.Label><Input.Control prefix="$" suffix="USD" /><Input.Description>Before tax</Input.Description></Input.Root></div>
      <div style={{ width: 300 }}>
        <NumberField.Root data-k="nf" defaultValue={24} locale="en-US">
          <NumberField.ScrubArea><NumberField.Label>Width</NumberField.Label></NumberField.ScrubArea>
          <NumberField.Group prefix="$"><NumberField.Decrement /><NumberField.Input /><NumberField.Increment /></NumberField.Group>
          <NumberField.Description>In px</NumberField.Description>
        </NumberField.Root>
      </div>
      <div style={{ width: 300 }}><ui-number-field data-k="wnf" value={24} locale="en-US"><span data-part="scrub-area"><span data-part="label">Width</span></span><div data-part="group"><span data-part="decrement" /><span data-part="prefix">$</span><div data-part="input" /><span data-part="increment" /></div><span data-part="description">In px</span></ui-number-field></div>
      <OTPField.Root data-k="otp" length={4} defaultValue="12"><OTPField.Input /><OTPField.Input /><OTPField.Input /><OTPField.Input /></OTPField.Root>
      <ui-otp-field data-k="wotp" value="12"><div data-part="input" /><div data-part="input" /><div data-part="input" /><div data-part="input" /></ui-otp-field>
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
      <div style={{ width: 300 }}><Collapsible.Root data-k="col" defaultOpen><Collapsible.Trigger leading={<i name="key" />}>Keys</Collapsible.Trigger><Collapsible.Panel><p>Panel</p></Collapsible.Panel></Collapsible.Root></div>
      <div style={{ width: 300 }}><ui-collapsible data-k="wcol" open><div data-part="trigger"><i slot="leading" name="key" />Keys</div><div data-part="panel"><p>Panel</p></div></ui-collapsible></div>
      <div style={{ width: 300 }}>
        <Tabs.Root data-k="tab" variant="underline">
          <Tabs.List label="T"><Tabs.Tab value="a" leading={<i name="code" />}>One</Tabs.Tab><Tabs.Tab value="b">Two</Tabs.Tab><Tabs.Indicator /></Tabs.List>
          <Tabs.Panel value="a">a</Tabs.Panel><Tabs.Panel value="b">b</Tabs.Panel>
        </Tabs.Root>
      </div>
      <div style={{ width: 300 }}><ui-tabs data-k="wtab" variant="underline" label="T"><div data-part="list"><div {...{ value: 'a' }} data-part="tab">One</div><div {...{ value: 'b' }} data-part="tab">Two</div><span data-part="indicator" /></div><div {...{ value: 'a' }} data-part="panel">a</div><div {...{ value: 'b' }} data-part="panel">b</div></ui-tabs></div>
      <div style={{ width: 300 }}><Menu.Root data-k="mnu"><Menu.Trigger leading={<i name="pencil" />} trailing={<i name="caret-down" />}>Edit</Menu.Trigger><Menu.Portal><Menu.Positioner><Menu.Popup><Menu.Item>Cut</Menu.Item></Menu.Popup></Menu.Positioner></Menu.Portal></Menu.Root></div>
      <div style={{ width: 300 }}><ui-menu data-k="wmnu"><div data-part="trigger">Edit<i slot="trailing" name="caret-down" /></div><div data-part="popup"><div data-part="item">Cut</div></div></ui-menu></div>
      <div style={{ width: 300 }}><ContextMenu.Root data-k="cmu"><ContextMenu.Trigger>Area</ContextMenu.Trigger><ContextMenu.Portal><ContextMenu.Positioner><ContextMenu.Popup><ContextMenu.Item>Copy</ContextMenu.Item></ContextMenu.Popup></ContextMenu.Positioner></ContextMenu.Portal></ContextMenu.Root></div>
      <div style={{ width: 300 }}><ui-context-menu data-k="wcmu"><div data-part="trigger">Area</div><div data-part="popup"><div data-part="item">Copy</div></div></ui-context-menu></div>
      <div style={{ width: 300 }}>
        <Accordion.Root data-k="acc" defaultValue={['a']}>
          <Accordion.Item value="a"><Accordion.Header><Accordion.Trigger leading={<i name="truck" />}>Ship</Accordion.Trigger></Accordion.Header><Accordion.Panel><p>a</p></Accordion.Panel></Accordion.Item>
          <Accordion.Item value="b"><Accordion.Header><Accordion.Trigger>Return</Accordion.Trigger></Accordion.Header><Accordion.Panel><p>b</p></Accordion.Panel></Accordion.Item>
        </Accordion.Root>
      </div>
      <div style={{ width: 300 }}>
        <ui-accordion data-k="wacc" value="a">
          <ui-collapsible value="a"><div data-part="header"><div data-part="trigger"><i slot="leading" name="truck" />Ship</div></div><div data-part="panel"><p>a</p></div></ui-collapsible>
          <ui-collapsible value="b"><div data-part="header"><div data-part="trigger">Return</div></div><div data-part="panel"><p>b</p></div></ui-collapsible>
        </ui-accordion>
      </div>
      <ui-button data-k="wbt"><span data-part="leading"><i name="plus" /></span><span data-part="contents">Add</span></ui-button>
      <ui-checkbox data-k="wcb" checked><span data-part="leading"><span data-part="indicator" /></span><span data-part="contents">Accept</span><span data-part="suffix">(2)</span></ui-checkbox>
      <ui-switch data-k="wsw" checked><span data-part="indicator"><span data-part="thumb" /></span>Wi-Fi<span data-part="suffix">on</span></ui-switch>
      <ui-radio data-k="wrd" name={`wr${u}c`} value="a" checked><span data-part="indicator" /><span data-part="contents">One</span></ui-radio>
      <div style={{ width: 300 }}><ui-range data-k="wrg" value={25}><span data-part="track"><span data-part="indicator" /></span><span data-part="thumb" /></ui-range></div>
      <div style={{ width: 300 }}><ui-range data-k="wrgP" value={[20, 70]} label="Price"><span data-part="track"><span data-part="indicator" /></span><span data-part="thumb" /><span data-part="thumb" /></ui-range></div>
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
// The popup twins sit last; their motion is off so each opens at rest.
const popupsRoot = document.createElement('div');
popupsRoot.id = 'popups';
popupsRoot.innerHTML = '<style>#popups *, #popups *::after { transition: none !important; }</style>';
composedRoot.after(popupsRoot);
const popupsMount = document.createElement('div');
popupsRoot.append(popupsMount);
const popups = createRoot(popupsMount);
const renderPopups = (open: string | null) => flushSync(() => popups.render(<>{UNITS.map((u) => <PopupPair key={u} u={u} open={open} />)}</>));
renderPopups(null);

/** Open each popup twin pair in view and compare their state and geometry relative to the trigger. */
async function popupParity(fails: string[]) {
  let n = 0;
  const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  const STRUCT = new Set(['data-ui', 'data-part', 'data-size', 'data-k']);
  const st = (el: Element | null) => (el ? [...el.attributes].map((a) => a.name).filter((x) => x.startsWith('data-') && !STRUCT.has(x)).sort().join(' ') : 'missing');
  // The navigation menu: its list parts, and while open the popup and the open content.
  const navParts = (h: Element) => {
    const q = (s: string) => [...h.querySelectorAll(s)];
    return {
      host: [h], list: q(':scope > [data-part=list]'), item: q(':scope > [data-part=list] > [data-part=item]'),
      trigger: q('[data-part=trigger]'), listLink: q(':scope > [data-part=list] > [data-part=item] > [data-part=link]'),
      positioner: q(':scope > [data-part=positioner]'), popup: q(':scope > [data-part=positioner] > [data-part=popup]'),
      content: q('[data-part=content][data-open]'), contentLink: q('[data-part=content][data-open] [data-part=link]'),
    };
  };
  const navGeo = (h: Element) => {
    const hr = h.getBoundingClientRect(), p = navParts(h);
    const rel = (e: Element, o = hr) => { const r = e.getBoundingClientRect(), cs = getComputedStyle(e); return `${r2(r.left - o.left)}:${r2(r.top - o.top)}:${r2(r.width)}x${r2(r.height)}:${cs.backgroundColor}:${cs.color}:${cs.borderTopLeftRadius}:${cs.fontSize}`; };
    const pop = p.popup[0], pr = pop?.getBoundingClientRect();
    return {
      list: p.list.map((e) => rel(e)).join(' '), triggers: p.trigger.map((e) => rel(e)).join(' '), links: p.listLink.map((e) => rel(e)).join(' '),
      labels: p.trigger.concat(p.listLink).map((e) => { const c = e.querySelector('[data-part=contents]'); return c ? rel(c) : 'none'; }).join(' '),
      popup: pop && pr && pr.width ? `${r2(pr.left - p.trigger[0].getBoundingClientRect().left)}:${r2(pr.top - p.trigger[0].getBoundingClientRect().bottom)}:${r2(pr.width)}x${r2(pr.height)}:${getComputedStyle(pop).padding}:${getComputedStyle(pop).borderTopLeftRadius}:${getComputedStyle(pop).backgroundColor}` : 'closed',
      contentLinks: pr ? p.contentLink.map((e) => rel(e, pr)).join(' ') : '',
    };
  };
  const parts = (h: Element) => {
    const pos = h.querySelector(':scope > [data-part=positioner]');
    return { host: h, trigger: h.querySelector(':scope > [data-part=trigger]'), positioner: pos, popup: pos?.querySelector(':scope > [data-part=popup]') ?? null, arrow: pos?.querySelector(':scope > [data-part=arrow]') ?? null };
  };
  const geo = (h: Element) => {
    const { trigger, popup, arrow, positioner } = parts(h);
    if (!trigger || !popup) return { missing: 'parts' };
    const tr = trigger.getBoundingClientRect(), pr = popup.getBoundingClientRect(), cs = getComputedStyle(popup);
    const rel = (e: Element) => { const r = e.getBoundingClientRect(); return `${r2(r.left - pr.left)}:${r2(r.top - pr.top)}:${r2(r.width)}x${r2(r.height)}`; };
    return {
      side: positioner?.getAttribute('data-side') ?? '', offsetTop: r2(pr.top - tr.bottom), offsetLeft: r2(pr.left - tr.left), size: `${r2(pr.width)}x${r2(pr.height)}`,
      trigger: `${r2(tr.width)}x${r2(tr.height)}`, pad: cs.padding, radius: cs.borderTopLeftRadius, bg: cs.backgroundColor, color: cs.color, shadow: cs.boxShadow, border: cs.borderTopWidth,
      arrow: arrow ? rel(arrow) : '', arrowBg: arrow ? getComputedStyle(arrow).backgroundColor : '',
      kids: [...popup.children].map((k) => `${rel(k)}:${getComputedStyle(k).color}:${getComputedStyle(k).fontSize}`).join(' '),
    };
  };
  for (const u of UNITS) {
    for (const k of POPUP_KEYS) {
      renderPopups(`${u}:${k}`);
      const c = popupsRoot.querySelector(`[data-pcase="${u}"]`)!;
      const a = c.querySelector(`[data-side=wc] [data-k=${k}]`)!, b = c.querySelector(`[data-side=react] [data-k=${k}]`)!;
      if (k === 'nav') {
        (a.querySelector('[data-part=trigger]') as HTMLElement).scrollIntoView({ block: 'center' });
        await frame(); await frame();
        const [na, nb] = [navParts(a), navParts(b)];
        for (const part of Object.keys(na) as (keyof typeof na)[]) {
          n++;
          if (na[part].length !== nb[part].length) { fails.push(`u${u} nav ${part}: wc ${na[part].length} react ${nb[part].length}`); continue; }
          na[part].forEach((x, i) => { n++; if (st(x) !== st(nb[part][i])) fails.push(`u${u} nav ${part}[${i}] data-*: wc "${st(x)}" react "${st(nb[part][i])}"`); });
        }
        const [ga, gb] = [navGeo(a), navGeo(b)] as Record<string, string>[];
        n++;
        if (ga.popup === 'closed' || !ga.contentLinks) fails.push(`u${u} nav: not open (wc ${ga.popup})`);
        for (const key of Object.keys(ga)) { n++; if (ga[key] !== gb[key]) fails.push(`u${u} nav.${key}: wc ${ga[key]} react ${gb[key]}`); }
        continue;
      }
      (parts(a).trigger as HTMLElement).scrollIntoView({ block: 'center' });
      await frame(); await frame();
      const [pa, pb] = [parts(a), parts(b)];
      for (const part of Object.keys(pa) as (keyof typeof pa)[]) {
        n++;
        if (st(pa[part]) !== st(pb[part])) fails.push(`u${u} ${k} ${part} data-*: wc "${st(pa[part])}" react "${st(pb[part])}"`);
      }
      const [ga, gb] = [geo(a), geo(b)] as Record<string, unknown>[];
      // The pair must really be open and placed (a closed pair would agree vacuously).
      n++;
      if (!ga.side || !gb.side) fails.push(`u${u} ${k}: not open (wc side "${ga.side}", react side "${gb.side}")`);
      for (const key of Object.keys(ga)) {
        n++;
        if (ga[key] !== gb[key]) fails.push(`u${u} ${k}.${key}: wc ${ga[key]} react ${gb[key]}`);
      }
    }
  }
  renderPopups(null);
  return n;
}

setTimeout(() => {
  const fails: string[] = []; let checks = 0;
  // The toast twins mounted with their enter transition (reveal intent, a long spring tail): settle it.
  for (const el of document.querySelectorAll<HTMLElement>('[data-k=tst] :is([data-part=toast], [data-part=content])')) { el.style.transition = 'none'; el.removeAttribute('data-starting-style'); }
  // The open menus mounted with their popup's open transition (scale and fade on the reveal intent): settle it.
  for (const el of document.querySelectorAll<HTMLElement>('[data-k=mnO] [data-part=popup]')) el.style.transition = 'none';
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
      // A contents part inside a closed popup has no box: it counts as absent.
      contentsLeft: contents && !contents.hidden && contents.getClientRects().length ? r2(rect(contents)!.left - er.left) : 0,
      fillW: fill ? r2(rect(fill)!.width) : 0, trackH: track ? r2(rect(track)!.height) : 0,
      thumbLeft: thumb ? r2(rect(thumb)!.left - er.left) : 0, opacity: getComputedStyle(el).opacity,
      font: getComputedStyle(el).fontFamily,
      bg: getComputedStyle(el).backgroundColor, radius: getComputedStyle(el).borderTopLeftRadius, pad: getComputedStyle(el).paddingLeft,
      // Child layout: each part's offset and size (covers slots, labels, swatches and container gaps).
      kids: kids.filter((k) => k.localName !== 'input' && k.localName !== 'progress' && !k.hidden && !k.matches('[popover]:not(:popover-open)')).map((k) => { const r = k.getBoundingClientRect(); return `${r2(r.left - er.left)}:${r2(r.top - er.top)}:${r2(r.width)}x${r2(r.height)}:${getComputedStyle(k).backgroundColor}:${getComputedStyle(k).outlineStyle}`; }).join(' '),
    };
  };
  // A lone px value may differ by less than a layout unit: Gecko snaps a native <button>'s computed
  // padding to 1/60px (1.3125px reads 1.31667px), which no layout can show.
  const isPx = (v: unknown): v is string => typeof v === 'string' && /^-?[\d.]+px$/.test(v);
  const same = (x: unknown, y: unknown) => x === y || (isPx(x) && isPx(y) && Math.abs(parseFloat(x) - parseFloat(y)) < 1 / 60);
  // State contract (contracts/states.json): the twins carry the same data-* state attributes.
  const STRUCTURE = new Set(['data-ui', 'data-part', 'data-size', 'data-icon-size', 'data-hide-label', 'data-selectable', 'data-mark', 'data-dir', 'data-index', 'data-remove', 'data-hover-controls', 'data-no-dots', 'data-no-paddles', 'data-ratio', 'data-fit', 'data-slideshow', 'data-generated', 'data-k', 'data-case', 'data-side', 'data-avatar-size']);
  const stateOf = (el: Element) => [...el.attributes].map((a) => a.name).filter((n) => n.startsWith('data-') && !STRUCTURE.has(n)).sort().join(' ');
  for (const c of root.querySelectorAll('[data-case]')) {
    const [wc, re] = [c.querySelector('[data-side=wc]')!, c.querySelector('[data-side=react]')!];
    for (const k of ['bt', 'btL', 'btD', 'cb', 'cbOn', 'cbMixed', 'cbOff', 'rd', 'sw', 'rg', 'pg', 'ch', 'chX', 'sws', 'swa', 'pl', 'plv', 'lb', 'sg', 'sp', 'spv', 'av', 'avS', 'avX', 'mt', 'mtN', 'tg', 'tgP', 'tgD', 'col', 'colD', 'acc', 'tab', 'tabU', 'tst']) {
      const a = host(wc, k), b = host(re, k);
      const parts = (h: HTMLElement) => [h, ...h.querySelectorAll('[role=option], [data-ui=swatch], ui-swatch, :scope > [data-part=trigger], :scope > [data-part=panel], :scope > [data-part=item], :scope > [data-part=item] :is([data-part=header], [data-part=trigger], [data-part=panel]), :scope > [data-part=list], [role=tab], [data-part=indicator], :scope > [data-part=toast], :scope > [data-part=toast] > [data-part=content], :scope > [data-part=toast] > [data-part=content] > *')];
      const pa = parts(a), pb = parts(b);
      checks++;
      if (pa.length !== pb.length) { fails.push(`u${c.getAttribute('data-case')} ${k} state parts: wc ${pa.length} react ${pb.length}`); continue; }
      pa.forEach((x, i) => { const va = stateOf(x), vb = stateOf(pb[i]); if (va !== vb) fails.push(`u${c.getAttribute('data-case')} ${k}[${i}] data-*: wc "${va}" react "${vb}"`); });
    }

    for (const k of ['bt', 'btL', 'btD', 'cb', 'cbOn', 'cbMixed', 'cbOff', 'rd', 'sw', 'rg', 'pg', 'ch', 'chX', 'sws', 'swa', 'pl', 'plv', 'lb', 'sg', 'sp', 'spv', 'av', 'avS', 'avX', 'mt', 'mtN', 'tg', 'tgP', 'tgD', 'col', 'colD', 'acc', 'tab', 'tabU', 'mn', 'mnO', 'mnD', 'cm', 'mb', 'mbV']) {
      const a = host(wc, k), b = host(re, k);
      const parts = (h: HTMLElement) => [h, ...h.querySelectorAll('[role=option], [data-ui=swatch], ui-swatch, :scope > [data-part=trigger], :scope > [data-part=panel], :scope > [data-part=item], :scope > [data-part=item] :is([data-part=header], [data-part=trigger], [data-part=panel]), :scope > [data-part=list], [role=tab], [data-part=indicator], :scope > [data-part=popup], [role^=menuitem], [role=separator], [data-part=group-label]')];
      const pa = parts(a), pb = parts(b);
      checks++;
      if (pa.length !== pb.length) { fails.push(`u${c.getAttribute('data-case')} ${k} state parts: wc ${pa.length} react ${pb.length}`); continue; }
      pa.forEach((x, i) => { const va = stateOf(x), vb = stateOf(pb[i]); if (va !== vb) fails.push(`u${c.getAttribute('data-case')} ${k}[${i}] data-*: wc "${va}" react "${vb}"`); });
    }

    for (const k of ['bt', 'btL', 'btD', 'cb', 'cbOn', 'cbMixed', 'cbOff', 'rd', 'sw', 'rg', 'pg', 'ch', 'chX', 'sws', 'swa', 'pl', 'plv', 'lb', 'sg', 'sp', 'spv', 'av', 'avS', 'avX', 'mt', 'mtN', 'tg', 'tgP', 'tgD', 'col', 'colD', 'acc', 'tab', 'tabU', 'dlg', 'adlg', 'drw']) {
      const a = host(wc, k), b = host(re, k);
      const parts = (h: HTMLElement) => [h, ...h.querySelectorAll('[role=option], [data-ui=swatch], ui-swatch, :scope > [data-part=trigger], :scope > [data-part=panel], :scope > [data-part=item], :scope > [data-part=item] :is([data-part=header], [data-part=trigger], [data-part=panel]), :scope > [data-part=list], [role=tab], [data-part=indicator], :scope > [data-part=backdrop], :scope > [data-part=popup]')];
      const pa = parts(a), pb = parts(b);
      checks++;
      if (pa.length !== pb.length) { fails.push(`u${c.getAttribute('data-case')} ${k} state parts: wc ${pa.length} react ${pb.length}`); continue; }
      pa.forEach((x, i) => { const va = stateOf(x), vb = stateOf(pb[i]); if (va !== vb) fails.push(`u${c.getAttribute('data-case')} ${k}[${i}] data-*: wc "${va}" react "${vb}"`); });
    }
  }
  // Scroll areas: every part (viewport, content, scrollbars, thumbs, corner) at the same place and size, with the same data-*.
  for (const c of root.querySelectorAll('[data-case]')) {
    const [wc, re] = [c.querySelector('[data-side=wc]')!, c.querySelector('[data-side=react]')!];
    for (const k of ['sa', 'saY']) {
      const a = host(wc, k), b = host(re, k);
      const parts = (h: HTMLElement) => [h, ...h.querySelectorAll('[data-part=viewport], [data-part=content], [data-part=scrollbar], [data-part=thumb], [data-part=corner]')] as HTMLElement[];
      const geo = (e: HTMLElement, h: HTMLElement) => { if (e.hidden || e.closest('[hidden]')) return 'hidden'; const r = e.getBoundingClientRect(), hr = h.getBoundingClientRect(), cs = getComputedStyle(e); return `${r2(r.left - hr.left)}:${r2(r.top - hr.top)}:${r2(r.width)}x${r2(r.height)}:${cs.backgroundColor}:${cs.borderTopLeftRadius}:${cs.opacity}`; };
      const pa = parts(a), pb = parts(b);
      checks++;
      if (pa.length !== pb.length) { fails.push(`u${c.getAttribute('data-case')} ${k} parts: wc ${pa.length} react ${pb.length}`); continue; }
      pa.forEach((x, i) => {
        checks += 2;
        const va = stateOf(x), vb = stateOf(pb[i]);
        if (va !== vb) fails.push(`u${c.getAttribute('data-case')} ${k}[${i}] data-*: wc "${va}" react "${vb}"`);
        const ga = geo(x, a), gb = geo(pb[i], b);
        if (ga !== gb) fails.push(`u${c.getAttribute('data-case')} ${k}[${i}] ${x.getAttribute('data-part') ?? 'root'}: wc ${ga} react ${gb}`);
      });
    }
  }
  // Groups (radio group, checkbox group, fieldset): the host and each member carry the same data-*.
  for (const c of root.querySelectorAll('[data-case]')) {
    const [wc, re] = [c.querySelector('[data-side=wc]')!, c.querySelector('[data-side=react]')!];
    for (const k of GROUP_KEYS) {
      const a = host(wc, k), b = host(re, k);
      const parts = (h: HTMLElement) => [h, ...h.querySelectorAll('[data-part=legend], ui-radio-group, ui-radio, ui-checkbox, ui-switch, [data-ui=radio-group], [data-ui=radio], [data-ui=checkbox], [data-ui=switch]')];
      const pa = parts(a), pb = parts(b);
      checks++;
      if (pa.length !== pb.length) { fails.push(`u${c.getAttribute('data-case')} ${k} members: wc ${pa.length} react ${pb.length}`); continue; }
      pa.forEach((x, i) => { const va = stateOf(x), vb = stateOf(pb[i]); if (va !== vb) fails.push(`u${c.getAttribute('data-case')} ${k}[${i}] data-*: wc "${va}" react "${vb}"`); });
    }
  }
  for (const c of root.querySelectorAll('[data-case]')) {
    const [wc, re] = [c.querySelector('[data-side=wc]')!, c.querySelector('[data-side=react]')!];
    for (const k of ['bt', 'btI', 'btO', 'btL', 'btD', 'btP', 'cb', 'cbOn', 'cbMixed', 'cbOff', 'rd', 'sw', 'rg', 'fd', 'pg', 'bd', 'tg', 'ch', 'chX', 'sws', 'swa', 'pl', 'plv', 'im', 'imc', 'cd', 'gp', 'uc', 'ucN', 'ucL', 'ucL1', 'ucS', 'lb', 'sg', 'swp', 'ims', 'sp', 'spv', 'av', 'avS', 'avX', 'mt', 'mtN', 'tg', 'tgP', 'tgD', 'col', 'colD', 'acc', 'tab', 'tabU', 'tst', ...GROUP_KEYS]) {
      const a = measure(host(wc, k)), b = measure(host(re, k));
      for (const key of Object.keys(a) as (keyof typeof a)[]) {
        checks++;
        if (!same(a[key], b[key])) fails.push(`u${c.getAttribute('data-case')} ${k}.${key}: wc ${a[key]} react ${b[key]}`);
      }
    }

    for (const k of ['bt', 'btI', 'btO', 'btL', 'btD', 'btP', 'cb', 'cbOn', 'cbMixed', 'cbOff', 'rd', 'sw', 'rg', 'fd', 'pg', 'bd', 'tg', 'ch', 'chX', 'sws', 'swa', 'pl', 'plv', 'im', 'imc', 'cd', 'gp', 'uc', 'ucN', 'ucL', 'ucL1', 'ucS', 'lb', 'sg', 'swp', 'ims', 'sp', 'spv', 'av', 'avS', 'avX', 'mt', 'mtN', 'tg', 'tgP', 'tgD', 'col', 'colD', 'acc', 'tab', 'tabU', 'mn', 'mnD', 'cm', 'mb', 'mbV', ...GROUP_KEYS]) {
      const a = measure(host(wc, k)), b = measure(host(re, k));
      for (const key of Object.keys(a) as (keyof typeof a)[]) {
        checks++;
        if (!same(a[key], b[key])) fails.push(`u${c.getAttribute('data-case')} ${k}.${key}: wc ${a[key]} react ${b[key]}`);
      }
    }
  }
  // Toast: each toast and its content (title, description, action, close) laid out alike.
  for (const c of root.querySelectorAll('[data-case]')) {
    const [wc, re] = [c.querySelector('[data-side=wc]')!, c.querySelector('[data-side=react]')!];
    const sel = ':scope > [data-part=toast], :scope > [data-part=toast] > [data-part=content]';
    const ta = [...host(wc, 'tst').querySelectorAll<HTMLElement>(sel)], tb = [...host(re, 'tst').querySelectorAll<HTMLElement>(sel)];
    checks++;
    if (ta.length !== tb.length) { fails.push(`u${c.getAttribute('data-case')} tst parts: wc ${ta.length} react ${tb.length}`); continue; }
    ta.forEach((x, i) => {
      const a = measure(x), b = measure(tb[i]);
      for (const key of Object.keys(a) as (keyof typeof a)[]) {
        checks++;
        if (!same(a[key], b[key])) fails.push(`u${c.getAttribute('data-case')} tst[${i}].${key}: wc ${a[key]} react ${b[key]}`);
      }
    });
  }

  // Combobox: the same parts, geometry and data-* (the React input is a native <input>).
  for (const c of root.querySelectorAll('[data-case]')) {
    for (const k of ['cmb', 'cmbM', 'acp']) {
      const wc = c.querySelector(`[data-side=wc] [data-k=${k}] :is(ui-combobox, ui-autocomplete)`) as HTMLElement, re = c.querySelector(`[data-side=react] [data-k=${k}] :is([data-ui=combobox], [data-ui=autocomplete])`) as HTMLElement;
      const CTL = ':scope > [data-part=control]';
      const sels = [':scope', ':scope > [data-part=label]', CTL, `${CTL} > [data-part=leading]`, `${CTL} > [data-part=input]`, `${CTL} > [data-part=clear]`, `${CTL} > [data-part=trigger]`, ':scope > [data-part=description]', ...[1, 2, 3].map((n) => `${CTL} > [data-part=chips] > [data-part=chip]:nth-child(${n})`), `${CTL} > [data-part=chips] > [data-part=chip] > [data-part=chip-remove]`];
      // The closed popups have no box: their state only.
      for (const sel of [':scope > [data-part=popup]', ':scope > [data-part=popup] > [data-part=list]', ':scope > [data-part=popup] [role=option]']) {
        const sa = [...wc.querySelectorAll(sel)].map(stateOf).join('|'), sb = [...re.querySelectorAll(sel)].map(stateOf).join('|');
        checks++;
        if (sa !== sb) fails.push(`u${c.getAttribute('data-case')} ${k}${sel.replace(':scope', '')} data-*: wc ${sa} react ${sb}`);
      }
      for (const sel of sels) {
        const pick = (h: Element) => { const e = sel === ':scope' ? h : h.querySelector(sel); return e && !(e as HTMLElement).hidden ? e : null; };
        const ea = pick(wc), eb = pick(re);
        const fa = (e: Element | null, h: Element) => { if (!e) return 'missing'; const r = e.getBoundingClientRect(), hr = h.getBoundingClientRect(), cs = getComputedStyle(e); return `${r2(r.left - hr.left)}:${r2(r.top - hr.top)}:${r2(r.width)}x${r2(r.height)}:${cs.backgroundColor}:${cs.borderTopLeftRadius}:${cs.paddingLeft}:${cs.paddingRight}:${cs.color}:${cs.fontSize}:${stateOf(e)}`; };
        checks++;
        const va = fa(ea, wc), vb = fa(eb, re);
        // The editable text's width follows its content box: compare the input's box, not its text.
        if (va !== vb) fails.push(`u${c.getAttribute('data-case')} ${k}${sel.replace(':scope', '')}: wc ${va} react ${vb}`);
      }
    }
  }

  // Toggle groups: the host and each toggle measured, with the same data-*.
  for (const c of root.querySelectorAll('[data-case]')) {
    const [wc, re] = [c.querySelector('[data-side=wc]')!, c.querySelector('[data-side=react]')!];
    for (const k of ['tgg', 'tggV']) {
      const items = (h: HTMLElement) => [h, ...h.querySelectorAll<HTMLElement>(':scope > ui-toggle, :scope > [data-ui=toggle]')];
      const pa = items(host(wc, k)), pb = items(host(re, k));
      checks++;
      if (pa.length !== pb.length) { fails.push(`u${c.getAttribute('data-case')} ${k} toggles: wc ${pa.length} react ${pb.length}`); continue; }
      pa.forEach((x, i) => {
        const ma = measure(x), mb = measure(pb[i]);
        for (const key of Object.keys(ma) as (keyof typeof ma)[]) { checks++; if (!same(ma[key], mb[key])) fails.push(`u${c.getAttribute('data-case')} ${k}[${i}].${key}: wc ${ma[key]} react ${mb[key]}`); }
        checks++;
        if (stateOf(x) !== stateOf(pb[i])) fails.push(`u${c.getAttribute('data-case')} ${k}[${i}] data-*: wc "${stateOf(x)}" react "${stateOf(pb[i])}"`);
      });
    }
  }

  // Menu (open): the popup and every part in it, offset from the host, size and paint, in both renderers.
  for (const c of root.querySelectorAll('[data-case]')) {
    const [wc, re] = [c.querySelector('[data-side=wc]')!, c.querySelector('[data-side=react]')!];
    const a = host(wc, 'mnO'), b = host(re, 'mnO');
    const parts = (h: HTMLElement) => [...h.querySelectorAll<HTMLElement>('[data-part]')].filter((e) => !e.closest('[hidden]')).map((e) => {
      const r = e.getBoundingClientRect(), hr = h.getBoundingClientRect(), cs = getComputedStyle(e);
      return `${e.getAttribute('data-part')}@${r2(r.left - hr.left)}:${r2(r.top - hr.top)}:${r2(r.width)}x${r2(r.height)}:${cs.backgroundColor}:${cs.color}:${cs.borderTopLeftRadius}:${cs.paddingLeft}:${cs.fontSize}:${cs.visibility}`;
    });
    const pa = parts(a), pb = parts(b);
    checks++;
    if (pa.length !== pb.length) { fails.push(`u${c.getAttribute('data-case')} mnO parts: wc ${pa.length} react ${pb.length}`); continue; }
    // Lengths to 0.05px: the open popups are placed by the engine (anchor positioning) a few 1/64px apart.
    const near = (x: string, y: string) => {
      const nx = x.match(/-?[\d.]+/g) ?? [], ny = y.match(/-?[\d.]+/g) ?? [];
      return x.replace(/-?[\d.]+/g, '#') === y.replace(/-?[\d.]+/g, '#') && nx.length === ny.length && nx.every((v, j) => Math.abs(parseFloat(v) - parseFloat(ny[j])) <= 0.05);
    };
    pa.forEach((x, i) => { checks++; if (!near(x, pb[i])) fails.push(`u${c.getAttribute('data-case')} mnO part ${i}: wc ${x} react ${pb[i]}`); });
  }
  // Menubar: each menu host and trigger, the same box, paint, data-*, role and tab stop.
  for (const c of root.querySelectorAll('[data-case]')) {
    const [wc, re] = [c.querySelector('[data-side=wc]')!, c.querySelector('[data-side=react]')!];
    for (const k of ['mb', 'mbV']) {
      const a = host(wc, k), b = host(re, k);
      const ts = (h: HTMLElement) => [...h.querySelectorAll<HTMLElement>(':scope > :is(ui-menu, [data-ui=menu]) > [data-part=trigger]')].map((t) => {
        const r = t.getBoundingClientRect(), hr = h.getBoundingClientRect(), cs = getComputedStyle(t);
        return `${r2(r.left - hr.left)}:${r2(r.top - hr.top)}:${r2(r.width)}x${r2(r.height)}:${cs.backgroundColor}:${cs.borderTopLeftRadius}:${cs.paddingLeft}:${t.getAttribute('role')}:${t.getAttribute('tabindex')}:${stateOf(t)}`;
      });
      const pa = ts(a), pb = ts(b);
      checks++;
      if (pa.join(' | ') !== pb.join(' | ')) fails.push(`u${c.getAttribute('data-case')} ${k} triggers: wc ${pa.join(' | ')} react ${pb.join(' | ')}`);
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
  // Number field: the host (measure, data-*) and each part (offset, size, paint, type, data-*); the
  // React input is a native <input>, its steppers native buttons, its form value a hidden input.
  for (const c of root.querySelectorAll('[data-case]')) {
    for (const k of ['otp', 'otpD']) {
      const wc = host(c.querySelector('[data-side=wc]')!, k), re = host(c.querySelector('[data-side=react]')!, k);
      const ma = measure(wc), mb = measure(re);
      // The cells are compared one by one below (measure's child list leaves native inputs out).
      for (const key of (Object.keys(ma) as (keyof typeof ma)[]).filter((x) => x !== 'kids')) { checks++; if (!same(ma[key], mb[key])) fails.push(`u${c.getAttribute('data-case')} ${k}.${key}: wc ${ma[key]} react ${mb[key]}`); }
      checks++;
      if (stateOf(wc) !== stateOf(re)) fails.push(`u${c.getAttribute('data-case')} ${k} data-*: wc "${stateOf(wc)}" react "${stateOf(re)}"`);
      const ca = [...wc.querySelectorAll('[data-part=input]')], cb = [...re.querySelectorAll('[data-part=input]')];
      checks++;
      if (ca.length !== cb.length) { fails.push(`u${c.getAttribute('data-case')} ${k} cells: wc ${ca.length} react ${cb.length}`); continue; }
      ca.forEach((x, i) => {
        // No line-height: Gecko forces line-height normal on a native single-line <input> (the React
        // cell); the cell is a fixed 8u square that centers its one character, so the run height never shows.
        const fa = (e: Element, h: Element) => { const r = e.getBoundingClientRect(), hr = h.getBoundingClientRect(), cs = getComputedStyle(e); return `${r2(r.left - hr.left)}:${r2(r.top - hr.top)}:${r2(r.width)}x${r2(r.height)}:${cs.backgroundColor}:${cs.borderTopLeftRadius}:${cs.paddingLeft}:${cs.paddingTop}:${cs.color}:${cs.fontSize}:${cs.textAlign}:${cs.opacity}:${stateOf(e)}`; };
        checks++;
        const va = fa(x, wc), vb = fa(cb[i], re);
        if (va !== vb) fails.push(`u${c.getAttribute('data-case')} ${k}[${i}]: wc ${va} react ${vb}`);
      });
    }
    for (const k of ['nf', 'nfD']) {
      const wc = host(c.querySelector('[data-side=wc]')!, k), re = host(c.querySelector('[data-side=react]')!, k);
      const ma = measure(wc), mb = measure(re);
      for (const key of Object.keys(ma) as (keyof typeof ma)[]) { checks++; if (!same(ma[key], mb[key])) fails.push(`u${c.getAttribute('data-case')} ${k}.${key}: wc ${ma[key]} react ${mb[key]}`); }
      checks++;
      if (stateOf(wc) !== stateOf(re)) fails.push(`u${c.getAttribute('data-case')} ${k} data-*: wc "${stateOf(wc)}" react "${stateOf(re)}"`);
      for (const sel of [':scope > [data-part=scrub-area]', ':scope > [data-part=scrub-area] > [data-part=label]', ':scope > [data-part=group]', ':scope > [data-part=group] > [data-part=decrement]', ':scope > [data-part=group] > [data-part=prefix]:not([hidden])', ':scope > [data-part=group] > [data-part=suffix]:not([hidden])', ':scope > [data-part=group] > [data-part=input]', ':scope > [data-part=group] > [data-part=increment]', ':scope > [data-part=group] > [data-part=increment] > i', ':scope > [data-part=description]:not([hidden])']) {
        const ea = wc.querySelector(sel), eb = re.querySelector(sel);
        const fa = (e: Element | null, h: Element) => { if (!e) return 'missing'; const r = e.getBoundingClientRect(), hr = h.getBoundingClientRect(), cs = getComputedStyle(e); return `${r2(r.left - hr.left)}:${r2(r.top - hr.top)}:${r2(r.width)}x${r2(r.height)}:${cs.backgroundColor}:${cs.borderTopLeftRadius}:${cs.paddingLeft}:${cs.color}:${cs.fontSize}:${cs.fontFamily}:${cs.fontVariantNumeric}:${stateOf(e)}`; };
        checks++;
        const va = fa(ea, wc), vb = fa(eb, re);
        if (va !== vb) fails.push(`u${c.getAttribute('data-case')} ${k}${sel.replace(':scope', '')}: wc ${va} react ${vb}`);
      }
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
  // Dialog: the open popups (top layer) and every part in them, against each other.
  for (const c of root.querySelectorAll('[data-case]')) for (const k of ['dlg', 'drw']) {
    const [wc, re] = [c.querySelector(`[data-side=wc] [data-k=${k}]`)!, c.querySelector(`[data-side=react] [data-k=${k}]`)!];
    const pa = wc.querySelector(':scope > [data-part=popup]') as HTMLElement, pb = re.querySelector(':scope > [data-part=popup]') as HTMLElement;
    const fa = (e: Element, p: Element) => { const r = e.getBoundingClientRect(), pr = p.getBoundingClientRect(), cs = getComputedStyle(e); return `${r2(r.left - pr.left)}:${r2(r.top - pr.top)}:${r2(r.width)}x${r2(r.height)}:${cs.backgroundColor}:${cs.borderTopLeftRadius}:${cs.paddingLeft}:${cs.paddingTop}:${cs.color}:${cs.fontSize}:${cs.boxShadow}`; };
    // The popup's own parts (the buttons' construction-pattern parts are the button parity's).
    const list = (p: HTMLElement) => [p, ...p.querySelectorAll<HTMLElement>('[data-part]:not(:is([data-part=leading], [data-part=prefix], [data-part=contents], [data-part=suffix], [data-part=trailing]))')];
    const la = list(pa), lb = list(pb);
    checks++;
    if (la.length !== lb.length) { fails.push(`u${c.getAttribute('data-case')} ${k} parts: wc ${la.length} react ${lb.length}`); continue; }
    la.forEach((e, i) => { checks++; const va = fa(e, pa), vb = fa(lb[i], pb); if (va !== vb) fails.push(`u${c.getAttribute('data-case')} ${k}.${e.getAttribute('data-part') ?? 'popup'}[${i}]: wc ${va} react ${vb}`); });
    checks++;
    const rb = (e: Element) => r2(e.getBoundingClientRect().width);
    if (rb(pa) !== rb(pb) || r2(pa.getBoundingClientRect().left) !== r2(pb.getBoundingClientRect().left)) fails.push(`u${c.getAttribute('data-case')} ${k}.popup position differs`);
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
      // A dialog host draws no box (display: contents) and its popup sits in the top layer: its parts
      // are compared from the popup.
      const dlg = k === 'dlg' || k === 'wdlg';
      const ma = sel || dlg ? {} : measure(a), mb = sel || dlg ? {} : measure(b);
      for (const key of Object.keys(ma) as (keyof typeof ma)[]) {
        checks++;
        if (ma[key] !== (mb as typeof ma)[key]) fails.push(`u${u} composed ${k}.${key}: preset ${ma[key]} composed ${(mb as typeof ma)[key]}`);
      }
      checks++;
      const pop = (h: HTMLElement) => (dlg ? h.querySelector<HTMLElement>(':scope > [data-part=popup]')! : h);
      const da = deep(pop(a)), db = deep(pop(b));
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
  // Alert dialogs are always modal (the rest of the page turns inert): each pair is opened in turn,
  // its popups compared part by part, then closed, after the other checks.
  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
  const alerts = async () => {
    const sig = (e: Element, p: Element) => { const r = e.getBoundingClientRect(), pr = p.getBoundingClientRect(), cs = getComputedStyle(e); return `${r2(r.left - pr.left)}:${r2(r.top - pr.top)}:${r2(r.width)}x${r2(r.height)}:${cs.backgroundColor}:${cs.borderTopLeftRadius}:${cs.paddingLeft}:${cs.paddingTop}:${cs.color}:${cs.fontSize}:${cs.boxShadow}`; };
    const own = (p: HTMLElement) => [p, ...p.querySelectorAll<HTMLElement>('[data-part]:not(:is([data-part=leading], [data-part=prefix], [data-part=contents], [data-part=suffix], [data-part=trailing]))')];
    for (const c of root.querySelectorAll('[data-case]')) {
      const u = c.getAttribute('data-case');
      const sides = [c.querySelector('[data-side=wc] [data-k=adlg]') as HTMLElement, c.querySelector('[data-side=react] [data-k=adlg]') as HTMLElement];
      const got: string[][] = [];
      for (const h of sides) {
        (h.querySelector(':scope > [data-part=trigger]') as HTMLElement).click();
        await wait(60);
        const p = h.querySelector(':scope > [data-part=popup]') as HTMLElement;
        p.style.transition = 'none';
        got.push([p.getAttribute('role') ?? '', stateOf(p), document.activeElement?.textContent ?? '', ...own(p).map((e) => sig(e, p))]);
        document.activeElement!.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
        await wait(60);
        p.style.transition = '';
      }
      checks++;
      if (got[0].join(' | ') !== got[1].join(' | ')) fails.push(`u${u} adlg open: wc ${got[0].join(' | ')} react ${got[1].join(' | ')}`);
      if (got[0][0] !== 'alertdialog' || got[0][2] !== 'Cancel') fails.push(`u${u} adlg: role ${got[0][0]}, focus on "${got[0][2]}"`);
    }
  };
  // Then the modal and anchored popups, one after the other (an open alert dialog makes the page inert).
  press(lbs[0]).then((a) => press(lbs[1]).then(async (b) => {
    checks++;
    if (a !== b) fails.push(`keyboard listbox: wc ${a} react ${b}`);
    await alerts();
    checks += await popupParity(fails);
    document.getElementById('out')!.textContent = JSON.stringify({ checks, fails }, null, 1);
  }));
  if (false) document.getElementById('out')!.textContent = JSON.stringify({ checks, fails }, null, 1);
}, 600);
