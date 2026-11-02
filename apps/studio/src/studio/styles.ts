import { css } from '../../styled-system/css/index.js';

export const shell = css({ display: 'grid', gridTemplateColumns: { base: '1fr', md: '22rem 1fr' }, height: '100dvh' });
export const panel = css({ display: 'flex', flexDirection: 'column', minHeight: 0, borderRightWidth: 'thin', borderColor: 'border', bg: 'bg' });
export const panelHeader = css({ display: 'flex', flexDirection: 'column', gap: '3', padding: '4', borderBottomWidth: 'thin', borderColor: 'border' });
export const brand = css({ textStyle: 'heading-3' });
export const titleRow = css({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2' });
export const panelBody = css({ flex: '1', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '5', padding: '4' });
export const group = css({ display: 'flex', flexDirection: 'column', gap: '3' });
// Figma-style pane: 5 columns; label spans 2, control spans 3. Components' own labels are hidden
// visually (they still name the control via aria-labelledby).
export const paneGrid = css({
  display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', columnGap: '2', rowGap: '2', alignItems: 'center',
  '& :is(ui-select, ui-input) > [data-part=label]': { display: 'none' },
});
export const paneLabel = css({ gridColumn: 'span 2', textStyle: 'label', color: 'fg.muted', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' });
export const paneControl = css({ gridColumn: 'span 3', display: 'flex', alignItems: 'center', gap: '2', minWidth: 0, '& > :is(ui-range, ui-segmented, ui-select, ui-input, ui-button)': { flex: '1', minWidth: 0 } });
export const pair = css({ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2', width: '100%', '& > ui-select': { minWidth: 0 } });
export const groupTitle = css({ gridColumn: '1 / -1', textStyle: 'group-kicker', color: 'fg.muted', paddingTop: '1' });
export const control = css({ display: 'flex', flexDirection: 'column', gap: '1', '& > ui-segmented': { width: '100%' } });
export const controlHead = css({ display: 'flex', justifyContent: 'space-between', textStyle: 'label' });
export const value = css({ fontFamily: 'mono', fontSize: 'xs', color: 'fg.muted', minWidth: '5ch', textAlign: 'end', fontVariantNumeric: 'tabular-nums' });
export const footer = css({ display: 'flex', flexDirection: 'column', gap: '2', padding: '4', borderTopWidth: 'thin', borderColor: 'border' });
export const actions = css({ display: 'flex', gap: '2', '& > ui-button': { flex: '1' } });
export const status = css({ textStyle: 'caption', color: 'fg.muted', minHeight: '1lh' });
// The canvas scrolls on its own; bg/color restated here so scoped theme values apply to it.
export const canvas = css({ height: '100dvh', overflowY: 'auto', bg: 'bg', color: 'fg' });
// Containers tab: one row per type; the selects' visible labels are hidden (they still name them).
export const levelGrid = css({ display: 'grid', gridTemplateColumns: '6rem 1fr 1fr', gap: '2', alignItems: 'center', '& ui-select > [data-part=label]': { display: 'none' } });
export const levelHead = css({ textStyle: 'caption', color: 'fg.muted' });
export const levelName = css({ textStyle: 'label' });
