// Typography › Numerals: the data-numeric contract on the numeric voice, live OpenType feature
// detection per face (pages/numerals.ts), and formatNumber output.
import { useEffect, useState, type ReactNode } from 'react';
import { css, cx } from '../../styled-system/css/index.js';
import { numeric } from '../../styled-system/patterns/index.js';
import { FACES, NUMERIC_VARIANTS, numericStyle, type Face } from '@massimo/ui-kit/tokens/typography/resolve';
import { formatFraction, formatFractionParts, formatNumber, formatNumberParts, type FormatNumberOptions } from '@massimo/ui-kit/tokens/typography/format';
import type { FaceMap, VoiceMap } from '../protocol.ts';
import { FEATURES, detectFeatures, type FeatureStatus, type FeatureTag } from './numerals.ts';
import { dataTable, groupHead, nameCell, noteCell, stack, subTitle, tableScroller } from './shared.tsx';
import { tone } from './home/styles.ts';

const sample = css({ fontSize: 'lg', lineHeight: 'tight', whiteSpace: 'nowrap' });
// Long call expressions wrap so the formatNumber table fits the content width.
const callCell = css({ whiteSpace: 'normal', minWidth: '[12rem]', wordBreak: 'break-word' });
const outputCell = css({ fontSize: 'lg' });
const STATUS: Record<FeatureStatus | 'pending', [string, string]> = {
  supported: ['yes', tone.success], default: ['default', tone.info], single: ['one form', tone.neutral], missing: ['—', tone.neutral], pending: ['…', tone.neutral],
};

// Specimen: the feature off (the bare contract, or its partner) and on (its contract token).
type Attrs = { 'data-numeric': string; 'data-position'?: string };
const ON: Record<FeatureTag, Attrs> = {
  tnum: { 'data-numeric': '' }, pnum: { 'data-numeric': 'proportional' }, lnum: { 'data-numeric': '' }, onum: { 'data-numeric': 'oldstyle' },
  zero: { 'data-numeric': 'slashed-zero' }, frac: { 'data-numeric': 'fraction' }, afrc: { 'data-numeric': 'stacked-fraction' },
  sups: { 'data-numeric': '', 'data-position': 'super' }, subs: { 'data-numeric': '', 'data-position': 'sub' },
  ordn: { 'data-numeric': 'ordinal' }, case: { 'data-numeric': 'caps' },
};
const OFF: Partial<Record<FeatureTag, Attrs>> = { tnum: { 'data-numeric': 'proportional' }, lnum: { 'data-numeric': 'oldstyle' } };

/** The visible special characters in a formatted string, as code points. */
const SPECIAL: Record<string, string> = { '−': 'U+2212 minus', ' ': 'U+202F narrow nbsp', ' ': 'U+2009 thin', '×': '×', '⁄': 'U+2044 fraction slash' };
const codePoints = (s: string) => [...new Set([...s].filter((c) => SPECIAL[c]).map((c) => SPECIAL[c]))].join(' · ');

// formatNumber examples: [call, value, options].
const NUMBERS: [string, number, FormatNumberOptions][] = [
  ["formatNumber(-1234.5)", -1234.5, { locale: 'en-US' }],
  ["{ notation: 'scientific', maximumFractionDigits: 2 }", 6.02214076e23, { locale: 'en-US', notation: 'scientific', maximumFractionDigits: 2 }],
  ["{ notation: 'scientific' }", -1.602e-19, { locale: 'en-US', notation: 'scientific' }],
  ["{ notation: 'engineering' }", 12345, { locale: 'en-US', notation: 'engineering' }],
  ["{ style: 'unit', unit: 'kilometer-per-hour' }", 42, { locale: 'en-US', style: 'unit', unit: 'kilometer-per-hour' }],
  ["{ style: 'unit', unit: 'celsius' }", -5, { locale: 'en-US', style: 'unit', unit: 'celsius' }],
  ["{ style: 'percent', signDisplay: 'exceptZero' }", -0.125, { locale: 'en-US', style: 'percent', signDisplay: 'exceptZero', maximumFractionDigits: 1 }],
  ["{ locale: 'de-DE', style: 'currency', currency: 'EUR' }", 1234.56, { locale: 'de-DE', style: 'currency', currency: 'EUR' }],
  ["{ notation: 'compact' }", 1234567, { locale: 'en-US', notation: 'compact' }],
  ["{ grouping: 'narrow' }", 1234567.891, { locale: 'en-US', grouping: 'narrow' }],
];
// Fractions render from parts: only the fraction sits in the data-numeric="fraction" span, so the
// sign is never set as a numerator.
const FRACTIONS: [string, number, { vulgar?: boolean }][] = [['formatFraction(1.75)', 1.75, {}], ['formatFraction(2.3125)', 2.3125, {}], ['formatFraction(−0.375, { vulgar: false })', -0.375, { vulgar: false }]];

/** Parts rendered with the exponent in a <sup> (for faces without superior figures). */
function Parts({ value, options }: { value: number; options: FormatNumberOptions }) {
  const parts = formatNumberParts(value, options);
  if (!parts.some((p) => p.type === 'exponent')) return <>—</>;
  return <>{parts.map((p, i) => p.type === 'exponent' ? <sup key={i}>{p.value}</sup> : <span key={i}>{p.value}</span>)}</>;
}

