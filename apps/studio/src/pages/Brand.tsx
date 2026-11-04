// Brand: the brand authoring workflow's render-and-review step (docs/planning/brand-schema.md, step
// 6). Pick a worked brand (or Load one) and Apply: the jig hydrates it into the theme. The page shows
// the active brand's frame, its character and where each value came from (and whether hand tuning
// has moved it), its anchors against the generated steps, its faces and voice, the open questions and
// both lints, then the worked brands compared scale by scale.
import '@massimo/ui-kit/components/button/element';
import '@massimo/ui-kit/components/btg/element';
import { css } from '../../styled-system/css/index.js';
import { DESCRIPTORS, EXAMPLE_BRANDS, brandCharacter, describeTheme, hydrate, lintBrand, lintTheme, partsFromParameters, primaryTerritory, type Brand } from '@massimo/ui-kit/tokens';
import { APPLY_BRAND, type PageProps } from './types.ts';
import { Divider, Page, Section, caption, columns, dataTable, kicker, metrics, nameCell, noteCell, rowLabel, subTitle, tableScroller } from './shared.tsx';

const cards = css({ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(16rem, 1fr))', gap: '4' });
const cardBody = css({ display: 'flex', flexDirection: 'column', gap: '2' });
const swatchPair = css({ display: 'flex', gap: '1' });
const swatch = css({ width: '10', height: '8', borderRadius: 'md', boxShadow: '[inset 0 0 0 1px var(--colors-border)]', bg: '[var(--sw)]' });
const faceLine = css({ fontSize: '[1.5rem]', lineHeight: '[1.2]', fontFamily: '[var(--face)]' });
const frameList = css({ display: 'grid', gridTemplateColumns: '[max-content 1fr]', columnGap: '4', rowGap: '2', '& dt': { textStyle: 'label' }, '& dd': { textStyle: 'body' } });
const findings = css({ display: 'flex', flexDirection: 'column', gap: '1', textStyle: 'body' });
const chosen = css({ bg: 'primary.subtle' });

const apply = (b: Brand) => window.dispatchEvent(new CustomEvent(APPLY_BRAND, { detail: b }));

export function BrandPage({ params, spectrum, brand }: PageProps) {
  return (
    <Page title="Brand" lead="A brand is authored first and hydrates the theme: its frame (subject, grounding, territories, muse) and closed choices set the geometry, typography, color and motion. Apply a worked brand, or Load your own (a brand, or a brand and theme bundle from Copy); tune by hand and Copy writes both.">
      <Divider />
      <Section id="brands" title="Worked brands" note="Three brands from three briefs, each grounded differently. Apply hydrates one into the jig; every page then renders under it.">
        <div className={cards}>
          {EXAMPLE_BRANDS.map((b) => (
            <ui-container key={b.name} preset="card" className={brand?.name === b.name ? chosen : undefined}>
              <div className={cardBody}>
                <span className={kicker}>{b.subject.kind} · {b.grounding?.primary.ref ?? b.grounding?.primary.name ?? 'no grounding'}</span>
                <h3 className={subTitle}>{b.subject.name}</h3>
                <p className={caption}>{b.subject.primaryJob}</p>
                <span className={metrics}>{primaryTerritory(b)?.name} · signature {b.signature?.scale}</span>
              </div>
              <ui-container preset="group">
                <ui-button variant={brand?.name === b.name ? undefined : 'primary'} onClick={() => apply(b)}>{brand?.name === b.name ? 'Re-apply' : 'Apply'}</ui-button>
              </ui-container>
            </ui-container>
          ))}
        </div>
      </Section>
      <Divider />
      {brand ? <ActiveBrand brand={brand} params={params} spectrum={spectrum} /> : (
        <Section id="active" title="Active brand" note="No brand is applied: the theme is hand tuned or loaded as a theme. Apply a worked brand above, or Load a brand JSON.">
          <p className={caption}>The jig's Copy writes a theme until a brand is active.</p>
        </Section>
      )}
      <Divider />
      <Section id="compare" title="Compare" note="The worked brands read back scale by scale (describeTheme on each hydrated theme). The signature, the one scale each brand pushes, is marked.">
        <div className={tableScroller}>
          <table className={dataTable} aria-label="Worked brands by scale">
            <thead><tr><th>Scale</th>{EXAMPLE_BRANDS.map((b) => <th key={b.name}>{b.subject.name}</th>)}</tr></thead>
            <tbody>
              {Object.values(DESCRIPTORS).map((s) => (
                <tr key={s.id}>
                  <td className={nameCell}>{s.title}</td>
                  {EXAMPLE_BRANDS.map((b) => {
                    const v = describeTheme(hydrate(b).theme)[s.id].value;
                    return <td key={b.name}>{v}{b.signature?.scale === s.id ? ' ★' : ''}</td>;
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>
    </Page>
  );
}

function ActiveBrand({ brand, params, spectrum }: { brand: Brand } & Pick<PageProps, 'params' | 'spectrum'>) {
  const { character, from } = brandCharacter(brand);
  const { theme, unresolved } = hydrate(brand);
  // The live read-back: the jig's current parameters (hand tuning included) against the brand's values.
  const live = describeTheme({ ...theme, ...partsFromParameters(params) });
  const brandFindings = lintBrand(brand);
  const themeFindings = lintTheme(theme).findings;
  const t = primaryTerritory(brand);
  return (
    <>
      <Section id="frame" title={brand.subject.name} note={`${brand.subject.audience}: ${brand.subject.primaryJob}.`}>
        <dl className={frameList}>
          <dt>Sources</dt><dd>{brand.subject.sources.join(' · ')}</dd>
          {brand.grounding && <><dt>Grounding</dt><dd>{brand.grounding.primary.ref ?? brand.grounding.primary.name} ({brand.grounding.primary.relation}){brand.grounding.secondary ? `; ${brand.grounding.secondary.ref ?? brand.grounding.secondary.name} (${brand.grounding.secondary.relation})` : ''}</dd></>}
          {t && <><dt>Territory</dt><dd>{t.name}{t.ref ? ` (${t.ref})` : ''}: {t.description}</dd></>}
          {brand.muse && <><dt>Muse</dt><dd>{brand.muse.name}: take {brand.muse.take}{brand.muse.leave ? `; leave ${brand.muse.leave}` : ''}</dd></>}
          {brand.signature && <><dt>Signature</dt><dd>{brand.signature.scale}: {brand.signature.reason}</dd></>}
        </dl>
      </Section>
      <Divider />
      <Section id="character" title="Character" note="Each scale's value, the brand path that set it (explicit choice, territory or grounding), and what the jig reads now: hand tuning in the panel moves the live value or its distance.">
        <div className={tableScroller}>
          <table className={dataTable} aria-label="Brand character">
            <thead><tr><th>Scale</th><th>Brand</th><th>From</th><th>Live</th></tr></thead>
            <tbody>
              {Object.values(DESCRIPTORS).map((s) => {
                const v = character[s.id] ?? s.default, l = live[s.id];
                return (
                  <tr key={s.id}>
                    <td className={nameCell}>{s.title}{brand.signature?.scale === s.id ? ' ★' : ''}</td><td>{v}</td>
                    <td className={noteCell}>{from[s.id] ?? 'kit default'}</td>
                    <td>{l.value}{l.value !== v ? ' (moved)' : ''}{l.distance ? ` · ${l.distance}` : ''}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>
      <Divider />
      <Section id="anchors" title="Anchors" note="Each brand color beside the generated step it became (exact in light), with its contrast against the page and the step's target; the family takes the anchor's hue and its chroma is re-shaped toward it.">
        <div className={tableScroller}>
          <table className={dataTable} aria-label="Brand anchors">
            <thead><tr><th>Anchor</th><th>Swatches<small>brand · step</small></th><th>Role</th><th>Step</th><th>Lc<small>anchor · target</small></th><th>ΔE<small>before</small></th><th>Order</th></tr></thead>
            <tbody>
              {(brand.color?.anchors ?? []).map((a) => {
                const r = spectrum?.anchors.find((x) => x.role === a.role);
                return (
                  <tr key={a.role}>
                    <td className={nameCell}>{a.name}</td>
                    <td><span className={swatchPair}><span className={swatch} style={{ '--sw': a.value } as React.CSSProperties} />{r && <span className={swatch} style={{ '--sw': `var(--colors-spectrum-${r.family}-${r.step})` } as React.CSSProperties} />}</span></td>
                    <td>{a.role}{r ? ` (${r.family})` : ''}</td><td>{r?.step ?? '…'}</td>
                    <td>{r ? `${r.lc} · ${r.target}` : '…'}</td><td>{r?.dE ?? '…'}</td><td>{r ? (r.inOrder ? 'kept' : 'broken') : '…'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>
      <Divider />
      <Section id="type-voice" title="Faces and voice" note="Each brand face in its stack (fallbacks follow the face's descriptor), then the voice's microcopy on real controls.">
        <div className={columns}>
          <div className={cardBody}>
            {Object.entries(brand.type?.faces ?? {}).map(([role, f]) => (
              <div key={role}>
                <span className={rowLabel}>{role} · {f!.descriptor}{f!.weights ? ` · ${f!.weights.join(', ')}` : ''}</span>
                <p className={faceLine} style={{ '--face': `"${f!.family}", system-ui` } as React.CSSProperties}>{f!.family}: {brand.subject.name}</p>
              </div>
            ))}
          </div>
          <ui-container preset="card">
            <span className={kicker}>Voice · {(brand.voice?.tone ?? []).join(', ')}</span>
            {brand.voice?.samples?.action && <ui-container preset="group"><ui-button variant="primary">{brand.voice.samples.action}</ui-button></ui-container>}
            {brand.voice?.samples?.confirmation && <p className={caption}>{brand.voice.samples.confirmation}</p>}
            {brand.voice?.samples?.error && <p className={caption}>{brand.voice.samples.error}</p>}
          </ui-container>
        </div>
      </Section>
      <Divider />
      <Section id="review" title="Review" note="Open questions hydrate could not answer, then the brand lint (genericness, traceability, bounds, coherence) and the hydrated theme's lint. All advisory.">
        <div className={findings}>
          {unresolved.map((u) => <span key={u}><ui-badge>question</ui-badge> {u}</span>)}
          {brandFindings.map((f) => <span key={f.id + f.message}><ui-badge>{f.severity}</ui-badge> {f.id}: {f.message}</span>)}
          {themeFindings.map((f) => <span key={f.id + f.message}><ui-badge>{f.severity}</ui-badge> {f.id} (theme): {f.message}</span>)}
          {!unresolved.length && !brandFindings.length && !themeFindings.length && <span>Nothing open: the brand is complete and both lints are clean.</span>}
        </div>
      </Section>
    </>
  );
}

