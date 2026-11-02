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

// The page container level (8u padding and gap) via the page() pattern; the grid sits inside it.
const shell = pageLayout({ width: '80rem' });
const page = css({ display: 'grid', gap: 'inherit', gridTemplateColumns: { base: '1fr', md: '1fr 1fr' }, alignContent: 'start' });
const card = css({ bg: 'bg', borderWidth: 'thin', borderColor: 'border', borderRadius: 'xl', padding: '6', display: 'flex', flexDirection: 'column', gap: '4' });
const eyebrow = css({ textStyle: 'caption', color: 'fg.muted', textTransform: 'uppercase', letterSpacing: 'wide' });
const title = css({ textStyle: 'heading' });
const form = css({ display: 'flex', flexDirection: 'column', gap: '4' });
const avatar = css({ display: 'block', bg: 'accent.solid' });

const row = css({ display: 'flex', gap: '2', flexWrap: 'wrap', alignItems: 'center' });

function Canvas() {
  const [status, setStatus] = useState('');
  return (
    <main className={shell} id="page">
      <div className={page}>
      <section className={card} aria-labelledby="wc-title">
        <p className={eyebrow}>Web components</p>
        <h1 id="wc-title" className={title}>Create your account</h1>
        <form className={form} onSubmit={(e) => { e.preventDefault(); setStatus(JSON.stringify(Object.fromEntries(new FormData(e.currentTarget)))); }}>
          <ui-input name="email" type="email" required label="Email" placeholder="you@example.com" description="We never share it." />
          <ui-input name="password" type="password" required minlength={12} label="Password" value="hunter2" />
          <ui-input name="team" label="Team" error="That name is taken." value="Acme" />
          <ui-select name="role" label="Role" required description="You can change this later.">
            <ui-option value="design">Designer</ui-option>
            <ui-option value="eng">Engineer</ui-option>
            <ui-option value="pm" disabled>Product manager</ui-option>
            <ui-option value="research">Researcher</ui-option>
          </ui-select>
          <div className={row}>
            <ui-button data-size="3"><i slot="leading" name="plus" />Add</ui-button>
            <ui-button><i slot="leading" name="plus" />Add item</ui-button>
            <ui-button data-size="4.5">Next<i slot="trailing" name="arrow-right" /></ui-button>
            <ui-button aria-label="Add"><i slot="leading" name="plus" /></ui-button>
            <ui-button icon-size="fill"><span slot="leading" className={avatar} />Kim</ui-button>
            <ui-button icon-size="lg"><i slot="leading" name="plus" />Large icon</ui-button>
          </div>
          {['3', '4', '4.5'].map((u) => (
            <div key={u} className={row} data-size={u}>
              <ui-badge>3</ui-badge>
              <ui-badge>New</ui-badge>
              <ui-tag><i slot="leading" name="star" />Featured</ui-tag>
              <ui-chip selectable selected><i slot="leading" name="check" />Design</ui-chip>
              <ui-chip selectable>Engineering</ui-chip>
              <ui-chip removable>Remote</ui-chip>
              <ui-button>Control</ui-button>
            </div>
          ))}
          <ui-segmented name="plan" value="monthly" label="Billing">
            <ui-option value="monthly">Monthly</ui-option>
            <ui-option value="yearly">Yearly</ui-option>
          </ui-segmented>
          <ui-listbox name="region" value="eu" label="Region">
            <ui-option value="us"><i slot="leading" name="globe" />United States</ui-option>
            <ui-option value="eu"><i slot="leading" name="globe" />Europe</ui-option>
            <ui-option value="apac"><i slot="leading" name="globe" />Asia Pacific</ui-option>
          </ui-listbox>
          <div className={row}>
            <ui-button type="submit">Create account</ui-button>
            <ui-button type="reset">Reset</ui-button>
            <ui-button>Help</ui-button>
            <ui-button>Delete</ui-button>
            <ui-button loading>Saving</ui-button>
          </div>
          <p className={eyebrow} role="status">{status}</p>
        </form>
      </section>
      <ui-panel aria-label="Containers">
        <p className={eyebrow}>Containers: panel 6u › card 4u › tile 3u › group 1u</p>
        <ui-card>
          <h2 className={title}>Team</h2>
          <ui-collection gap="1">
            {['Ada', 'Grace', 'Linus'].map((n) => <ui-tile key={n}>{n}<ui-group><ui-button>Message</ui-button><ui-button><i slot="leading" name="dots-three" /></ui-button></ui-group></ui-tile>)}
          </ui-collection>
        </ui-card>
        <ui-card data-size="3" gap="2">
          <strong>Compact card (size 3, gap 2)</strong>
          <ui-group><ui-button>Save</ui-button><ui-button>Cancel</ui-button></ui-group>
        </ui-card>
      </ui-panel>
      <section className={card} aria-labelledby="react-title">
        <p className={eyebrow}>React</p>
        <h1 id="react-title" className={title}>Create your account</h1>
        <Input label="Email" placeholder="you@example.com" description="We never share it." />
        <Input label="Password" type="password" error="At least 12 characters." />
        <div className={row}>
          <Button leading={<i name="plus" />}>Create account</Button>
          <Button>Sign in</Button>
          <Button>Help</Button>
          <Button>Delete</Button>
          <Button loading>Saving</Button>
        </div>
      </section>
      </div>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<Canvas />);
