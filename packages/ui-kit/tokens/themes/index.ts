// Named themes: stored as parameter overrides in themes.json and emitted as
// `:root[data-ui-theme="<name>"]` blocks. Apply one with the attribute on <html>.
// Root only: the color and size tokens are declared on :root, and a custom property
// resolves its var() references where it is declared, so parameters set on a nested
// element would not re-derive them. Isolate a themed preview in its own document (iframe).
import saved from './themes.json' with { type: 'json' };
import { defaultParams, paramVar, type ParamName } from './params.ts';
import { THEME_NAME, type ThemeOverrides } from './validate.ts';

export * from './params.ts';
export * from './validate.ts';

export const savedThemes = saved as Record<string, ThemeOverrides>;

// Numeric parameters become CSS variables; `icons` is read by the icon runtime instead.
const toVars = (p: ThemeOverrides) =>
  Object.fromEntries(Object.entries(p).filter(([, v]) => typeof v === 'number').map(([k, v]) => [paramVar(k as ParamName), String(v)]));

/** Global CSS: defaults on :root, then one block per saved theme. */
export function themeCss(themes: Record<string, ThemeOverrides> = savedThemes) {
  const css: Record<string, Record<string, string>> = { ':root': toVars(defaultParams) };
  for (const [name, p] of Object.entries(themes)) if (THEME_NAME.test(name)) css[`:root[data-ui-theme="${name}"]`] = toVars(p);
  return css;
}
