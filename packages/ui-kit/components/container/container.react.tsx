// React containers: <div data-ui="<level>"> with the same padding, gap and radius as the CSS-only
// ui-* tags. `gap` (units of u) and `size` (u in px) are the same inputs as the attributes.
import type { HTMLAttributes } from 'react';

type Level = 'group' | 'collection' | 'tile' | 'card' | 'panel' | 'region' | 'page';
export interface ContainerProps extends HTMLAttributes<HTMLDivElement> { gap?: number; size?: number }

const make = (level: Level) => function Container({ gap, size, ...rest }: ContainerProps) {
  // `gap` is the attribute the geometry styles read ([gap="2"]); React passes it through as-is.
  return <div {...rest} data-ui={level} data-size={size} {...(gap !== undefined ? { gap: String(gap) } : {})} />;
};

export const Group = make('group');
export const Collection = make('collection');
export const Tile = make('tile');
export const Card = make('card');
export const Panel = make('panel');
export const Region = make('region');
export const Page = make('page');
