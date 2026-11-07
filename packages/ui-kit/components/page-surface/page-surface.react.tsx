// React PageSurface: the ui-page-surface element as <div data-ui="page-surface"> with the same global rules.
import type { HTMLAttributes } from 'react';
import type { PageWidth } from '../../tokens/geometry/resolve.ts';

export interface PageSurfaceProps extends HTMLAttributes<HTMLDivElement> {
  /** readable 160u, wide 320u, full 335u. Default readable. */
  width?: PageWidth;
  /** Gutter between children in units of u, 0 … 8 in 0.5 steps. Default 4. */
  gap?: number;
}
/** React PageSurface (ui-page-surface): a normal-flow document surface. */
export function PageSurface({ width, gap, ...rest }: PageSurfaceProps) {
  return <div {...rest} data-ui="page-surface" {...(width ? { width } : {})} {...(gap !== undefined ? { gap: String(gap) } : {})} />;
}
