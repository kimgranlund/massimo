// Theme validation with no dependency on the saved themes file, so tools (the studio's
// dev server) can validate without importing themes.json.
import { PARAMS, defaultParams, type ParamName, type ThemeParams } from './params.ts';
import { ICON_SET_NAME } from '../../icons/sets.ts';

/** Numeric parameter overrides, plus the icon set the theme uses. */
export type ThemeOverrides = Partial<ThemeParams> & { icons?: string };

export const THEME_NAME = /^[a-z][a-z0-9-]{0,39}$/;

/** Validate untrusted theme data. Only known parameters with finite in-range numbers pass. */
export function validateTheme(name: unknown, params: unknown): { ok: true; name: string; params: ThemeOverrides } | { ok: false; error: string } {
  if (typeof name !== 'string' || !THEME_NAME.test(name)) return { ok: false, error: 'name must match ' + THEME_NAME };
  if (!params || typeof params !== 'object' || Array.isArray(params)) return { ok: false, error: 'params must be an object' };
  const out: ThemeOverrides = {};
  for (const [k, v] of Object.entries(params)) {
    if (k === 'icons') {
      if (typeof v !== 'string' || !ICON_SET_NAME.test(v)) return { ok: false, error: 'icons must be an icon set name' };
      out.icons = v;
      continue;
    }
    const spec = PARAMS[k as ParamName];
    if (!spec) return { ok: false, error: `unknown parameter ${k}` };
    if (typeof v !== 'number' || !Number.isFinite(v) || v < spec.min || v > spec.max) return { ok: false, error: `${k} must be a number in ${spec.min}..${spec.max}` };
    out[k as ParamName] = v;
  }
  return { ok: true, name, params: out };
}

/** Parameters that differ from the defaults; what gets saved for a theme. */
export const diffFromDefaults = (p: ThemeParams): ThemeOverrides =>
  Object.fromEntries(Object.entries(p).filter(([k, v]) => v !== defaultParams[k as ParamName])) as ThemeOverrides;
