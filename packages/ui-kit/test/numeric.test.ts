import { test } from 'node:test';
import assert from 'node:assert/strict';
import { NUMERIC_FEATURES, NUMERIC_POSITIONS, NUMERIC_VARIANTS, TYPE_ROLES, numericStyle } from '../tokens/typography/resolve.ts';
import { textStyles, typography, voiceFamily, NUMERIC_COMPOSED, numericProperties } from '../styles/typography.ts';
import { numeric } from '../styles/numeric.ts';
import { formatFraction, formatNumber, formatNumberParts, superscript, MINUS, NARROW_NBSP, TIMES } from '../tokens/typography/format.ts';

type Rule = Record<string, string>;
const rules = typography as unknown as Record<string, Rule>;

// A small var() resolver: what a browser computes for a declaration, given the custom properties
// in scope at the element. Enough to follow the numeric contract through the cascade.
function resolve(value: string, env: Record<string, string>): string {
  let out = value, prev = '';
  while (out !== prev) {
    prev = out;
    out = out.replace(/var\((--[\w-]+)\s*(?:,((?:[^()]|\((?:[^()]|\([^()]*\))*\))*))?\)/, (_, name: string, fb?: string) => env[name] ?? (fb !== undefined ? fb.trim() : `‹${name}›`));
  }
  return out.replace(/\s+/g, ' ').trim();
}
/** Custom properties an element gets from the global rules whose selectors it matches. */
const envFor = (...selectors: string[]) => Object.assign({}, ...selectors.map((s) => Object.fromEntries(Object.entries(rules[s]).filter(([k]) => k.startsWith('--')))));

test('numeric: bare data-numeric is tabular lining figures', () => {
  assert.equal(NUMERIC_FEATURES, 'tabular-nums lining-nums');
  assert.deepEqual(numericStyle(), { fontVariantNumeric: 'tabular-nums lining-nums' });
  assert.equal(resolve(rules['[data-numeric]'].fontVariantNumeric, envFor('[data-numeric]')), 'tabular-nums lining-nums');
});

test('numeric: a type role plus data-numeric takes the numeric voice (role classes sit in a higher layer)', () => {
  const numericFamily = resolve(voiceFamily('numeric'), {});
  assert.equal(numericFamily, '‹--fonts-controls›', 'numeric follows ui (the controls face)');
  assert.equal(resolve(voiceFamily('heading'), {}), '‹--fonts-sans›');
  for (const [role, r] of Object.entries(TYPE_ROLES)) {
    const family = (textStyles as unknown as Record<string, { value: Rule }>)[role].value.fontFamily;
    // On its own the role keeps its voice ...
    assert.equal(resolve(family, {}), resolve(voiceFamily(r.voice), {}), `${role} alone`);
    // ... with data-numeric on the same element, the role's own declaration resolves to the
    // numeric voice, whatever layer the role is in.
    assert.equal(resolve(family, envFor('[data-numeric]')), resolve(voiceFamily('numeric'), {}), `${role} + data-numeric`);
    assert.equal(resolve(rules[`[data-type="${role}"]`].fontFamily, envFor('[data-numeric]')), resolve(voiceFamily('numeric'), {}), `data-type=${role} + data-numeric`);
  }
  // A repointed numeric voice reaches the role too.
  const repointed = envFor('[data-font-numeric="mono"]', '[data-numeric]');
  assert.equal(resolve(rules['[data-numeric]']['--ui-numeric-family'], repointed), '‹--fonts-mono›');
  assert.equal(resolve((textStyles as unknown as Record<string, { value: Rule }>)['heading-1'].value.fontFamily, { ...repointed, '--ui-numeric-family': resolve(rules['[data-numeric]']['--ui-numeric-family'], repointed) }), '‹--fonts-mono›');
});

test('numeric: variant tokens compose per axis, matching numericStyle()', () => {
  const combos = ['oldstyle', 'proportional', 'fraction', 'stacked-fraction slashed-zero', 'oldstyle fraction slashed-zero ordinal', 'proportional oldstyle', 'tabular proportional', 'bogus'];
  for (const combo of combos) {
    const tokens = combo.split(' ');
    const sels = ['[data-numeric]', ...tokens.filter((t) => t in NUMERIC_VARIANTS).map((t) => `[data-numeric~="${t}"]`)];
    assert.equal(resolve(NUMERIC_COMPOSED, envFor(...sels)), numericStyle(tokens).fontVariantNumeric, combo);
  }
  assert.equal(numericStyle('oldstyle fraction').fontVariantNumeric, 'tabular-nums oldstyle-nums diagonal-fractions');
  assert.equal(numericStyle('proportional stacked-fraction slashed-zero ordinal').fontVariantNumeric, 'proportional-nums lining-nums stacked-fractions slashed-zero ordinal');
  assert.equal(rules['[data-numeric~="caps"]'].fontFeatureSettings, '"case"');
  assert.equal(numericStyle(['caps']).fontFeatureSettings, '"case"');
  for (const p of Object.keys(NUMERIC_POSITIONS)) assert.equal(rules[`[data-numeric][data-position="${p}"]`].fontVariantPosition, p);
  // Each element composes from its own tokens: the per-axis variables do not inherit.
  assert.ok('--ui-numeric-family' in numericProperties);
  for (const v of Object.values(numericProperties)) assert.equal(v.inherits, false);
});

