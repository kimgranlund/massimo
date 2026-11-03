// Typography: faces and voices, every role with live metrics over a rhythm grid, a short article
// set in the roles, and numerals (the data-numeric contract with live feature detection).
import { Fragment } from 'react';
import { css, cx } from '../../styled-system/css/index.js';
import { numeric } from '../../styled-system/patterns/index.js';
import { TEXT_COLORS, TYPE_ROLES, VOICES, resolveType, type TypeRoleName } from '@massimo/ui-kit/tokens';
import type { PageProps } from './types.ts';
import { CQ_MD, Divider, Page, Section, dataTable, fmt, metrics, nameCell, noteCell, rowLabel, tableScroller } from './shared.tsx';
import { Numerals } from './TypographyNumerals.tsx';

const typeRow = css({ display: 'grid', gridTemplateColumns: '1fr', gap: '2', [CQ_MD]: { gridTemplateColumns: '14rem 1fr', gap: '6' }, alignItems: 'start', paddingBlock: '3', borderBottomWidth: 'thin', borderColor: 'border' });
// Below the medium breakpoint the specimen comes first and its specs follow.
const typeMeta = css({ display: 'flex', flexDirection: 'column', gap: '0.5', order: 1, [CQ_MD]: { order: 0 } });
// Baseline grid behind each specimen: a faint line per rhythm unit, every 4th line stronger.
const rhythmLine = (pct: number) => `linear-gradient(to bottom, transparent calc(100% - 1px), color-mix(in oklch, var(--colors-primary-solid) ${pct}%, transparent) 0)`;
// The lines span the sample column; the text inside keeps a readable measure.
const rhythmSample = css({ backgroundImage: `${rhythmLine(18)}, ${rhythmLine(7)}` });
// The baseline grid pitch is rhythm × u, computed from the canvas's own theme variables.
const rhythmGrid = css({ backgroundSize: '100% calc(4px * var(--ui-type-rhythm) * var(--ui-unit)), 100% calc(1px * var(--ui-type-rhythm) * var(--ui-unit))' });
const rhythmText = css({ whiteSpace: 'pre-wrap', maxWidth: 'prose' });
const codeSample = css({ whiteSpace: 'pre', bg: 'bg.muted', padding: '3', borderRadius: 'md', width: 'fit-content' });
// Same two columns as the role rows: role names in the spec column (from the medium breakpoint),
// the article in the sample column at a readable measure.
const article = css({
  display: 'grid', gridTemplateColumns: 'minmax(0, 62ch)', rowGap: '3', alignItems: 'baseline',
  [CQ_MD]: { gridTemplateColumns: '14rem minmax(0, 62ch)', columnGap: '6' },
  '& pre': { whiteSpace: 'pre', bg: 'bg.muted', padding: '3', borderRadius: 'md', overflowX: 'auto' },
});
const articleRole = css({ display: 'none', textStyle: 'code', color: 'fg.muted', [CQ_MD]: { display: 'block' } });
// Section kickers on neutral surfaces sit one step weaker than body text (neutral 11); on colored
// surfaces their tone sets the color.
const kickerInk = css({ color: 'fg.muted' });
const roleInk = (role: string) => role === 'section-kicker' ? kickerInk : undefined;
// Voice samples: each voice's family (repointed voices set --font-voice-* on the canvas).
const voiceSample = css({ fontSize: '[1.5em]', lineHeight: 'snug' });
const VOICE_FONT: Record<string, string> = {
  display: css({ fontFamily: 'var(--font-voice-display, var(--fonts-display))' }),
  heading: css({ fontFamily: 'var(--font-voice-heading, var(--fonts-sans))' }),
  body: css({ fontFamily: 'var(--font-voice-body, var(--fonts-sans))' }),
  ui: css({ fontFamily: 'var(--font-voice-ui, var(--fonts-controls))' }),
  numeric: numeric(),
  code: css({ fontFamily: 'var(--font-voice-code, var(--fonts-mono))', whiteSpace: 'pre' }),
};

// The In context article: [role, element, text], one block per role.
const ARTICLE: [string, 'span' | 'h2' | 'h3' | 'p' | 'pre', string][] = [
  ['section-kicker', 'span', 'Field notes'],
  ['heading-1', 'h2', 'A system you can hold in one line'],
  ['body-large', 'p', 'Everything is u. A control is eight of them; its label is ten pixels plus one.'],
  ['heading-3', 'h3', 'Why the base moves with u'],
  ['body', 'p', 'Text set on the control font scales with every size step, so a compact panel and a spacious one keep the same proportions between headings, body and controls.'],
  ['caption', 'p', 'Figures are illustrative.'],
  ['code', 'pre', 'const u = height / 8;\nconst font = 10 + u;'],
];

