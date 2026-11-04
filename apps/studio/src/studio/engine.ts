// The shell's handle on the color engine, which runs in spectrum.worker.ts. Types only from the engine
// modules, so the shell's bundle never holds them.
import type { Finding } from '@massimo/ui-kit/tokens/themes/lint';
import type { Theme } from '@massimo/ui-kit/tokens/themes/theme';
import type { ColorAnchor } from '@massimo/ui-kit/tokens/colors/spectrum/anchors';
import type { Roles } from '@massimo/ui-kit/tokens/colors/spectrum/roles';
import type { buildSpectrum } from './spectrum.ts';

export type EngineRequest =
  | { kind: 'spectrum'; settings: Record<string, unknown>; roles: Partial<Roles>; anchors: ColorAnchor[] }
  | { kind: 'lint'; theme: Theme };

type Pending = { resolve: (v: never) => void; reject: (e: unknown) => void };
const pending = new Map<number, Pending>();
let worker: Worker | undefined, nextId = 0;

function call<T>(request: EngineRequest): Promise<T> {
  if (!worker) {
    worker = new Worker(new URL('./spectrum.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = ({ data }) => {
      const p = pending.get(data.id);
      pending.delete(data.id);
      if (data.error) p?.reject(data.error); else p?.resolve(data.result as never);
    };
    worker.onerror = (e) => { for (const p of pending.values()) p.reject(e.message); pending.clear(); };
  }
  const id = nextId++;
  return new Promise<T>((resolve, reject) => {
    pending.set(id, { resolve: resolve as Pending['resolve'], reject });
    worker!.postMessage({ id, ...request });
  });
}

export const generateSpectrumOff = (settings: Record<string, unknown>, roles: Partial<Roles>, anchors: ColorAnchor[]) =>
  call<ReturnType<typeof buildSpectrum>>({ kind: 'spectrum', settings, roles, anchors });
export const lintThemeOff = (theme: Theme) => call<Finding[]>({ kind: 'lint', theme });
