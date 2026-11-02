// Install a happy-dom window as the global DOM for node:test.
import { Window } from 'happy-dom';

const win = new Window({ url: 'http://localhost/' });
const g = globalThis as any;
for (const k of ['window', 'document', 'HTMLElement', 'Element', 'Node', 'NodeFilter', 'customElements',
  'Event', 'KeyboardEvent', 'MouseEvent', 'HTMLInputElement', 'HTMLFormElement'])
  if (!(k in g) || k === 'Event') g[k] = (win as any)[k];
g.window = win;

export const tick = () => new Promise((r) => setTimeout(r, 0));
