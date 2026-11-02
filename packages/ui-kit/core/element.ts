// UIElement: light-DOM custom element with signal-backed properties.
// Subclasses must use `declare` for typed props (`declare label: string`),
// otherwise a class field shadows the reactive accessor.
import { signal, effect, type Signal } from './signals.ts';
import { render, type TemplateResult } from './template.ts';

export interface PropConfig {
  type?: StringConstructor | NumberConstructor | BooleanConstructor;
  default?: unknown;
  reflect?: boolean;
  attribute?: string;
}
type Props = Record<string, PropConfig>;

const attrOf = (k: string, c: PropConfig) => c.attribute ?? k.replace(/[A-Z]/g, m => '-' + m.toLowerCase());
const parse = (v: string | null, t?: PropConfig['type']) =>
  t === Boolean ? v !== null && v !== 'false' : t === Number ? (v === null ? null : +v) : v;

export class UIElement extends HTMLElement {
  static properties: Props = {};
  static get observedAttributes() {
    return Object.entries(this.properties).map(([k, c]) => attrOf(k, c));
  }

  /** Raw signals behind each declared property. */
  readonly $: Record<string, Signal<unknown>> = {};
  #stop?: () => void;

  constructor() {
    super();
    const self = this as any;
    for (const [k, c] of Object.entries((this.constructor as typeof UIElement).properties)) {
      // Keep a value assigned before upgrade (WHATWG upgrade-a-property).
      const pre = Object.hasOwn(this, k) ? self[k] : c.default;
      delete self[k];
      const s = (this.$[k] = signal(pre));
      const a = attrOf(k, c);
      Object.defineProperty(this, k, {
        get: () => s.value,
        set: (v) => {
          if (Object.is(s.peek(), v)) return; // also stops the reflect loop
          s.value = v;
          if (!c.reflect) return;
          if (c.type === Boolean) this.toggleAttribute(a, !!v);
          else if (v == null) this.removeAttribute(a);
          else this.setAttribute(a, String(v));
        },
      });
    }
  }

  attributeChangedCallback(name: string, _old: string | null, v: string | null) {
    for (const [k, c] of Object.entries((this.constructor as typeof UIElement).properties))
      if (attrOf(k, c) === name) (this as any)[k] = parse(v, c.type);
  }

  connectedCallback() {
    this.connected();
    this.#stop = effect(() => {
      const r = this.template();
      if (r) render(r, this);
      this.update();
    });
  }

  disconnectedCallback() {
    this.#stop?.();
    (this as any)._t?.parts.forEach((p: any) => p.fx?.());
    (this as any)._t = null;
    this.disconnected();
  }

  /** Return a template to own the element's children, or nothing to keep authored children. */
  template(): TemplateResult | void {}
  /** Runs once per connect, before the first render. */
  connected() {}
  /** Runs after every render; reads of props here are tracked. */
  update() {}
  disconnected() {}
}

export const define = (tag: string, cls: CustomElementConstructor) => {
  if (!customElements.get(tag)) customElements.define(tag, cls);
};
