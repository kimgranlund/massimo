// Compound parts for React renderers (Base UI style): every part takes Base UI's `render` prop (an
// element to render instead, or a function of the props and the state) and `className` (a string,
// or a function of the state), and carries the state as data-* attributes. A Root shares its state
// with its parts through context; the one-component forms (<Select label …>, <Checkbox>) are presets
// composed from the parts, so both forms render the same DOM, classes and data-*.
import { Children, cloneElement, createElement, isValidElement, type ReactElement, type ReactNode, type Ref } from 'react';
import { cx } from '../styled-system/css/cx.js';

/** A part's state: its data-* state attributes as camelCase flags and values (data-popup-open → popupOpen: true). */
export type PartState = Record<string, boolean | string>;

/** Base UI's render prop: an element whose props are merged with the part's, or a function of the part's props and state. */
export type RenderProp = ReactElement | ((props: Record<string, any>, state: PartState) => ReactElement);

/** The props every compound part accepts. */
export interface PartBase {
  /** Replace the part's element (Base UI render): an element (the part's props merge into it) or `(props, state) => element`. The recipe class and data-* stay on whatever renders. */
  render?: RenderProp;
  /** Author class, or a function of the part's state (Base UI className); added after the recipe class. */
  className?: string | ((state: PartState) => string | undefined);
}

const camel = (s: string) => s.replace(/-(\w)/g, (_, c: string) => c.toUpperCase());

/** The state object for className and render functions, from a part's data-* state attributes. */
export function stateOf(attrs: Record<string, unknown>): PartState {
  const out: PartState = {};
  for (const [k, v] of Object.entries(attrs)) if (k.startsWith('data-') && v !== undefined && v !== null && v !== false) out[camel(k.slice(5))] = v === '' || v === true ? true : String(v);
  return out;
}

const chain = (a: unknown, b: unknown) => (typeof a === 'function' && typeof b === 'function' ? (...args: unknown[]) => { a(...args); b(...args); } : b ?? a);
const mergeRefs = <T,>(a?: Ref<T>, b?: Ref<T>): Ref<T> | undefined => (!a || !b ? a ?? b : (v: T | null) => {
  for (const r of [a, b]) typeof r === 'function' ? r(v) : r && ((r as { current: T | null }).current = v);
});

/** Merge a render element's own props over the part's: classes join, styles merge, handlers and refs both run. */
export function mergeProps(ours: Record<string, any>, theirs: Record<string, any>): Record<string, any> {
  const out: Record<string, any> = { ...ours };
  for (const [k, v] of Object.entries(theirs)) {
    if (k === 'className') out.className = cx(ours.className, v);
    else if (k === 'style') out.style = { ...ours.style, ...v };
    else if (k === 'ref') out.ref = mergeRefs(ours.ref, v);
    else if (/^on[A-Z]/.test(k)) out[k] = chain(ours[k], v);
    else if (k === 'children' && v === undefined) continue;
    else out[k] = v;
  }
  return out;
}

/**
 * Render one part: `tag` with `props` (data-part, data-* state, handlers, children), the recipe class
 * `recipe` plus the author's className, or the author's `render` element or function instead.
 */
export function renderPart(tag: string, recipe: string | undefined, props: Record<string, any> & PartBase, state: PartState): ReactElement {
  const { render, className } = props;
  // className keeps the place the caller gave it (attribute order in server markup).
  const merged: Record<string, any> = { ...props, className: cx(recipe, typeof className === 'function' ? className(state) : className) || undefined };
  delete merged.render;
  if (typeof render === 'function') return render(merged, state);
  if (isValidElement(render)) return cloneElement(render, mergeProps(merged, render.props as Record<string, any>));
  return createElement(tag, merged);
}

/** Whether a child is an element of one of the given part components. */
export const isPartOf = (types: readonly unknown[]) => (n: ReactNode): boolean => isValidElement(n) && types.includes(n.type);

/** Split children into the elements of the given part components and the rest, in order. */
export function splitParts(children: ReactNode, types: readonly unknown[]): [ReactElement[], ReactNode[]] {
  const is = isPartOf(types);
  const all = Children.toArray(children);
  return [all.filter(is) as ReactElement[], all.filter((n) => !is(n))];
}

/** The first child element of one of the given part components (Roots read their parts' props). */
export const findPart = <P,>(children: ReactNode, types: readonly unknown[]) =>
  Children.toArray(children).find(isPartOf(types)) as ReactElement<P> | undefined;

/** Nodes, or undefined when there are none (a construction-pattern part is then omitted). */
export const some = (nodes: ReactNode[]) => (nodes.length ? nodes : undefined);
