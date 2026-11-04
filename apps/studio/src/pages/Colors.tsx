// Colors: the role overview, Color in context (brand and interface), what shaped the generation
// (hue and chroma), the contrast model (Lc targets vs achieved, white and black) and every family's
// light and dark ramps. Every demo color is a role token.
import '@massimo/ui-kit/components/button/element';
import '@massimo/ui-kit/components/input/element';
import '@massimo/ui-kit/components/listbox/element';
import '@massimo/ui-kit/components/btg/element';
import '@massimo/ui-kit/components/choice/element';
import '@massimo/ui-kit/components/range/element';
import '@massimo/ui-kit/components/color/element';
import { useState } from 'react';
import { css, cx } from '../../styled-system/css/index.js';
import { UNIQUE_HUES as UNIQUE, TARGET_MAX, apcaLc } from '@massimo/ui-kit/spectrum';
import type { SpectrumPayload } from '../protocol.ts';
import type { PageProps } from './types.ts';
import { CQ_LG, CQ_MD, Divider, Page, Section, caption, dataTable, kicker, metrics, nameCell, noteCell, rowLabel, specimens, subTitle, tableScroller } from './shared.tsx';

const rampRow = css({ display: 'grid', gridTemplateColumns: '1fr', gap: '3', alignItems: 'center', [CQ_MD]: { gridTemplateColumns: '7rem 1fr 1fr' } });
const ramp = css({ width: 'full' });
const summary = css({ textStyle: 'code', '& b': { color: 'primary.fg', fontWeight: 'regular' } });
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
const sectionKicker = css({ textStyle: 'section-kicker', display: 'inline-flex', alignItems: 'center', gap: '2' });
// Display needs the width: below the medium canvas the campaign title steps down to heading-1.
const display = css({ textStyle: 'heading-1', [CQ_MD]: { textStyle: 'display' } });
const bodyLarge = css({ textStyle: 'body-large' });
const panelTitle = css({ textStyle: 'heading-2', [CQ_LG]: { textStyle: 'heading-1' } });
const bigFigure = css({ textStyle: 'heading-1', '& span': { textStyle: 'heading-3' } });
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
  '& ui-container[preset=card] > ui-badge': { alignSelf: 'start' },
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
const barStack = css({ display: 'flex', flexDirection: 'column-reverse', justifyContent: 'flex-start', gap: '[1px]', width: '3/5', flex: '1', minHeight: '0', marginInline: 'auto', '& > span': { display: 'block', flexShrink: 0, height: '[calc(var(--v) * 100%)]' }, '& > span:last-child': { borderTopRadius: 'sm' } });
const legend = css({ display: 'flex', flexWrap: 'wrap', columnGap: '4', rowGap: '1.5', textStyle: 'caption', '& span': { display: 'inline-flex', alignItems: 'center', gap: '1.5' } });
const stateRow = css({ display: 'flex', gap: '3', flexWrap: 'wrap' });
const stateCell = css({ display: 'flex', flexDirection: 'column', gap: '1' });
const callout = css({ padding: '3', borderRadius: 'lg', textStyle: 'body' });

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
        <ui-container preset="panel" className={cx(campaign, tone.solid)}>
          <span className={sectionKicker}>Studio / Collection 01</span>
          <h3 className={display}>A spectrum.<br />A shared language.</h3>
          <p className={bodyLarge}>Different hues, one system. Color carries the character; a common rhythm holds it together.</p>
          <span className={cx(sectionKicker, tone.secondaryOnSolid)}>An exploration in color &amp; proportion</span>
        </ui-container>
        <div data-ramp className={rampStrip} role="img" aria-label={`${primary} steps 1 to 12`}>
          {RAMP_USE.map((use, i) => (
            <div key={i} className={cx(rampStep, RAMP_STEP[i])}>
              <span>{i + 1}</span><span>{use}</span>
            </div>
          ))}
        </div>
        <ui-container preset="panel" className={tone.paper}>
          <span className={cx(sectionKicker, tone.muted)}>Ink &amp; paper <i className={cx(dot, tone.secondaryDot)} /></span>
          <h3 className={panelTitle}>One hue.<br />Room to breathe.</h3>
          <p className={tone.muted}>A quiet field, a clear voice and a single primary.</p>
        </ui-container>
        <ui-container preset="panel" className={tone.tint}>
          <span className={sectionKicker}>Tint &amp; emphasis</span>
          <strong className={bigFigure} data-numeric>62<span data-numeric>%</span></strong>
          <p className={tone.tintStrong}>Large figures and small details share the same color family.</p>
        </ui-container>
      </div>

      <div className={contextHead}><h3 className={subTitle}>Interface</h3><span className={caption}>Neutral surfaces · primary actions · semantic feedback</span></div>
      <ui-container preset="panel">
        <div className={workspaceHead}>
          <div><span className={kicker}>Collection workspace</span><h3 className={subTitle}>Spring catalog</h3></div>
          <ui-tag>Spring edition</ui-tag>
          <ui-badge className={tone.success}>Ready for review</ui-badge>
        </div>
        <div className={uiGrid}>
          <ui-container preset="card">
            <span className={kicker}>Overview</span><h4 className={cardTitle}>A little color goes a long way.</h4>
            <p className={caption}>Review the collection, refine its details and prepare the next edition.</p>
            <div className={specimens}>
              <ui-button variant="primary" onClick={() => setApproved(true)}>Approve collection</ui-button>
              <ui-button onClick={() => setApproved(false)}>Reset approval</ui-button>
            </div>
            <p className={caption} role="status">{approved ? 'Collection approved' : 'Demo collection · awaiting approval'}</p>
          </ui-container>
          <ui-container preset="card">
            <span className={kicker}>Details</span>
            <ui-input label="Collection name" value="Spring catalog" />
            <ui-checkbox checked>Include neutral colors</ui-checkbox>
            <ui-checkbox>Include alternate editions</ui-checkbox>
          </ui-container>
          <ui-container preset="card">
            <span className={kicker}>Library</span>
            <ui-listbox label="Preview library" value="shared">
              {['Inbox', 'Drafts', 'Shared', 'Archive'].map((n) => <ui-option key={n} value={n.toLowerCase()}>{n}</ui-option>)}
            </ui-listbox>
          </ui-container>
          <ui-container preset="card">
            <span className={kicker}>This week</span><strong className={bigFigure} data-numeric>1,284</strong>
            <p className={caption}>Orders across six channels.</p>
            <ui-badge className={tone.success}>↑ 12% this week</ui-badge>
          </ui-container>
          <ui-container preset="card">
            <span className={kicker}>Collection progress</span><strong className={bigFigure} data-numeric>62<span data-numeric>%</span></strong>
            <ui-progress label="Collection progress" value={62} />
            <p className={caption}>148 of 240 items reviewed.</p>
          </ui-container>
          <ui-container preset="card">
            <span className={kicker}>Action states</span>
            <div className={stateRow}>
              <div className={stateCell}><span className={caption}>Rest</span><ui-button variant="primary">Approve</ui-button></div>
              <div className={stateCell}><span className={caption}>Hover, press</span><ui-button variant="primary" className={tone.solidHover}>Approve</ui-button></div>
              <div className={stateCell}><span className={caption}>Busy</span><ui-button variant="primary" loading>Approve</ui-button></div>
              <div className={stateCell}><span className={caption}>Disabled</span><ui-button variant="primary" disabled>Approve</ui-button></div>
            </div>
          </ui-container>
          <ui-container preset="card" className={chartCard}>
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
          </ui-container>
          <ui-container preset="card" className={feedbackCard}>
            <span className={kicker}>Feedback</span>
            <p className={cx(callout, tone.tint)} role="note">Changes to this palette appear across every preview.</p>
            <p className={cx(callout, tone.warning)} role="note">Check small text and neighboring hues before choosing a brand color.</p>
            <p className={cx(callout, tone.critical)} role="note">Critical: {critical} carries destructive actions.</p>
            <p className={cx(callout, tone.info)} role="note">Info: {info} marks neutral announcements.</p>
          </ui-container>
        </div>
      </ui-container>
    </div>
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

