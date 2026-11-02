import { css } from '../../styled-system/css/index.js';

export const shell = css({ display: 'grid', gridTemplateColumns: { base: '1fr', md: '22rem 1fr' }, height: '100dvh' });
export const panel = css({ display: 'flex', flexDirection: 'column', minHeight: 0, borderRightWidth: 'thin', borderColor: 'border', bg: 'bg' });
export const panelHeader = css({ display: 'flex', flexDirection: 'column', gap: '3', padding: '4', borderBottomWidth: 'thin', borderColor: 'border' });
export const brand = css({ textStyle: 'title' });
export const panelBody = css({ flex: '1', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '5', padding: '4' });
export const group = css({ display: 'flex', flexDirection: 'column', gap: '3' });
export const groupTitle = css({ textStyle: 'caption', color: 'fg.muted', textTransform: 'uppercase', letterSpacing: 'wide' });
export const control = css({ display: 'flex', flexDirection: 'column', gap: '1', '& > ui-segmented': { width: '100%' } });
export const controlHead = css({ display: 'flex', justifyContent: 'space-between', textStyle: 'label' });
export const value = css({ fontFamily: 'mono', fontSize: 'xs', color: 'fg.muted' });
export const footer = css({ display: 'flex', flexDirection: 'column', gap: '2', padding: '4', borderTopWidth: 'thin', borderColor: 'border' });
export const actions = css({ display: 'flex', gap: '2', '& > ui-button': { flex: '1' } });
export const status = css({ textStyle: 'caption', color: 'fg.muted', minHeight: '1lh' });
// The canvas scrolls on its own; bg/color restated here so scoped theme values apply to it.
export const canvas = css({ height: '100dvh', overflowY: 'auto', bg: 'bg', color: 'fg' });
