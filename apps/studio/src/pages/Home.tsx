// Home: realistic fake-content layouts built only from the kit, so tuning a token in the jig panel
// shows its effect on believable product UI. Every section is a full-bleed region (an area) holding
// cards (containers) that hold groups and collections (wrappers); each opens with a marker naming
// the system ideas to watch. Content lives in ./home/data.ts; images are painted from the color ramps.
import '@massimo/ui-kit/components/button/element';
import '@massimo/ui-kit/components/input/element';
import '@massimo/ui-kit/components/listbox/element';
import '@massimo/ui-kit/components/select/element';
import '@massimo/ui-kit/components/btg/element';
import '@massimo/ui-kit/components/choice/element';
import '@massimo/ui-kit/components/range/element';
import '@massimo/ui-kit/components/swiper/element';
import '@massimo/ui-kit/components/image/element';
import '@massimo/ui-kit/components/avatar/element';
import '@massimo/ui-kit/components/accordion/element';
import { cx } from '../../styled-system/css/index.js';
import type { PageProps } from './types.ts';
import { Article } from './home/Article.tsx';
import { Dashboard } from './home/Dashboard.tsx';
import { Landing } from './home/Landing.tsx';
import { Media } from './home/Media.tsx';
import { Settings } from './home/Settings.tsx';
import * as s from './home/styles.ts';

type Tint = 'base' | 'subtle' | 'muted';
const TINT: Record<Tint, string> = { base: s.regionBase, subtle: s.regionSubtle, muted: s.regionMuted };

function Region({ id, name, note, tint = 'base', children }: { id: string; name: string; note: string; tint?: Tint; children: React.ReactNode }) {
  return (
    <ui-container preset="region" id={id} aria-label={name} className={TINT[tint]}>
      <div className={s.column}>
        <p className={s.marker}><span className={s.markerName}>{name}</span><span className={s.markerNote}>{note}</span></p>
        {children}
      </div>
    </ui-container>
  );
}

export function HomePage({ spectrum }: PageProps) {
  return (
    <main className={cx(s.root)} aria-label="Home">
      <Region id="home-landing" name="Landing" note="display · body-lg · primary solid as material · card xl › raised card sm · primary and neutral buttons">
        <Landing spectrum={spectrum} />
      </Region>
      <Region id="home-dashboard" name="Dashboard" tint="muted" note="numeric voice · feedback badges · data 1–6 · card › collection › group · segmented and chips">
        <Dashboard />
      </Region>
      <Region id="home-settings" name="Settings" tint="subtle" note="panel › cards › fields · prefix, suffix, leading · invalid state · choices, segmented, range">
        <Settings />
      </Region>
      <Region id="home-article" name="Article" note="kicker · heading-1 · body-lg dek · body at the prose measure · pull quote · figure caption">
        <Article spectrum={spectrum} />
      </Region>
      <Region id="home-media" name="Media" tint="muted" note="swiper · card sm and xs · image ratios · filter chips · tags">
        <Media spectrum={spectrum} />
      </Region>
    </main>
  );
}
