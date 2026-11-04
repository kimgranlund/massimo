// Theme lint (contracts/theme-constraints.json): one predicate per rule over a theme object, its
// parameters merged over the defaults and, for the color rules, its generated Spectrum. A rule
// returns the problems it finds (empty when the theme passes it).
import constraints from '../../contracts/theme-constraints.json' with { type: 'json' };
import { defaultParams, type ParamName, type ThemeParams } from './params.ts';
import { themeParameters, type Theme } from './theme.ts';
import { SPECTRUM_FIELDS, normalizeSpectrum, spectrumOverrides } from '../colors/spectrum/config.ts';
import { generateSpectrum, resolveRoles, SCALE_ROLES, type Spectrum, type Roles } from '../colors/spectrum/index.ts';
import { densityInset } from '../geometry/resolve.ts';
import { SPRING_NAMES } from '../motion/index.ts';

export type Severity = 'error' | 'warning' | 'info';
export interface Finding { id: string; concept: string; severity: Severity; message: string; fix: string }
interface Ctx { p: ThemeParams; theme: Partial<Theme>; color: () => { data: Spectrum; roles: Roles } }
type Rule = (c: Ctx) => string[];

export const THEME_CONSTRAINTS = constraints.rules as Record<string, { concept: string; severity: Severity; checks: string; fix: string; fixtures: { fail: unknown; pass: unknown } }>;

const SPRING = (n: number) => SPRING_NAMES[Math.max(0, Math.min(SPRING_NAMES.length - 1, Math.round(n)))];
/** APCA Lc for text on a solid fill (button labels, danger actions). */
export const ON_SOLID_LC = 60;
/** The tone settings a theme changed (the likely cause of a contrast finding), as "; changed: Light endpoint 89 (default 97.5)". */
const TONE_KEYS = ['toneMax', 'darkTone', 'targetsLight', 'targetsDark', 'ptAuto', 'pt', 'chroma', 'base', 'falloff', 'hueSet', 'mat', 'tint'];
function changedTones(theme: Partial<Theme>) {
  const s = theme.color?.spectrum ?? {};
  const rows = SPECTRUM_FIELDS.filter((f) => TONE_KEYS.includes(f.key) && f.key in s && JSON.stringify(s[f.key]) !== JSON.stringify(f.value))
    .map((f) => f.list ? `${f.label.replace(/ \(.*\)$/, '')}` : `${f.label} ${f.labels && f.options ? f.labels[f.options.indexOf(s[f.key])] ?? s[f.key] : s[f.key]} (default ${f.labels && f.options ? f.labels[f.options.indexOf(f.value as never)] ?? f.value : f.value})`);
  return rows.length ? `; changed from the defaults: ${rows.join(', ')}` : '';
}
/** "Lc 40.4" or "Lc 40.4–57.2". */
const range = (lcs: number[]) => { const lo = Math.min(...lcs), hi = Math.max(...lcs); return fmt(lo) === fmt(hi) ? `Lc ${fmt(lo)}` : `Lc ${fmt(lo)}–${fmt(hi)}`; };
/** "primary (indigo), critical (crimson)". */
const list = (rows: { role: string; family: string }[]) => rows.map((r) => `${r.role} (${r.family})`).join(', ');
const fmt = (n: number) => String(Math.round(n * 100) / 100);

