// Shared page pieces: the page frame, titled sections, labelled specimen rows and the styles the
// pages have in common. Pages lay out against the content column through container queries on
// the canvas ([data-canvas] is the 'canvas' container), not viewport breakpoints.
import type { ReactNode } from 'react';
import { css, cx } from '../../styled-system/css/index.js';
import { page as pageLayout } from '../../styled-system/patterns/index.js';

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
export function Page({ title, lead: text, children }: { title: string; lead: ReactNode; children: ReactNode }) {
  return (
    <main className={shell}>
      <header className={header}>
        <h1 className={pageTitle}>{title}</h1>
        <p className={lead}>{text}</p>
      </header>
      {children}
    </main>
  );
}

export function Section({ id, title, tags, children, note, className }: { id: string; title: string; tags?: string; note: string; children: ReactNode; className?: string }) {
  return (
    <section className={cx(section, className)} aria-labelledby={id}>
      <header className={sectionHead}>
        <h2 id={id} className={sectionTitle}>{title}</h2>
        {tags && <span className={sectionTags}>{tags}</span>}
        <p className={caption}>{note}</p>
      </header>
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
