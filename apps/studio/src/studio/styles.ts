import { css } from '../../styled-system/css/index.js';

// Narrow: the panel stacks above the content column (the page scrolls); md and up: side by side.
export const shell = css({ display: 'grid', gridTemplateColumns: { base: '1fr', md: '22rem 1fr' }, height: { base: 'auto', md: 'dvh' } });
export const panel = css({ display: 'flex', flexDirection: 'column', minHeight: '0', borderRightWidth: 'thin', borderColor: 'border', bg: 'bg' });
export const panelHeader = css({ display: 'flex', flexDirection: 'column', gap: '3', padding: '4', borderBottomWidth: 'thin', borderColor: 'border' });
export const brand = css({ textStyle: 'heading-3' });
export const titleRow = css({ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '2' });
// The panel's ui-field-grid: it scrolls on its own; rows keep their height (align to the top).
// One grid for every tab: the label column is fixed at the field grid's 40% cap (not sized to the tab's
// longest label) and the readout column holds at least 11u (the widest readout, 359°), so controls start and end at the same x
// on Geometry, Colors, Typography and Motion.
export const panelBody = css({ flex: '1', minHeight: '0', overflowY: 'auto', alignContent: 'start', padding: '4', gridTemplateColumns: '[40% minmax(0, 1fr) minmax(calc(11px * var(--ui-unit)), auto)]' });
export const group = css({ display: 'flex', flexDirection: 'column', gap: '3' });
export const pair = css({ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2', width: 'full', '& > ui-select': { minWidth: '0' } });
export const control = css({ display: 'flex', flexDirection: 'column', gap: '1', '& > ui-segmented': { width: 'full' } });
export const controlHead = css({ display: 'flex', justifyContent: 'space-between', textStyle: 'label' });
export const footer = css({ display: 'flex', flexDirection: 'column', gap: '2', padding: '4', borderTopWidth: 'thin', borderColor: 'border' });
export const actions = css({ display: 'flex', gap: '2', '& > ui-button': { flex: '1' } });
export const status = css({ textStyle: 'caption', color: 'fg.muted', minHeight: '[1lh]' });
// Content column: the persistent header over the canvas, which scrolls on its own.
export const content = css({ display: 'flex', flexDirection: 'column', height: 'dvh', minWidth: '0' });
// Jig chrome at the default theme (outside [data-canvas]); stays at the top of the content column.
export const contentHeader = css({
  position: 'sticky', top: '0', zIndex: '10', display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '2',
  paddingBlock: '2', paddingInline: '4', borderBottomWidth: 'thin', borderColor: 'border', bg: 'bg',
  '& > ui-select': { width: '[12rem]', maxWidth: 'full' },
});
export const headerEnd = css({ display: 'flex', alignItems: 'center', gap: '2', marginInlineStart: 'auto', minWidth: '0', '& > ui-select': { width: '[12rem]' } });
// bg/color restated here so scoped theme values apply to it; pages query its width ('canvas').
export const canvas = css({ flex: '1', minHeight: '0', overflowY: 'auto', bg: 'bg', color: 'fg', containerType: 'inline-size', containerName: 'canvas' });
// Containers tab: one row per type (the selects hide their own labels: hide-label).
export const levelGrid = css({ display: 'grid', gridTemplateColumns: '6rem 1fr 1fr', gap: '2', alignItems: 'center' });
export const levelHead = css({ textStyle: 'caption', color: 'fg.muted' });
export const levelName = css({ textStyle: 'label' });
