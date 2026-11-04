// Media: a featured swiper in a card, filter chips, and a grid of small cards (padding xs) with
// images, captions and tags; images are painted from the data and brand ramps.
import { useState } from 'react';
import { css, cx } from '../../../styled-system/css/index.js';
import type { SpectrumPayload } from '../../protocol.ts';
import { art } from './art.ts';
import { FEATURED, SHOTS } from './data.ts';
import * as s from './styles.ts';

// Container queries on the page width (literal here so Panda can extract them).
const CQ_SM = '@container home (min-width: 30rem)';
const CQ_MD = '@container home (min-width: 44rem)';

const head = css({ display: 'flex', flexWrap: 'wrap', alignItems: 'end', justifyContent: 'space-between', gap: '4' });
// Narrow pages swipe by touch, so the paddles step aside for the caption.
const swiper = css({
  borderRadius: 'lg', overflow: 'hidden', '& [data-part=dots]': { '--colors-fg': 'var(--colors-white)' },
  '& > [data-part=paddle]': { visibility: 'hidden', [CQ_MD]: { visibility: 'visible' } },
});
// Slides are 4:3 on narrow pages (room for the caption) and 16:9 from medium up.
const slideImage = css({ [CQ_MD]: { aspectRatio: '[16 / 9]' } });
const slide = css({ position: 'relative', display: 'block' });
// Photos look the same in both schemes, so their caption scrim does too: black to transparent with
// white text (the kit's black and white tokens), and the dots take the same white.
const slideCaption = css({
  position: 'absolute', insetInline: '0', bottom: '0', display: 'flex', flexDirection: 'column', gap: '1',
  padding: '4', paddingBottom: '10', color: 'white', [CQ_MD]: { padding: '6', paddingBottom: '10' },
  backgroundImage: '[linear-gradient(to top, color-mix(in oklch, var(--colors-black) 70%, transparent), transparent)]',
  '& h3': { textStyle: 'heading-3', [CQ_MD]: { textStyle: 'heading-2' } },
});
const badgeStart = css({ alignSelf: 'start' });
const slideMeta = css({ textStyle: 'caption', opacity: '0.85' });
const grid = css({
  display: 'grid', gap: 'gap.card-md', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
  [CQ_MD]: { gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' },
});
const shotText = css({ display: 'flex', flexDirection: 'column', gap: '0.5', paddingInline: '1', paddingBlockEnd: '1' });
const shotHead = css({ display: 'flex', alignItems: 'start', justifyContent: 'space-between', gap: '2' });
const ellipsis = css({ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' });
const tagHide = css({ display: 'none', [CQ_SM]: { display: 'inline-flex' } });

const TAGS = ['All', ...new Set(SHOTS.map((x) => x.tag))];

export function Media({ spectrum }: { spectrum?: SpectrumPayload }) {
  const [tag, setTag] = useState('All');
  const shots = SHOTS.filter((x) => tag === 'All' || x.tag === tag);
  return (
    <>
      <div className={head}>
        <div className={s.stack1}>
          <span className={s.kicker}>Journal</span>
          <h2 className={s.h1}>Stories from the field</h2>
        </div>
        <ui-button>Browse all<i slot="trailing" name="arrow-right" /></ui-button>
      </div>
      <ui-container preset="card" padding="sm">
        <ui-swiper label="Featured stories" className={swiper}>
          {FEATURED.map((f) => (
            <div key={f.title} className={slide}>
              <ui-image src={art(spectrum, f.scene, f.role, f.accent)} alt="" ratio="landscape" className={slideImage} />
              <div className={slideCaption}>
                <ui-badge className={cx(s.tone.primary, badgeStart)}>{f.tag}</ui-badge>
                <h3>{f.title}</h3>
                <span className={slideMeta}>{f.place}</span>
              </div>
            </div>
          ))}
        </ui-swiper>
      </ui-container>
      <div className={s.stack4}>
        <div className={s.spread}>
          <h3 className={s.h3}>Photo library</h3>
          <ui-container preset="group">
            {TAGS.map((t) => <ui-chip key={t} selectable selected={tag === t || undefined} onClick={() => setTag(t)}>{t}</ui-chip>)}
          </ui-container>
        </div>
        <div className={grid}>
          {shots.map((x) => (
            <ui-container preset="card" key={x.title} padding="xs">
              <ui-image src={art(spectrum, x.scene, x.role, x.accent)} alt={x.title} ratio="landscape" className={s.media} />
              <div className={shotText}>
                <div className={shotHead}>
                  <span className={cx(s.strong, ellipsis)}>{x.title}</span>
                  <ui-tag className={tagHide}>{x.tag}</ui-tag>
                </div>
                <span className={cx(s.caption, ellipsis)}><i name="map-pin" /> {x.place}</span>
              </div>
            </ui-container>
          ))}
        </div>
      </div>
    </>
  );
}
