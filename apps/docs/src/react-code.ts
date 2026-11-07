// The React form of an example, derived from its markup. A web component's parts and slots become
// compound parts in React, which markup alone can't name, so those examples return null and the page
// shows the import and the props instead of a snippet that wouldn't run. So do the folders in
// REACT_DIFFERS, whose React props aren't their web attributes; the list comes from typechecking every
// derived snippet against the renderers.
import type { Manifest } from './model.ts';

const REACT_DIFFERS = new Set(['setting-row', 'data-list', 'stat-card', 'accordion', 'autocomplete', 'checkbox-group', 'field', 'form', 'image', 'range', 'row', 'scroll-area', 'toggle-group']);
export type ReactName = { name: string; folder: string };
export function reactNames(manifests: Manifest[]) {
  return new Map(manifests.flatMap((m) => m.nodes.flatMap((n) => {
    const name = m.renderers?.react?.exports?.[n.id];
    return n.tag && name ? [[n.tag, { name, folder: m.name }] as [string, ReactName]] : [];
  })));
}
export const reactImport = ({ name, folder }: ReactName) => `import { ${name} } from '@massimo/ui-kit/components/${folder}/react';`;

const camel = (s: string) => s.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
/** HTML attributes that are one word in markup and two in React. */
const REACT_CASE: Record<string, string> = { minlength: 'minLength', maxlength: 'maxLength', readonly: 'readOnly', tabindex: 'tabIndex', autocomplete: 'autoComplete' };
const prop = (name: string, value: string) => {
  const key = name === 'class' ? 'className' : name.startsWith('data-') || name.startsWith('aria-') ? name : REACT_CASE[name] ?? camel(name);
  if (value === '') return key;
  if (/^-?\d+(\.\d+)?$/.test(value) || /^[{[]/.test(value)) return `${key}={${value}}`; // numbers and JSON objects
  return value.includes('"') ? `${key}={${JSON.stringify(value)}}` : `${key}="${value}"`;
};
function jsx(el: Element, names: Map<string, ReactName>, used: Set<ReactName>, depth: number): string {
  const pad = '  '.repeat(depth), tag = el.tagName.toLowerCase(), r = names.get(tag);
  if (r) used.add(r);
  const name = r?.name ?? tag, attrs = [...el.attributes].map((a) => ` ${prop(a.name, a.value)}`).join('');
  const kids = [...el.childNodes].flatMap((n) => {
    if (n.nodeType === 1) return [jsx(n as Element, names, used, depth + 1)];
    const t = n.textContent?.trim();
    return t ? [`${pad}  ${t}`] : [];
  });
  if (!kids.length) return `${pad}<${name}${attrs} />`;
  if (kids.length === 1 && !el.children.length) return `${pad}<${name}${attrs}>${kids[0].trim()}</${name}>`;
  return `${pad}<${name}${attrs}>\n${kids.join('\n')}\n${pad}</${name}>`;
}

export function toReact(markup: string, names: Map<string, ReactName>, folder: string) {
  if (REACT_DIFFERS.has(folder) || /data-part|\sslot=/.test(markup)) return null;
  const doc = new DOMParser().parseFromString(`<body>${markup}</body>`, 'text/html'), used = new Set<ReactName>();
  const roots = [...doc.body.children].map((el) => jsx(el, names, used, doc.body.children.length > 1 ? 1 : 0));
  const body = doc.body.children.length > 1 ? `<>\n${roots.join('\n')}\n</>` : roots.join('\n');
  return `${[...used].map(reactImport).join('\n')}\n\n${body}`;
}
