// The canvas document: a sample prototype rendered with both component flavors.
// It owns no theme state; the studio sends parameters and they land on <html>.
import '../index.css';
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
import { ICON_SET_NAME } from '@massimo/ui-kit/icons';
import '../icons.ts';
import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { paramVar, validateTheme, type ParamName } from '@massimo/ui-kit/tokens';
import { css } from '../../styled-system/css/index.js';
import { page as pageLayout } from '../../styled-system/patterns/index.js';
import { listen, post, type SpectrumPayload, type View } from '../protocol.ts';

const root = document.documentElement;
const spectrumStyle = Object.assign(document.createElement('style'), { id: 'spectrum' });
document.head.append(spectrumStyle);

// Latest view and palette from the studio; React subscribes below.
let current: { view: View; spectrum?: SpectrumPayload } = { view: 'components' };
const subscribers = new Set<() => void>();

listen(() => parent, (m) => {
  if (m.type !== 'studio/theme') return;
  const v = validateTheme('live', m.params);
  if (!v.ok) return console.warn('canvas: rejected theme', v.error);
  for (const [k, val] of Object.entries(v.params)) root.style.setProperty(paramVar(k as ParamName), String(val));
  // Explicit scheme from the studio; "auto" follows the host preference.
  root.classList.toggle('dark', m.scheme === 'dark');
  root.classList.toggle('light', m.scheme === 'light');
  if (ICON_SET_NAME.test(m.icons)) root.setAttribute('data-icons', m.icons);
  // Generated in the studio's worker by the kit's spectrumCSS; plain custom-property blocks.
  if (m.spectrum && spectrumStyle.textContent !== m.spectrum.css) spectrumStyle.textContent = m.spectrum.css;
  current = { view: m.view, spectrum: m.spectrum };
  subscribers.forEach((f) => f());
});
post(parent, { type: 'studio/ready' });

// Specimen layout: the page container (8u padding and gap) holds titled sections split by
// dividers. Each section is a list of labelled rows: label on the left, specimens on the right.
const shell = pageLayout({ width: '80rem' });
const header = css({ display: 'flex', flexDirection: 'column', gap: '1' });
const pageTitle = css({ textStyle: 'display' });
const lead = css({ color: 'fg.muted', maxWidth: '60ch' });
const divider = css({ borderTopWidth: 'thin', borderColor: 'border', width: '100%' });
const section = css({ display: 'flex', flexDirection: 'column', gap: '5' });
const sectionHead = css({ display: 'flex', flexDirection: 'column', gap: '1' });
const sectionTitle = css({ textStyle: 'heading' });
const caption = css({ textStyle: 'caption', color: 'fg.muted' });
const rowGrid = css({ display: 'grid', gridTemplateColumns: { base: '1fr', md: '11rem 1fr' }, gap: { base: '2', md: '6' }, alignItems: 'center' });
const rowLabel = css({ textStyle: 'label', color: 'fg.muted' });
const specimens = css({ display: 'flex', gap: '2', flexWrap: 'wrap', alignItems: 'center' });
const formGrid = css({ display: 'grid', gridTemplateColumns: { base: '1fr', md: '1fr 1fr' }, gap: '4', alignItems: 'start' });
const columns = css({ display: 'grid', gridTemplateColumns: { base: '1fr', md: '1fr 1fr' }, gap: '8', alignItems: 'start' });
const subTitle = css({ textStyle: 'title' });
const stack = css({ display: 'flex', flexDirection: 'column', gap: '4' });
const avatar = css({ display: 'block', bg: 'accent.solid' });
const media = css({ width: '100%', maxWidth: '40rem', borderRadius: 'xl', overflow: 'hidden' });
const formats = css({ display: 'flex', gap: '3', flexWrap: 'wrap', alignItems: 'end' });
const figure = css({ display: 'flex', flexDirection: 'column', gap: '1', width: '8rem' });
const levelBox = css({ bg: 'accent.subtle', alignSelf: 'start' });
const levelChild = css({ display: 'block', bg: 'bg', minWidth: '10', minHeight: '6', borderRadius: 'sm' });
const rampRow = css({ display: 'grid', gridTemplateColumns: { base: '1fr', md: '7rem 1fr 1fr' }, gap: '3', alignItems: 'center' });
const ramp = css({ width: '100%' });
const trackBox = css({ width: '12rem' });
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

function useStudio() {
  const [state, setState] = useState(current);
  useEffect(() => { const f = () => setState(current); subscribers.add(f); return () => { subscribers.delete(f); }; }, []);
  return state;
}

// Sample images as inline SVG gradients (no network).
const art = (a: string, b: string, label: string) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="800" height="600" fill="url(#g)"/><text x="40" y="560" font-family="system-ui" font-size="48" fill="white" fill-opacity=".85">${label}</text></svg>`)}`;
const IMAGES = [art('#4f46e5', '#06b6d4', 'Dawn'), art('#f97316', '#db2777', 'Dusk'), art('#16a34a', '#0ea5e9', 'Coast'), art('#1e293b', '#7c3aed', 'Night')];

function Canvas() {
  const { view, spectrum } = useStudio();
  return (
    <main className={shell} id="page">
      {view === 'components' && <Components />}
      {view === 'containers' && <Containers />}
      {view === 'colors' && <Colors spectrum={spectrum} />}
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
      <Section id="roles" title="Roles in use" note="The components below are colored by the selected role families.">
        <Row label="Preview">
          <ui-button><i slot="leading" name="plus" />Action</ui-button>
          <ui-chip selectable selected>Selected</ui-chip>
          <ui-badge>3</ui-badge>
          <ui-switch checked>On</ui-switch>
          <ui-checkbox checked>Checked</ui-checkbox>
          <div className={trackBox}><ui-range label="Level" value={60} /></div>
        </Row>
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

createRoot(document.getElementById('root')!).render(<Canvas />);
