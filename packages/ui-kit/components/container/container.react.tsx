// React Container: the ui-container element as <div data-ui="container"> (container.recipe.ts). `gap`
// (units of u), `size` (u in px) and `radius` (a magnitude 0 … 1) are the same inputs as the attributes.
import type { HTMLAttributes } from 'react';
import type { CardPadding, ContainerPreset } from '../../tokens/geometry/resolve.ts';

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  gap?: number;
  size?: number;
  /** Group, collection, card: the radius as a magnitude of the concentric radius, 0 … 1 in 0.05 steps (1 concentric, 0 square). */
  radius?: number;
}

// `gap` is the attribute the geometry foundation reads ([gap="2"] sets --ui-gap); React passes it through.
const attrs = (gap?: number, radius?: number) => ({ ...(gap !== undefined ? { gap: String(gap) } : {}), ...(radius !== undefined ? { radius: String(radius) } : {}) });

export interface UniversalContainerProps extends ContainerProps {
  /** group, collection (default), card, panel, region, page: the starting geometry, flow and surface. */
  preset?: ContainerPreset;
  /** The card ladder level: xs 2u, sm 3u, md 4u, lg 6u, xl 8u. */
  padding?: CardPadding;
  /** stack (column), row, wrap. Default: the preset's. */
  layout?: 'stack' | 'row' | 'wrap';
  /** none, panel, card, raised: the elevation level. Default: the preset's. */
  surface?: 'none' | 'panel' | 'card' | 'raised' | 'solid';
}

/**
 * React Container (ui-container): one element for every level, nesting concentrically. It renders what
 * the web component is, <div data-ui="container"> with plain attributes (preset, padding, layout,
 * surface), styled by the same global rules (containerTags) rather than a recipe class, so
 * the nesting chain applies to it in the same layer.
 */
export function Container({ gap, size, radius, preset = 'collection', padding, layout, surface, ...rest }: UniversalContainerProps) {
  const a = { preset, ...(padding ? { padding } : {}), ...(layout ? { layout } : {}), ...(surface ? { surface } : {}) };
  return <div {...rest} data-ui="container" data-size={size} {...a} {...attrs(gap, radius)} />;
}
