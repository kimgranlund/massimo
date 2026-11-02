// Geometry: the control ladder made visible. Every number comes from the resolvers in
// @massimo/ui-kit/tokens for the live theme (border, corner radius; the unit marks the theme row),
// next to a small specimen rendered by the kit's CSS.
import '@massimo/ui-kit/components/button/element';
import '@massimo/ui-kit/components/input/element';
import '@massimo/ui-kit/components/listbox/element';
import '@massimo/ui-kit/components/select/element';
import '@massimo/ui-kit/components/btg/element';
import '@massimo/ui-kit/components/choice/element';
import '@massimo/ui-kit/components/range/element';
import '@massimo/ui-kit/components/color/element';
import '@massimo/ui-kit/components/separator/element';
import '@massimo/ui-kit/components/avatar/element';
import '@massimo/ui-kit/components/meter/element';
import { css } from '../../styled-system/css/index.js';
import {
  SIZES, resolveBtg, resolveChoice, resolveComposite, resolveControl, resolveField, resolveSelectTrigger, resolveSwatch, resolveTextRun, resolveTrack, resolveSeparator, resolveAvatar, resolveMeter,
  type BtgKind, type ControlParts, type GeometryInput, type TextPart,
} from '@massimo/ui-kit/tokens';
import type { PageProps } from './types.ts';
import { dataTable, currentRow, groupHead, tableScroller, CQ_MD, Divider, Page, Section, fmt, metrics, rowLabel, specimens } from './shared.tsx';

const LADDER = [2, 2.25, 2.5, 2.75, 3, 3.5, 4, 4.5, 5, 6, 8, 10, 12];

const metricList = css({ display: 'flex', flexDirection: 'column', gap: '0.5' });
const specRow = css({ display: 'grid', gridTemplateColumns: '1fr', gap: '2', alignItems: 'center', paddingBlock: '2', borderBottomWidth: 'thin', borderColor: 'border', [CQ_MD]: { gridTemplateColumns: '11rem 14rem 1fr', gap: '6' } });

const PATTERNS: [string, ControlParts][] = [
  ['contents', {}],
  ['leading · contents', { leading: true }],
  ['contents · trailing', { trailing: true }],
  ['contents · suffix', { suffix: true }],
  ['leading · prefix · contents · suffix · trailing', { leading: true, prefix: true, suffix: true, trailing: true }],
];
const TEXT_PARTS: TextPart[] = ['prefix', 'contents', 'suffix'];

function PatternButton({ parts, label }: { parts: ControlParts; label: string }) {
  return (
    <ui-button title={label}>
      {parts.leading && <i slot="leading" name="plus" />}
      {parts.prefix && <span slot="prefix">$</span>}
      Label
      {parts.suffix && <span slot="suffix">⌘S</span>}
      {parts.trailing && <i slot="trailing" name="caret-down" />}
    </ui-button>
  );
}

function BtgSpecimen({ kind }: { kind: BtgKind }) {
  if (kind === 'badge') return <ui-badge>New</ui-badge>;
  if (kind === 'tag') return <ui-tag><i slot="leading" name="star" />Featured</ui-tag>;
  return <ui-chip selectable selected><i slot="leading" name="check" />Design</ui-chip>;
}

function SpecRow({ label, children, values }: { label: string; children: React.ReactNode; values: string[] }) {
  return (
    <div className={specRow}>
      <span className={rowLabel}>{label}</span>
      <div className={specimens}>{children}</div>
      <div className={metricList}>{values.map((v) => <span key={v} className={metrics}>{v}</span>)}</div>
    </div>
  );
}

