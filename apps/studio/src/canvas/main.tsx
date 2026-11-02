// The canvas document: a sample prototype rendered with both component flavors.
// It owns no theme state; the studio sends parameters and they land on <html>.
import '../index.css';
import '@massimo/ui-kit/components/button/element';
import '@massimo/ui-kit/components/input/element';
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
  root.classList.toggle('dark', m.dark);
});
post(parent, { type: 'studio/ready' });

const page = css({ minHeight: '100dvh', bg: 'bg.subtle', padding: '10', display: 'grid', gap: '8', gridTemplateColumns: { base: '1fr', md: '1fr 1fr' }, alignContent: 'start' });
const card = css({ bg: 'bg', borderWidth: 'thin', borderColor: 'border', borderRadius: 'xl', padding: '6', display: 'flex', flexDirection: 'column', gap: '4' });
const eyebrow = css({ textStyle: 'caption', color: 'fg.muted', textTransform: 'uppercase', letterSpacing: 'wide' });
const title = css({ textStyle: 'heading' });
const row = css({ display: 'flex', gap: '2', flexWrap: 'wrap', alignItems: 'center' });

function Canvas() {
  return (
    <main className={page}>
      <section className={card} aria-labelledby="wc-title">
        <p className={eyebrow}>Web components</p>
        <h1 id="wc-title" className={title}>Create your account</h1>
        <ui-input label="Email" placeholder="you@example.com" description="We never share it." />
        <ui-input label="Password" type="password" error="At least 12 characters." />
        <div className={row}>
          <ui-button>Create account</ui-button>
          <ui-button variant="outline">Sign in</ui-button>
          <ui-button variant="ghost">Help</ui-button>
          <ui-button variant="danger" size="sm">Delete</ui-button>
          <ui-button loading>Saving</ui-button>
        </div>
      </section>
      <section className={card} aria-labelledby="react-title">
        <p className={eyebrow}>React</p>
        <h1 id="react-title" className={title}>Create your account</h1>
        <Input label="Email" placeholder="you@example.com" description="We never share it." />
        <Input label="Password" type="password" error="At least 12 characters." />
        <div className={row}>
          <Button>Create account</Button>
          <Button variant="outline">Sign in</Button>
          <Button variant="ghost">Help</Button>
          <Button variant="danger" size="sm">Delete</Button>
          <Button loading>Saving</Button>
        </div>
      </section>
    </main>
  );
}

createRoot(document.getElementById('root')!).render(<Canvas />);
