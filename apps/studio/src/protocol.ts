import type { Roles } from '@massimo/ui-kit/spectrum';
// Shared jig types.
/** Jig panel tabs: token editing only; the content page is chosen by the URL hash (pages/route.ts). */
export type PanelTab = 'geometry' | 'colors' | 'typography' | 'motion';
import type { Face, Voice } from '@massimo/ui-kit/tokens';
export type VoiceMap = Record<Voice, Face>;
export type FaceMap = Record<Face, string>;
export type Scheme = 'auto' | 'light' | 'dark';
export interface FamilyRamp { name: string; light: string[]; dark: string[]; lightText: string[]; darkText: string[] }
import type { SpectrumDiagnostics } from '@massimo/ui-kit/spectrum';
export interface SpectrumPayload { css: string; families: FamilyRamp[]; roles: Roles; diagnostics: SpectrumDiagnostics; ms: number }
