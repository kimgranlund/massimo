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
import { Range, Segmented } from '../studio/wc.tsx';
import { DENSITIES, CONTAINERS, PAGE_MAX_WIDTH_REM, resolveComposite, resolveContainer, resolveContainerTree, resolveControl, type CardPadding, type ContainerNode, type ContainerPreset, type ResolvedContainer } from '@massimo/ui-kit/tokens';
import type { PageProps } from './types.ts';
import { Divider, IMAGES, Page, Row, Section, caption, columns, dataTable, fmt, kicker, nameCell, noteCell, subTitle, tableScroller } from './shared.tsx';

const levelBox = css({ bg: 'primary.subtle', alignSelf: 'start' });
const miniPage = css({ bg: 'bg.subtle', borderRadius: 'md' });
const tinted = css({ bg: 'bg' });
const tileRow = css({ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' });
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
const legend = css({ display: 'grid', gridTemplateColumns: '[auto auto 1fr]', alignItems: 'center', columnGap: '3', rowGap: '2', textStyle: 'caption' });
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
            <ui-container key={`${preset}-${padding ?? ''}`} preset={preset} padding={padding} className={levelBox}><span className={caption}>{preset}{padding ? ` · ${padding}` : ''}</span><span className={levelChild} /></ui-container>
          ))}
        </Row>
      </Section>
      <Divider />
      <Section id="nesting" title="Nesting" note="The rule, live. A nested container is concentric with its parent: R = R_parent − p_parent. A container that holds containers keeps a ratio for them, p = R − max(control radius, R × k) (k is Nesting ratio in the Geometry tab); a nested leaf fits its controls, p = R − control radius. levels on the root splits the padding evenly instead, p = (R − control radius) / levels, so every curve down to the buttons is concentric. Each box shows the resolver's r · p beside what the CSS reads back.">
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
            <ui-container key={l} preset="collection" layout={l} className={levelBox}><span className={caption}>{l}</span><span className={levelChild} /><span className={levelChild} /></ui-container>
          ))}
        </Row>
        <Row label='surface="…"'>
          {(['none', 'panel', 'card', 'raised'] as const).map((sf) => (
            <ui-container key={sf} preset="card" padding="sm" surface={sf}><span className={caption}>{sf}</span></ui-container>
          ))}
        </Row>
        {['1', '0.5', '0'].map((t) => (
          <Row key={t} label={`radius="${t}"`}>
            <ui-container preset="card" className={levelBox} radius={t}><ui-container preset="group"><ui-button>Save</ui-button><ui-button variant="primary">Publish</ui-button></ui-container></ui-container>
          </Row>
        ))}
        <Row label='gap="…"'>
          {['0', '1', '4'].map((g) => (
            <ui-container preset="card" key={g} gap={g} className={levelBox}>
              <span className={caption}>gap="{g}"</span><span className={levelChild} /><span className={levelChild} />
            </ui-container>
          ))}
        </Row>
        <Row label="data-size">
          {(['3', '4', '5'] as const).map((z) => (
            <ui-container preset="card" key={z} data-size={z}>
              <span className={kicker}>data-size="{z}"</span>
              <ui-container preset="group"><ui-button>Save</ui-button><ui-button>Cancel</ui-button></ui-container>
            </ui-container>
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
              <div className={columns}>
                <ui-container preset="card">
                  <span className={kicker}>Card · Team</span>
                  {([['Design', ['Ada', 'Grace']], ['Engineering', ['Linus', 'Margaret']]] as const).map(([team, people]) => (
                    <ui-container preset="card" key={team}>
                      <span className={kicker}>Card · {team}</span>
                      <ui-container preset="collection">
                        {people.map((n) => (
                          <div key={n} className={tileRow}>
                            <span>{n}</span>
                            <ui-container preset="group"><ui-button>Message</ui-button></ui-container>
                          </div>
                        ))}
                      </ui-container>
                    </ui-container>
                  ))}
                </ui-container>
                <ui-container preset="card">
                  <span className={kicker}>Card · Details</span>
                  <ui-input label="Name" value="Spring catalog" />
                  <ui-container preset="group"><ui-button>Save</ui-button><ui-button>Cancel</ui-button></ui-container>
                </ui-container>
              </div>
            </ui-container>
          </ui-container>
        </ui-container>
        <Row label="card grid">
          <ui-container preset="card" className={tileGrid}>
            {['Dawn', 'Dusk', 'Coast', 'Night'].map((t, i) => (
              <ui-container preset="card" padding="xs" key={t}><ui-image src={IMAGES[i % IMAGES.length]} alt={t} ratio="landscape" /><span>{t}</span></ui-container>
            ))}
          </ui-container>
        </Row>
      </Section>
      <Divider />
      <Section id="why" title="Why this model" note="How a card can hold cards, compared (decision 0014). A anchors each card to its own controls, so nested corners miss the outer curve; B subtracts a constant padding and collapses; C (the default) keeps a ratio; D (levels) splits evenly. Each box shows r · p and Δ, its distance from the concentric radius.">
        <ui-collapsible label="Compare the four models">
          <NestedLab params={params} />
        </ui-collapsible>
      </Section>
    </Page>
  );
}

// Nesting: the real ui-container tree beside the resolver.
function NestingTree({ params }: Pick<PageProps, 'params'>) {
  const [outer, setOuter] = useState<CardPadding>('xl');
  const [depth, setDepth] = useState('2');
  const [mode, setMode] = useState('ratio');
  const D = Number(depth);
  const build = (d: number): ContainerNode => ({ preset: 'card', padding: d === 0 ? outer : undefined, ...(d === 0 && mode === 'levels' ? { levels: D + 1 } : {}), children: d < D ? [build(d + 1)] : [] });
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
    <ui-container preset={n.preset} padding={n.padding} levels={n.levels ? String(n.levels) : undefined} className={ucBox} style={{ '--stroke': `var(--colors-${DEPTH_STROKE[d % 4]})` } as CSSProperties}>
      <span className={labTag}>{d === 0 ? `card · ${n.padding}${n.levels ? ` · levels ${n.levels}` : ''}` : 'card'}: r {fmt(flat[d].radius)} · p {fmt(flat[d].edge)}{read[d] ? ` (CSS ${read[d]})` : ''}</span>
      {n.children?.length ? render(n.children[0], d + 1) : <ui-container preset="group"><ui-button>Save</ui-button><ui-button variant="primary">Publish</ui-button></ui-container>}
    </ui-container>
  );
  return (
    <>
      <div className={labControls}>
        <Segmented label="Outer card" value={outer} onValue={(v) => setOuter(v as CardPadding)} options={LAB_LEVELS.map((l) => [l, l])} />
        <Segmented label="Depth" value={depth} onValue={setDepth} options={[['1', '1'], ['2', '2'], ['3', '3']]} />
        <Segmented label="Padding" value={mode} onValue={setMode} options={[['ratio', 'Ratio (C)'], ['levels', 'Levels (D)']]} />
      </div>
      <div ref={ref} className={treeWrap}>{render(spec, 0)}</div>
    </>
  );
}
const treeWrap = css({ maxWidth: '[40rem]' });


