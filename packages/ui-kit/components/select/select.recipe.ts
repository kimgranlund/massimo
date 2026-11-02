// Slot recipe for <ui-select> and the React Select, in Base UI Select's anatomy: the trigger (a button
// with a value and a chevron icon in the construction pattern's contents and trailing places,
// resolveSelectTrigger), the popup and its list (display: contents, so the options lay out in the
// popup), the items being <ui-option>s. The popup is a composite list of options (recipe-parts.ts `composite`;
// the options read its values, listbox.recipe.ts).
// React renders a native <select> with customizable-select styling (appearance: base-select): the
// trigger is its <button>, the value its <selectedcontent>, the icon the chevron, the popup ::picker(select) (a
// pseudo-element, so styled from the root; no list part), the options native <option>s. Browsers without
// base-select show the platform select.
import { defineSlotRecipe } from '@pandacss/dev';
import { ANCHORED, anchoredPopup, composite, fieldControl, fieldParts, fieldRoot, floatingOpen, floatingPopup, mergeStyles, sideOrigins, t } from '../recipe-parts.ts';

// Trigger states: the host's field state (data-invalid, data-disabled, data-readonly; the React
// trigger sits one level deeper, in the native select, matched at the same specificity through
// :where), and data-popup-open on the web component's trigger. React's open state stays native
// (select:open): the browser owns the picker; a select disabled by a <fieldset> is :disabled.
const OPEN = ':is([data-popup-open], select:open > *)';
const PICKER = '& > select::picker(select)';
// The popup is a floating layer (recipe-parts.ts floatingPopup, anchoredPopup; dom/floating.ts):
// where anchor positioning runs, each select scopes one shared anchor name, so the popup sits 1u
// below its own trigger (above when there is no room), at least as wide, as tall as the space
// allows. Elsewhere the element places it from script (the positioner) and sets the variables in
// px; the React picker gets the CSS ones.
const ANCHOR = '--ui-select-trigger';
const popup = floatingPopup;
const anchored = anchoredPopup({ anchor: ANCHOR, side: 'bottom', align: 'start' });
const open = floatingOpen;
// The composite variables alone (the native select holds them for its options, which inherit from it).
const compositeVars = Object.fromEntries(Object.entries(composite).filter(([k]) => k.startsWith('--')));
// The gap attribute is on the host (--ui-gap does not inherit, styles/geometry.ts): the popup takes it.
const hostGap = { '--ui-gap': 'inherit' };

export const select = defineSlotRecipe({
  className: 'ui-select',
  description: 'Single-choice dropdown (ui-select, React Select).',
  slots: ['root', 'label', 'trigger', 'leading', 'prefix', 'value', 'suffix', 'icon', 'popup', 'list', 'description', 'error'],
  base: {
    root: {
      ...fieldRoot,
      // React: opt in to customizable select; the select's own box wraps the trigger exactly (no
      // intrinsic minimum height or line box); the inner <button> is the painted trigger.
      '& > select, & > select::picker(select)': { appearance: 'base-select' },
      '& > select': { display: 'block', width: '100%', padding: 0, border: 0, background: 'none', minWidth: 0, minBlockSize: 0, blockSize: 'auto', lineHeight: 0, ...compositeVars, ...hostGap },
      '& > select > [data-part=trigger], & > select > option': { lineHeight: 'var(--line)' },
      '& > select::picker-icon': { display: 'none' },
      '& > select > option::checkmark': { display: 'none' },
      // The picker is the composite: no UA border, the kit's edge (B) instead.
      [PICKER]: mergeStyles(popup, composite, hostGap, { borderStyle: 'solid', marginBlockStart: 'var(--u)' }),
      '& > select:open::picker(select)': open,
      [ANCHORED]: {
        anchorScope: ANCHOR,
        [PICKER]: anchored,
      },
    },
    ...fieldParts,
    trigger: mergeStyles(fieldControl({
        invalid: ':is([data-invalid] > *, [data-invalid] > select > *)',
        disabled: ':is([data-disabled] > *, :disabled > *, :where([data-disabled] > select > *))',
        readonly: ':is([data-readonly] > *, :where([data-readonly] > select > *))',
      }), {
      cursor: 'pointer', userSelect: 'none',
      // Open: the trigger holds the pressed fill and the chevron turns.
      [`&${OPEN}`]: { bg: 'bg.mutedActive', '& > [data-part=icon]': { rotate: '180deg' } },
      '& > [data-part=value]': { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
      '& > [data-part=value][data-placeholder]': { color: 'fg.subtle' },
      // React: <selectedcontent> copies the selected option, Select.ItemIndicator included; the trigger shows no check.
      '& > [data-part=value] [data-mark=selected]': { display: 'none' },
      '& > [data-part=icon]': { color: 'fg.muted', transition: t('toggle', 'rotate') },
      [ANCHORED]: { anchorName: ANCHOR },
      '&:is(select > *)': { width: '100%' },
    }),
    // [popover] stays hidden until shown. The column layout holds in every state: while closing,
    // the popup stays displayed for its fade (display transitions discretely), so a direction set
    // only on :popover-open would flip it to a row.
    popup: mergeStyles(popup, composite, hostGap, {
      // Base UI data-side: opening upward, the popup grows from its bottom edge.
      ...sideOrigins,
      '&:popover-open': { display: 'flex', ...open },
      [ANCHORED]: anchored,
    }),
    // Base UI Select.List: the options' parent, transparent to layout (the popup is the composite).
    list: { display: 'contents' },
  },
});
