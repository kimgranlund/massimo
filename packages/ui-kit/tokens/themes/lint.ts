// Theme lint (contracts/theme-constraints.json): one predicate per rule over a theme object, its
// parameters merged over the defaults and, for the color rules, its generated Spectrum. A rule
// returns the problems it finds (empty when the theme passes it).
import constraints from '../../contracts/theme-constraints.json' with { type: 'json' };
import { defaultParams, type ParamName, type ThemeParams } from './params.ts';
import type { Theme } from './theme.ts';
import { normalizeSpectrum, spectrumOverrides } from '../colors/spectrum/config.ts';
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
  'vibrancy.text-contrast': ({ color }) => {
    const { data, roles } = color();
    const out: string[] = [];
    for (const mode of ['light', 'dark'] as const) for (const role of SCALE_ROLES) {
      const row = data.checks?.[mode].rows[roles[role]];
      if (row && !row.passes.r11) out.push(`${role} (${roles[role]}) text, step 11, is Lc ${fmt(Math.abs(row.roles.r11))} on the ${mode} page`);
    }
    return out;
  },
  'emphasis.on-solid': ({ color }) => {
    const { data, roles } = color();
    const out: string[] = [];
    for (const mode of ['light', 'dark'] as const) for (const role of ['primary', 'critical'] as const) {
      const row = data.checks?.[mode].rows[roles[role]] as any;
      // APCA Lc 60 is the level for UI text (labels at the control font); the engine's own onSolid flag also asks for a ramp color, so it is not used.
      if (row?.roles.onSolid && Math.abs(row.roles.onSolid.lc) < ON_SOLID_LC) out.push(`text on the ${role} solid (${roles[role]} 9) is Lc ${fmt(Math.abs(row.roles.onSolid.lc))} in ${mode}`);
    }
    return out;
  },
};

/** Lint a theme object: every rule's findings, errors first. `ok` is false when any error fires. */
export function lintTheme(theme: Partial<Theme>, opts: { spectrum?: Spectrum; only?: string[] } = {}) {
  const p = { ...defaultParams, ...(theme.parameters ?? {}) } as ThemeParams;
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
