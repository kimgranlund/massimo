// Motion: which properties animate, for which intent (tokens/motion INTENTS: feedback → quick,
// toggle → snappy, reveal → smooth, emphasis → bouncy; durations.<intent> and easings.<intent> are
// a pair, and carry --ui-motion-scale and --ui-motion-bounce). Springs are SwiftUI-style, sampled into linear(); reduced motion
// collapses every duration in reset.ts. Only paint and transform properties animate, never lengths
// that move layout, except the range/progress fill and the swiper dot, which own their box.
import { defineGlobalStyles } from '@pandacss/dev';
import type { IntentName } from '../tokens/motion/index.ts';

const t = (intent: IntentName, ...props: string[]) =>
  props.map((p) => `${p} {durations.${intent}} {easings.${intent}}`).join(', ');


export const motion = defineGlobalStyles({
  // Swiper: the active dot stretches; hover controls fade.
  'ui-swiper [data-part=dot]::before': { transition: t('toggle', 'width', 'opacity') },
  'ui-swiper[hover-controls] :is([data-part=paddle], [data-part=dots])': { transition: t('reveal', 'opacity') },
});
