// The canvas: every ui-kit web component, rendered inline in the studio. Theme overrides are
// scoped to the [data-canvas] element by the studio, so the panel keeps the default theme.
import '@massimo/ui-kit/components/button/element';
import '@massimo/ui-kit/components/input/element';
import '@massimo/ui-kit/components/listbox/element';
import '@massimo/ui-kit/components/select/element';
import '@massimo/ui-kit/components/btg/element';
import '@massimo/ui-kit/components/choice/element';
import '@massimo/ui-kit/components/range/element';
import '@massimo/ui-kit/components/color/element';
import '@massimo/ui-kit/components/swiper/element';
import '@massimo/ui-kit/components/image/element';
import { Fragment, useEffect, useState } from 'react';
import { css, cx } from '../../styled-system/css/index.js';
import { page as pageLayout } from '../../styled-system/patterns/index.js';
import type { FaceMap, SpectrumPayload, View, VoiceMap } from '../protocol.ts';
import { UNIQUE_HUES as UNIQUE } from '@massimo/ui-kit/spectrum';
import { CONTAINERS, PAGE_MAX_WIDTH_REM, TYPE_ROLES, VOICES, resolveContainer, resolveType, type ThemeParams, type TypeRoleName } from '@massimo/ui-kit/tokens';

// Specimen layout: the page container (8u padding and gap) holds titled sections split by
// dividers. Each section is a list of labelled rows: label on the left, specimens on the right.
const shell = pageLayout({ width: '[80rem]' });
// Layout responds to the canvas width (the jig panel takes part of the viewport), not the viewport.
const canvasQuery = css({ containerType: 'inline-size', containerName: 'canvas' });
const CQ_MD = '@container canvas (min-width: 40rem)';
const CQ_LG = '@container canvas (min-width: 64rem)';
const header = css({ display: 'flex', flexDirection: 'column', gap: '4' });
const pageTitle = css({ textStyle: 'display' });
const lead = css({ textStyle: 'body-large', color: 'fg.muted', maxWidth: 'prose' });
const divider = css({ borderTopWidth: 'thin', borderColor: 'border', width: 'full' });
const section = css({ display: 'flex', flexDirection: 'column', gap: '5' });
const sectionHead = css({ display: 'flex', flexDirection: 'column', gap: '1' });
const sectionTitle = css({ textStyle: 'heading-2' });
const caption = css({ textStyle: 'caption', color: 'fg.muted' });
const rowGrid = css({ display: 'grid', gridTemplateColumns: '1fr', gap: '2', alignItems: 'center', [CQ_MD]: { gridTemplateColumns: '11rem 1fr', gap: '6' } });
const rowLabel = css({ textStyle: 'label', color: 'fg.muted' });
const specimens = css({ display: 'flex', gap: '2', flexWrap: 'wrap', alignItems: 'center' });
const formGrid = css({ display: 'grid', gridTemplateColumns: '1fr', gap: '4', alignItems: 'start', [CQ_MD]: { gridTemplateColumns: '1fr 1fr' } });
const columns = css({ display: 'grid', gridTemplateColumns: '1fr', gap: '8', alignItems: 'start', [CQ_MD]: { gridTemplateColumns: '1fr 1fr' } });
const subTitle = css({ textStyle: 'heading-3' });
const stack = css({ display: 'flex', flexDirection: 'column', gap: '4' });
const avatar = css({ display: 'block', bg: 'primary.solid' });
const media = css({ width: 'full', maxWidth: '[40rem]', borderRadius: 'xl', overflow: 'hidden' });
const formats = css({ display: 'flex', gap: '3', flexWrap: 'wrap', alignItems: 'end' });
const figure = css({ display: 'flex', flexDirection: 'column', gap: '1', width: '[8rem]' });
const levelBox = css({ bg: 'primary.subtle', alignSelf: 'start' });
const levelList = css({ minWidth: '[10rem]' });
const tokenTable = css({ display: 'grid', gridTemplateColumns: 'auto auto auto auto 1fr', columnGap: '6', rowGap: '2', alignItems: 'baseline', '& > [role=row]': { display: 'contents' } });
const tokenHead = css({ '& > *': { textStyle: 'group-kicker', color: 'fg.muted' } });
const tokenRow = css({ '& > :first-child': { textStyle: 'label', fontWeight: 'semibold' } });
const miniPage = css({ bg: 'bg.subtle', borderRadius: 'md' });
const tinted = css({ bg: 'bg' });
const tileRow = css({ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' });
const wideCol = css({ minWidth: '[16rem]', bg: 'bg.muted' });
const tileGrid = css({ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(10rem, 1fr))', flex: '1' });
const levelChild = css({ display: 'block', bg: 'bg', minWidth: '10', minHeight: '6', borderRadius: 'sm' });
const rampRow = css({ display: 'grid', gridTemplateColumns: '1fr', gap: '3', alignItems: 'center', [CQ_MD]: { gridTemplateColumns: '7rem 1fr 1fr' } });
const ramp = css({ width: 'full' });
const typeRow = css({ display: 'grid', gridTemplateColumns: '1fr', gap: '2', [CQ_MD]: { gridTemplateColumns: '14rem 1fr', gap: '6' }, alignItems: 'start', paddingBlock: '3', borderBottomWidth: 'thin', borderColor: 'border' });
// Below the medium breakpoint the specimen comes first and its specs follow.
const typeMeta = css({ display: 'flex', flexDirection: 'column', gap: '0.5', order: 1, [CQ_MD]: { order: 0 } });
const metrics = css({ textStyle: 'code', color: 'fg.muted' });
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
const summary = css({ textStyle: 'code', color: 'fg.muted', '& b': { color: 'primary.fg', fontWeight: 'regular' } });
const chartGrid = css({ display: 'grid', gridTemplateColumns: '1fr', gap: '4', [CQ_LG]: { gridTemplateColumns: '1fr 1fr' } });
const chartFig = css({ display: 'flex', flexDirection: 'column', gap: '3', bg: 'bg.subtle', padding: '4', borderRadius: 'xl' });
const chartSvg = css({ width: 'full', height: 'auto', color: 'fg', overflow: 'visible' });
const chartLabel = css({ fontFamily: 'mono', fontSize: 'sm', fill: 'fg.muted' });
const chartTick = css({ fontFamily: 'mono', fontSize: 'sm', fill: 'fg.muted' });
const axis = css({ stroke: 'border.strong', strokeWidth: '[1px]' });
const grid = css({ stroke: 'border', strokeWidth: '[1px]' });
const dashed = css({ stroke: 'fg.muted', strokeWidth: '[1px]', strokeDasharray: '3 3', fill: 'none' });
const context = css({ display: 'flex', flexDirection: 'column', gap: '5' });
const contextHead = css({ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: '3', flexWrap: 'wrap' });
// Campaign, the primary ramp as a vertical strip (step 1 at the top), then ink and tint panels.
// Narrow: stacked, ramp flat. Medium and up: campaign with the ramp standing at its right (through
// both rows), ink | tint below the campaign.
const brandGrid = css({
  display: 'grid', gridTemplateColumns: '1fr', gap: '4',
  [CQ_MD]: {
    gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr) auto',
    '& > :first-child': { gridColumn: '1 / 3' },
    '& > [data-ramp]': { gridColumn: '3', gridRow: '1 / 3' },
  },
});
const campaign = css({ justifyContent: 'space-between', minHeight: '[20rem]' });
// Type roles only: kickers, display, headings and figures come from the typography system.
const kicker = css({ textStyle: 'group-kicker', display: 'inline-flex', alignItems: 'center', gap: '2' });
const sectionKicker = css({ textStyle: 'section-kicker', display: 'inline-flex', alignItems: 'center', gap: '2' });
// Section kickers on neutral surfaces sit one step weaker than body text (neutral 11); on colored
// surfaces their tone sets the color.
const kickerInk = css({ color: 'fg.muted' });
const roleInk = (role: string) => role === 'section-kicker' ? kickerInk : undefined;
// Display needs the width: below the medium canvas the campaign title steps down to heading-1.
const display = css({ textStyle: 'heading-1', [CQ_MD]: { textStyle: 'display' } });
const bodyLarge = css({ textStyle: 'body-large' });
const panelTitle = css({ textStyle: 'heading-2', [CQ_LG]: { textStyle: 'heading-1' } });
const bigFigure = css({ textStyle: 'heading-1', fontVariantNumeric: 'tabular-nums lining-nums', '& span': { textStyle: 'heading-3' } });
// The strip lies flat when stacked and stands up beside the panels.
// The primary ramp as a legible showcase (not the palette component): every step with its number,
// and its purpose once there is room. A row of 12 at narrow widths, a tall column from medium up.
// Role overview: one chip per role (step-9 swatch, role, family).
const roleGrid = css({ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(9rem, 1fr))', gap: '3' });
const roleChip = css({ display: 'flex', alignItems: 'center', gap: '3', '& figcaption': { display: 'flex', flexDirection: 'column' } });
const roleSwatch = css({ width: '8', height: '8', borderRadius: 'lg', flexShrink: 0 });
const rampStrip = css({
  display: 'grid', gridTemplateColumns: 'repeat(12, minmax(0, 1fr))', borderRadius: 'xl', overflow: 'hidden',
  [CQ_MD]: { display: 'flex', flexDirection: 'column', width: '[14rem]', alignSelf: 'stretch' },
});
const rampStep = css({
  display: 'flex', alignItems: 'end', justifyContent: 'space-between', gap: '2', minHeight: '[3.5rem]', padding: '2',
  textStyle: 'control-small', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap',
  '& > span:last-child': { display: 'none' },
  [CQ_MD]: { flex: '1', minHeight: '[2.5rem]', alignItems: 'center', paddingInline: '3', '& > span:last-child': { display: 'block', opacity: 0.8 } },
});
const RAMP_USE = ['App background', 'Subtle background', 'Element', 'Hovered', 'Active, selected', 'Subtle border', 'Border', 'Strong border', 'Solid', 'Solid hover', 'Muted text', 'Text'];
const dot = css({ display: 'inline-block', width: '2', height: '2', borderRadius: 'full' });
const workspaceHead = css({ display: 'flex', alignItems: 'center', gap: '3', flexWrap: 'wrap', '& > div': { flex: '1' } });
// No holes: cards stretch to their row and the spans tile every width.
//   lg (3 cols): overview details library / week progress actions / chart(2) feedback
//   md (2 cols): overview details / library week / progress actions / chart(2) / feedback(2)
const uiGrid = css({
  display: 'grid', gridTemplateColumns: '1fr', gap: '4', alignItems: 'stretch', gridAutoFlow: 'row dense',
  [CQ_MD]: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' },
  [CQ_LG]: { gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' },
  '& ui-card > ui-badge': { alignSelf: 'start' },
});
const cardTitle = css({ textStyle: 'heading-3' });
const chartCard = css({ [CQ_MD]: { gridColumn: 'span 2' } });
const feedbackCard = css({ [CQ_MD]: { gridColumn: 'span 2' }, [CQ_LG]: { gridColumn: 'span 1' } });
const chart = css({ display: 'flex', gap: '3', height: '[10rem]', alignItems: 'stretch' });
const chartDay = css({ flex: '1', display: 'flex', flexDirection: 'column', gap: '1', alignItems: 'center' });
// Stacked bar: data 1 at the bottom; 1px gaps separate the series, the top rounds.
// Static color classes from role tokens: the demos never set colors inline.
const tone = {
  solid: css({ bg: 'primary.solid', color: 'fg.onSolid' }),
  solidHover: css({ bg: 'primary.solidHover !important' }),
  secondaryOnSolid: css({ color: 'secondary.subtle' }),
  secondaryDot: css({ bg: 'secondary.solid' }),
  paper: css({ bg: 'bg.subtle', color: 'primary.fg' }),
  muted: css({ color: 'fg.muted' }),
  tint: css({ bg: 'primary.subtle', color: 'primary.fg' }),
  tintStrong: css({ color: 'primary.12' }),
  success: css({ bg: 'success.subtle', color: 'success.fg' }),
  warning: css({ bg: 'warning.subtle', color: 'warning.fg' }),
  critical: css({ bg: 'critical.subtle', color: 'critical.fg' }),
  info: css({ bg: 'info.subtle', color: 'info.fg' }),
};
// Primary ramp steps 1–12 (primary.N tokens), with readable text: step 12 on 1–8, step 1 on 9–12.
const RAMP_STEP = [
  css({ bg: 'primary.1', color: 'primary.12' }), css({ bg: 'primary.2', color: 'primary.12' }), css({ bg: 'primary.3', color: 'primary.12' }),
  css({ bg: 'primary.4', color: 'primary.12' }), css({ bg: 'primary.5', color: 'primary.12' }), css({ bg: 'primary.6', color: 'primary.12' }),
  css({ bg: 'primary.7', color: 'primary.12' }), css({ bg: 'primary.8', color: 'primary.12' }), css({ bg: 'primary.9', color: 'primary.1' }),
  css({ bg: 'primary.10', color: 'primary.1' }), css({ bg: 'primary.11', color: 'primary.1' }), css({ bg: 'primary.12', color: 'primary.1' }),
];
// Data series 1–6.
const DATA_BG = [css({ bg: 'data.1' }), css({ bg: 'data.2' }), css({ bg: 'data.3' }), css({ bg: 'data.4' }), css({ bg: 'data.5' }), css({ bg: 'data.6' })];
// Each role's solid (step 9).
const ROLE_BG: Record<string, string> = {
  primary: css({ bg: 'primary.solid' }), secondary: css({ bg: 'secondary.solid' }), neutral: css({ bg: 'neutral.solid' }),
  critical: css({ bg: 'critical.solid' }), warning: css({ bg: 'warning.solid' }), success: css({ bg: 'success.solid' }), info: css({ bg: 'info.solid' }),
  data1: DATA_BG[0], data2: DATA_BG[1], data3: DATA_BG[2], data4: DATA_BG[3], data5: DATA_BG[4], data6: DATA_BG[5],
};
// Voice samples: each voice's family (repointed voices set --font-voice-* on the canvas).
const voiceSample = css({ fontSize: '[1.5em]', lineHeight: 'snug' });
const VOICE_FONT: Record<string, string> = {
  display: css({ fontFamily: 'var(--font-voice-display, var(--fonts-display))' }),
  heading: css({ fontFamily: 'var(--font-voice-heading, var(--fonts-sans))' }),
  body: css({ fontFamily: 'var(--font-voice-body, var(--fonts-sans))' }),
  ui: css({ fontFamily: 'var(--font-voice-ui, var(--fonts-controls))' }),
  numeric: css({ fontFamily: 'var(--font-voice-numeric, var(--font-voice-ui, var(--fonts-controls)))', fontVariantNumeric: 'tabular-nums lining-nums' }),
  code: css({ fontFamily: 'var(--font-voice-code, var(--fonts-mono))', whiteSpace: 'pre' }),
};
const barStack = css({ display: 'flex', flexDirection: 'column-reverse', justifyContent: 'flex-start', gap: '[1px]', width: '3/5', flex: '1', minHeight: '0', marginInline: 'auto', '& > span': { display: 'block', flexShrink: 0, height: '[calc(var(--v) * 100%)]' }, '& > span:last-child': { borderTopRadius: 'sm' } });
const legend = css({ display: 'flex', flexWrap: 'wrap', columnGap: '4', rowGap: '1.5', textStyle: 'caption', '& span': { display: 'inline-flex', alignItems: 'center', gap: '1.5' } });
const stateRow = css({ display: 'flex', gap: '3', flexWrap: 'wrap' });
const stateCell = css({ display: 'flex', flexDirection: 'column', gap: '1' });
const callout = css({ padding: '3', borderRadius: 'lg', textStyle: 'body' });
const trackStack = css({ display: 'flex', flexDirection: 'column', gap: '4', width: '[min(100%, 24rem)]' });

function Section({ id, title, children, note }: { id: string; title: string; note: string; children: React.ReactNode }) {
  return (
    <section className={section} aria-labelledby={id}>
      <header className={sectionHead}>
        <h2 id={id} className={sectionTitle}>{title}</h2>
        <p className={caption}>{note}</p>
      </header>
      {children}
    </section>
  );
}

function Row({ label, size, children }: { label: string; size?: string; children: React.ReactNode }) {
  return (
    <div className={rowGrid}>
      <span className={rowLabel}>{label}</span>
      <div className={specimens} data-size={size}>{children}</div>
    </div>
  );
}

const Divider = () => <hr className={divider} />;
const SIZE_ROWS = [['2', '16px'], ['3', '24px'], ['4', '32px'], ['4.5', '36px'], ['6', '48px']] as const;

// Sample images as inline SVG gradients (no network).
const art = (a: string, b: string, label: string) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="800" height="600" fill="url(#g)"/><text x="40" y="560" font-family="system-ui" font-size="48" fill="white" fill-opacity=".85">${label}</text></svg>`)}`;
const IMAGES = [art('#4f46e5', '#06b6d4', 'Dawn'), art('#f97316', '#db2777', 'Dusk'), art('#16a34a', '#0ea5e9', 'Coast'), art('#1e293b', '#7c3aed', 'Night')];

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

export function Canvas({ view, spectrum, params, voices, faces }: { view: View; spectrum?: SpectrumPayload; params: ThemeParams; voices: VoiceMap; faces: FaceMap }) {
  return (
    <main className={`${shell} ${canvasQuery}`} id="page">
      {view === 'components' && <Components />}
      {(view === 'containers' || view === 'colors') && <Surfaces view={view} spectrum={spectrum} params={params} />}
      {view === 'typography' && <Typography params={params} voices={voices} faces={faces} />}
    </main>
  );
}

function Components() {
  const [status, setStatus] = useState('');
  return (
    <>
      <header className={header}>
        <h1 className={pageTitle}>ui-kit specimens</h1>
        <p className={lead}>Every web component at its default theme. Sizes are the unit u (control height 8u); the studio panel changes the theme live.</p>
      </header>

      <Divider />
      <Section id="buttons" title="Buttons" note="Construction pattern: leading icon, prefix, label, suffix, trailing icon. Icon slots at least 6u; text parts 1u apart, 1u beside a slot, 2u at a bare edge; padding 1u; text 10px + u.">
        <Row label="Slots">
          <ui-button><i slot="leading" name="plus" />Add item</ui-button>
          <ui-button>Next<i slot="trailing" name="arrow-right" /></ui-button>
          <ui-button aria-label="Add"><i slot="leading" name="plus" /></ui-button>
          <ui-button icon-size="fill"><span slot="leading" className={avatar} />Kim</ui-button>
        </Row>
        <Row label="Primary">
          <ui-button variant="primary">Save</ui-button>
          <ui-button variant="primary"><i slot="leading" name="plus" />Add item</ui-button>
          <ui-button variant="primary">Publish<span slot="suffix">⌘P</span></ui-button>
          <ui-button variant="primary" aria-label="Add"><i slot="leading" name="plus" /></ui-button>
          <ui-button variant="primary" loading>Saving</ui-button>
          <ui-button variant="primary" disabled>Disabled</ui-button>
        </Row>
        <Row label="Prefix / suffix">
          <ui-button><i slot="leading" name="credit-card" /><span slot="prefix">$</span>Pay 40<span slot="suffix">⌘P</span><i slot="trailing" name="caret-down" /></ui-button>
          <ui-button>Save<span slot="suffix">⌘S</span></ui-button>
          <ui-button><i slot="leading" name="bell" />Inbox<span slot="suffix">12</span></ui-button>
          <ui-chip selectable>Unread<span slot="suffix">4</span></ui-chip>
          <ui-tag><i slot="leading" name="tag" />Size<span slot="suffix">M</span></ui-tag>
        </Row>
        <Row label="Icon sizes">
          {(['sm', 'md', 'lg'] as const).map((k) => <ui-button key={k} icon-size={k}><i slot="leading" name="star" />{k}</ui-button>)}
          <ui-button icon-size="fill"><span slot="leading" className={avatar} />fill</ui-button>
        </Row>
        <Row label="States">
          <ui-button>Default</ui-button>
          <ui-button loading>Loading</ui-button>
          <ui-button disabled>Disabled</ui-button>
        </Row>
        {SIZE_ROWS.map(([u, h]) => (
          <Row key={u} label={`Size ${u} · ${h}`} size={u}>
            <ui-button><i slot="leading" name="plus" />Button</ui-button>
            <ui-button aria-label="More"><i slot="leading" name="dots-three" /></ui-button>
          </Row>
        ))}
      </Section>

      <Divider />
      <Section id="btg" title="Badges, tags, chips" note="Heights 12px + k·u (badge 1, tag 2, chip 3), capped below the control height.">
        {SIZE_ROWS.map(([u, h]) => (
          <Row key={u} label={`Size ${u} · ${h}`} size={u}>
            <ui-badge>3</ui-badge>
            <ui-badge>New</ui-badge>
            <ui-tag><i slot="leading" name="star" />Featured</ui-tag>
            <ui-chip selectable selected><i slot="leading" name="check" />Design</ui-chip>
            <ui-chip selectable>Engineering</ui-chip>
            <ui-chip removable>Remote</ui-chip>
          </Row>
        ))}
      </Section>

      <Divider />
      <Section id="fields" title="Fields" note="No native form elements. Errors appear after interaction or a submit attempt; the form submits real values.">
        <form className={formGrid} onSubmit={(e) => { e.preventDefault(); setStatus(JSON.stringify(Object.fromEntries(new FormData(e.currentTarget)))); }}>
          <ui-input name="email" type="email" required label="Email" placeholder="you@example.com" description="We never share it." />
          <ui-input name="password" type="password" required minlength={12} label="Password" value="hunter2" />
          <ui-input name="team" label="Team" error="That name is taken." value="Acme" />
          <ui-input name="price" label="Price" value="40"><span slot="prefix">$</span><span slot="suffix">USD</span></ui-input>
          <ui-input name="search" label="Search" placeholder="Find a file"><i slot="leading" name="magnifying-glass" /><span slot="suffix">⌘K</span></ui-input>
          <ui-select name="role" label="Role" required>
            <ui-option value="design">Designer</ui-option>
            <ui-option value="eng">Engineer</ui-option>
            <ui-option value="research">Researcher</ui-option>
          </ui-select>
          <ui-checkbox name="terms" required>I accept the terms</ui-checkbox>
          <div className={specimens}>
            <ui-button type="submit">Create account</ui-button>
            <ui-button type="reset">Reset</ui-button>
          </div>
          <p className={caption} role="status">{status}</p>
        </form>
      </Section>

      <Divider />
      <Section id="selection" title="Selection" note="Select, segmented control and listbox share one option model; composites pad 0.5u so a segmented row stays 8u.">
        <div className={columns}>
          <div className={stack}>
            <ui-select name="role" label="Role" required description="You can change this later.">
              <ui-option value="design">Designer</ui-option>
              <ui-option value="eng">Engineer</ui-option>
              <ui-option value="pm" disabled>Product manager</ui-option>
              <ui-option value="research">Researcher</ui-option>
            </ui-select>
            <ui-segmented name="plan" value="monthly" label="Billing">
              <ui-option value="monthly">Monthly</ui-option>
              <ui-option value="yearly">Yearly</ui-option>
            </ui-segmented>
          </div>
          <ui-listbox name="region" value="eu" label="Region">
            <ui-option value="us"><i slot="leading" name="globe" />United States</ui-option>
            <ui-option value="eu"><i slot="leading" name="globe" />Europe</ui-option>
            <ui-option value="apac"><i slot="leading" name="globe" />Asia Pacific</ui-option>
          </ui-listbox>
        </div>
      </Section>

      <Divider />
      <Section id="choices" title="Checkbox, radio, switch" note="A 5u box (switch 9u × 5u) in the 6u leading slot; the label starts 1u after the slot.">
        <Row label="Checkbox">
          <ui-checkbox>Email updates</ui-checkbox>
          <ui-checkbox checked>Push</ui-checkbox>
          <ui-checkbox indeterminate>Some</ui-checkbox>
          <ui-checkbox disabled>Disabled</ui-checkbox>
        </Row>
        <Row label="Radio">
          <ui-radio name="plan-r" value="free" checked>Free</ui-radio>
          <ui-radio name="plan-r" value="pro">Pro</ui-radio>
          <ui-radio name="plan-r" value="team">Team</ui-radio>
        </Row>
        <Row label="Switch">
          <ui-switch checked>Wi-Fi</ui-switch>
          <ui-switch>Bluetooth</ui-switch>
        </Row>
        {SIZE_ROWS.slice(1, 4).map(([u, h]) => (
          <Row key={u} label={`Size ${u} · ${h}`} size={u}>
            <ui-checkbox checked>Checkbox</ui-checkbox><ui-radio checked>Radio</ui-radio><ui-switch checked>Switch</ui-switch>
          </Row>
        ))}
      </Section>

      <Divider />
      <Section id="tracks" title="Range and progress" note="A 4u track. The range thumb sits inside it (track − u, inset 0.5u) and the fill wraps it with a concentric cap. Arrow keys, Page Up/Down, Home/End, drag.">
        <Row label="Range"><div className={trackStack}><ui-range label="Volume" value={40} /><ui-range label="Steps" min={0} max={10} step={1} value={3} /></div></Row>
        <Row label="Progress"><div className={trackStack}><ui-progress label="Upload" value={64} /><ui-progress label="Loading" /></div></Row>
      </Section>

      <Divider />
      <Section id="media" title="Swiper and image" note="Scroll-snap carousel with paddles and dots; images take a cover format, a fit, and an optional inline slideshow (controls on hover).">
        <Row label="Swiper">
          <ui-swiper label="Gallery" className={media}>
            {IMAGES.map((src, i) => <ui-image key={i} src={src} alt={`Slide ${i + 1}`} ratio="wide" />)}
          </ui-swiper>
        </Row>
        <Row label="Formats">
          <div className={formats}>
            {['square', 'landscape', 'portrait', 'wide', 'golden'].map((r, i) => (
              <figure key={r} className={figure}><ui-image src={IMAGES[i % 4]} alt={r} ratio={r} /><figcaption className={caption}>{r}</figcaption></figure>
            ))}
          </div>
        </Row>
        <Row label="Slideshow">
          <ui-image slideshow ratio="wide" alt="Places" className={media}>
            {IMAGES.map((src, i) => <img key={i} src={src} alt={`Place ${i + 1}`} />)}
          </ui-image>
        </Row>
      </Section>

      <Divider />
      <Section id="swatches" title="Swatch and palette" note="Swatches are 6u; a palette attaches them with no gaps and can be a selectable listbox.">
        <Row label="Swatches">
          {['#ef4444', '#f59e0b', '#10b981', '#3b82f6', 'oklch(0.6 0.2 300 / 0.5)'].map((c) => <ui-swatch key={c} color={c} />)}
        </Row>
        <Row label="Palette">
          <ui-palette label="Brand" name="brand" value="#3b82f6">
            {['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'].map((c) => <ui-swatch key={c} color={c} />)}
          </ui-palette>
        </Row>
      </Section>
    </>
  );
}

// Containers and colors share one page: the Containers tab opens it at the container sections,
// the Colors tab at Color in context. Every container token has a live example.
function Surfaces({ view, spectrum, params }: { view: View; spectrum?: SpectrumPayload; params: ThemeParams }) {
  useEffect(() => {
    document.getElementById(view === 'containers' ? 'containers' : 'context')?.scrollIntoView({ block: 'start' });
  }, [view]);
  const r = spectrum?.roles;
  return (
    <>
      <header className={header}>
        <h1 className={pageTitle}>Containers and colors</h1>
        <p className={lead}>Surfaces, their spacing and their color on one page.{r ? ` Brand: primary ${r.primary}, secondary ${r.secondary}, neutral ${r.neutral}.` : ''}</p>
      </header>
      <Divider />
      {spectrum ? (
        <Section id="context" title="Color in context" note="Two synthetic settings for reviewing the active palette: primary as material and secondary as punctuation, then neutral surfaces with primary actions and semantic feedback. Content and figures are illustrative.">
          <ColorInContext spectrum={spectrum} />
        </Section>
      ) : <p className={lead}>Generating colors…</p>}
      <Divider />
      <ContainerSections params={params} />
      {spectrum && <><Divider /><ColorSections spectrum={spectrum} /></>}
    </>
  );
}

const LEVELS = Object.keys(CONTAINERS) as (keyof typeof CONTAINERS)[];
const fmtU = (n: number) => `${Math.round(n * 100) / 100}u`;

function ContainerSections({ params }: { params: ThemeParams }) {
  const p = params as unknown as Record<string, number>;
  const u = params.unit;
  return (
    <>
      <Section id="containers" title="Container tokens" note="Three families. Wrappers (composite, group, collection) hug their children: radius 3u + padding, concentric. Containers (card, padding xs…xl) are surfaces: radius = padding. Areas (panel, region, page) are square. Live padding and gap per level (pad-<level>, gap-<level>, in u).">
        <div className={tokenTable} role="table" aria-label="Container tokens">
          <div role="row" className={tokenHead}><span role="columnheader">Level</span><span role="columnheader">Padding</span><span role="columnheader">Gap</span><span role="columnheader">Radius</span><span role="columnheader">Used by</span></div>
          {LEVELS.map((l) => {
            const pad = p[`pad-${l}`] ?? CONTAINERS[l].padding, gap = p[`gap-${l}`] ?? pad;
            const c = resolveContainer(l, { unit: u, border: params.border, radiusScale: params['radius-scale'], padUnits: pad, gapUnits: gap });
            return (
              <div role="row" key={l} className={tokenRow}>
                <span role="cell">{l}<span className={caption}> · {CONTAINERS[l].family}</span></span>
                <span role="cell" data-numeric>{fmtU(pad)} · {fmt(c.padding)}px</span>
                <span role="cell" data-numeric>{fmtU(gap)} · {fmt(c.gap)}px</span>
                <span role="cell" data-numeric>{fmt(c.radius)}px</span>
                <span role="cell" className={caption}>{USED_BY[l]}</span>
              </div>
            );
          })}
        </div>
      </Section>
      <Divider />
      <Section id="levels" title="Levels" note="Each box tints its padding; the two children show its gap.">
        {LEVELS.filter((l) => l !== 'composite').map((l) => {
          const Tag = (l.startsWith('card-') ? 'ui-card' : `ui-${l}`) as any;
          const padding = l.startsWith('card-') && l !== 'card-md' ? l.slice(5) : undefined;
          return (
            <Row key={l} label={l.startsWith('card-') ? `card · padding ${l.slice(5)}` : l}>
              <Tag className={levelBox} padding={padding}><span className={levelChild}>a</span><span className={levelChild}>b</span></Tag>
            </Row>
          );
        })}
        <Row label="composite">
          <ui-segmented label="Composite level" value="a"><ui-option value="a">One</ui-option><ui-option value="b">Two</ui-option><ui-option value="c">Three</ui-option></ui-segmented>
          <ui-listbox label="Composite list" value="a" className={levelList}><ui-option value="a">Alpha</ui-option><ui-option value="b">Beta</ui-option></ui-listbox>
        </Row>
      </Section>
      <Divider />
      <Section id="nesting" title="Nesting" note="Areas (page › region › panel) hold containers (card, a small card inside), which hold wrappers (collection › group). A container's radius equals its padding; wrappers stay concentric with their children.">
        <ui-page className={miniPage} aria-label="Page example">
          <span className={kicker}>Page · max width {PAGE_MAX_WIDTH_REM}rem</span>
          <ui-region aria-label="Region example" className={tinted}>
            <span className={kicker}>Region</span>
            <ui-panel aria-label="Panel example">
              <span className={kicker}>Panel</span>
              <div className={columns}>
                <ui-card>
                  <span className={kicker}>Card · Team</span>
                  {[['Design', ['Ada', 'Grace']], ['Engineering', ['Linus', 'Margaret']]].map(([team, people]) => (
                    <ui-card padding="sm" key={team as string}>
                      <span className={kicker}>Card sm · {team}</span>
                      <ui-collection>
                        {(people as string[]).map((n) => (
                          <div key={n} className={tileRow}>
                            <span>{n}</span>
                            <ui-group><ui-button>Message</ui-button><ui-button aria-label="More"><i slot="leading" name="dots-three" /></ui-button></ui-group>
                          </div>
                        ))}
                      </ui-collection>
                    </ui-card>
                  ))}
                </ui-card>
                <ui-card>
                  <span className={kicker}>Card · Details</span>
                  <ui-input label="Name" value="Spring catalog" />
                  <ui-select label="Edition" value="spring"><ui-option value="spring">Spring</ui-option><ui-option value="autumn">Autumn</ui-option></ui-select>
                  <ui-group><ui-button>Save</ui-button><ui-button>Cancel</ui-button></ui-group>
                </ui-card>
              </div>
            </ui-panel>
          </ui-region>
        </ui-page>
      </Section>
      <Divider />
      <Section id="groups" title="Groups and collections" note="Groups wrap inline items at the group gap; collections stack like items at the collection gap, inside a card (card › collection › group).">
        <Row label="buttons"><ui-group><ui-button>Bold</ui-button><ui-button>Italic</ui-button><ui-button>Underline</ui-button></ui-group></Row>
        <Row label="chips"><ui-group>{['Design', 'Engineering', 'Research', 'Ops'].map((t, i) => <ui-chip key={t} selectable selected={i === 0 || undefined}>{t}</ui-chip>)}</ui-group></Row>
        <Row label="tags"><ui-group>{['Spring', 'Draft', 'Shared'].map((t) => <ui-tag key={t}>{t}</ui-tag>)}</ui-group></Row>
        <Row label="collection in a card">
          <ui-card padding="sm" className={wideCol}>
            <ui-collection>
              {['Inbox · 12', 'Drafts · 3', 'Archive'].map((t) => <span key={t}>{t}</span>)}
            </ui-collection>
          </ui-card>
        </Row>
        <Row label="card grid">
          <ui-card className={tileGrid}>
            {['Dawn', 'Dusk', 'Coast', 'Night'].map((t, i) => (
              <ui-card padding="xs" key={t}><ui-image src={IMAGES[i]} alt={t} ratio="landscape" /><span>{t}</span></ui-card>
            ))}
          </ui-card>
        </Row>
      </Section>
      <Divider />
      <Section id="overrides" title="Overrides" note='gap="n" overrides one element’s gap (0–8u); data-size sets the unit for a whole subtree.'>
        <Row label="gap">
          {[0, 1, 4].map((g) => (
            <ui-card key={g} gap={String(g)} className={levelBox}>
              <span className={caption}>card gap="{g}"</span><span className={levelChild} /><span className={levelChild} />
            </ui-card>
          ))}
        </Row>
        <Row label="size">
          {(['3', '4', '5'] as const).map((z) => (
            <ui-card key={z} data-size={z}>
              <span className={kicker}>data-size="{z}"</span>
              <h3 className={subTitle}>Card</h3>
              <ui-group><ui-button>Save</ui-button><ui-button>Cancel</ui-button></ui-group>
            </ui-card>
          ))}
        </Row>
      </Section>
    </>
  );
}

const USED_BY: Record<keyof typeof CONTAINERS, string> = {
  composite: 'listbox, segmented, select popup',
  group: 'inline sets: buttons, chips, tags',
  collection: 'tables, data lists: like items inside a card',
  'card-xs': 'thumbnails, compact items',
  'card-sm': 'grouped lists, small items in a grid',
  'card-md': 'self-contained content (default card)',
  'card-lg': 'feature content',
  'card-xl': 'hero or dialog surfaces',
  panel: 'sidebars, workspaces',
  region: 'page areas',
  page: 'the outer frame (max width)',
};

// Spectrum variables for a family step (follow the active scheme and the jig's roles).
// Illustrative orders per channel, Monday through Sunday; one data color per channel (data 1–6).
const CHANNELS: [string, number[]][] = [
  ['Online', [72, 84, 68, 96, 108, 88, 80]], ['In store', [44, 49, 54, 46, 64, 82, 78]], ['Wholesale', [20, 26, 22, 30, 28, 12, 10]],
  ['Marketplace', [18, 15, 21, 19, 25, 30, 27]], ['Social', [9, 12, 10, 14, 18, 24, 22]], ['Events', [0, 0, 6, 0, 12, 20, 8]],
];
const DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

function ColorInContext({ spectrum }: { spectrum: SpectrumPayload }) {
  // Every color here is a role: brand (primary, secondary, neutral), feedback and data series.
  const { primary, critical, info } = spectrum.roles;
  const max = Math.max(...DAYS.map((_, d) => CHANNELS.reduce((sum, [, v]) => sum + v[d], 0)));
  const [approved, setApproved] = useState(false);
  return (
    <div className={context}>
      <div className={contextHead}><h3 className={subTitle}>Brand</h3><span className={caption}>Primary as material · secondary as punctuation</span></div>
      <div className={brandGrid}>
        <ui-panel className={cx(campaign, tone.solid)}>
          <span className={sectionKicker}>Studio / Collection 01</span>
          <h3 className={display}>A spectrum.<br />A shared language.</h3>
          <p className={bodyLarge}>Different hues, one system. Color carries the character; a common rhythm holds it together.</p>
          <span className={cx(sectionKicker, tone.secondaryOnSolid)}>An exploration in color &amp; proportion</span>
        </ui-panel>
        <div data-ramp className={rampStrip} role="img" aria-label={`${primary} steps 1 to 12`}>
          {RAMP_USE.map((use, i) => (
            <div key={i} className={cx(rampStep, RAMP_STEP[i])}>
              <span>{i + 1}</span><span>{use}</span>
            </div>
          ))}
        </div>
        <ui-panel className={tone.paper}>
          <span className={cx(sectionKicker, tone.muted)}>Ink &amp; paper <i className={cx(dot, tone.secondaryDot)} /></span>
          <h3 className={panelTitle}>One hue.<br />Room to breathe.</h3>
          <p className={tone.muted}>A quiet field, a clear voice and a single primary.</p>
        </ui-panel>
        <ui-panel className={tone.tint}>
          <span className={sectionKicker}>Tint &amp; emphasis</span>
          <strong className={bigFigure}>62<span>%</span></strong>
          <p className={tone.tintStrong}>Large figures and small details share the same color family.</p>
        </ui-panel>
      </div>

      <div className={contextHead}><h3 className={subTitle}>Interface</h3><span className={caption}>Neutral surfaces · primary actions · semantic feedback</span></div>
      <ui-panel>
        <div className={workspaceHead}>
          <div><span className={kicker}>Collection workspace</span><h3 className={subTitle}>Spring catalog</h3></div>
          <ui-tag>Spring edition</ui-tag>
          <ui-badge className={tone.success}>Ready for review</ui-badge>
        </div>
        <div className={uiGrid}>
          <ui-card>
            <span className={kicker}>Overview</span><h4 className={cardTitle}>A little color goes a long way.</h4>
            <p className={caption}>Review the collection, refine its details and prepare the next edition.</p>
            <div className={specimens}>
              <ui-button variant="primary" onClick={() => setApproved(true)}>Approve collection</ui-button>
              <ui-button onClick={() => setApproved(false)}>Reset approval</ui-button>
            </div>
            <p className={caption} role="status">{approved ? 'Collection approved' : 'Demo collection · awaiting approval'}</p>
          </ui-card>
          <ui-card>
            <span className={kicker}>Details</span>
            <ui-input label="Collection name" value="Spring catalog" />
            <ui-checkbox checked>Include neutral colors</ui-checkbox>
            <ui-checkbox>Include alternate editions</ui-checkbox>
          </ui-card>
          <ui-card>
            <span className={kicker}>Library</span>
            <ui-listbox label="Preview library" value="shared">
              {['Inbox', 'Drafts', 'Shared', 'Archive'].map((n) => <ui-option key={n} value={n.toLowerCase()}>{n}</ui-option>)}
            </ui-listbox>
          </ui-card>
          <ui-card>
            <span className={kicker}>This week</span><strong className={bigFigure} data-numeric>1,284</strong>
            <p className={caption}>Orders across six channels.</p>
            <ui-badge className={tone.success}>↑ 12% this week</ui-badge>
          </ui-card>
          <ui-card>
            <span className={kicker}>Collection progress</span><strong className={bigFigure}>62<span>%</span></strong>
            <ui-progress label="Collection progress" value={62} />
            <p className={caption}>148 of 240 items reviewed.</p>
          </ui-card>
          <ui-card>
            <span className={kicker}>Action states</span>
            <div className={stateRow}>
              <div className={stateCell}><span className={caption}>Rest</span><ui-button variant="primary">Approve</ui-button></div>
              <div className={stateCell}><span className={caption}>Hover, press</span><ui-button variant="primary" className={tone.solidHover}>Approve</ui-button></div>
              <div className={stateCell}><span className={caption}>Busy</span><ui-button variant="primary" loading>Approve</ui-button></div>
              <div className={stateCell}><span className={caption}>Disabled</span><ui-button variant="primary" disabled>Approve</ui-button></div>
            </div>
          </ui-card>
          <ui-card className={chartCard}>
            <div className={contextHead}><h4 className={cardTitle}>Orders by channel</h4><span className={caption}>Illustrative week</span></div>
            <div className={chart} role="img" aria-label={`Illustrative orders by channel, Monday through Sunday. ${CHANNELS.map(([n, v]) => `${n}: ${v.join(', ')}`).join('. ')}.`}>
              {DAYS.map((d, i) => (
                <div key={i} className={chartDay}>
                  <div className={barStack}>
                    {/* The value is the only inline style: a ratio custom property (styles: barStack). */}
                    {CHANNELS.map(([n, v], c) => <span key={n} className={DATA_BG[c]} style={{ '--v': String(v[i] / max) } as React.CSSProperties} />)}
                  </div>
                  <span className={caption}>{d}</span>
                </div>
              ))}
            </div>
            <div className={legend}>{CHANNELS.map(([n], c) => <span key={n}><i className={cx(dot, DATA_BG[c])} />{n}</span>)}</div>
          </ui-card>
          <ui-card className={feedbackCard}>
            <span className={kicker}>Feedback</span>
            <p className={cx(callout, tone.tint)} role="note">Changes to this palette appear across every preview.</p>
            <p className={cx(callout, tone.warning)} role="note">Check small text and neighboring hues before choosing a brand color.</p>
            <p className={cx(callout, tone.critical)} role="note">Critical: {critical} carries destructive actions.</p>
            <p className={cx(callout, tone.info)} role="note">Info: {info} marks neutral announcements.</p>
          </ui-card>
        </div>
      </ui-panel>
    </div>
  );
}

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
  'control-small': 'Details',
};
const fmt = (n: number) => String(Math.round(n * 100) / 100);

function Typography({ params, voices, faces }: { params: ThemeParams; voices: VoiceMap; faces: FaceMap }) {
  const opts = { unit: params.unit, ratio: params['type-ratio'], rhythm: params['type-rhythm'], voices, faces };
  const grid = params['type-rhythm'] * params.unit;
  return (
    <>
      <header className={header}>
        <h1 className={pageTitle}>Typography</h1>
        <p className={lead}>Roles from massimo-ui on the u ramp: size = (10px + u) × ratio^step, or n·u for caption, code and small controls; line heights round up to the rhythm. Unit {fmt(params.unit)}px · ratio {params['type-ratio']} · rhythm {grid ? `${fmt(grid)}px` : 'none'}.</p>
      </header>
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
    </>
  );
}

const f2 = (n: number) => (Number.isFinite(n) ? n.toFixed(2) : '–');
const f1 = (n: number) => (Number.isFinite(n) ? n.toFixed(1) : '–');

function EngineSummary({ spectrum }: { spectrum: SpectrumPayload }) {
  const d = spectrum.diagnostics;
  return (
    <p className={summary}>
      T* <b>{f2(d.peakTone)}</b> · C* <b>{f2(d.peakChroma)}</b>, limited by {d.limitedBy} · {d.target === 'display-p3' ? 'Display P3' : 'sRGB'} · {d.primary.name} Lc 11/12: light <b>{f1(d.primary.light.r11)}/{f1(d.primary.light.r12)}</b>, dark <b>{f1(d.primary.dark.r11)}/{f1(d.primary.dark.r12)}</b> · {spectrum.ms} ms
    </p>
  );
}

const W = 560, PAD = 28;
function QuadratureChart({ d, primary }: { d: SpectrumPayload['diagnostics']; primary: string }) {
  const top = 70, bottom = 170, xH = (H: number) => PAD + (H / 400) * (W - 2 * PAD), xh = (h: number) => PAD + (h / 360) * (W - 2 * PAD);
  return (
    <svg viewBox={`0 0 ${W} 210`} className={chartSvg} role="img" aria-label={`Hue quadrature of ${d.accents.length} accents`}>
      <text x={PAD} y={22} className={chartLabel}>H · hue quadrature</text>
      <text x={PAD} y={204} className={chartLabel}>h · hue angle (°)</text>
      <line x1={PAD} x2={W - PAD} y1={top} y2={top} className={axis} />
      <line x1={PAD} x2={W - PAD} y1={bottom} y2={bottom} className={axis} />
      {UNIQUE.map((u) => (
        <g key={u.name}>
          <line x1={xH(u.H)} y1={top} x2={xh(u.h)} y2={bottom} className={dashed} />
          <text x={xH(u.H) + 3} y={top + 14} className={chartTick}>{u.name} {u.H}</text>
          <text x={xh(u.h) + 3} y={bottom + 14} className={chartTick}>{u.h}</text>
        </g>
      ))}
      {d.accents.map((a, i) => {
        const strong = a.name === primary;
        return (
          <g key={a.name}>
            <line x1={xH(a.H)} y1={top} x2={xh(a.h)} y2={bottom} stroke={a.color} strokeWidth={strong ? 3 : 1.5} />
            <circle cx={xH(a.H)} cy={top} r={strong ? 5 : 3.5} fill={a.color} />
            <circle cx={xh(a.h)} cy={bottom} r={strong ? 5 : 3.5} fill={a.color} />
            <text x={xH(a.H)} y={top - 10 - (i % 2) * 11} textAnchor="middle" className={chartTick}>{a.name}</text>
          </g>
        );
      })}
    </svg>
  );
}

function ChromaChart({ d }: { d: SpectrumPayload['diagnostics'] }) {
  const H = 230, L = 34, R = W - 12, T = 14, B = H - 24;
  const maxC = Math.ceil(Math.max(...d.accents.flatMap((a) => a.curve.map(([, c]) => c))) / 20) * 20;
  const x = (t: number) => L + ((t - d.tones[0]) / (d.tones[1] - d.tones[0])) * (R - L), y = (c: number) => B - (c / maxC) * (B - T);
  const path = (pts: [number, number][]) => pts.map(([t, c], i) => `${i ? 'L' : 'M'}${x(t).toFixed(1)},${y(c).toFixed(1)}`).join('');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={chartSvg} role="img" aria-label={`Max in-gamut chroma by tone; peak tone ${f2(d.peakTone)}, chroma ${f2(d.peakChroma)}`}>
      {Array.from({ length: maxC / 20 + 1 }, (_, i) => i * 20).map((c) => (
        <g key={c}><line x1={L} x2={R} y1={y(c)} y2={y(c)} className={grid} /><text x={L - 6} y={y(c) + 3} textAnchor="end" className={chartTick}>{c}</text></g>
      ))}
      {Array.from({ length: 8 }, (_, i) => 20 + i * 10).map((t) => <text key={t} x={x(t)} y={H - 8} textAnchor="middle" className={chartTick}>{t}</text>)}
      {d.accents.map((a) => <path key={a.name} d={path(a.curve)} fill="none" stroke={a.color} strokeWidth={1.5} />)}
      <path d={path(d.weakest)} fill="none" stroke="currentColor" strokeWidth={3} />
      <line x1={x(d.peakTone)} x2={x(d.peakTone)} y1={T} y2={B} className={dashed} />
      <line x1={L} x2={R} y1={y(d.peakChroma)} y2={y(d.peakChroma)} className={dashed} />
      <circle cx={x(d.peakTone)} cy={y(d.peakChroma)} r={4} fill="currentColor" />
      <text x={x(d.peakTone) + 5} y={T + 10} className={chartTick}>T* {f2(d.peakTone)}</text>
      <text x={L + 4} y={y(d.peakChroma) - 5} className={chartTick}>C* {f2(d.peakChroma)}</text>
    </svg>
  );
}

function ColorSections({ spectrum }: { spectrum: SpectrumPayload }) {
  const r = spectrum.roles;
  return (
    <>
      <Section id="roles" title="Roles" note="Each role is a family. Brand: primary, secondary, neutral. Feedback: critical, warning, success, info. Data 1–6: chart series and categories. Swatches show step 9 (the solid).">
        <div className={roleGrid}>
          {(Object.keys(r) as (keyof typeof r)[]).map((role) => (
            <figure key={role} className={roleChip}>
              <span className={cx(roleSwatch, ROLE_BG[role])} />
              <figcaption><span className={rowLabel}>{role.startsWith('data') ? `Data ${role.slice(4)}` : role[0].toUpperCase() + role.slice(1)}</span><span className={metrics}>{r[role]}</span></figcaption>
            </figure>
          ))}
        </div>
      </Section>
      <Divider />
      <Section id="engine" title="Hue and chroma" note="What shaped this generation: where each accent sits in hue quadrature, and how much chroma each hue can hold at each tone in the target gamut.">
        <EngineSummary spectrum={spectrum} />
        <div className={chartGrid}>
          <figure className={chartFig}><QuadratureChart d={spectrum.diagnostics} primary={r.primary} /><figcaption className={caption}>Even steps in quadrature H (top) land at uneven hue angles h (bottom). Dashed lines mark unique red, yellow, green and blue.</figcaption></figure>
          <figure className={chartFig}><ChromaChart d={spectrum.diagnostics} /><figcaption className={caption}>Max in-gamut chroma per accent by tone. The bold curve is the weakest hue at each tone; T* is its peak, where the shared chroma C* is set.</figcaption></figure>
        </div>
      </Section>
      <Divider />
      <Section id="ramps" title="Ramps" note="Steps 1–2 backgrounds, 3–5 interactive, 6–8 borders, 9–10 solids, 11–12 text. Light left, dark right.">
        {spectrum.families.map((f) => (
          <div key={f.name} className={rampRow}>
            <span className={rowLabel}>{f.name}{[r.primary, r.neutral, r.critical].includes(f.name) ? ' ●' : ''}</span>
            <ui-palette label={`${f.name} light`} className={ramp}>{f.light.map((c, i) => <ui-swatch key={i} color={c} label={`${f.name} ${i + 1} light`} />)}</ui-palette>
            <ui-palette label={`${f.name} dark`} className={ramp}>{f.dark.map((c, i) => <ui-swatch key={i} color={c} label={`${f.name} ${i + 1} dark`} />)}</ui-palette>
          </div>
        ))}
      </Section>
    </>
  );
}

