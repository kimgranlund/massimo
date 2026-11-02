// The React props parser (scripts/react-props.ts) on each type form the renderers use, and its refusals.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseModule, reactApi, members, splitTop } from '../scripts/react-props.ts';
import { propLine } from '../scripts/manifests.ts';

const api = (text: string, name: string) => {
  const r = reactApi('/virtual/x.react.tsx', name, parseModule('/virtual/x.react.tsx', text));
  return { inherits: r.inherits, props: r.props.map(propLine) };
};

test('members: optional marks, JSDoc, function and union types, one-line literals, comments', () => {
  const m = members(`
    /** Fires with the new value. */
    onValueChange?: (value: string) => void;
    // a line comment, ignored (with an apostrophe's)
    orientation?: 'vertical' | 'horizontal'
    value: string; gap?: number, size?: Record<string, { a: number }>;
  `);
  assert.deepEqual(m.map(propLine), [
    'onValueChange?: (value: string) => void // Fires with the new value.',
    "orientation?: 'vertical' | 'horizontal'",
    'value: string',
    'gap?: number',
    'size?: Record<string, { a: number }>',
  ]);
  assert.throws(() => members('[key: string]: number;'), /unsupported member syntax/);
  assert.deepEqual(splitTop("A & Omit<B, 'x' | 'y'> & { c: () => D }", '&'), ['A', "Omit<B, 'x' | 'y'>", '{ c: () => D }']);
});

test('interfaces, extends, Omit over a local type, intersections, factories and defaults', () => {
  const text = `
type Native = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'>;
interface Common { leading?: ReactNode; size?: number; children?: ReactNode }
export interface AProps extends Native, Common {
  /** Replaces Common.size. */
  size?: 'sm' | 'lg';
}
export function A({ size = 'sm', leading: lead, ...rest }: AProps) { return null; }
export function B(props: AProps & { extra?: boolean }) { return null; }
export function C({ children }: Omit<Common, 'size'> & Omit<HTMLAttributes<HTMLDivElement>, 'prefix'>) { return null; }
const make = (level: string) => function Box({ gap }: { gap?: number }) { return null; };
export const D = make('d');
`;
  assert.deepEqual(api(text, 'A'), {
    inherits: ["Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'>"],
    props: ['leading?: ReactNode', 'children?: ReactNode', "size?: 'sm' | 'lg' = 'sm' // Replaces Common.size."],
  });
  assert.deepEqual(api(text, 'B').props.at(-1), 'extra?: boolean');
  assert.deepEqual(api(text, 'C'), { inherits: ["Omit<HTMLAttributes<HTMLDivElement>, 'prefix'>"], props: ['leading?: ReactNode', 'children?: ReactNode'] });
  assert.deepEqual(api(text, 'D'), { inherits: [], props: ['gap?: number'] });
  assert.throws(() => api(text, 'Missing'), /no export function or factory const named Missing/);
  assert.throws(() => api('export function E(p: keyof X) {}', 'E'), /unsupported type expression/);
});

test('real renderers: imported PartProps resolve; inherited HTML attributes stay as text', () => {
  const kit = new URL('../components/', import.meta.url).pathname;
  const option = reactApi(`${kit}listbox/listbox.react.tsx`, 'Option');
  assert.deepEqual(option.inherits, ["Omit<HTMLAttributes<HTMLDivElement>, 'prefix'>"]);
  assert.deepEqual(option.props.map((p) => p.name), ['leading', 'prefix', 'suffix', 'trailing', 'value', 'disabled', 'iconSize', 'children']);
  assert.equal(option.props.find((p) => p.name === 'value')!.optional, false);
  const range = reactApi(`${kit}range/range.react.tsx`, 'Range');
  assert.equal(range.props.find((p) => p.name === 'defaultValue')!.default, '50');
});
