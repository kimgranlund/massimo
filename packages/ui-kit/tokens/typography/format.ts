// formatNumber: Intl.NumberFormat with the typographic details the numeric voice expects.
// - Negatives (and negative exponents) use U+2212 MINUS SIGN, not the hyphen-minus.
// - Where the locale puts a space between a number and its unit, currency, percent sign or
//   compact suffix, it becomes U+202F NARROW NO-BREAK SPACE (never breaks, sits tight).
// - Scientific and engineering notation read as `6.02 × 10²³`, not `6.02E23`; formatNumberParts
//   returns the exponent as its own part for a <sup>.
// - Grouping: the locale's separator, the SI narrow no-break space, a thin space, or none.
// Pure functions, no DOM: usable in elements, React and scripts alike.

export type NumberPartType = Intl.NumberFormatPartTypes | 'times' | 'base' | 'exponent';
export interface NumberPart { type: NumberPartType; value: string }

export interface FormatNumberOptions extends Omit<Intl.NumberFormatOptions, 'useGrouping'> {
  /** BCP 47 locale(s); default the runtime's. */
  locale?: string | string[];
  /** U+2212 for negatives and negative exponents (default true). */
  minus?: boolean;
  /** Group separator: the locale's (default), 'narrow' U+202F (SI), 'thin' U+2009, or 'none'. */
  grouping?: 'locale' | 'narrow' | 'thin' | 'none';
  /** Space before a unit, currency, percent sign or compact suffix, where the locale has one: U+202F (default) or the locale's own. */
  unitSpace?: 'narrow' | 'locale';
  /** Scientific / engineering exponent: `× 10ⁿ` (default) or the locale's `E` form. */
  exponent?: 'times' | 'e';
}

export const MINUS = '−';
export const NARROW_NBSP = ' ';
export const THIN_SPACE = ' ';
/** Multiplication sign with narrow no-break spaces: `6.02 × 10²³` stays on one line. */
export const TIMES = `${NARROW_NBSP}×${NARROW_NBSP}`;

const SUPERSCRIPT: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻', [MINUS]: '⁻', '+': '⁺' };
/** Superscript digits and signs (other characters pass through). */
export const superscript = (s: string) => [...s].map((c) => SUPERSCRIPT[c] ?? c).join('');

const SPACE = /^[\s  ]+$/;
const UNITISH = new Set<NumberPartType>(['unit', 'currency', 'percentSign', 'compact']);

/** Formatted parts: Intl's, plus `times`, `base` and `exponent` (plain digits, for a <sup>). */
export function formatNumberParts(value: number | bigint, options: FormatNumberOptions = {}): NumberPart[] {
  const { locale, minus = true, grouping = 'locale', unitSpace = 'narrow', exponent = 'times', ...intl } = options;
  const nf = new Intl.NumberFormat(locale, { ...intl, useGrouping: grouping === 'none' ? false : undefined } as Intl.NumberFormatOptions);
  const raw = nf.formatToParts(value as number) as NumberPart[];
  const out: NumberPart[] = [];
  for (let i = 0; i < raw.length; i++) {
    const p = raw[i];
    if (p.type === 'minusSign' && minus) { out.push({ type: p.type, value: MINUS }); continue; }
    if (p.type === 'group' && (grouping === 'narrow' || grouping === 'thin')) { out.push({ type: p.type, value: grouping === 'narrow' ? NARROW_NBSP : THIN_SPACE }); continue; }
    if (p.type === 'literal' && unitSpace === 'narrow' && SPACE.test(p.value) && (UNITISH.has(raw[i - 1]?.type) || UNITISH.has(raw[i + 1]?.type))) {
      out.push({ type: p.type, value: NARROW_NBSP }); continue;
    }
    if (p.type === 'exponentSeparator' && exponent === 'times') {
      // Fold the separator, sign and digits into × 10 + one exponent part.
      let exp = '';
      while (raw[i + 1] && (raw[i + 1].type === 'exponentMinusSign' || raw[i + 1].type === 'exponentInteger')) {
        const q = raw[++i];
        exp += q.type === 'exponentMinusSign' ? (minus ? MINUS : q.value) : q.value;
      }
      out.push({ type: 'times', value: TIMES }, { type: 'base', value: '10' }, { type: 'exponent', value: exp });
      continue;
    }
    if (p.type === 'exponentMinusSign' && minus) { out.push({ type: p.type, value: MINUS }); continue; }
    out.push(p);
  }
  return out;
}

/** The formatted string; the exponent in superscript digits (`6.02 × 10²³`). */
export function formatNumber(value: number | bigint, options: FormatNumberOptions = {}): string {
  return formatNumberParts(value, options).map((p) => p.type === 'exponent' ? superscript(p.value) : p.value).join('');
}

// Fractions: a mixed number from the nearest fraction with a denominator up to maxDenominator.
const VULGAR: Record<string, string> = {
  '1/2': '½', '1/3': '⅓', '2/3': '⅔', '1/4': '¼', '3/4': '¾', '1/5': '⅕', '2/5': '⅖', '3/5': '⅗', '4/5': '⅘',
  '1/6': '⅙', '5/6': '⅚', '1/7': '⅐', '1/8': '⅛', '3/8': '⅜', '5/8': '⅝', '7/8': '⅞', '1/9': '⅑', '1/10': '⅒',
};
export const FRACTION_SLASH = '⁄';

export interface FormatFractionOptions {
  /** Largest denominator tried (default 16). */
  maxDenominator?: number;
  /** Use a precomposed character (½, ¾) where Unicode has one (default true). */
  vulgar?: boolean;
  /** U+2212 for negatives (default true). */
  minus?: boolean;
}

/**
 * A mixed number: `1¾`, or `2 5⁄16` with U+2044 FRACTION SLASH (which `data-numeric="fraction"`
 * turns into a built-up fraction where the face has `frac`) and a narrow no-break space before it.
 */
export function formatFraction(value: number, options: FormatFractionOptions = {}): string {
  const { maxDenominator = 16, vulgar = true, minus = true } = options;
  const sign = value < 0 ? (minus ? MINUS : '-') : '';
  const abs = Math.abs(value);
  let whole = Math.floor(abs), frac = abs - whole, best = [0, 1], err = frac;
  for (let d = 1; d <= maxDenominator; d++) {
    const n = Math.round(frac * d), e = Math.abs(frac - n / d);
    if (e < err - 1e-12) { best = [n, d]; err = e; }
  }
  let [n, d] = best;
  if (n === d) { whole += 1; n = 0; }
  if (n === 0) return `${sign}${whole}`;
  const key = `${n}/${d}`;
  const f = vulgar && VULGAR[key] ? VULGAR[key] : `${n}${FRACTION_SLASH}${d}`;
  if (whole === 0) return `${sign}${f}`;
  return `${sign}${whole}${f.includes(FRACTION_SLASH) ? NARROW_NBSP : ''}${f}`;
}
