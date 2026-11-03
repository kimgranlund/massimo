// Shared page pieces: the page frame, titled sections, labelled specimen rows and the styles the
// pages have in common. Pages lay out against the content column through container queries on
// the canvas ([data-canvas] is the 'canvas' container), not viewport breakpoints.
import type { ReactNode } from 'react';
import { css, cx } from '../../styled-system/css/index.js';
import { page as pageLayout } from '../../styled-system/patterns/index.js';
import { resolveBtg, resolveChoice, resolveComposite, resolveControl, resolveField, resolveSwatch, resolveTrack, resolveSeparator, resolveAvatar, resolveMeter, resolveChoiceGroup, resolveFieldset, resolveDisclosure, resolveTabs, resolveToast, resolveForm, resolveScrollArea, type ThemeParams } from '@massimo/ui-kit/tokens';

export const CQ_MD = '@container canvas (min-width: 40rem)';
export const CQ_LG = '@container canvas (min-width: 64rem)';

// Specimen layout: the page container (8u padding and gap) holds titled sections split by
// dividers. Each section is a list of labelled rows: label on the left, specimens on the right.
const shell = pageLayout({ width: '[80rem]' });
export const header = css({ display: 'flex', flexDirection: 'column', gap: '4' });
// Display needs the width: below the medium canvas the title steps down to heading-1.
export const pageTitle = css({ textStyle: 'heading-1', [CQ_MD]: { textStyle: 'display' } });
export const lead = css({ textStyle: 'body-large', color: 'fg.muted', maxWidth: 'prose' });
const divider = css({ borderTopWidth: 'thin', borderColor: 'border', width: 'full' });
const section = css({ display: 'flex', flexDirection: 'column', gap: '5' });
const sectionHead = css({ display: 'flex', flexDirection: 'column', gap: '1' });
// A section header with an action (e.g. Replay): text on the start, the action at the end.
const sectionHeadRow = css({ display: 'flex', alignItems: 'end', justifyContent: 'space-between', gap: '4', flexWrap: 'wrap' });
/** A status note under a page lead (e.g. reduced motion is on). */
const notice = css({ textStyle: 'body', color: 'fg', bg: 'bg.muted', borderRadius: 'md', padding: '3', maxWidth: 'prose' });
const sectionTitle = css({ textStyle: 'heading-2' });
const sectionTags = css({ textStyle: 'code', color: 'fg.muted' });
export const caption = css({ textStyle: 'caption', color: 'fg.muted' });
const rowGrid = css({ display: 'grid', gridTemplateColumns: '1fr', gap: '2', alignItems: 'center', [CQ_MD]: { gridTemplateColumns: '11rem 1fr', gap: '6' } });
export const rowLabel = css({ textStyle: 'label', color: 'fg.muted' });
export const specimens = css({ display: 'flex', gap: '2', flexWrap: 'wrap', alignItems: 'center' });
export const columns = css({ display: 'grid', gridTemplateColumns: '1fr', gap: '8', alignItems: 'start', [CQ_MD]: { gridTemplateColumns: '1fr 1fr' } });
export const subTitle = css({ textStyle: 'heading-3' });
export const stack = css({ display: 'flex', flexDirection: 'column', gap: '4' });
export const kicker = css({ textStyle: 'group-kicker', display: 'inline-flex', alignItems: 'center', gap: '2' });
export const metrics = css({ textStyle: 'code', color: 'fg.muted' });

/** A content page: the page frame with a title and lead, then its sections. */
export function Page({ title, lead: text, notices, children }: { title: string; lead: ReactNode; notices?: ReactNode[]; children: ReactNode }) {
  return (
    <main className={shell}>
      <header className={header}>
        <h1 className={pageTitle}>{title}</h1>
        <p className={lead}>{text}</p>
        {notices?.filter(Boolean).map((n, i) => <p key={i} className={notice} role="status">{n}</p>)}
      </header>
      {children}
    </main>
  );
}

export function Section({ id, title, tags, children, note, action, className }: { id: string; title: string; tags?: string; note: string; action?: ReactNode; children: ReactNode; className?: string }) {
  const text = (
    <div className={sectionHead}>
      <h2 id={id} className={sectionTitle}>{title}</h2>
      {tags && <span className={sectionTags}>{tags}</span>}
      <p className={caption}>{note}</p>
    </div>
  );
  return (
    <section className={cx(section, className)} aria-labelledby={id}>
      {action ? <header className={sectionHeadRow}>{text}{action}</header> : <header>{text}</header>}
      {children}
    </section>
  );
}

