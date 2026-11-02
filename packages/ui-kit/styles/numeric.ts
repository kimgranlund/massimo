// numeric(): the data-numeric contract for Panda/React code, `css(numeric.raw({ figures: 'oldstyle' }))`
// or `className={numeric({ fraction: 'diagonal' })}`. One prop per axis of the attribute
// (tokens/typography/resolve.ts NUMERIC_VARIANTS): enums and booleans, so strict values hold.
// Pattern classes are atomic utilities, above textStyle compositions, so they win over a role on
// the same element; --ui-numeric-family also carries the numeric voice into roles below.
//
// Panda serializes `transform` into styled-system/patterns, so it cannot import: the values are
// inline and test/typography.test.ts checks them against numericStyle() and voiceFamily('numeric').
import { definePattern } from '@pandacss/dev';

export const numeric = definePattern({
  description: 'Figures in the numeric voice: the data-numeric contract (tabular lining by default)',
  properties: {
    spacing: { type: 'enum', value: ['tabular', 'proportional'] },
    figures: { type: 'enum', value: ['lining', 'oldstyle'] },
    fraction: { type: 'enum', value: ['diagonal', 'stacked'] },
    slashedZero: { type: 'boolean' },
    ordinal: { type: 'boolean' },
    caps: { type: 'boolean' },
    position: { type: 'enum', value: ['super', 'sub'] },
  },
  blocklist: ['fontVariantNumeric', 'fontFeatureSettings', 'fontVariantPosition'],
  transform: ({ spacing, figures, fraction, slashedZero, ordinal, caps, position, ...rest }) => {
    const family = 'var(--font-voice-numeric, var(--font-voice-ui, var(--fonts-controls)))';
    const variant = [
      `${spacing ?? 'tabular'}-nums`,
      `${figures ?? 'lining'}-nums`,
      fraction ? `${fraction}-fractions` : '',
      slashedZero ? 'slashed-zero' : '',
      ordinal ? 'ordinal' : '',
    ].filter(Boolean).join(' ');
    return {
      '--ui-numeric-family': family,
      fontFamily: 'var(--ui-numeric-family)',
      fontVariantNumeric: variant,
      ...(caps ? { fontFeatureSettings: '"case"' } : {}),
      ...(position ? { fontVariantPosition: position, fontSynthesisPosition: 'auto' } : {}),
      ...rest,
    };
  },
});
