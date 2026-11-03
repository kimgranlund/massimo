// Components: every ui-kit web component at the live theme, grouped by family. The family filter
// lives in the content header and in the hash query (#/components?family=fields).
import '@massimo/ui-kit/components/button/element';
import '@massimo/ui-kit/components/input/element';
import '@massimo/ui-kit/components/listbox/element';
import '@massimo/ui-kit/components/select/element';
import '@massimo/ui-kit/components/btg/element';
import '@massimo/ui-kit/components/choice/element';
import '@massimo/ui-kit/components/range/element';
import '@massimo/ui-kit/components/color/element';
import '@massimo/ui-kit/components/swiper/element';
import '@massimo/ui-kit/components/image/element';
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
import { createToastManager, type ToastManager, type ToastOptions } from '@massimo/ui-kit/components/toast/element';
import { Fragment, useCallback, useState, type ReactNode } from 'react';
import { css } from '../../styled-system/css/index.js';
import type { PageProps } from './types.ts';
import { CQ_MD, Divider, IMAGES, Page, Row, Section, SizeLadder, caption, columns, specimens, stack, subTitle } from './shared.tsx';

/** Component families, in page order: [id, label, elements]. */
export const FAMILIES = [
  ['actions', 'Actions', 'ui-button · ui-toggle'],
  ['labels', 'Labels', 'ui-badge · ui-tag · ui-chip'],
  ['fields', 'Fields', 'ui-input · ui-select · ui-field · ui-field-grid · ui-fieldset'],
  ['selection', 'Selection', 'ui-listbox · ui-segmented · ui-select'],
  ['choices', 'Choices', 'ui-checkbox · ui-radio · ui-switch · ui-radio-group · ui-checkbox-group'],
  ['tracks', 'Tracks', 'ui-range · ui-progress · ui-meter'],
  ['color', 'Color', 'ui-swatch · ui-palette'],
  ['media', 'Media', 'ui-swiper · ui-image'],
  ['display', 'Display', 'ui-separator · ui-avatar'],
  ['disclosure', 'Disclosure', 'ui-collapsible · ui-accordion · ui-tabs'],
  ['feedback', 'Feedback', 'ui-toast-viewport'],
] as const;
export type Family = (typeof FAMILIES)[number][0];
export const isFamily = (v: string | null): v is Family => FAMILIES.some(([f]) => f === v);

const avatar = css({ display: 'block', bg: 'primary.solid' });
const media = css({ width: 'full', maxWidth: '[40rem]', borderRadius: 'xl', overflow: 'hidden' });
const formats = css({ display: 'flex', gap: '3', flexWrap: 'wrap', alignItems: 'end' });
const figure = css({ display: 'flex', flexDirection: 'column', gap: '1', width: '[8rem]' });
const formGrid = css({ display: 'grid', gridTemplateColumns: '1fr', gap: '4', alignItems: 'start', [CQ_MD]: { gridTemplateColumns: '1fr 1fr' } });
const tonePrimary = css({ bg: 'primary.subtle', color: 'primary.fg' });
const separatorDemo = css({ display: 'flex', flexDirection: 'column', gap: '4', width: '[min(100%, 24rem)]' });
const separatorLadder = css({ display: 'flex', flexDirection: 'column', gap: '2', width: '[min(100%, 20rem)]' });
const trackStack = css({ display: 'flex', flexDirection: 'column', gap: '4', width: '[min(100%, 24rem)]' });
// Inline fields demo: a property panel (field grid) beside stacked fields.
const panelCard = css({ display: 'flex', flexDirection: 'column', gap: '3', padding: '4', borderRadius: 'xl', bg: 'bg.subtle', width: '[min(100%, 22rem)]' });

/** A ui-range whose readout follows it: the field's readout is application text. */
function useRangeValue(initial: number) {
  const [value, setValue] = useState(initial);
  const ref = useCallback((el: HTMLElement | null) => {
    if (!el) return;
    const h = (e: Event) => setValue((e as CustomEvent<{ value: number }>).detail.value);
    el.addEventListener('input', h);
    return () => el.removeEventListener('input', h);
  }, []);
  return [value, ref] as const;
}

