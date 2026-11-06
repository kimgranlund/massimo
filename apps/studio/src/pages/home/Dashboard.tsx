// Dashboard: stat cards (figures through the data-numeric contract, feedback badges), a stacked bar
// chart and a ranked meter in the data colors, and a data list (card › collection of rows › group
// of row actions).
import { useState } from 'react';
import { css, cx } from '../../../styled-system/css/index.js';
import { CHANNELS, ORDERS, STATS, STATUS_TONE, TOP_PRODUCTS, WEEKS, type OrderStatus } from './data.ts';
import * as s from './styles.ts';

// Container queries on the page width (literal here so Panda can extract them).
const CQ_SM = '@container home (min-width: 30rem)';
const CQ_MD = '@container home (min-width: 44rem)';
const CQ_LG = '@container home (min-width: 64rem)';

const head = css({ display: 'flex', flexWrap: 'wrap', alignItems: 'end', justifyContent: 'space-between', gap: '4' });
const stats = css({
  display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 'gap.card-md',
  [CQ_SM]: { gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' },
  [CQ_LG]: { gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' },
});
const figure = css({ textStyle: 'heading-1', display: 'flex', alignItems: 'baseline', gap: '0.5' });
const unit = css({ textStyle: 'heading-3', color: 'fg.muted' });
const statFoot = css({ display: 'flex', alignItems: 'center', gap: '2', flexWrap: 'wrap' });
const charts = css({
  display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 'gap.card-md',
  [CQ_LG]: { gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)' },
});
const plot = css({ display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr)', gridTemplateRows: '[minmax(0, 1fr) auto]', columnGap: '2', rowGap: '1', height: '[14rem]' });
// Axis labels sit centered on their gridlines (top, quarters, baseline).
const yAxis = css({
  display: 'flex', flexDirection: 'column', justifyContent: 'space-between', textAlign: 'end',
  textStyle: 'body-sm',
  '& > span': { lineHeight: '[1]', marginBlock: '[-0.5em]' },
});
// Gridlines: a top border plus one line at the bottom of each quarter.
const bars = css({
  display: 'flex', gap: '2', alignItems: 'stretch', minWidth: '0', borderTopWidth: 'thin', borderColor: 'border',
  backgroundImage: '[linear-gradient(to top, var(--colors-border-strong) 1px, transparent 1px)]',
  backgroundSize: '[100% 25%]', backgroundRepeat: 'repeat-y', backgroundPosition: '[bottom]',
});
const week = css({ flex: '1', minWidth: '0', display: 'flex', justifyContent: 'center' });
const barStack = css({
  display: 'flex', flexDirection: 'column-reverse', gap: '[1px]', width: '[min(100%, 2.25rem)]',
  '& > span': { display: 'block', flexShrink: 0, height: '[calc(var(--v) * 100%)]' },
  '& > span:last-child': { borderTopRadius: 'sm' },
});
const ticks = css({ gridColumn: '2', display: 'flex', gap: '2', '& > span': { flex: '1', minWidth: '0', textAlign: 'center' } });
const tick = css({ textStyle: 'body-sm', whiteSpace: 'nowrap' });
const tickWide = css({ visibility: 'hidden', [CQ_MD]: { visibility: 'visible' } });
const legend = css({ display: 'flex', flexWrap: 'wrap', columnGap: '4', rowGap: '1.5', textStyle: 'body-sm', '& > span': { display: 'inline-flex', alignItems: 'center', gap: '1.5' } });
const dot = css({ display: 'inline-block', width: '2', height: '2', borderRadius: 'full' });
const meter = css({ display: 'flex', flexDirection: 'column', gap: '1.5' });
const meterTrack = css({ height: '2', borderRadius: 'full', bg: 'bg.muted', overflow: 'hidden', '& > span': { display: 'block', height: 'full', width: '[calc(var(--v) * 100%)]', borderRadius: 'full' } });

// Orders: narrow, each row is its own two-line grid; wide, the collection is one grid of columns
// and every row (and the header) is a subgrid, so the columns line up without fixed widths.
const COLS = 'auto minmax(0, 1.4fr) minmax(0, 1fr) auto auto auto';
const orders = css({ [CQ_MD]: { display: 'grid', gridTemplateColumns: COLS, columnGap: '4' } });
const orderRow = css({
  display: 'grid', gridTemplateColumns: 'auto minmax(0, 1fr) auto', gridTemplateAreas: '"who name total" "who meta actions"',
  columnGap: '3', rowGap: '1', alignItems: 'center', paddingBlock: '2',
  '&:not(:last-child)': { borderBottomWidth: 'thin', borderColor: 'border' },
  [CQ_MD]: { gridColumn: '1 / -1', gridTemplateColumns: 'subgrid', gridTemplateAreas: '"who name meta status total actions"', rowGap: '0' },
});
const area = (a: string) => css({ gridArea: a });
const who = css({ gridArea: 'who', alignSelf: 'start', [CQ_MD]: { alignSelf: 'center' } });
const meta = css({ gridArea: 'meta', display: 'flex', alignItems: 'center', gap: '2', flexWrap: 'wrap', minWidth: '0' });
const metaStatus = css({ [CQ_MD]: { display: 'none' } });
// Narrow rows keep status, time and one action; the channel and the quick view join from medium up.
const wideOnly = css({ display: 'none', [CQ_MD]: { display: 'inline-flex' } });
const statusCol = css({ gridArea: 'status', display: 'none', [CQ_MD]: { display: 'block' } });
const total = css({ gridArea: 'total', textAlign: 'end', textStyle: 'title' });
const actions = css({ gridArea: 'actions', justifySelf: 'end' });
const listHead = css({
  display: 'none', paddingBottom: '2', borderBottomWidth: 'thin', borderColor: 'border',
  [CQ_MD]: { display: 'grid', gridColumn: '1 / -1', gridTemplateColumns: 'subgrid', alignItems: 'center', '& > :nth-child(5)': { textAlign: 'end' } },
});
const ellipsis = css({ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' });

const FILTERS: ('All' | OrderStatus)[] = ['All', 'Paid', 'Pending', 'Shipped', 'Refunded'];

export function Dashboard() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All');
  const totals = WEEKS.map((_, w) => CHANNELS.reduce((sum, [, v]) => sum + v[w], 0));
  const max = Math.ceil(Math.max(...totals) / 10) * 10;
  const topMax = TOP_PRODUCTS[0].units;
  const rows = ORDERS.filter((o) => filter === 'All' || o.status === filter);
  return (
    <>
      <div className={head}>
        <div className={s.stack1}>
          <span className={s.groupKicker}>Store · last 30 days</span>
          <h2 className={s.h1}>Good morning, Kim</h2>
        </div>
        <ui-container preset="group" gap="2">
          <ui-segmented label="Period" value="30d">
            <ui-option value="7d">7d</ui-option><ui-option value="30d">30d</ui-option><ui-option value="90d">90d</ui-option>
          </ui-segmented>
          <ui-button><i slot="leading" name="export" />Export</ui-button>
        </ui-container>
      </div>

      <div className={stats}>
        {STATS.map((st) => (
          <ui-container preset="card" key={st.label}><ui-section>
            <span className={s.label}>{st.label}</span>
            <strong className={figure} data-numeric>
              {st.unit === '$' && <span className={unit} data-numeric>$</span>}{st.value}{st.unit === '%' && <span className={unit} data-numeric>%</span>}
            </strong>
            <div className={statFoot}>
              <ui-badge className={s.tone[st.tone]}><i slot="leading" name={st.icon} />{st.delta}</ui-badge>
              <span className={s.caption}>{st.note}</span>
            </div>
          </ui-section></ui-container>
        ))}
      </div>

      <div className={charts}>
        <ui-container preset="card"><ui-section>
          <div className={s.spread}>
            <div className={s.stack1}><h3 className={s.h3}>Revenue by channel</h3><span className={s.caption}>Weekly, in thousands of dollars</span></div>
            <ui-tag><i slot="leading" name="calendar-blank" />Sep 8 – Nov 2</ui-tag>
          </div>
          <div className={plot} role="img" aria-label={`Weekly revenue by channel. ${CHANNELS.map(([n, v]) => `${n}: ${v.join(', ')}`).join('. ')}.`}>
            <div className={yAxis} aria-hidden="true">{[4, 3, 2, 1, 0].map((i) => <span key={i} data-numeric>{(max / 4) * i}</span>)}</div>
            <div className={bars}>
              {WEEKS.map((w, i) => (
                <div key={w} className={week}>
                  <div className={barStack}>
                    {/* The share is the only inline style: a ratio custom property (styles: barStack). */}
                    {CHANNELS.map(([n, v], c) => <span key={n} className={s.DATA_BG[c]} style={{ '--v': String(v[i] / max) } as React.CSSProperties} />)}
                  </div>
                </div>
              ))}
            </div>
            <div className={ticks} aria-hidden="true">
              {WEEKS.map((w, i) => <span key={w} className={cx(tick, i % 2 ? tickWide : undefined)} data-numeric>{w}</span>)}
            </div>
          </div>
          <div className={legend}>{CHANNELS.map(([n], c) => <span key={n}><i className={cx(dot, s.DATA_BG[c])} />{n}</span>)}</div>
        </ui-section></ui-container>
        <ui-container preset="card"><ui-section>
          <div className={s.stack1}><h3 className={s.h3}>Top products</h3><span className={s.caption}>Units sold, last 30 days</span></div>
          {TOP_PRODUCTS.map((p, i) => (
            <div key={p.name} className={meter}>
              <div className={s.spread}><span className={s.label}>{p.name}</span><span className={s.caption} data-numeric>{p.units}</span></div>
              <div className={meterTrack}><span className={s.DATA_BG[i]} style={{ '--v': String(p.units / topMax) } as React.CSSProperties} /></div>
            </div>
          ))}
          <ui-button><i slot="leading" name="list-bullets" />All products</ui-button>
        </ui-section></ui-container>
      </div>

      <ui-container preset="card"><ui-section>
        <div className={s.spread}>
          <div className={s.stack1}><h3 className={s.h3}>Recent orders</h3><span className={s.caption}>{rows.length} of {ORDERS.length} shown</span></div>
          <ui-container preset="group" gap="2">
            {FILTERS.map((f) => (
              <ui-chip key={f} selectable selected={filter === f || undefined} onClick={() => setFilter(f)}>{f}</ui-chip>
            ))}
          </ui-container>
        </div>
        <ui-container preset="collection" gap="0" className={orders}>
          <div className={cx(listHead, s.groupKicker)} aria-hidden="true">
            <span /><span>Customer</span><span>Channel</span><span>Status</span><span>Total</span><span />
          </div>
          {rows.map((o, i) => (
            <div key={o.id} className={orderRow}>
              <ui-avatar className={cx(s.tone[s.AVATAR_TONES[i % 5]], who)} aria-hidden="true">{o.initials}</ui-avatar>
              <div className={cx(area('name'), s.stack1)}>
                <span className={cx(s.strong, ellipsis)}>{o.customer}</span>
                <span className={cx(s.caption, ellipsis)}>{o.id} · {o.item}</span>
              </div>
              <div className={meta}>
                <ui-tag className={wideOnly}>{o.channel}</ui-tag>
                <ui-tag className={cx(s.tone[STATUS_TONE[o.status]], metaStatus)}>{o.status}</ui-tag>
                <span className={s.caption}>{o.when}</span>
              </div>
              <span className={statusCol}><ui-tag className={s.tone[STATUS_TONE[o.status]]}>{o.status}</ui-tag></span>
              <span className={total} data-numeric>${o.total}</span>
              <ui-container preset="group" density="compact" className={actions}>
                <ui-button variant="ghost" aria-label={`View order ${o.id}`} className={wideOnly}><i slot="leading" name="eye" /></ui-button>
                <ui-button variant="ghost" aria-label={`More for order ${o.id}`}><i slot="leading" name="dots-three" /></ui-button>
              </ui-container>
            </div>
          ))}
        </ui-container>
      </ui-section></ui-container>
    </>
  );
}
