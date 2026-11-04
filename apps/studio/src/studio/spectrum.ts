// Spectrum generation for the jig (~300ms per run, so the caller debounces).
import { anchoredSpectrum, generateSpectrum, resolveRoles, spectrumCSS, type ColorAnchor, spectrumDiagnostics, families, ramps, type Roles } from '@massimo/ui-kit/spectrum';
import type { SpectrumPayload } from '../protocol.ts';

export function buildSpectrum(settings: Record<string, unknown>, roles: Partial<Roles>, anchors: ColorAnchor[] = []) {
  const t0 = performance.now();
  const generated = generateSpectrum(settings);
  // Brand anchors (theme color.anchors): exact colors placed in their roles' ramps (an anchored role may
  // move to a free family, so the resolved roles come back from anchoredSpectrum).
  const { data, roles: resolved, solidSteps, report } = anchoredSpectrum(generated, resolveRoles(generated, roles), anchors);
  const ms = Math.round(performance.now() - t0);
  const f = families(data);
  const light = ramps(data, 'light'), dark = ramps(data, 'dark');
  const payload: SpectrumPayload = {
    // Applied to the whole jig (panel and canvas): :root, with .light/.dark on <html> forcing a scheme.
    css: spectrumCSS(data, resolved, ':root', solidSteps),
    anchors: report,
    diagnostics: spectrumDiagnostics(data, resolved),
    ms,
    contrast: {
      light: { page: data.settings.toneMax as number, targets: data.settings.targetsLight as number[] },
      dark: { page: data.settings.darkTone as number, targets: data.settings.targetsDark as number[] },
    },
    roles: resolved,
    families: f.all.map((name) => ({
      name,
      light: light[name],
      dark: dark[name],
      lightText: data.schemes.light[name].map((s) => s.apca.css),
      darkText: data.schemes.dark[name].map((s) => s.apca.css),
      lightTones: data.schemes.light[name].map((s) => s.hct[2]),
      darkTones: data.schemes.dark[name].map((s) => s.hct[2]),
    })),
  };
  return { payload, accents: f.accents, neutrals: f.all };
}