function InlineFields() {
  const [radius, radiusRef] = useRangeValue(12);
  const [opacity, opacityRef] = useRangeValue(80);
  const [volume, volumeRef] = useRangeValue(40);
  return (
    <div className={columns}>
      <div className={panelCard}>
        <p className={caption}>Inline rows in a ui-field-grid: labels share one column, readouts another.</p>
        <ui-field-grid>
          <h3>Layer</h3>
          <ui-field layout="inline" label="Name"><ui-input value="Card background" /></ui-field>
          <ui-field layout="inline" label="Blend">
            <ui-select value="normal"><ui-option value="normal">Normal</ui-option><ui-option value="multiply">Multiply</ui-option><ui-option value="screen">Screen</ui-option></ui-select>
          </ui-field>
          <ui-field layout="inline" label="Opacity" unit="%" readout={String(opacity)}><ui-range ref={opacityRef} value={80} /></ui-field>
          <h3>Shape</h3>
          <ui-field layout="inline" label="Radius" unit="px" readout={String(radius)}><ui-range ref={radiusRef} min={0} max={48} value={12} /></ui-field>
          <ui-field layout="inline" label="Corners">
            <ui-segmented value="round"><ui-option value="round">Round</ui-option><ui-option value="squircle">Squircle</ui-option><ui-option value="bevel">Bevel</ui-option></ui-segmented>
          </ui-field>
          <ui-field layout="inline" label="Clip content"><ui-switch checked /></ui-field>
        </ui-field-grid>
      </div>
      <div className={stack}>
        <p className={caption}>Stacked (the default): the label above; a readout still sits beside the control.</p>
        <ui-field label="Volume" unit="%" readout={String(volume)} description="Applies to every output."><ui-range ref={volumeRef} value={40} /></ui-field>
        <ui-field label="Theme">
          <ui-segmented value="auto"><ui-option value="light">Light</ui-option><ui-option value="dark">Dark</ui-option><ui-option value="auto">Auto</ui-option></ui-segmented>
        </ui-field>
        <ui-field label="Project name" description="Shown in the title bar."><ui-input placeholder="Untitled" /></ui-field>
      </div>
    </div>
  );
}


/** Fieldsets: a legend over a set of fields, a disabled set (toggled), and a size ladder. */
function Fieldsets({ params }: Pick<PageProps, 'params'>) {
  const [off, setOff] = useState(true);
  return (
    <>
      <div className={columns}>
        <ui-fieldset legend="Billing address">
          <ui-input name="street" label="Street" value="Storgatan 1" />
          <ui-input name="city" label="City" value="Stockholm" />
          <ui-field label="Invoice by">
            <ui-radio-group name="invoice" value="email" orientation="horizontal"><ui-radio value="email">Email</ui-radio><ui-radio value="post">Post</ui-radio></ui-radio-group>
          </ui-field>
        </ui-fieldset>
        <div className={stack}>
          <ui-checkbox checked={off} onClick={() => setOff((v) => !v)}>Ship to the billing address</ui-checkbox>
          <ui-fieldset legend="Shipping address" disabled={off || undefined}>
            <ui-input name="ship-street" label="Street" value="Storgatan 1" />
            <ui-select name="ship-country" label="Country" value="se"><ui-option value="se">Sweden</ui-option><ui-option value="no">Norway</ui-option></ui-select>
          </ui-fieldset>
        </div>
      </div>
      <SizeLadder family="fieldset" params={params}>
        <div className={ladderField}><ui-fieldset legend="Address"><ui-input label="Street" value="Storgatan 1" /><ui-checkbox checked>Default</ui-checkbox></ui-fieldset></div>
      </SizeLadder>
    </>
  );
}

