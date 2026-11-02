// Slot recipe for <ui-meter> and the React Meter (resolveMeter): the progress track (4u, --track,
// --track-r; fill = --ui-ratio × width) under a label | value row in the control voice, 1.5u above
// the track, the value at the end in tabular figures. --ui-ratio is set by script.
import { defineSlotRecipe } from '@pandacss/dev';
import { FORCED, FORCED_EDGE, FORCED_ON, PAINT, UI_FONT, t } from '../recipe-parts.ts';

export const meter = defineSlotRecipe({
  className: 'ui-meter',
  description: 'Meter (ui-meter, React Meter, Base UI Meter): label, value, track and indicator.',
  slots: ['root', 'label', 'value', 'track', 'indicator'],
  base: {
    root: {
      display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) auto', columnGap: '2', rowGap: '1.5', alignItems: 'baseline',
      minWidth: 'calc(24 * var(--u))', fontFamily: UI_FONT, fontSize: 'var(--font)', lineHeight: 'var(--line)', color: 'fg',
      // Without a label the value keeps the end column; without both the track stands alone.
      '&:has(> [data-part=label][hidden]) > [data-part=value]': { gridColumn: '2' },
    },
    label: { gridColumn: '1', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    value: { gridColumn: '2', justifySelf: 'end', color: 'fg.muted', fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' },
    track: {
      gridColumn: '1 / -1', display: 'block', height: 'var(--track)', borderRadius: 'var(--track-r)', overflow: 'hidden', bg: 'bg.muted',
      [FORCED]: FORCED_EDGE,
    },
    indicator: {
      display: 'block', height: '100%', width: 'calc(var(--ui-ratio, 0) * 100%)', borderRadius: 'var(--track-r)', bg: 'primary.solid',
      transition: `${t('reveal', 'width')}, ${t('feedback', ...PAINT)}`,
      [FORCED]: FORCED_ON,
    },
  },
});
