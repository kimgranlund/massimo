// Install a happy-dom window as the global DOM for node:test.
import { Window } from 'happy-dom';

const win = new Window({ url: 'http://localhost/' });
const g = globalThis as any;
for (const k of ['window', 'document', 'HTMLElement', 'Element', 'Node', 'NodeFilter', 'customElements',
  'Event', 'KeyboardEvent', 'MouseEvent', 'InputEvent', 'ClipboardEvent', 'HTMLInputElement', 'HTMLFormElement'])
  if (!(k in g) || k === 'Event') g[k] = (win as any)[k];
g.window = win;

// happy-dom has no ElementInternals. This shim covers what UIFormElement uses so the
// unit tests exercise our logic; real form integration is checked in Chromium.
(win as any).HTMLElement.prototype.attachInternals = function (this: HTMLElement) {
  const host = this;
  let flags: Record<string, boolean> = {}, message = '';
  return {
    value: null as unknown,
    get form() { return host.closest('form'); },
    get labels() { return []; },
    get willValidate() { return true; },
    get validity() { return { ...flags, valid: !Object.values(flags).some(Boolean) }; },
    get validationMessage() { return message; },
    setFormValue(v: unknown) { this.value = v; },
    setValidity(f: Record<string, boolean>, m = '') { flags = f; message = m; },
    checkValidity() { const ok = this.validity.valid; if (!ok) host.dispatchEvent(new (win as any).Event('invalid')); return ok; },
    reportValidity() { return this.checkValidity(); },
  };
};

export const tick = () => new Promise((r) => setTimeout(r, 0));
