// Containers: ui-container's presets, the nesting rule live (resolver beside the CSS), the concentric
// wireframe, attributes, a composition in context, and the four nesting models compared.
import '@massimo/ui-kit/components/button/element';
import '@massimo/ui-kit/components/input/element';
import '@massimo/ui-kit/components/listbox/element';
import '@massimo/ui-kit/components/select/element';
import '@massimo/ui-kit/components/btg/element';
import '@massimo/ui-kit/components/image/element';
import '@massimo/ui-kit/components/collapsible/element';
import { css } from '../../styled-system/css/index.js';
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Segmented } from '../studio/wc.tsx';
import { DENSITIES, CONTAINERS, PAGE_MAX_WIDTH_REM, resolveComposite, resolveContainerTree, resolveControl, type CardPadding, type ContainerNode, type ContainerPreset, type ResolvedContainer } from '@massimo/ui-kit/tokens/geometry/resolve';
import type { PageProps } from './types.ts';
import { Divider, IMAGES, Page, Row, Section, caption, dataTable, fmt, kicker, nameCell, noteCell, tableScroller } from './shared.tsx';

const levelBox = css({ bg: 'bg.subtle', alignSelf: 'start' });
const presetCell = css({ display: 'flex', flexDirection: 'column', gap: '2', flex: '[1 1 12rem]', minWidth: '0', alignSelf: 'start' });
const stretched = css({ alignSelf: 'stretch' });
const sizeGrid = css({ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(13rem, 1fr))', gap: '4', alignItems: 'start' });
const tintedBox = css({ bg: 'bg.muted' });
const titleBar = css({ bg: 'bg.mutedActive' });
const selectedRow = css({ bg: 'bg.muted' });
const presetBox = css({ bg: 'bg.subtle', alignSelf: 'stretch' });
const miniPage = css({ bg: 'bg.subtle', borderRadius: 'md' });
const tinted = css({ bg: 'bg' });
const cardColumns = css({ display: 'grid', width: 'full', gridTemplateColumns: '1fr', gap: '6', alignItems: 'start', '@container canvas (min-width: 40rem)': { gridTemplateColumns: '1fr 1fr' } });
const LADDER = ['xl', 'lg', 'md', 'sm', 'xs'] as const;
const sizeMatrix = css({ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(12rem, 1fr))', gap: '6', alignItems: 'start', overflowX: 'auto' });
const roundDemo = css({ display: 'grid', gridTemplateColumns: '1fr', gap: '6', alignItems: 'start', '@container canvas (min-width: 40rem)': { gridTemplateColumns: '1fr 1fr' } });
const tileGrid = css({ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(10rem, 1fr))', flex: '1' });
const levelChild = css({ display: 'block', bg: 'bg', minWidth: '10', minHeight: '6', borderRadius: 'sm' });

const LEVELS = Object.keys(CONTAINERS) as (keyof typeof CONTAINERS)[];

// Concentric wireframe: the real components with their fills removed and one inset stroke per
// type (a box-shadow follows border-radius and corner-shape), so only the nested curves show.
const STROKE = { card: 1, group: 2, control: 3, composite: 4, option: 5 } as const;
const wire = css({
  display: 'flex', flexWrap: 'wrap', alignItems: 'start', gap: '8',
  '& :is(ui-container, ui-button, ui-segmented, ui-option)': { bg: 'transparent', color: 'fg.muted' },
  '& ui-container[preset=card]': { boxShadow: '[inset 0 0 0 1.5px var(--colors-data-1)]' },
  '& ui-container[preset=group]': { boxShadow: '[inset 0 0 0 1.5px var(--colors-data-2)]' },
  '& ui-button': { boxShadow: '[inset 0 0 0 1.5px var(--colors-data-3)]' },
  '& ui-segmented': { boxShadow: '[inset 0 0 0 1.5px var(--colors-data-4)]' },
  '& ui-option': { boxShadow: '[inset 0 0 0 1.5px var(--colors-data-5)]' },
});
const legend = css({ display: 'grid', gridTemplateColumns: '[auto auto 1fr]', alignItems: 'center', columnGap: '3', rowGap: '2', textStyle: 'body-sm' });
const key = css({ width: '6', height: '4', borderRadius: 'sm' });

/** The theme inputs the container resolvers read: unit, border, curvature, density, the ladder, t and k. */
const treeInput = (params: PageProps['params']) => {
  const p = params as unknown as Record<string, number>;
  const ladder = (k: string) => Object.fromEntries(LEVELS.filter((l) => l !== 'composite').map((l) => [l, p[`${k}-${l}`]]));
  return {
    unit: params.unit, border: params.border, radiusScale: params['radius-scale'], density: DENSITIES[params.density],
    ratio: p['container-ratio'], padUnits: ladder('pad'), gapUnits: ladder('gap'),
    radiusFactor: { group: p['radius-group'], collection: p['radius-collection'], card: p['radius-card'] },
  };
};

const PRESET_ROWS: [ContainerPreset, CardPadding | undefined, string, string, string][] = [
  ['group', undefined, 'wrapping row', 'none', 'inline sets: buttons, chips, tags'],
  ['collection', undefined, 'stack', 'none', 'like items: lists, settings rows (the default)'],
  ['card', 'xs', 'stack', 'card', 'thumbnails, compact items'],
  ['card', 'sm', 'stack', 'card', 'grouped lists, small items in a grid'],
  ['card', 'md', 'stack', 'card', 'self-contained content (the default card)'],
  ['card', 'lg', 'stack', 'card', 'feature content'],
  ['card', 'xl', 'stack', 'card', 'hero or dialog-size surfaces'],
  ['panel', undefined, 'stack', 'panel', 'sidebars, workspaces (square)'],
  ['region', undefined, 'stack', 'none', 'page areas (square)'],
  ['page', undefined, 'stack, centered', 'none', `the outer frame, at most ${PAGE_MAX_WIDTH_REM}rem (square)`],
];

export function ContainersPage({ params }: PageProps) {
  const input = treeInput(params);
  return (
    <Page title="Containers" lead="One element for every level: <ui-container preset=…> (React Container). A preset sets where a container starts; one nesting rule sets radius and padding from the page down to the controls, so every curve follows the one around it..">
      <Divider />
      <Section id="presets" title="Presets" note="A container that is not nested keeps its preset: the ladder padding (Geometry tab, per level, × density) and the concentric radius, control radius + padding (× the radius magnitude t). Panel, region and page are square. Values are live.">
        <div className={tableScroller}>
          <table className={dataTable} aria-label="Container presets">
            <thead><tr><th>Preset</th><th>Flow</th><th>Surface</th><th>Padding<small>px</small></th><th>Gap<small>px</small></th><th>Radius<small>px</small></th><th>For</th></tr></thead>
            <tbody>
              {PRESET_ROWS.map(([preset, padding, flow, surface, use]) => {
                const t = resolveContainerTree({ preset, padding }, input);
                return (
                  <tr key={`${preset}-${padding ?? ''}`}>
                    <td className={nameCell}>{preset}{padding ? ` · ${padding}` : ''}</td>
                    <td>{flow}</td><td>{surface}</td>
                    <td>{fmt(t.padding)}</td><td>{fmt(t.gap)}</td><td>{fmt(t.radius)}</td>
                    <td className={noteCell}>{use}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Row label="live">
          {PRESET_ROWS.filter(([preset]) => preset !== 'page').map(([preset, padding]) => (
            <div key={`${preset}-${padding ?? ''}`} className={presetCell}>
              <span className={caption}>{preset}{padding ? ` · ${padding}` : ''}</span>
              {/* A wrapper paints only with a surface; a bare one has no inset of its own (decision 0017). */}
              <ui-container preset={preset} padding={padding} surface={preset === 'group' || preset === 'collection' ? 'panel' : undefined} className={presetBox}>
                {preset === 'group'
                  ? <><ui-button size="sm">One</ui-button><ui-button size="sm">Two</ui-button></>
                  : preset === 'collection'
                    ? <><ui-input label="collection field" hide-label="" placeholder="Field" /><ui-input label="collection second field" hide-label="" placeholder="Field" /></>
                    : <ui-section><ui-input label={`${preset} ${padding ?? ''} field`} hide-label="" placeholder="Field" /></ui-section>}
              </ui-container>
            </div>
          ))}
        </Row>
      </Section>
      <Divider />
      <Section id="nesting" title="Nesting" note="The rule, live. Padding is the input and radius follows: a nested container takes R_parent × k (k is Nesting ratio in the Geometry tab), and a nested card steps down the ladder to 3u. An unpainted group or collection adds no inset, so its contents share an edge. Each box shows the resolver beside the CSS it reads.">
        <NestingTree params={params} />
      </Section>
      <Divider />
      <Section id="concentric" title="Concentric" note="A card holding a button and a group; the group holds a button and a composite (segmented). Fills are removed and each type is one stroke. The card, holding the group, keeps the ratio for it; the group is the card's R − p, so its buttons sit on the same family of curves; the composite is a control (the control radius) and its options split the difference (R − D).">
        <ConcentricWire params={params} />
      </Section>
      <Divider />
      <Section id="attributes" title="Attributes" note="layout and surface override the preset's flow and elevation; radius scales the concentric radius by a magnitude t (sharper than its contents); gap and data-size override one element or a subtree.">
        <Row label='layout="…"'>
          {(['stack', 'row', 'wrap'] as const).map((l) => (
            <ui-container key={l} preset="card" padding="sm"  className={levelBox}><ui-section><ui-container preset="collection" layout={l}><span className={caption}>{l}</span><span className={levelChild} /><span className={levelChild} /></ui-container></ui-section></ui-container>
          ))}
        </Row>
        <Row label='surface="…"'>
          {(['none', 'panel', 'card', 'raised'] as const).map((sf) => (
            <ui-container key={sf} preset="card" padding="sm" surface={sf}><ui-section><span className={caption}>{sf}</span></ui-section></ui-container>
          ))}
        </Row>
        {['1', '0.5', '0'].map((t) => (
          <Row key={t} label={`radius="${t}"`}>
            <ui-container preset="card" className={levelBox} radius={t}><ui-section><ui-container preset="group"><ui-button>Save</ui-button><ui-button variant="primary">Publish</ui-button></ui-container></ui-section></ui-container>
          </Row>
        ))}
        <Row label='gap="…"'>
          {['0', '1', '4'].map((g) => (
            <ui-container preset="card" key={g} gap={g} className={levelBox}><ui-section>
              <span className={caption}>gap="{g}"</span><span className={levelChild} /><span className={levelChild} />
            </ui-section></ui-container>
          ))}
        </Row>
        <Row label="data-size">
          {(['3', '4', '5'] as const).map((z) => (
            <ui-container preset="card" key={z} data-size={z}><ui-section>
              <span className={kicker}>data-size="{z}"</span>
              <ui-container preset="group"><ui-button>Save</ui-button><ui-button>Cancel</ui-button></ui-container>
            </ui-section></ui-container>
          ))}
        </Row>
      </Section>
      <Divider />
      <Section id="context" title="In context" note="A page › region › panel frame (square areas restart the chain) holding cards that hold cards, collections and groups, all nested by the one rule.">
        <ui-container preset="page" className={miniPage} aria-label="Page example">
          <span className={kicker}>Page · max width {PAGE_MAX_WIDTH_REM}rem</span>
          <ui-container preset="region" aria-label="Region example" className={tinted}>
            <span className={kicker}>Region</span>
            <ui-container preset="panel" aria-label="Panel example">
              <span className={kicker}>Panel</span>
              <div className={cardColumns}>
                <ui-container preset="card"><ui-section>
                  <span className={kicker}>Card · Team</span>
                  {([['Design', ['Ada', 'Grace']], ['Engineering', ['Linus', 'Margaret']]] as const).map(([team, people]) => (
                    <ui-container preset="card" key={team}><ui-section>
                      <ui-row><span className={kicker}>Card · {team}</span></ui-row>
                      <ui-container preset="collection">
                        {people.map((n) => (
                          <ui-row key={n}>
                            <span>{n}</span>
                            <ui-container preset="group"><ui-button>Message</ui-button></ui-container>
                          </ui-row>
                        ))}
                      </ui-container>
                    </ui-section></ui-container>
                  ))}
                </ui-section></ui-container>
                <ui-container preset="card"><ui-section>
                  <span className={kicker}>Card · Details</span>
                  <ui-input label="Name" value="Spring catalog" />
                  <ui-container preset="group"><ui-button>Save</ui-button><ui-button>Cancel</ui-button></ui-container>
                </ui-section></ui-container>
              </div>
            </ui-container>
          </ui-container>
        </ui-container>
        <Row label="card grid">
          <ui-container preset="card"><ui-section className={tileGrid}>
            {['Dawn', 'Dusk', 'Coast', 'Night'].map((t, i) => (
              <ui-container preset="card" padding="xs" key={t}><ui-image src={IMAGES[i % IMAGES.length]} alt={t} ratio="landscape" /><ui-section><span>{t}</span></ui-section></ui-container>
            ))}
          </ui-section></ui-container>
        </Row>
      </Section>
      <Divider />
      <Section id="composed" title="Sections" note="A card holds an inset and has no padding of its own: its content sits in ui-section, as a control's content sits in slots. A section of size c starts p − c in from the edge and pads c, so its text lands on p whatever c is. Sections are spaced by collapsing margins. A child that is not a section is full-bleed. Radius follows padding, so the same outer radius takes a different multiple at each padding, and a sized section stays concentric with its card. A sized section's gap is its size, so a box tightens as it shrinks, as the grid shows: each row steps the same distance in from the card's edge, and the bottom row is flush. A title takes either form at no extra cost: at the panel's size it is transparent and its margin collapses with the panel's; at the card's size it is painted and flush, and the panel keeps its margin. Both end the same distance from the top.">
        <div className={sizeGrid}>
          {LADDER.map((size) => (
            <div className={presetCell} key={size}>
              <span className={caption}>divided · section {size}</span>
              <ui-container preset="card" padding="xl" className={stretched}>
                <ui-section size={size}><ui-row><strong>Card title</strong></ui-row></ui-section>
                <ui-section size={size} divided=""><ui-row className={selectedRow}>Row 1.1</ui-row><ui-row>Row 1.2</ui-row><ui-row>Row 1.3</ui-row></ui-section>
                <ui-section size={size} divided=""><ui-row>Row 2</ui-row></ui-section>
                <ui-section size={size} divided=""><ui-row>Row 3</ui-row></ui-section>
              </ui-container>
            </div>
          ))}
        </div>
        {([[false, 'collapsing'], [true, 'padded']] as const).map(([padded, name]) => (
          <div className={sizeMatrix} key={name}>
            {[4, 3, 2, 1, 0].flatMap((steps) => LADDER.map((card, i) => i + steps >= LADDER.length ? <span key={`${steps}${card}`} /> : (
              <div className={presetCell} key={`${steps}${card}`}>
                <span className={caption}>{name} · card {card} · section {LADDER[i + steps]}</span>
                <ui-container preset="card" padding={card} className={stretched}>
                  <SizedCard card={card} size={LADDER[i + steps]} padded={padded} />
                </ui-container>
              </div>
            )))}
          </div>
        ))}
        <div className={roundDemo}>
          {([[false, 'card xl · section md · collapsing title'], [true, 'card xl · section md · padded title']] as const).map(([padded, name]) => (
            <div className={presetCell} key={name}>
              <span className={caption}>{name}</span>
              <ui-container preset="card" padding="xl" className={stretched}><SizedCard card="xl" size="md" padded={padded} panels={3} /></ui-container>
            </div>
          ))}
        </div>
        <div className={roundDemo}>
          <div className={presetCell}>
            <span className={caption}>card xl · tinted section md</span>
            <ui-container preset="card" padding="xl" className={stretched}>
              <ui-section size="md"><ui-row><strong>Card title</strong></ui-row></ui-section>
              <ui-section size="md" className={tintedBox}><strong>Text on the same line as the title</strong><p>The box moves out and its text stays put.</p></ui-section>
            </ui-container>
          </div>
          <div className={presetCell}>
            <span className={caption}>bare child · full-bleed</span>
            <ui-container preset="card" className={stretched}>
              <ui-image src={IMAGES[0]} alt="Landscape" ratio="landscape" />
              <ui-section><strong>Card title</strong><p>Text lines up with the buttons.</p><ui-container preset="group"><ui-button variant="primary">Approve</ui-button><ui-button>Reset</ui-button></ui-container></ui-section>
            </ui-container>
          </div>
        </div>
      </Section>
    </Page>
  );
}

// Nesting: the real ui-container tree beside the resolver.
/** A title and panels of one size. Collapsing, the title is a transparent section of that size, and its margin collapses with the panel's. Padded, it is a painted section of the card's own size, flush, and the panel keeps its margin. */
function SizedCard({ card, size, padded, panels = 1 }: { card: CardPadding; size: CardPadding; padded: boolean; panels?: number }) {
  return <>
    <ui-section size={padded ? card : size} className={padded ? titleBar : undefined}><ui-row><strong>Container title</strong><i name="caret-down" icon-size="sm" /></ui-row></ui-section>
    {Array.from({ length: panels }, (_, i) => (
      <ui-section size={size} className={tintedBox} key={i}>
        <ui-row><strong>Card title</strong></ui-row>
        {['Option 1', 'Option 2', 'Option 3'].map((o) => <ui-row key={o}><span>{o}</span><i name="plus" /></ui-row>)}
      </ui-section>
    ))}
  </>;
}

function NestingTree({ params }: Pick<PageProps, 'params'>) {
  const [outer, setOuter] = useState<CardPadding>('xl');
  const [depth, setDepth] = useState('2');
  const D = Number(depth);
  const build = (d: number): ContainerNode => ({ preset: 'card', padding: d === 0 ? outer : undefined, children: d < D ? [build(d + 1)] : [] });
  const spec = build(0);
  const flat: ResolvedContainer[] = [];
  const walk = (n: ResolvedContainer) => { flat.push(n); n.children.forEach(walk); };
  walk(resolveContainerTree(spec, treeInput(params)));
  const ref = useRef<HTMLDivElement>(null);
  const [read, setRead] = useState<string[]>([]);
  useEffect(() => {
    const t = setTimeout(() => {
      const next = [...(ref.current?.querySelectorAll<HTMLElement>('ui-container') ?? [])].map((el) => { const cs = getComputedStyle(el); return `${fmt(parseFloat(cs.borderTopLeftRadius))} · ${fmt(parseFloat(cs.paddingTop))}`; });
      setRead((old) => (old.join() === next.join() ? old : next));
    }, 60);
    return () => clearTimeout(t);
  });
  const render = (n: ContainerNode, d: number): ReactNode => (
    <ui-container preset={n.preset} padding={n.padding} className={ucBox} style={{ '--stroke': `var(--colors-${DEPTH_STROKE[d % 4]})` } as CSSProperties}>
      <ui-section>
        <span className={labTag}>{d === 0 ? `card · ${n.padding}` : 'card'}: r {fmt(flat[d].radius)} · p {fmt(flat[d].edge)}{read[d] ? ` (CSS ${read[d]})` : ''}</span>
        {n.children?.length ? render(n.children[0], d + 1) : <ui-container preset="group"><ui-button>Save</ui-button><ui-button variant="primary">Publish</ui-button></ui-container>}
      </ui-section>
    </ui-container>
  );
  return (
    <>
      <div className={labControls}>
        <Segmented label="Outer card" value={outer} onValue={(v) => setOuter(v as CardPadding)} options={LAB_LEVELS.map((l) => [l, l])} />
        <Segmented label="Depth" value={depth} onValue={setDepth} options={[['1', '1'], ['2', '2'], ['3', '3']]} />
      </div>
      <div ref={ref} className={treeWrap}>{render(spec, 0)}</div>
    </>
  );
}
const treeWrap = css({ maxWidth: '[40rem]' });


function ConcentricWire({ params }: Pick<PageProps, 'params'>) {
  const p = params as unknown as Record<string, number>;
  const g = { unit: params.unit, border: params.border, radiusScale: params['radius-scale'], density: DENSITIES[params.density] };
  // The wireframe's tree under the nesting rule: the group is unpainted, so it adds no inset.
  const tree = resolveContainerTree({ preset: 'card', children: [{ preset: 'group' }] }, { ...g, ratio: p['container-ratio'], padUnits: { 'card-md': p['pad-card-md'], group: p['pad-group'] }, radiusFactor: { card: p['radius-card'], group: p['radius-group'] } });
  const card = tree, group = tree.children[0];
  const cmp = resolveComposite({ ...g, padUnits: p['pad-composite'] });
  const rows: [keyof typeof STROKE, string, string][] = [
    ['card', 'card (md)', `${fmt(card.radius)}px · p ${fmt(card.edge)}: its padding (× t), never rounder than it is deep`],
    ['group', 'group', `p ${fmt(group.edge)}: unpainted, so no inset; its controls share the card's edge`],
    ['control', 'button', `${fmt(resolveControl(g).radius)}px · min(3u·s, 4u)`],
    ['composite', 'composite', `${fmt(cmp.radius)}px · the control radius`],
    ['option', 'option', `${fmt(cmp.child.radius)}px · R − D`],
  ];
  return (
    <div className={wire}>
      <ui-container preset="card"><ui-section>
        <ui-button>Button</ui-button>
        <ui-container preset="group">
          <ui-button>Button</ui-button>
          <ui-segmented label="Composite" value="a"><ui-option value="a">Option</ui-option><ui-option value="b">Option</ui-option></ui-segmented>
        </ui-container>
      </ui-section></ui-container>
      <div className={legend} role="list" aria-label="Stroke colors">
        {rows.map(([k, name, value]) => (
          <div key={k} role="listitem" style={{ display: 'contents' }}>
            <span className={key} style={{ boxShadow: `inset 0 0 0 1.5px var(--colors-data-${STROKE[k]})` }} />
            <span>{name}</span>
            <span>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Nesting tree ──
const LAB_LEVELS = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
const DEPTH_STROKE = ['data-1', 'data-2', 'data-3', 'data-4'];
const labTag = css({ textStyle: 'body-sm', fontVariantNumeric: 'tabular-nums' });
const ucBox = css({ boxShadow: '[inset 0 0 0 1.5px var(--stroke)]' });
const labControls = css({ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(16rem, 1fr))', gap: '4', marginBlockEnd: '6' });