// Contrast: the Leonardo model. Each step's tone is solved from an APCA Lc target against the page
// (step 1), per scheme; the chart plots the targets and every family's achieved Lc at each step.
const contrastGrid = css({ display: 'grid', gridTemplateColumns: '1fr', gap: '4', [CQ_LG]: { gridTemplateColumns: '1fr 1fr' } });
const endpointRow = css({ display: 'flex', gap: '6', flexWrap: 'wrap', alignItems: 'center' });
const endpointSwatch = css({ width: '8', height: '8', borderRadius: 'lg', boxShadow: '[inset 0 0 0 1px var(--colors-border)]' });
const onWhite = css({ bg: 'white' }), onBlack = css({ bg: 'black' });
const achievedLc = (tones: number[]) => tones.slice(1).map((t) => apcaLc(t, tones[0]));
function ContrastChart({ spectrum, mode }: { spectrum: SpectrumPayload; mode: 'light' | 'dark' }) {
  const { page, targets } = spectrum.contrast[mode];
  const H = 230, L = 34, R = W - 12, T = 14, B = H - 24, top = Math.min(TARGET_MAX, Math.ceil(Math.max(...targets) / 20) * 20 + 10);
  const x = (step: number) => L + ((step - 1) / 11) * (R - L), y = (lc: number) => B - (lc / top) * (B - T);
  const line = [[1, 0], ...targets.map((lc, i) => [i + 2, lc])].map(([st, lc], i) => `${i ? 'L' : 'M'}${x(st).toFixed(1)},${y(lc).toFixed(1)}`).join('');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={chartSvg} role="img" aria-label={`${mode} page tone ${f1(page)}: APCA Lc target per step 2 to 12 (${targets.join(', ')}) `}>
      {Array.from({ length: Math.floor(top / 20) + 1 }, (_, i) => i * 20).map((lc) => (
        <g key={lc}><line x1={L} x2={R} y1={y(lc)} y2={y(lc)} className={grid} /><text x={L - 6} y={y(lc) + 3} textAnchor="end" className={chartTick}>{lc}</text></g>
      ))}
      {Array.from({ length: 12 }, (_, i) => <text key={i} x={x(i + 1)} y={H - 8} textAnchor="middle" className={chartTick}>{i + 1}</text>)}
      <path d={line} fill="none" stroke="currentColor" strokeWidth={2} />
      {targets.map((lc, i) => <circle key={i} cx={x(i + 2)} cy={y(lc)} r={4} fill="none" stroke="currentColor" strokeWidth={2} />)}
      <text x={L + 4} y={T + 10} className={chartLabel}>{mode} page · tone {f1(page)}</text>
    </svg>
  );
}
function ContrastTable({ spectrum }: { spectrum: SpectrumPayload }) {
  const neutral = spectrum.families.find((f) => f.name === spectrum.roles.neutral) ?? spectrum.families[0];
  const lc = { light: achievedLc(neutral.lightTones), dark: achievedLc(neutral.darkTones) };
  return (
    <div className={tableScroller}>
      <table className={dataTable} aria-label="Contrast per step">
        <thead><tr><th>Step</th><th>Use</th><th>Light tone</th><th>Light<small>Lc</small></th><th>Dark tone</th><th>Dark<small>Lc</small></th></tr></thead>
        <tbody>
          {RAMP_USE.map((use, i) => (
            <tr key={i}>
              <td className={nameCell}>{i + 1}</td><td className={noteCell}>{use}</td>
              <td>{f1(neutral.lightTones[i])}</td><td>{i ? f1(lc.light[i - 1]) : 'page'}</td>
              <td>{f1(neutral.darkTones[i])}</td><td>{i ? f1(lc.dark[i - 1]) : 'page'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ColorsPage({ spectrum }: PageProps) {
  if (!spectrum) return <Page title="Colors" lead="Generating colors…"><Divider /></Page>;
  const r = spectrum.roles;
  return (
    <Page title="Colors" lead={`Spectrum roles, in context and at the engine. Brand: primary ${r.primary}, secondary ${r.secondary}, neutral ${r.neutral}.`}>
      <Divider />
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
      <Section id="context" title="Color in context" note="Two synthetic settings for reviewing the active palette: primary as material and secondary as punctuation, then neutral surfaces with primary actions and semantic feedback. Content and figures are illustrative.">
        <ColorInContext spectrum={spectrum} />
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
      <Section id="contrast" title="Contrast" note="Every ramp is placed by contrast, not by fixed tones: step 1 is the page (the light or dark page tone) and each step 2–12 takes an APCA Lc target against it, so the same step reads the same in both schemes and for every hue. Every family shares the solved tones (hue and chroma vary, tone does not), so one table holds for all of them. Edit the targets under Contrast in the Colors tab.">
        <div className={contrastGrid}>
          <figure className={chartFig}><ContrastChart spectrum={spectrum} mode="light" /><figcaption className={caption}>Light: targets against the light page.</figcaption></figure>
          <figure className={chartFig}><ContrastChart spectrum={spectrum} mode="dark" /><figcaption className={caption}>Dark: targets against the dark page.</figcaption></figure>
        </div>
        <ContrastTable spectrum={spectrum} />
        <h3 className={subTitle}>White and black</h3>
        <div className={endpointRow}>
          <figure className={roleChip}><span className={cx(endpointSwatch, onWhite)} /><figcaption><span className={rowLabel}>white</span><span className={metrics}>a neutral light step, or pure</span></figcaption></figure>
          <figure className={roleChip}><span className={cx(endpointSwatch, onBlack)} /><figcaption><span className={rowLabel}>black</span><span className={metrics}>a neutral dark step, or pure</span></figcaption></figure>
          <p className={caption}>Text on solids and fg.strong use these; map them in the Colors tab (White and black).</p>
        </div>
      </Section>
      <Divider />
      <Section id="ramps" title="Ramps" note="Steps 1–2 backgrounds, 3–5 interactive, 6–8 borders, 9–10 solids, 11–12 text, each step at its contrast target (above). Light left, dark right.">
        {spectrum.families.map((f) => (
          <div key={f.name} className={rampRow}>
            <span className={rowLabel}>{f.name}{[r.primary, r.neutral, r.critical].includes(f.name) ? ' ●' : ''}</span>
            <ui-palette label={`${f.name} light`} className={ramp}>{f.light.map((c, i) => <ui-swatch key={i} color={c} label={`${f.name} ${i + 1} light`} />)}</ui-palette>
            <ui-palette label={`${f.name} dark`} className={ramp}>{f.dark.map((c, i) => <ui-swatch key={i} color={c} label={`${f.name} ${i + 1} dark`} />)}</ui-palette>
          </div>
        ))}
      </Section>
    </Page>
  );
}
