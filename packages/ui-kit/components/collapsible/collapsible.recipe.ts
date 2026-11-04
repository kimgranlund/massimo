// Slot recipe for <ui-collapsible> and the React Collapsible (Base UI Collapsible: Root, Trigger,
// Panel). The trigger is a full-width control row (resolveDisclosure): 8u, padding u − B, the
// construction pattern, a trailing caret (icon size sm) that turns when the panel is open. The panel
// opens and closes by height on the reveal intent, in CSS only: `interpolate-size: allow-keywords`
// lets height transition between 0 and auto, and `display` transitions discretely, so the closing
// panel stays painted until it has collapsed (browsers without interpolate-size open at once). Its
// text starts at the trigger's label edge (3u) and ends 2u below its content.
import { defineSlotRecipe } from '@pandacss/dev';
import { FORCED, FORCED_EDGE, PAINT, UI_FONT, constructionPattern, t } from '../recipe-parts.ts';

const PATTERN = constructionPattern({
  slot: 'var(--u)', bare: 'calc(2 * var(--u))',
  text: { display: 'flex', alignItems: 'center', minHeight: 'var(--slot)', paddingBlock: 'var(--line-pad)', lineHeight: 'var(--line)' },
});

/** Trigger: a control row with a caret; shared with the accordion's items (they are collapsibles). */
export const disclosureTrigger = {
  display: 'flex', alignItems: 'center', width: '100%', textAlign: 'start',
  minHeight: 'var(--h)', padding: 'var(--pad)', borderWidth: 'var(--b)', borderColor: 'transparent', borderRadius: 'var(--radius)',
  bg: 'transparent', color: 'fg', fontFamily: UI_FONT, fontSize: 'var(--font)', fontWeight: 'medium', lineHeight: 'var(--line)',
  cursor: 'default', userSelect: 'none',
  ...PATTERN,
  // The label takes the row; the caret sits at the end.
  '& > [data-part=contents]': { flex: '1', minWidth: 0 },
  '& > [data-part=trailing]': { color: 'fg.muted' },
  '& > [data-part=trailing] > i[name^="caret-"]': { transition: t('toggle', 'rotate') },
  '&[data-panel-open] > [data-part=trailing] > i[name^="caret-"]': { rotate: '180deg' },
  transition: t('feedback', ...PAINT),
  _enabled: { _hover: { bg: 'bg.control' }, '&:active': { bg: 'bg.controlHover' } },
  _disabled: { opacity: 0.5, cursor: 'not-allowed' },
  [FORCED]: { _disabled: { color: 'GrayText' }, '&:focus-visible': FORCED_EDGE },
};

/** Panel: height 0 ↔ auto on the reveal intent; the content inset follows the trigger's label. */
export const disclosurePanel = {
  overflow: 'clip', interpolateSize: 'allow-keywords', height: 'auto',
  // Lines up with the trigger label: the control inset (density) + the label's 2u bare edge.
  paddingInline: 'calc(var(--di) * var(--u) + 2 * var(--u))', paddingBlockEnd: 'calc(2 * var(--u))',
  transition: `${t('reveal', 'height', 'padding-block-end')}, display {durations.reveal} allow-discrete, content-visibility {durations.reveal} allow-discrete`,
  // Closed (hidden): collapsed; opening starts from collapsed.
  '&[data-closed]': { height: 0, paddingBlockEnd: 0 },
  '&[data-open]': { '@starting-style': { height: 0, paddingBlockEnd: 0 } },
};

export const collapsible = defineSlotRecipe({
  className: 'ui-collapsible',
  description: 'Show and hide one panel (ui-collapsible, React Collapsible): a trigger row and a height-animated panel.',
  slots: ['root', 'trigger', 'leading', 'prefix', 'contents', 'suffix', 'trailing', 'panel'],
  base: {
    root: { display: 'block', _disabled: { cursor: 'not-allowed' } },
    trigger: disclosureTrigger,
    panel: disclosurePanel,
  },
});
