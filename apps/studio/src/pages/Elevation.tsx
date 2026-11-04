// Elevation: how surfaces stack (docs/specs/elevation.md). The six levels at the live theme, the
// compound shadow taken apart into its three layers, the dp ramp, and nested surfaces. Every fill and
// shadow is a kit token; the demos that need a shadow at an arbitrary dp get it as a custom property.
import '@massimo/ui-kit/components/button/element';
import '@massimo/ui-kit/components/range/element';
import { useState, type CSSProperties } from 'react';
import { css, cx } from '../../styled-system/css/index.js';
import { ELEVATION, SHADOW_LAYERS, VAR_REF, compoundShadowCss, shadowAt, type ElevationLevel } from '@massimo/ui-kit/tokens/elevation/index';
import { Range } from '../studio/wc.tsx';
import type { PageProps } from './types.ts';
import { Divider, Page, Row, Section, caption, dataTable, fmt, kicker, nameCell, noteCell, tableScroller } from './shared.tsx';

const levelGrid = css({ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(10rem, 1fr))', gap: '6', bg: 'bg', padding: '6', borderRadius: 'xl' });
const tile = css({ display: 'flex', flexDirection: 'column', justifyContent: 'end', gap: '1', minHeight: '[7rem]', padding: '4', borderRadius: 'lg' });
// Fills and shadows per level, all tokens (floating and modal are popup surfaces, not container surfaces).
const LEVEL_STYLE: Record<ElevationLevel, string> = {
  page: css({ bg: 'bg', boxShadow: '[inset 0 0 0 1px var(--colors-border)]' }),
  panel: css({ bg: 'elevation.panel' }),
  card: css({ bg: 'elevation.card', boxShadow: 'card' }),
  raised: css({ bg: 'elevation.card', boxShadow: 'raised' }),
  floating: css({ bg: 'elevation.overlay', boxShadow: 'floating' }),
  modal: css({ bg: 'elevation.overlay', boxShadow: 'modal' }),
};
const DP_PARAM: Partial<Record<ElevationLevel, 'shadow-raised' | 'shadow-floating' | 'shadow-modal'>> = { raised: 'shadow-raised', floating: 'shadow-floating', modal: 'shadow-modal' };
const USES: Record<ElevationLevel, string> = {
  page: 'the document; ui-container preset page and region',
  panel: 'preset panel, surface="panel"',
  card: 'preset card, surface="card" (a card in a card takes the page fill)',
  raised: 'surface="raised"; every card when Raise cards is on',
  floating: 'popover, preview card, menus, select and combobox popups, navigation menu, toast',
  modal: 'dialog, alert dialog, drawer (bg.backdrop behind)',
};

// One shadow layer at e dp, at the theme's shadow strength (the layer colors are scheme tokens).
const layerCss = (layer: keyof typeof SHADOW_LAYERS, e: number) => {
  const l = SHADOW_LAYERS[layer];
  return `0 ${l.y * e}px ${l.blur * e}px ${l.spread * e}px color-mix(in oklch, ${VAR_REF(layer)} clamp(0%, calc(100% * var(--ui-shadow-strength) * ${Math.min(1, e)}), 100%), transparent)`;
};
const shadowVar = css({ bg: 'elevation.overlay', boxShadow: '[var(--sh)]' });
const anatomy = css({ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(9rem, 1fr))', gap: '8', bg: 'bg', padding: '8', borderRadius: 'xl' });
const ramp = css({ display: 'flex', flexWrap: 'wrap', gap: '8', bg: 'bg', padding: '8', borderRadius: 'xl' });
const rampTile = css({ display: 'flex', alignItems: 'end', width: '[6rem]', height: '[5rem]', padding: '3', borderRadius: 'lg' });
const nestWrap = css({ maxWidth: '[44rem]' });

export function ElevationPage({ params }: PageProps) {
  const p = params as unknown as Record<string, number>;
  const [dp, setDp] = useState(8);
  const dpOf = (l: ElevationLevel) => (DP_PARAM[l] ? p[DP_PARAM[l]!] : ELEVATION[l].dp);
  return (
    <Page title="Elevation" lead="How surfaces stack: six levels, each a fill, a shadow and a layer. The theme tunes the shadow strength, how far fills move from the page (surface contrast), each lifted level's elevation in dp, and whether cards are raised (Elevation in the Geometry tab). Switch the scheme to see dark: shadows deepen and fills lighten.">
      <Divider />
      <Section id="levels" title="Levels" note="Each level is one step up the stack. Page, panel and card are told apart by fill alone (no shadow at 0dp); raised, floating and modal by a compound shadow at their dp. Values are live.">
        <div className={levelGrid}>
          {(Object.keys(ELEVATION) as ElevationLevel[]).map((l) => (
            <div key={l} className={cx(tile, LEVEL_STYLE[l])}><span className={kicker}>{ELEVATION[l].level} · {l}</span><span className={caption}>{dpOf(l)}dp · {ELEVATION[l].layer}</span></div>
          ))}
        </div>
        <div className={tableScroller}>
          <table className={dataTable} aria-label="Elevation levels">
            <thead><tr><th>Level</th><th>Fill</th><th>Shadow<small>dp</small></th><th>Layer</th><th>Used by</th></tr></thead>
            <tbody>
              {(Object.keys(ELEVATION) as ElevationLevel[]).map((l) => (
                <tr key={l}><td className={nameCell}>{ELEVATION[l].level} · {l}</td><td>{l === 'card' || l === 'raised' ? 'elevation.card' : l === 'panel' ? 'elevation.panel' : l === 'page' ? 'bg' : 'elevation.overlay'}</td><td>{l === 'card' ? (p['card-raised'] ? p['shadow-raised'] : `0 (${p['shadow-raised']} with Raise cards)`) : dpOf(l)}</td><td>{ELEVATION[l].layer}</td><td className={noteCell}>{USES[l]}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
      <Divider />
      <Section id="anatomy" title="Shadow anatomy" note="A shadow is three layers, each linear in the elevation e: an umbra (tight, under the edge), a penumbra (the soft body, offset down) and an ambient (wide, even). Each layer's color is the shadow role at its scheme alpha, times Shadow strength; 0dp casts nothing.">
        <Range label="Elevation (dp)" value={dp} min={0} max={24} step={1} onValue={setDp} />
        <div className={anatomy}>
          {(Object.keys(SHADOW_LAYERS) as (keyof typeof SHADOW_LAYERS)[]).map((k) => (
            <div key={k} className={cx(rampTile, shadowVar)} style={{ '--sh': layerCss(k, dp) } as CSSProperties}><span className={caption}>{k}</span></div>
          ))}
          <div className={cx(rampTile, shadowVar)} style={{ '--sh': compoundShadowCss(dp, VAR_REF) } as CSSProperties}><span className={caption}>compound</span></div>
        </div>
        <div className={tableScroller}>
          <table className={dataTable} aria-label="Shadow layers">
            <thead><tr><th>Layer</th><th>y<small>px</small></th><th>Blur<small>px</small></th><th>Spread<small>px</small></th><th>Alpha<small>light</small></th><th>Alpha<small>dark</small></th><th>Per dp</th></tr></thead>
            <tbody>
              {shadowAt(dp).map((r) => {
                const l = SHADOW_LAYERS[r.layer];
                return <tr key={r.layer}><td className={nameCell}>{r.layer}</td><td>{fmt(r.y)}</td><td>{fmt(r.blur)}</td><td>{fmt(r.spread)}</td><td>{fmt(r.light * params['shadow-strength'])}</td><td>{fmt(r.dark * params['shadow-strength'])}</td><td className={noteCell}>y {l.y} · blur {l.blur} · spread {l.spread}</td></tr>;
              })}
            </tbody>
          </table>
        </div>
      </Section>
      <Divider />
      <Section id="ramp" title="The dp ramp" note="Elevation is continuous: any dp from 0 to 24 is a valid shadow. The kit names five: 1 and 3 (shadows sm and md, small lifts inside components), then the theme's raised, floating and modal.">
        <div className={ramp}>
          {[0, 1, 2, 3, 4, 6, 8, 12, 16, 24].map((e) => (
            <div key={e} className={cx(rampTile, shadowVar)} style={{ '--sh': compoundShadowCss(e, VAR_REF) } as CSSProperties}><span className={caption}>{e}dp</span></div>
          ))}
        </div>
      </Section>
      <Divider />
      <Section id="surfaces" title="Surfaces" note="Containers take a level through their preset or surface=. A panel sits on the page by fill; cards sit on the panel by fill; a card in a card takes the page fill, so nesting alternates instead of drifting darker. Surface contrast 0 collapses every fill to the page fill, leaving shadows alone to separate levels.">
        <div className={nestWrap}>
          <ui-container preset="panel">
            <span className={kicker}>Panel</span>
            <ui-container preset="card">
              <span className={kicker}>Card</span>
              <ui-container preset="card"><span className={kicker}>Card in a card</span><ui-container preset="group"><ui-button>Save</ui-button><ui-button variant="primary">Publish</ui-button></ui-container></ui-container>
            </ui-container>
            <ui-container preset="card" surface="raised"><span className={kicker}>Card · surface="raised"</span></ui-container>
          </ui-container>
        </div>
        <Row label='surface="…"'>
          {(['none', 'panel', 'card', 'raised'] as const).map((sf) => (
            <ui-container key={sf} preset="card" padding="sm" surface={sf}><span className={caption}>{sf}</span></ui-container>
          ))}
        </Row>
      </Section>
    </Page>
  );
}
