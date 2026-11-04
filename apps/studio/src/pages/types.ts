// Page contract for the jig's content area. Every page renders from the same live theme (the jig
// panel only edits tokens), so a page receives the inputs below and nothing about which panel tab
// is open. Routes live in the URL hash (#/<route>), see ROUTES.
import type { Brand } from '@massimo/ui-kit/tokens/brand/index';
import type { TextColor, TypeRoleName } from '@massimo/ui-kit/tokens/typography/resolve';
import type { ThemeParams } from '@massimo/ui-kit/tokens/themes/params';
import type { FaceMap, SpectrumPayload, VoiceMap } from '../protocol.ts';

export interface PageProps {
  params: ThemeParams;
  spectrum?: SpectrumPayload;
  voices: VoiceMap;
  faces: FaceMap;
  /** Each type role's text color (theme typography.colors). */
  typeColors: Record<TypeRoleName, TextColor>;
  /** The brand the theme was hydrated from (the Brand page's Apply, or Load), if any. */
  brand?: Brand | null;
}

/** Pages ask the jig to hydrate and apply a brand with this window event (detail: the brand). */
export const APPLY_BRAND = 'studio:apply-brand';

/** Content pages, in menu order. `home` is the default route (#/ or an unknown hash). */
export const ROUTES = ['home', 'components', 'containers', 'elevation', 'geometry', 'typography', 'colors', 'motion', 'brand'] as const;
export type Route = (typeof ROUTES)[number];
export const ROUTE_LABEL: Record<Route, string> = {
  home: 'Home', components: 'Components', containers: 'Containers', elevation: 'Elevation', geometry: 'Geometry',
  typography: 'Typography', colors: 'Colors', motion: 'Motion', brand: 'Brand',
};
