// The color engine off the main thread: generation (~300ms) and theme lint, which runs the same
// engine, so the panel and canvas stay responsive and the engine loads only here.
import { lintTheme } from '@massimo/ui-kit/tokens/themes/lint';
import { buildSpectrum } from './spectrum.ts';
import type { EngineRequest } from './engine.ts';

const post = (m: unknown) => (self as unknown as Worker).postMessage(m);

self.onmessage = ({ data }: MessageEvent<EngineRequest & { id: number }>) => {
  try {
    const result = data.kind === 'spectrum' ? buildSpectrum(data.settings, data.roles, data.anchors) : lintTheme(data.theme).findings;
    post({ id: data.id, result });
  } catch (err) { post({ id: data.id, error: String(err) }); }
};
