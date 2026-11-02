// The canvas: every ui-kit web component, rendered inline in the studio. Theme overrides are
// scoped to the [data-canvas] element by the studio, so the panel keeps the default theme.
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
import '../icons.ts';
import { useState } from 'react';
import { css } from '../../styled-system/css/index.js';
import { page as pageLayout } from '../../styled-system/patterns/index.js';
import type { FaceMap, SpectrumPayload, View, VoiceMap } from '../protocol.ts';
import { UNIQUE_HUES as UNIQUE } from '@massimo/ui-kit/spectrum';
import { TYPE_ROLES, VOICES, resolveType, type ThemeParams, type TypeRoleName } from '@massimo/ui-kit/tokens';

// Specimen layout: the page container (8u padding and gap) holds titled sections split by
// dividers. Each section is a list of labelled rows: label on the left, specimens on the right.
const shell = pageLayout({ width: '80rem' });
const header = css({ display: 'flex', flexDirection: 'column', gap: '1' });
const pageTitle = css({ textStyle: 'display' });
const lead = css({ color: 'fg.muted', maxWidth: '60ch' });
const divider = css({ borderTopWidth: 'thin', borderColor: 'border', width: '100%' });
const section = css({ display: 'flex', flexDirection: 'column', gap: '5' });
const sectionHead = css({ display: 'flex', flexDirection: 'column', gap: '1' });
const sectionTitle = css({ textStyle: 'heading-2' });
const caption = css({ textStyle: 'caption', color: 'fg.muted' });
const rowGrid = css({ display: 'grid', gridTemplateColumns: { base: '1fr', md: '11rem 1fr' }, gap: { base: '2', md: '6' }, alignItems: 'center' });
const rowLabel = css({ textStyle: 'label', color: 'fg.muted' });
const specimens = css({ display: 'flex', gap: '2', flexWrap: 'wrap', alignItems: 'center' });
const formGrid = css({ display: 'grid', gridTemplateColumns: { base: '1fr', md: '1fr 1fr' }, gap: '4', alignItems: 'start' });
const columns = css({ display: 'grid', gridTemplateColumns: { base: '1fr', md: '1fr 1fr' }, gap: '8', alignItems: 'start' });
const subTitle = css({ textStyle: 'heading-3' });
const stack = css({ display: 'flex', flexDirection: 'column', gap: '4' });
const avatar = css({ display: 'block', bg: 'accent.solid' });
const media = css({ width: '100%', maxWidth: '40rem', borderRadius: 'xl', overflow: 'hidden' });
const formats = css({ display: 'flex', gap: '3', flexWrap: 'wrap', alignItems: 'end' });
const figure = css({ display: 'flex', flexDirection: 'column', gap: '1', width: '8rem' });
const levelBox = css({ bg: 'accent.subtle', alignSelf: 'start' });
const levelChild = css({ display: 'block', bg: 'bg', minWidth: '10', minHeight: '6', borderRadius: 'sm' });
const rampRow = css({ display: 'grid', gridTemplateColumns: { base: '1fr', md: '7rem 1fr 1fr' }, gap: '3', alignItems: 'center' });
const ramp = css({ width: '100%' });
const typeRow = css({ display: 'grid', gridTemplateColumns: { base: '1fr', md: '14rem 1fr' }, gap: { base: '2', md: '6' }, alignItems: 'start', paddingBlock: '3', borderBottomWidth: 'thin', borderColor: 'border' });
const typeMeta = css({ display: 'flex', flexDirection: 'column', gap: '0.5' });
const metrics = css({ fontFamily: 'mono', fontSize: 'xs', color: 'fg.muted' });
// Faint baseline grid behind each specimen: one line per rhythm unit.
const rhythmSample = css({ backgroundImage: 'linear-gradient(to bottom, transparent calc(100% - 1px), color-mix(in oklch, var(--colors-accent-solid) 18%, transparent) 0)', whiteSpace: 'pre-wrap', maxWidth: '60ch' });
const codeSample = css({ whiteSpace: 'pre', bg: 'bg.muted', padding: '3', borderRadius: 'md', width: 'fit-content' });
const article = css({ display: 'flex', flexDirection: 'column', gap: '3', maxWidth: '62ch', '& pre': { whiteSpace: 'pre', bg: 'bg.muted', padding: '3', borderRadius: 'md' } });
const summary = css({ fontFamily: 'mono', fontSize: 'sm', color: 'fg.muted', '& b': { color: 'accent.fg', fontWeight: 'normal' } });
const chartGrid = css({ display: 'grid', gridTemplateColumns: { base: '1fr', lg: '1fr 1fr' }, gap: '4' });
const chartFig = css({ display: 'flex', flexDirection: 'column', gap: '3', bg: 'bg.subtle', padding: '4', borderRadius: 'xl' });
const chartSvg = css({ width: '100%', height: 'auto', color: 'fg', overflow: 'visible' });
const chartLabel = css({ fontFamily: 'mono', fontSize: '11px', fill: 'fg.muted' });
const chartTick = css({ fontFamily: 'mono', fontSize: '10px', fill: 'fg.muted' });
const axis = css({ stroke: 'border.strong', strokeWidth: 1 });
const grid = css({ stroke: 'border', strokeWidth: 1 });
const dashed = css({ stroke: 'fg.muted', strokeWidth: 1, strokeDasharray: '3 3', fill: 'none' });
const context = css({ display: 'flex', flexDirection: 'column', gap: '5' });
const contextHead = css({ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '3', flexWrap: 'wrap' });
const brandGrid = css({ display: 'grid', gridTemplateColumns: { base: '1fr', md: '2fr 1fr 1fr' }, gap: '4', '& > :first-child': { gridRow: { md: 'span 2' } }, '& > ui-palette': { gridColumn: { md: 'span 2' } } });
const campaign = css({ justifyContent: 'space-between', minHeight: '20rem' });
const kicker = css({ textStyle: 'caption', textTransform: 'uppercase', letterSpacing: 'wide', display: 'inline-flex', alignItems: 'center', gap: '2' });
const display = css({ textStyle: 'display', lineHeight: 'tight' });
const bigFigure = css({ fontSize: '4xl', fontWeight: 'bold', lineHeight: 'tight', '& span': { fontSize: '2xl' } });
const rampStrip = css({ width: '100%', alignSelf: 'end' });
const dot = css({ display: 'inline-block', width: '2', height: '2', borderRadius: 'full' });
const workspaceHead = css({ display: 'flex', alignItems: 'center', gap: '3', flexWrap: 'wrap', '& > div': { flex: '1' } });
const uiGrid = css({ display: 'grid', gridTemplateColumns: { base: '1fr', md: 'repeat(3, 1fr)' }, gap: '4', alignItems: 'start', '& ui-card > ui-badge': { alignSelf: 'start' } });
const cardTitle = css({ textStyle: 'heading-3' });
const chartCard = css({ gridColumn: { md: 'span 2' } });
const chart = css({ display: 'flex', gap: '3', height: '10rem', alignItems: 'stretch' });
const chartDay = css({ flex: '1', display: 'flex', flexDirection: 'column', gap: '1', alignItems: 'center' });
const bars = css({ flex: '1', width: '100%', display: 'flex', gap: '1', alignItems: 'end', justifyContent: 'center' });
const bar = css({ width: '40%', borderRadius: 'sm' });
const legend = css({ display: 'flex', gap: '4', textStyle: 'caption', '& span': { display: 'inline-flex', alignItems: 'center', gap: '1.5' } });
const stateRow = css({ display: 'flex', gap: '3', flexWrap: 'wrap' });
const stateCell = css({ display: 'flex', flexDirection: 'column', gap: '1' });
const callout = css({ padding: '3', borderRadius: 'lg', textStyle: 'label', fontWeight: 'normal' });
const trackStack = css({ display: 'flex', flexDirection: 'column', gap: '4', width: 'min(100%, 24rem)' });