/** Choice groups: a radio group named by a field label, a horizontal one, states, and a size ladder. */
function ChoiceGroups({ params }: Pick<PageProps, 'params'>) {
  const [plan, setPlan] = useState('pro');
  const onPlan = useCallback((el: HTMLElement | null) => {
    if (!el) return;
    const h = (e: Event) => setPlan((e as CustomEvent<{ value: string }>).detail.value);
    el.addEventListener('change', h);
    return () => el.removeEventListener('change', h);
  }, []);
  return (
    <>
      <div className={stack}><h3 className={subTitle}>Groups</h3></div>
      <div className={columns}>
        <div className={stack}>
          <ui-field label="Plan" description={`Value: ${plan}`}>
            <ui-radio-group ref={onPlan} name="plan-g" value="pro">
              <ui-radio value="free">Free</ui-radio>
              <ui-radio value="pro">Pro<span slot="suffix">$9</span></ui-radio>
              <ui-radio value="team">Team<span slot="suffix">$29</span></ui-radio>
            </ui-radio-group>
          </ui-field>
          <ui-field label="Quiet hours">
            <ui-radio-group orientation="horizontal" value="night">
              <ui-radio value="off">Off</ui-radio><ui-radio value="night">Nights, 22–07</ui-radio><ui-radio value="weekend">Weekends</ui-radio>
            </ui-radio-group>
          </ui-field>
          <ui-field label="Send to">
            <ui-checkbox-group orientation="horizontal" value="email push">
              <ui-checkbox value="email">Email</ui-checkbox><ui-checkbox value="push">Push</ui-checkbox><ui-checkbox value="sms">SMS</ui-checkbox>
            </ui-checkbox-group>
          </ui-field>
        </div>
        <div className={stack}>
          <ui-field label="Size" description="Required; one option is sold out.">
            <ui-radio-group required>
              <ui-radio value="s">Small</ui-radio><ui-radio value="m">Medium</ui-radio><ui-radio value="l" disabled>Large</ui-radio>
            </ui-radio-group>
          </ui-field>
          <ui-field label="Notify by" description="A parent checkbox over the set.">
            <ui-checkbox-group name="notify-g" value="email">
              <ui-checkbox parent>All channels</ui-checkbox>
              <ui-checkbox value="email">Email</ui-checkbox><ui-checkbox value="push">Push</ui-checkbox><ui-checkbox value="sms">SMS</ui-checkbox>
            </ui-checkbox-group>
          </ui-field>
          <ui-field label="Region (disabled)">
            <ui-radio-group disabled value="eu" orientation="horizontal">
              <ui-radio value="us">US</ui-radio><ui-radio value="eu">EU</ui-radio>
            </ui-radio-group>
          </ui-field>
        </div>
      </div>
      <SizeLadder family="choiceGroup" params={params}>
        <ui-radio-group label="Plan" value="pro"><ui-radio value="free">Free</ui-radio><ui-radio value="pro">Pro</ui-radio></ui-radio-group>
        <ui-radio-group label="Quiet hours" orientation="horizontal" value="off"><ui-radio value="off">Off</ui-radio><ui-radio value="night">Nights</ui-radio></ui-radio-group>
        <ui-checkbox-group label="Channels" value="email"><ui-checkbox parent>All</ui-checkbox><ui-checkbox value="email">Email</ui-checkbox><ui-checkbox value="push">Push</ui-checkbox></ui-checkbox-group>
      </SizeLadder>
    </>
  );
}
// Disclosure specimens: a readable column, as a settings or FAQ page would hold them.
const disclosureColumn = css({ display: 'flex', flexDirection: 'column', gap: '1', width: 'full', maxWidth: '[28rem]' });
const panelText = css({ color: 'fg.muted', textStyle: 'body' });
const tabsColumn = css({ display: 'flex', flexDirection: 'column', gap: '6', width: 'full', maxWidth: '[36rem]' });
const tabsRow = css({ display: 'flex', flexWrap: 'wrap', gap: '8', width: 'full' });

// A field in a size ladder: a fixed share of the row so each size's field keeps its own width.
const ladderField = css({ width: 'full', maxWidth: '[20rem]' });

