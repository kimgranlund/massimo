// Studio jig: built entirely from ui-kit components. Tabs switch the panel and the canvas
// between Components, Containers and Colors; Copy hands the applied settings to an agent as JSON.
import { useEffect, useMemo, useState } from 'react';
import '@massimo/ui-kit/components/button/element';
import '@massimo/ui-kit/components/input/element';
import '@massimo/ui-kit/components/select/element';
import '@massimo/ui-kit/components/listbox/element';
import '@massimo/ui-kit/components/choice/element';
import '@massimo/ui-kit/components/range/element';
import { PARAMS, defaultParams, diffFromDefaults, paramVar, unitTokenCss, type ParamName, type ThemeParams } from '@massimo/ui-kit/tokens';
import { SPECTRUM_DEFAULTS, spectrumOverrides, DEFAULT_ROLES, BRAND_ROLES, FEEDBACK_ROLES, DATA_ROLES, type Roles, type RoleName, type SpectrumSettings } from '@massimo/ui-kit/spectrum';
import type { FaceMap, Scheme, SpectrumPayload, View, VoiceMap } from '../protocol.ts';
import { TYPE_RATIOS, FACES, VOICES, FACE_STACKS, FONT_FAMILIES, DEFAULT_VOICES, SERIF_REGULAR_VOICES, isSerifStack } from '@massimo/ui-kit/tokens';
import { Canvas } from '../canvas/Canvas.tsx';
import { ICON_SET_NAMES } from '@massimo/ui-kit/icons';
import { Field, Group, Range, Segmented, Select, SelectControl, Switch, useEvent } from './wc.tsx';
import { buildSpectrum } from './spectrum.ts';

const NEXT_SCHEME: Record<Scheme, Scheme> = { auto: 'light', light: 'dark', dark: 'auto' };
const SCHEME_LABEL: Record<Scheme, string> = { auto: 'auto', light: 'light', dark: 'dark' };
const SCHEME_ICON: Record<Scheme, string> = { auto: 'circle-half', light: 'sun', dark: 'moon' };
import * as s from './styles.ts';

// Geometry knobs shown in the panel (the old kit color sliders are superseded by Spectrum).
const GEOMETRY: ParamName[] = ['unit', 'border', 'radius-scale', 'corner-shape'];
const LEVELS = ['composite', 'group', 'collection', 'tile', 'card', 'panel', 'region', 'page'] as const;
const STEPS = [0, 0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6, 7, 8, 10, 12];

