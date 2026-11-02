// Studio jig: built entirely from ui-kit components. Tabs switch the panel and the canvas
// between Components, Containers and Colors; Copy hands the applied settings to an agent as JSON.
import { useEffect, useRef, useState } from 'react';
import '@massimo/ui-kit/components/button/element';
import '@massimo/ui-kit/components/input/element';
import '@massimo/ui-kit/components/select/element';
import '@massimo/ui-kit/components/listbox/element';
import '@massimo/ui-kit/components/choice/element';
import '@massimo/ui-kit/components/range/element';
import { PARAMS, defaultParams, diffFromDefaults, savedThemes, THEME_NAME, type ParamName, type ThemeParams } from '@massimo/ui-kit/tokens';
import { SPECTRUM_DEFAULTS, spectrumOverrides, type SpectrumSettings } from '@massimo/ui-kit/spectrum';
import { listen, post, type Scheme, type SpectrumPayload, type View } from '../protocol.ts';
import { STUDIO_ICON_SETS } from '../icons.ts';
import { Group, Range, Segmented, Select, Switch, useEvent } from './wc.tsx';
import { buildSpectrum } from './spectrum.ts';
import * as s from './styles.ts';

// Geometry knobs shown in the panel (the old kit color sliders are superseded by Spectrum).
const GEOMETRY: ParamName[] = ['unit', 'border', 'radius-scale', 'corner-shape'];
const DEFAULT_ROLES = { primary: 'indigo', neutral: 'neutral', critical: 'red' };

