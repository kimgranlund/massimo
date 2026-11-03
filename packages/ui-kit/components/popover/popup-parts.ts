// Shared style pieces of the anchored popups (popover, tooltip, preview card; the navigation menu's
// popup), on the floating-layer pieces of recipe-parts.ts. Lengths are u, B and the container
// ladder's theme parameters (resolvePopup, resolveNavigationMenu); colours are Spectrum roles.
//   host (display: contents)  ›  trigger  ·  positioner [popover] › popup · arrow
// - positioner: fixed in the top layer, placed by CSS anchor positioning on the trigger (one rule
//   per side and alignment, data-placement, the side chosen by script; the anchor name is the per-instance
//   --ui-anchor the element or React root sets) or by the script positioner; no box of its own;
//   at least as wide as the trigger, no wider or taller than the space beside it (Base UI's
//   positioner variables); displays for the reveal duration after closing so the popup can fade.
// - popup: the surface; fills the positioner, scrolls when it runs out of room, enters and leaves
//   on the reveal intent (opacity and scale from the edge facing the trigger).
// - arrow: a 2u-wide triangle spanning the 1u gap, centered on the trigger (--arrow-offset, set by
//   dom/popup.ts placeArrow), in the popup's edge colour with its fill inset by B.
import { ANCHORED, FORCED, FORCED_EDGE, UI_FONT, anchoredPopup, floatingOpen, mergeStyles, sideOrigins, t } from '../recipe-parts.ts';

type Style = Record<string, any>;
const SIDES = ['bottom', 'top', 'right', 'left'] as const;
const ALIGNS = ['start', 'center', 'end'] as const;

/** Anchor positioning by the preferred side and alignment (data-placement="<side>-<align>"). */
const placements: Style = Object.fromEntries(SIDES.flatMap((side) => ALIGNS.map((align) => [
  `&[data-placement=${side}-${align}]`,
  // The element chooses the side (dom/popup.ts chooseSide) and names it here; no CSS fallbacks.
  { ...anchoredPopup({ anchor: 'var(--ui-anchor)', side, align }), positionTryFallbacks: 'none', positionTryOrder: 'normal' },
])));

/** The positioner: no box; sized and placed from the positioner variables. `maxWidth` in u. */
export function popupPositioner(maxWidth: number): Style {
  return {
    position: 'fixed', inset: 'auto', margin: 0, padding: 0, border: 0, bg: 'transparent', color: 'fg', overflow: 'visible',
    flexDirection: 'column', width: 'max-content',
    minWidth: 'var(--anchor-width)',
    maxWidth: `min(var(--available-width), calc(${maxWidth} * var(--u)))`,
    maxHeight: 'var(--available-height)',
    // The gap attribute is on the host (--ui-gap does not inherit): the popup takes it.
    '--ui-gap': 'inherit',
    '--transform-origin': 'top center',
    ...sideOrigins,
    transition: 'display {durations.reveal} allow-discrete, overlay {durations.reveal} allow-discrete',
    '&:popover-open': { display: 'flex' },
    '&[data-instant]': { transition: 'none' },
    [ANCHORED]: placements,
  };
}

/** The popup surface: the overlay fill and edge; enters on the reveal intent. */
export const popupSurface: Style = {
  display: 'flex', flexDirection: 'column', flex: '1 1 auto', minHeight: 0, overflowY: 'auto', overscrollBehavior: 'contain',
  position: 'relative', boxSizing: 'border-box',
  bg: 'bg.overlay', color: 'fg', borderStyle: 'solid', borderWidth: 'var(--b)', borderColor: 'border', boxShadow: 'md',
  '--ui-gap': 'inherit',
  transformOrigin: 'var(--transform-origin)', opacity: 0, scale: 0.97,
  transition: t('reveal', 'opacity', 'scale'),
  '&[data-open]': floatingOpen,
  '&[data-instant]': { transition: 'none' },
  [FORCED]: FORCED_EDGE,
};

/** A card-level popup (popover: card-sm, preview card: card-md): padding and radius from the ladder, a gap. */
export function cardPopup(level: 'card-sm' | 'card-md', gapLevel: 'group' | 'collection'): Style {
  return mergeStyles(popupSurface, {
    padding: `max(0px, calc(var(--ui-pad-${level}) * var(--u) - var(--b)))`,
    borderRadius: `calc(var(--ui-pad-${level}) * var(--u) * min(1, var(--ui-radius-scale)))`,
    gap: `calc(var(--ui-gap, var(--ui-gap-${gapLevel})) * var(--u))`,
    fontFamily: UI_FONT,
  });
}

/** Title and description inside a card popup (Base UI Popover.Title, Popover.Description). */
export const popupTitle: Style = { textStyle: 'title', color: 'fg', margin: 0 };
export const popupDescription: Style = { textStyle: 'body', color: 'fg.muted', margin: 0 };

/** The arrow: a triangle `fill` on `edge`, 2u wide, its tip 1u from the popup on the trigger's side. */
export function popupArrow(fill: string, edge: string): Style {
  const x = 'calc(var(--arrow-offset, 50%) - var(--u))';
  const y = 'calc(var(--arrow-offset, 50%) - 0.5 * (var(--u) + var(--b)))';
  return {
    position: 'absolute', width: 'calc(2 * var(--u))', height: 'calc(var(--u) + var(--b))', pointerEvents: 'none',
    bg: edge, clipPath: 'polygon(0 100%, 50% 0, 100% 100%)',
    // The fill, B (at least a hairline, so the arrow reads on a borderless popup) in from the
    // slopes, covering the popup's edge under the arrow's base.
    '&::after': { content: '""', position: 'absolute', inset: 'max(1px, var(--b)) 0 0 0', bg: fill, clipPath: 'polygon(0 100%, 50% 0, 100% 100%)' },
    // The popup below the trigger: the arrow on its top edge, pointing up; the others turned.
    '&[data-side=bottom]': { left: x, top: 'calc(-1 * var(--u))' },
    '&[data-side=top]': { left: x, bottom: 'calc(-1 * var(--u))', rotate: '180deg' },
    '&[data-side=right]': { top: y, left: 'calc(-1.5 * var(--u) + 0.5 * var(--b))', rotate: '-90deg' },
    '&[data-side=left]': { top: y, right: 'calc(-1.5 * var(--u) + 0.5 * var(--b))', rotate: '90deg' },
    '&:not([data-side])': { display: 'none' },
    [FORCED]: { display: 'none' },
  };
}

/** The host: no box, so the trigger lays out where the host is written. */
export const popupRoot: Style = { display: 'contents' };