export function ComponentsPage({ family, params }: PageProps & { family?: Family }) {
  const [status, setStatus] = useState('');
  const NOTES: Record<Family, string> = {
    actions: 'Construction pattern: leading icon, prefix, label, suffix, trailing icon. Icon slots at least 6u; text parts 1u apart, 1u beside a slot, 2u at a bare edge; padding 1u; text 10px + u. A toggle is a button with a pressed state (aria-pressed, data-pressed): the primary solid while on.',
    labels: 'Heights 12px + k·u (badge 1, tag 2, chip 3), capped below the control height.',
    fields: 'No native form elements. Errors appear after interaction or a submit attempt; the form submits real values. ui-field names one control with a visible label (unit suffix, readout); a ui-field-grid aligns inline rows on shared columns; a ui-fieldset names a set of fields (legend) and disables them together, stacked with the collection gap.',
    selection: 'Select, segmented control and listbox share one option model; composites pad 0.5u so a segmented row stays 8u.',
    choices: 'A 5u box (switch 9u × 5u) in the 6u leading slot; the label starts 1u after the slot. Groups own one value: rows 1u apart (a 7u pitch), or a wrapping row 4u apart.',
    tracks: 'A 4u track. The range thumb sits inside it (track − u, inset 0.5u) and the fill wraps it with a concentric cap. Arrow keys, Page Up/Down, Home/End, drag. A meter is the progress track under a label | value row 1.5u above it; its value is formatNumber (a percentage by default).',
    color: 'Swatches are 6u; a palette attaches them with no gaps and can be a selectable listbox.',
    disclosure: 'A collapsible trigger is an 8u control row with a caret (icon size sm) that turns while open; the panel starts at the label edge (3u) and its height animates between 0 and auto on the reveal intent, in CSS. An accordion stacks collapsibles with 1px dividers; one or several open, arrow keys move between triggers. Tabs: a segmented composite (7u tabs in an 8u list) or 8u underline tabs over a 1px track; the indicator follows the active tab through --active-tab-* variables set by script.',
    media: 'Scroll-snap carousel with paddles and dots; images take a cover format, a fit, and an optional inline slideshow (controls on hover).',
    feedback: 'A toast is a container at the card-sm level: padding 3u − B, radius equal to it. Title and description share one column 0.5u apart; the action is an 8u control row and the close a 6u slot, 1u apart. The viewport is 80u wide, 4u from the window edges; collapsed toasts peek 2u, expanded (hover or focus, which also pause the timers) they stand 2u apart. Swipe, the close or Escape dismiss; F6 focuses the stack.',
    display: 'Static display elements. A separator is a rule as thick as the theme border, never thinner than a hairline; the container gap spaces it. An avatar is a round square on the slot and control ladder (sm 6u, md 8u, lg 12u, xl 16u) whose initials and icon scale with it; the fallback shows until the picture loads.',
  };
  const CONTENT: Record<Family, ReactNode> = {
    actions: (
      <>
        <Row label="Slots">
          <ui-button><i slot="leading" name="plus" />Add item</ui-button>
          <ui-button>Next<i slot="trailing" name="arrow-right" /></ui-button>
          <ui-button aria-label="Add"><i slot="leading" name="plus" /></ui-button>
          <ui-button icon-size="fill"><span slot="leading" className={avatar} />Kim</ui-button>
        </Row>
        <Row label="Primary">
          <ui-button variant="primary">Save</ui-button>
          <ui-button variant="primary"><i slot="leading" name="plus" />Add item</ui-button>
          <ui-button variant="primary">Publish<span slot="suffix">⌘P</span></ui-button>
          <ui-button variant="primary" aria-label="Add"><i slot="leading" name="plus" /></ui-button>
          <ui-button variant="primary" loading>Saving</ui-button>
          <ui-button variant="primary" disabled>Disabled</ui-button>
        </Row>
        <Row label="Prefix / suffix">
          <ui-button><i slot="leading" name="credit-card" /><span slot="prefix">$</span>Pay 40<span slot="suffix">⌘P</span><i slot="trailing" name="caret-down" /></ui-button>
          <ui-button>Save<span slot="suffix">⌘S</span></ui-button>
          <ui-button><i slot="leading" name="bell" />Inbox<span slot="suffix">12</span></ui-button>
          <ui-chip selectable>Unread<span slot="suffix">4</span></ui-chip>
          <ui-tag><i slot="leading" name="tag" />Size<span slot="suffix">M</span></ui-tag>
        </Row>
        <Row label="Icon sizes">
          {(['sm', 'md', 'lg'] as const).map((k) => <ui-button key={k} icon-size={k}><i slot="leading" name="star" />{k}</ui-button>)}
          <ui-button icon-size="fill"><span slot="leading" className={avatar} />fill</ui-button>
        </Row>
        <Row label="Toggle">
          <ui-group>
            <ui-toggle aria-label="Bold" pressed><i slot="leading" name="text-b" /></ui-toggle>
            <ui-toggle aria-label="Italic"><i slot="leading" name="text-italic" /></ui-toggle>
            <ui-toggle aria-label="Underline" disabled><i slot="leading" name="text-underline" /></ui-toggle>
          </ui-group>
          <ui-toggle default-pressed><i slot="leading" name="star" />Favorite</ui-toggle>
          <ui-toggle>Notify me<span slot="suffix">3</span></ui-toggle>
          <ui-toggle pressed disabled>Locked on</ui-toggle>
        </Row>
        <Row label="States">
          <ui-button>Default</ui-button>
          <ui-button loading>Loading</ui-button>
          <ui-button disabled>Disabled</ui-button>
        </Row>
        <SizeLadder family="button" params={params}>
          <ui-button><i slot="leading" name="plus" />Button</ui-button>
          <ui-button variant="primary">Save</ui-button>
          <ui-button aria-label="More"><i slot="leading" name="dots-three" /></ui-button>
          <ui-toggle pressed><i slot="leading" name="star" />Toggle</ui-toggle>
          <ui-toggle aria-label="Bold"><i slot="leading" name="text-b" /></ui-toggle>
        </SizeLadder>
      </>
    ),
    labels: (
      <SizeLadder family="btg" params={params}>
        <ui-badge>3</ui-badge>
        <ui-badge>New</ui-badge>
        <ui-tag><i slot="leading" name="star" />Featured</ui-tag>
        <ui-chip selectable selected><i slot="leading" name="check" />Design</ui-chip>
        <ui-chip selectable>Engineering</ui-chip>
        <ui-chip removable>Remote</ui-chip>
      </SizeLadder>
    ),
    fields: (
      <>
      <form className={formGrid} onSubmit={(e) => { e.preventDefault(); setStatus(JSON.stringify(Object.fromEntries(new FormData(e.currentTarget)))); }}>
        <ui-input name="email" type="email" required label="Email" placeholder="you@example.com" description="We never share it." />
        <ui-input name="password" type="password" required minlength={12} label="Password" value="hunter2" />
        <ui-input name="team" label="Team" error="That name is taken." value="Acme" />
        <ui-input name="price" label="Price" value="40"><span slot="prefix">$</span><span slot="suffix">USD</span></ui-input>
        <ui-input name="search" label="Search" placeholder="Find a file"><i slot="leading" name="magnifying-glass" /><span slot="suffix">⌘K</span></ui-input>
        <ui-select name="role" label="Role" required>
          <ui-option value="design">Designer</ui-option>
          <ui-option value="eng">Engineer</ui-option>
          <ui-option value="research">Researcher</ui-option>
        </ui-select>
        <ui-checkbox name="terms" required>I accept the terms</ui-checkbox>
        <div className={specimens}>
          <ui-button type="submit">Create account</ui-button>
          <ui-button type="reset">Reset</ui-button>
        </div>
        <p className={caption} role="status">{status}</p>
      </form>
      <SizeLadder family="field" params={params}>
        <div className={ladderField}><ui-input label="Price" value="40"><span slot="prefix">$</span><span slot="suffix">USD</span></ui-input></div>
        <div className={ladderField}><ui-select label="Role" value="eng"><ui-option value="design">Designer</ui-option><ui-option value="eng">Engineer</ui-option></ui-select></div>
      </SizeLadder>
      <div className={stack}><h3 className={subTitle}>Inline fields</h3><InlineFields /></div>
      <div className={stack}><h3 className={subTitle}>Fieldsets</h3><Fieldsets params={params} /></div>
      </>
    ),
    selection: (
      <>
      <div className={columns}>
        <div className={stack}>
          <ui-select name="role" label="Role" required description="You can change this later.">
            <ui-option value="design">Designer</ui-option>
            <ui-option value="eng">Engineer</ui-option>
            <ui-option value="pm" disabled>Product manager</ui-option>
            <ui-option value="research">Researcher</ui-option>
          </ui-select>
          <ui-segmented name="plan" value="monthly" label="Billing">
            <ui-option value="monthly">Monthly</ui-option>
            <ui-option value="yearly">Yearly</ui-option>
          </ui-segmented>
        </div>
        <ui-listbox name="region" value="eu" label="Region">
          <ui-option value="us"><i slot="leading" name="globe" />United States</ui-option>
          <ui-option value="eu"><i slot="leading" name="globe" />Europe</ui-option>
          <ui-option value="apac"><i slot="leading" name="globe" />Asia Pacific</ui-option>
        </ui-listbox>
      </div>
      <SizeLadder family="composite" params={params}>
        <ui-segmented label="Billing" value="monthly"><ui-option value="monthly">Monthly</ui-option><ui-option value="yearly">Yearly</ui-option></ui-segmented>
      </SizeLadder>
      </>
    ),
    choices: (
      <>
        <Row label="Checkbox">
          <ui-checkbox>Email updates</ui-checkbox>
          <ui-checkbox checked>Push</ui-checkbox>
          <ui-checkbox indeterminate>Some</ui-checkbox>
          <ui-checkbox disabled>Disabled</ui-checkbox>
        </Row>
        <Row label="Radio">
          <ui-radio name="plan-r" value="free" checked>Free</ui-radio>
          <ui-radio name="plan-r" value="pro">Pro</ui-radio>
          <ui-radio name="plan-r" value="team">Team</ui-radio>
        </Row>
        <Row label="Switch">
          <ui-switch checked>Wi-Fi</ui-switch>
          <ui-switch>Bluetooth</ui-switch>
        </Row>
        <SizeLadder family="choice" params={params}>
          <ui-checkbox checked>Checkbox</ui-checkbox><ui-radio checked>Radio</ui-radio><ui-switch checked>Switch</ui-switch>
        </SizeLadder>
        <ChoiceGroups params={params} />
      </>
    ),
    tracks: (
      <>
        <Row label="Range"><div className={trackStack}><ui-range label="Volume" value={40} /><ui-range label="Steps" min={0} max={10} step={1} value={3} /></div></Row>
        <Row label="Progress"><div className={trackStack}><ui-progress label="Upload" value={64} /><ui-progress label="Loading" /></div></Row>
        <Row label="Meter">
          <div className={trackStack}>
            <ui-meter label="Battery" value={72} />
            <ui-meter label="Storage" value={38.5} max={50} format='{"style":"unit","unit":"gigabyte","maximumFractionDigits":1}' value-text="38.5 of 50 gigabytes used" />
            <ui-meter label="A much longer label that has to give way to the value" value={12} />
            <ui-meter aria-label="Strength" value={3} max={4} format='{"style":"decimal"}' />
          </div>
        </Row>
        <SizeLadder family="track" params={params}>
          <div className={trackStack}><ui-range label="Volume" value={40} /><ui-progress label="Upload" value={64} /><ui-meter label="Storage" value={64} /></div>
        </SizeLadder>
      </>
    ),
    color: (
      <>
        <Row label="Swatches">
          {['#ef4444', '#f59e0b', '#10b981', '#3b82f6', 'oklch(0.6 0.2 300 / 0.5)'].map((c) => <ui-swatch key={c} color={c} />)}
        </Row>
        <Row label="Palette">
          <ui-palette label="Brand" name="brand" value="#3b82f6">
            {['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'].map((c) => <ui-swatch key={c} color={c} />)}
          </ui-palette>
        </Row>
        <SizeLadder family="swatch" params={params}>
          <ui-swatch color="#3b82f6" />
          <ui-palette label="Brand">{['#ef4444', '#f59e0b', '#10b981', '#3b82f6'].map((c) => <ui-swatch key={c} color={c} />)}</ui-palette>
        </SizeLadder>
      </>
    ),
    disclosure: (
      <>
        <Row label="Collapsible">
          <div className={disclosureColumn}>
            <ui-collapsible label="What is a unit?"><p className={panelText}>Every length in the kit is a multiple of u. A control is 8u tall; type is 10px + u.</p></ui-collapsible>
            <ui-collapsible label="Shipping" default-open><p className={panelText}>Orders ship within two working days. Tracking arrives by email.</p></ui-collapsible>
            <ui-collapsible>
              <div data-part="trigger"><i slot="leading" name="key" />Recovery keys<span slot="suffix">3</span></div>
              <div data-part="panel"><p className={panelText}>alien-bean-pasta · quiet-river-stone · north-paper-lamp</p></div>
            </ui-collapsible>
            <ui-collapsible label="Archived (read only)" disabled><p className={panelText}>Hidden.</p></ui-collapsible>
          </div>
        </Row>
        <Row label="Accordion">
          <div className={disclosureColumn}>
            <ui-accordion default-value="shipping">
              <ui-collapsible value="shipping" label="Shipping"><p className={panelText}>Orders ship within two working days. Tracking arrives by email.</p></ui-collapsible>
              <ui-collapsible value="returns" label="Returns"><p className={panelText}>Return anything within 30 days, free of charge.</p></ui-collapsible>
              <ui-collapsible value="warranty" label="Warranty"><i slot="leading" name="shield-check" /><p className={panelText}>Two years on every part, worldwide.</p></ui-collapsible>
              <ui-collapsible value="archive" label="Archived orders" disabled><p className={panelText}>Hidden.</p></ui-collapsible>
            </ui-accordion>
          </div>
        </Row>
        <Row label="Multiple">
          <div className={disclosureColumn}>
            <ui-accordion multiple>
              <ui-collapsible label="Account" open><p className={panelText}>Name, email and avatar.</p></ui-collapsible>
              <ui-collapsible label="Billing" open><p className={panelText}>Card ending 4242, renews 1 Dec.</p></ui-collapsible>
              <ui-collapsible label="Notifications"><p className={panelText}>Email and push.</p></ui-collapsible>
            </ui-accordion>
          </div>
        </Row>
        <Row label="Tabs">
          <div className={tabsColumn}>
            <ui-tabs label="Project">
              <div {...{ value: 'overview', label: 'Overview' }} data-part="panel"><p className={panelText}>Status, owners and the next milestone.</p></div>
              <div {...{ value: 'activity', label: 'Activity' }} data-part="panel"><p className={panelText}>Twelve changes this week, three reviews waiting.</p></div>
              <div {...{ value: 'settings', label: 'Settings' }} data-part="panel"><p className={panelText}>Name, visibility and access.</p></div>
            </ui-tabs>
            <ui-tabs variant="underline" default-value="files" label="Repository">
              <div data-part="list">
                <div {...{ value: 'code' }} data-part="tab"><i slot="leading" name="code" />Code</div>
                <div {...{ value: 'files' }} data-part="tab">Files<span slot="suffix">12</span></div>
                <div {...{ value: 'issues' }} data-part="tab"><i slot="leading" name="bug" />Issues</div>
                <div {...{ value: 'wiki', disabled: true }} data-part="tab">Wiki</div>
              </div>
              <div {...{ value: 'code' }} data-part="panel"><p className={panelText}>main.ts · styles.css · README.md</p></div>
              <div {...{ value: 'files' }} data-part="panel"><p className={panelText}>12 files, 4 folders.</p></div>
              <div {...{ value: 'issues' }} data-part="panel"><p className={panelText}>No open issues.</p></div>
              <div {...{ value: 'wiki' }} data-part="panel"><p className={panelText}>Empty.</p></div>
            </ui-tabs>
          </div>
        </Row>
        <Row label="Vertical">
          <div className={tabsRow}>
            <ui-tabs orientation="vertical" activate-on-focus label="Preferences">
              <div {...{ label: 'General' }} data-part="panel"><p className={panelText}>Language and region. Arrow keys switch tabs here (activate on focus).</p></div>
              <div {...{ label: 'Privacy' }} data-part="panel"><p className={panelText}>Who can see your profile.</p></div>
              <div {...{ label: 'Billing' }} data-part="panel"><p className={panelText}>Invoices and payment.</p></div>
            </ui-tabs>
            <ui-tabs orientation="vertical" variant="underline" label="Sections">
              <div {...{ label: 'Intro' }} data-part="panel"><p className={panelText}>Underline, vertical: the bar runs on the inline end.</p></div>
              <div {...{ label: 'Details' }} data-part="panel"><p className={panelText}>Second panel.</p></div>
            </ui-tabs>
          </div>
        </Row>
        <SizeLadder family="disclosure" params={params}>
          <ui-tabs label="Size"><div {...{ label: 'One' }} data-part="panel" /><div {...{ label: 'Two' }} data-part="panel" /><div {...{ label: 'Three' }} data-part="panel" /></ui-tabs>
          <ui-tabs variant="underline" label="Size"><div {...{ label: 'One' }} data-part="panel" /><div {...{ label: 'Two' }} data-part="panel" /></ui-tabs>
          <div className={disclosureColumn}>
            <ui-accordion default-value="0"><ui-collapsible label="Details"><p className={panelText}>Panel text starts at the trigger label.</p></ui-collapsible><ui-collapsible label="More" /></ui-accordion>
          </div>
        </SizeLadder>
      </>
    ),
    media: (
      <>
        <Row label="Swiper">
          <ui-swiper label="Gallery" className={media}>
            {IMAGES.map((src, i) => <ui-image key={i} src={src} alt={`Slide ${i + 1}`} ratio="wide" />)}
          </ui-swiper>
        </Row>
        <Row label="Formats">
          <div className={formats}>
            {['square', 'landscape', 'portrait', 'wide', 'golden'].map((r, i) => (
              <figure key={r} className={figure}><ui-image src={IMAGES[i % 4]} alt={r} ratio={r} /><figcaption className={caption}>{r}</figcaption></figure>
            ))}
          </div>
        </Row>
        <Row label="Slideshow">
          <ui-image slideshow ratio="wide" alt="Places" className={media}>
            {IMAGES.map((src, i) => <img key={i} src={src} alt={`Place ${i + 1}`} />)}
          </ui-image>
        </Row>
      </>
    ),
    feedback: <Toasts params={params} />,
    display: (
      <>
        <Row label="Separator">
          <div className={separatorDemo}>
            <ui-collection><span>Account</span><span>Billing</span><ui-separator /><span>Sign out</span></ui-collection>
            <ui-group><ui-button>Cut</ui-button><ui-button>Copy</ui-button><ui-separator orientation="vertical" /><ui-button>Paste</ui-button></ui-group>
          </div>
        </Row>
        <Row label="Avatar">
          <ui-avatar avatar-size="sm" name="Maya Lindqvist" />
          <ui-avatar name="Maya Lindqvist" />
          <ui-avatar avatar-size="lg" name="Tomás Herrera" className={tonePrimary} />
          <ui-avatar avatar-size="xl" src={IMAGES[1]} alt="Aiko Tanaka">AT</ui-avatar>
          <ui-avatar name="Broken link" src="data:image/png;base64,broken" />
          <ui-avatar />
        </Row>
        <Row label="In a slot">
          <ui-button icon-size="fill"><ui-avatar slot="leading" avatar-size="sm" name="Kim Sandberg" />Kim</ui-button>
          <ui-chip><ui-avatar slot="leading" avatar-size="sm" src={IMAGES[0]} alt="" />Dawn</ui-chip>
        </Row>
        <h3 className={subTitle}>Avatar sizes</h3>
        <SizeLadder family="avatar" params={params}>
          <ui-avatar avatar-size="sm" name="Ada Lovelace" /><ui-avatar name="Ada Lovelace" /><ui-avatar avatar-size="lg" name="Ada Lovelace" className={tonePrimary} /><ui-avatar avatar-size="xl" />
        </SizeLadder>
        <h3 className={subTitle}>Separator sizes</h3>
        <SizeLadder family="separator" params={params}>
          <div className={separatorLadder}><ui-group><ui-button>Cut</ui-button><ui-separator orientation="vertical" /><ui-button>Paste</ui-button></ui-group><ui-separator /></div>
        </SizeLadder>
      </>
    ),
  };
  const shown = FAMILIES.filter(([f]) => !family || f === family);
  return (
    <Page title="Components" lead="Every web component at the live theme, by family. Sizes are the unit u (control height 8u); the jig panel changes the theme live.">
      {shown.map(([f, label, tags]) => (
        <Fragment key={f}>
          <Divider />
          <Section id={f} title={label} tags={tags} note={NOTES[f]}>{CONTENT[f]}</Section>
        </Fragment>
      ))}
    </Page>
  );
}

