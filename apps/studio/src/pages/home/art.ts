// Placeholder photography for the Home page: inline SVG scenes painted from the live color ramps
// (no network, no fixed colors). A scene takes one family (its sky, ground and accents) plus an
// optional second family for the sun or the lights, so a hue or chroma change repaints every image.
import type { SpectrumPayload } from '../../protocol.ts';
import type { Roles } from '@massimo/ui-kit/tokens/colors/spectrum/roles';

export type Scene = 'dusk' | 'hills' | 'coast' | 'city' | 'dunes' | 'forest' | 'studio';
export type RoleKey = keyof Roles;

const svg = (body: string) =>
  `data:image/svg+xml,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" preserveAspectRatio="xMidYMid slice">${body}</svg>`)}`;

// Steps are 1-based like the ramps' names; light ramps keep scenes bright in both schemes.
function painter(s: SpectrumPayload, role: RoleKey, mode: 'light' | 'dark' = 'light') {
  const family = s.families.find((f) => f.name === s.roles[role]) ?? s.families[0];
  return (step: number) => family[mode][step - 1];
}

const round = (n: number) => Math.round(n * 10) / 10;
/** Repeatable terrain: smooth value noise over octaves, so a scene never changes between renders. */
function terrain(x: number, seed: number) {
  const point = (i: number) => { const v = Math.sin(i * 127.1 + seed * 311.7) * 43758.5453; return v - Math.floor(v); };
  const noise = (at: number) => { const i = Math.floor(at), t = at - i, e = t * t * (3 - 2 * t); return point(i) * (1 - e) + point(i + 1) * e; };
  return noise(x / 170) + 0.5 * noise(x / 70) + 0.22 * noise(x / 26) + 0.1 * noise(x / 11);
}
const ridgeLine = (base: number, height: number, seed: number) =>
  Array.from({ length: 83 }, (_, i) => `${i * 10 - 10} ${round(base - terrain(i * 10, seed) * height)}`);

/** The Landing's collection image: mountains at dusk. Primary is the sky and the far ridges, secondary the sun and its light, neutral the near ridges, shore and forest. */
function dusk(n: (step: number) => string, p: (step: number) => string, s: (step: number) => string) {
  const ridges = [[386, 92, 1, p(9)], [410, 104, 2, p(10)], [432, 96, 3, p(11)], [452, 78, 4, p(12)], [470, 54, 5, n(4)]] as const;
  const stars = Array.from({ length: 38 }, (_, i) => `<circle cx="${(i * 197) % 800}" cy="${(i * 83) % 190}" r="${i % 5 ? 0.8 : 1.4}"/>`).join('');
  const glitter = Array.from({ length: 14 }, (_, i) => {
    const y = 482 + i * 8, half = 16 + i * 7 + (i % 3) * 9;
    return `<rect x="${558 - half}" y="${y}" width="${half * 2}" height="${2 + i * 0.3}" rx="1.5"/>`;
  }).join('');
  const pines = Array.from({ length: 34 }, (_, i) => {
    const x = i * 25 - 10 + (i * 37) % 14, h = 60 + ((i * 61) % 74) + (i < 9 || i > 27 ? 54 : 0), base = 600, w = h * 0.2;
    const tiers = [0, 0.3, 0.55].map((t) => `M${x} ${round(base - h * (1 - t))}L${round(x + w * (0.5 + t))} ${round(base - h * (0.62 - t * 0.8))}H${round(x - w * (0.5 + t))}Z`).join('');
    return `<path d="${tiers}M${x - 2} ${round(base - h * 0.3)}h4V600h-4Z"/>`;
  }).join('');
  return `<defs>` +
    `<linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p(12)}"/><stop offset=".42" stop-color="${p(10)}"/><stop offset=".68" stop-color="${p(8)}"/><stop offset=".84" stop-color="${s(6)}"/></linearGradient>` +
    `<radialGradient id="halo"><stop offset="0" stop-color="${s(4)}" stop-opacity=".9"/><stop offset=".3" stop-color="${s(7)}" stop-opacity=".5"/><stop offset="1" stop-color="${s(8)}" stop-opacity="0"/></radialGradient>` +
    `<linearGradient id="sun" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s(3)}"/><stop offset="1" stop-color="${s(8)}"/></linearGradient>` +
    `<linearGradient id="mist" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${s(7)}" stop-opacity="0"/><stop offset="1" stop-color="${s(6)}" stop-opacity=".22"/></linearGradient>` +
    `<linearGradient id="lake" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p(8)}"/><stop offset=".45" stop-color="${p(10)}"/><stop offset="1" stop-color="${p(12)}"/></linearGradient>` +
    `<filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".85" numOctaves="2" seed="7"/><feColorMatrix values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .45 -.1"/></filter>` +
    `</defs>` +
    `<rect width="800" height="600" fill="url(#sky)"/>` +
    `<g fill="${p(3)}" opacity=".7">${stars}</g>` +
    `<circle cx="558" cy="246" r="240" fill="url(#halo)"/><circle cx="558" cy="246" r="62" fill="url(#sun)"/>` +
    ridges.map(([base, height, seed, color], i) => {
      const line = ridgeLine(base, height, seed);
      return `<path d="M${line.join('L')}V600H-10Z" fill="${color}"/>` +
        `<path d="M${line.join('L')}" fill="none" stroke="${s(5)}" stroke-width="${1.6 - i * 0.2}" stroke-opacity="${round(0.55 - i * 0.09)}"/>` +
        (i < 4 ? `<rect y="${base - 60}" width="800" height="${90}" fill="url(#mist)"/>` : '');
    }).join('') +
    `<rect y="470" width="800" height="130" fill="url(#lake)"/>` +
    `<g fill="${s(4)}" opacity=".78">${glitter}</g>` +
    `<path d="M-10 600V556C120 534 250 566 400 552S680 520 810 548V600Z" fill="${n(3)}"/>` +
    `<g fill="${n(1)}">${pines}</g>` +
    `<rect width="800" height="600" filter="url(#grain)" opacity=".1"/>`;
}

function paint(scene: Scene, c: (n: number) => string, a: (n: number) => string, n: (step: number) => string): string {
  const sky = (top: string, bottom: string) =>
    `<defs><linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient></defs><rect width="800" height="600" fill="url(#s)"/>`;
  switch (scene) {
    case 'dusk':
      return dusk(n, c, a);
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

/** A scene painted from a role's family (and an accent role), or '' before the ramps are ready. */
export function art(spectrum: SpectrumPayload | undefined, scene: Scene, role: RoleKey, accent: RoleKey = 'secondary'): string {
  if (!spectrum) return '';
  return svg(paint(scene, painter(spectrum, role), painter(spectrum, accent), painter(spectrum, 'neutral', 'dark')));
}
