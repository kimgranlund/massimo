// One template for every component: live examples with their code, usage guidance, then the API.
import { useEffect, useMemo, type ReactNode } from 'react';
import { css } from '../styled-system/css/index.js';
import { loadElement, PAGES, REACT_NAMES, TAG_MODULES } from './content.ts';
import { modulesFor, slugOf, type DocPage, type Example, type Row } from './model.ts';
import { reactImport, toReact } from './react-code.ts';

const s = {
  title: css({ textStyle: 'heading-1' }),
  tag: css({ textStyle: 'code', marginBlockStart: '1' }),
  lead: css({ textStyle: 'body-lg', marginBlockStart: '2' }),
  section: css({ display: 'flex', flexDirection: 'column', gap: '4', marginBlockStart: '10' }),
  h2: css({ textStyle: 'heading-2' }),
  h3: css({ textStyle: 'heading-3' }),
  example: css({ display: 'flex', flexDirection: 'column', gap: '3' }),
  preview: css({ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '3', padding: '6', borderRadius: 'lg', bg: 'bg.subtle', minWidth: '0', overflowX: 'auto', '& > *': { maxWidth: 'full' } }),
  note: css({ textStyle: 'body-sm' }),
  kicker: css({ textStyle: 'group-kicker' }),
  code: css({ textStyle: 'code', padding: '4', borderRadius: 'lg', bg: 'bg.muted', overflowX: 'auto', margin: '0', whiteSpace: 'pre', tabSize: 2 }),
  list: css({ textStyle: 'body-md', display: 'flex', flexDirection: 'column', gap: '2', paddingInlineStart: '5', listStyleType: 'disc' }),
  scroller: css({ overflowX: 'auto', maxWidth: 'full' }),
  table: css({
    width: 'full', borderCollapse: 'collapse', textStyle: 'body-sm',
    '& th': { textStyle: 'group-kicker', textAlign: 'start', padding: '2' },
    '& td': { padding: '2', verticalAlign: 'top' },
    '& td:first-child': { textStyle: 'code', whiteSpace: 'nowrap' },
    '& tbody tr:nth-child(odd)': { bg: 'bg.subtle' },
  }),
  link: css({ color: 'primary.fg' }),
};

const text = (v: unknown) => (v === undefined || v === null || v === '' ? '—' : typeof v === 'string' ? v : JSON.stringify(v));
const Table = ({ head, rows }: { head: string[]; rows: ReactNode[][] }) => (
  <div className={s.scroller}><table className={s.table}>
    <thead><tr>{head.map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
    <tbody>{rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
  </table></div>
);
const Code = ({ label, code }: { label: string; code: string }) => <><span className={s.kicker}>{label}</span><pre className={s.code} tabIndex={0} aria-label={`${label} code`}><code>{code}</code></pre></>;

function ExampleBlock({ page, example }: { page: DocPage; example: Example }) {
  const react = useMemo(() => toReact(example.markup, REACT_NAMES, page.folder), [example.markup, page.folder]);
  const name = REACT_NAMES.get(page.tag);
  return (
    <div className={s.example}>
      <h3 className={s.h3}>{example.label}</h3>
      {example.note && <p className={s.note}>{example.note}</p>}
      <div className={s.preview} data-example={example.id} dangerouslySetInnerHTML={{ __html: example.markup }} />
      <Code label="Web component" code={example.markup} />
      {react ? <Code label="React" code={react} /> : name && <>
        <Code label="React" code={reactImport(name)} />
        <p className={s.note}>This example takes a different shape in React. See the React props below.</p>
      </>}
    </div>
  );
}

export function ComponentPage({ page }: { page: DocPage }) {
  useEffect(() => { for (const m of modulesFor(page.examples.map((e) => e.markup).join(''), TAG_MODULES)) void loadElement(m); }, [page]);
  const linked = (id?: string) => {
    if (!id) return null;
    const target = PAGES.find((p) => p.id === id);
    return target ? <a className={s.link} href={`#/${target.slug}`}>{target.title}</a> : slugOf(id);
  };
  return (
    <article data-page="">
      <h1 className={s.title}>{page.title}</h1>
      <p className={s.tag}>&lt;{page.tag}&gt;</p>
      {page.intent.length > 0 && <p className={s.lead}>{page.intent.join('. ')}.</p>}
      <section className={s.section} aria-label="Examples">
        <h2 className={s.h2}>Examples</h2>
        {page.examples.map((e) => <ExampleBlock key={e.id} page={page} example={e} />)}
      </section>
      {(page.constraints.length > 0 || page.avoid.length > 0) && (
        <section className={s.section} aria-label="Usage">
          <h2 className={s.h2}>Usage</h2>
          {page.constraints.length > 0 && <ul className={s.list}>{page.constraints.map((c) => <li key={c}>{c}</li>)}</ul>}
          {page.avoid.length > 0 && <Table head={['Avoid when', 'Why', 'Use instead']} rows={page.avoid.map((a) => [a.when, a.reason, linked(a.useInstead) ?? '—'])} />}
        </section>
      )}
      <section className={s.section} aria-label="API">
        <h2 className={s.h2}>API</h2>
        {page.properties.length > 0 && <><h3 className={s.h3}>Properties</h3><Table head={['Property', 'Attribute', 'Type', 'Default', 'Description']} rows={page.properties.map((p: Row) => [text(p.key), text(p.attribute), text(p.type), text(p.default), text(p.description)])} /></>}
        {page.attributes.length > 0 && <><h3 className={s.h3}>Attributes</h3><Table head={['Attribute', 'Type', 'Description']} rows={page.attributes.map((a: Row) => [text(a.name), text(a.type), text(a.description)])} /></>}
        {page.events.length > 0 && <><h3 className={s.h3}>Events</h3><Table head={['Event', 'Detail', 'When']} rows={page.events.map((e: Row) => [text(e.name), text(e.detail), text(e.trigger)])} /></>}
        {page.reactProps.length > 0 && <><h3 className={s.h3}>React props</h3><Table head={['Prop']} rows={page.reactProps.map((p) => [<span key={p}>{p}</span>])} /></>}
      </section>
    </article>
  );
}