export const RULES: Record<string, Rule> = {
  'scale.target-size': ({ p }) => {
    const h = (6 + 2 * densityInset(p.density)) * p.unit;
    return h < 24 ? [`controls are ${fmt(h)}px tall at the root, below the 24px target size`] : [];
  },
  'density.compact-border': ({ p }) => {
    const b = Math.min(p.border, p.unit / 2);
    return p.density === 0 && b > 0.25 * p.unit ? [`a ${b}px border at compact density (inset ${fmt(0.5 * p.unit)}px) makes one-row composites grow`] : [];
  },
  'elevation.surfaces-visible': ({ p }) =>
    p['surface-contrast'] === 0 && !(p['card-raised'] === 1 && p['shadow-raised'] > 0) ? ['panels and cards take the page fill and cast no shadow, so they vanish'] : [],
  'elevation.floating-visible': ({ p }) =>
    p['shadow-floating'] === 0 && p.border === 0 ? ['floating surfaces have no shadow and no border, so menus and popovers blend into the page'] : [],
  'elevation.modal-shadow': ({ p }) => (p['shadow-modal'] === 0 ? ['modal surfaces cast no shadow; only the backdrop separates them'] : []),
  'movement.reveal-bounce': ({ p }) => {
    const spring = SPRING(p['intent-reveal']);
    const bounce = p[`spring-${spring}-bounce` as ParamName] * p['motion-bounce'];
    return bounce > 0.1 ? [`the reveal intent runs ${spring} at bounce ${fmt(bounce)}, so popups and dialogs overshoot as they open`] : [];
  },
  'movement.feedback-fast': ({ p }) => {
    const spring = SPRING(p['intent-feedback']);
    const d = p[`spring-${spring}-duration` as ParamName] * p['motion-scale'];
    return d > 0.3 ? [`hover and press feedback takes ${fmt(d)}s (${spring} × motion-scale), past 0.3s`] : [];
  },
  'curvature.pill-containers': ({ p }) =>
    p['radius-scale'] >= 2 && p['radius-card'] > 0.75 ? [`radius-scale ${p['radius-scale']} with radius-card ${p['radius-card']} makes short cards near pills`] : [],
  // One finding per scheme, listing the roles, so a palette-wide problem reads as one line.
  'vibrancy.text-contrast': ({ color, theme }) => {
    const { data, roles } = color();
    const out: string[] = [];
    for (const mode of ['light', 'dark'] as const) {
      const low = SCALE_ROLES.flatMap((role) => {
        const row = data.checks?.[mode].rows[roles[role]];
        return row && !row.passes.r11 ? [{ role, family: roles[role], lc: Math.abs(row.roles.r11) }] : [];
      });
      if (low.length) out.push(`step 11 text is ${range(low.map((l) => l.lc))} on the ${mode} page for ${list(low)}${changedTones(theme)}`);
    }
    return out;
  },
  'emphasis.on-solid': ({ color }) => {
    const { data, roles } = color();
    const out: string[] = [];
    for (const mode of ['light', 'dark'] as const) {
      // APCA Lc 60 is the level for UI text (labels at the control font); the engine's own onSolid flag also asks for a ramp color, so it is not used.
      const low = (['primary', 'critical'] as const).flatMap((role) => {
        const lc = Math.abs((data.checks?.[mode].rows[roles[role]] as any)?.roles.onSolid?.lc ?? Infinity);
        return lc < ON_SOLID_LC ? [{ role, family: roles[role], lc }] : [];
      });
      if (low.length) out.push(`text on the solid (step 9) is ${range(low.map((l) => l.lc))} in ${mode} for ${list(low)}`);
    }
    return out;
  },
};

/** Lint a theme object: every rule's findings, errors first. `ok` is false when any error fires. */
export function lintTheme(theme: Partial<Theme>, opts: { spectrum?: Spectrum; only?: string[] } = {}) {
  const p = { ...defaultParams, ...themeParameters(theme) } as ThemeParams;
  let color: { data: Spectrum; roles: Roles } | undefined;
  const ctx: Ctx = {
    p, theme,
    color: () => (color ??= (() => {
      const data = opts.spectrum ?? generateSpectrum(spectrumOverrides(normalizeSpectrum(theme.color?.spectrum ?? {})));
      return { data, roles: resolveRoles(data, theme.color?.roles ?? {}) };
    })()),
  };
  const order: Record<Severity, number> = { error: 0, warning: 1, info: 2 };
  const findings: Finding[] = [];
  for (const [id, rule] of Object.entries(RULES)) {
    if (opts.only && !opts.only.includes(id)) continue;
    const meta = THEME_CONSTRAINTS[id];
    for (const message of rule(ctx)) findings.push({ id, concept: meta.concept, severity: meta.severity, message, fix: meta.fix });
  }
  findings.sort((a, b) => order[a.severity] - order[b.severity]);
  return { ok: !findings.some((f) => f.severity === 'error'), findings };
}
