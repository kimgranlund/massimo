// Elevation: how surfaces stack. Six levels, each a fill, a shadow and a layer; the theme tunes the
// shadow strength, how far surface fills move from the page fill, each lifted level's elevation in
// dp, and whether cards are raised (docs/specs/elevation.md).
//
// Everything reaches CSS as semantic tokens built on theme variables, so a theme or the jig changes
// elevation without regenerating CSS:
//   colors.elevation.<panel|card|overlay>  the level fill, mixed toward the page fill by surface-contrast
//   shadows.<raised|floating|modal|card>   the compound shadow at the level's elevation (shadow-<level>, dp)
//   shadows.sm, shadows.md                 base shadows (1dp, 3dp) for small lifts inside components
//   colors.shadowLayer.<umbra|penumbra|ambient>  each layer's color: the shadow role at its scheme alpha
import { SHADOW_DP, SHADOW_LAYERS, SHADOWS, shadowAt, type ShadowLayer } from '../colors/spectrum/index.ts';

export { SHADOWS, SHADOW_DP, SHADOW_LAYERS, shadowAt };

export type ElevationLevel = 'page' | 'panel' | 'card' | 'raised' | 'floating' | 'modal';
export type Layer = 'inline' | 'floating' | 'top';

/** The stack at the defaults: each level's fill, its elevation in dp (shadow-raised 2, -floating 8, -modal 24) and its layer. */
export const ELEVATION = {
  page:     { level: 0, fill: 'bg',         dp: 0,  layer: 'inline',   uses: 'the document; the page and region presets' },
  panel:    { level: 1, fill: 'bg.muted',   dp: 0,  layer: 'inline',   uses: 'the panel preset; surface="panel"' },
  card:     { level: 2, fill: 'bg.subtle',  dp: 0,  layer: 'inline',   uses: 'the card preset; surface="card" (a card in a card takes the page fill)' },
  raised:   { level: 3, fill: 'bg.subtle',  dp: 2,  layer: 'inline',   uses: 'surface="raised"; every card when card-raised is 1' },
  floating: { level: 4, fill: 'bg.overlay', dp: 8,  layer: 'floating', uses: 'popover, preview card, menus, select and combobox popups, navigation menu, toast' },
  modal:    { level: 5, fill: 'bg.overlay', dp: 24, layer: 'top',      uses: 'dialog, alert dialog, drawer (with bg.backdrop behind)' },
} as const satisfies Record<ElevationLevel, { level: number; fill: string; dp: number; layer: Layer; uses: string }>;

const STRENGTH = 'var(--ui-shadow-strength)';
type Ref = (layer: string) => string;
/** Panda token references (semantic token values) and CSS variables (scope redeclarations). */
export const TOKEN_REF: Ref = (k) => `{colors.shadowLayer.${k}}`;
export const VAR_REF: Ref = (k) => `var(--colors-shadow-layer-${k})`;
// Mixing with transparent multiplies the layer color's alpha (the scheme alpha) by the factor.
const scaled = (color: string, factor: string) => `color-mix(in oklch, ${color} clamp(0%, calc(100% * ${factor}), 100%), transparent)`;

/**
 * A compound shadow at elevation `e` (a number or a CSS expression in dp): umbra, penumbra and
 * ambient, each offset, blurred and spread by its px-per-dp coefficients, its alpha × shadow-strength
 * (and `gate`, e.g. card-raised), and × min(1, e) so 0dp casts nothing.
 */
export function compoundShadowCss(e: number | string, ref: Ref = TOKEN_REF, gate?: string) {
  const E = String(e);
  const factor = `${STRENGTH} * min(1, ${E})${gate ? ` * ${gate}` : ''}`;
  return (Object.entries(SHADOW_LAYERS) as [ShadowLayer, (typeof SHADOW_LAYERS)[ShadowLayer]][]).map(([k, l]) =>
    `0 calc(${l.y} * ${E} * 1px) calc(${l.blur} * ${E} * 1px) calc(${l.spread} * ${E} * 1px) ${scaled(ref(k), factor)}`).join(', ');
}

/** A level fill moved toward the page fill: surface-contrast 1 is the level's own fill, 0 the page fill. */
export const surfaceFill = (fillRef: string, pageRef: string) =>
  `color-mix(in oklab, ${fillRef} calc(100% * var(--ui-surface-contrast)), ${pageRef})`;

/** The elevation tokens (shadows and fills), as token values or as CSS variables. */
export function elevationTokens(ref: Ref = TOKEN_REF, color: (path: string) => string = (p) => `{colors.${p}}`) {
  return {
    shadows: {
      sm: compoundShadowCss(SHADOW_DP.sm, ref), md: compoundShadowCss(SHADOW_DP.md, ref),
      raised: compoundShadowCss('var(--ui-shadow-raised)', ref),
      floating: compoundShadowCss('var(--ui-shadow-floating)', ref),
      modal: compoundShadowCss('var(--ui-shadow-modal)', ref),
      card: compoundShadowCss('var(--ui-shadow-raised)', ref, 'var(--ui-card-raised)'),
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

