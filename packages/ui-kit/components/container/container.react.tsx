// React containers: <div data-ui="<level>"> with the same padding, gap and radius as the CSS-only
// ui-* tags. `gap` (units of u), `size` (u in px) and the card's `padding` (xs … xl) are the
// same inputs as the attributes.
import type { HTMLAttributes } from 'react';
import type { CardPadding } from '../../tokens/geometry/resolve.ts';

type Level = 'group' | 'collection' | 'card' | 'panel' | 'region' | 'page';
export interface ContainerProps extends HTMLAttributes<HTMLDivElement> { gap?: number; size?: number }
export interface CardProps extends ContainerProps {
  /** Padding level: xs 2u, sm 3u, md 4u (default), lg 5u, xl 6u; the radius equals the padding. */
  padding?: CardPadding;
}

const attrs = (gap?: number) => (gap !== undefined ? { gap: String(gap) } : {});
const make = (level: Exclude<Level, 'card'>) => function Container({ gap, size, ...rest }: ContainerProps) {
  // `gap` is the attribute the geometry styles read ([gap="2"]); React passes it through as-is.
  return <div {...rest} data-ui={level} data-size={size} {...attrs(gap)} />;
};

export function Card({ gap, size, padding, ...rest }: CardProps) {
  return <div {...rest} data-ui="card" data-size={size} {...attrs(gap)} {...(padding && padding !== 'md' ? { padding } : {})} />;
}
export const Group = make('group');
export const Collection = make('collection');
export const Panel = make('panel');
export const Region = make('region');
export const Page = make('page');