const ROLE_LABEL = (r: RoleName) => r.startsWith('data') ? `Data ${r.slice(4)}` : r[0].toUpperCase() + r.slice(1);
const shuffle = <T,>(xs: T[]) => { const a = [...xs]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pick = <T,>(xs: T[]) => xs[Math.floor(Math.random() * xs.length)];

/** Surprise mapping: brand and data roles from the generated families; feedback roles keep their meaning. */
function randomRoles(current: Roles, accents: string[], neutrals: string[]): Roles {
  const a = shuffle(accents), data = shuffle(accents);
  return {
    primary: a[0], secondary: a[1 % a.length], neutral: pick(neutrals),
    critical: current.critical, warning: current.warning, success: current.success, info: current.info,
    data1: data[0], data2: data[1 % data.length], data3: data[2 % data.length], data4: data[3 % data.length], data5: data[4 % data.length], data6: data[5 % data.length],
  };
}

/** One constructed stylesheet adopted by the document, rewritten in place when its text changes. */
function useSheet(text: string) {
  const sheet = useMemo(() => new CSSStyleSheet(), []);
  useEffect(() => {
    document.adoptedStyleSheets = [...document.adoptedStyleSheets, sheet];
    return () => { document.adoptedStyleSheets = document.adoptedStyleSheets.filter((x) => x !== sheet); };
  }, [sheet]);
  useEffect(() => { sheet.replaceSync(text); }, [sheet, text]);
}

export function App() {
  // The selected tab survives reloads (per-browser convenience; storage may be unavailable).
  const [view, setView] = useState<View>(() => {
    try { const v = localStorage.getItem('studio:view'); if (v === 'components' || v === 'containers' || v === 'colors' || v === 'typography') return v; } catch { /* no storage */ }
    return 'components';
  });
  useEffect(() => { try { localStorage.setItem('studio:view', view); } catch { /* no storage */ } }, [view]);
  const [params, setParams] = useState<ThemeParams>(defaultParams);
  const [scheme, setScheme] = useState<Scheme>('auto');
  const [icons, setIcons] = useState('phosphor');
  const [voices, setVoices] = useState<VoiceMap>(DEFAULT_VOICES);
  const [faces, setFaces] = useState<FaceMap>(FONT_FAMILIES);
  const [spectrum, setSpectrum] = useState<SpectrumSettings>(SPECTRUM_DEFAULTS);
  const [roles, setRoles] = useState<Roles>(DEFAULT_ROLES);
  const [generated, setGenerated] = useState<SpectrumPayload>();
  const [familyNames, setFamilyNames] = useState<{ accents: string[]; neutrals: string[] }>({ accents: [], neutrals: [] });
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

  // Live overrides live in one constructed stylesheet (useSheet), never in style attributes: theme
  // parameters, faces and serif weights that differ from the kit defaults, scoped to the canvas
  // ([data-canvas]); Spectrum colors and scheme apply to the whole jig (:root, from spectrumCSS).
  const canvasDecls = [
    ...Object.entries(diffFromDefaults(params)).map(([k, v]) => `${paramVar(k as ParamName)}: ${v};`),
    ...Object.entries(faces).filter(([f, st]) => FONT_FAMILIES[f as keyof FaceMap] !== st).map(([f, st]) => `--fonts-${f}: ${st};`),
    ...[...SERIF_REGULAR_VOICES].filter((v) => isSerifStack(faces[voices[v]])).map((v) => `--font-voice-${v}-weight: 400;`),
  ];
  // The canvas sets its own unit and ladder, so the u-based Panda tokens recompute there too.
  if (canvasDecls.length) canvasDecls.push(unitTokenCss());
  useSheet(`${canvasDecls.length ? `[data-canvas] {\n  ${canvasDecls.join('\n  ')}\n}\n` : ''}${generated?.css ?? ''}`);
  const voiceAttrs = Object.fromEntries(Object.entries(voices).filter(([v, f]) => DEFAULT_VOICES[v as keyof VoiceMap] !== f).map(([v, f]) => [`data-font-${v}`, f]));

  const setParam = (k: ParamName, v: number) => setParams((p) => ({ ...p, [k]: v }));
  const setSpec = (k: string, v: unknown) => setSpectrum((p) => ({ ...p, [k]: v }));

  // Everything applied, minus defaults: paste into an agent prompt.
  const snapshot = () => ({
    kit: '@massimo/ui-kit',
    theme: { ...diffFromDefaults(params), ...(icons !== 'phosphor' ? { icons } : {}) },
    scheme,
    typography: {
      voices: Object.fromEntries(Object.entries(voices).filter(([v, f]) => DEFAULT_VOICES[v as keyof VoiceMap] !== f)),
      faces: Object.fromEntries(Object.entries(faces).filter(([f, st]) => FONT_FAMILIES[f as keyof FaceMap] !== st)),
    },
    spectrum: { settings: spectrumOverrides(spectrum), roles: generated?.roles ?? roles },
    howToApply: {
      theme: 'Merge `theme` into packages/ui-kit/tokens/themes/themes.json under a theme name, then <html data-ui-theme="name">.',
      typography: 'Voices: data-font-<voice>="<face>" on <html> (or any element). Faces: set --fonts-<face> to the stack (e.g. in the Panda preset tokens.fonts).',
      spectrum: 'generateSpectrum(spectrum.settings) and spectrumCSS(data, resolveRoles(data, spectrum.roles)) from @massimo/ui-kit/spectrum; emit the CSS after the kit stylesheet.',
    },
  });

  const reset = () => {
    setParams(defaultParams); setScheme('auto'); setIcons('phosphor'); setVoices(DEFAULT_VOICES); setFaces(FONT_FAMILIES); setSpectrum(SPECTRUM_DEFAULTS); setRoles(DEFAULT_ROLES);
    setStatus('Reset to defaults');
  };

  // The scheme applies to the whole jig: a .light/.dark class on <html> (none for auto).
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('light', scheme === 'light');
    root.classList.toggle('dark', scheme === 'dark');
  }, [scheme]);
  // One icon button cycles the scheme: auto (follow the OS) → light → dark.
  const schemeRef = useEvent('click', () => setScheme((v) => NEXT_SCHEME[v]));
  const copyRef = useEvent('click', () => navigator.clipboard.writeText(JSON.stringify(snapshot(), null, 2)).then(() => setStatus('Copied settings JSON'), () => setStatus('Copy failed')));
  const resetRef = useEvent('click', reset);
  const randomRef = useEvent('click', () => setRoles((cur) => randomRoles(cur, familyNames.accents, familyNames.neutrals)));

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
      <aside className={s.panel} aria-label="Jig" data-size="3">
        <header className={s.panelHeader}>
          <div className={s.titleRow}>
            <h1 className={s.brand}>Studio</h1>
            <ui-button ref={schemeRef} aria-label={`Color scheme: ${SCHEME_LABEL[scheme]} (switch to ${SCHEME_LABEL[NEXT_SCHEME[scheme]]})`} title={`Scheme: ${SCHEME_LABEL[scheme]}`}>
              <i slot="leading" name={SCHEME_ICON[scheme]} />
            </ui-button>
          </div>
          <Segmented<View> value={view} onValue={setView} options={[['components', 'Components'], ['containers', 'Containers'], ['colors', 'Colors'], ['typography', 'Typography']]} />
        </header>

        <div className={s.panelBody}>
          {(view === 'components' || view === 'containers') && geometry}
          {view === 'typography' && (
            <Group title="Typography">
              <Range label="Unit (px)" value={params.unit} min={PARAMS.unit.min} max={PARAMS.unit.max} step={PARAMS.unit.step} onValue={(v) => setParam('unit', v)} />
              <Select label="Ratio" value={String(params['type-ratio'])} options={(TYPE_RATIOS.some(([r]) => r === params['type-ratio']) ? TYPE_RATIOS : [...TYPE_RATIOS, [params['type-ratio'], 'Custom'] as [number, string]]).map(([r, n]) => [String(r), `${r} · ${n}`] as [string, string])} onValue={(v) => setParam('type-ratio', Number(v))} />
              <Segmented label="Rhythm" value={String(params['type-rhythm'])} onValue={(v) => setParam('type-rhythm', Number(v))} options={[['0', 'None'], ['0.5', '½u'], ['1', '1u']]} />
            </Group>
          )}
          {view === 'typography' && (
            <Group title="Faces">
              {FACES.map((f) => (
                <Select key={f} label={f[0].toUpperCase() + f.slice(1)} value={faces[f]} options={(FACE_STACKS[f].some(([, st]) => st === faces[f]) ? FACE_STACKS[f] : [...FACE_STACKS[f], ['Custom', faces[f]] as [string, string]]).map(([n, st]) => [st, n] as [string, string])} onValue={(v) => setFaces((m) => ({ ...m, [f]: v }))} />
              ))}
            </Group>
          )}
          {view === 'typography' && (
            <Group title="Voices">
              {VOICES.map((v) => (
                <Select key={v} label={v === 'ui' ? 'UI' : v[0].toUpperCase() + v.slice(1)} value={voices[v]} options={FACES.map((f) => [f, f] as [string, string])} onValue={(x) => setVoices((m) => ({ ...m, [v]: x as keyof FaceMap }))} />
              ))}
            </Group>
          )}
          {view === 'containers' && (
            <Group title="Padding and gap per type (u)">
              <span className={s.paneLabel} /><div className={`${s.paneControl} ${s.pair}`}><span className={s.levelHead}>Padding</span><span className={s.levelHead}>Gap</span></div>
              {LEVELS.map((level) => {
                const padKey = `pad-${level}` as ParamName, gapKey = `gap-${level}` as ParamName;
                const opts = (key: ParamName) => STEPS.filter((v) => v <= PARAMS[key].max).map((v) => [String(v), `${v}u · ${v * params.unit}px`] as [string, string]);
                return (
                  <Field key={level} label={level}>
                    <div className={s.pair}>
                      <SelectControl label={`${level} padding`} value={String(params[padKey])} options={opts(padKey)} onValue={(v) => setParam(padKey, Number(v))} />
                      <SelectControl label={`${level} gap`} value={String(params[gapKey])} options={opts(gapKey)} onValue={(v) => setParam(gapKey, Number(v))} />
                    </div>
                  </Field>
                );
              })}
            </Group>
          )}
          {view === 'components' && (
            <Group title="Look">
              <Select label="Icons" value={icons} options={ICON_SET_NAMES.map((n) => [n, n])} onValue={setIcons} />
            </Group>
          )}
          {view === 'colors' && (
            <>
              <div className={s.control}>
                <ui-button ref={randomRef}><i slot="leading" name="shuffle" />Random</ui-button>
              </div>
              {([['Brand', BRAND_ROLES], ['Feedback', FEEDBACK_ROLES], ['Data', DATA_ROLES]] as [string, readonly RoleName[]][]).map(([title, names]) => (
                <Group key={title} title={title}>
                  {names.map((r) => (
                    <Select key={r} label={ROLE_LABEL(r)} value={(r === 'neutral' ? familyNames.neutrals : familyNames.accents).includes(roles[r]) ? roles[r] : generated?.roles[r] ?? roles[r]}
                      options={(r === 'neutral' ? familyNames.neutrals : familyNames.accents).map((n) => [n, n])}
                      onValue={(v) => setRoles((cur) => ({ ...cur, [r]: v }))}
                      swatch={(family) => `var(--colors-spectrum-${family}-9)`} />
                  ))}
                </Group>
              ))}
              <Group title="Hues">
                <Segmented label="Hue set" value={spectrum.hueSet} onValue={(v) => setSpec('hueSet', v)} options={[['quad', 'Unique'], ['radix', 'Radix']]} />
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
        </div>

        <footer className={s.footer}>
          <p className={s.status} role="status">{status}</p>
          <div className={s.actions}>
            <ui-button ref={copyRef}><i slot="leading" name="copy" />Copy</ui-button>
            <ui-button ref={resetRef}>Reset</ui-button>
          </div>
        </footer>
      </aside>

      <div className={s.canvas} data-canvas="" data-icons={icons} {...voiceAttrs} aria-label="Canvas">
        <Canvas view={view} spectrum={generated} params={params} voices={voices} faces={faces} />
      </div>
    </div>
  );
}
