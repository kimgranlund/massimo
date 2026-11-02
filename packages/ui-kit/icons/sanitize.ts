// Icons come from a CDN or a package, so treat the markup as untrusted: parse it as SVG and
// keep only drawing elements and presentation attributes. No scripts, event handlers,
// external references, <use>, <image>, <foreignObject> or <style>.

const ELEMENTS = new Set(['svg', 'g', 'path', 'circle', 'ellipse', 'line', 'polyline', 'polygon', 'rect', 'defs',
  'clippath', 'mask', 'lineargradient', 'radialgradient', 'stop', 'title', 'desc']);
const ATTRIBUTES = /^(viewbox|xmlns|fill|fill-rule|fill-opacity|stroke|stroke-[a-z]+|d|cx|cy|r|rx|ry|x|y|x1|x2|y1|y2|points|width|height|transform|opacity|clip-rule|clip-path|mask|id|offset|stop-color|stop-opacity|gradientunits|gradienttransform|vector-effect)$/i;
// Only local fragment references (url(#id)) may appear in attribute values.
const UNSAFE_VALUE = /javascript:|data:|url\(\s*(?!['"]?#)/i;

export function sanitizeSvg(markup: string): SVGSVGElement | null {
  const doc = new DOMParser().parseFromString(markup, 'image/svg+xml');
  const root = doc.documentElement;
  if (!root || root.localName !== 'svg' || doc.querySelector('parsererror')) return null;
  const walk = (el: Element) => {
    for (const child of [...el.children]) {
      if (!ELEMENTS.has(child.localName.toLowerCase())) child.remove();
      else walk(child);
    }
    for (const attr of [...el.attributes]) {
      if (!ATTRIBUTES.test(attr.name) || UNSAFE_VALUE.test(attr.value)) el.removeAttribute(attr.name);
    }
  };
  walk(root);
  // Size comes from CSS (the slot's --icon, or 1em).
  root.removeAttribute('width');
  root.removeAttribute('height');
  root.setAttribute('aria-hidden', 'true');
  root.setAttribute('focusable', 'false');
  return document.importNode(root, true) as unknown as SVGSVGElement;
}
