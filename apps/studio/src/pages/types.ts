// Page contract for the jig's content area. Every page renders from the same live theme (the jig
// panel only edits tokens), so a page receives the inputs below and nothing about which panel tab
// is open. Routes live in the URL hash (#/<route>), see ROUTES.
import type { ThemeParams } from '@massimo/ui-kit/tokens';
import type { FaceMap, SpectrumPayload, VoiceMap } from '../protocol.ts';

export interface PageProps {
  params: ThemeParams;
  spectrum?: SpectrumPayload;
  voices: VoiceMap;
  faces: FaceMap;
}

/** Content pages, in menu order. `home` is the default route (#/ or an unknown hash). */
export const ROUTES = ['home', 'components', 'containers', 'geometry', 'typography', 'colors', 'motion'] as const;
export type Route = (typeof ROUTES)[number];
export const ROUTE_LABEL: Record<Route, string> = {
  home: 'Home', components: 'Components', containers: 'Containers', geometry: 'Geometry',
  typography: 'Typography', colors: 'Colors', motion: 'Motion',
};