test('numeric(): the Panda pattern matches the attribute contract', () => {
  const t = (numeric as unknown as { transform: (p: Record<string, unknown>) => Rule }).transform;
  const family = resolve(voiceFamily('numeric'), {});
  const cases: [Record<string, unknown>, string[]][] = [
    [{}, []], [{ figures: 'oldstyle' }, ['oldstyle']], [{ spacing: 'proportional' }, ['proportional']],
    [{ fraction: 'diagonal' }, ['fraction']], [{ fraction: 'stacked', slashedZero: true }, ['stacked-fraction', 'slashed-zero']],
    [{ ordinal: true, figures: 'oldstyle', caps: true }, ['ordinal', 'oldstyle', 'caps']],
  ];
  for (const [props, tokens] of cases) {
    const out = t(props);
    assert.equal(out.fontVariantNumeric, numericStyle(tokens).fontVariantNumeric, JSON.stringify(props));
    assert.equal(out.fontFeatureSettings, numericStyle(tokens).fontFeatureSettings);
    assert.equal(resolve(out['--ui-numeric-family'], {}), family);
    assert.equal(out['--ui-numeric-family'], voiceFamily('numeric'));
    assert.equal(out.fontFamily, 'var(--ui-numeric-family)');
  }
  assert.equal(t({ position: 'super' }).fontVariantPosition, 'super');
  // Every pattern prop maps onto a contract variant.
  const props = Object.keys((numeric as unknown as { properties: object }).properties);
  assert.deepEqual(props.sort(), ['caps', 'figures', 'fraction', 'ordinal', 'position', 'slashedZero', 'spacing']);
});

test('formatNumber: minus, unit spaces, grouping', () => {
  assert.equal(formatNumber(-1234.5, { locale: 'en-US' }), `${MINUS}1,234.5`);
  assert.equal(formatNumber(-1234.5, { locale: 'en-US', minus: false }), '-1,234.5');
  assert.equal(formatNumber(5, { locale: 'en-US', style: 'unit', unit: 'kilometer' }), `5${NARROW_NBSP}km`);
  assert.equal(formatNumber(5, { locale: 'en-US', style: 'unit', unit: 'kilometer', unitSpace: 'locale' }), '5 km');
  assert.equal(formatNumber(1234.56, { locale: 'de-DE', style: 'currency', currency: 'EUR' }), `1.234,56${NARROW_NBSP}€`);
  assert.equal(formatNumber(-1234.56, { locale: 'en-US', style: 'currency', currency: 'USD' }), `${MINUS}$1,234.56`);
  assert.equal(formatNumber(-0.125, { locale: 'en-US', style: 'percent', maximumFractionDigits: 1 }), `${MINUS}12.5%`);
  assert.equal(formatNumber(0.125, { locale: 'de-DE', style: 'percent', maximumFractionDigits: 1 }), `12,5${NARROW_NBSP}%`);
  assert.equal(formatNumber(1234567.891, { locale: 'en-US', grouping: 'narrow' }), `1${NARROW_NBSP}234${NARROW_NBSP}567.891`);
  assert.equal(formatNumber(1234567, { locale: 'en-US', grouping: 'thin' }), '1 234 567');
  assert.equal(formatNumber(1234567, { locale: 'en-US', grouping: 'none' }), '1234567');
  assert.equal(formatNumber(1234567, { locale: 'en-US', notation: 'compact' }), '1.2M');
  assert.equal(formatNumber(1234567, { locale: 'de-DE', notation: 'compact' }), `1,2${NARROW_NBSP}Mio.`);
  assert.equal(formatNumber(-5, { locale: 'en-US', style: 'unit', unit: 'celsius' }), `${MINUS}5°C`);
});

test('formatNumber: scientific and engineering read as × 10ⁿ; parts expose the exponent', () => {
  assert.equal(formatNumber(6.02214076e23, { locale: 'en-US', notation: 'scientific', maximumFractionDigits: 2 }), `6.02${TIMES}10²³`);
  assert.equal(formatNumber(1.6e-19, { locale: 'en-US', notation: 'scientific' }), `1.6${TIMES}10⁻¹⁹`);
  assert.equal(formatNumber(12345, { locale: 'en-US', notation: 'engineering' }), `12.345${TIMES}10³`);
  assert.equal(formatNumber(6.02e23, { locale: 'en-US', notation: 'scientific', exponent: 'e' }), '6.02E23');
  const parts = formatNumberParts(1.6e-19, { locale: 'en-US', notation: 'scientific' });
  assert.deepEqual(parts.slice(-3), [{ type: 'times', value: TIMES }, { type: 'base', value: '10' }, { type: 'exponent', value: `${MINUS}19` }]);
  assert.equal(superscript(`${MINUS}19`), '⁻¹⁹');
});

test('formatFraction: nearest fraction, precomposed where Unicode has one', () => {
  assert.equal(formatFraction(1.75), '1¾');
  assert.equal(formatFraction(2.3125), `2${NARROW_NBSP}5⁄16`);
  assert.equal(formatFraction(0.3125, { vulgar: false }), '5⁄16');
  assert.equal(formatFraction(-0.5), `${MINUS}½`);
  assert.equal(formatFraction(0.999), '1');
  assert.equal(formatFraction(0.5, { vulgar: false }), '1⁄2');
  assert.equal(formatFraction(0.66, { maxDenominator: 3 }), '⅔');
});

test('formatFractionParts keeps the sign outside the fraction (frac would set a minus as numerator)', async () => {
  const { formatFractionParts, formatFraction } = await import('../tokens/typography/format.ts');
  assert.deepEqual(formatFractionParts(-0.375, { vulgar: false }), { sign: '−', whole: '', fraction: '3⁄8' });
  assert.deepEqual(formatFractionParts(-2.3125), { sign: '−', whole: '2 ', fraction: '5⁄16' });
  assert.equal(formatFraction(-2.3125), '−2 5⁄16', 'the string form is unchanged');
  assert.deepEqual(formatFractionParts(3), { sign: '', whole: '3', fraction: '' });
});