export function Row({ label, size, children }: { label: string; size?: string; children: ReactNode }) {
  return (
    <div className={rowGrid}>
      <span className={rowLabel}>{label}</span>
      <div className={specimens} data-size={size}>{children}</div>
    </div>
  );
}

export const Divider = () => <hr className={divider} />;

export const fmt = (n: number) => String(Math.round(n * 100) / 100);

// Sample images as inline SVG gradients (no network).
const art = (a: string, b: string, label: string) => `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="800" height="600" fill="url(#g)"/><text x="40" y="560" font-family="system-ui" font-size="48" fill="white" fill-opacity=".85">${label}</text></svg>`)}`;
export const IMAGES = [art('#4f46e5', '#06b6d4', 'Dawn'), art('#f97316', '#db2777', 'Dusk'), art('#16a34a', '#0ea5e9', 'Coast'), art('#1e293b', '#7c3aed', 'Night')];

// ── Size ladders ──
// Every component page shows sizes the same way: the standard sizes 3, 4 and 6 plus the theme's own
// unit (highlighted), one row each. The left column names the size and lists the family's resolver
// metrics for the live theme (like the Typography roles); the right column renders the specimens
// in that size subtree (data-size).
export const LADDER_SIZES = [3, 4, 6];
export type LadderFamily = 'button' | 'btg' | 'field' | 'choice' | 'track' | 'swatch' | 'composite' | 'separator' | 'avatar' | 'choiceGroup' | 'fieldset' | 'disclosure' | 'toast' | 'form' | 'scrollArea';

type Live = { unit: number; border: number; radiusScale: number };
const px = (n: number) => `${fmt(n)}`;
const LADDER_METRICS: Record<LadderFamily, (g: Live) => string[]> = {
  button: (g) => {
    const c = resolveControl(g);
    return [`h ${px(c.height)} · slot ${px(c.slot)} · pad ${px(c.padding)}`, `text ${px(c.fontSize)} · icon ${px(c.iconSize)} · r ${px(c.radius)}`];
  },
  btg: (g) => {
    const [b, t, c] = (['badge', 'tag', 'chip'] as const).map((k) => resolveBtg(k, g));
    return [`h ${px(b.height)} · ${px(t.height)} · ${px(c.height)}`, `text ${px(b.fontSize)} · ${px(t.fontSize)} · ${px(c.fontSize)}`];
  },
  field: (g) => {
    const f = resolveField(g);
    return [`h ${px(f.height)} · text inset ${px(f.paddingStart)}`, `text ${px(f.fontSize)} · r ${px(f.radius)}`];
  },
  choice: (g) => {
    const [cb, sw] = [resolveChoice('checkbox', g), resolveChoice('switch', g)];
    return [`row ${px(cb.rowHeight)} · box ${px(cb.box)} · switch ${px(sw.width)}`, `label inset ${px(cb.labelPaddingStart)} · r ${px(cb.radius)}`];
  },
  track: (g) => {
    const t = resolveTrack('range', g), m = resolveMeter(g);
    return [`track ${px(t.track)} · thumb ${px(t.thumb)}`, `r ${px(t.trackRadius)} · min width ${px(t.minWidth)}`, `meter row gap ${px(m.rowGap)} · text ${px(m.fontSize)}`];
  },
  swatch: (g) => {
    const s = resolveSwatch(g);
    return [`swatch ${px(s.size)} · r ${px(s.radius)}`, `palette r ${px(s.paletteRadius)}`];
  },
  composite: (g) => {
    const c = resolveComposite(g);
    return [`row ${px(c.rowHeight)} · edge ${px(c.edge)} · option ${px(c.child.height)}`, `r ${px(c.radius)} · option r ${px(c.child.radius)}`];
  },
  separator: (g) => {
    const s = resolveSeparator(g);
    return [`thickness ${px(s.thickness)} · B ${px(s.border)}`];
  },
  avatar: (g) => {
    const [sm, md, xl] = (['sm', 'md', 'xl'] as const).map((k) => resolveAvatar(k, g));
    return [`sm ${px(sm.size)} · md ${px(md.size)} · xl ${px(xl.size)}`, `text ${px(md.fontSize)} · icon ${px(md.iconSize)} · r ${px(md.radius)}`];
  },
  fieldset: (g) => {
    const f = resolveFieldset(g);
    return [`gap ${px(f.gap)} · padding ${px(f.padding)}`, `border ${px(f.border)} · r ${px(f.radius)}`];
  },
  choiceGroup: (g) => {
    const [v, h] = [resolveChoiceGroup('vertical', g), resolveChoiceGroup('horizontal', g)];
    return [`row ${px(v.rowHeight)} · gap ${px(v.gap)} · pitch ${px(v.pitch)}`, `horizontal gap ${px(h.columnGap)} · wrap ${px(h.rowGap)}`];
  },
  disclosure: (g) => {
    const d = resolveDisclosure(g);
    const [sg, ul] = [resolveTabs('segmented', g), resolveTabs('underline', g)];
    return [`trigger ${px(d.height)} · caret ${px(d.caret)} · panel inset ${px(d.panelInline)}`, `tabs ${px(sg.listHeight)} · tab ${px(sg.tabHeight)} · bar ${px(ul.indicatorThickness ?? 0)}`];
  },
  toast: (g) => {
    const t = resolveToast(g);
    return [`pad ${px(t.padding)} · r ${px(t.radius)} · width ${px(t.width)}`, `action ${px(t.actionHeight)} · close ${px(t.close)} · gap ${px(t.gap)}`];
  },
  form: (g) => {
    const f = resolveForm(g);
    return [`gap ${px(f.gap)} · padding ${px(f.padding)}`, `border ${px(f.border)} · r ${px(f.radius)}`];
  },
  scrollArea: (g) => {
    const a = resolveScrollArea(g);
    return [`track ${px(a.thickness)} · inset ${px(a.inset)} · thumb ${px(a.thumb)}`, `thumb ≥ ${px(a.thumbMin)} · r ${px(a.thumbRadius)} · corner ${px(a.corner)}`];
  },
};

const ladderRow = css({ display: 'grid', gridTemplateColumns: '1fr', gap: '2', alignItems: 'center', paddingBlock: '2', [CQ_MD]: { gridTemplateColumns: '16rem 1fr', gap: '6' } });
const ladderMeta = css({ display: 'flex', flexDirection: 'column', gap: '0.5' });
const ladderTheme = css({ color: 'primary.fg' });

export function SizeLadder({ family, params, children }: { family: LadderFamily; params: ThemeParams; children: ReactNode }) {
  const theme = params.unit;
  const sizes = [...new Set([...LADDER_SIZES, theme])].sort((a, b) => a - b);
  return (
    <div role="list" aria-label="Sizes">
      {sizes.map((u) => {
        const isTheme = u === theme;
        const lines = LADDER_METRICS[family]({ unit: u, border: params.border, radiusScale: params['radius-scale'] });
        return (
          <div role="listitem" key={u} className={ladderRow}>
            <div className={ladderMeta}>
              <span className={cx(rowLabel, isTheme && ladderTheme)}>Size {fmt(u)} · {px(8 * u)}px{isTheme ? ' · theme' : ''}</span>
              {lines.map((l) => <span key={l} className={cx(metrics, isTheme && ladderTheme)}>{l}</span>)}
            </div>
            {/* The theme row inherits the canvas unit (it may sit between the data-size steps). */}
            <div className={specimens} data-size={isTheme ? undefined : String(u)}>{children}</div>
          </div>
        );
      })}
    </div>
  );
}

// ── Tables ──
// One table style for every page: real <table>s, one value per column, group headers (colSpan) over
// related columns, the live theme row highlighted, numbers tabular, the full container width, a
// horizontal scroller when narrow.
export const tableScroller = css({ overflowX: 'auto', maxWidth: 'full' });
export const dataTable = css({
  width: 'full', borderCollapse: 'collapse', textStyle: 'code', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap',
  '& th': { textStyle: 'group-kicker', color: 'fg.muted', textAlign: 'start', paddingBlock: '2', paddingInline: '2', borderBottomWidth: 'thin', borderColor: 'border', verticalAlign: 'bottom' },
  '& th small': { display: 'block', textStyle: 'caption', textTransform: 'none', letterSpacing: 'normal' },
  '& td': { paddingBlock: '1.5', paddingInline: '2', borderBottomWidth: 'thin', borderColor: 'border', verticalAlign: 'middle' },
});
/** A group header over related columns (colSpan); the rule under it marks the group. */
export const groupHead = css({ paddingBlockEnd: '1' });
/** The row for the live theme value. */
export const currentRow = css({ bg: 'primary.subtle', color: 'primary.fg' });
/** A row's name cell (label voice, not code). */
export const nameCell = css({ textStyle: 'title' });
/** A descriptive cell: caption text that wraps. */
export const noteCell = css({ textStyle: 'caption', color: 'fg.muted', whiteSpace: 'normal', minWidth: '[14rem]' });
