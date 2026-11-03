// Containers: container tokens, levels, nesting, groups and collections, and overrides. Every
// container token has a live example.
import '@massimo/ui-kit/components/button/element';
import '@massimo/ui-kit/components/input/element';
import '@massimo/ui-kit/components/listbox/element';
import '@massimo/ui-kit/components/select/element';
import '@massimo/ui-kit/components/btg/element';
import '@massimo/ui-kit/components/image/element';
import { css } from '../../styled-system/css/index.js';
import { CONTAINERS, PAGE_MAX_WIDTH_REM, radiusFamily, resolveComposite, resolveContainer, resolveControl } from '@massimo/ui-kit/tokens';
import type { PageProps } from './types.ts';
import { Divider, IMAGES, Page, Row, Section, caption, columns, dataTable, fmt, groupHead, kicker, nameCell, noteCell, subTitle, tableScroller } from './shared.tsx';

const levelBox = css({ bg: 'primary.subtle', alignSelf: 'start' });
const levelList = css({ minWidth: '[10rem]' });
const miniPage = css({ bg: 'bg.subtle', borderRadius: 'md' });
const tinted = css({ bg: 'bg' });
const tileRow = css({ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' });
const wideCol = css({ minWidth: '[16rem]', bg: 'bg.muted' });
const tileGrid = css({ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(10rem, 1fr))', flex: '1' });
const levelChild = css({ display: 'block', bg: 'bg', minWidth: '10', minHeight: '6', borderRadius: 'sm' });

const LEVELS = Object.keys(CONTAINERS) as (keyof typeof CONTAINERS)[];

// Concentric wireframe: the real components with their fills removed and one inset stroke per
// type (a box-shadow follows border-radius and corner-shape), so only the nested curves show.
const STROKE = { card: 1, group: 2, control: 3, composite: 4, option: 5 } as const;
const wire = css({
  display: 'flex', flexWrap: 'wrap', alignItems: 'start', gap: '8',
  '& :is(ui-card, ui-group, ui-button, ui-segmented, ui-option)': { bg: 'transparent', color: 'fg.muted' },
  '& ui-card': { boxShadow: '[inset 0 0 0 1.5px var(--colors-data-1)]' },
  '& ui-group': { boxShadow: '[inset 0 0 0 1.5px var(--colors-data-2)]' },
  '& ui-button': { boxShadow: '[inset 0 0 0 1.5px var(--colors-data-3)]' },
  '& ui-segmented': { boxShadow: '[inset 0 0 0 1.5px var(--colors-data-4)]' },
  '& ui-option': { boxShadow: '[inset 0 0 0 1.5px var(--colors-data-5)]' },
});
const legend = css({ display: 'grid', gridTemplateColumns: '[auto auto 1fr]', alignItems: 'center', columnGap: '3', rowGap: '2', textStyle: 'caption', color: 'fg.muted' });
const key = css({ width: '6', height: '4', borderRadius: 'sm' });

export function ContainersPage({ params }: PageProps) {
  const p = params as unknown as Record<string, number>;
  const u = params.unit;
  return (
    <Page title="Containers" lead="Wrappers, containers and areas: live padding, gap and radius per level, with examples. The Geometry tab sets padding and gap per level.">
      <Divider />
      <Section id="containers" title="Container tokens" note="Four families. Composites (listbox, segmented) are controls: the control radius, options R − D. Wrappers (group, collection) and containers (card, padding xs…xl) are concentric with their controls: control radius + padding. Areas (panel, region, page) are square. Wrappers and cards scale that radius by a magnitude t (radius-group, radius-collection, radius-card in the Geometry tab; the radius attribute per element). Live padding, gap and radius per level.">
        <div className={tableScroller}>
          <table className={dataTable} aria-label="Container tokens">
            <thead>
              <tr>
                <th rowSpan={2}>Level</th><th rowSpan={2}>Family</th>
                <th colSpan={2} className={groupHead}>Padding</th><th colSpan={2} className={groupHead}>Gap</th>
                <th rowSpan={2}>Radius<small>px</small></th><th rowSpan={2}>Used by</th>
              </tr>
              <tr><th>u</th><th>px</th><th>u</th><th>px</th></tr>
            </thead>
            <tbody>
              {LEVELS.map((l) => {
                const pad = p[`pad-${l}`] ?? CONTAINERS[l].padding, gap = p[`gap-${l}`] ?? pad;
                const f = radiusFamily(l);
                const c = resolveContainer(l, { unit: u, border: params.border, radiusScale: params['radius-scale'], padUnits: pad, gapUnits: gap, radiusFactor: f ? p[`radius-${f}`] : undefined });
                return (
                  <tr key={l}>
                    <td className={nameCell}>{l}</td>
                    <td>{CONTAINERS[l].family}</td>
                    <td>{fmt(pad)}</td><td>{fmt(c.padding)}</td>
                    <td>{fmt(gap)}</td><td>{fmt(c.gap)}</td>
                    <td>{fmt(c.radius)}</td>
                    <td className={noteCell}>{USED_BY[l]}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>
      <Divider />
      <Section id="concentric" title="Concentric" note="A card holding a button and a group; the group holds a button and a composite (segmented) with its options. Fills are removed and each type is one stroke, so the nested curves show: the group and the composite share the control's radius rule; options split the composite's difference (R − D); the group and the card are the control radius + their padding. Move Corner radius, Unit or the radius magnitudes in the Geometry tab.">
        <ConcentricWire params={params} />
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
      <Section id="magnitude" title="Radius magnitude" note="R = t × the concentric radius: a container can be sharper than its contents. Each collection holds the same buttons; the radius attribute sets t on that element only (the Geometry tab sets the theme's t per family).">
        {[1, 0.75, 0.5, 0.25, 0].map((t) => (
          <Row key={t} label={`radius="${t}"`}>
            <ui-collection className={levelBox} radius={String(t)}><ui-button>Save</ui-button><ui-button variant="primary">Publish</ui-button></ui-collection>
            <ui-card className={levelBox} radius={String(t)}><span className={levelChild}>card</span></ui-card>
          </Row>
        ))}
      </Section>
      <Divider />
      <Section id="nesting" title="Nesting" note="Areas (page › region › panel) hold containers (card, a small card inside), which hold wrappers (collection › group). Wrappers and cards stay concentric with their controls (control radius + padding), times the radius magnitude t.">
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
    </Page>
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

function ConcentricWire({ params }: Pick<PageProps, 'params'>) {
  const p = params as unknown as Record<string, number>;
  const g = { unit: params.unit, border: params.border, radiusScale: params['radius-scale'] };
  const card = resolveContainer('card-md', { ...g, padUnits: p['pad-card-md'], radiusFactor: p['radius-card'] });
  const group = resolveContainer('group', { ...g, padUnits: p['pad-group'], radiusFactor: p['radius-group'] });
  const cmp = resolveComposite({ ...g, padUnits: p['pad-composite'] });
  const rows: [keyof typeof STROKE, string, string][] = [
    ['card', 'card (md)', `${fmt(card.radius)}px · control radius + padding, × t`],
    ['group', 'group', `${fmt(group.radius)}px · control radius + padding, × t`],
    ['control', 'button', `${fmt(resolveControl(g).radius)}px · min(3u·s, 4u)`],
    ['composite', 'composite', `${fmt(cmp.radius)}px · the control radius`],
    ['option', 'option', `${fmt(cmp.child.radius)}px · R − D`],
  ];
  return (
    <div className={wire}>
      <ui-card>
        <ui-button>Button</ui-button>
        <ui-group>
          <ui-button>Button</ui-button>
          <ui-segmented label="Composite" value="a"><ui-option value="a">Option</ui-option><ui-option value="b">Option</ui-option></ui-segmented>
        </ui-group>
      </ui-card>
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
