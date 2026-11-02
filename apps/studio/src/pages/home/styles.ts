// Shared styles for the Home page. Every length is a u token or a container token (pad, gap,
// inset per level), every color a role, every text a type role; one-offs are [..] escapes.
import { css } from '../../../styled-system/css/index.js';

// Layout responds to the page's own width (the jig panel takes part of the viewport): the root is
// the `home` container, and each file declares its queries as literals (30, 44, 64rem) so Panda
// can extract them.
const CQ_MD = '@container home (min-width: 44rem)';

export const root = css({ containerType: 'inline-size', containerName: 'home', display: 'flex', flexDirection: 'column', bg: 'bg', color: 'fg' });
/** Inside a full-bleed region: the content column, centered at the page width. */
export const column = css({ display: 'flex', flexDirection: 'column', gap: 'gap.region', width: 'full', maxWidth: '[72rem]', marginInline: 'auto' });
export const regionBase = css({ bg: 'bg' });
export const regionSubtle = css({ bg: 'bg.subtle' });
export const regionMuted = css({ bg: 'bg.muted' });

// The marker above each composition: what to watch while tuning.
export const marker = css({
  display: 'flex', flexWrap: 'wrap', alignItems: 'baseline', columnGap: '3', rowGap: '1',
  paddingBottom: '2', borderBottomWidth: 'thin', borderColor: 'border',
});
export const markerName = css({ textStyle: 'group-kicker', color: 'fg.muted' });
export const markerNote = css({ textStyle: 'caption', color: 'fg.muted' });

// Type roles.
export const display = css({ textStyle: 'heading-1', [CQ_MD]: { textStyle: 'display' } });
export const h1 = css({ textStyle: 'heading-1' });
export const h2 = css({ textStyle: 'heading-2' });
export const h3 = css({ textStyle: 'heading-3' });
export const kicker = css({ textStyle: 'section-kicker', color: 'primary.fg' });
export const groupKicker = css({ textStyle: 'group-kicker', color: 'fg.muted' });
export const bodyLarge = css({ textStyle: 'body-large', color: 'fg.muted', maxWidth: 'prose' });
export const body = css({ textStyle: 'body' });
export const muted = css({ textStyle: 'body', color: 'fg.muted' });
export const caption = css({ textStyle: 'caption', color: 'fg.muted' });
export const label = css({ textStyle: 'label' });
export const strong = css({ textStyle: 'label', fontWeight: 'semibold' });

export const stack = (gap: '1' | '2' | '3' | '4' | '6' | '8') => css({ display: 'flex', flexDirection: 'column', gap });
export const stack1 = stack('1');
export const stack2 = stack('2');
export const stack3 = stack('3');
export const stack4 = stack('4');
export const stack6 = stack('6');
export const row = css({ display: 'flex', alignItems: 'center', gap: '3', flexWrap: 'wrap' });
export const spread = css({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '3', flexWrap: 'wrap' });
export const grow = css({ flex: '1', minWidth: '0' });

// Feedback tones for badges, tags and callouts: the role's subtle fill with its text color.
export const tone = {
  success: css({ bg: 'success.subtle', color: 'success.fg' }),
  warning: css({ bg: 'warning.subtle', color: 'warning.fg' }),
  critical: css({ bg: 'critical.subtle', color: 'critical.fg' }),
  info: css({ bg: 'info.subtle', color: 'info.fg' }),
  primary: css({ bg: 'primary.subtle', color: 'primary.fg' }),
  secondary: css({ bg: 'secondary.subtle', color: 'secondary.fg' }),
  neutral: css({ bg: 'bg.muted', color: 'fg.muted' }),
} as const;
export type Tone = keyof typeof tone;

// Data series 1–6 as fills.
export const DATA_BG = [
  css({ bg: 'data.1' }), css({ bg: 'data.2' }), css({ bg: 'data.3' }),
  css({ bg: 'data.4' }), css({ bg: 'data.5' }), css({ bg: 'data.6' }),
];

// A person's initials in a round chip (combine with a tone).
export const avatar = css({
  display: 'inline-grid', placeItems: 'center', flexShrink: 0, width: '8', height: '8', borderRadius: 'full',
  textStyle: 'control-small', fontWeight: 'semibold',
});
export const avatarSm = css({ width: '6', height: '6' });

/** Images keep their own small radius inside cards (cards are not concentric with children). */
export const media = css({ borderRadius: 'md', overflow: 'hidden', width: 'full' });
export const AVATAR_TONES: Tone[] = ['primary', 'secondary', 'info', 'success', 'warning'];
