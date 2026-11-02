// Slot recipe for <ui-avatar> and the React Avatar (resolveAvatar): a round n·u square (--avatar,
// --avatar-r, styles/geometry.ts) holding the image and the fallback in one grid cell. The fallback
// shows initials at the control font × k (--avatar-font) or an icon at the md icon × k
// (--avatar-icon); the image covers the frame once it has loaded.
import { defineSlotRecipe } from '@pandacss/dev';
import { FORCED, FORCED_EDGE, UI_FONT, t } from '../recipe-parts.ts';

export const avatar = defineSlotRecipe({
  className: 'ui-avatar',
  description: 'Avatar (ui-avatar, React Avatar, Base UI Avatar): root, image and fallback.',
  slots: ['root', 'image', 'fallback'],
  base: {
    root: {
      display: 'inline-grid', placeItems: 'center', flexShrink: 0, verticalAlign: 'middle', overflow: 'hidden',
      width: 'var(--avatar)', height: 'var(--avatar)', borderRadius: 'var(--avatar-r)',
      bg: 'bg.muted', color: 'fg.muted', fontFamily: UI_FONT, fontSize: 'var(--avatar-font)', lineHeight: 'tight', fontWeight: 'semibold',
      userSelect: 'none', whiteSpace: 'nowrap',
      [FORCED]: FORCED_EDGE,
    },
    image: {
      gridArea: '1 / 1', display: 'block', width: '100%', height: '100%', objectFit: 'cover',
      transition: t('reveal', 'opacity'),
      '@starting-style': { opacity: 0 },
    },
    fallback: {
      gridArea: '1 / 1', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%',
      '& > :is(i, svg, img)': { width: 'var(--avatar-icon)', height: 'var(--avatar-icon)', flexShrink: 0 },
    },
  },
});