function ConcentricWire({ params }: Pick<PageProps, 'params'>) {
  const p = params as unknown as Record<string, number>;
  const g = { unit: params.unit, border: params.border, radiusScale: params['radius-scale'], density: DENSITIES[params.density] };
  // The wireframe's tree under the nesting rule: the card holds a group, so it keeps the ratio for it.
  const tree = resolveContainerTree({ preset: 'card', children: [{ preset: 'group' }] }, { ...g, ratio: p['container-ratio'], padUnits: { 'card-md': p['pad-card-md'], group: p['pad-group'] }, radiusFactor: { card: p['radius-card'], group: p['radius-group'] } });
  const card = tree, group = tree.children[0];
  const cmp = resolveComposite({ ...g, padUnits: p['pad-composite'] });
  const rows: [keyof typeof STROKE, string, string][] = [
    ['card', 'card (md)', `${fmt(card.radius)}px · p ${fmt(card.edge)}: control radius + padding (× t); holding a container, p = R − R·k`],
    ['group', 'group', `${fmt(group.radius)}px · p ${fmt(group.edge)}: the card's R − p, its controls inside at R − p`],
    ['control', 'button', `${fmt(resolveControl(g).radius)}px · min(3u·s, 4u)`],
    ['composite', 'composite', `${fmt(cmp.radius)}px · the control radius`],
    ['option', 'option', `${fmt(cmp.child.radius)}px · R − D`],
  ];
  return (
    <div className={wire}>
      <ui-container preset="card">
        <ui-button>Button</ui-button>
        <ui-container preset="group">
          <ui-button>Button</ui-button>
          <ui-segmented label="Composite" value="a"><ui-option value="a">Option</ui-option><ui-option value="b">Option</ui-option></ui-segmented>
        </ui-container>
      </ui-container>
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

// ── Nested cards lab (exploration: three composition models, see the section note) ──
type Node = { r: number; p: number; gap: number; ideal?: number; kids: Node[] };
const LAB_LEVELS = ['xs', 'sm', 'md', 'lg', 'xl'] as const;
const DEPTH_STROKE = ['data-1', 'data-2', 'data-3', 'data-4'];
const labGrid = css({ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(18rem, 1fr))', gap: '8', alignItems: 'start' });
const labBox = css({ display: 'flex', flexDirection: 'column', boxSizing: 'border-box', borderRadius: '[var(--r)]', padding: '[var(--p)]', gap: '[var(--g)]', boxShadow: '[inset 0 0 0 1.5px var(--stroke)]' });
const labTag = css({ textStyle: 'caption', fontVariantNumeric: 'tabular-nums' });
const ucBox = css({ boxShadow: '[inset 0 0 0 1.5px var(--stroke)]' });
const labControls = css({ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(16rem, 1fr))', gap: '4', marginBlockEnd: '6' });

function NestedLab({ params }: Pick<PageProps, 'params'>) {
  const p = params as unknown as Record<string, number>;
  const [level, setLevel] = useState<(typeof LAB_LEVELS)[number]>('xl');
  const [depth, setDepth] = useState('2');
  const [k, setK] = useState(0.6);
  const g = { unit: params.unit, border: params.border, radiusScale: params['radius-scale'], density: DENSITIES[params.density] };
  const card = (l: (typeof LAB_LEVELS)[number]) => resolveContainer(`card-${l}`, { ...g, padUnits: p[`pad-card-${l}`], radiusFactor: p['radius-card'] });
  const outer = card(level), ctlR = resolveControl(g).radius, D = Number(depth);
  const kids = (d: number, make: (d: number) => Node) => (d >= D ? [] : Array.from({ length: d === 0 ? 2 : 1 }, () => make(d + 1)));
  // A: each nested card is one level smaller and keeps its own radius rule.
  const outward = (d: number): Node => {
    const c = card(LAB_LEVELS[Math.max(0, LAB_LEVELS.indexOf(level) - d)]);
    return { r: c.radius, p: c.edge, gap: c.edge, kids: kids(d, outward) };
  };
  // B: a child's radius is the parent's radius − the parent's padding; the padding carries down.
  const inward = (d: number, r = outer.radius): Node => ({ r, p: outer.edge, gap: outer.edge, kids: kids(d, (n) => inward(n, Math.max(0, r - outer.edge))) });
  // C: a child's radius is the parent's × k (at least the control radius); the padding is the rest.
  const ladder = (d: number, r = outer.radius): Node => {
    const child = Math.max(ctlR, r * k);
    const pad = Math.max(0, r - child);
    return { r, p: pad, gap: pad, kids: kids(d, (n) => ladder(n, child)) };
  };
  // D: B with the padding derived: every level steps down evenly so the innermost container's inside
  // (R − p) is the control radius: p = (R − control radius) / (levels), the root and D nested levels.
  const step = Math.max(0, (outer.radius - ctlR) / (D + 1));
  const even = (d: number, r = outer.radius): Node => ({ r, p: step, gap: step, kids: kids(d, (n) => even(n, Math.max(0, r - step))) });
  const withIdeal = (n: Node): Node => ({ ...n, kids: n.kids.map((c) => withIdeal({ ...c, ideal: Math.max(0, n.r - n.p) })) });
  const box = (n: Node, d: number, key: string): ReactNode => (
    <div key={key} className={labBox} style={{ '--r': `${n.r}px`, '--p': `${n.p}px`, '--g': `${n.gap}px`, '--stroke': `var(--colors-${DEPTH_STROKE[d % 4]})` } as CSSProperties}>
      <span className={labTag}>r {fmt(n.r)} · p {fmt(n.p)}{n.ideal !== undefined ? ` · Δ ${n.r - n.ideal >= 0 ? '+' : ''}${fmt(n.r - n.ideal)}` : ''}</span>
      {n.kids.length ? n.kids.map((c, i) => box(c, d + 1, `${key}.${i}`)) : (<>
        <span className={labTag}>control r {fmt(ctlR)} · Δ {ctlR - Math.max(0, n.r - n.p) >= 0 ? '+' : ''}{fmt(ctlR - Math.max(0, n.r - n.p))}</span>
        <ui-button>Action</ui-button>
      </>)}
    </div>
  );
  const models: [string, Node][] = [['A · outward (each card its own rule)', withIdeal(outward(0))], ['B · inward subtraction', withIdeal(inward(0))], ['C · ratio ladder', withIdeal(ladder(0))], ['D · even split (B, padding derived)', withIdeal(even(0))]];
  return (
    <>
      <div className={labControls}>
        <Segmented label="Outer card" value={level} onValue={(v) => setLevel(v)} options={LAB_LEVELS.map((l) => [l, l])} />
        <Segmented label="Depth" value={depth} onValue={setDepth} options={[['1', '1'], ['2', '2'], ['3', '3']]} />
        <Range label="Ladder k (C)" value={k} min={0.3} max={0.9} step={0.05} onValue={setK} />
      </div>
      <div className={labGrid}>
        {models.map(([name, tree]) => (
          <div key={name}>
            <h3 className={subTitle}>{name}</h3>
            {box(tree, 0, name)}
          </div>
        ))}
      </div>
    </>
  );
}
