// React <Separator>: a <div role="separator"> with the web component's data-* and slot recipe
// (separator.recipe.ts). One part (Base UI Separator): it takes `render` and a className function
// of its state ({ orientation }).
import type { HTMLAttributes } from 'react';
import { renderPart, stateOf, type PartBase } from '../compound.react.tsx';
import { separatorAttrs } from '../../dom/display.ts';
import { toReactProps } from '../../dom/attrs.ts';
import { separator } from '../../styled-system/recipes/separator.js';

export interface SeparatorProps extends Omit<HTMLAttributes<HTMLDivElement>, 'className'>, PartBase {
  /** horizontal (default): a full-width rule; vertical: a full-height rule in a flex or grid row. */
  orientation?: 'horizontal' | 'vertical';
  /** Unit u in px for this element (the border B is capped at u / 2). */
  size?: number;
}

export function Separator({ orientation = 'horizontal', size, className, render, ...rest }: SeparatorProps) {
  const attrs = toReactProps(separatorAttrs(orientation));
  return renderPart('div', separator().root, { 'data-ui': 'separator', 'data-size': size, ...attrs, ...rest, className, render }, stateOf(attrs));
}