export function GeometryPage({ params }: PageProps) {
  const u = params.unit;
  // Border is 0..u/2 per resolver contract: clamp it per size so the small end of the ladder resolves.
  const at = (unit: number): GeometryInput => ({ unit, border: Math.min(params.border, unit / 2), radiusScale: params['radius-scale'] });
  const theme = at(u);
  const ladder = [...new Set([...LADDER, u])].sort((a, b) => a - b);
  const px = (v: number) => `${fmt(v)}px`;
  const pu = (v: number) => `${fmt(v)}px · ${fmt(v / u)}u`;
  const c = resolveControl(theme);

  return (
    <Page title="Geometry" lead={<>One unit u sizes every control: 8u tall, 6u slots, text 10px + u. Values come from the resolvers for the live theme: border {px(params.border)}, corner radius ×{params['radius-scale']}; the highlighted row is the theme unit ({px(u)}).</>}>
      <Divider />
      <Section id="ladder" title="Control ladder" note="Per size (data-size, u in px): control height 8u, slot 6u, padding 1u − border, text 10px + u at line height 1.2 (capped at the slot), icons font + k·u (sm −0.5, md +0.5, lg +1.5, capped at the slot), radius min(3u × scale, height / 2), and badge / tag / chip heights 12px + k·u.">
        <div className={tableScroller}>
          <table className={dataTable}>
            <thead>
              <tr>
                <th rowSpan={2}>u</th><th rowSpan={2}>Specimen</th><th rowSpan={2}>Height<small>8u</small></th><th rowSpan={2}>Slot<small>6u</small></th><th rowSpan={2}>Padding<small>u − B</small></th>
                <th colSpan={2} className={groupHead}>Text</th><th colSpan={3} className={groupHead}>Icon</th><th rowSpan={2}>Radius</th><th colSpan={3} className={groupHead}>Height</th>
              </tr>
              <tr>
                <th>Size<small>10 + u</small></th><th>Line<small>1.2 × size</small></th>
                <th>sm</th><th>md</th><th>lg</th>
                <th>Badge</th><th>Tag</th><th>Chip</th>
              </tr>
            </thead>
            <tbody>
              {ladder.map((size) => {
                const g = at(size), r = resolveControl(g);
                const ic = (k: 'sm' | 'md' | 'lg') => fmt(resolveControl({ ...g, iconSize: k }).iconSize);
                const b = (k: BtgKind) => fmt(resolveBtg(k, g).height);
                const isTheme = size === u;
                // A theme unit that is not a kit size renders at the canvas unit (no data-size).
                const sizeAttr = !isTheme && (SIZES as readonly number[]).includes(size) ? String(size) : undefined;
                return (
                  <tr key={size} className={isTheme ? currentRow : undefined}>
                    <td>{fmt(size)}{isTheme ? ' · theme' : ''}</td>
                    <td><span className={specimens} data-size={sizeAttr}><ui-button aria-label={`Add, size ${size}`}><i slot="leading" name="plus" /></ui-button></span></td>
                    <td>{fmt(r.height)}</td><td>{fmt(r.slot)}</td><td>{fmt(r.padding)}</td>
                    <td>{fmt(r.fontSize)}</td><td>{fmt(r.contents.lineHeight)}</td>
                    <td>{ic('sm')}</td><td>{ic('md')}</td><td>{ic('lg')}</td>
                    <td>{fmt(r.radius)}</td>
                    <td>{b('badge')}</td><td>{b('tag')}</td><td>{b('chip')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>
      <Divider />
      <Section id="construction" title="Construction pattern" note={`[leading] [prefix] [contents] [suffix] [trailing] at the theme unit (u = ${fmt(u)}px). Slots are 6u (${fmt(c.slot)}px); a text part's edge is 1u beside a slot, 2u at a bare edge, 0.5u beside another text part (so text parts sit 1u apart). Absent parts take no space. Values are start | end padding per text part.`}>
        <div className={tableScroller}>
          <table className={dataTable}>
            <thead><tr><th>Specimen</th><th>Leading</th><th>Prefix</th><th>Contents</th><th>Suffix</th><th>Trailing</th></tr></thead>
            <tbody>
              {PATTERNS.map(([name, parts]) => {
                const run = resolveTextRun(parts, theme);
                return (
                  <tr key={name}>
                    <td><PatternButton parts={parts} label={name} /></td>
                    <td>{parts.leading ? `6u slot` : '–'}</td>
                    {TEXT_PARTS.map((k) => <td key={k}>{run[k] ? `${fmt(run[k]!.start / u)}u | ${fmt(run[k]!.end / u)}u` : '–'}</td>)}
                    <td>{parts.trailing ? `6u slot` : '–'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>
      <Divider />
      <Section id="labels" title="Badge, tag, chip" note="Each is spaced like a scaled-down control on its own unit u′ = height / 8: host padding 0.5u′ − border, slot height − u′, labels 1u′ from a slot (chip 1.5u′ at a bare edge), concentric radius.">
        {(['badge', 'tag', 'chip'] as const).map((k) => {
          const t = resolveBtg(k, theme);
          return (
            <SpecRow key={k} label={k} values={[
              `height ${px(t.height)} · u′ ${px(t.localUnit)} · slot ${px(t.slot)}`,
              `text ${px(t.fontSize)} / ${fmt(t.lineHeight)} · icon ${px(t.iconSize)}`,
              `padding ${px(t.padding)} · edges bare ${px(t.bareEdge)}, slot ${px(t.slotEdge)}, between ${px(t.between)} · radius ${px(t.radius)}`,
            ]}><BtgSpecimen kind={k} /></SpecRow>
          );
        })}
      </Section>
      <Divider />
      <Section id="fields" title="Fields and composites" note="Fields lay out as a slotless button (text where a button label sits); the select trigger adds a 6u chevron slot. Composites (listbox, segmented, select popup) pad 0.5u and shrink their options' inset, so a segmented row stays 8u.">
        {(() => {
          const f = resolveField(theme), s = resolveSelectTrigger(theme), m = resolveComposite(theme);
          return (
            <>
              <SpecRow label="input" values={[`height ${px(f.height)} · text start ${pu(f.paddingStart)} · end ${pu(f.paddingEnd)}`]}>
                <ui-input label="Name" hide-label="" value="Spring catalog" />
              </SpecRow>
              <SpecRow label="select trigger" values={[`text start ${pu(s.paddingStart)} · value gap ${pu(s.valueGap)}`, `chevron slot ${px(s.chevronSlot)} · icon ${px(s.chevronIcon)}`]}>
                <ui-select label="Edition" hide-label="" value="spring"><ui-option value="spring">Spring</ui-option><ui-option value="autumn">Autumn</ui-option></ui-select>
              </SpecRow>
              <SpecRow label="composite" values={[`row ${px(m.rowHeight)} · edge ${pu(m.edge)} · radius ${px(m.radius)}`, `option height ${px(m.child.height)} · inset ${px(m.child.inset)} · radius ${px(m.child.radius)}`]}>
                <ui-segmented label="View" value="a"><ui-option value="a">Day</ui-option><ui-option value="b">Week</ui-option></ui-segmented>
              </SpecRow>
            </>
          );
        })()}
      </Section>
      <Divider />
      <Section id="choices" title="Choices, tracks, swatches" note="Checkbox and radio are a 5u box in the 6u leading slot (switch 9u × 5u); range and progress a 4u track; swatches the 6u slot square.">
        {(['checkbox', 'radio', 'switch'] as const).map((k) => {
          const t = resolveChoice(k, theme);
          return (
            <SpecRow key={k} label={k} values={[`box ${px(t.width)} × ${px(t.box)} · radius ${px(t.radius)} · label start ${pu(t.labelPaddingStart)}`, k === 'switch' ? `thumb ${px(t.thumb)} · travel ${px(t.thumbTravel)}` : k === 'radio' ? `dot ${px(t.dot)}` : `mark ${px(t.mark)}`]}>
              {k === 'checkbox' ? <ui-checkbox checked>Checkbox</ui-checkbox> : k === 'radio' ? <ui-radio checked>Radio</ui-radio> : <ui-switch checked>Switch</ui-switch>}
            </SpecRow>
          );
        })}
        {(['range', 'progress'] as const).map((k) => {
          const t = resolveTrack(k, theme);
          return (
            <SpecRow key={k} label={k} values={[`track ${px(t.track)} · radius ${px(t.trackRadius)} · min width ${px(t.minWidth)}`, ...(k === 'range' ? [`thumb ${px(t.thumb)} · inset ${px(t.thumbInset)} · radius ${px(t.thumbRadius)}`] : [])]}>
              {k === 'range' ? <ui-range label="Volume" value={40} /> : <ui-progress label="Upload" value={64} />}
            </SpecRow>
          );
        })}
        {(() => {
          const t = resolveMeter(theme);
          return (
            <SpecRow label="meter" values={[`track ${px(t.track)} · row gap ${pu(t.rowGap)} · label | value gap ${pu(t.columnGap)}`, `text ${px(t.fontSize)} / ${px(t.lineHeight)}`]}>
              <ui-meter label="Storage" value={64} />
            </SpecRow>
          );
        })()}
        {(() => {
          const t = resolveSwatch(theme);
          return (
            <SpecRow label="swatch" values={[`size ${px(t.size)} · radius ${px(t.radius)} · palette radius ${px(t.paletteRadius)}`]}>
              <ui-swatch color="#3b82f6" /><ui-swatch color="#10b981" />
            </SpecRow>
          );
        })()}
      </Section>
      <Divider />
      <Section id="display" title="Display" note="A separator is as thick as the theme border, never thinner than a hairline: max(1px, B). An avatar is n·u square (sm 6, md 8, lg 12, xl 16): a control scaled by k = n / 8.">
        {(['sm', 'md', 'lg', 'xl'] as const).map((k) => {
          const t = resolveAvatar(k, theme);
          return (
            <SpecRow key={k} label={`avatar ${k}`} values={[`size ${px(t.size)} · radius ${px(t.radius)}`, `initials ${px(t.fontSize)} · icon ${px(t.iconSize)}`]}>
              <ui-avatar avatar-size={k} name="Ada Lovelace" /><ui-avatar avatar-size={k} />
            </SpecRow>
          );
        })}
        {(() => {
          const t = resolveSeparator(theme);
          return (
            <SpecRow label="separator" values={[`thickness ${px(t.thickness)} · B ${px(t.border)}`]}>
              <ui-group><ui-button>Cut</ui-button><ui-separator orientation="vertical" /><ui-button>Paste</ui-button></ui-group>
            </SpecRow>
          );
        })()}
      </Section>
    </Page>
  );
}