// Specimen text per voice: what that voice is actually for, not a pangram.
const VOICE_SAMPLES: Record<string, string> = {
  display: 'Spring, in proportion',
  heading: 'Quarterly results by region',
  body: 'Every length follows from one unit, so a change of size reads as one decision.',
  ui: 'Save changes · Cancel · 3 selected',
  numeric: '$1,284.07 · +12.5% · 08:45 · 3 of 12',
  code: 'padding: calc(2 * var(--u));',
};
const VOICE_USE: Record<string, string> = {
  display: 'display', heading: 'heading 1–3', body: 'body, caption', ui: 'controls, labels, kickers',
  numeric: 'stats, tables', code: 'code',
};

const SAMPLES: Record<TypeRoleName, string> = {
  'display': 'Control Foundation',
  'heading-1': 'One unit, many tiers',
  'heading-2': 'Margins and gutters',
  'heading-3': 'Tiers, radii and nesting',
  'section-kicker': 'Section kicker',
  'group-kicker': 'Group kicker',
  'body-large': 'Every dimension in the control is a multiple of one unit, an eighth of the control height.',
  'body': 'Container margins stay fixed in u, while internal gutters follow the content and controls respond to size.',
  'caption': 'Line heights round up to the rhythm unit, so stacked text stays on the grid.',
  'code': 'const u = height / 8;\nconst font = 10 + u;',
  'control': 'Continue',
  'label': 'Email address',
  'title': 'Order alerts',
  'control-small': 'Details',
};

export function TypographyPage({ params, voices, faces, typeColors }: PageProps) {
  const opts = { unit: params.unit, ratio: params['type-ratio'], rhythm: params['type-rhythm'], voices, faces };
  const grid = params['type-rhythm'] * params.unit;
  return (
    <Page title="Typography" lead={<>Roles from massimo-ui on the u ramp: size = (10px + u) × ratio^step, or n·u for caption, code and small controls; line heights round up to the rhythm. Unit {fmt(params.unit)}px · ratio {params['type-ratio']} · rhythm {grid ? `${fmt(grid)}px` : 'none'}.</>}>
      <Divider />
      <Section id="voices" title="Faces and voices" note="Faces are the stacks; voices say what text is for; roles point at voices. Repoint a voice with data-font-<voice>=&quot;<face>&quot;.">
        {VOICES.map((v) => (
          <div key={v} className={typeRow}>
            <div className={typeMeta}>
              <span className={rowLabel}>{v === 'ui' ? 'UI' : v[0].toUpperCase() + v.slice(1)}</span>
              <span className={metrics}>{v} → {voices[v]}</span>
              <span className={metrics}>{VOICE_USE[v]}</span>
            </div>
            <div className={cx(voiceSample, VOICE_FONT[v])}>{VOICE_SAMPLES[v]}</div>
          </div>
        ))}
      </Section>
      <Divider />
      <Section id="roles" title="Roles" note={'Each specimen uses data-type="<role>" (or textStyle in Panda). Metrics come from the resolver for the current settings.'}>
        {(Object.keys(TYPE_ROLES) as TypeRoleName[]).map((role) => {
          const t = resolveType(role, opts);
          const r = TYPE_ROLES[role];
          return (
            <div key={role} className={typeRow}>
              <div className={typeMeta}>
                <span className={rowLabel}>{r.label}</span>
                <span className={metrics}>{role} · {t.voice} → {t.face}</span>
                <span className={metrics}>{fmt(t.size)} / {t.lineHeightRatio ?? fmt(t.lineHeight)} · {'u' in r ? `${r.u}u` : `step ${r.step}`}</span>
                <span className={metrics}>{t.weight}{t.tracking ? ` · ${t.tracking}em` : ''}{t.transform !== 'none' ? ' · upper' : ''}</span>
              </div>
              {role === 'code'
                ? <div data-type={role} className={codeSample}>{SAMPLES[role]}</div>
                : <div className={cx(rhythmSample, grid && !t.lineHeightRatio ? rhythmGrid : undefined)}><div data-type={role} className={cx(rhythmText, roleInk(role))}>{SAMPLES[role]}</div></div>}
            </div>
          );
        })}
      </Section>
      <Divider />
      <Section id="text-colors" title="Text colors" note="Every text color token, on the surface it is meant for, and the type roles that use it. Display, headings and titles take fg.strong (the neutral endpoint: black in light, white in dark); the other roles inherit, usually fg. Remap any role in the jig's Typography tab, Text colors (theme typography.colors).">
        <TextColors typeColors={typeColors} />
      </Section>
      <Divider />
      <Section id="article" title="In context" note="A short article set entirely with the roles.">
        <article className={article}>
          {ARTICLE.map(([role, Tag, text]) => (
            <Fragment key={role}>
              <span className={articleRole} aria-hidden="true">{role}</span>
              <Tag data-type={role} className={roleInk(role)}>{text}</Tag>
            </Fragment>
          ))}
        </article>
      </Section>
      <Divider />
      <Section id="numerals" title="Numerals" note={'data-numeric="<variants>" (or numeric() in Panda) sets figures in the numeric voice; bare is tabular lining. Detection renders each OpenType feature off and on in every face and compares the result: yes = it changes the rendering, default = the face already renders that way, one form = the face has a single figure style, — = not in this face (on this browser and machine).'}>
        <Numerals voices={voices} faces={faces} />
      </Section>
    </Page>
  );
}