function Section({ id, title, children, note }: { id: string; title: string; note: string; children: React.ReactNode }) {
  return (
    <section className={section} aria-labelledby={id}>
      <header className={sectionHead}>
        <h2 id={id} className={sectionTitle}>{title}</h2>
        <p className={caption}>{note}</p>
      </header>
      {children}
    </section>
  );
}

function Row({ label, size, children }: { label: string; size?: string; children: React.ReactNode }) {
  return (
    <div className={rowGrid}>
      <span className={rowLabel}>{label}</span>
      <div className={specimens} data-size={size}>{children}</div>
    </div>
  );
}

const Divider = () => <hr className={divider} />;
const SIZE_ROWS = [['2', '16px'], ['3', '24px'], ['4', '32px'], ['4.5', '36px'], ['6', '48px']] as const;

// Sample images as inline SVG gradients (no network).
const art = (a: string, b: string, label: string) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="800" height="600" fill="url(#g)"/><text x="40" y="560" font-family="system-ui" font-size="48" fill="white" fill-opacity=".85">${label}</text></svg>`)}`;
const IMAGES = [art('#4f46e5', '#06b6d4', 'Dawn'), art('#f97316', '#db2777', 'Dusk'), art('#16a34a', '#0ea5e9', 'Coast'), art('#1e293b', '#7c3aed', 'Night')];

