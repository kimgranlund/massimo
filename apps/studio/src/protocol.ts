// Shared jig types.
export type View = 'components' | 'containers' | 'colors';
export type Scheme = 'auto' | 'light' | 'dark';
export interface FamilyRamp { name: string; light: string[]; dark: string[]; lightText: string[]; darkText: string[] }
export interface SpectrumPayload { css: string; families: FamilyRamp[]; roles: { primary: string; neutral: string; critical: string } }
