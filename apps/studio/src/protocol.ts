// Studio <-> canvas messages. Same-origin today; the origin and source checks keep the
// boundary ready for serving previews from a separate origin later.
import type { ThemeParams } from '@massimo/ui-kit/tokens';

export type View = 'components' | 'containers' | 'colors';
export type Scheme = 'auto' | 'light' | 'dark';
export interface FamilyRamp { name: string; light: string[]; dark: string[]; lightText: string[]; darkText: string[] }
export interface SpectrumPayload { css: string; families: FamilyRamp[]; roles: { primary: string; neutral: string; critical: string } }

export type ThemeMessage = { type: 'studio/theme'; params: ThemeParams; scheme: Scheme; icons: string; view: View; spectrum?: SpectrumPayload };
export type ReadyMessage = { type: 'studio/ready' };
export type StudioMessage = ThemeMessage | ReadyMessage;

export function listen(from: () => Window | null | undefined, on: (m: StudioMessage) => void) {
  const handler = (e: MessageEvent) => {
    if (e.origin !== location.origin || e.source !== from()) return;
    if (e.data && typeof e.data.type === 'string' && e.data.type.startsWith('studio/')) on(e.data);
  };
  addEventListener('message', handler);
  return () => removeEventListener('message', handler);
}

export const post = (to: Window | null | undefined, m: StudioMessage) => to?.postMessage(m, location.origin);