export function Canvas({ view, spectrum, params, voices, faces }: { view: View; spectrum?: SpectrumPayload; params: ThemeParams; voices: VoiceMap; faces: FaceMap }) {
  return (
    <main className={shell} id="page">
      {view === 'components' && <Components />}
      {view === 'containers' && <Containers />}
      {view === 'colors' && <Colors spectrum={spectrum} />}
      {view === 'typography' && <Typography params={params} voices={voices} faces={faces} />}
    </main>
  );
}

function Components() {
  const [status, setStatus] = useState('');
  return (
    <>
      <header className={header}>
        <h1 className={pageTitle}>ui-kit specimens</h1>
        <p className={lead}>Every web component at its default theme. Sizes are the unit u (control height 8u); the studio panel changes the theme live.</p>
      </header>

      <Divider />
      <Section id="buttons" title="Buttons" note="Leading / contents / trailing slots, each at least 6u; padding 1u; text 10px + u.">
        <Row label="Slots">
          <ui-button><i slot="leading" name="plus" />Add item</ui-button>
          <ui-button>Next<i slot="trailing" name="arrow-right" /></ui-button>
          <ui-button aria-label="Add"><i slot="leading" name="plus" /></ui-button>
          <ui-button icon-size="fill"><span slot="leading" className={avatar} />Kim</ui-button>
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
        {SIZE_ROWS.map(([u, h]) => (
          <Row key={u} label={`Size ${u} · ${h}`} size={u}>
            <ui-button><i slot="leading" name="plus" />Button</ui-button>
            <ui-button aria-label="More"><i slot="leading" name="dots-three" /></ui-button>
          </Row>
        ))}
      </Section>

      <Divider />
      <Section id="btg" title="Badges, tags, chips" note="Heights 12px + k·u (badge 1, tag 2, chip 3), capped below the control height.">
        {SIZE_ROWS.map(([u, h]) => (
          <Row key={u} label={`Size ${u} · ${h}`} size={u}>
            <ui-badge>3</ui-badge>
            <ui-badge>New</ui-badge>
            <ui-tag><i slot="leading" name="star" />Featured</ui-tag>
            <ui-chip selectable selected><i slot="leading" name="check" />Design</ui-chip>
            <ui-chip selectable>Engineering</ui-chip>
            <ui-chip removable>Remote</ui-chip>
          </Row>
        ))}
      </Section>

      <Divider />
      <Section id="fields" title="Fields" note="No native form elements. Errors appear after interaction or a submit attempt; the form submits real values.">
        <form className={formGrid} onSubmit={(e) => { e.preventDefault(); setStatus(JSON.stringify(Object.fromEntries(new FormData(e.currentTarget)))); }}>
          <ui-input name="email" type="email" required label="Email" placeholder="you@example.com" description="We never share it." />
          <ui-input name="password" type="password" required minlength={12} label="Password" value="hunter2" />
          <ui-input name="team" label="Team" error="That name is taken." value="Acme" />
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
      </Section>

      <Divider />
      <Section id="selection" title="Selection" note="Select, segmented control and listbox share one option model; composites pad 0.5u so a segmented row stays 8u.">
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
      </Section>

      <Divider />
      <Section id="choices" title="Checkbox, radio, switch" note="A 5u box (switch 9u × 5u) in the 6u leading slot; the label starts 1u after the slot.">
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
        {SIZE_ROWS.slice(1, 4).map(([u, h]) => (
          <Row key={u} label={`Size ${u} · ${h}`} size={u}>
            <ui-checkbox checked>Checkbox</ui-checkbox><ui-radio checked>Radio</ui-radio><ui-switch checked>Switch</ui-switch>
          </Row>
        ))}
      </Section>

      <Divider />
      <Section id="tracks" title="Range and progress" note="A 4u box with a 1u track; range adds a 4u thumb. Arrow keys, Page Up/Down, Home/End, drag.">
        <Row label="Range"><div className={trackStack}><ui-range label="Volume" value={40} /><ui-range label="Steps" min={0} max={10} step={1} value={3} /></div></Row>
        <Row label="Progress"><div className={trackStack}><ui-progress label="Upload" value={64} /><ui-progress label="Loading" /></div></Row>
      </Section>

      <Divider />
      <Section id="media" title="Swiper and image" note="Scroll-snap carousel with paddles and dots; images take a cover format, a fit, and an optional inline slideshow (controls on hover).">
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
      </Section>

      <Divider />
      <Section id="swatches" title="Swatch and palette" note="Swatches are 6u; a palette attaches them with no gaps and can be a selectable listbox.">
        <Row label="Swatches">
          {['#ef4444', '#f59e0b', '#10b981', '#3b82f6', 'oklch(0.6 0.2 300 / 0.5)'].map((c) => <ui-swatch key={c} color={c} />)}
        </Row>
        <Row label="Palette">
          <ui-palette label="Brand" name="brand" value="#3b82f6">
            {['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'].map((c) => <ui-swatch key={c} color={c} />)}
          </ui-palette>
        </Row>
      </Section>
    </>
  );
}

