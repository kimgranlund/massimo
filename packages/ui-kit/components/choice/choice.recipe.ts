// Slot recipes for <ui-checkbox>, <ui-radio>, <ui-switch> and the React Checkbox, Radio, Switch.
// A 6u row: the 5u indicator (Base UI Checkbox.Indicator / Radio.Indicator; the switch's is its 9u wide
// track, holding the Switch.Thumb) sits in the 6u leading slot; the label starts 1u after
// it (resolveChoice). State is the data-* contract on the host (data-checked, data-unchecked,
// data-indeterminate, data-disabled, data-invalid, data-required, …), set by the web component and
// by the React renderer from its native input: the conditions (_checked, _disabled, …) key on it.
import { defineSlotRecipe } from '@pandacss/dev';
import { CRITICAL_TINT, FORCED, FORCED_EDGE, FORCED_ON, PAINT, UI_FONT, constructionPattern, t } from '../recipe-parts.ts';

const SLOTS = ['root', 'leading', 'indicator', 'prefix', 'contents', 'suffix'] as const;
const BOX = '& [data-part=indicator]';
// The label starts 1u after the indicator slot and has no padding at the end.
const PATTERN = constructionPattern({ slot: 'var(--u)', bare: '0px', text: { paddingBlock: 'calc(0.75 * var(--u))' }, iconSlots: false });
const REQUIRED = '&[data-required]::after';

/** "On" box: the primary solid; its indicator uses the contrast color. */
const on = (extra: Record<string, any> = {}) => ({
  [BOX]: { bg: 'primary.solid', borderColor: 'primary.solid', [FORCED]: FORCED_ON },
  _enabled: { '&:is(:hover, :active)': { [BOX]: { bg: 'primary.solidHover', borderColor: 'primary.solidHover' } } },
  ...extra,
});

function choice(kind: 'checkbox' | 'radio' | 'switch', box: Record<string, any>, root: Record<string, any>, extra: Record<string, any> = {}) {
  return defineSlotRecipe({
    className: `ui-${kind}`,
    description: `${kind[0].toUpperCase()}${kind.slice(1)} (ui-${kind}, React ${kind[0].toUpperCase()}${kind.slice(1)}).`,
    slots: [...SLOTS, ...Object.keys(extra)],
    base: {
      root: {
        display: 'inline-flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none', verticalAlign: 'middle',
        minHeight: 'var(--slot)', fontFamily: UI_FONT, fontSize: 'var(--font)', lineHeight: 'var(--leading)',
        _disabled: { opacity: 0.5, cursor: 'not-allowed' },
        _enabled: { _hover: { [BOX]: { bg: 'bg.mutedHover' } }, '&:active': { [BOX]: { bg: 'bg.mutedActive' } } },
        // Invalid (data-invalid at low specificity): hover and the checked fill win over it.
        '&:where([data-invalid]) [data-part=indicator]': { borderColor: 'critical.solid', bg: CRITICAL_TINT(20) },
        // React: the native input carries state, invisible but interactive.
        '&:has(> input)': { position: 'relative' },
        '& > input': { position: 'absolute', opacity: 0, width: '1px', height: '1px', margin: 0, pointerEvents: 'none' },
        [FORCED]: { _disabled: { color: 'GrayText' } },
        ...PATTERN,
        ...root,
      },
      leading: { display: 'grid', placeItems: 'center', minWidth: 'var(--slot)', minHeight: 'var(--slot)', flexShrink: 0 },
      indicator: {
        display: 'grid', placeItems: 'center', width: 'calc(5 * var(--u))', height: 'calc(5 * var(--u))', borderWidth: 'var(--b)',
        borderColor: 'border.strong', bg: 'bg.muted', color: 'fg.onSolid',
        transition: t('feedback', ...PAINT),
        [FORCED]: FORCED_EDGE,
        ...box,
      },
      ...extra,
    },
  });
}

/** Required checkbox and switch: a marker after their own text. */
const requiredMarker = { [REQUIRED]: { content: '" *"', color: 'critical.fg' } };

export const checkbox = choice('checkbox', {
  borderRadius: 'calc(var(--u) * var(--ui-radius-scale))',
  '& > i': { display: 'none', width: 'calc(4 * var(--u))', height: 'calc(4 * var(--u))' },
}, {
  ...requiredMarker,
  _checked: on({ [`${BOX} > i[data-mark=checked]`]: { display: 'inline-flex' } }),
  _indeterminate: on({ [`${BOX} > i[data-mark=mixed]`]: { display: 'inline-flex' } }),
});

export const radio = choice('radio', {
  borderRadius: '50%',
  _after: {
    content: '""', width: 'calc(2 * var(--u))', height: 'calc(2 * var(--u))', borderRadius: '50%',
    scale: 0.4, transition: t('toggle', 'background-color', 'scale'),
  },
}, {
  _checked: on({ [`${BOX}::after`]: { bg: 'fg.onSolid', scale: 1, [FORCED]: { forcedColorAdjust: 'none', bg: 'HighlightText' } } }),
});

const switchRecipe = choice('switch', {
  width: 'calc(9 * var(--u))', borderRadius: 'calc(2.5 * var(--u))', justifyItems: 'start', paddingInline: 'calc(0.5 * var(--u) - var(--b))',
}, {
  ...requiredMarker,
  _checked: on({ [`${BOX} > [data-part=thumb]`]: { translate: 'calc(4 * var(--u)) 0' } }),
}, {
  // Base UI Switch.Thumb.
  thumb: {
    display: 'block', width: 'calc(4 * var(--u))', height: 'calc(4 * var(--u))', borderRadius: '50%', bg: 'white', boxShadow: 'sm',
    transition: `${t('toggle', 'translate')}, ${t('feedback', 'background-color')}`,
    [FORCED]: { forcedColorAdjust: 'none', bg: 'CanvasText' },
  },
});
// `switch` is a reserved word: exported by name for the manifest, registered as switchRecipe.
export { switchRecipe as switch, switchRecipe };
