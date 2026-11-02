// The canvas document: a sample prototype rendered with both component flavors.
// It owns no theme state; the studio sends parameters and they land on <html>.
import '../index.css';
import '@massimo/ui-kit/components/button/element';
import '@massimo/ui-kit/components/input/element';
import '@massimo/ui-kit/components/listbox/element';
import '@massimo/ui-kit/components/select/element';
import '@massimo/ui-kit/components/btg/element';
import { ICON_SET_NAME } from '@massimo/ui-kit/icons';
import '../icons.ts';
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button } from '@massimo/ui-kit/components/button/react';
import { Input } from '@massimo/ui-kit/components/input/react';
import { paramVar, validateTheme, type ParamName } from '@massimo/ui-kit/tokens';
import { css } from '../../styled-system/css/index.js';
import { page as pageLayout } from '../../styled-system/patterns/index.js';
import { listen, post } from '../protocol.ts';

const root = document.documentElement;
listen(() => parent, (m) => {
  if (m.type !== 'studio/theme') return;
  const v = validateTheme('live', m.params);
  if (!v.ok) return console.warn('canvas: rejected theme', v.error);
  for (const [k, val] of Object.entries(v.params)) root.style.setProperty(paramVar(k as ParamName), String(val));
  // Explicit scheme from the studio; without a message the canvas follows the host preference.
  root.classList.toggle('dark', m.dark);
  root.classList.toggle('light', !m.dark);
  if (ICON_SET_NAME.test(m.icons)) root.setAttribute('data-icons', m.icons);
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
const columns = css({ display: 'grid', gridTemplateColumns: { base: '1fr', md: '1fr 1fr' }, gap: '8', alignItems: 'start' });
const column = css({ display: 'flex', flexDirection: 'column', gap: '4' });
const subTitle = css({ textStyle: 'title' });
const stack = css({ display: 'flex', flexDirection: 'column', gap: '4' });
const avatar = css({ display: 'block', bg: 'accent.solid' });

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

function Canvas() {
  const [status, setStatus] = useState('');
  return (
    <main className={shell} id="page">
      <header className={header}>
        <h1 className={pageTitle}>ui-kit specimens</h1>
        <p className={lead}>Every component at its default theme. Sizes are the unit u (control height 8u); the studio panel changes the theme live.</p>
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
      <Section id="fields" title="Fields" note="Web components use no native form elements; React renders native inputs. Errors appear after interaction or a submit attempt.">
        <div className={columns}>
          <form className={column} onSubmit={(e) => { e.preventDefault(); setStatus(JSON.stringify(Object.fromEntries(new FormData(e.currentTarget)))); }}>
            <h3 className={subTitle}>Web components</h3>
            <ui-input name="email" type="email" required label="Email" placeholder="you@example.com" description="We never share it." />
            <ui-input name="password" type="password" required minlength={12} label="Password" value="hunter2" />
            <ui-input name="team" label="Team" error="That name is taken." value="Acme" />
            <div className={specimens}>
              <ui-button type="submit">Create account</ui-button>
              <ui-button type="reset">Reset</ui-button>
            </div>
            <p className={caption} role="status">{status}</p>
          </form>
          <div className={column}>
            <h3 className={subTitle}>React</h3>
            <Input label="Email" placeholder="you@example.com" description="We never share it." />
            <Input label="Password" type="password" error="At least 12 characters." />
            <Input label="Team" defaultValue="Acme" />
            <div className={specimens}>
              <Button leading={<i name="plus" />}>Create account</Button>
              <Button>Reset</Button>
            </div>
          </div>
        </div>
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
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<Canvas />);