export function App() {
  const frame = useRef<HTMLIFrameElement>(null);
  // The selected tab survives reloads (per-browser convenience; storage may be unavailable).
  const [view, setView] = useState<View>(() => {
    try { const v = localStorage.getItem('studio:view'); if (v === 'components' || v === 'containers' || v === 'colors') return v; } catch { /* no storage */ }
    return 'components';
  });
  useEffect(() => { try { localStorage.setItem('studio:view', view); } catch { /* no storage */ } }, [view]);
  const [params, setParams] = useState<ThemeParams>(defaultParams);
  const [scheme, setScheme] = useState<Scheme>('auto');
  const [icons, setIcons] = useState('phosphor');
  const [spectrum, setSpectrum] = useState<SpectrumSettings>(SPECTRUM_DEFAULTS);
  const [roles, setRoles] = useState(DEFAULT_ROLES);
  const [generated, setGenerated] = useState<SpectrumPayload>();
  const [familyNames, setFamilyNames] = useState<{ accents: string[]; neutrals: string[] }>({ accents: [], neutrals: [] });
  const [themes, setThemes] = useState(savedThemes);
  const [name, setName] = useState('');
  const [status, setStatus] = useState('');

  // Spectrum generation, debounced: it takes ~300ms, so it runs once input pauses.
  useEffect(() => {
    const t = setTimeout(() => {
      try {
        const out = buildSpectrum(spectrumOverrides(spectrum), roles);
        setGenerated(out.payload);
        setFamilyNames({ accents: out.accents, neutrals: out.neutrals });
      } catch (err) { setStatus(`Colors not generated: ${err}`); }
    }, 150);
    return () => clearTimeout(t);
  }, [spectrum, roles]);

  const send = () => post(frame.current?.contentWindow, { type: 'studio/theme', params, scheme, icons, view, spectrum: generated });
  useEffect(send, [params, scheme, icons, view, generated]);
  useEffect(() => listen(() => frame.current?.contentWindow, (m) => { if (m.type === 'studio/ready') send(); }), [params, scheme, icons, view, generated]);

  const setParam = (k: ParamName, v: number) => setParams((p) => ({ ...p, [k]: v }));
  const setSpec = (k: string, v: unknown) => setSpectrum((p) => ({ ...p, [k]: v }));

  // Everything applied, minus defaults: paste into an agent prompt.
  const snapshot = () => ({
    kit: '@massimo/ui-kit',
    theme: { ...diffFromDefaults(params), ...(icons !== 'phosphor' ? { icons } : {}) },
    scheme,
    spectrum: { settings: spectrumOverrides(spectrum), roles: generated?.roles ?? roles },
    howToApply: {
      theme: 'Merge `theme` into packages/ui-kit/tokens/themes/themes.json under a theme name, then <html data-ui-theme="name">.',
      spectrum: 'generateSpectrum(spectrum.settings) and spectrumCSS(data, resolveRoles(data, spectrum.roles)) from @massimo/ui-kit/spectrum; emit the CSS after the kit stylesheet.',
    },
  });

  const reset = () => {
    setParams(defaultParams); setScheme('auto'); setIcons('phosphor'); setSpectrum(SPECTRUM_DEFAULTS); setRoles(DEFAULT_ROLES); setName('');
    setStatus('Reset to defaults');
  };

  const copyRef = useEvent('click', () => navigator.clipboard.writeText(JSON.stringify(snapshot(), null, 2)).then(() => setStatus('Copied settings JSON'), () => setStatus('Copy failed')));
  const resetRef = useEvent('click', reset);
  const saveRef = useEvent('click', () => void save());
  const nameRef = useEvent('input', (el) => setName(el.value));

  const nameError = name && !THEME_NAME.test(name) ? 'Lowercase letters, digits and dashes.' : '';
  async function save() {
    if (!name || nameError) return;
    const body = { name, params: { ...diffFromDefaults(params), ...(icons !== 'phosphor' ? { icons } : {}) } };
    const res = await fetch('/__studio/themes', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
    const out = await res.json().catch(() => ({}));
    if (!res.ok) return setStatus(`Not saved: ${out.error ?? res.status}`);
    setThemes((t) => ({ ...t, [out.saved]: out.params }));
    setStatus(`Saved "${out.saved}"`);
  }
  const loadTheme = (key: string) => {
    const { icons: themeIcons, ...nums } = themes[key] ?? {};
    setParams({ ...defaultParams, ...nums });
    setIcons(themeIcons ?? 'phosphor');
    setName(key);
  };

  const geometry = (
    <Group title="Geometry">
      {GEOMETRY.map((k) => {
        const p = PARAMS[k];
        return <Range key={k} label={p.label} value={params[k]} min={p.min} max={p.max} step={p.step} onValue={(v) => setParam(k, v)} />;
      })}
    </Group>
  );

  return (
    <div className={s.shell}>
      <aside className={s.panel} aria-label="Jig">
        <header className={s.panelHeader}>
          <h1 className={s.brand}>Studio</h1>
          <Segmented<View> value={view} onValue={setView} options={[['components', 'Components'], ['containers', 'Containers'], ['colors', 'Colors']]} />
        </header>

        <div className={s.panelBody}>
          {view !== 'colors' && geometry}
          {view === 'components' && (
            <Group title="Look">
              <Select label="Icons" value={icons} options={STUDIO_ICON_SETS.map((n) => [n, n])} onValue={setIcons} />
              <Segmented<Scheme> label="Scheme" value={scheme} onValue={setScheme} options={[['auto', 'Auto'], ['light', 'Light'], ['dark', 'Dark']]} />
            </Group>
          )}
          {view === 'colors' && (
            <>
              <Group title="Roles">
                <Select label="Primary" value={generated?.roles.primary ?? roles.primary} options={familyNames.accents.map((n) => [n, n])} onValue={(v) => setRoles((r) => ({ ...r, primary: v }))} />
                <Select label="Neutral" value={generated?.roles.neutral ?? roles.neutral} options={familyNames.neutrals.map((n) => [n, n])} onValue={(v) => setRoles((r) => ({ ...r, neutral: v }))} />
                <Select label="Critical" value={generated?.roles.critical ?? roles.critical} options={familyNames.accents.map((n) => [n, n])} onValue={(v) => setRoles((r) => ({ ...r, critical: v }))} />
                <Segmented<Scheme> label="Scheme" value={scheme} onValue={setScheme} options={[['auto', 'Auto'], ['light', 'Light'], ['dark', 'Dark']]} />
              </Group>
              <Group title="Hues">
                <Segmented label="Hue set" value={spectrum.hueSet} onValue={(v) => setSpec('hueSet', v)} options={[['quad', 'Unique'], ['even', '12 equal'], ['radix', 'Radix 25']]} />
                <Range label="First hue" value={spectrum.hue} min={0} max={359} step={1} onValue={(v) => setSpec('hue', v)} format={(v) => `${v}°`} />
              </Group>
              <Group title="Chroma">
                <Range label="Requested chroma" value={spectrum.chroma} min={4} max={120} step={1} onValue={(v) => setSpec('chroma', v)} />
                <Range label="Base chroma %" value={spectrum.base} min={0} max={100} step={1} onValue={(v) => setSpec('base', v)} />
                <Range label="Falloff" value={spectrum.falloff} min={0.2} max={5} step={0.1} onValue={(v) => setSpec('falloff', v)} />
                <Switch label="Hue balance" checked={spectrum.hb === 1} onValue={(v) => setSpec('hb', v ? 1 : 0)} />
              </Group>
              <Group title="Tone">
                <Switch label="Automatic peak tone" checked={spectrum.ptAuto === 1} onValue={(v) => setSpec('ptAuto', v ? 1 : 0)} />
                {spectrum.ptAuto === 0 && <Range label="Peak tone" value={spectrum.pt} min={20} max={92} step={0.5} onValue={(v) => setSpec('pt', v)} />}
                <Range label="Dark endpoint" value={spectrum.darkTone} min={0} max={20} step={0.5} onValue={(v) => setSpec('darkTone', v)} />
                <Range label="Light endpoint" value={spectrum.toneMax} min={80} max={100} step={0.5} onValue={(v) => setSpec('toneMax', v)} />
              </Group>
              <Group title="Neutrals and output">
                <Range label="Neutral tint" value={spectrum.tint} min={0} max={100} step={1} onValue={(v) => setSpec('tint', v)} />
                <Segmented label="Scale" value={spectrum.ladder} onValue={(v) => setSpec('ladder', v)} options={[['even', '050–700'], ['radix', 'Radix 1–12']]} />
                <Segmented label="Gamut" value={spectrum.target} onValue={(v) => setSpec('target', v)} options={[['display-p3', 'P3'], ['srgb', 'sRGB']]} />
              </Group>
            </>
          )}
          <Group title="Theme">
            <Select label="Start from" value={themes[name] ? name : 'default'} options={[['default', 'Default'], ...Object.keys(themes).map((t) => [t, t] as [string, string])]} onValue={(v) => loadTheme(v === 'default' ? '' : v)} />
            <ui-input ref={nameRef} label="Theme name" placeholder="brand-x" value={name} error={nameError} data-size="3" />
            <ui-button ref={saveRef} data-size="3" disabled={!name || !!nameError}>Save geometry theme</ui-button>
          </Group>
        </div>

        <footer className={s.footer}>
          <p className={s.status} role="status">{status}</p>
          <div className={s.actions}>
            <ui-button ref={copyRef}><i slot="leading" name="copy" />Copy</ui-button>
            <ui-button ref={resetRef}>Reset</ui-button>
          </div>
        </footer>
      </aside>

      <iframe ref={frame} className={s.canvas} src="/canvas.html" title="Canvas" />
    </div>
  );
}