function useDetection(faces: FaceMap) {
  const [found, setFound] = useState<Partial<Record<Face, Record<FeatureTag, FeatureStatus>>>>({});
  const key = JSON.stringify(faces);
  useEffect(() => {
    let live = true;
    setFound({});
    for (const f of FACES) detectFeatures(faces[f]).then((r) => { if (live) setFound((m) => ({ ...m, [f]: r })); }, () => {});
    return () => { live = false; };
  }, [key]);
  return found;
}

const Status = ({ s }: { s?: FeatureStatus }) => {
  const [text, cls] = STATUS[s ?? 'pending'];
  // key: a new badge per status, so React sets className before the element upgrades; changing
  // className on an upgraded ui-badge would replace the recipe classes it put on itself.
  return <ui-badge key={text} className={cls}>{text}</ui-badge>;
};

export function Numerals({ voices, faces }: { voices: VoiceMap; faces: FaceMap }) {
  const found = useDetection(faces);
  const voiceFace = voices.numeric;
  const cols: Face[] = [voiceFace, ...FACES.filter((f) => f !== voiceFace)];
  const table = (label: string, head: ReactNode, body: ReactNode) => (
    <div className={tableScroller}><table className={dataTable} aria-label={label}><thead>{head}</thead><tbody>{body}</tbody></table></div>
  );
  return (
    <>
      <div className={stack}>
        <h3 className={subTitle}>Contract</h3>
        {table('Numeric contract',
          <tr><th>data-numeric token</th><th>Axis</th><th>CSS</th><th>Feature</th><th>Sample</th></tr>,
          <>
            <tr><td className={nameCell}>(bare)</td><td>spacing, figures</td><td>{numericStyle().fontVariantNumeric}</td><td>tnum lnum</td><td className={sample} data-numeric>1,284.07</td></tr>
            {Object.entries(NUMERIC_VARIANTS).map(([t, v]) => (
              <tr key={t}>
                <td className={nameCell}>{t}</td><td>{v.axis}</td><td>{v.axis === 'caps' ? `font-feature-settings: ${v.value}` : v.value}</td><td>{v.feature}</td>
                <td className={sample} data-numeric={t}>{FEATURES.find((f) => f.tag === v.feature)?.sample}</td>
              </tr>
            ))}
            {(['super', 'sub'] as const).map((p) => (
              <tr key={p}><td className={nameCell}>data-position="{p}"</td><td>position</td><td>font-variant-position: {p}</td><td>{p === 'super' ? 'sups' : 'subs'}</td><td className={sample}>x<span data-numeric data-position={p}>123</span></td></tr>
            ))}
          </>)}
      </div>
      <div className={stack}>
        <h3 className={subTitle}>Features by face</h3>
        {table('Numeric features by face',
          <>
            <tr>
              <th rowSpan={2}>Feature</th><th rowSpan={2}>Tag</th>
              <th colSpan={2} className={groupHead}>Numeric voice ({voiceFace})</th>
              <th colSpan={cols.length} className={groupHead}>Detected in face</th>
            </tr>
            <tr><th>Off</th><th>On</th>{cols.map((f) => <th key={f}>{f}{f === voiceFace ? <small>voice</small> : null}</th>)}</tr>
          </>,
          FEATURES.map((f) => (
            <tr key={f.tag}>
              <td className={nameCell}>{f.label}</td><td>{f.tag}</td>
              <td className={sample} {...(OFF[f.tag] ?? { 'data-numeric': '' })}>{f.sample}</td>
              <td className={sample} {...ON[f.tag]}>{f.sample}</td>
              {cols.map((c) => <td key={c}><Status s={found[c]?.[f.tag]} /></td>)}
            </tr>
          )))}
      </div>
      <div className={stack}>
        <h3 className={subTitle}>formatNumber</h3>
        {table('formatNumber examples',
          <tr><th>Call</th><th>Value</th><th>Output</th><th>Parts, exponent in sup</th><th>Characters</th></tr>,
          <>
            {NUMBERS.map(([call, value, options]) => {
              const out = formatNumber(value, options);
              return (
                <tr key={call}>
                  <td className={callCell}>{call}</td><td>{String(value)}</td>
                  <td className={cx(outputCell, numeric())}>{out}</td>
                  <td className={cx(outputCell, numeric())}><Parts value={value} options={options} /></td>
                  <td className={noteCell}>{codePoints(out)}</td>
                </tr>
              );
            })}
            {FRACTIONS.map(([call, value, options]) => {
              const p = formatFractionParts(value, options);
              return (
                <tr key={call}>
                  <td className={callCell}>{call}</td><td>{String(value)}</td>
                  <td className={cx(outputCell, numeric())}>{p.sign}{p.whole}<span className={numeric({ fraction: 'diagonal' })}>{p.fraction}</span></td><td>—</td>
                  <td className={noteCell}>{codePoints(formatFraction(value, options))}</td>
                </tr>
              );
            })}
          </>)}
      </div>
    </>
  );
}
