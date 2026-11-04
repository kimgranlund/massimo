import type { Roles } from '@massimo/ui-kit/tokens/colors/spectrum/roles';
// Shared jig types.
/** Jig panel tabs: token editing only; the content page is chosen by the URL hash (pages/route.ts). */
export type PanelTab = 'geometry' | 'colors' | 'typography' | 'motion' | 'brand';
import type { Face, Voice } from '@massimo/ui-kit/tokens/typography/resolve';
export type VoiceMap = Record<Voice, Face>;
export type FaceMap = Record<Face, string>;
export type Scheme = 'auto' | 'light' | 'dark';
export interface FamilyRamp { name: string; light: string[]; dark: string[]; lightText: string[]; darkText: string[]; /** HCT tone per step. */ lightTones: number[]; darkTones: number[] }
/** The contrast model's inputs: the page tone (step 1) and the APCA Lc target per step 2–12, per scheme. */
export interface ContrastPayload { light: { page: number; targets: number[] }; dark: { page: number; targets: number[] } }
import type { SpectrumDiagnostics } from '@massimo/ui-kit/spectrum';
import type { AnchorResult } from '@massimo/ui-kit/tokens/colors/spectrum/anchors';
export interface SpectrumPayload { css: string; families: FamilyRamp[]; roles: Roles; diagnostics: SpectrumDiagnostics; contrast: ContrastPayload; /** Where each brand anchor landed (color.anchors). */ anchors: AnchorResult[]; ms: number }