// ── Text colors: the fg tokens, where each sits, and which type roles use it ──
const swatchText = css({ display: 'inline-block', paddingInline: '2', paddingBlock: '1', borderRadius: 'sm', fontWeight: 'semibold', fontFamily: 'sans' });
const TEXT_TOKENS: { token: string; css: string; on?: string; use: string; mapped?: keyof typeof TEXT_COLORS }[] = [
  { token: 'fg.strong', css: 'var(--colors-fg-strong)', use: 'Display, headings, titles: black in light, white in dark (the neutral endpoints)', mapped: 'strong' },
  { token: 'fg', css: 'var(--colors-fg)', use: 'Body text and controls (neutral 12)', mapped: 'default' },
  { token: 'fg.muted', css: 'var(--colors-fg-muted)', use: 'Secondary text, descriptions, captions (neutral 11)', mapped: 'muted' },
  { token: 'fg.subtle', css: 'var(--colors-fg-subtle)', use: 'Placeholders, disabled hints (neutral 8)', mapped: 'subtle' },
  { token: 'primary.fg', css: 'var(--colors-primary-fg)', use: 'Links, the active navigation link, selected option text in popups (primary 11)', mapped: 'primary' },
  { token: 'critical.fg · warning.fg · success.fg · info.fg', css: 'var(--colors-critical-fg)', use: 'Feedback text: errors, warnings, success, notices (each role\'s step 11)' },
  { token: 'fg.onSolid', css: 'var(--colors-fg-on-solid)', on: 'var(--colors-primary-solid)', use: 'Text on a solid fill: primary buttons, checked boxes (the APCA choice for primary 9)' },
  { token: 'fg.selected', css: 'var(--colors-fg-selected)', on: 'var(--colors-bg-selected)', use: 'The selected option or segment on bg.selected' },
  { token: 'fg.inverse', css: 'var(--colors-fg-inverse)', on: 'var(--colors-bg-inverse)', use: 'Tooltips on bg.inverse' },
];

function TextColors({ typeColors }: { typeColors: PageProps['typeColors'] }) {
  const byColor = (c?: keyof typeof TEXT_COLORS) => c ? (Object.keys(TYPE_ROLES) as TypeRoleName[]).filter((r) => typeColors[r] === c).map((r) => TYPE_ROLES[r].label) : [];
  const inheriting = byColor('inherit');
  return (
    <>
      <div className={tableScroller}>
        <table className={dataTable} aria-label="Text color tokens">
          <thead><tr><th>Token</th><th>Sample</th><th>Use</th><th>Type roles</th></tr></thead>
          <tbody>
            {TEXT_TOKENS.map((t) => (
              <tr key={t.token}>
                <td className={nameCell}>{t.token}</td>
                <td><span className={swatchText} style={{ color: t.css, background: t.on ?? 'transparent' }}>Aa Text</span></td>
                <td className={noteCell}>{t.use}</td>
                <td className={noteCell}>{[...byColor(t.mapped), ...(t.mapped === 'default' && inheriting.length ? [`(inherits) ${inheriting.join(', ')}`] : [])].join(', ') || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className={tableScroller}>
        <table className={dataTable} aria-label="Type roles and their text colors">
          <thead><tr><th>Type role</th><th>Text color</th><th>Specimen</th></tr></thead>
          <tbody>
            {(Object.keys(TYPE_ROLES) as TypeRoleName[]).map((r) => (
              <tr key={r}>
                <td className={nameCell}>{TYPE_ROLES[r].label}</td>
                <td className={noteCell}>{typeColors[r] === 'inherit' ? 'inherit (fg here)' : typeColors[r] === 'default' ? 'fg' : typeColors[r] === 'primary' ? 'primary.fg' : `fg.${typeColors[r]}`}</td>
                <td><span data-type={r}>{TYPE_ROLES[r].label}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
