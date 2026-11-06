// The shell: a filterable list of every component, a Theme select across the reference brands, the
// color scheme, and the page the hash names. Everything on screen is a kit component or a type role.
import { useEffect, useMemo, useState } from 'react';
import { css } from '../styled-system/css/index.js';
import { PAGES } from './content.ts';
import { ComponentPage } from './ComponentPage.tsx';
import { useTheme, type Scheme } from './theme.ts';
import { useEvent } from './wc.ts';

const NEXT: Record<Scheme, Scheme> = { auto: 'light', light: 'dark', dark: 'auto' };
const ICON: Record<Scheme, string> = { auto: 'circle-half', light: 'sun', dark: 'moon' };
const s = {
  shell: css({ display: 'grid', gridTemplateColumns: '1fr', minHeight: '[100dvh]', bg: 'bg', md: { gridTemplateColumns: '[16rem 1fr]' } }),
  aside: css({ display: 'flex', flexDirection: 'column', gap: '4', padding: '4', bg: 'bg.subtle', md: { position: 'sticky', top: '0', height: '[100dvh]', overflow: 'hidden' } }),
  brand: css({ textStyle: 'title', color: 'fg.strong', textDecoration: 'none' }),
  nav: css({ display: 'none', flexDirection: 'column', overflowY: 'auto', flex: '1', md: { display: 'flex' }, '&[data-open]': { display: 'flex', maxHeight: '[50dvh]' } }),
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
  const shown = useMemo(() => PAGES.filter((p) => !query || p.title.toLowerCase().includes(query) || p.tag.includes(query)), [query]);
  const page = PAGES.find((p) => p.slug === slug);
  const options: [string, string][] = [['default', 'Default theme'], ...brands.map((b) => [b.id, b.label] as [string, string])];
  return (
    <div className={s.shell}>
      <aside className={s.aside}>
        <a className={s.brand} href="#/">Massimo components</a>
        <ui-input ref={filterRef} label="Filter components" hide-label="" placeholder="Filter components" />
        <nav className={s.nav} aria-label="Components" data-open={query ? '' : undefined}>
          {shown.map((p) => <a key={p.slug} className={s.navLink} href={`#/${p.slug}`} aria-current={p.slug === slug ? 'page' : undefined}>{p.title}</a>)}
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
          {page ? <ComponentPage key={page.slug} page={page} /> : (
            <>
              <h1 className={s.title}>Components</h1>
              <p className={s.lead}>Every kit component, with live examples, its API and when to use it. Pick a theme to see them in any reference brand.</p>
              <div className={s.index}>
                {PAGES.map((p) => <a key={p.slug} className={s.card} href={`#/${p.slug}`}><span className={s.cardTitle}>{p.title}</span><span className={s.cardNote}>{p.intent[0]}</span></a>)}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
