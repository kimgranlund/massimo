// Elevation: how surfaces stack. Six levels, each a fill, a shadow and a layer; the theme tunes the
// shadow strength, how far surface fills move from the page fill, the shadow each lifted level
// casts, and whether cards are raised (docs/specs/elevation.md).
//
// Everything reaches CSS as semantic tokens built on theme variables, so a theme or the jig changes
// elevation without regenerating CSS:
//   colors.elevation.<panel|card|overlay>  the level fill, mixed toward the page fill by surface-contrast
//   shadows.<raised|floating|modal|card>   the level shadow: sm or md by shadow-<level>, × shadow-strength
//   shadows.sm, shadows.md                 the base shadows (also × shadow-strength), for small lifts inside
//                                          components (a selected option, a range thumb)
import { SHADOWS } from '../colors/spectrum/index.ts';

export { SHADOWS };

export type ElevationLevel = 'page' | 'panel' | 'card' | 'raised' | 'floating' | 'modal';
export type Layer = 'inline' | 'floating' | 'top';
export type ShadowName = 'none' | 'sm' | 'md';

/** The stack: what each level is made of at the defaults (shadow-raised 1, -floating 2, -modal 2). */
export const ELEVATION = {
  page:     { level: 0, fill: 'bg',         shadow: 'none', layer: 'inline',   uses: 'ui-page, ui-region, the document' },
  panel:    { level: 1, fill: 'bg.muted',   shadow: 'none', layer: 'inline',   uses: 'ui-panel' },
  card:     { level: 2, fill: 'bg.subtle',  shadow: 'none', layer: 'inline',   uses: 'ui-card (a card in a card takes the page fill)' },
  raised:   { level: 3, fill: 'bg.subtle',  shadow: 'sm',   layer: 'inline',   uses: 'ui-card with card-raised = 1' },
  floating: { level: 4, fill: 'bg.overlay', shadow: 'md',   layer: 'floating', uses: 'popover, preview card, menus, select and combobox popups, navigation menu, toast' },
  modal:    { level: 5, fill: 'bg.overlay', shadow: 'md',   layer: 'top',      uses: 'dialog, alert dialog, drawer (with bg.backdrop behind)' },
} as const satisfies Record<ElevationLevel, { level: number; fill: string; shadow: ShadowName; layer: Layer; uses: string }>;

/** Shadow choice per lifted level: 0 none, 1 sm, 2 md (theme shadow-<level>). */
export const SHADOW_STEPS: readonly ShadowName[] = ['none', 'sm', 'md'];

/**
 * Weights that pick sm or md from a step n ∈ {0, 1, 2} without conditionals, so the choice can be a
 * CSS variable: sm = 1 − (n − 1)², md = n(n − 1) / 2 (n = 0: 0, 0; n = 1: 1, 0; n = 2: 0, 1).
 */
export const shadowWeights = (n: number) => ({ sm: 1 - (n - 1) ** 2, md: (n * (n - 1)) / 2 });
const weightCss = (n: string) => ({ sm: `(1 - (${n} - 1) * (${n} - 1))`, md: `(${n} * (${n} - 1) / 2)` });

const STRENGTH = 'var(--ui-shadow-strength)';

/**
 * Each shadow layer is a per-scheme color token that carries the layer's alpha
 * (colors.shadowLayer.<sm1|md1|md2>: the shadow role at SHADOWS' light or dark alpha), so the shadow
 * tokens themselves are scheme-independent: they scale that alpha with color-mix against
 * transparent (mixing with transparent multiplies the alpha) and depend only on variables.
 */
