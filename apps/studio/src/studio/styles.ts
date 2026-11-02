import { css } from '../../styled-system/css/index.js';

export const shell = css({ display: 'grid', gridTemplateColumns: { base: '1fr', md: '20rem 1fr' }, height: '100dvh' });
export const panel = css({ display: 'flex', flexDirection: 'column', gap: '5', padding: '5', overflowY: 'auto', borderRightWidth: 'thin', borderColor: 'border', bg: 'bg' });
export const panelHeader = css({ display: 'flex', justifyContent: 'space-between', alignItems: 'center' });
export const brand = css({ textStyle: 'title' });
export const fieldLabel = css({ display: 'flex', flexDirection: 'column', gap: '1.5', textStyle: 'label' });
export const select = css({ height: '8', paddingInline: '2', borderWidth: 'thin', borderColor: 'border.strong', borderRadius: 'md', bg: 'bg' });
export const sliders = css({ display: 'flex', flexDirection: 'column', gap: '4' });
export const slider = css({ display: 'flex', flexDirection: 'column', gap: '1', '& input': { accentColor: 'accent.solid', width: '100%' } });
export const sliderHead = css({ display: 'flex', justifyContent: 'space-between', textStyle: 'label' });
export const value = css({ fontFamily: 'mono', fontSize: 'xs', color: 'fg.muted' });
export const saveRow = css({ display: 'flex', flexDirection: 'column', gap: '3', paddingTop: '4', borderTopWidth: 'thin', borderColor: 'border' });
export const actions = css({ display: 'flex', gap: '2', flexWrap: 'wrap' });
export const status = css({ textStyle: 'caption', color: 'fg.muted', minHeight: '1lh' });
export const code = css({ fontFamily: 'mono', fontSize: 'xs', bg: 'bg.muted', padding: '3', borderRadius: 'md', whiteSpace: 'pre-wrap', wordBreak: 'break-all' });
export const canvas = css({ width: '100%', height: '100%', border: 0, bg: 'bg.subtle' });
