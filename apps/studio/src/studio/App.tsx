// Studio jig: built entirely from ui-kit components. The panel edits tokens only (tabs Geometry,
// Colors, Typography, Motion); the content page comes from the URL hash (#/<route>) and is chosen
// in the content header. Copy hands the applied settings to an agent as JSON.
import { lazy, Suspense, useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import '@massimo/ui-kit/components/button/element';
import '@massimo/ui-kit/components/input/element';
import '@massimo/ui-kit/components/select/element';
import '@massimo/ui-kit/components/listbox/element';
import '@massimo/ui-kit/components/choice/element';
import '@massimo/ui-kit/components/range/element';
import { PARAMS, defaultParams, paramVar, type ParamName, type ThemeParams } from '@massimo/ui-kit/tokens/themes/params';
import { diffFromDefaults } from '@massimo/ui-kit/tokens/themes/validate';
import { unitTokenCss } from '@massimo/ui-kit/tokens/geometry/index';
import { motionTokenCss } from '@massimo/ui-kit/tokens/motion/index';
import { elevationTokenCss } from '@massimo/ui-kit/tokens/elevation/index';
import { loadTheme as loadThemeObject, partsFromParameters, themeParameters, type Theme } from '@massimo/ui-kit/tokens/themes/theme';
import type { Finding } from '@massimo/ui-kit/tokens/themes/lint';
import { SPECTRUM_DEFAULTS, SPECTRUM_FIELDS, spectrumOverrides, type SpectrumSettings } from '@massimo/ui-kit/tokens/colors/spectrum/config';
import { stepTones, TARGET_MAX } from '@massimo/ui-kit/tokens/colors/spectrum/contrast';
import { DEFAULT_ENDPOINT, DEFAULT_ROLES, BRAND_ROLES, FEEDBACK_ROLES, DATA_ROLES, type Roles, type RoleName } from '@massimo/ui-kit/tokens/colors/spectrum/roles';
import type { FaceMap, PanelTab, Scheme, SpectrumPayload, VoiceMap } from '../protocol.ts';
import { TYPE_RATIOS, TYPE_ROLES, FACES, VOICES, FACE_STACKS, FONT_FAMILIES, DEFAULT_VOICES, SERIF_REGULAR_VOICES, TEXT_COLORS, DEFAULT_TYPE_COLORS, typeColorVar, isSerifStack, type TextColor, type TypeRoleName } from '@massimo/ui-kit/tokens/typography/resolve';
import { APPLY_BRAND, ROUTES, ROUTE_LABEL, type PageProps, type Route } from '../pages/types.ts';
import { navigate, parseHash, useHashRoute } from '../pages/route.ts';
import { generateSpectrumOff, lintThemeOff } from './engine.ts';
import { HomePage } from '../pages/Home.tsx';
import { FAMILIES, isFamily } from '../pages/families.ts';
import { loadFontSource } from './fonts.ts';
import { BRAND_CHOICES, BrandEditor, loadBrandChoice } from './BrandEditor.tsx';
import { hydrate, validateBrand, type Brand } from '@massimo/ui-kit/tokens/brand/index';
import { MotionPanel } from './MotionPanel.tsx';
import { ICON_SET_NAMES } from '@massimo/ui-kit/icons/sets';
import { Field, Group, Range, Segmented, Select, SelectControl, Switch, useEvent, type SwatchSpec } from './wc.tsx';

// Home, the landing page, ships with the shell so it paints in the first render. Every other page loads
// on first visit, in its own chunk; a deep link's page starts loading as this module evaluates.
const PAGE_MODULES = {
  components: () => import('../pages/Components.tsx'),
  containers: () => import('../pages/Containers.tsx'),
  elevation: () => import('../pages/Elevation.tsx'),
  brand: () => import('../pages/Brand.tsx'),
  geometry: () => import('../pages/Geometry.tsx'),
  typography: () => import('../pages/Typography.tsx'),
  colors: () => import('../pages/Colors.tsx'),
  motion: () => import('../pages/Motion.tsx'),
} satisfies Record<Exclude<Route, 'home'>, () => Promise<unknown>>;
const firstRoute = parseHash(location.hash).route;
if (firstRoute !== 'home') void PAGE_MODULES[firstRoute]();
const ComponentsPage = lazy(() => PAGE_MODULES.components().then((m) => ({ default: m.ComponentsPage })));
const ContainersPage = lazy(() => PAGE_MODULES.containers().then((m) => ({ default: m.ContainersPage })));
const ElevationPage = lazy(() => PAGE_MODULES.elevation().then((m) => ({ default: m.ElevationPage })));
const BrandPage = lazy(() => PAGE_MODULES.brand().then((m) => ({ default: m.BrandPage })));
const GeometryPage = lazy(() => PAGE_MODULES.geometry().then((m) => ({ default: m.GeometryPage })));
const TypographyPage = lazy(() => PAGE_MODULES.typography().then((m) => ({ default: m.TypographyPage })));
const ColorsPage = lazy(() => PAGE_MODULES.colors().then((m) => ({ default: m.ColorsPage })));
const MotionPage = lazy(() => PAGE_MODULES.motion().then((m) => ({ default: m.MotionPage })));

const NEXT_SCHEME: Record<Scheme, Scheme> = { auto: 'light', light: 'dark', dark: 'auto' };
const SCHEME_LABEL: Record<Scheme, string> = { auto: 'auto', light: 'light', dark: 'dark' };
const SCHEME_ICON: Record<Scheme, string> = { auto: 'circle-half', light: 'sun', dark: 'moon' };
import * as s from './styles.ts';

// Geometry knobs shown in the panel (the old kit color sliders are superseded by Spectrum).
const GEOMETRY: ParamName[] = ['unit', 'border', 'radius-scale', 'corner-shape'];
const CONTAINER_RADIUS: [ParamName, string][] = [['radius-group', 'Group'], ['radius-collection', 'Collection'], ['radius-card', 'Card']];
// corner-shape (superellipse): Chromium draws it; where CSS.supports says no (Firefox, older WebKit) corners stay round.
const CORNER_SHAPE = typeof CSS !== 'undefined' && CSS.supports('corner-shape', 'superellipse(2)');
const LEVELS = ['composite', 'group', 'collection', 'card-xs', 'card-sm', 'card-md', 'card-lg', 'card-xl', 'panel', 'region', 'page'] as const;
// Every half step 0–12u: the ladder parameters' step, so any theme value (a descriptor's space, a loaded theme) has an option.
const STEPS = Array.from({ length: 25 }, (_, i) => i / 2);

const ROLE_LABEL = (r: RoleName) => r.startsWith('data') ? `Data ${r.slice(4)}` : r[0].toUpperCase() + r.slice(1);
const shuffle = <T,>(xs: T[]) => { const a = [...xs]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
const PANEL_TABS: [PanelTab, string][] = [['geometry', 'Geometry'], ['colors', 'Colors'], ['typography', 'Typography'], ['motion', 'Motion'], ['brand', 'Brand']];
const isPanelTab = (v: unknown): v is PanelTab => PANEL_TABS.some(([t]) => t === v);
const PAGES: Record<Exclude<Route, 'components'>, ComponentType<PageProps>> = {
  home: HomePage, containers: ContainersPage, elevation: ElevationPage, geometry: GeometryPage, typography: TypographyPage, colors: ColorsPage, motion: MotionPage, brand: BrandPage,
};
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

/**
 * Random generation inputs: every hue setting (hue set, first hue, balance), every chroma setting
 * (requested, base, falloff, distribution), the neutral tint, and the light and dark page tones.
 * Each is drawn on its field's step, from a usable range (RANDOM_RANGE) where the full range would
 * often give dull or low-contrast palettes; the full ranges stay reachable by hand.
 */
const RANDOM_SPECTRUM = ['hueSet', 'quadStart', 'hue', 'hb', 'chroma', 'base', 'falloff', 'keyC', 'tint', 'toneMax', 'darkTone'] as const;
const RANDOM_RANGE: Partial<Record<(typeof RANDOM_SPECTRUM)[number], [number, number]>> = { chroma: [40, 120], base: [50, 100], toneMax: [92, 100], darkTone: [0, 10] };
function randomSpectrum(current: SpectrumSettings): SpectrumSettings {
  const out = { ...current };
  for (const key of RANDOM_SPECTRUM) {
    const f = SPECTRUM_FIELDS.find((x) => x.key === key)!;
    if (f.options) { out[key] = pick(f.options); continue; }
    const [lo, hi] = RANDOM_RANGE[key] ?? [f.min!, f.max!];
    out[key] = Number((lo + Math.round((Math.random() * (hi - lo)) / f.step!) * f.step!).toFixed(4));
  }
  return out;
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
  // The selected panel tab survives reloads (per-browser convenience; storage may be unavailable).
  // It never changes the page: the page is the URL hash alone.
  const [tab, setTab] = useState<PanelTab>(() => {
    try { const v = localStorage.getItem('studio:panel'); if (isPanelTab(v)) return v; } catch { /* no storage */ }
    return 'geometry';
  });
  useEffect(() => { try { localStorage.setItem('studio:panel', tab); } catch { /* no storage */ } }, [tab]);
  const { route, query } = useHashRoute();
  const familyParam = query.get('family');
  const family = isFamily(familyParam) ? familyParam : undefined;
  // A new page starts at its top.
  const canvasRef = useRef<HTMLDivElement>(null);
  useEffect(() => { canvasRef.current?.scrollTo({ top: 0 }); }, [route]);
  const [params, setParams] = useState<ThemeParams>(defaultParams);
  const [scheme, setScheme] = useState<Scheme>('auto');
  const [icons, setIcons] = useState('phosphor');
  const [voices, setVoices] = useState<VoiceMap>(DEFAULT_VOICES);
  const [faces, setFaces] = useState<FaceMap>(FONT_FAMILIES);
  const [weights, setWeights] = useState<NonNullable<NonNullable<Theme['typography']>['weights']>>({});
  const [typeColors, setTypeColors] = useState<Record<TypeRoleName, TextColor>>(DEFAULT_TYPE_COLORS);
  const [spectrum, setSpectrum] = useState<SpectrumSettings>(SPECTRUM_DEFAULTS);
  const [targetScheme, setTargetScheme] = useState<'light' | 'dark'>('light');
  const [roles, setRoles] = useState<Roles>(DEFAULT_ROLES);
  // White and black: a neutral step (white from the light ramp, black from the dark ramp; 1 by default) or 'pure'.
  type Endpoint = number | 'pure';
  const [endpoints, setEndpoints] = useState<{ white: Endpoint; black: Endpoint }>({ white: DEFAULT_ENDPOINT, black: DEFAULT_ENDPOINT });
  // Brand anchors (color.anchors): carried through Load and Copy; a brand sets them on Apply.
  // The brand the theme came from (Brand page Apply, or Load of a brand or bundle); Copy then writes both.
  const [brand, setBrand] = useState<Brand | null>(null);
  const chosenBrand = useRef<{ id: string; name: string } | null>(null); // the Theme choice behind the active brand
  const editTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(editTimer.current), []);
  // The jig's own brand faces (its panel scope): from the built theme's typography.sources.
  useEffect(() => { void fetch(`${import.meta.env.BASE_URL}brand/massimo.theme.json`).then((r) => r.json()).then((t: Theme) => { for (const x of t.typography?.sources ?? []) loadFontSource(x.url); }).catch(() => {}); }, []);
  // Web face stylesheets (typography.sources): loaded as <link> elements, one per URL.
  const [sources, setSources] = useState<NonNullable<NonNullable<Theme['typography']>['sources']>>([]);
  // Google Fonts load automatically; another host (a self-hosted stylesheet from pasted JSON) is named in
  // the status line instead of fetched.
  useEffect(() => {
    const skipped = sources.filter((x) => !loadFontSource(x.url)).map((x) => x.family);
    if (skipped.length) setStatus(`Not loaded (not Google Fonts): ${skipped.join(', ')}`);
  }, [sources]);
  const [anchors, setAnchors] = useState<NonNullable<NonNullable<Theme['color']>['anchors']>>([]);
  const [generated, setGenerated] = useState<SpectrumPayload>();
  const [familyNames, setFamilyNames] = useState<{ accents: string[]; neutrals: string[] }>({ accents: [], neutrals: [] });
  const [status, setStatus] = useState('');

  // Spectrum generation, debounced: it takes ~300ms, so it runs once input pauses.
  useEffect(() => {
    // The engine (and its 264 KB runtime) runs in a worker, so generating never blocks the panel.
    let live = true;
    const t = setTimeout(() => {
      generateSpectrumOff(spectrumOverrides(spectrum), roles, anchors).then((out) => {
        if (!live) return;
        setGenerated(out.payload);
        setFamilyNames({ accents: out.accents, neutrals: out.neutrals });
      }).catch((err) => setStatus(`Colors not generated: ${err}`));
    }, 150);
    return () => { live = false; clearTimeout(t); };
  }, [spectrum, roles, anchors]);

  // Live overrides live in one constructed stylesheet (useSheet), never in style attributes: theme
  // parameters, faces and serif weights that differ from the kit defaults, scoped to the canvas
  // ([data-canvas]); Spectrum colors and scheme apply to the whole jig (:root, from spectrumCSS).
  const canvasDecls = [
    ...Object.entries(diffFromDefaults(params)).map(([k, v]) => `${paramVar(k as ParamName)}: ${v};`),
    ...Object.entries(faces).filter(([f, st]) => FONT_FAMILIES[f as keyof FaceMap] !== st).map(([f, st]) => `--fonts-${f}: ${st};`),
    ...[...SERIF_REGULAR_VOICES].filter((v) => isSerifStack(faces[voices[v]])).map((v) => `--font-voice-${v}-weight: 400;`),
    ...Object.entries(weights).map(([v, w]) => `--font-voice-${v}-weight: ${w};`),
    ...(Object.entries(typeColors) as [TypeRoleName, TextColor][]).filter(([r, c]) => DEFAULT_TYPE_COLORS[r] !== c).map(([r, c]) => `${typeColorVar(r)}: ${TEXT_COLORS[c]};`),
  ];
  // The canvas sets its own unit, ladder, motion and elevation params, so the u-based, motion and elevation Panda tokens recompute there too.
  if (canvasDecls.length) canvasDecls.push(unitTokenCss(), motionTokenCss(), elevationTokenCss());
  // White and black mapped to another neutral step (light ramp for white, dark for black) or pure,
  // after the generated colors so it wins in every scheme block.
  const endpoint = (want: Endpoint, mode: 'light' | 'dark', pure: string) =>
    want === 'pure' ? pure : generated?.families.find((f) => f.name === generated.roles.neutral)?.[mode][want - 1];
  const white = endpoints.white !== DEFAULT_ENDPOINT ? endpoint(endpoints.white, 'light', '#fff') : undefined;
  const black = endpoints.black !== DEFAULT_ENDPOINT ? endpoint(endpoints.black, 'dark', '#000') : undefined;
  // Split swatches (jig Select): the dark half on the dark page (neutral dark 1), the light half on
  // the light page (neutral light 1), each with the color it takes in that scheme.
  const ramp = (family: string | undefined, mode: 'light' | 'dark', step: number) => generated?.families.find((f) => f.name === family)?.[mode][step - 1] ?? 'transparent';
  const neutral = generated?.roles.neutral;
  const darkNow = scheme === 'dark' || (scheme === 'auto' && matchMedia('(prefers-color-scheme: dark)').matches);
  // Read from the generation, never the ramp variables: the panel wears the jig's own brand, whose
  // anchors recolor those ramps, so a variable there shows that brand instead of the tuned theme.
  const pageSwatch = (darkFg: string, lightFg: string): SwatchSpec => ({ dark: [ramp(neutral, 'dark', 1), darkFg], light: [ramp(neutral, 'light', 1), lightFg] });
  const endpointColor = (e: Endpoint, mode: 'light' | 'dark') => e === 'pure' ? (mode === 'light' ? '#fff' : '#000') : ramp(neutral, mode, e);
  const whiteNow = endpointColor(endpoints.white, 'light'), blackNow = endpointColor(endpoints.black, 'dark');
  const textSwatch = (c: TextColor): SwatchSpec => {
    const step = { default: 12, inherit: 12, muted: 11, subtle: 8 } as Record<string, number>;
    if (c === 'strong') return pageSwatch(whiteNow, blackNow);
    if (c === 'primary') return { dark: [ramp(neutral, 'dark', 1), ramp(generated?.roles.primary, 'dark', 11)], light: [ramp(neutral, 'light', 1), ramp(generated?.roles.primary, 'light', 11)] };
    return pageSwatch(ramp(neutral, 'dark', step[c]), ramp(neutral, 'light', step[c]));
  };
  // :not(#…) outranks the generated scheme blocks (:root:not(.light) under the OS dark scheme, :root.dark).
  const endpointCss = white || black ? `:root:not(#ui-endpoints) {${white ? ` --colors-white: ${white};` : ''}${black ? ` --colors-black: ${black};` : ''} }\n` : '';
  // Emphasis: the selection fills are declared with the colors on :root, so its parameter goes there too.
  const emphasisCss = params.emphasis !== defaultParams.emphasis ? `:root { ${paramVar('emphasis')}: ${params.emphasis}; }\n` : '';
  useSheet(`${canvasDecls.length ? `[data-canvas] {\n  ${canvasDecls.join('\n  ')}\n}\n` : ''}${generated?.css ?? ''}\n${endpointCss}${emphasisCss}`);
  const voiceAttrs = Object.fromEntries(Object.entries(voices).filter(([v, f]) => DEFAULT_VOICES[v as keyof VoiceMap] !== f).map(([v, f]) => [`data-font-${v}`, f]));

  const setParam = (k: ParamName, v: number) => setParams((p) => ({ ...p, [k]: v }));
  const setSpec = (k: string, v: unknown) => setSpectrum((p) => ({ ...p, [k]: v }));

  // Everything applied, minus defaults, as one theme object (contracts/theme.schema.json): paste it
  // into an agent prompt or save it under its name in packages/ui-kit/tokens/themes/themes.json.
  const [themeName, setThemeName] = useState('custom');
  const changed = <T extends Record<string, unknown>>(cur: T, base: T) => Object.fromEntries(Object.entries(cur).filter(([k, v]) => JSON.stringify(v) !== JSON.stringify(base[k])));
  const listed = <T,>(xs: T[]) => (xs.length ? xs : undefined);
  const nonEmpty = <T extends Record<string, unknown>>(o: T) => Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && !(typeof v === 'object' && v && !Array.isArray(v) && !Object.keys(v).length)));
  // Theme schema v2: the changed parameters go into their parts (geometry, typography, motion).
  const themeObject = (): Theme => { const parts = partsFromParameters(diffFromDefaults(params)); return nonEmpty({
    schemaVersion: 2 as const,
    name: themeName,
    geometry: parts.geometry,
    typography: nonEmpty({ parameters: parts.typography?.parameters, sources: listed(sources), voices: changed(voices, DEFAULT_VOICES), faces: changed(faces, FONT_FAMILIES), colors: changed(typeColors, DEFAULT_TYPE_COLORS), weights: changed(weights, {}) }),
    color: nonEmpty({ parameters: parts.color?.parameters, spectrum: spectrumOverrides(spectrum), roles: changed(roles, DEFAULT_ROLES), endpoints: changed(endpoints, { white: DEFAULT_ENDPOINT, black: DEFAULT_ENDPOINT }), anchors: listed(anchors) }),
    motion: parts.motion,
    icons: icons !== 'phosphor' ? icons : undefined,
    scheme: scheme !== 'auto' ? scheme : undefined,
  }) as unknown as Theme; };
  // Lint (contracts/theme-constraints.json), debounced: the color rules generate the theme's Spectrum.
  const [findings, setFindings] = useState<Finding[]>([]);
  useEffect(() => {
    const t = setTimeout(() => { lintThemeOff(themeObject()).then(setFindings).catch((err) => setStatus(`Lint failed: ${err}`)); }, 400);
    return () => clearTimeout(t);
  }, [params, icons, scheme, spectrum, roles, endpoints, anchors, faces, voices, typeColors, weights]);
  const count = (sev: Finding['severity']) => findings.filter((f) => f.severity === sev).length;
  const lintSummary = findings.length ? `Checks: ${count('error')} errors, ${count('warning')} warnings, ${count('info')} info` : 'Checks: clean';

  // Load: the same object back (clipboard); every section not in it returns to the default.
  const applyTheme = (t: Theme) => {
    setThemeName(t.name);
    setParams({ ...defaultParams, ...(themeParameters(t) as Partial<ThemeParams>) }); setIcons(t.icons ?? 'phosphor'); setScheme(t.scheme ?? 'auto');
    setSpectrum({ ...SPECTRUM_DEFAULTS, ...(t.color?.spectrum ?? {}) }); setRoles({ ...DEFAULT_ROLES, ...(t.color?.roles ?? {}) } as Roles);
    setEndpoints({ white: DEFAULT_ENDPOINT, black: DEFAULT_ENDPOINT, ...(t.color?.endpoints ?? {}) }); setAnchors(t.color?.anchors ?? []);
    setFaces({ ...FONT_FAMILIES, ...(t.typography?.faces ?? {}) } as FaceMap); setVoices({ ...DEFAULT_VOICES, ...(t.typography?.voices ?? {}) } as VoiceMap); setWeights(t.typography?.weights ?? {});
    setTypeColors({ ...DEFAULT_TYPE_COLORS, ...(t.typography?.colors ?? {}) } as Record<TypeRoleName, TextColor>);
    setSources(t.typography?.sources ?? []);
  };
  // A brand: hydrate it (tokens/brand), apply the theme and keep the brand for Copy.
  const lastApplied = useRef<Brand | null>(null);
  const applyBrand = (b: Brand) => {
    clearTimeout(editTimer.current);
    const { theme, unresolved } = hydrate(b);
    applyTheme(theme); setBrand(b); lastApplied.current = b;
    setStatus(`Applied brand ${b.name}${unresolved.length ? ` (${unresolved.length} open questions on the Brand page)` : ''}`);
  };
  // An edit from the Brand tab: re-hydrate after typing pauses (Spectrum takes ~300ms per run). Hand-tuned
  // parameters (those that differ from what the last applied brand hydrated to) are kept on top.
  const editBrand = (b: Brand) => {
    setBrand(b); clearTimeout(editTimer.current);
    const prev = lastApplied.current, now = params;
    editTimer.current = setTimeout(() => {
      const was = prev ? { ...defaultParams, ...themeParameters(hydrate(prev).theme) } as ThemeParams : undefined;
      const hand = was ? Object.fromEntries((Object.keys(now) as ParamName[]).filter((k) => now[k] !== was[k]).map((k) => [k, now[k]])) : {};
      applyBrand(b);
      const n = Object.keys(hand).length;
      if (n) { setParams((p) => ({ ...p, ...hand })); setStatus(`Applied brand ${b.name}; kept ${n} hand-tuned value${n === 1 ? '' : 's'}`); }
    }, 200);
  };
  useEffect(() => {
    const on = (e: Event) => applyBrand((e as CustomEvent<Brand>).detail);
    window.addEventListener(APPLY_BRAND, on);
    return () => window.removeEventListener(APPLY_BRAND, on);
  });
  // Load: a theme (version 1 or 2), a brand (hydrated), or a { brand, theme } bundle from Copy.
  const loadTheme = async () => {
    clearTimeout(editTimer.current);
    let text = '';
    try { text = await navigator.clipboard.readText(); } catch { setStatus('Load: clipboard not readable'); return; }
    let data: any;
    try { data = JSON.parse(text); } catch { setStatus('Load: the clipboard is not JSON'); return; }
    const report = (errors: string[]) => setStatus(`Load: ${errors.slice(0, 3).join('; ')}${errors.length > 3 ? ` (+${errors.length - 3})` : ''}`);
    if (data && typeof data === 'object' && 'subject' in data) {
      const b = validateBrand(data);
      if (!b.ok) return report(b.errors);
      return applyBrand(b.brand);
    }
    if (data && typeof data === 'object' && 'brand' in data && 'theme' in data) {
      const b = validateBrand(data.brand), t = loadThemeObject(data.theme);
      if (!b.ok) return report(b.errors);
      if (!t.ok) return report(t.errors);
      applyTheme(t.theme); setBrand(b.brand); setStatus(`Loaded brand ${b.brand.name} with its tuned theme`);
      return;
    }
    // Version 1 themes (one flat parameters section) migrate on load.
    const r = loadThemeObject(data);
    if (!r.ok) return report(r.errors);
    applyTheme(r.theme); setBrand(null);
    setStatus(`Loaded theme ${r.theme.name}`);
  };

  const reset = () => {
    clearTimeout(editTimer.current); lastApplied.current = null;
    setThemeName('custom'); setParams(defaultParams); setScheme('auto'); setIcons('phosphor'); setVoices(DEFAULT_VOICES); setFaces(FONT_FAMILIES); setSpectrum(SPECTRUM_DEFAULTS); setRoles(DEFAULT_ROLES); setEndpoints({ white: DEFAULT_ENDPOINT, black: DEFAULT_ENDPOINT }); setAnchors([]); setBrand(null); setSources([]); setTypeColors(DEFAULT_TYPE_COLORS); setWeights({});
    setStatus('Reset to defaults');
  };

  // The header's Theme select: the default theme, or a brand applied clean (no hand tuning carried over).
  const chooseTheme = async (id: string) => {
    if (id === 'active') return;
    if (id === 'default') { const s = scheme; reset(); setScheme(s); setStatus('Default theme'); return; }
    const b = await loadBrandChoice(id);
    if (b) { chosenBrand.current = { id, name: b.name }; applyBrand(b); }
  };
  const themeChoice = !brand ? (themeName === 'custom' ? 'default' : 'active') : chosenBrand.current?.name === brand.name ? chosenBrand.current.id : BRAND_CHOICES.some(([id]) => id === brand.name) ? brand.name : 'active';
  const themeOptions: [string, string][] = [['default', 'Default theme'], ...BRAND_CHOICES, ...(themeChoice === 'active' ? [['active', brand?.subject.name ?? themeName] as [string, string]] : [])];

  // The scheme applies to the whole jig: a .light/.dark class on <html> (none for auto).
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('light', scheme === 'light');
    root.classList.toggle('dark', scheme === 'dark');
  }, [scheme]);
  // One icon button cycles the scheme: auto (follow the OS) → light → dark.
  const schemeRef = useEvent('click', () => setScheme((v) => NEXT_SCHEME[v]));
  // Copy: the theme, or with a brand active the { brand, theme } bundle (the brand is the source; the theme holds hand tuning).
  const copyRef = useEvent('click', () => {
    const theme = { $schema: 'packages/ui-kit/contracts/theme.schema.json', ...themeObject() };
    const out = brand ? { brand: { $schema: 'packages/ui-kit/contracts/brand.schema.json', ...brand }, theme } : theme;
    navigator.clipboard.writeText(JSON.stringify(out, null, 2)).then(() => setStatus(brand ? `Copied brand ${brand.name} and its theme` : 'Copied theme JSON'), () => setStatus('Copy failed'));
  });
  const loadRef = useEvent('click', () => { void loadTheme(); });
  const resetRef = useEvent('click', reset);
  // Random: new generation inputs (hue, chroma, tint, page tones), then the brand and data roles.
  const randomRef = useEvent('click', () => { setSpectrum((cur) => randomSpectrum(cur)); setRoles((cur) => randomRoles(cur, familyNames.accents, familyNames.neutrals)); });

  const pageProps: PageProps = { params, spectrum: generated, voices, faces, typeColors, brand };
  const Content = route === 'components' ? null : PAGES[route];

  const geometry = (
    <Group title="Geometry">
      <Segmented label="Density" value={String(params.density)} onValue={(v) => setParam('density', Number(v))} options={[['0', 'Compact'], ['1', 'Default'], ['2', 'Loose']]} />
      {GEOMETRY.map((k) => {
        const p = PARAMS[k];
        const unsupported = k === 'corner-shape' && !CORNER_SHAPE;
        return <Range key={k} label={p.label} value={params[k]} min={p.min} max={p.max} step={p.step} onValue={(v) => setParam(k, v)} disabled={unsupported} description={unsupported ? 'This browser does not draw corner-shape, so corners stay round.' : undefined} />;
      })}
    </Group>
  );
  const containerRadius = (
    <Group title="Container radius">
      {CONTAINER_RADIUS.map(([k, label]) => <Range key={k} label={label} value={params[k]} min={PARAMS[k].min} max={PARAMS[k].max} step={PARAMS[k].step} onValue={(v) => setParam(k, v)} />)}
    </Group>
  );

  return (
    <div className={s.shell}>
      {/* The panel wears the jig's own brand (public/brand/massimo.scope.css); the canvas shows the theme being tuned. */}
      <aside className={s.panel} aria-label="Jig" data-size="3" data-ui-scope="massimo">
        <header className={s.panelHeader}>
          <div className={s.titleRow}>
            <h1 className={s.brand}>Studio</h1>
            <div className={s.themeSelect}><SelectControl label="Theme" value={themeChoice} options={themeOptions} onValue={(v) => void chooseTheme(v)} /></div>
          </div>
          <Segmented<PanelTab> ariaLabel="Panel" value={tab} onValue={setTab} options={PANEL_TABS} />
        </header>

        {/* One field grid per tab: every group's rows share the label | control | readout columns. */}
        <ui-field-grid className={s.panelBody}>
          {tab === 'brand' && <BrandEditor brand={brand} onBrand={editBrand} />}
          {tab === 'geometry' && geometry}
          {tab === 'geometry' && containerRadius}
          {tab === 'geometry' && (
            <Group title="Elevation">
              <Range label={PARAMS['shadow-strength'].label} value={params['shadow-strength']} min={PARAMS['shadow-strength'].min} max={PARAMS['shadow-strength'].max} step={PARAMS['shadow-strength'].step} onValue={(v) => setParam('shadow-strength', v)} />
              <Range label={PARAMS['surface-contrast'].label} value={params['surface-contrast']} min={PARAMS['surface-contrast'].min} max={PARAMS['surface-contrast'].max} step={PARAMS['surface-contrast'].step} onValue={(v) => setParam('surface-contrast', v)} />
              {(['shadow-raised', 'shadow-floating', 'shadow-modal'] as const).map((k) => (
                <Range key={k} label={PARAMS[k].label} value={params[k]} min={PARAMS[k].min} max={PARAMS[k].max} step={PARAMS[k].step} onValue={(v) => setParam(k, v)} />
              ))}
              <Switch label={PARAMS['card-raised'].label} checked={params['card-raised'] === 1} onValue={(v) => setParam('card-raised', v ? 1 : 0)} />
            </Group>
          )}
          {tab === 'geometry' && (
            <Group title="Look">
              <Select label="Icons" value={icons} options={ICON_SET_NAMES.map((n) => [n, n])} onValue={setIcons} />
            </Group>
          )}
          {tab === 'typography' && (
            <Group title="Typography">
              <Range label="Unit (px)" value={params.unit} min={PARAMS.unit.min} max={PARAMS.unit.max} step={PARAMS.unit.step} onValue={(v) => setParam('unit', v)} />
              <Select label="Ratio" value={String(params['type-ratio'])} options={(TYPE_RATIOS.some(([r]) => r === params['type-ratio']) ? TYPE_RATIOS : [...TYPE_RATIOS, [params['type-ratio'], 'Custom'] as [number, string]]).map(([r, n]) => [String(r), `${r} · ${n}`] as [string, string])} onValue={(v) => setParam('type-ratio', Number(v))} />
              <Segmented label="Rhythm" value={String(params['type-rhythm'])} onValue={(v) => setParam('type-rhythm', Number(v))} options={[['0', 'None'], ['0.5', '½u'], ['1', '1u']]} />
            </Group>
          )}
          {tab === 'typography' && (
            <Group title="Faces">
              {FACES.map((f) => (
                <Select key={f} label={f[0].toUpperCase() + f.slice(1)} value={faces[f]} options={(FACE_STACKS[f].some(([, st]) => st === faces[f]) ? FACE_STACKS[f] : [...FACE_STACKS[f], ['Custom', faces[f]] as [string, string]]).map(([n, st]) => [st, n] as [string, string])} onValue={(v) => setFaces((m) => ({ ...m, [f]: v }))} />
              ))}
            </Group>
          )}
          {tab === 'typography' && (
            <Group title="Text colors">
              {(Object.keys(TYPE_ROLES) as TypeRoleName[]).map((r) => (
                <Select key={r} label={TYPE_ROLES[r].label} value={typeColors[r]} options={(Object.keys(TEXT_COLORS) as TextColor[]).map((c) => [c, c] as [string, string])}
                  onValue={(v) => setTypeColors((m) => ({ ...m, [r]: v as TextColor }))}
                  swatch={(c) => textSwatch(c as TextColor)} />
              ))}
            </Group>
          )}
          {tab === 'typography' && (
            <Group title="Voices">
              {VOICES.map((v) => (
                <Select key={v} label={v === 'ui' ? 'UI' : v[0].toUpperCase() + v.slice(1)} value={voices[v]} options={FACES.map((f) => [f, f] as [string, string])} onValue={(x) => setVoices((m) => ({ ...m, [v]: x as keyof FaceMap }))} />
              ))}
            </Group>
          )}
          {tab === 'geometry' && (
            <Group title="Padding and gap per type (u · px)">
              {/* Column captions; each select's name is "<level> Padding" / "<level> Gap" (labelledby). */}
              <ui-field layout="inline"><div className={s.pair}><span id="level-padding" className={s.levelHead}>Padding</span><span id="level-gap" className={s.levelHead}>Gap</span></div></ui-field>
              {LEVELS.map((level) => {
                const padKey = `pad-${level}` as ParamName, gapKey = `gap-${level}` as ParamName;
                const opts = (key: ParamName) => STEPS.filter((v) => v <= PARAMS[key].max).map((v) => [String(v), `${v}u · ${Math.round(v * params.unit * 10) / 10}`] as [string, string]);
                return (
                  <Field key={level} id={`level-${level}`} label={level}>
                    <div className={s.pair}>
                      <SelectControl labelledby={`level-${level}-field-label level-padding`} value={String(params[padKey])} options={opts(padKey)} onValue={(v) => setParam(padKey, Number(v))} />
                      <SelectControl labelledby={`level-${level}-field-label level-gap`} value={String(params[gapKey])} options={opts(gapKey)} onValue={(v) => setParam(gapKey, Number(v))} />
                    </div>
                  </Field>
                );
              })}
            </Group>
          )}
          {tab === 'motion' && <MotionPanel params={params} setParam={(k, v) => setParam(k as ParamName, v)} />}
          {tab === 'colors' && (
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
                      swatch={(family) => ramp(family, darkNow ? 'dark' : 'light', 9)} />
                  ))}
                </Group>
              ))}
              <Group title="White and black">
                {(['white', 'black'] as const).map((k) => (
                  <Select key={k} label={k === 'white' ? 'White (light ramp)' : 'Black (dark ramp)'} value={String(endpoints[k])}
                    options={[...Array.from({ length: 12 }, (_, i) => [String(i + 1), `Neutral ${i + 1}`] as [string, string]), ['pure', k === 'white' ? 'Pure #fff' : 'Pure #000']]}
                    onValue={(v) => setEndpoints((cur) => ({ ...cur, [k]: v === 'pure' ? 'pure' : Number(v) }))}
                    swatch={(v) => { const c = endpointColor(v === 'pure' ? 'pure' : Number(v), k === 'white' ? 'light' : 'dark'); return pageSwatch(c, c); }} />
                ))}
              </Group>
              <Group title="Generator">
                <Segmented label="Generator" value={spectrum.generator} onValue={(v) => setSpec('generator', v)} options={[['hct', 'HCT'], ['oklch', 'OKLCH']]} />
              </Group>
              <Group title="Hues">
                {spectrum.generator === 'hct' && <Segmented label="Hue set" value={spectrum.hueSet} onValue={(v) => setSpec('hueSet', v)} options={[['quad', 'Unique'], ['radix', 'Radix']]} />}
                <Range label="First hue" value={spectrum.hue} min={0} max={359} step={1} onValue={(v) => setSpec('hue', v)} format={(v) => `${v}°`} />
              </Group>
              <Group title="Chroma">
                {spectrum.generator === 'oklch'
                  ? <Range label="Requested chroma" value={spectrum.oklchChroma} min={0} max={0.37} step={0.005} onValue={(v) => setSpec('oklchChroma', v)} />
                  : <>
                    <Range label="Requested chroma" value={spectrum.chroma} min={4} max={120} step={1} onValue={(v) => setSpec('chroma', v)} />
                    <Range label="Base chroma %" value={spectrum.base} min={0} max={100} step={1} onValue={(v) => setSpec('base', v)} />
                  </>}
                <Range label="Key intensity %" value={spectrum.keyIntensity} min={0} max={300} step={5} onValue={(v) => setSpec('keyIntensity', v)} />
                <Range label="Falloff" value={spectrum.falloff} min={0.2} max={5} step={0.1} onValue={(v) => setSpec('falloff', v)} />
                {spectrum.generator === 'hct' && <Switch label="Hue balance" checked={spectrum.hb === 1} onValue={(v) => setSpec('hb', v ? 1 : 0)} />}
              </Group>
              <Group title="Emphasis">
                <Segmented label="Selection" value={String(params.emphasis)} onValue={(v) => setParam('emphasis', Number(v))} options={[['0', 'Quiet'], ['1', 'Balanced'], ['2', 'Loud']]} />
              </Group>
              <Group title="Contrast">
                {/* The Leonardo model: the page tone per scheme (step 1), then an APCA Lc target per step
                    against it; each step's tone is solved from its target (spectrum contrast.ts). */}
                <Range label="Light page (tone)" value={spectrum.toneMax} min={80} max={100} step={0.5} onValue={(v) => setSpec('toneMax', v)} />
                <Range label="Dark page (tone)" value={spectrum.darkTone} min={0} max={20} step={0.5} onValue={(v) => setSpec('darkTone', v)} />
                <Segmented label="Targets" value={targetScheme} onValue={setTargetScheme} options={[['light', 'Light page'], ['dark', 'Dark page']]} />
                {(() => {
                  const key = targetScheme === 'light' ? 'targetsLight' : 'targetsDark';
                  const targets = spectrum[key] as number[];
                  const tones = stepTones(targetScheme === 'light' ? spectrum.toneMax : spectrum.darkTone, targets, targetScheme);
                  return targets.map((lc, i) => (
                    <Range key={`${targetScheme}-${i}`} label={`Step ${i + 2} (Lc)`} value={lc} min={0} max={TARGET_MAX} step={0.5}
                      format={(v) => `${v} · ${Math.round(tones[i + 1] * 10) / 10}`}
                      onValue={(v) => setSpec(key, targets.map((t, j) => (j === i ? v : t)))} />
                  ));
                })()}
              </Group>
              <Group title="Neutrals and output">
                <Range label="Neutral tint" value={spectrum.tint} min={0} max={100} step={1} onValue={(v) => setSpec('tint', v)} />
                <Segmented label="Gamut" value={spectrum.target} onValue={(v) => setSpec('target', v)} options={[['display-p3', 'P3'], ['srgb', 'sRGB']]} />
              </Group>
            </>
          )}
        </ui-field-grid>

        <footer className={s.footer}>
          <ui-collapsible label={lintSummary}>
            {findings.map((f, i) => <p key={i} className={s.status}><strong>{f.severity}</strong> {f.id}: {f.message}. {f.fix}</p>)}
          </ui-collapsible>
          <p className={s.status} role="status">{status}</p>
          <div className={s.actions}>
            <ui-button ref={copyRef}><i slot="leading" name="copy" />Copy</ui-button>
            <ui-button ref={loadRef}><i slot="leading" name="clipboard-text" />Load</ui-button>
            <ui-button ref={resetRef}>Reset</ui-button>
          </div>
        </footer>
      </aside>

      <div className={s.content}>
        <nav className={s.contentHeader} aria-label="Pages" data-size="3">
          <SelectControl label="Page" value={route} options={ROUTES.map((r) => [r, ROUTE_LABEL[r]])} onValue={(v) => navigate(v as Route)} />
          <div className={s.headerEnd}>
            {route === 'components' && (
              <SelectControl label="Component family" value={family ?? 'all'} options={[['all', 'All families'], ...FAMILIES.map(([f, l]) => [f, l] as [string, string])]}
                onValue={(v) => navigate('components', { family: v === 'all' ? undefined : v })} />
            )}
            <ui-button ref={schemeRef} aria-label={`Color scheme: ${SCHEME_LABEL[scheme]} (switch to ${SCHEME_LABEL[NEXT_SCHEME[scheme]]})`} title={`Scheme: ${SCHEME_LABEL[scheme]}`}>
              <i slot="leading" name={SCHEME_ICON[scheme]} />
            </ui-button>
          </div>
        </nav>
        <div ref={canvasRef} className={s.canvas} data-canvas="" data-icons={icons} {...voiceAttrs} aria-label="Canvas">
          <Suspense fallback={null}>{route === 'components' ? <ComponentsPage {...pageProps} family={family} /> : Content && <Content {...pageProps} />}</Suspense>
        </div>
      </div>
    </div>
  );
}
