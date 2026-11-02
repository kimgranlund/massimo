// React containers: <div data-ui="<level>"> with the level's slot recipe class (container.recipe.ts),
// the same rules the CSS-only ui-* tags get. `gap` (units of u), `size` (u in px) and the card's
// `padding` (xs … xl, a recipe variant) are the same inputs as the attributes.
import type { HTMLAttributes } from 'react';
import type { CardPadding } from '../../tokens/geometry/resolve.ts';
import { cx } from '../../styled-system/css/cx.js';
import { group, collection, card, panel, region, pageRecipe } from '../../styled-system/recipes/index.js';

type Level = 'group' | 'collection' | 'card' | 'panel' | 'region' | 'page';
export interface ContainerProps extends HTMLAttributes<HTMLDivElement> { gap?: number; size?: number }
export interface CardProps extends ContainerProps {
  /** Padding level: xs 2u, sm 3u, md 4u (default), lg 5u, xl 6u; the radius equals the padding. */
  padding?: CardPadding;
}

// `gap` is the attribute the geometry foundation reads ([gap="2"] sets --ui-gap); React passes it through.
const attrs = (gap?: number) => (gap !== undefined ? { gap: String(gap) } : {});
const make = (level: Exclude<Level, 'card'>, recipe: () => { root: string }) => function Container({ gap, size, className, ...rest }: ContainerProps) {
  return <div {...rest} className={cx(recipe().root, className)} data-ui={level} data-size={size} {...attrs(gap)} />;
};

export function Card({ gap, size, padding, className, ...rest }: CardProps) {
  return <div {...rest} className={cx(card({ padding }).root, className)} data-ui="card" data-size={size} {...attrs(gap)} />;
}
export const Group = make('group', group);
export const Collection = make('collection', collection);
export const Panel = make('panel', panel);
export const Region = make('region', region);
export const Page = make('page', pageRecipe);
