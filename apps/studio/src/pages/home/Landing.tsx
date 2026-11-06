// Landing hero: display and body-lg roles, primary and neutral actions, brand color as material
// (a primary-solid card holding the hero image and a small card that takes the page fill).
import { css, cx } from '../../../styled-system/css/index.js';
import type { SpectrumPayload } from '../../protocol.ts';
import { art } from './art.ts';
import { BRAND, FEATURES } from './data.ts';
import * as s from './styles.ts';

// Container queries on the page width (literal here so Panda can extract them).
const CQ_SM = '@container home (min-width: 30rem)';
const CQ_MD = '@container home (min-width: 44rem)';
const CQ_LG = '@container home (min-width: 64rem)';

const hero = css({
  display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '10', alignItems: 'center',
  [CQ_LG]: { gridTemplateColumns: 'minmax(0, 1.05fr) minmax(0, 1fr)', gap: '12' },
});
const copy = css({ display: 'flex', flexDirection: 'column', gap: '6', alignItems: 'start' });
const brandCard = css({ position: 'relative' });
const heroImage = css({ borderRadius: 'lg', overflow: 'hidden', width: 'full' });
const floating = css({ position: 'relative', zIndex: '1', color: 'fg', [CQ_SM]: { marginInlineStart: '[20%]', marginBlockStart: '-12' } });
const onSolidMuted = css({ textStyle: 'body-sm' });
const onSolidKicker = css({ textStyle: 'group-kicker' });
const trust = css({ display: 'flex', alignItems: 'center', gap: '3' });
const faces = css({ display: 'flex', '& > ui-avatar + ui-avatar': { marginInlineStart: '-1.5' }, '& > ui-avatar': { boxShadow: '[0 0 0 2px var(--colors-bg)]' } });
const features = css({
  display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 'gap.card-md',
  [CQ_MD]: { gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' },
});
const featureIcon = css({ display: 'grid', placeItems: 'center', width: '10', height: '10', borderRadius: 'lg', fontSize: 'xl' });
const badgeLink = css({ alignSelf: 'start' });

export function Landing({ spectrum }: { spectrum?: SpectrumPayload }) {
  return (
    <>
      <div className={hero}>
        <div className={copy}>
          <ui-tag className={cx(s.tone.primary, badgeLink)}><i slot="leading" name="sparkle" />New<span slot="suffix">Autumn planner is live</span></ui-tag>
          <h1 className={s.display}>Plan the season. Ship it on time.</h1>
          <p className={s.bodyLarge}>{BRAND} keeps your collections, launches and numbers in one calm workspace, so the whole team sees the same plan.</p>
          <ui-container preset="group">
            <ui-button variant="primary">Start free trial<i slot="trailing" name="arrow-right" /></ui-button>
            <ui-button><i slot="leading" name="play" />Watch the tour<span slot="suffix">2 min</span></ui-button>
          </ui-container>
          <div className={trust}>
            <span className={faces} aria-hidden="true">
              {['ML', 'TH', 'AT', 'PN'].map((n, i) => <ui-avatar key={n} className={s.tone[s.AVATAR_TONES[i]]}>{n}</ui-avatar>)}
            </span>
            <span className={s.caption}>Used by 4,000 small brands · 4.8 rating</span>
          </div>
        </div>
        <ui-container preset="card" padding="xl" surface="solid" className={brandCard}><ui-section>
          <span className={onSolidKicker}>Autumn / Winter 26</span>
          <ui-image src={art(spectrum, 'hills', 'primary', 'secondary')} alt="Hills at first light" ratio="landscape" className={heroImage} />
          <ui-container preset="card" padding="sm" surface="raised" className={floating}><ui-section>
            <div className={s.spread}>
              <div className={s.stack1}>
                <span className={s.strong}>Next drop · Field collection</span>
                <span className={s.caption}>Ships Nov 14 · 148 of 240 items ready</span>
              </div>
              <ui-badge className={s.tone.success}>On track</ui-badge>
            </div>
            <ui-progress label="Collection readiness" value={62} />
          </ui-section></ui-container>
          <span className={onSolidMuted}>Photography: Sarek, Sweden</span>
        </ui-section></ui-container>
      </div>
      <div className={features}>
        {FEATURES.map((f, i) => (
          <ui-container preset="card" key={f.title} padding="lg"><ui-section>
            <span className={cx(featureIcon, s.tone[(['primary', 'secondary', 'info'] as const)[i]])}><i name={f.icon} /></span>
            <div className={s.stack1}>
              <h2 className={s.h3}>{f.title}</h2>
              <p className={s.muted}>{f.text}</p>
            </div>
          </ui-section></ui-container>
        ))}
      </div>
    </>
  );
}
