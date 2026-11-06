// Theming: a few brand inputs through the real color engine. The engine is large, so it loads with
// this page and runs after the inputs pause. The preview takes the generated CSS in a scope of its own.
import { useEffect, useRef, useState } from 'react';
import { css } from '../../styled-system/css/index.js';
import { Page, s, Section } from './pages.tsx';
import { useEvent } from '../wc.ts';

const SCOPE = '[data-theming-preview]';
const local = {
  bar: css({ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(11rem, 1fr))', gap: '3', padding: '4', borderRadius: 'lg', bg: 'bg.subtle' }),
  field: css({ display: 'flex', flexDirection: 'column', gap: '1', textStyle: 'label' }),
  preview: css({ display: 'flex', flexDirection: 'column', gap: '4', padding: '6', borderRadius: 'lg', bg: 'bg', color: 'fg', minWidth: '0' }),
  row: css({ display: 'flex', flexWrap: 'wrap', gap: '2', alignItems: 'center' }),
  ramp: css({ display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', borderRadius: 'md', overflow: 'hidden', minHeight: '8' }),
  ramps: css({ display: 'flex', flexDirection: 'column', gap: '2' }),
  error: css({ textStyle: 'body-sm', color: 'critical.fg' }),
};

interface Inputs { primary: string; tint: string; gamut: string; ground: string; ink: string }
const START: Inputs = { primary: '#3f5be0', tint: '75', gamut: 'display-p3', ground: '', ink: '' };
const HEX = /^#[0-9a-f]{6}$/i;

function Text({ label, value, onValue }: { label: string; value: string; onValue: (v: string) => void }) {
  const ref = useEvent('input', (el) => onValue(String(el.value ?? '')));
  return <ui-input ref={ref} label={label} value={value} placeholder="#rrggbb" />;
}
function Pick({ label, value, options, onValue }: { label: string; value: string; options: [string, string][]; onValue: (v: string) => void }) {
  const ref = useEvent('change', (_el, d) => onValue(d.value));
  return <div className={local.field}><span>{label}</span><ui-select ref={ref} label={label} hide-label="" value={value}>{options.map(([v, l]) => <ui-option key={v} value={v}>{l}</ui-option>)}</ui-select></div>;
}

function useTheme(inputs: Inputs) {
  const [cssText, setCss] = useState('');
  const [ms, setMs] = useState<number>();
  const run = useRef(0);
  useEffect(() => {
    if (!HEX.test(inputs.primary) || [inputs.ground, inputs.ink].some((v) => v && !HEX.test(v))) return;
    const id = ++run.current;
    const timer = setTimeout(async () => {
      const { anchoredSpectrum, generateSpectrum, resolveRoles, spectrumCSS } = await import('@massimo/ui-kit/spectrum');
      if (id !== run.current) return;
      const start = performance.now();
      const data = generateSpectrum({ tint: Number(inputs.tint), target: inputs.gamut });
      const anchors = [{ role: 'primary', value: inputs.primary }, ...(inputs.ground ? [{ role: 'ground', value: inputs.ground }] : []), ...(inputs.ink ? [{ role: 'ink', value: inputs.ink }] : [])] as Parameters<typeof anchoredSpectrum>[2];
      const a = anchoredSpectrum(data, resolveRoles(data, {}), anchors);
      setCss(spectrumCSS(a.data, a.roles, SCOPE, a.solidSteps));
      setMs(Math.round(performance.now() - start));
    }, 250);
    return () => clearTimeout(timer);
  }, [inputs]);
  return { cssText, ms };
}

export function Theming() {
  const [inputs, setInputs] = useState(START);
  const set = <K extends keyof Inputs>(k: K) => (v: Inputs[K]) => setInputs((x) => ({ ...x, [k]: v }));
  const { cssText, ms } = useTheme(inputs);
  const bad = !HEX.test(inputs.primary);
  const brand = { color: { anchors: [{ name: 'Primary', value: inputs.primary, role: 'primary' }, ...(inputs.ground ? [{ name: 'Page', value: inputs.ground, role: 'ground' }] : []), ...(inputs.ink ? [{ name: 'Ink', value: inputs.ink, role: 'ink' }] : [])] } };
  return (
    <Page title="A brand is a few inputs" lead="Give it a primary color, a neutral tint and a gamut, and optionally pin the page and ink. The engine builds every ramp, maps every role and picks each solid's text. Components never change.">
      <Section title="Try it">
        <div className={local.bar} role="group" aria-label="Brand inputs">
          <Text label="Primary" value={inputs.primary} onValue={set('primary')} />
          <Text label="Page color" value={inputs.ground} onValue={set('ground')} />
          <Text label="Ink color" value={inputs.ink} onValue={set('ink')} />
          <Pick label="Neutral tint" value={inputs.tint} options={[['0', 'None'], ['25', 'Subtle'], ['75', 'Tinted'], ['100', 'Strong']]} onValue={set('tint')} />
          <Pick label="Gamut" value={inputs.gamut} options={[['display-p3', 'Display P3'], ['srgb', 'sRGB']]} onValue={set('gamut')} />
        </div>
        {bad && <p className={local.error}>Enter the primary as a six-digit hex color.</p>}
        <style>{cssText}</style>
        <div className={local.preview} data-theming-preview="" data-theme-ready={cssText ? '' : undefined}>
          <div className={local.row}>
            <ui-button variant="primary">Publish</ui-button><ui-button>Preview</ui-button><ui-badge>New</ui-badge>
          </div>
          <ui-container preset="card" padding="md"><ui-section><strong>Release 2.4</strong><span>Ships the new editor and faster sync.</span></ui-section></ui-container>
          <div className={local.ramps}>
            {(['primary', 'secondary', 'neutral'] as const).map((role) => (
              <div key={role} className={local.ramp} role="img" aria-label={`${role} ramp`}>
                {Array.from({ length: 12 }, (_, i) => <span key={i} style={{ background: `var(--colors-${role}-${i + 1})` }} />)}
              </div>
            ))}
          </div>
        </div>
        {ms !== undefined && <p className={s.body}>Generated in {ms}ms by the same engine that builds every reference brand.</p>}
      </Section>
      <Section title="As a brand file">
        <p className={s.body}>These inputs are part of a <code className={s.inline}>brand.json</code>. A full brand also names its frame, type and form, and the build turns it into a theme.</p>
        <pre className={s.code} tabIndex={0}><code>{JSON.stringify(brand, null, 2)}</code></pre>
      </Section>
    </Page>
  );
}
