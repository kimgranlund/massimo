// Article: kicker, heading, body-large dek and body copy at a readable measure, a byline, a figure
// with a caption, a pull quote in the primary hue and an aside card.
import { css, cx } from '../../../styled-system/css/index.js';
import type { SpectrumPayload } from '../../protocol.ts';
import { art } from './art.ts';
import * as s from './styles.ts';

// Container queries on the page width (literal here so Panda can extract them).
const CQ_MD = '@container home (min-width: 44rem)';
const CQ_LG = '@container home (min-width: 64rem)';

const layout = css({
  display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: '10', alignItems: 'start',
  [CQ_LG]: { gridTemplateColumns: 'minmax(0, 1fr) 18rem', gap: '16' },
});
const article = css({ display: 'flex', flexDirection: 'column', gap: '6', maxWidth: '[44rem]', '& > p': { textStyle: 'body', maxWidth: 'prose' } });
// Narrow pages step the title and the quote down one role.
const title = css({ textStyle: 'heading-2', [CQ_MD]: { textStyle: 'heading-1' } });
const head = css({ display: 'flex', flexDirection: 'column', gap: '4' });
const byline = css({ display: 'flex', alignItems: 'center', gap: '3', flexWrap: 'wrap', paddingBlock: '4', borderBlockWidth: 'thin', borderColor: 'border' });
const figure = css({ display: 'flex', flexDirection: 'column', gap: '2' });
const image = css({ borderRadius: 'xl', overflow: 'hidden', width: 'full' });
const quote = css({
  display: 'flex', flexDirection: 'column', gap: '3', paddingInlineStart: '6', marginBlock: '2',
  borderInlineStartWidth: 'thick', borderColor: 'primary.solid',
  '& p': { textStyle: 'heading-3', color: 'primary.fg', [CQ_MD]: { textStyle: 'heading-2' } },
});
const dropcap = css({ '&::first-letter': { float: 'left', textStyle: 'display', color: 'primary.fg', marginInlineEnd: '2', marginBlockStart: '1' } });
const aside = css({ position: 'sticky', top: '6' });
const listItem = css({ display: 'flex', gap: '3', alignItems: 'start', paddingBlock: '2', '&:not(:last-child)': { borderBottomWidth: 'thin', borderColor: 'border' } });
const index = css({ textStyle: 'heading-3', color: 'fg.subtle', minWidth: '6' });

const MORE = [
  ['Layering, explained in three shirts', 'Guide · 5 min'],
  ['What a wet week taught us about seams', 'Field test · 8 min'],
  ['The case for one good pack', 'Opinion · 4 min'],
];

export function Article({ spectrum }: { spectrum?: SpectrumPayload }) {
  return (
    <div className={layout}>
      <article className={article}>
        <header className={head}>
          <span className={s.kicker}>Field report</span>
          <h2 className={title}>Ten days on the Kungsleden, carrying only what we make</h2>
          <p className={s.bodyLarge}>Four hundred kilometres of Swedish fell, a rain shell we almost left at home and the one question every trip answers: what did you never take out of the bag?</p>
          <div className={byline}>
            <span className={cx(s.avatar, s.tone.secondary)} aria-hidden="true">EL</span>
            <div className={cx(s.stack1, s.grow)}>
              <span className={s.strong}>Elin Lund</span>
              <span className={s.caption}>Oct 28, 2026 · 12 min read</span>
            </div>
            <ui-group>
              <ui-button aria-label="Save article"><i slot="leading" name="bookmark-simple" /></ui-button>
              <ui-button><i slot="leading" name="share-network" />Share</ui-button>
            </ui-group>
          </div>
        </header>
        <p className={dropcap}>The trail starts at Abisko with a sign, a birch wood and a weather forecast nobody believes. We walked south for ten days with two packs, one tent and a list we had argued over for a month. Everything on it was ours: jackets, base layers, the canvas sacks the food rode in.</p>
        <p>By the third morning the list had become a ranking. The merino crew had not come off. The spare fleece had not gone on. The waxed jacket, the heaviest thing either of us carried, had earned its place twice before lunch.</p>
        <figure className={figure}>
          <ui-image src={art(spectrum, 'hills', 'data3', 'secondary')} alt="Fells above the Tjäktja valley at dawn" ratio="wide" className={image} />
          <figcaption className={s.caption}>Above the Tjäktja valley on day four. The pass sits at 1,140 m; the wind did not stop for the photograph.</figcaption>
        </figure>
        <h3 className={s.h3}>What we never unpacked</h3>
        <p>Three things went the whole way untouched: a second pair of gloves, a repair kit we were glad of anyway, and a book. The gloves are the honest lesson. One good pair, kept dry, beats two pairs kept damp.</p>
        <blockquote className={quote}>
          <p>“Pack for the weather you will get, not the weather you fear.”</p>
          <cite className={s.caption}>Hut warden, Sälka</cite>
        </blockquote>
        <p>We came home with a shorter list and a longer one: what to cut, and what to make next. The second list is the reason this journal exists.</p>
      </article>
      <aside className={aside}>
        <ui-card padding="md">
          <span className={s.groupKicker}>Read next</span>
          <div>
            {MORE.map(([t, m], i) => (
              <div key={t} className={listItem}>
                <span className={index} data-numeric>{String(i + 1).padStart(2, '0')}</span>
                <div className={s.stack1}><span className={s.strong}>{t}</span><span className={s.caption}>{m}</span></div>
              </div>
            ))}
          </div>
          <ui-card padding="sm" className={s.tone.primary}>
            <span className={s.strong}>The Fieldnote letter</span>
            <span className={s.caption}>One trip, one lesson, every other Sunday.</span>
            <ui-input label="Email" hide-label placeholder="you@example.com"><i slot="leading" name="envelope-simple" /></ui-input>
            <ui-button variant="primary">Subscribe</ui-button>
          </ui-card>
        </ui-card>
      </aside>
    </div>
  );
}
