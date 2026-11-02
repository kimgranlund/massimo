// Shared jig types.
export type View = 'components' | 'containers' | 'colors' | 'typography';
import type { Face, Voice } from '@massimo/ui-kit/tokens';
export type VoiceMap = Record<Voice, Face>;
export type FaceMap = Record<Face, string>;
export type Scheme = 'auto' | 'light' | 'dark';
export interface FamilyRamp { name: string; light: string[]; dark: string[]; lightText: string[]; darkText: string[] }
import type { SpectrumDiagnostics } from '@massimo/ui-kit/spectrum';
export interface SpectrumPayload { css: string; families: FamilyRamp[]; roles: { primary: string; neutral: string; critical: string }; diagnostics: SpectrumDiagnostics; ms: number }