function Containers() {
  return (
    <>
      <header className={header}>
        <h1 className={pageTitle}>Containers</h1>
        <p className={lead}>Padding = gap per level; radius 3u + padding up to card, square from panel up. Override any gap with gap="n".</p>
      </header>
      <Section id="containers" title="Containers" note="Padding and gap per level (group 1u, collection 2u, tile 3u, card 4u, panel 6u); radius 3u + padding up to card.">
        <ui-panel aria-label="Panel">
          <span className={caption}>Panel · 6u</span>
          <div className={columns}>
            <ui-card>
              <h3 className={subTitle}>Team</h3>
              <ui-collection gap="1">
                {['Ada', 'Grace', 'Linus'].map((n) => <ui-tile key={n}>{n}<ui-group><ui-button>Message</ui-button><ui-button aria-label="More"><i slot="leading" name="dots-three" /></ui-button></ui-group></ui-tile>)}
              </ui-collection>
            </ui-card>
            <ui-card data-size="3" gap="2">
              <h3 className={subTitle}>Compact card</h3>
              <span className={caption}>size 3, gap 2</span>
              <ui-group><ui-button>Save</ui-button><ui-button>Cancel</ui-button></ui-group>
            </ui-card>
          </div>
        </ui-panel>
      </Section>
      <Divider />
      <Section id="levels" title="Levels" note="Each box shows its padding (inner tint) and the gap between two children.">
        {(['group', 'collection', 'tile', 'card', 'panel', 'region'] as const).map((l) => {
          const Tag = `ui-${l}` as any;
          return (
            <Row key={l} label={l}>
              <Tag className={levelBox}><span className={levelChild}>a</span><span className={levelChild}>b</span></Tag>
            </Row>
          );
        })}
      </Section>
    </>
  );
}

