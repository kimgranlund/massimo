// The canvas document: a sample prototype rendered with both component flavors.
// It owns no theme state; the studio sends parameters and they land on <html>.
import '../index.css';
import '@massimo/ui-kit/components/button/element';
import '@massimo/ui-kit/components/input/element';
import '@massimo/ui-kit/components/listbox/element';
import '@massimo/ui-kit/components/select/element';
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Button } from '@massimo/ui-kit/components/button/react';
import { Input } from '@massimo/ui-kit/components/input/react';
import { paramVar, validateTheme, type ParamName } from '@massimo/ui-kit/tokens';
import { css } from '../../styled-system/css/index.js';
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
});
post(parent, { type: 'studio/ready' });

const page = css({ minHeight: '100dvh', bg: 'bg.subtle', padding: '10', display: 'grid', gap: '8', gridTemplateColumns: { base: '1fr', md: '1fr 1fr' }, alignContent: 'start' });
const card = css({ bg: 'bg', borderWidth: 'thin', borderColor: 'border', borderRadius: 'xl', padding: '6', display: 'flex', flexDirection: 'column', gap: '4' });
const eyebrow = css({ textStyle: 'caption', color: 'fg.muted', textTransform: 'uppercase', letterSpacing: 'wide' });
const title = css({ textStyle: 'heading' });
const form = css({ display: 'flex', flexDirection: 'column', gap: '4' });
const row = css({ display: 'flex', gap: '2', flexWrap: 'wrap', alignItems: 'center' });

function Canvas() {
  const [status, setStatus] = useState('');
  return (
    <main className={page}>
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
            <ui-segmented name="size-sm" value="a" data-size="sm"><ui-option value="a">Small</ui-option><ui-option>B</ui-option></ui-segmented>
            <ui-button data-size="sm">Small</ui-button>
            <ui-button data-size="lg">Large</ui-button>
            <ui-segmented name="size-lg" value="a" data-size="lg"><ui-option value="a">Large</ui-option><ui-option>B</ui-option></ui-segmented>
          </div>
          <ui-segmented name="plan" value="monthly" label="Billing">
            <ui-option value="monthly">Monthly</ui-option>
            <ui-option value="yearly">Yearly</ui-option>
          </ui-segmented>
          <ui-listbox name="region" value="eu" label="Region">
            <ui-option value="us">United States</ui-option>
            <ui-option value="eu">Europe</ui-option>
            <ui-option value="apac">Asia Pacific</ui-option>
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
      <section className={card} aria-labelledby="react-title">
        <p className={eyebrow}>React</p>
        <h1 id="react-title" className={title}>Create your account</h1>
        <Input label="Email" placeholder="you@example.com" description="We never share it." />
        <Input label="Password" type="password" error="At least 12 characters." />
        <div className={row}>
          <Button>Create account</Button>
          <Button>Sign in</Button>
          <Button>Help</Button>
          <Button>Delete</Button>
          <Button loading>Saving</Button>
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<Canvas />);
