// A brand built for an app (npm run brand -- build): the hydrated theme, its CSS and its font links.
// Load the kit CSS first, then the brand CSS; put the font links in the document head.
import { hydrate, type Brand } from './index.ts';
import { scopeSelector, themeRootCss, themeScopeCss } from '../themes/scope.ts';
import { validateThemeObject, type Theme } from '../themes/theme.ts';

export interface BrandBuild { theme: Theme; css: string; fonts: string; unresolved: string[] }

/** Build a brand: root CSS by default, or scoped to [data-ui-scope="<name>"]. Throws when the hydrated theme is invalid. */
export function buildBrand(brand: Brand, opts: { scope?: boolean } = {}): BrandBuild {
  const { theme, unresolved } = hydrate(brand);
  const v = validateThemeObject(theme);
  if (!v.ok) throw new Error(`${brand.name}: the hydrated theme is invalid: ${v.errors.join('; ')}`);
  const where = opts.scope ? `inside [data-ui-scope="${theme.name}"]` : 'to the document root';
  const css = `/* ${theme.name}: generated from its brand by npm run brand -- build (do not edit; rebuild). Applies ${where}. Load after the kit CSS. */\n`
    + (opts.scope ? themeScopeCss(theme, scopeSelector(theme.name)) : themeRootCss(theme)) + '\n';
  const fonts = ((theme.typography?.sources ?? []).map((x) => `<link rel="stylesheet" href="${x.url}">`).join('\n') || '<!-- no web faces -->') + '\n';
  return { theme, css, fonts, unresolved };
}
