// Spectrum generation for the jig (~300ms per run, so the caller debounces).
import { generateSpectrum, resolveRoles, spectrumCSS, families, type Roles } from '@massimo/ui-kit/spectrum';
import type { SpectrumPayload } from '../protocol.ts';

export function buildSpectrum(settings: Record<string, unknown>, roles: Partial<Roles>) {
  const data = generateSpectrum(settings);
  const resolved = resolveRoles(data, roles);
  const f = families(data);
  const payload: SpectrumPayload = {
    css: spectrumCSS(data, resolved),
    roles: resolved,
    families: f.all.map((name) => ({
      name,
      light: data.schemes.light[name].map((s) => s.css),
      dark: data.schemes.dark[name].map((s) => s.css),
      lightText: data.schemes.light[name].map((s) => s.apca.css),
      darkText: data.schemes.dark[name].map((s) => s.apca.css),
    })),
  };
  return { payload, accents: f.accents, neutrals: f.all };
}
