// Spectrum generation for the jig (~300ms per run, so the caller debounces).
import { generateSpectrum, resolveRoles, spectrumCSS, spectrumDiagnostics, families, ramps, type Roles } from '@massimo/ui-kit/spectrum';
import type { SpectrumPayload } from '../protocol.ts';

export function buildSpectrum(settings: Record<string, unknown>, roles: Partial<Roles>) {
  const t0 = performance.now();
  const data = generateSpectrum(settings);
  const ms = Math.round(performance.now() - t0);
  const resolved = resolveRoles(data, roles);
  const f = families(data);
  const light = ramps(data, 'light'), dark = ramps(data, 'dark');
  const payload: SpectrumPayload = {
    css: spectrumCSS(data, resolved, '[data-canvas]'),
    diagnostics: spectrumDiagnostics(data, resolved),
    ms,
    roles: resolved,
    families: f.all.map((name) => ({
      name,
      light: light[name],
      dark: dark[name],
      lightText: data.schemes.light[name].map((s) => s.apca.css),
      darkText: data.schemes.dark[name].map((s) => s.apca.css),
    })),
  };
  return { payload, accents: f.accents, neutrals: f.all };
}