// Toast specimens: inline viewports seeded from their own managers (timeout 0: they stay), and live
// viewports in the top layer fed by the buttons.
const toastColumn = css({ display: 'flex', flexDirection: 'column', gap: '4', width: 'full', maxWidth: '[24rem]' });
const live = createToastManager();
const liveTop = createToastManager();
type ToastViewportEl = HTMLElement & { manager: ToastManager };

function ToastPreview({ toasts, limit }: { toasts: ToastOptions[]; limit?: number }) {
  const ref = useCallback((el: ToastViewportEl | null) => {
    if (!el) return;
    const m = createToastManager({ timeout: 0 });
    el.manager = m;
    for (const t of [...toasts].reverse()) m.add({ timeout: 0, ...t });
  }, []);
  return <ui-toast-viewport ref={ref} placement="inline" limit={limit} label="Preview" />;
}

function Toasts({ params }: Pick<PageProps, 'params'>) {
  const bind = (m: ToastManager) => (el: ToastViewportEl | null) => { if (el) el.manager = m; };
  let n = 0;
  const save = () => new Promise<string>((ok, no) => setTimeout(() => (Math.random() < 0.75 ? ok('draft.md') : no(new Error('The server did not answer.'))), 1600));
  return (
    <>
      <Row label="Types">
        <div className={toastColumn}>
          <ToastPreview toasts={[
            { title: 'Changes saved', description: 'Your draft is stored on this device.', type: 'success', actionProps: { children: 'Undo' } },
            { title: 'Upload failed', description: 'cover.png is larger than 10 MB.', type: 'error' },
            { description: 'Syncing 12 files…', type: 'loading' },
          ]} />
        </div>
      </Row>
      <Row label="Long text">
        <div className={toastColumn}>
          <ToastPreview toasts={[{ title: 'Invitation sent to the design review group for Thursday', description: 'Everyone on the list gets an email with the agenda, the meeting link and the files attached to this project.', actionProps: { children: 'View invite' } }]} />
        </div>
      </Row>
      <Row label="Live">
        <ui-button onClick={() => live.add({ title: `Message ${++n}`, description: 'Hover or focus the stack to pause and expand it.', actionProps: { children: 'Undo', onClick: () => live.add({ description: 'Undone.', type: 'info' }) } })}>Notify</ui-button>
        <ui-button onClick={() => live.promise(save(), { loading: 'Saving draft…', success: (f) => ({ title: 'Saved', description: `${f} is stored.` }), error: (e) => ({ title: 'Not saved', description: (e as Error).message }) })}>Save (promise)</ui-button>
        <ui-button onClick={() => liveTop.add({ title: 'Connection lost', description: 'Swipe up or press Escape to dismiss.', type: 'warning', priority: 'high' })}>Alert at the top</ui-button>
        <ui-button onClick={() => { live.close(); liveTop.close(); }}>Close all</ui-button>
        <ui-toast-viewport ref={bind(live)} />
        <ui-toast-viewport ref={bind(liveTop)} placement="top-center" swipe-direction="up" label="Alerts" />
      </Row>
      <SizeLadder family="toast" params={params}>
        <div className={toastColumn}><ToastPreview toasts={[{ title: 'Saved', description: 'Draft stored.', actionProps: { children: 'Undo' } }]} /></div>
      </SizeLadder>
    </>
  );
}
