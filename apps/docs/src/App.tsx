// The shell: a filterable list of every component, a Theme select across the reference brands, the
// color scheme, and the page the hash names. Everything on screen is a kit component or a type role.
import { useEffect, useMemo, useState } from 'react';
import { css } from '../styled-system/css/index.js';
import { PAGES } from './content.ts';
import { ComponentPage } from './ComponentPage.tsx';
import { FOUNDATIONS } from './foundations/pages.tsx';
import { GROUPS } from './groups.ts';
import { useTheme, type Scheme } from './theme.ts';
import { useEvent } from './wc.ts';

const NEXT: Record<Scheme, Scheme> = { auto: 'light', light: 'dark', dark: 'auto' };
const ICON: Record<Scheme, string> = { auto: 'circle-half', light: 'sun', dark: 'moon' };
const s = {
  shell: css({ display: 'grid', gridTemplateColumns: '1fr', minHeight: '[100dvh]', bg: 'bg', md: { gridTemplateColumns: '[16rem 1fr]' } }),
  aside: css({ display: 'flex', flexDirection: 'column', gap: '4', padding: '4', bg: 'bg.subtle', md: { position: 'sticky', top: '0', height: '[100dvh]', overflow: 'hidden' } }),
  brand: css({ textStyle: 'title', color: 'fg.strong', textDecoration: 'none' }),
  top: css({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2' }),
  menu: css({ md: { display: 'none' } }),
  nav: css({ display: 'none', flexDirection: 'column', gap: '4', overflowY: 'auto', flex: '1', md: { display: 'flex' }, '&[data-open]': { display: 'flex', maxHeight: '[60dvh]' } }),
  navGroup: css({ display: 'flex', flexDirection: 'column' }),
  navHead: css({ textStyle: 'group-kicker', paddingInline: '2', paddingBlockEnd: '1' }),
  navLink: css({ textStyle: 'label', paddingBlock: '1.5', paddingInline: '2', borderRadius: 'md', textDecoration: 'none', '&:hover': { bg: 'bg.muted' }, '&[aria-current]': { bg: 'bg.muted', color: 'fg.strong' } }),
  main: css({ minWidth: '0', display: 'flex', flexDirection: 'column' }),
  header: css({ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '2', padding: '4' }),
  content: css({ width: 'full', maxWidth: '[60rem]', marginInline: 'auto', paddingInline: '4', paddingBlockEnd: '12', md: { paddingInline: '8' } }),
  title: css({ textStyle: 'heading-1' }),
  lead: css({ textStyle: 'body-lg', marginBlockStart: '2', marginBlockEnd: '8' }),
  index: css({ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(14rem, 1fr))', gap: '3' }),
  card: css({ display: 'flex', flexDirection: 'column', gap: '1', padding: '4', borderRadius: 'lg', bg: 'bg.subtle', textDecoration: 'none', '&:hover': { bg: 'bg.muted' } }),
  cardTitle: css({ textStyle: 'title' }),
  cardNote: css({ textStyle: 'body-sm' }),
};

const slugFromHash = () => decodeURIComponent(location.hash.replace(/^#\/?/, ''));

export function App() {
  const [slug, setSlug] = useState(slugFromHash);
  const [filter, setFilter] = useState('');
  const { brands, brand, setBrand, scheme, setScheme } = useTheme();
  useEffect(() => {
    const on = () => { setSlug(slugFromHash()); scrollTo(0, 0); };
    addEventListener('hashchange', on);
    return () => removeEventListener('hashchange', on);
  }, []);
  const brandRef = useEvent('change', (_el, d) => setBrand(d.value));
  const schemeRef = useEvent('click', () => setScheme(NEXT[scheme]));
  const filterRef = useEvent('input', (el) => setFilter(String(el.value ?? '')));
  const query = filter.trim().toLowerCase();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useEvent('click', () => setMenuOpen((v) => !v));
  useEffect(() => setMenuOpen(false), [slug]);
  const groups = useMemo(() => {
    const match = (title: string, tag = '') => !query || title.toLowerCase().includes(query) || tag.includes(query);
    return [
      ['Foundations', FOUNDATIONS.filter((f) => match(f.title)).map((f) => ({ slug: f.slug, title: f.title }))] as const,
      ...GROUPS.map(([label, slugs]) => [label, PAGES.filter((p) => slugs.includes(p.slug) && match(p.title, p.tag)).map((p) => ({ slug: p.slug, title: p.title }))] as const),
    ].filter(([, items]) => items.length);
  }, [query]);
  const page = PAGES.find((p) => p.slug === slug);
  const foundation = FOUNDATIONS.find((f) => f.slug === (slug || 'overview'));
  const options: [string, string][] = [['default', 'Default theme'], ...brands.map((b) => [b.id, b.label] as [string, string])];
  return (
    <div className={s.shell}>
      <aside className={s.aside}>
        <div className={s.top}>
          <a className={s.brand} href="#/">Massimo</a>
          <span className={s.menu}><ui-button ref={menuRef} aria-expanded={menuOpen} aria-controls="docs-nav">Menu</ui-button></span>
        </div>
        <ui-input ref={filterRef} label="Filter pages" hide-label="" placeholder="Filter pages" />
        <nav id="docs-nav" className={s.nav} aria-label="Documentation" data-open={query || menuOpen ? '' : undefined}>
          {groups.map(([label, items]) => (
            <div key={label} className={s.navGroup}>
              <span className={s.navHead}>{label}</span>
              {items.map((p) => <a key={p.slug} className={s.navLink} href={`#/${p.slug}`} aria-current={p.slug === (slug || 'overview') ? 'page' : undefined}>{p.title}</a>)}
            </div>
          ))}
        </nav>
      </aside>
      <main className={s.main}>
        <header className={s.header}>
          <ui-select key={options.length} ref={brandRef} label="Theme" hide-label="" value={brand}>
            {options.map(([v, l]) => <ui-option key={v} value={v}>{l}</ui-option>)}
          </ui-select>
          <ui-button ref={schemeRef} aria-label={`Color scheme: ${scheme} (switch to ${NEXT[scheme]})`}><i slot="leading" name={ICON[scheme]} /></ui-button>
        </header>
        <div className={s.content}>
          {page ? <ComponentPage key={page.slug} page={page} /> : foundation ? <foundation.Page key={foundation.slug} /> : (
            <article data-page="">
              <h1 className={s.title}>Components</h1>
              <p className={s.lead}>Every kit component, with live examples, its API and when to use it. Pick a theme to see them in any reference brand.</p>
              <div className={s.index}>
                {PAGES.map((p) => <a key={p.slug} className={s.card} href={`#/${p.slug}`}><span className={s.cardTitle}>{p.title}</span><span className={s.cardNote}>{p.intent[0]}</span></a>)}
              </div>
            </article>
          )}
        </div>
      </main>
    </div>
  );
}
