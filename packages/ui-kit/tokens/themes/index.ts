// Named themes: stored as parameter overrides in themes.json and emitted as
// `:root[data-ui-theme="<name>"]` blocks. Apply one with the attribute on <html>.
// Root only: the color and size tokens are declared on :root, and a custom property
// resolves its var() references where it is declared, so parameters set on a nested
// element would not re-derive them. Isolate a themed preview in its own document (iframe).
import saved from './themes.json' with { type: 'json' };
import { defaultParams, paramVar, type ParamName } from './params.ts';
import { THEME_NAME } from './validate.ts';
import type { Theme } from './theme.ts';
import { normalizeSpectrum, spectrumOverrides } from '../colors/spectrum/config.ts';
import { endpointVars, generateSpectrum, ramps, resolveRoles, roleVariables } from '../colors/spectrum/index.ts';
import { SERIF_REGULAR_VOICES, type Voice } from '../typography/resolve.ts';

export * from './params.ts';
export * from './validate.ts';
export * from './theme.ts';
export * from './lint.ts';

/** Saved themes (themes.json): theme objects keyed by name (validateThemeObject, test/themes.test.ts). */
export const savedThemes = saved as Record<string, Theme>;

// Numeric parameters become CSS variables; `icons` is read by the icon runtime instead.
const toVars = (p: Partial<Record<ParamName, number>>) =>
  Object.fromEntries(Object.entries(p).filter(([, v]) => typeof v === 'number').map(([k, v]) => [paramVar(k as ParamName), String(v)]));

/** A theme's declarations that need no color engine: parameters, faces and voices. */
export function themeVars(t: Theme): Record<string, string> {
  const out: Record<string, string> = { ...toVars(t.parameters ?? {}) };
  for (const [face, stack] of Object.entries(t.typography?.faces ?? {})) out[`--fonts-${face}`] = stack!;
  for (const [voice, face] of Object.entries(t.typography?.voices ?? {})) {
    out[`--font-voice-${voice}`] = `var(--fonts-${face})`;
    if (SERIF_REGULAR_VOICES.has(voice as Voice)) out[`--font-voice-${voice}-weight`] = face === 'serif' ? '400' : 'initial';
  }
  return out;
}

/**
 * A theme's colors, when it sets any: the Spectrum ramps and roles per scheme, generated at build
 * time, as variables for the light and dark blocks.
 */
export function themeColorVars(t: Theme): { light: Record<string, string>; dark: Record<string, string> } | undefined {
  if (!t.color?.spectrum && !t.color?.roles && !t.color?.endpoints) return undefined;
  const data = generateSpectrum(spectrumOverrides(normalizeSpectrum(t.color.spectrum ?? {})));
  const roles = resolveRoles(data, t.color.roles ?? {});
  const vars = (mode: 'light' | 'dark') => ({
    ...Object.fromEntries(Object.entries(ramps(data, mode)).flatMap(([name, steps]) => steps.map((css, i) => [`--colors-spectrum-${name}-${i + 1}`, css]))),
    ...roleVariables(data, roles, mode),
    ...endpointVars(data, roles, t.color?.endpoints),
  });
  return { light: vars('light'), dark: vars('dark') };
}

/**
 * Global CSS: defaults on :root, then per saved theme a `:root[data-ui-theme="<name>"]` block (its
 * parameters, faces and voices; its colors in light, with `.light` / `.dark` on the root and the OS
 * scheme for dark).
 */
export function themeCss(themes: Record<string, Theme> = savedThemes) {
  const css: Record<string, any> = { ':root': toVars(defaultParams) };
  const dark: Record<string, Record<string, string>> = {};
  for (const [name, t] of Object.entries(themes)) {
    if (!THEME_NAME.test(name)) continue;
    const sel = `:root[data-ui-theme="${name}"]`;
    const colors = themeColorVars(t);
    css[sel] = { ...themeVars(t), ...(colors?.light ?? {}) };
    if (colors) {
      css[`${sel}.light`] = colors.light;
      css[`${sel}.dark`] = colors.dark;
      dark[`${sel}:not(.light)`] = colors.dark;
    }
  }
  if (Object.keys(dark).length) css['@media (prefers-color-scheme: dark)'] = dark;
  return css;
}