export const shadowLayerKeys = (name: 'sm' | 'md') => SHADOWS[name].map((_, i) => `${name}${i + 1}`);
type Ref = (layerKey: string) => string;
/** Panda token references (semantic token values) and CSS variables (scope redeclarations). */
export const TOKEN_REF: Ref = (k) => `{colors.shadowLayer.${k}}`;
export const VAR_REF: Ref = (k) => `var(--colors-shadow-layer-${k})`;
const scaled = (color: string, factor: string) => `color-mix(in oklch, ${color} clamp(0%, calc(100% * ${factor}), 100%), transparent)`;
const layers = (name: 'sm' | 'md', ref: Ref, weight = '1') =>
  SHADOWS[name].map((l, i) => `0 ${l.y}px ${l.blur}px ${scaled(ref(`${name}${i + 1}`), `${STRENGTH} * ${weight}`)}`);

/** A base shadow (sm, md) × shadow-strength. */
export const baseShadowCss = (name: 'sm' | 'md', ref: Ref = TOKEN_REF) => layers(name, ref).join(', ');

/**
 * A level shadow: the sm and md layers weighted by the level's step variable (shadow-<level>), all
 * × shadow-strength; `gate` multiplies it once more (card-raised for the card token).
 */
export function levelShadowCss(step: string, gate?: string, ref: Ref = TOKEN_REF) {
  const w = weightCss(step);
  const g = gate ? ` * ${gate}` : '';
  return [...layers('sm', ref, `${w.sm}${g}`), ...layers('md', ref, `${w.md}${g}`)].join(', ');
}

/** A level fill moved toward the page fill: surface-contrast 1 is the level's own fill, 0 the page fill. */
export const surfaceFill = (fillRef: string, pageRef: string) =>
  `color-mix(in oklab, ${fillRef} calc(100% * var(--ui-surface-contrast)), ${pageRef})`;

/** The elevation tokens (shadows and fills), as token values or as CSS variables. */
export function elevationTokens(ref: Ref = TOKEN_REF, color: (path: string) => string = (p) => `{colors.${p}}`) {
  return {
    shadows: {
      sm: baseShadowCss('sm', ref), md: baseShadowCss('md', ref),
      raised: levelShadowCss('var(--ui-shadow-raised)', undefined, ref),
      floating: levelShadowCss('var(--ui-shadow-floating)', undefined, ref),
      modal: levelShadowCss('var(--ui-shadow-modal)', undefined, ref),
      card: levelShadowCss('var(--ui-shadow-raised)', 'var(--ui-card-raised)', ref),
    },
    fills: {
      panel: surfaceFill(color('bg.muted'), color('bg')),
      card: surfaceFill(color('bg.subtle'), color('bg')),
      overlay: surfaceFill(color('bg.overlay'), color('bg')),
    },
  };
}

/**
 * Every elevation variable that reads a theme input. Panda declares them on :root (and per scheme),
 * where --ui-* resolve with the root values; a scope that sets the elevation params for its subtree
 * (the jig canvas) redeclares them, as with unitTokenCss() and motionTokenCss().
 */
export function elevationTokenVars(): Record<string, string> {
  const t = elevationTokens(VAR_REF, (p) => `var(--colors-${p.replace(/\./g, '-').replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()})`);
  return {
    ...Object.fromEntries(Object.entries(t.shadows).map(([k, v]) => [`--shadows-${k}`, v])),
    ...Object.fromEntries(Object.entries(t.fills).map(([k, v]) => [`--colors-elevation-${k}`, v])),
  };
}
export const elevationTokenCss = () => Object.entries(elevationTokenVars()).map(([k, v]) => `${k}: ${v};`).join('\n  ');

/** The resolved shadow of a level at given theme values (reference numbers for docs and tests). */
export function levelShadow(level: ElevationLevel, p: { 'shadow-raised': number; 'shadow-floating': number; 'shadow-modal': number; 'card-raised': number }): ShadowName {
  if (level === 'raised') return SHADOW_STEPS[p['shadow-raised']];
  if (level === 'floating') return SHADOW_STEPS[p['shadow-floating']];
  if (level === 'modal') return SHADOW_STEPS[p['shadow-modal']];
  if (level === 'card') return p['card-raised'] ? SHADOW_STEPS[p['shadow-raised']] : 'none';
  return 'none';
}