// Spectrum variables for a family step (follow the active scheme and the jig's roles).
const sv = (family: string, step: number) => `var(--colors-spectrum-${family}-${step})`;
const ORDERS = { online: [72, 84, 68, 96, 108, 88, 80], store: [44, 49, 54, 46, 64, 82, 78] };
const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function ColorInContext({ spectrum }: { spectrum: SpectrumPayload }) {
  const { primary, neutral, critical } = spectrum.roles;
  // Accent: the family whose step-9 hue sits furthest from primary (punctuation, not a second brand).
  const names = spectrum.families.map((f) => f.name).filter((n) => n !== primary && n !== neutral);
  const idx = spectrum.families.findIndex((f) => f.name === primary);
  const accent = spectrum.families[(idx + Math.floor(spectrum.families.length / 2)) % spectrum.families.length]?.name ?? names[0];
  const ok = spectrum.families.find((f) => f.name === 'grass' || f.name === 'green' || f.name === 'jade')?.name ?? accent;
  const warn = spectrum.families.find((f) => f.name === 'amber' || f.name === 'yellow' || f.name === 'orange')?.name ?? accent;
  const max = Math.max(...ORDERS.online, ...ORDERS.store);
  const [approved, setApproved] = useState(false);
  return (
    <div className={context}>
      <div className={contextHead}><h3 className={subTitle}>Brand</h3><span className={caption}>Primary as material · accent as punctuation</span></div>
      <div className={brandGrid}>
        <ui-panel className={campaign} style={{ background: sv(primary, 9), color: spectrum.families.find((f) => f.name === primary)?.lightText[8] }}>
          <span className={kicker}>Studio / Collection 01</span>
          <h3 className={display}>A spectrum.<br />A shared language.</h3>
          <p>Different hues, one system. Color carries the character; a common rhythm holds it together.</p>
          <span className={kicker} style={{ color: sv(accent, 4) }}>An exploration in color &amp; proportion</span>
        </ui-panel>
        <ui-palette label={`${primary} steps 1 to 12`} className={rampStrip}>
          {Array.from({ length: 12 }, (_, i) => <ui-swatch key={i} color={sv(primary, i + 1)} label={`${primary} ${i + 1}`} />)}
        </ui-palette>
        <ui-panel style={{ background: sv(neutral, 2), color: sv(primary, 12) }}>
          <span className={kicker} style={{ color: sv(neutral, 11) }}>Ink &amp; paper <i className={dot} style={{ background: sv(accent, 9) }} /></span>
          <h3 className={display}>One hue.<br />Room to breathe.</h3>
          <p style={{ color: sv(neutral, 11) }}>A quiet field, a clear voice and a single accent.</p>
        </ui-panel>
        <ui-panel style={{ background: sv(primary, 3), color: sv(primary, 11) }}>
          <span className={kicker}>Tint &amp; emphasis</span>
          <strong className={bigFigure} style={{ color: sv(primary, 11) }}>62<span>%</span></strong>
          <p style={{ color: sv(primary, 12) }}>Large figures and small details share the same color family.</p>
        </ui-panel>
      </div>

      <div className={contextHead}><h3 className={subTitle}>Interface</h3><span className={caption}>Neutral surfaces · primary actions · semantic feedback</span></div>
      <ui-panel>
        <div className={workspaceHead}>
          <div><span className={kicker}>Collection workspace</span><h3 className={subTitle}>Spring catalog</h3></div>
          <ui-tag>Spring edition</ui-tag>
          <ui-badge style={{ background: sv(ok, 9), color: spectrum.families.find((f) => f.name === ok)?.lightText[8] }}>Ready for review</ui-badge>
        </div>
        <div className={uiGrid}>
          <ui-card>
            <span className={kicker}>Overview</span><h4 className={cardTitle}>A little color goes a long way.</h4>
            <p className={caption}>Review the collection, refine its details and prepare the next edition.</p>
            <div className={specimens}>
              <ui-button style={{ background: sv(primary, 9), color: 'var(--colors-fg-on-solid)' }} onClick={() => setApproved(true)}>Approve collection</ui-button>
              <ui-button onClick={() => setApproved(false)}>Reset approval</ui-button>
            </div>
            <p className={caption} role="status">{approved ? 'Collection approved' : 'Demo collection · awaiting approval'}</p>
          </ui-card>
          <ui-card>
            <span className={kicker}>Details</span>
            <ui-input label="Collection name" value="Spring catalog" />
            <ui-checkbox checked>Include neutral colors</ui-checkbox>
            <ui-checkbox>Include alternate editions</ui-checkbox>
          </ui-card>
          <ui-card>
            <span className={kicker}>Library</span>
            <ui-listbox label="Preview library" value="shared">
              {['Inbox', 'Drafts', 'Shared', 'Archive'].map((n) => <ui-option key={n} value={n.toLowerCase()}>{n}</ui-option>)}
            </ui-listbox>
          </ui-card>
          <ui-card>
            <span className={kicker}>This week</span><strong className={bigFigure} data-numeric>1,284</strong>
            <p className={caption}>Orders across two channels.</p>
            <ui-badge style={{ background: sv(ok, 3), color: sv(ok, 11) }}>↑ 12% this week</ui-badge>
          </ui-card>
          <ui-card>
            <span className={kicker}>Collection progress</span><strong className={bigFigure}>62<span>%</span></strong>
            <ui-progress label="Collection progress" value={62} />
            <p className={caption}>148 of 240 items reviewed.</p>
          </ui-card>
          <ui-card className={chartCard}>
            <div className={contextHead}><h4 className={cardTitle}>Orders by channel</h4><span className={caption}>Illustrative week</span></div>
            <div className={chart} role="img" aria-label={`Illustrative orders by channel, Monday through Sunday. Online: ${ORDERS.online.join(', ')}. In store: ${ORDERS.store.join(', ')}.`}>
              {DAYS.map((d, i) => (
                <div key={i} className={chartDay}>
                  <div className={bars}>
                    <span className={bar} style={{ height: `${(ORDERS.online[i] / max) * 100}%`, background: sv(primary, 9) }} />
                    <span className={bar} style={{ height: `${(ORDERS.store[i] / max) * 100}%`, background: sv(accent, 9) }} />
                  </div>
                  <span className={caption}>{d}</span>
                </div>
              ))}
            </div>
            <div className={legend}><span><i className={dot} style={{ background: sv(primary, 9) }} />Online · primary</span><span><i className={dot} style={{ background: sv(accent, 9) }} />In store · accent</span></div>
          </ui-card>
          <ui-card>
            <span className={kicker}>Action states</span>
            <div className={stateRow}>
              {([['Rest', 9], ['Hover', 10], ['Pressed', 11]] as const).map(([label, step]) => (
                <div key={label} className={stateCell}><span className={caption}>{label}</span><ui-button style={{ background: sv(primary, step), color: 'var(--colors-fg-on-solid)' }}>Approve</ui-button></div>
              ))}
              <div className={stateCell}><span className={caption}>Disabled</span><ui-button disabled>Approve</ui-button></div>
            </div>
          </ui-card>
          <ui-card>
            <span className={kicker}>Feedback</span>
            <p className={callout} role="note" style={{ background: sv(primary, 3), color: sv(primary, 11) }}>Changes to this palette appear across every preview.</p>
            <p className={callout} role="note" style={{ background: sv(warn, 3), color: sv(warn, 11) }}>Check small text and neighboring hues before choosing a brand color.</p>
            <p className={callout} role="note" style={{ background: sv(critical, 3), color: sv(critical, 11) }}>Critical: {critical} carries destructive actions.</p>
          </ui-card>
        </div>
      </ui-panel>
    </div>
  );
}

