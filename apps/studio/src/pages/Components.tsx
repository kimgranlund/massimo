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
import { Fragment, useState, type ReactNode } from 'react';
import { css } from '../../styled-system/css/index.js';
import type { PageProps } from './types.ts';
import { CQ_MD, Divider, IMAGES, Page, Row, Section, SizeLadder, caption, columns, specimens, stack } from './shared.tsx';

/** Component families, in page order: [id, label, elements]. */
export const FAMILIES = [
  ['actions', 'Actions', 'ui-button'],
  ['labels', 'Labels', 'ui-badge · ui-tag · ui-chip'],
  ['fields', 'Fields', 'ui-input · ui-select'],
  ['selection', 'Selection', 'ui-listbox · ui-segmented · ui-select'],
  ['choices', 'Choices', 'ui-checkbox · ui-radio · ui-switch'],
  ['tracks', 'Tracks', 'ui-range · ui-progress'],
  ['color', 'Color', 'ui-swatch · ui-palette'],
  ['media', 'Media', 'ui-swiper · ui-image'],
] as const;
export type Family = (typeof FAMILIES)[number][0];
export const isFamily = (v: string | null): v is Family => FAMILIES.some(([f]) => f === v);

const avatar = css({ display: 'block', bg: 'primary.solid' });
const media = css({ width: 'full', maxWidth: '[40rem]', borderRadius: 'xl', overflow: 'hidden' });
const formats = css({ display: 'flex', gap: '3', flexWrap: 'wrap', alignItems: 'end' });
const figure = css({ display: 'flex', flexDirection: 'column', gap: '1', width: '[8rem]' });
const formGrid = css({ display: 'grid', gridTemplateColumns: '1fr', gap: '4', alignItems: 'start', [CQ_MD]: { gridTemplateColumns: '1fr 1fr' } });
const trackStack = css({ display: 'flex', flexDirection: 'column', gap: '4', width: '[min(100%, 24rem)]' });

// A field in a size ladder: a fixed share of the row so each size's field keeps its own width.
const ladderField = css({ width: 'full', maxWidth: '[20rem]' });

export function ComponentsPage({ family, params }: PageProps & { family?: Family }) {
  const [status, setStatus] = useState('');
  const NOTES: Record<Family, string> = {
    actions: 'Construction pattern: leading icon, prefix, label, suffix, trailing icon. Icon slots at least 6u; text parts 1u apart, 1u beside a slot, 2u at a bare edge; padding 1u; text 10px + u.',
    labels: 'Heights 12px + k·u (badge 1, tag 2, chip 3), capped below the control height.',
    fields: 'No native form elements. Errors appear after interaction or a submit attempt; the form submits real values.',
    selection: 'Select, segmented control and listbox share one option model; composites pad 0.5u so a segmented row stays 8u.',
    choices: 'A 5u box (switch 9u × 5u) in the 6u leading slot; the label starts 1u after the slot.',
    tracks: 'A 4u track. The range thumb sits inside it (track − u, inset 0.5u) and the fill wraps it with a concentric cap. Arrow keys, Page Up/Down, Home/End, drag.',
    color: 'Swatches are 6u; a palette attaches them with no gaps and can be a selectable listbox.',
    media: 'Scroll-snap carousel with paddles and dots; images take a cover format, a fit, and an optional inline slideshow (controls on hover).',
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
        <Row label="States">
          <ui-button>Default</ui-button>
          <ui-button loading>Loading</ui-button>
          <ui-button disabled>Disabled</ui-button>
        </Row>
        <SizeLadder family="button" params={params}>
          <ui-button><i slot="leading" name="plus" />Button</ui-button>
          <ui-button variant="primary">Save</ui-button>
          <ui-button aria-label="More"><i slot="leading" name="dots-three" /></ui-button>
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
      </>
    ),
    tracks: (
      <>
        <Row label="Range"><div className={trackStack}><ui-range label="Volume" value={40} /><ui-range label="Steps" min={0} max={10} step={1} value={3} /></div></Row>
        <Row label="Progress"><div className={trackStack}><ui-progress label="Upload" value={64} /><ui-progress label="Loading" /></div></Row>
        <SizeLadder family="track" params={params}>
          <div className={trackStack}><ui-range label="Volume" value={40} /><ui-progress label="Upload" value={64} /></div>
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
