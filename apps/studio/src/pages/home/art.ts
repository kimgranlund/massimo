// Placeholder photography for the Home page: inline SVG scenes painted from the live Spectrum ramps
// (no network, no fixed colors). A scene takes one family (its sky, ground and accents) plus an
// optional second family for the sun or the lights, so a hue or chroma change repaints every image.
import type { SpectrumPayload } from '../../protocol.ts';
import type { Roles } from '@massimo/ui-kit/spectrum';

export type Scene = 'hills' | 'coast' | 'city' | 'dunes' | 'forest' | 'studio';
export type RoleKey = keyof Roles;

const svg = (body: string) =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">${body}</svg>`)}`;

// Steps are 1-based like the ramps' names; light ramps keep scenes bright in both schemes.
function painter(s: SpectrumPayload, role: RoleKey) {
  const family = s.families.find((f) => f.name === s.roles[role]) ?? s.families[0];
  return (step: number) => family.light[step - 1];
}

function paint(scene: Scene, c: (n: number) => string, a: (n: number) => string): string {
  const sky = (top: string, bottom: string) =>
    `<defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient></defs><rect width="800" height="600" fill="url(#s)"/>`;
  switch (scene) {
    case 'hills':
      return sky(c(4), a(3)) +
        `<circle cx="590" cy="190" r="70" fill="${a(9)}"/>` +
        `<path d="M0 360 C160 280 300 300 420 350 S680 300 800 330 V600 H0Z" fill="${c(7)}"/>` +
        `<path d="M0 430 C200 370 330 420 470 410 S700 380 800 400 V600 H0Z" fill="${c(9)}"/>` +
        `<path d="M0 500 C220 460 420 520 800 470 V600 H0Z" fill="${c(11)}"/>`;
    case 'coast':
      return sky(a(3), c(3)) +
        `<circle cx="220" cy="230" r="54" fill="${a(8)}"/>` +
        `<rect y="330" width="800" height="120" fill="${c(9)}"/>` +
        `<path d="M0 352 H800 M0 380 H800 M0 412 H800" stroke="${c(6)}" stroke-width="3" stroke-dasharray="40 26"/>` +
        `<path d="M0 450 C240 420 520 470 800 430 V600 H0Z" fill="${a(5)}"/>` +
        `<path d="M0 520 C300 490 520 540 800 505 V600 H0Z" fill="${a(7)}"/>`;
    case 'city':
      return sky(c(10), c(6)) +
        `<circle cx="640" cy="140" r="36" fill="${a(4)}"/>` +
        [[40, 300, 90], [150, 220, 70], [240, 260, 110], [370, 180, 80], [470, 280, 120], [610, 230, 90], [720, 300, 80]]
          .map(([x, y, w]) => `<rect x="${x}" y="${y}" width="${w}" height="${600 - y}" fill="${c(12)}"/>`).join('') +
        [[60, 330], [170, 250], [180, 300], [270, 290], [390, 210], [400, 260], [500, 310], [640, 260], [650, 340], [740, 330]]
          .map(([x, y]) => `<rect x="${x}" y="${y}" width="14" height="18" fill="${a(9)}"/>`).join('');
    case 'dunes':
      return sky(c(2), c(5)) +
        `<circle cx="400" cy="250" r="90" fill="${a(9)}"/>` +
        `<path d="M0 380 C180 300 300 360 450 330 S700 290 800 340 V600 H0Z" fill="${c(8)}"/>` +
        `<path d="M0 460 C200 400 380 470 560 420 S760 430 800 420 V600 H0Z" fill="${c(10)}"/>`;
    case 'forest':
      return sky(c(3), c(5)) +
        `<circle cx="160" cy="150" r="48" fill="${a(6)}"/>` +
        Array.from({ length: 11 }, (_, i) => {
          const x = i * 76 - 10, h = 200 + ((i * 53) % 140), base = 520;
          return `<path d="M${x} ${base} L${x + 44} ${base - h} L${x + 88} ${base}Z" fill="${c(i % 2 ? 10 : 11)}"/>`;
        }).join('') +
        `<rect y="510" width="800" height="90" fill="${c(12)}"/>`;
    case 'studio':
      return sky(c(3), c(4)) +
        `<rect x="0" y="420" width="800" height="180" fill="${c(5)}"/>` +
        `<rect x="250" y="180" width="300" height="250" rx="12" fill="${a(9)}"/>` +
        `<circle cx="400" cy="300" r="70" fill="${a(11)}"/>` +
        `<rect x="580" y="300" width="90" height="130" rx="8" fill="${c(9)}"/>` +
        `<ellipse cx="400" cy="436" rx="190" ry="14" fill="${c(7)}"/>`;
  }
}

/** A scene painted from a role's family (and an accent role), or '' before Spectrum is ready. */
export function art(spectrum: SpectrumPayload | undefined, scene: Scene, role: RoleKey, accent: RoleKey = 'secondary'): string {
  if (!spectrum) return '';
  return svg(paint(scene, painter(spectrum, role), painter(spectrum, accent)));
}