const SAMPLES: Record<TypeRoleName, string> = {
  'display': 'Control Foundation',
  'heading-1': 'One unit, many tiers',
  'heading-2': 'Margins and gutters',
  'heading-3': 'Tiers, radii and nesting',
  'section-kicker': 'Section kicker',
  'group-kicker': 'Group kicker',
  'body-large': 'Every dimension in the control is a multiple of one unit, an eighth of the control height.',
  'body': 'Container margins stay fixed in u, while internal gutters follow the content and controls respond to size.',
  'caption': 'Line heights round up to the rhythm unit, so stacked text stays on the grid.',
  'code': 'const u = height / 8;\nconst font = 10 + u;',
  'control': 'Continue',
  'label': 'Email address',
  'control-small': 'Details',
};
const fmt = (n: number) => String(Math.round(n * 100) / 100);

function Typography({ params, voices, faces }: { params: ThemeParams; voices: VoiceMap; faces: FaceMap }) {
  const opts = { unit: params.unit, ratio: params['type-ratio'], rhythm: params['type-rhythm'], voices, faces };
  const grid = params['type-rhythm'] * params.unit;
  return (
    <>
      <header className={header}>
        <h1 className={pageTitle}>Typography</h1>
        <p className={lead}>Roles from massimo-ui on the u ramp: size = (10px + u) × ratio^step, or n·u for caption, code and small controls; line heights round up to the rhythm. Unit {fmt(params.unit)}px · ratio {params['type-ratio']} · rhythm {grid ? `${fmt(grid)}px` : 'none'}.</p>
      </header>
      <Divider />
      <Section id="voices" title="Faces and voices" note="Faces are the stacks; voices say what text is for; roles point at voices. Repoint a voice with data-font-<voice>=&quot;<face>&quot;.">
        {VOICES.map((v) => (
          <Row key={v} label={v}>
            <span className={metrics}>→ {voices[v]}</span>
            <span style={{ fontFamily: `var(--font-voice-${v}, var(--fonts-${voices[v]}))`, fontSize: '1.5em', fontVariantNumeric: v === 'numeric' ? 'tabular-nums lining-nums' : undefined }}>{v === 'numeric' ? '1,284.07 · 62%' : v === 'code' ? 'const u = 4;' : 'Hamburgefonstiv 0123'}</span>
          </Row>
        ))}
      </Section>
      <Divider />
      <Section id="roles" title="Roles" note={'Each specimen uses data-type="<role>" (or textStyle in Panda). Metrics come from the resolver for the current settings.'}>
        {(Object.keys(TYPE_ROLES) as TypeRoleName[]).map((role) => {
          const t = resolveType(role, opts);
          const r = TYPE_ROLES[role];
          return (
            <div key={role} className={typeRow}>
              <div className={typeMeta}>
                <span className={rowLabel}>{r.label}</span>
                <span className={metrics}>{role}</span>
                <span className={metrics}>{'u' in r ? `${r.u}u` : `step ${r.step}`} · {fmt(t.size)}px / {t.lineHeightRatio ?? `${fmt(t.lineHeight)}px`}</span>
                <span className={metrics}>{t.voice} → {t.face} · {t.weight}{t.tracking ? ` · ${t.tracking}em` : ''}{t.transform !== 'none' ? ' · upper' : ''}</span>
              </div>
              <div data-type={role} className={role === 'code' ? codeSample : rhythmSample} style={grid && !t.lineHeightRatio ? { backgroundSize: `100% ${grid}px` } : undefined}>{SAMPLES[role]}</div>
            </div>
          );
        })}
      </Section>
      <Divider />
      <Section id="article" title="In context" note="A short article set entirely with the roles.">
        <article className={article}>
          <span data-type="section-kicker">Field notes</span>
          <h2 data-type="heading-1">A system you can hold in one line</h2>
          <p data-type="body-large">Everything is u. A control is eight of them; its label is ten pixels plus one.</p>
          <h3 data-type="heading-3">Why the base moves with u</h3>
          <p data-type="body">Text set on the control font scales with every size step, so a compact panel and a spacious one keep the same proportions between headings, body and controls.</p>
          <p data-type="caption">Figures are illustrative.</p>
          <pre data-type="code">{SAMPLES.code}</pre>
        </article>
      </Section>
    </>
  );
}

