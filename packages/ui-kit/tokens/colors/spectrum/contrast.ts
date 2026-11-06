// Contrast-targeted ramps (the Leonardo model): each step's tone is solved from a contrast target
// against the page, per scheme. Step 1 is the page itself (the light or dark page tone); steps 2–12
// take APCA Lc targets. The engine still decides hue, chroma, gamut and neutrals; only where each
// step sits in lightness comes from here (index.ts passes the tones through the engine's tone map).

/** Relative luminance from an HCT tone (CIE L*). */
export const luminance = (tone: number) => (tone > 8 ? ((tone + 16) / 116) ** 3 : tone / 903.2963);

/**
 * APCA Lc magnitude of a tone against a background tone, achromatic and without APCA's low-contrast
 * clamp (so it stays monotonic down to the faintest surface steps).
 */
export function apcaLc(textTone: number, bgTone: number) {
  const clamp = (y: number) => (y > 0.022 ? y : y + (0.022 - y) ** 1.414);
  const yt = clamp(luminance(textTone)), yb = clamp(luminance(bgTone));
  return Math.abs(yb > yt ? (yb ** 0.56 - yt ** 0.57) * 114 : (yb ** 0.65 - yt ** 0.62) * 114);
}

/** The tone reaching `lc` against the page: darker than a light page, lighter than a dark one (bisection). */
export function toneForLc(page: number, lc: number, mode: 'light' | 'dark') {
  let lo = mode === 'light' ? 0 : page, hi = mode === 'light' ? page : 100;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2, c = apcaLc(mid, page);
    // Light: contrast grows as the tone falls; dark: as it rises.
    if (mode === 'light' ? c > lc : c < lc) lo = mid; else hi = mid;
  }
  return (lo + hi) / 2;
}

/** The 12 step tones of a scheme: the page, then one tone per target (steps 2–12), kept strictly ordered. */
export function stepTones(page: number, targets: readonly number[], mode: 'light' | 'dark') {
  const tones = [page, ...targets.map((lc) => toneForLc(page, lc, mode))];
  for (let i = 1; i < tones.length; i++) {
    const min = 0.01;
    if (mode === 'light' ? tones[i] > tones[i - 1] - min : tones[i] < tones[i - 1] + min) tones[i] = tones[i - 1] + (mode === 'light' ? -min : min);
  }
  return tones;
}

/** The least Lc between step 9 and step 8, and between step 9 and step 12, when depth moves the run. */
const DEPTH_GAP = { base: 1, top: 6 };
/**
 * Targets with the run of steps 9–12 moved by `depth`, in Lc at step 9: positive is a darker solid in
 * both schemes, which is where the gamut has room for more chroma. Step 12 stays and steps 10–11 follow
 * in proportion. Steps 2–8 don't move, so step 8 is the limit toward the page.
 */
export function deepenKeys(targets: readonly number[], depth: number, mode: 'light' | 'dark') {
  const t8 = targets[6], t9 = targets[7], t12 = targets[10], want = t9 + (mode === 'light' ? depth : -depth);
  const moved = Math.min(Math.max(want, t8 + DEPTH_GAP.base), t12 - DEPTH_GAP.top);
  return targets.map((t, i) => (i < 7 ? t : moved + ((t - t9) * (t12 - moved)) / (t12 - t9)));
}

/**
 * Default targets (steps 2–12, APCA Lc against the page): measured from the even 12-step ramp the
 * kit used before (page 97.5 / 5, peak 62), so the default palette is unchanged.
 */
export const DEFAULT_TARGETS = {
  light: [7.3, 14.3, 21.2, 27.8, 34.2, 40.4, 46.3, 52.1, 63.6, 74, 85.7],
  dark: [3.4, 7.3, 12.4, 18.2, 24.9, 32.3, 40.4, 49.3, 57.3, 65.7, 77.1],
} as const;
export const TARGET_MAX = 108;