const f2 = (n: number) => (Number.isFinite(n) ? n.toFixed(2) : '–');
const f1 = (n: number) => (Number.isFinite(n) ? n.toFixed(1) : '–');

function EngineSummary({ spectrum }: { spectrum: SpectrumPayload }) {
  const d = spectrum.diagnostics;
  return (
    <p className={summary}>
      T* <b>{f2(d.peakTone)}</b> · C* <b>{f2(d.peakChroma)}</b>, limited by {d.limitedBy} · {d.target === 'display-p3' ? 'Display P3' : 'sRGB'} · {d.primary.name} Lc 11/12: light <b>{f1(d.primary.light.r11)}/{f1(d.primary.light.r12)}</b>, dark <b>{f1(d.primary.dark.r11)}/{f1(d.primary.dark.r12)}</b> · {spectrum.ms} ms
    </p>
  );
}

const W = 560, PAD = 28;
function QuadratureChart({ d, primary }: { d: SpectrumPayload['diagnostics']; primary: string }) {
  const top = 70, bottom = 170, xH = (H: number) => PAD + (H / 400) * (W - 2 * PAD), xh = (h: number) => PAD + (h / 360) * (W - 2 * PAD);
  return (
    <svg viewBox={`0 0 ${W} 210`} className={chartSvg} role="img" aria-label={`Hue quadrature of ${d.accents.length} accents`}>
      <text x={PAD} y={22} className={chartLabel}>H · hue quadrature</text>
      <text x={PAD} y={204} className={chartLabel}>h · hue angle (°)</text>
      <line x1={PAD} x2={W - PAD} y1={top} y2={top} className={axis} />
      <line x1={PAD} x2={W - PAD} y1={bottom} y2={bottom} className={axis} />
      {UNIQUE.map((u) => (
        <g key={u.name}>
          <line x1={xH(u.H)} y1={top} x2={xh(u.h)} y2={bottom} className={dashed} />
          <text x={xH(u.H) + 3} y={top + 14} className={chartTick}>{u.name} {u.H}</text>
          <text x={xh(u.h) + 3} y={bottom + 14} className={chartTick}>{u.h}</text>
        </g>
      ))}
      {d.accents.map((a, i) => {
        const strong = a.name === primary;
        return (
          <g key={a.name}>
            <line x1={xH(a.H)} y1={top} x2={xh(a.h)} y2={bottom} stroke={a.color} strokeWidth={strong ? 3 : 1.5} />
            <circle cx={xH(a.H)} cy={top} r={strong ? 5 : 3.5} fill={a.color} />
            <circle cx={xh(a.h)} cy={bottom} r={strong ? 5 : 3.5} fill={a.color} />
            <text x={xH(a.H)} y={top - 10 - (i % 2) * 11} textAnchor="middle" className={chartTick}>{a.name}</text>
          </g>
        );
      })}
    </svg>
  );
}

function ChromaChart({ d }: { d: SpectrumPayload['diagnostics'] }) {
  const H = 230, L = 34, R = W - 12, T = 14, B = H - 24;
  const maxC = Math.ceil(Math.max(...d.accents.flatMap((a) => a.curve.map(([, c]) => c))) / 20) * 20;
  const x = (t: number) => L + ((t - d.tones[0]) / (d.tones[1] - d.tones[0])) * (R - L), y = (c: number) => B - (c / maxC) * (B - T);
  const path = (pts: [number, number][]) => pts.map(([t, c], i) => `${i ? 'L' : 'M'}${x(t).toFixed(1)},${y(c).toFixed(1)}`).join('');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={chartSvg} role="img" aria-label={`Max in-gamut chroma by tone; peak tone ${f2(d.peakTone)}, chroma ${f2(d.peakChroma)}`}>
      {Array.from({ length: maxC / 20 + 1 }, (_, i) => i * 20).map((c) => (
        <g key={c}><line x1={L} x2={R} y1={y(c)} y2={y(c)} className={grid} /><text x={L - 6} y={y(c) + 3} textAnchor="end" className={chartTick}>{c}</text></g>
      ))}
      {Array.from({ length: 8 }, (_, i) => 20 + i * 10).map((t) => <text key={t} x={x(t)} y={H - 8} textAnchor="middle" className={chartTick}>{t}</text>)}
      {d.accents.map((a) => <path key={a.name} d={path(a.curve)} fill="none" stroke={a.color} strokeWidth={1.5} />)}
      <path d={path(d.weakest)} fill="none" stroke="currentColor" strokeWidth={3} />
      <line x1={x(d.peakTone)} x2={x(d.peakTone)} y1={T} y2={B} className={dashed} />
      <line x1={L} x2={R} y1={y(d.peakChroma)} y2={y(d.peakChroma)} className={dashed} />
      <circle cx={x(d.peakTone)} cy={y(d.peakChroma)} r={4} fill="currentColor" />
      <text x={x(d.peakTone) + 5} y={T + 10} className={chartTick}>T* {f2(d.peakTone)}</text>
      <text x={L + 4} y={y(d.peakChroma) - 5} className={chartTick}>C* {f2(d.peakChroma)}</text>
    </svg>
  );
}

function Colors({ spectrum }: { spectrum?: SpectrumPayload }) {
  if (!spectrum) return <p className={lead}>Generating colors…</p>;
  const r = spectrum.roles;
  return (
    <>
      <header className={header}>
        <h1 className={pageTitle}>Colors</h1>
        <p className={lead}>Spectrum: HCT-generated 12-step ramps, separate for light and dark. Roles map onto the kit: primary {r.primary}, neutral {r.neutral}, critical {r.critical}.</p>
      </header>
      <Divider />
      <Section id="context" title="Color in context" note="Two synthetic settings for reviewing the active palette: primary as material and accent as punctuation, then neutral surfaces with primary actions and semantic feedback. Content and figures are illustrative.">
        <ColorInContext spectrum={spectrum} />
      </Section>
      <Divider />
      <Section id="engine" title="Hue and chroma" note="What shaped this generation: where each accent sits in hue quadrature, and how much chroma each hue can hold at each tone in the target gamut.">
        <EngineSummary spectrum={spectrum} />
        <div className={chartGrid}>
          <figure className={chartFig}><QuadratureChart d={spectrum.diagnostics} primary={r.primary} /><figcaption className={caption}>Even steps in quadrature H (top) land at uneven hue angles h (bottom). Dashed lines mark unique red, yellow, green and blue.</figcaption></figure>
          <figure className={chartFig}><ChromaChart d={spectrum.diagnostics} /><figcaption className={caption}>Max in-gamut chroma per accent by tone. The bold curve is the weakest hue at each tone; T* is its peak, where the shared chroma C* is set.</figcaption></figure>
        </div>
      </Section>
      <Divider />
      <Section id="ramps" title="Ramps" note="Steps 1–2 backgrounds, 3–5 interactive, 6–8 borders, 9–10 solids, 11–12 text. Light left, dark right.">
        {spectrum.families.map((f) => (
          <div key={f.name} className={rampRow}>
            <span className={rowLabel}>{f.name}{[r.primary, r.neutral, r.critical].includes(f.name) ? ' ●' : ''}</span>
            <ui-palette label={`${f.name} light`} className={ramp}>{f.light.map((c, i) => <ui-swatch key={i} color={c} label={`${f.name} ${i + 1} light`} />)}</ui-palette>
            <ui-palette label={`${f.name} dark`} className={ramp}>{f.dark.map((c, i) => <ui-swatch key={i} color={c} label={`${f.name} ${i + 1} dark`} />)}</ui-palette>
          </div>
        ))}
      </Section>
    </>
  );
}

